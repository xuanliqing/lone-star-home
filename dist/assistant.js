'use strict';
// Local Spine 3.8 model; keep its camera fixed while the pose changes.
(() => {
 const root=document.querySelector('#home-assistant'),canvas=document.querySelector('#assistant-canvas');
 const fallback=document.querySelector('#assistant-fallback'),status=document.querySelector('#assistant-status');
 const interactButtons=[...document.querySelectorAll('[data-action="assistant-interact"]')];
 const motionButton=document.querySelector('[data-action="assistant-motion"]');
 const sceneButton=document.querySelector('[data-action="assistant-scene"]');
 const art=document.querySelector('.assistant-art');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let preferences={visible:true,motion:true,scene:true},loading=null,loaded=false,failed=false;
 let gl,shader,batcher,renderer,matrix,skeleton,animation,atlas,texture,scene;
 let sceneTime=0;
 let hiddenSlots=[],frame=0,lastTime=null,nextPaint=null,playing=false;
 const frameInterval=1000/60;
 const camera={x:-325,y:310,width:1050,height:1400};
 const isPaused=()=>!preferences.visible||!preferences.motion||reduced.matches||document.hidden||
  !!document.querySelector('dialog[open]')||document.body.classList.contains('scenery-only')||
  !!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');

 function controls(){
  root.hidden=!preferences.visible;
  root.dataset.scene=String(preferences.scene);
  const canMove=preferences.motion&&!reduced.matches;
  interactButtons.forEach(button=>button.disabled=!loaded||!canMove);
  motionButton.setAttribute('aria-pressed',String(canMove));
  motionButton.setAttribute('aria-label',canMove?'暂停立绘动作':'开启立绘动作');
  motionButton.title=reduced.matches?'系统已开启减少动态效果':canMove?'暂停立绘动作':'开启立绘动作';
  motionButton.textContent=canMove?'Ⅱ':'▷';
  sceneButton.setAttribute('aria-pressed',String(preferences.scene));
  sceneButton.setAttribute('aria-label',preferences.scene?'隐藏皮肤背景与动效':'显示皮肤背景与动效');
  sceneButton.title=preferences.scene?'隐藏皮肤背景与动效':'显示皮肤背景与动效';
 }
 function suppressScenery(){
  // Keep the model's original scenery and animation unless the user selects
  // the isolated character view. All layers share the same animation clock.
  if(!preferences.scene)hiddenSlots.forEach(slot=>slot.setAttachment(null));
 }
 function resize(){
  if(!loaded)return;
  const rect=canvas.getBoundingClientRect(),anchor=art.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
  if(!anchor.width||!anchor.height)return;
  const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  gl.viewport(0,0,width,height);
  // Expand the drawing area for the scenery, without zooming or moving Amiya.
  const scale=Math.max(camera.width/anchor.width,camera.height/anchor.height);
  const x=camera.x+camera.width/2+(rect.left-anchor.left-anchor.width/2)*scale;
  const y=camera.y+camera.height/2+(anchor.top+anchor.height/2-rect.bottom)*scale;
  matrix.ortho2d(x,y,rect.width*scale,rect.height*scale);
  draw();
 }
 function draw(){
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  if(preferences.scene&&scene){const entry=animation.getCurrent(0);scene.draw(matrix.values,entry.animation.name,entry.getAnimationTime(),sceneTime);}
  shader.bind();shader.setUniformi(spine.webgl.Shader.SAMPLER,0);
  shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX,matrix.values);
  batcher.begin(shader);renderer.draw(batcher,skeleton);batcher.end();shader.unbind();
 }
 function tick(time){
  frame=0;if(isPaused()){lastTime=null;nextPaint=null;return;}
  if(nextPaint===null)nextPaint=time;
  // Carry the deadline forward so rounded 60 Hz timestamps don't skip every
  // other frame. On faster displays, keep a steady 60 fps without speeding up.
  if(time+.5>=nextPaint){
   const delta=lastTime===null?0:Math.min((time-lastTime)/1000,.1);
   nextPaint+=(Math.floor(Math.max(0,time-nextPaint)/frameInterval)+1)*frameInterval;
   lastTime=time;sceneTime+=delta;animation.update(delta);animation.apply(skeleton);
   suppressScenery();skeleton.updateWorldTransform();draw();
   canvas.dataset.animation=animation.getCurrent(0)?.animation.name||'Idle';
  }
  frame=requestAnimationFrame(tick);
 }
 function sync(){
  controls();if(!loaded)return;
  const paused=isPaused();root.dataset.paused=String(paused);
  if(paused){cancelAnimationFrame(frame);frame=0;lastTime=null;nextPaint=null;}
  else if(!frame){lastTime=null;nextPaint=null;frame=requestAnimationFrame(tick);}
 }
 function dispose(){
  cancelAnimationFrame(frame);frame=0;loaded=false;
  batcher?.dispose();shader?.dispose();texture?.dispose();scene?.dispose();scene=null;
 }
 function showFallback(){
  canvas.hidden=true;if(!fallback.getAttribute('src'))fallback.src=fallback.dataset.src;fallback.hidden=false;
 }
 async function load(){
  if(loading||loaded)return loading;
  loading=(async()=>{
   status.hidden=false;status.textContent='阿米娅立绘载入中…';
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
   try{
    if(!window.spine)throw Error('Spine runtime unavailable');
    gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,powerPreference:'low-power'});
    if(!gl)throw Error('WebGL unavailable');
    const fetchAsset=async name=>{const response=await fetch('assets/amiya/'+name,{signal:controller.signal});if(!response.ok)throw Error('Missing illustration asset');return response;};
    const [atlasText,binary,imageBlob]=await Promise.all([
     fetchAsset('amiya.atlas').then(r=>r.text()),fetchAsset('amiya.skel').then(r=>r.arrayBuffer()),fetchAsset('amiya.png').then(r=>r.blob())
    ]);
    const image=new Image(),url=URL.createObjectURL(imageBlob);
    try{image.src=url;await image.decode();}finally{URL.revokeObjectURL(url);}
    // This game atlas already contains premultiplied RGB. Preserve its pixels
    // on upload and use PMA blending through to the browser compositor.
    // Multiplying alpha again darkens the feathered mesh/attachment seams.
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    texture=new spine.webgl.GLTexture(gl,image);
    atlas=new spine.TextureAtlas(atlasText,()=>texture);
    const data=new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(atlas)).readSkeletonData(new Uint8Array(binary));
    skeleton=new spine.Skeleton(data);
    // These two C_ slots are detached lighting planes from the original scene.
    hiddenSlots=skeleton.slots.filter(slot=>!/^(C_|Violin_)/.test(slot.data.name)||/^C_Light_[BC]$/.test(slot.data.name));
    const animationData=new spine.AnimationStateData(data);animationData.defaultMix=.28;
    animation=new spine.AnimationState(animationData);
    animation.setAnimation(0,'Idle',true);animation.apply(skeleton);suppressScenery();skeleton.updateWorldTransform();
    animation.addListener({complete:entry=>{if(entry.animation.name!=='Idle'){playing=false;root.classList.remove('interacting');}}});
    shader=spine.webgl.Shader.newTwoColoredTextured(gl);batcher=new spine.webgl.PolygonBatcher(gl);
    renderer=new spine.webgl.SkeletonRenderer(gl);renderer.premultipliedAlpha=true;matrix=new spine.webgl.Matrix4();
    scene=await AmiyaScene.create(gl,controller.signal);root.dataset.sceneryLoaded='true';
    loaded=true;failed=false;root.dataset.loaded='true';canvas.dataset.animation='Idle';
    fallback.hidden=true;canvas.hidden=false;status.hidden=true;resize();sync();
   }catch(error){
    dispose();failed=true;root.dataset.loaded='false';showFallback();
    status.textContent=location.protocol==='file:'?'通过预览服务打开可播放动态立绘，当前显示静态立绘':'动态立绘暂不可用，已显示静态立绘';console.warn('Assistant illustration:',error.message);
    controls();
   }finally{clearTimeout(timeout);loading=null;}
  })();
  return loading;
 }
 window.homeAssistant={
  configure(options){
   const next={scene:true,...options},sceneChanged=next.scene!==preferences.scene;
   preferences=next;sync();
   if(sceneChanged&&loaded){
    // Restore attachments removed by the isolated view, including those that
    // don't have attachment keys in the active animation. Keep its playhead.
    skeleton.setSlotsToSetupPose();animation.apply(skeleton);suppressScenery();
    skeleton.updateWorldTransform();resize();
   }
   if(options.visible&&!loaded&&!failed)load();
  },
  interact(){
   if(!loaded||isPaused()||playing)return false;
   playing=true;root.classList.add('interacting');
   animation.setAnimation(0,'Interact',false);animation.addAnimation(0,'Idle',true,0);sync();return true;
  }
 };
 new ResizeObserver(resize).observe(canvas);
 new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class']});
 document.addEventListener('visibilitychange',sync);document.addEventListener('focusin',sync);document.addEventListener('focusout',()=>queueMicrotask(sync));
 reduced.addEventListener('change',sync);
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;loaded=false;showFallback();controls();});
 canvas.addEventListener('webglcontextrestored',()=>{failed=false;load();});
})();
