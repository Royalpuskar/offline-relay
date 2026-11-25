// Pure, deterministic model of two disconnected clients and a versioned receiver.
export function initial(){return {online:false,next:1,server:{version:0,text:'Community lab opens at 09:00.'},clients:{A:{version:0},B:{version:0}},outbox:[],receipts:[],log:[]};}
function value(text){if(typeof text!=='string'||!text.trim()||text.length>2000)throw Error('Enter 1–2000 characters.');return text;}
function client(s,id){if(!Object.hasOwn(s.clients,id))throw Error('Unknown client.');return s.clients[id];}
function send(s,op){
 const fingerprint=JSON.stringify([op.client,op.base,op.text]);
 const prior=s.receipts.find(r=>r.id===op.id);
 if(prior){if(prior.fingerprint!==fingerprint)throw Error('Idempotency key reused with different content.');return {...prior.result,duplicate:true};}
 const result=op.base===s.server.version?{status:'applied',version:s.server.version+1}:{status:'conflict',version:s.server.version};
 if(result.status==='applied')s.server={version:result.version,text:op.text};
 s.receipts.push({id:op.id,fingerprint,result});return result;
}
export function act(input,event){
 const s=structuredClone(input);if(s.log.length>=500)throw Error('Experiment limit reached. Reset to continue.');
 let message;
 switch(event.type){
 case 'network': if(typeof event.online!=='boolean')throw Error('Network state must be boolean.');s.online=event.online;message=s.online?'Receiver connected':'Receiver disconnected';break;
 case 'queue': {const c=client(s,event.client);const text=value(event.text);if(s.outbox.some(o=>o.client===event.client&&['queued','conflict'].includes(o.status)))throw Error('Resolve this client’s outstanding change first.');const op={id:`op-${s.next++}`,client:event.client,base:c.version,text,status:'queued',delivery:'not-sent',attempts:0};s.outbox.push(op);message=`${op.id} queued from client ${event.client} at version ${c.version}`;break;}
 case 'deliver': {if(!s.online)throw Error('Reconnect before delivering.');if(event.dropResponse!==undefined&&typeof event.dropResponse!=='boolean')throw Error('Drop-response control must be boolean.');const op=s.outbox.find(o=>o.id===event.id);if(!op)throw Error('Unknown operation.');if(!['queued','applied','conflict'].includes(op.status))throw Error('Operation is superseded or discarded.');if(event.dropResponse&&op.delivery==='acknowledged')throw Error('A previously acknowledged delivery cannot become uncertain.');const result=send(s,op);op.attempts=(op.attempts??0)+1;if(event.dropResponse){op.delivery='unknown';message=`${op.id}: response lost; receiver outcome is unknown. Retry this same operation ID to recover its receipt`;}else{op.delivery='acknowledged';op.status=result.status;if(result.status==='applied')s.clients[op.client].version=Math.max(s.clients[op.client].version,result.version);message=`${op.id}: ${result.status}${result.duplicate?' (cached receipt; no second write)':''}`;}break;}
 case 'pull': {const c=client(s,event.client);if(!s.online)throw Error('Reconnect before pulling.');c.version=s.server.version;message=`Client ${event.client} now observes version ${c.version}`;break;}
 case 'resolve': {if(!s.online)throw Error('Reconnect before resolving.');const op=s.outbox.find(o=>o.id===event.id);if(!op||op.status!=='conflict')throw Error('Select a conflicted operation.');if(event.choice==='discard'){op.status='discarded';s.clients[op.client].version=s.server.version;message=`${op.id} discarded; receiver version retained`;}
 else if(event.choice==='rebase'){const text=value(event.text);op.status='superseded';const replacement={id:`op-${s.next++}`,client:op.client,base:s.server.version,text,status:'queued',delivery:'not-sent',attempts:0};s.outbox.push(replacement);message=`${op.id} superseded by ${replacement.id}; reviewed content queued against version ${s.server.version}`;}
 else throw Error('Choose discard or rebase.');break;}
 default:throw Error('Unknown action.');}
 s.log.push({step:s.log.length+1,event:structuredClone(event),message});return s;
}

