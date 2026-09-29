import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const model=source.slice(0,source.indexOf('let state=defaults()'));
const sandbox={URL,crypto:{randomUUID:()=> 'unique-test-id'},matchMedia:()=>({matches:false})};
vm.createContext(sandbox);
vm.runInContext(`${model}\nthis.api={defaults,validate,safeURL,esc};`,sandbox);
const {defaults,validate,safeURL,esc}=sandbox.api;

// Existing v1 backups must retain user content while gaining the two services.
const legacy=defaults();delete legacy.services;
legacy.note='A note to preserve';legacy.todos=[{id:'task-1',text:'A task',done:false}];
legacy.links[0].name='Personal repository';legacy.links[0].url='https://example.com/project';
const upgraded=validate(legacy);
assert.equal(upgraded.note,legacy.note);assert.equal(upgraded.todos[0].text,'A task');
assert.equal(upgraded.links[0].url,legacy.links[0].url);
assert.equal(upgraded.services.mail.url,'https://mail.google.com/');
assert.equal(upgraded.services.translate.url,'https://translate.google.com/');

// User-defined destinations and labels must survive export/import and reload.
const custom=defaults();
custom.services.mail={name:'Work mail',label:'工作邮箱',url:'outlook.live.com/mail/0/'};
custom.services.translate={name:'Dictionary',label:'词典',url:'https://example.com/dictionary?q=hello#entry'};
custom.links[0].label='项目';custom.links[2].name='Video archive';
const normalized=validate(custom),roundTrip=validate(JSON.parse(JSON.stringify(normalized)));
assert.equal(roundTrip.services.mail.url,'https://outlook.live.com/mail/0/');
assert.equal(roundTrip.services.translate.url,custom.services.translate.url);
assert.equal(roundTrip.links[0].label,'项目');assert.equal(roundTrip.links[2].name,'Video archive');

// Reject executable URLs and embedded credentials without invalidating other data.
for(const bad of ['javascript:alert(1)','data:text/html,test','file:///test','https://user:password@example.com/','https://example.com/a b','https://example.com/'+ 'x'.repeat(2000)]){
 assert.equal(safeURL(bad),null);
 const incoming=defaults();incoming.services.mail.url=bad;
 assert.equal(validate(incoming).services.mail.url,'https://mail.google.com/');
}
const malformed=defaults();malformed.services={mail:{name:'',url:'https://example.com'},unexpected:{name:'Extra',url:'https://example.com'}};
assert.equal(Object.keys(validate(malformed).services).length,2);
assert.equal(validate(malformed).services.mail.name,'Gmail');
const long=defaults();long.services.mail.name='n'.repeat(50);long.services.mail.label='标'.repeat(30);
assert.equal(validate(long).services.mail.name.length,24);assert.equal(validate(long).services.mail.label.length,8);
assert.equal(esc('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.equal(defaults().services.mail.name,'Gmail');

// A sibling tab update should refresh destinations without overwriting a note.
const sync=source.slice(source.indexOf('function syncSavedShortcuts(raw)'),source.indexOf("addEventListener('storage'"));
assert.ok(sync.includes('renderServices'));
vm.runInContext(`let state=defaults();state.note='Unsaved local note';let serviceRenders=0;function renderLinks(){}function renderServices(){serviceRenders++;}${sync}\nthis.synchronize=syncSavedShortcuts;this.snapshot=()=>({state,serviceRenders});`,sandbox);
sandbox.synchronize(JSON.stringify(normalized));
assert.equal(sandbox.snapshot().state.services.mail.url,'https://outlook.live.com/mail/0/');
assert.equal(sandbox.snapshot().state.note,'Unsaved local note');
assert.equal(sandbox.snapshot().serviceRenders,1);
sandbox.synchronize(JSON.stringify(normalized));sandbox.synchronize('invalid json');
assert.equal(sandbox.snapshot().serviceRenders,1);
console.log('PASS: legacy migration, custom destinations backup round-trip, URL safety, text limits, escaping and cross-tab updates.');
