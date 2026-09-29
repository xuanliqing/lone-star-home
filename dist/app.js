'use strict';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='lone-star-home-v1';
const ENGINES={bing:{name:'Bing',url:'https://www.bing.com/search',param:'q'},google:{name:'Google',url:'https://www.google.com/search',param:'q'},baidu:{name:'百度',url:'https://www.baidu.com/s',param:'wd'},duckduckgo:{name:'DuckDuckGo',url:'https://duckduckgo.com/',param:'q'}};
const CATEGORIES={work:'工作',learn:'学习',life:'生活'};
const ICONS={operator:'星环',code:'代码',book:'阅读',play:'影音',squad:'连接',mission:'方格'};
const SERVICE_DEFAULTS={mail:{name:'Gmail',label:'谷歌邮箱',url:'https://mail.google.com/'},translate:{name:'Translate',label:'谷歌翻译',url:'https://translate.google.com/'}};
const DEFAULTS={version:1,shortcutRevision:1,settings:{name:'博士',engine:'bing',background:'day',autoTheme:true,assistant:true,assistantMotion:true,assistantScene:true,newTab:true,showSeconds:false,clock24:true,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,focusMinutes:25},links:[
 {id:'github',name:'GitHub',url:'https://github.com/',category:'work',icon:'code'},
 {id:'chatgpt',name:'ChatGPT',url:'https://chatgpt.com/',category:'work',icon:'book'},
 {id:'bilibili',name:'Bilibili',url:'https://www.bilibili.com/',category:'life',icon:'play'},
 {id:'twitter',name:'Twitter',url:'https://x.com/',category:'life',icon:'mission'},
 {id:'zhihu',name:'知乎',url:'https://www.zhihu.com/',category:'learn',icon:'operator'},
 {id:'mdn',name:'MDN',url:'https://developer.mozilla.org/zh-CN/',category:'learn',icon:'squad'}
],services:SERVICE_DEFAULTS,todos:[],note:'',recent:[],city:null,weather:null,focus:{remaining:1500,duration:1500,running:false,endsAt:null}};
const defaults=()=>JSON.parse(JSON.stringify(DEFAULTS));
const uid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function safeURL(value){
 if(typeof value!=='string'||!value.trim()||value.trim().length>2000||/[\s<>]/.test(value.trim()))return null;
 try{const raw=value.trim(),url=new URL(/^[a-z][a-z\d+.-]*:/i.test(raw)?raw:'https://'+raw);if(!['https:','http:'].includes(url.protocol)||!url.hostname||url.username||url.password)return null;return url.href;}catch{return null;}
}
function upgradeDefaultShortcuts(data){
 if(data.shortcutRevision>=1)return;
 const replacements={
  notion:{name:'Notion',url:'https://www.notion.so/',nextName:'ChatGPT',nextURL:'https://chatgpt.com/',category:'work'},
  figma:{name:'Figma',url:'https://www.figma.com/',nextName:'Twitter',nextURL:'https://x.com/',category:'life'}
 };
 for(const link of data.links){
  const old=replacements[link.id];
  if(old&&link.name===old.name&&link.url===old.url){
   link.name=old.nextName;link.url=old.nextURL;
   if(link.category==='work')link.category=old.category;
  }
 }
 data.shortcutRevision=1;
}
function validate(raw){
 if(!raw||typeof raw!=='object'||raw.version!==1||!Array.isArray(raw.links)||!Array.isArray(raw.todos))throw Error('invalid backup');
 const data=defaults(),s=raw.settings||{};
 if(typeof s.name==='string')data.settings.name=s.name.trim().slice(0,18)||'博士';
 if(Object.hasOwn(ENGINES,s.engine))data.settings.engine=s.engine;
 if(['day','night'].includes(s.background))data.settings.background=s.background;
 for(const k of ['autoTheme','assistant','assistantMotion','assistantScene','newTab','showSeconds','clock24','motion'])if(typeof s[k]==='boolean')data.settings[k]=s[k];
 if([5,15,25,45,60].includes(s.focusMinutes))data.settings.focusMinutes=s.focusMinutes;
 const usedIds=new Set();
 const idFor=(rawId,prefix,index)=>{let id=typeof rawId==='string'&&/^[\w-]{1,80}$/.test(rawId)?rawId:prefix+'-'+index;if(usedIds.has(id))id=uid();usedIds.add(id);return id;};
 data.links=raw.links.slice(0,60).filter(l=>l&&typeof l.name==='string'&&l.name.trim()&&safeURL(l.url)).map((l,i)=>({id:idFor(l.id,'link',i),name:l.name.trim().slice(0,24),url:safeURL(l.url),label:typeof l.label==='string'?l.label.trim().slice(0,8):'',category:Object.hasOwn(CATEGORIES,l.category)?l.category:'work',icon:Object.hasOwn(ICONS,l.icon)?l.icon:'operator'}));
 for(const id of Object.keys(SERVICE_DEFAULTS)){
  const service=raw.services?.[id];
  if(service&&typeof service.name==='string'&&service.name.trim()&&safeURL(service.url))data.services[id]={name:service.name.trim().slice(0,24),url:safeURL(service.url),label:typeof service.label==='string'?service.label.trim().slice(0,8):SERVICE_DEFAULTS[id].label};
 }
 data.shortcutRevision=Number.isInteger(raw.shortcutRevision)&&raw.shortcutRevision>=0?raw.shortcutRevision:0;
 upgradeDefaultShortcuts(data);
 data.todos=raw.todos.slice(0,100).filter(t=>t&&typeof t.text==='string'&&t.text.trim()).map((t,i)=>({id:idFor(t.id,'task',i),text:t.text.trim().slice(0,120),done:t.done===true}));
 data.note=typeof raw.note==='string'?raw.note.slice(0,12000):'';
 data.recent=Array.isArray(raw.recent)?raw.recent.filter(v=>typeof v==='string').map(v=>v.slice(0,1000)).slice(0,5):[];
 const c=raw.city,w=raw.weather;
 if(c&&typeof c.name==='string'&&Number.isFinite(c.latitude)&&Math.abs(c.latitude)<=90&&Number.isFinite(c.longitude)&&Math.abs(c.longitude)<=180)data.city={name:c.name.slice(0,80),latitude:c.latitude,longitude:c.longitude};
 if(data.city&&w&&['temp','code','high','low','updated'].every(k=>Number.isFinite(w[k]))&&typeof w.cityKey==='string'&&w.updated<=Date.now()+60000)data.weather={temp:w.temp,code:w.code,high:w.high,low:w.low,updated:w.updated,cityKey:w.cityKey};
 const seconds=data.settings.focusMinutes*60,f=raw.focus;data.focus={remaining:seconds,duration:seconds,running:false,endsAt:null};
 if(f&&Number.isFinite(f.duration)&&f.duration>=60&&f.duration<=3600&&Number.isFinite(f.remaining)&&f.remaining>=0&&f.remaining<=f.duration){data.focus={duration:f.duration,remaining:f.remaining,running:f.running===true&&Number.isFinite(f.endsAt),endsAt:Number.isFinite(f.endsAt)?f.endsAt:null};if(data.focus.running&&data.focus.endsAt>Date.now()+3600000)data.focus={remaining:seconds,duration:seconds,running:false,endsAt:null};}
 return data;
}
let state=defaults(),storageWarning=false;
try{
 const raw=localStorage.getItem(KEY);
 if(raw){const saved=JSON.parse(raw);state=validate(saved);if(saved.shortcutRevision!==state.shortcutRevision)localStorage.setItem(KEY,JSON.stringify(state));}
}catch{}
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{if(!storageWarning){toast('浏览器存储不可用，请导出备份保留修改。');storageWarning=true;}return false;}}
const icon=name=>`<svg aria-hidden="true"><use href="#i-${Object.hasOwn(ICONS,name)?name:'operator'}"/></svg>`;
const domain=url=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
let category='all';
function applyThemeGlyphs(){
 const suffix=state.settings.background==='night'?'-night':'';
 $$('[data-theme-icon]').forEach(el=>{
  const base=`i-${el.dataset.themeIcon}`,themed=`${base}${suffix}`;
  el.setAttribute('href',`#${document.getElementById(themed)?themed:base}`);
 });
}
function scheduledBackground(now=new Date()){
 const hour=now.getHours();return hour>=18||hour<6?'night':'day';
}
function syncAutomaticTheme(now=new Date()){
 if(!state.settings.autoTheme)return;
 const background=scheduledBackground(now);
 if(background===state.settings.background)return;
 state.settings.background=background;save();applyTheme();
}
function chooseBackground(background){
 const wasAutomatic=state.settings.autoTheme;
 state.settings.autoTheme=false;state.settings.background=background;save();applyTheme();
 if(wasAutomatic)toast('已切换为手动模式，可在个性设置中重新开启自动切换。');
}
function applyTheme(){
 document.body.dataset.background=state.settings.background;
 applyThemeGlyphs();
 $('meta[name="theme-color"]').content=state.settings.background==='night'?'#101411':'#efe7d6';
 $$('[data-action="background"]').forEach(button=>{button.title=(state.settings.background==='night'?'切换到白天界面':'切换到夜间界面')+(state.settings.autoTheme?'（关闭自动切换）':'');});
 $('#scene-title').textContent=state.settings.background==='day'?'天光 / OBSERVATORY':'星轨 / OBSERVATORY';
 const automatic=$('#setting-autotheme');if(automatic)automatic.checked=state.settings.autoTheme;
 $$('.background-choice').forEach(button=>{const selected=button.dataset.backgroundChoice===state.settings.background;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
}
function applySettings(){
 syncAutomaticTheme();applyTheme();document.body.classList.toggle('reduce-motion',!state.settings.motion);
 window.homeAssistant?.configure({visible:state.settings.assistant,motion:state.settings.motion&&state.settings.assistantMotion,scene:state.settings.assistantScene});
 const engine=ENGINES[state.settings.engine];$('#search-form').action=engine.url;$('#search-input').name=engine.param;$('#search-form').target=state.settings.newTab?'_blank':'_self';
 $$('.engines button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.engine===state.settings.engine)));
 $$('.shortcut-anchor,.featured-link,.bookmark-link,.service-link').forEach(a=>a.target=state.settings.newTab?'_blank':'_self');renderServices();updateClock();
}
function updateClock(){
 const now=new Date(),hour=now.getHours(),hh=String(state.settings.clock24?hour:hour%12||12).padStart(2,'0'),mm=String(now.getMinutes()).padStart(2,'0');
 $('#clock').innerHTML=`${hh}:${mm}${state.settings.showSeconds?`<span class="clock-seconds">${String(now.getSeconds()).padStart(2,'0')}</span>`:''}`;
 $('#clock').dateTime=now.toISOString();$('#clock').setAttribute('aria-label',`当前时间 ${hour}点${now.getMinutes()}分`);
 const greeting=hour<5?'夜深了':hour<11?'早上好':hour<14?'中午好':hour<18?'午后好':'晚上好';$('#greeting').textContent=`${greeting}，${state.settings.name}。`;
 $('#date').textContent=now.toLocaleDateString('sv-SE').replaceAll('-','/')+' · '+now.toLocaleDateString('zh-CN',{weekday:'long'});$('#date').dateTime=now.toLocaleDateString('sv-SE');
 $('#time-zone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_',' ')+(state.settings.clock24?'':hour<12?' / AM':' / PM');
}
function renderServices(){
 $$('[data-service-id]').forEach(a=>{
  const service=state.services[a.dataset.serviceId];if(!service)return;
  a.href=service.url;a.target=state.settings.newTab?'_blank':'_self';a.setAttribute('aria-label',`打开 ${service.name}${service.label?' · '+service.label:''}`);a.title=`${service.name}${service.label?' · '+service.label:''}（右键编辑）`;
  const name=$('[data-service-name]',a),label=$('[data-service-label]',a);if(name)name.textContent=service.name;if(label)label.textContent=service.label;
 });
}
function renderLinks(){
 const planes=[['1182,386 1491,383 1491,533 1180,521','311,150','squad'],['1506,383 1886,380 1886,546 1506,532','380,166','operator']];
 $('#shortcut-grid').innerHTML=planes.map(([p,size,symbol],i)=>{const l=state.links[i];return l?`<article class="tile paper plane shortcut-card primary-${i}" data-plane="${p}" data-size="${size}"><a class="shortcut-anchor" data-link-id="${esc(l.id)}" href="${esc(l.url)}" target="${state.settings.newTab?'_blank':'_self'}" rel="noopener noreferrer" aria-label="打开 ${esc(l.name)}"><span class="tile-title" data-title="${esc(l.name)}" aria-label="${esc(l.name)}">${esc(l.name)}</span><span class="project">Pioneer Project</span><span class="tile-label" title="${esc(l.label||CATEGORIES[l.category])}"><span class="tile-label-text">${esc(l.label||CATEGORIES[l.category])}</span><i></i></span><span class="orbit"><svg aria-hidden="true"><use href="#i-${symbol}" data-theme-icon="${symbol}"/></svg></span><span class="edge-mark" aria-hidden="true">≡</span></a><button class="edit-shortcut" data-edit-link="${esc(l.id)}" aria-label="编辑 ${esc(l.name)}">✎</button></article>`:`<button class="tile paper plane" data-plane="${p}" data-size="${size}" data-open="add-link"><span class="tile-title">Add site</span><span class="tile-label">添加网站<i></i></span></button>`;}).join('');
 $('#featured-links').innerHTML=[2,3].map((i)=>{const l=state.links[i];return l?`<div class="featured-slot"><a class="featured-link featured-${i}" data-link-id="${esc(l.id)}" href="${esc(l.url)}" target="${state.settings.newTab?'_blank':'_self'}" rel="noopener noreferrer" aria-label="打开 ${esc(l.name)}"><small>QUICK ACCESS</small><strong>${esc(l.name)}</strong></a><button class="edit-featured" data-edit-link="${esc(l.id)}" aria-label="编辑 ${esc(l.name)}" title="编辑网站">✎</button></div>`:'<button class="featured-link featured-empty" data-open="add-link">＋ 添加快捷网站</button>';}).join('');
 applyThemeGlyphs();$$('.plane').forEach(project);resizeStage();
}
function renderTodos(){
 const completed=state.todos.filter(t=>t.done).length;$('#mission-summary').textContent=state.todos.length?`${completed} / ${state.todos.length} 已完成`:'';$('#todo-count').textContent=state.todos.length?`${completed} / ${state.todos.length} 已完成`:'今日待办';
 $('#todo-list').innerHTML=state.todos.length?state.todos.map(t=>`<li class="todo-row ${t.done?'done':''}"><label><input type="checkbox" data-todo="${esc(t.id)}" ${t.done?'checked':''}><span>${esc(t.text)}</span></label><button class="todo-remove" data-remove-todo="${esc(t.id)}" aria-label="删除待办 ${esc(t.text)}">×</button></li>`).join(''):'<li class="todo-empty">今天，想先完成哪一件事？</li>';
 $('#clear-completed').hidden=completed===0;
}
$('#todo-form').addEventListener('submit',e=>{e.preventDefault();const text=$('#todo-input').value.trim();if(!text)return;if(state.todos.length>=100){toast('待办已满，请先清理已完成事项。');return;}state.todos.push({id:uid(),text:text.slice(0,120),done:false});save();renderTodos();$('#todo-input').value='';$('#todo-input').focus();});
document.addEventListener('change',e=>{const id=e.target.dataset.todo;if(!id)return;const todo=state.todos.find(t=>t.id===id);if(todo){todo.done=e.target.checked;save();renderTodos();$(`[data-todo="${id}"]`)?.focus();}});
let noteTimer;
$('#note').value=state.note;
function noteCount(){$('#note-count').textContent=`${$('#note').value.length} / 12000`;}
function persistNote(){clearTimeout(noteTimer);state.note=$('#note').value;$('#note-status').textContent=save()?'已保存在此设备':'尚未保存，请导出备份';}
$('#note').addEventListener('input',()=>{state.note=$('#note').value;$('#note-status').textContent='正在保存…';noteCount();clearTimeout(noteTimer);noteTimer=setTimeout(persistNote,350);});
$('#note').addEventListener('blur',()=>{if(noteTimer)persistNote();});addEventListener('pagehide',()=>{if(noteTimer)persistNote();});
function showRecent(){const box=$('#recent-searches');if($('#search-input').value.trim()||!state.recent.length){box.hidden=true;return;}box.innerHTML=`<header><span>最近搜索</span><button data-action="clear-recent">清空</button></header>${state.recent.map((q,i)=>`<button class="recent-item" type="button" data-recent="${i}">↗ ${esc(q)}</button>`).join('')}`;box.hidden=false;}
$('#search-input').addEventListener('focus',showRecent);$('#search-input').addEventListener('input',showRecent);document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search-content'))$('#recent-searches').hidden=true;});
$('#search-form').addEventListener('submit',e=>{
 const query=$('#search-input').value.trim();if(!query){e.preventDefault();return;}state.recent=[query,...state.recent.filter(q=>q!==query)].slice(0,5);save();$('#recent-searches').hidden=true;
 const isAddress=/^https?:\/\//i.test(query)||/^(localhost(?::\d+)?|(?:[\w-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#]|$)/i.test(query),url=isAddress?safeURL(query):null;
 if(url){e.preventDefault();const a=document.createElement('a');a.href=url;a.target=state.settings.newTab?'_blank':'_self';a.rel='noopener noreferrer';document.body.append(a);a.click();a.remove();}
});
document.addEventListener('keydown',e=>{const editable=e.target.closest('input,textarea,select,[contenteditable="true"]');if(!$('#modal').open&&!$('#workspace-modal').open&&!editable&&e.key==='/'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();$('#search-input').focus();}if(!$('#modal').open&&!$('#workspace-modal').open&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#search-input').focus();}if(e.key==='Escape')$('#recent-searches').hidden=true;});
function focusSeconds(){return state.focus.running?Math.max(0,Math.ceil((state.focus.endsAt-Date.now())/1000)):state.focus.remaining;}
function renderFocus(){
 const remaining=focusSeconds();if(state.focus.running&&remaining===0){state.focus.running=false;state.focus.remaining=0;state.focus.endsAt=null;save();toast('本次专注已完成，休息一下吧。');}
 const m=String(Math.floor(remaining/60)).padStart(2,'0'),s=String(remaining%60).padStart(2,'0');$('#focus-time').textContent=m+':'+s;$('#focus-minutes').textContent=m;
 $('#focus-state').textContent=state.focus.running?'Ⅱ 暂停专注':remaining===0?'↻ 再次开始':remaining<state.focus.duration?'▶ 继续专注':'▶ 开始专注';
 $('#focus-toggle').setAttribute('aria-label',(state.focus.running?'暂停专注':remaining===0?'再次开始专注':remaining<state.focus.duration?'继续专注':'开始专注')+` ${m} 分 ${s} 秒`);
 $('#focus-progress').style.strokeDashoffset=String(100-remaining/state.focus.duration*100);
}
$('#focus-toggle').addEventListener('click',()=>{if(state.focus.running){state.focus.remaining=focusSeconds();state.focus.running=false;state.focus.endsAt=null;}else{if(state.focus.remaining===0){state.focus.duration=state.settings.focusMinutes*60;state.focus.remaining=state.focus.duration;}state.focus.running=true;state.focus.endsAt=Date.now()+state.focus.remaining*1000;}save();renderFocus();});
setInterval(()=>{syncAutomaticTheme();updateClock();renderFocus();},1000);
document.body.classList.toggle('motion-paused',document.hidden);
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('motion-paused',document.hidden);if(!document.hidden){syncAutomaticTheme();updateClock();renderFocus();if(state.city&&(!state.weather||Date.now()-state.weather.updated>1800000))fetchWeather();}});

const modal=$('#modal'),body=$('#modal-body');let editingLink=null;
function showModal(title,kicker,html){$('#modal-title').textContent=title;$('#modal-kicker').textContent=kicker+' / PIONEER PROJECT';body.innerHTML=html;if(!modal.open)modal.showModal();modal.scrollTop=0;}
$('#modal-close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
function openModal(view,id=null){$('#workspace-modal').close();if(view==='todos'||view==='weather-info'){openWorkspace(view);return;}if(view==='history'){historyPanel();return;}editingLink=id;if(view==='add-link'||view==='edit-link')linkForm(id);else if(view==='edit-service')linkForm(null,id);else if(view==='websites')websiteSettings();else if(view==='bookmarks')bookmarks();else if(view==='settings')settings();else if(view==='weather')citySearch();else if(view==='help')help();}
function linkForm(id,serviceId=null){
 if(serviceId&&!Object.hasOwn(SERVICE_DEFAULTS,serviceId))return;
 const link=serviceId?state.services[serviceId]:state.links.find(l=>l.id===id),current=link||{name:'',url:'',label:'',category:category==='all'?'work':category,icon:'operator'};
 const preset=serviceId?SERVICE_DEFAULTS[serviceId]:DEFAULTS.links.find(l=>l.id===id);
 const showLabel=serviceId||!link||state.links.findIndex(l=>l.id===id)<2;
 showModal(link?'编辑网站':'添加网站','SHORTCUTS',`<form id="link-form">
  <div class="field"><label for="link-name">网站名称</label><input id="link-name" maxlength="24" value="${esc(current.name)}" placeholder="例如：我的工作台" required></div>
  <div class="field"><label for="link-url">网址</label><input id="link-url" inputmode="url" value="${esc(current.url)}" placeholder="https://example.com" maxlength="2000" required></div>
  ${showLabel?`<div class="field"><label for="link-label">卡片标签（可选）</label><input id="link-label" maxlength="8" value="${esc(current.label||'')}" placeholder="${serviceId?'例如：翻译、邮箱':'留空时使用分类名称'}"></div>`:''}
  ${serviceId?'':`<div class="field-row"><div class="field"><label for="link-category">分类</label><select id="link-category">${Object.entries(CATEGORIES).map(([k,v])=>`<option value="${k}" ${k===current.category?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label for="link-icon">收藏图标</label><select id="link-icon">${Object.entries(ICONS).map(([k,v])=>`<option value="${k}" ${k===current.icon?'selected':''}>${v}</option>`).join('')}</select></div></div>`}
  <p id="link-error" class="form-error" role="alert" hidden></p>
  <div class="form-actions">${link&&!serviceId?'<button class="text-button danger" type="button" data-action="delete-link">删除此网站</button>':''}${preset?'<button id="restore-link" class="text-button" type="button">恢复默认</button>':''}<button class="action-button secondary" type="button" data-open="websites">返回入口列表</button><button class="action-button" type="submit">保存网站</button></div>
 </form>`);
 $('#restore-link')?.addEventListener('click',()=>{
  $('#link-name').value=preset.name;$('#link-url').value=preset.url;if($('#link-label'))$('#link-label').value=preset.label||'';
  if(!serviceId){$('#link-category').value=preset.category;$('#link-icon').value=preset.icon;}
  $('#link-error').hidden=true;
 });
 $('#link-form').addEventListener('submit',e=>{
  e.preventDefault();const name=$('#link-name').value.trim(),url=safeURL($('#link-url').value),label=$('#link-label')?$('#link-label').value.trim().slice(0,8):current.label||'';
  if(!name||!url){$('#link-error').textContent='请填写网站名称和有效的 http / https 网址。';$('#link-error').hidden=false;return;}
  if(!serviceId&&!link&&state.links.length>=60){$('#link-error').textContent='最多保存 60 个网站，请先整理收藏。';$('#link-error').hidden=false;return;}
  if(serviceId)state.services[serviceId]={name:name.slice(0,24),url,label};
  else{const next={id:link?.id||uid(),name:name.slice(0,24),url,label,category:$('#link-category').value,icon:$('#link-icon').value};if(link)state.links[state.links.findIndex(l=>l.id===link.id)]=next;else state.links.push(next);}
  save();category='all';renderLinks();renderServices();modal.close();toast(link?'网站已更新':'网站已添加');
 });
}
function websiteSettings(){
 const entry=(site,position,attribute)=>`<button class="site-entry" ${attribute}><span><b>${esc(site.name)}</b><small>${position} · ${esc(domain(site.url))}</small></span><span class="site-edit-label">编辑 ↗</span></button>`;
 showModal('网站入口','WEBSITES',`<p class="modal-description">修改各入口的名称、网址与标签。也可在主页右键编辑。</p>
  <p class="settings-section">主页卡片与收藏</p><div class="site-entry-list">${state.links.map((l,i)=>entry(l,i<2?`主卡片 ${i+1}`:i<4?`横幅 ${i-1}`:'收藏',`data-edit-link="${esc(l.id)}"`)).join('')||'<p class="empty-message">还没有收藏的网站。</p>'}</div>
  <p class="settings-section">固定位置入口</p><div class="site-entry-list">${Object.entries(state.services).map(([id,site])=>entry(site,id==='mail'?'顶部信封':'左下角卡片',`data-edit-service="${id}"`)).join('')}</div>
  <div class="form-actions"><button class="action-button secondary" data-open="settings">返回设置</button><button class="action-button" data-open="add-link">＋ 添加网站</button></div>`);
}
function bookmarks(){
 const rows=state.links.map((l,i)=>({l,i})).filter(({l})=>category==='all'||l.category===category);
 showModal('网站收藏','COLLECTION',`<nav class="category-tabs" aria-label="网站分类">${Object.entries({all:'全部',...CATEGORIES}).map(([key,label])=>`<button data-category="${key}" aria-pressed="${category===key}">${label}</button>`).join('')}</nav><div class="bookmark-manager">${rows.map(({l,i})=>`<div class="bookmark-row">${icon(l.icon)}<div><a class="bookmark-link" href="${esc(l.url)}" target="${state.settings.newTab?'_blank':'_self'}" rel="noopener noreferrer"><b>${esc(l.name)} ↗</b></a><small>${esc(domain(l.url))} · ${CATEGORIES[l.category]}</small></div><div class="row-actions"><button data-move-link="${esc(l.id)}" data-direction="-1" ${i===0?'disabled':''} aria-label="上移 ${esc(l.name)}">↑</button><button data-move-link="${esc(l.id)}" data-direction="1" ${i===state.links.length-1?'disabled':''} aria-label="下移 ${esc(l.name)}">↓</button><button data-edit-link="${esc(l.id)}" aria-label="编辑 ${esc(l.name)}">编辑</button></div></div>`).join('')||'<p class="empty-message">这个分类还没有收藏的网站。</p>'}</div><div class="form-actions"><button class="action-button secondary" data-open="websites">自定义网站入口</button><button class="action-button" data-open="add-link">＋ 添加网站</button></div>`);
}
function settings(){
 const s=state.settings;
 showModal('让主页更像你','APPEARANCE',`<p class="settings-section">PERSONAL / 个人偏好</p><div class="settings-row"><label for="setting-name">如何称呼你</label><input type="text" id="setting-name" maxlength="18" value="${esc(s.name)}"></div><div class="settings-row"><label for="setting-engine">默认搜索引擎</label><select id="setting-engine">${Object.entries(ENGINES).map(([k,v])=>`<option value="${k}" ${k===s.engine?'selected':''}>${v.name}</option>`).join('')}</select></div><div class="settings-row"><label for="setting-newtab">在新标签页打开<small>用于搜索和网站快捷入口</small></label><input type="checkbox" id="setting-newtab" ${s.newTab?'checked':''}></div><div class="settings-row"><label for="setting-seconds">显示时钟秒数</label><input type="checkbox" id="setting-seconds" ${s.showSeconds?'checked':''}></div><div class="settings-row"><label for="setting-clock24">使用 24 小时制</label><input type="checkbox" id="setting-clock24" ${s.clock24?'checked':''}></div><div class="settings-row"><label for="setting-motion">界面动效<small>轨道、图标与仪表的循环效果</small></label><input type="checkbox" id="setting-motion" ${s.motion?'checked':''}></div><div class="settings-row"><label for="setting-focus">每次专注时长<small>正在进行的计时保持不变</small></label><select id="setting-focus">${[5,15,25,45,60].map(n=>`<option value="${n}" ${n===s.focusMinutes?'selected':''}>${n} 分钟</option>`).join('')}</select></div><p class="settings-section">WEBSITES / 网站入口</p><button class="website-settings-button" data-open="websites"><span>自定义网站入口<small>卡片、横幅、邮箱与翻译</small></span><span aria-hidden="true">↗</span></button><p class="settings-section">ASSISTANT / 主页助理</p><div class="settings-row"><label for="setting-assistant">显示阿米娅立绘<small>寰宇独奏 · 中央助理展示</small></label><input type="checkbox" id="setting-assistant" ${s.assistant?'checked':''}></div><div class="settings-row"><label for="setting-assistant-scene">皮肤背景与动效<small>显示寰宇独奏自带的花枝、琴盒与场景动画</small></label><input type="checkbox" id="setting-assistant-scene" ${s.assistantScene?'checked':''}></div><div class="settings-row"><label for="setting-assistant-motion">立绘动作<small>待机与互动动作；暂停时保留当前姿态</small></label><input type="checkbox" id="setting-assistant-motion" ${s.assistantMotion?'checked':''}></div><p class="settings-section">THEME / 主题与场景</p><div class="settings-row"><label for="setting-autotheme">按时间自动切换昼夜<small>本地时间 18:00–次日 06:00 使用黑夜模式<br>手动选择场景会关闭自动切换</small></label><input type="checkbox" id="setting-autotheme" ${s.autoTheme?'checked':''}></div><div class="background-choices">${[['day','天光'],['night','星轨']].map(([k,n])=>`<button class="background-choice ${k===s.background?'selected':''}" data-background-choice="${k}" aria-pressed="${k===s.background}"><img src="assets/observatory-${k}.webp" alt="${n}天文台场景"><span>${n} / ${k.toUpperCase()}</span></button>`).join('')}</div><p class="settings-section">LOCAL DATA / 本地数据</p><p class="modal-description">收藏、便签与待办保存在此设备的浏览器中。清理浏览器数据前，可以先导出备份。</p><div class="data-tools"><button class="text-button" data-action="export">导出备份 ↗</button><button class="text-button" data-action="import">导入备份 ↗</button><button class="text-button" data-action="clear-recent">清空搜索记录</button></div><div class="form-actions"><button class="action-button" data-action="save-settings">完成设置</button></div>`);
 const bindings={'setting-assistant':['assistant',e=>e.checked],'setting-assistant-scene':['assistantScene',e=>e.checked],'setting-assistant-motion':['assistantMotion',e=>e.checked],'setting-autotheme':['autoTheme',e=>e.checked],'setting-name':['name',e=>e.value.trim()||'博士'],'setting-engine':['engine',e=>e.value],'setting-newtab':['newTab',e=>e.checked],'setting-seconds':['showSeconds',e=>e.checked],'setting-clock24':['clock24',e=>e.checked],'setting-motion':['motion',e=>e.checked],'setting-focus':['focusMinutes',e=>Number(e.value)]};
 for(const [id,[key,read]] of Object.entries(bindings))$('#'+id).addEventListener('change',e=>{state.settings[key]=read(e.target);if(key==='focusMinutes'&&!state.focus.running){state.focus.duration=state.settings.focusMinutes*60;state.focus.remaining=state.focus.duration;renderFocus();}save();applySettings();});
}
function help(){showModal('从这里开始','QUICK GUIDE',`<ol class="help-list"><li><strong>搜索与直达</strong><br>选择搜索引擎后按 Enter。输入完整网址可直接访问；按 <kbd>/</kbd> 或 <kbd>Ctrl / ⌘ K</kbd> 聚焦搜索。</li><li><strong>打造自己的收藏</strong><br>首页展示收藏列表的前四个网站。点击「网站收藏」查看全部、添加网站或调整顺序；点击卡片编辑按钮或右键入口可修改名称、网址；「个性设置 → 网站入口」也可编辑邮箱与翻译。</li><li><strong>一段专注时间</strong><br>点击圆形仪表开始或暂停，点击 ↺ 重置。计时在刷新后继续，时长可在设置中调整。</li><li>${location.protocol==='chrome-extension:'?'<strong>扩展新标签页</strong><br>新建标签页即可进入孤星主页，无需启动预览服务。要在启动 Chrome 时显示它，在浏览器「设置 → 启动时」选择「打开新标签页」。原网页的数据可在个性设置中通过导出、导入备份迁移。':'<strong>设为浏览器主页</strong><br>推荐使用随项目提供的 Chrome 扩展版，加载后新标签页直接显示此主页，无需本地服务。普通网页版也可以复制本页地址，在浏览器「设置 → 启动时 → 打开特定网页」中添加。'}</li><li><strong>数据与天气</strong><br>个人内容仅保存在本机；搜索仅在提交时发送到所选引擎。添加城市后，天气使用 <a class="source-link" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> 的数据，不申请设备位置权限。</li></ol><div class="form-actions"><a class="text-button" href="original.html" target="_blank" rel="noopener noreferrer">查看原始 UI 复刻 ↗</a><button class="action-button" data-action="close">开始使用</button></div>`);}

let weatherStatus='',weatherPending=false,weatherRequest=0,cityResults=[];
const cityKey=c=>c?`${c.latitude},${c.longitude}`:'';
function describeWeather(code){if(code===0)return ['晴','sun'];if([1,2,3].includes(code))return ['多云','cloud'];if([45,48].includes(code))return ['雾','cloud'];if(code>=71&&code<=77||code===85||code===86)return ['雪','cloud'];if(code>=95)return ['雷雨','rain'];if(code>=51&&code<=67||code>=80&&code<=82)return ['雨','rain'];return ['天气','cloud'];}
function renderWeather(){
 $('#weather-badge').textContent=state.city&&state.weather?Math.round(state.weather.temp)+'°':'—°';
 const box=$('#weather-content');if(!state.city){box.innerHTML='<svg class="weather-symbol" aria-hidden="true"><use href="#i-sun"/></svg><button class="set-city" data-open="weather">添加天气城市 ＋</button>';return;}
 const w=state.weather&&state.weather.cityKey===cityKey(state.city)?state.weather:null;
 if(!w){box.innerHTML=`<svg class="weather-symbol" aria-hidden="true"><use href="#i-cloud"/></svg><button class="set-city" data-open="weather">${esc(state.city.name)} ⌖</button><p class="weather-error">${weatherStatus||'正在获取天气…'}</p>${weatherPending?'':'<button class="text-button" data-action="refresh-weather">重新获取</button>'}`;return;}
 const [desc,symbol]=describeWeather(w.code),stale=Date.now()-w.updated>3600000;
 box.innerHTML=`<div class="weather-reading"><strong>${Math.round(w.temp)}°</strong><svg class="weather-symbol" aria-hidden="true"><use href="#i-${symbol}" data-theme-icon="${symbol}"/></svg></div><div class="weather-caption"><b>${esc(state.city.name)} · ${desc}</b><span>${Math.round(w.low)}° / ${Math.round(w.high)}°</span></div><div class="weather-source"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">OPEN-METEO</a><button class="weather-refresh" data-action="refresh-weather" aria-label="刷新天气">${weatherPending?'更新中':new Date(w.updated).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})+' 更新 ↻'}</button></div>${weatherStatus||stale?`<p class="weather-error">${weatherStatus||'上次获取的数据，点击刷新更新。'}</p>`:''}`;
}
async function requestJSON(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('request failed');return await r.json();}finally{clearTimeout(timer);}}
async function fetchWeather(){
 if(!state.city||weatherPending)return;const requestId=++weatherRequest,city={...state.city};weatherPending=true;weatherStatus='';renderWeather();
 try{const params=new URLSearchParams({latitude:city.latitude,longitude:city.longitude,current:'temperature_2m,weather_code',daily:'temperature_2m_max,temperature_2m_min',timezone:'auto',forecast_days:'1'}),data=await requestJSON('https://api.open-meteo.com/v1/forecast?'+params);if(requestId!==weatherRequest||cityKey(state.city)!==cityKey(city))return;const w={temp:data.current?.temperature_2m,code:data.current?.weather_code,high:data.daily?.temperature_2m_max?.[0],low:data.daily?.temperature_2m_min?.[0],updated:Date.now(),cityKey:cityKey(city)};if(!['temp','code','high','low'].every(k=>Number.isFinite(w[k])))throw Error('invalid weather');state.weather=w;save();}
 catch{if(requestId===weatherRequest)weatherStatus='暂时无法连接天气服务，请稍后重试。';}
 finally{if(requestId===weatherRequest){weatherPending=false;renderWeather();}}
}
function citySearch(){
 showModal('选择天气城市','WEATHER',`<p class="modal-description">输入城市名称获取当地天气，不需要提供设备位置。</p><form id="city-form" class="city-search"><div class="field"><label for="city-query">城市名称</label><input id="city-query" type="search" placeholder="例如：上海 / Shanghai" maxlength="80" required></div><button class="action-button" type="submit">查找</button></form><div id="city-results" class="city-results" aria-live="polite"></div>${state.city?`<div class="form-actions"><span class="modal-description">当前：${esc(state.city.name)}</span><button class="text-button danger" data-action="remove-city">移除城市</button></div>`:''}`);
 $('#city-form').addEventListener('submit',async e=>{e.preventDefault();const query=$('#city-query').value.trim();if(!query)return;const box=$('#city-results'),button=$('#city-form button');button.disabled=true;box.innerHTML='<p class="modal-description">正在查找城市…</p>';try{const params=new URLSearchParams({name:query,count:'6',language:'zh',format:'json'}),data=await requestJSON('https://geocoding-api.open-meteo.com/v1/search?'+params);cityResults=(data.results||[]).filter(c=>typeof c.name==='string'&&Number.isFinite(c.latitude)&&Number.isFinite(c.longitude));if(!box.isConnected)return;box.innerHTML=cityResults.length?cityResults.map((c,i)=>`<button class="city-result" data-city="${i}"><b>${esc(c.name)}</b><small>${esc([c.admin1,c.country].filter(Boolean).join(' · '))}</small></button>`).join(''):'<p class="modal-description">没有找到城市，试试英文或拼音名称。</p>';}catch{if(box.isConnected)box.innerHTML='<p class="form-error">暂时无法查找城市，请检查网络后重试。</p>';}finally{button.disabled=false;}});
}
let pendingImport=null;
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>300000)throw Error('large backup');pendingImport=validate(JSON.parse(await file.text()));showModal('导入主页备份','LOCAL DATA',`<p class="modal-description">此备份包含 ${pendingImport.links.length} 个网站、${pendingImport.todos.length} 条待办和 ${pendingImport.note.length} 字便签。导入会替换当前主页数据。</p><div class="form-actions"><button class="action-button secondary" data-open="settings">取消</button><button class="action-button" data-action="confirm-import">确认导入</button></div>`);}catch{toast('无法读取备份，请选择有效的孤星主页 JSON 文件。');pendingImport=null;}e.target.value='';});
function exportData(){state.note=$('#note').value;const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='孤星主页备份-'+new Date().toLocaleDateString('sv-SE')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('备份已导出');}
document.addEventListener('click',e=>{
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.open){openModal(t.dataset.open);return;}
 if(t.dataset.engine){state.settings.engine=t.dataset.engine;save();applySettings();$('#search-input').focus();return;}
 if(t.dataset.category){category=t.dataset.category;bookmarks();return;}
 if(t.dataset.editLink){openModal('edit-link',t.dataset.editLink);return;}
 if(t.dataset.editService){openModal('edit-service',t.dataset.editService);return;}
 if(t.dataset.moveLink){const from=state.links.findIndex(l=>l.id===t.dataset.moveLink),to=from+Number(t.dataset.direction);if(from>=0&&to>=0&&to<state.links.length){[state.links[from],state.links[to]]=[state.links[to],state.links[from]];save();renderLinks();bookmarks();}return;}
 if(t.dataset.removeTodo){state.todos=state.todos.filter(todo=>todo.id!==t.dataset.removeTodo);save();renderTodos();toast('待办已删除');return;}
 if(t.dataset.backgroundChoice){chooseBackground(t.dataset.backgroundChoice);return;}
 if(t.dataset.recent!==undefined){modal.close();$('#search-input').value=state.recent[Number(t.dataset.recent)]||'';$('#recent-searches').hidden=true;$('#search-input').focus();return;}
 if(t.dataset.city!==undefined){const c=cityResults[Number(t.dataset.city)];if(c){++weatherRequest;weatherPending=false;state.city={name:c.name,latitude:c.latitude,longitude:c.longitude};state.weather=null;save();modal.close();fetchWeather();}return;}
 switch(t.dataset.action){
 case 'assistant-scene':state.settings.assistantScene=!state.settings.assistantScene;save();applySettings();break;
 case 'assistant-interact':window.homeAssistant?.interact();break;
 case 'assistant-motion':state.settings.assistantMotion=!(state.settings.assistantMotion&&state.settings.motion);if(state.settings.assistantMotion)state.settings.motion=true;save();applySettings();break;
 case 'close-workspace':$('#workspace-modal').close();break;
 case 'note':$('#note').focus();break;
 case 'hide-interface':{const hidden=document.body.classList.toggle('scenery-only');$('.restore-interface').hidden=!hidden;break;}
 case 'background':chooseBackground(state.settings.background==='day'?'night':'day');break;
 case 'reset-focus':state.focus={duration:state.settings.focusMinutes*60,remaining:state.settings.focusMinutes*60,running:false,endsAt:null};save();renderFocus();toast('专注计时已重置');break;
 case 'clear-completed':state.todos=state.todos.filter(todo=>!todo.done);save();renderTodos();toast('已完成事项已清理');break;
 case 'copy-note':if(!$('#note').value.trim()){toast('便签还是空的。');break;}if(navigator.clipboard)navigator.clipboard.writeText($('#note').value).then(()=>toast('便签已复制')).catch(()=>{$('#note').focus();$('#note').select();toast('已选中便签，请按 Ctrl / ⌘ C 复制。');});else{$('#note').focus();$('#note').select();toast('已选中便签，请按 Ctrl / ⌘ C 复制。');}break;
 case 'save-settings':if($('#setting-name'))state.settings.name=$('#setting-name').value.trim()||'博士';save();applySettings();modal.close();toast('主页设置已保存');break;
 case 'delete-link':state.links=state.links.filter(l=>l.id!==editingLink);save();renderLinks();modal.close();toast('网站已从主页移除');break;
 case 'clear-recent':state.recent=[];save();$('#recent-searches').hidden=true;if($('#history-list'))historyPanel();toast('搜索记录已清空');break;
 case 'refresh-weather':fetchWeather();break;
 case 'remove-city':++weatherRequest;weatherPending=false;weatherStatus='';state.city=null;state.weather=null;save();renderWeather();modal.close();break;
 case 'export':exportData();break;
 case 'import':$('#import-file').click();break;
 case 'confirm-import':if(pendingImport){clearTimeout(noteTimer);state=pendingImport;pendingImport=null;++weatherRequest;weatherPending=false;weatherStatus='';category='all';save();$('#note').value=state.note;$('#note-status').textContent='已导入备份';renderAll();modal.close();toast('主页数据已导入');if(state.city)fetchWeather();}break;
 case 'close':modal.close();break;
 }
});
document.addEventListener('contextmenu',e=>{
 const a=e.target.closest('[data-link-id],[data-service-id]');if(!a||e.shiftKey)return;
 e.preventDefault();openModal(a.dataset.serviceId?'edit-service':'edit-link',a.dataset.serviceId||a.dataset.linkId);
});
function renderAll(){applySettings();renderLinks();renderTodos();noteCount();renderFocus();renderWeather();}
renderAll();if(state.city&&(!state.weather||Date.now()-state.weather.updated>1800000))fetchWeather();
function syncSavedShortcuts(raw){
 if(!raw)return;
 try{
  const next=validate(JSON.parse(raw));
  if(JSON.stringify(next.links)!==JSON.stringify(state.links)){
   state.links=next.links;state.shortcutRevision=next.shortcutRevision;renderLinks();
  }
  if(JSON.stringify(next.services)!==JSON.stringify(state.services)){state.services=next.services;renderServices();}
 }catch{}
}
addEventListener('storage',event=>{if(event.key===KEY)syncSavedShortcuts(event.newValue);});
addEventListener('focus',()=>{syncAutomaticTheme();try{syncSavedShortcuts(localStorage.getItem(KEY));}catch{}});

// The lower two rows share one camera. Horizontal edges meet at the same
// vanishing point; adjacent cards no longer bend at their seams.
function lowerSurfacePoint(x,y){
 const leftHeight=300,rightHeight=357,surfaceWidth=770,surfaceHeight=355;
 const perspective=(1-leftHeight/rightHeight)/surfaceWidth;
 const scaleX=766*leftHeight/(surfaceWidth*rightHeight);
 const horizon=545-35*leftHeight/(rightHeight-leftHeight);
 const depth=1-perspective*x;
 return [1216+scaleX*x/depth,horizon+(545-horizon+y*leftHeight/surfaceHeight)/depth];
}
function project(el) {
 let points;
 if(el.dataset.surfaceRect){
  const [x,y,width,height]=el.dataset.surfaceRect.split(',').map(Number);
  points=[[x,y],[x+width,y],[x+width,y+height],[x,y+height]].map(([u,v])=>lowerSurfacePoint(u,v));
 }else points=el.dataset.plane.split(' ').map(p=>p.split(',').map(Number));
 // Enlarge the whole right composition toward the observatory. Apply the same
 // adjustment after projection so the lower cards keep their shared camera.
 points=points.map(([x,y])=>[2070+(x-2070)*1.075,500+(y-500)*1.05]);
 const [w,h]=el.dataset.size.split(',').map(Number);
 el.style.width=w+'px';el.style.height=h+'px';
 const src=[[0,0],[w,0],[w,h],[0,h]], A=[],B=[];
 src.forEach(([x,y],i)=>{const [u,v]=points[i];A.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);B.push(u,v)});
 for(let i=0;i<8;i++){let best=i;for(let j=i+1;j<8;j++)if(Math.abs(A[j][i])>Math.abs(A[best][i]))best=j;[A[i],A[best]]=[A[best],A[i]];[B[i],B[best]]=[B[best],B[i]];const d=A[i][i];for(let k=i;k<8;k++)A[i][k]/=d;B[i]/=d;for(let j=0;j<8;j++)if(j!==i){const m=A[j][i];for(let k=i;k<8;k++)A[j][k]-=m*A[i][k];B[j]-=m*B[i]}}
 const [a,b,c,d,e,f,g,k]=B;el.style.transform=`matrix3d(${a},${d},0,${g},${b},${e},0,${k},0,0,1,0,${c},${f},0,1)`;
}

function resizeStage(){
 const stage=$('#stage');
 // Size the layout at its displayed resolution instead of scaling a transformed ancestor.
 // Individual cards retain their reference perspective; mobile returns to normal flow.
 const mobile=matchMedia('(max-width:900px) and (orientation:portrait)').matches;
 stage.style.zoom=mobile?'1':String(Math.min(innerWidth/stage.offsetWidth,innerHeight/stage.offsetHeight));
 stage.style.transform='none';
 stage.style.margin='0';
}
addEventListener('resize',resizeStage);resizeStage();
function openWorkspace(view){$('#todo-workspace').hidden=view!=='todos';$('#weather-workspace').hidden=view!=='weather-info';$('#workspace-title').textContent=view==='todos'?'今日待办':'当地天气';$('#workspace-modal').showModal();}
function historyPanel(){showModal('最近搜索','SEARCH HISTORY',`<div id="history-list">${state.recent.length?state.recent.map((q,i)=>`<button class="history-item" data-recent="${i}">↗ ${esc(q)}</button>`).join(''):'<p class="empty-message">还没有搜索记录，从终端开始一次搜索吧。</p>'}</div><div class="form-actions"><button class="text-button" data-action="clear-recent">清空搜索记录</button></div>`);}
