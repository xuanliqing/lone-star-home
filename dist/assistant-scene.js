'use strict';
// The skin's Unity scenery is a separate asset from its Spine illustration.
// Meshes, textures, transforms and animation curves are exported unchanged.
// Unity particle/shader features are adapted to WebGL below, without a second RAF.
window.AmiyaScene = (() => {
 const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
 const multiply=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;};
 function matrix(p,q,s){
  let[x,y,z,w]=q;const n=Math.hypot(x,y,z,w)||1;x/=n;y/=n;z/=n;w/=n;
  return new Float32Array([(1-2*y*y-2*z*z)*s[0],(2*x*y+2*w*z)*s[0],(2*x*z-2*w*y)*s[0],0,
   (2*x*y-2*w*z)*s[1],(1-2*x*x-2*z*z)*s[1],(2*y*z+2*w*x)*s[1],0,
   (2*x*z+2*w*y)*s[2],(2*y*z-2*w*x)*s[2],(1-2*x*x-2*y*y)*s[2],0,...p,1]);
 }
 function sample(keys,t){
  if(!keys?.length)return 0;let k=keys[0];for(const next of keys){if(next[0]>t)break;k=next;}
  const dt=Math.max(0,t-k[0]);return ((k[1]*dt+k[2])*dt+k[3])*dt+k[4];
 }
 function euler(v){
  const[x,y,z]=v.map(a=>a*Math.PI/360),sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
  return [cy*sx*cz+sy*cx*sz,sy*cx*cz-cy*sx*sz,cy*cx*sz-sy*sx*cz,cy*cx*cz+sy*sx*sz];
 }
 function curve(c,t,r=.5){
  if(!c)return 0;const state=c.minMaxState;
  const at=keys=>{
   if(!keys?.length)return 1;let a=keys[0],b=a;
   for(const k of keys){b=k;if(k.time>=t)break;a=k;}
   const dt=b.time-a.time;if(dt<=0)return a.value;
   const f=Math.max(0,Math.min(1,(t-a.time)/dt)),f2=f*f,f3=f2*f;
   return (2*f3-3*f2+1)*a.value+(f3-2*f2+f)*dt*a.outSlope+(-2*f3+3*f2)*b.value+(f3-f2)*dt*b.inSlope;
  };
  if(state===0)return c.scalar;
  if(state===3)return c.minScalar+(c.scalar-c.minScalar)*r;
  const hi=c.scalar*at(c.maxCurve?.m_Curve);
  return state===2?(c.minScalar*at(c.minCurve?.m_Curve))*(1-r)+hi*r:hi;
 }
 const random=(n)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 const rgba=c=>[c.r,c.g,c.b,c.a];
 function gradient(g,t){
  const result=[1,1,1,1];
  for(let c=0;c<4;c++){
   const prefix=c===3?'atime':'ctime',count=c===3?g.m_NumAlphaKeys:g.m_NumColorKeys;let a=0,b=0;
   for(let k=0;k<count;k++){b=k;if(g[prefix+k]/65535>=t)break;a=k;}
   const ta=g[prefix+a]/65535,tb=g[prefix+b]/65535,f=tb>ta?Math.min(1,Math.max(0,(t-ta)/(tb-ta))):0;
   result[c]=rgba(g['key'+a])[c]*(1-f)+rgba(g['key'+b])[c]*f;
  }return result;
 }
 function color(g,t,r=.5){
  if(!g)return [1,1,1,1];
  if(g.minMaxState===1)return gradient(g.maxGradient,t);
  if(g.minMaxState===2)return rgba(g.minColor).map((v,i)=>v*(1-r)+rgba(g.maxColor)[i]*r);
  return rgba(g.maxColor);
 }
 const vertex=`attribute vec3 a_position;attribute vec2 a_uv;attribute vec4 a_color;
 uniform mat4 u_projection,u_model;varying vec2 v_uv;varying vec4 v_color;
 void main(){vec4 p=u_model*vec4(a_position,1.);gl_Position=u_projection*vec4(p.xy*100.,0.,1.);v_uv=a_uv;v_color=a_color;}`;
 const fragment=`precision mediump float;varying vec2 v_uv;varying vec4 v_color;
 uniform sampler2D u_main,u_noise,u_dissolve,u_weight;
 uniform vec4 u_mainST,u_noiseST,u_dissolveST,u_tint;
 uniform vec2 u_mainSpeed,u_noiseSpeed,u_dissolveSpeed,u_intensity;
 uniform float u_time,u_hasMain,u_hasNoise,u_hasDissolve,u_hasWeight,u_amount,u_border,u_opacity;
 vec4 tex(sampler2D s,vec2 uv){return texture2D(s,vec2(uv.x,1.-uv.y));}
 void main(){vec2 nu=v_uv*u_noiseST.xy+u_noiseST.zw+u_noiseSpeed*u_time;
 vec2 wave=u_hasNoise>.5?tex(u_noise,nu).rg*2.-1.:vec2(sin(nu.x*13.+nu.y*27.),cos(nu.y*19.-nu.x*17.));
 float weight=u_hasWeight>.5?tex(u_weight,v_uv).r:1.;vec2 delta=wave*u_intensity*weight;
 vec4 c=u_hasMain>.5?tex(u_main,v_uv*u_mainST.xy+u_mainST.zw+u_mainSpeed*u_time+delta):vec4(vec3(1.),pow(max(0.,1.-length(v_uv-.5)*2.),2.));
 float dissolve=1.;if(u_hasDissolve>.5){float d=tex(u_dissolve,v_uv*u_dissolveST.xy+u_dissolveST.zw+u_dissolveSpeed*u_time).r;
 dissolve=clamp((d-u_amount)/max(.001,u_border),0.,1.);}
 float a=clamp(c.a*u_tint.a*2.*v_color.a*u_opacity*dissolve,0.,1.);
 gl_FragColor=vec4(c.rgb*u_tint.rgb*2.*v_color.rgb*a,a);}`;
 async function create(gl,signal){
  const base='assets/amiya/scene/',response=await fetch(base+'scene.json',{signal});if(!response.ok)throw Error('Missing scenery data');
  const data=await response.json(),program=gl.createProgram(),shaders=[];
  for(const[type,source]of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
   const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
   if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(program,s);shaders.push(s);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  const uniforms=Object.fromEntries(['projection','model','main','noise','dissolve','weight','mainST','noiseST','dissolveST','tint','mainSpeed','noiseSpeed','dissolveSpeed','intensity','time','hasMain','hasNoise','hasDissolve','hasWeight','amount','border','opacity'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
  const attributes=['position','uv','color'].map(n=>gl.getAttribLocation(program,'a_'+n));
  const textureFiles=[...new Set(Object.values(data.materials).flatMap(m=>Object.values(m.textures).map(t=>t.file)))],textures={};
  await Promise.all(textureFiles.map(async file=>{
   const res=await fetch(base+encodeURIComponent(file),{signal});if(!res.ok)throw Error('Missing scenery texture');
   const image=new Image(),url=URL.createObjectURL(await res.blob());
   try{image.src=url;await image.decode();const tex=gl.createTexture();textures[file]=tex;gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
   }finally{URL.revokeObjectURL(url);}
  }));
  const fallback=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,fallback);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([127,127,127,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  const meshBuffers={};
  for(const[id,m]of Object.entries(data.meshes)){
   const vertices=[];for(const i of m.indices)vertices.push(...m.vertices[i],...m.uv[i].slice(0,2),...(m.colors?.[i]||[1,1,1,1]));
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);meshBuffers[id]={buffer,count:m.indices.length};
  }
  const dynamic=gl.createBuffer(),particles=new Float32Array(128*600*9),idMatrix=identity();
  const draws=data.renderers.sort((a,b)=>a.order-b.order),pose=data.nodes.map(n=>({...n}));let worlds=[],enabled=[];
  const nodeMaterials=Object.fromEntries(draws.map(r=>[r.node,data.materials[r.material]]));
  function world(i){if(worlds[i])return worlds[i];const n=pose[i],m=matrix(n.p,n.q,n.s);worlds[i]=n.parent<0?m:multiply(world(n.parent),m);enabled[i]=n.active&&(n.parent<0||enabled[n.parent]);return worlds[i];}
  function bind(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let i=0;i<3;i++){gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],[3,2,4][i],gl.FLOAT,false,36,[0,12,20][i]);}}
  function material(m,time,overrides){
   const f={...m.floats,...overrides};gl.uniform4fv(uniforms.tint,overrides._MainColor||overrides._TintColor||m.colors._MainColor||m.colors._TintColor||[.5,.5,.5,.5]);
   for(const[name,unit,key]of [['main',0,'_MainTex'],['noise',1,'_DisturbTex'],['dissolve',2,'_DissolveTex'],['weight',3,'_WeightTex']]){
    const t=m.textures[key];gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t?textures[t.file]:fallback);gl.uniform1i(uniforms[name],unit);
    gl.uniform1f(uniforms['has'+name[0].toUpperCase()+name.slice(1)],t?1:0);
    if(name!=='weight')gl.uniform4fv(uniforms[name+'ST'],t?[...t.scale,...t.offset]:[1,1,0,0]);
   }
   gl.uniform2f(uniforms.mainSpeed,f._MainUSpeed||0,f._MainVSpeed||0);gl.uniform2f(uniforms.noiseSpeed,f._DisturbUSpeed||0,f._DisturbVSpeed||0);
   gl.uniform2f(uniforms.dissolveSpeed,f._DissolveUSpeed||0,f._DissolveVSpeed||0);gl.uniform2f(uniforms.intensity,f._IntensityU||0,f._IntensityV||0);
   gl.uniform1f(uniforms.amount,f._Amount||0);gl.uniform1f(uniforms.border,f._BorderWidth||.01);gl.uniform1f(uniforms.opacity,f._Opacity??1);gl.uniform1f(uniforms.time,time);
   const additive=f._DstBlend===1||(!m.colors._MainColor&&m.opaque);
   gl.blendFunc(gl.ONE,additive?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);
  }
  function particleDraw(r,time){
   const p=r.particles,init=p.InitialModule,em=p.EmissionModule,shape=p.ShapeModule,rate=curve(em.rateOverTime,0),lifeMax=curve(init.startLifetime,0,.9);
   const bursts=(em.m_Bursts||[]).reduce((n,b)=>n+curve(b.countCurve,0),0);
   const count=Math.min(128,init.maxNumParticles,Math.ceil(rate*lifeMax)||bursts);let used=0;
   const geometry=data.meshes[r.mesh||'quad'];
   for(let i=0;i<count;i++){
    const seed=r.node*133+i*17,rand=random(seed),life=Math.max(.01,curve(init.startLifetime,0,rand));
    const age=(time+random(seed+1)*life)%life,t=age/life;
    let x=0,y=0,z=0;if(shape.enabled){
     const angle=random(seed+2)*Math.PI*2,radius=shape.radius.value*(shape.type===10?Math.sqrt(random(seed+3)):1);
     if(shape.type===5||shape.type===10){x=Math.cos(angle)*radius;y=Math.sin(angle)*radius;}
     else if(shape.type===8){x=(random(seed+2)-.5)*shape.m_Scale.x;y=(random(seed+3)-.5)*shape.m_Scale.y;z=(random(seed+4)-.5)*shape.m_Scale.z;}
     x+=shape.m_Position.x;y+=shape.m_Position.y;z+=shape.m_Position.z;
    }
    const sizeMod=p.SizeModule,s=curve(init.startSize,0,rand)*(sizeMod?.enabled?curve(sizeMod.curve,t,rand):1);
    const sx=s,sy=init.size3D?curve(init.startSizeY,0,rand)*(sizeMod?.enabled?curve(sizeMod.y||sizeMod.curve,t,rand):1):s;
    const rot=curve(init.startRotation,0,rand)+(p.RotationModule?.enabled?curve(p.RotationModule.curve,t,rand)*age:0),cos=Math.cos(rot),sin=Math.sin(rot);
    let c=color(init.startColor,0,rand);if(p.ColorModule?.enabled){const lifeColor=color(p.ColorModule.gradient,t,rand);c=c.map((v,k)=>v*lifeColor[k]);}
    const velocity=p.VelocityModule;if(velocity?.enabled){x+=curve(velocity.x,t,rand)*age;y+=curve(velocity.y,t,rand)*age;z+=curve(velocity.z,t,rand)*age;}
    const speed=curve(init.startSpeed,0,rand);y+=speed*age;
    const m=world(r.node);
    for(const vi of geometry.indices){const[cx,cy,cz]=geometry.vertices[vi],[u,v]=geometry.uv[vi];
     const px=x+(cx*sx*cos-cy*sy*sin),py=y+(cx*sx*sin+cy*sy*cos),pz=z+cz*s;
     particles[used++]=m[0]*px+m[4]*py+m[8]*pz+m[12];particles[used++]=m[1]*px+m[5]*py+m[9]*pz+m[13];particles[used++]=0;
     particles[used++]=u;particles[used++]=v;for(const cc of c)particles[used++]=cc;
    }
   }
   gl.uniformMatrix4fv(uniforms.model,false,idMatrix);bind(dynamic);gl.bufferData(gl.ARRAY_BUFFER,particles.subarray(0,used),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,used/9);
  }
  return {
   draw(projection,action,actionTime,time){
    for(let i=0;i<pose.length;i++)Object.assign(pose[i],data.nodes[i],{material:{}});
    for(const clip of data.animations[action]||data.animations.Idle){const t=action==='Idle'?actionTime%clip.duration:Math.min(actionTime,clip.duration);
     for(const b of clip.bindings){const v=b.curves.map(c=>sample(c,t)),n=pose[b.node];
      if(b.kind==='active')n.active=v[0]>.5;else if(b.kind==='e')n.q=euler(v);else if(['p','q','s'].includes(b.kind))n[b.kind]=v;
      else if(b.kind==='material'){
       if(b.component>=0&&b.component<4){n.material[b.property]??=[...(nodeMaterials[b.node]?.colors[b.property]||[.5,.5,.5,.5])];n.material[b.property][b.component]=v[0];}
       else n.material[b.property]=v[0];
      }
     }
    }
    worlds=[];enabled=[];gl.useProgram(program);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.uniformMatrix4fv(uniforms.projection,false,projection);
    for(const r of draws){const m=world(r.node);if(!enabled[r.node])continue;material(data.materials[r.material],time,pose[r.node].material);
     if(r.particles)particleDraw(r,time);else{const mesh=meshBuffers[r.mesh];gl.uniformMatrix4fv(uniforms.model,false,m);bind(mesh.buffer);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
    }
    for(const a of attributes)gl.disableVertexAttribArray(a);gl.activeTexture(gl.TEXTURE0);gl.useProgram(null);
   },
   dispose(){for(const t of Object.values(textures))gl.deleteTexture(t);gl.deleteTexture(fallback);for(const m of Object.values(meshBuffers))gl.deleteBuffer(m.buffer);gl.deleteBuffer(dynamic);for(const s of shaders)gl.deleteShader(s);gl.deleteProgram(program);}
  };
 }
 return {create};
})();
