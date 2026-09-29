import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../dist/assets/amiya/scene/',import.meta.url);
const data=JSON.parse(await readFile(new URL('scene.json',root),'utf8'));
assert.ok(data.renderers.some(r=>r.name==='bg_01'));
assert.ok(data.renderers.some(r=>r.name.startsWith('bird_')));
assert.equal(data.animations.Idle.length,5);
assert.equal(data.animations.Interact.length,5);
for(const mesh of Object.values(data.meshes)){
 assert.equal(mesh.vertices.length,mesh.uv.length);
 assert.ok(mesh.indices.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.vertices.length));
 assert.ok((mesh.colors||[]).flat().every(c=>c>=0&&c<=1),'Unity byte colors must be normalized before GPU upload');
}
for(const m of Object.values(data.materials))for(const texture of Object.values(m.textures)){
 const bytes=await readFile(new URL(encodeURIComponent(texture.file),root));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 for(const offset of [16,20]){const size=bytes.readUInt32BE(offset);assert.equal(size&(size-1),0,'Repeat textures must be power of two in WebGL 1');}
}
let draws=0,uploads=0;
const finite=values=>assert.ok(Array.from(values).every(Number.isFinite),'Non-finite animation/particle data sent to GPU');
const gl=new Proxy({
 getShaderParameter:()=>true,getProgramParameter:()=>true,
 getAttribLocation:(_,name)=>['a_position','a_uv','a_color'].indexOf(name),
 getUniformLocation:(_,name)=>name,
 bufferData(_,values){finite(values);uploads++;},
 uniformMatrix4fv(_,__,values){finite(values);},uniform4fv(_,values){finite(values);},
 uniform1f(_,v){finite([v]);},uniform2f(_,a,b){finite([a,b]);},
 drawArrays(_,__,count){assert.ok(Number.isInteger(count)&&count>=0);draws++;}
},{get(target,key){if(key in target)return target[key];if(String(key).toUpperCase()===key)return 1;return()=>({});}});
const context={window:{},console,Float32Array,Uint8Array,Math,encodeURIComponent,
 URL:{createObjectURL:()=>'',revokeObjectURL(){}},
 Image:class{async decode(){}},fetch:async url=>({ok:true,json:async()=>data,blob:async()=>({})})};
vm.createContext(context);vm.runInContext(await readFile(new URL('../dist/assistant-scene.js',import.meta.url),'utf8'),context);
const scene=await context.window.AmiyaScene.create(gl);
const matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
for(const [action,duration]of [['Idle',5.333],['Interact',18]])for(let t=0;t<duration;t+=.25)scene.draw(matrix,action,t,30+t);
assert.ok(draws>1000&&uploads>1000);scene.dispose();
console.log(`PASS: scenery assets, normalized colors, clip bindings and finite GPU data across both actions (${draws} draws).`);
