const stage = document.querySelector('#stage');
const dialog = document.querySelector('#panel');
const content = document.querySelector('#panel-content');
// Project each independent HTML panel onto the four corners in the supplied reference.
function project(el) {
 const points=el.dataset.plane.split(' ').map(p=>p.split(',').map(Number));
 const [w,h]=el.dataset.size.split(',').map(Number);
 el.style.width=w+'px';el.style.height=h+'px';
 const src=[[0,0],[w,0],[w,h],[0,h]], A=[],B=[];
 src.forEach(([x,y],i)=>{const [u,v]=points[i];A.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);B.push(u,v)});
 for(let i=0;i<8;i++){let best=i;for(let j=i+1;j<8;j++)if(Math.abs(A[j][i])>Math.abs(A[best][i]))best=j;[A[i],A[best]]=[A[best],A[i]];[B[i],B[best]]=[B[best],B[i]];const d=A[i][i];for(let k=i;k<8;k++)A[i][k]/=d;B[i]/=d;for(let j=0;j<8;j++)if(j!==i){const m=A[j][i];for(let k=i;k<8;k++)A[j][k]-=m*A[i][k];B[j]-=m*B[i]}}
 const [a,b,c,d,e,f,g,k]=B;el.style.transform=`matrix3d(${a},${d},0,${g},${b},${e},0,${k},0,0,1,0,${c},${f},0,1)`;
}
document.querySelectorAll('.plane').forEach(project);
function resize(){if(matchMedia('(max-width:700px) and (orientation:portrait)').matches)return;const s=Math.min(innerWidth/2048,innerHeight/925);stage.style.transform=`scale(${s})`;stage.style.margin=`${(925*s-925)/2}px ${(2048*s-2048)/2}px`}
addEventListener('resize',resize);resize();
const initial={credits:619348,orundum:5660,originite:2,sanity:180,deliveries:5};
let state={...initial};
function sync(){document.querySelectorAll('[data-value]').forEach(el=>el.textContent=state[el.dataset.value]);}
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2800)}
const titles={terminal:['TERMINAL','终端'],sanity:['SANITY','理智恢复'],squads:['SQUADS','编队'],operators:['OPERATOR','干员'],store:['STORE','采购中心'],recruit:['RECRUITMENT','公开招募'],headhunt:['HEADHUNTING','干员寻访'],missions:['MISSION','任务'],base:['BASE','基建'],warehouse:['DEPOT','仓库'],settings:['SETTINGS','设置'],wallet:['RESOURCES','资源'],profile:['PROFILE','个人资料'],mail:['MAIL','邮件'],calendar:['EVENT','星语共愿'],announcements:['INFORMATION','公告'],friends:['FRIENDS','好友'],archives:['ARCHIVES','档案'],news:['NEW ARRIVALS','新装限时上架'],scenery:['SCENERY','场景鉴赏'],'event-exodus':['EXODUS','出苍白海'],'event-unrealized':['UNREALIZED','未许之地']};
function openPanel(key){const title=titles[key];if(!title)return;document.querySelector('#panel-kicker').textContent=title[0]+' / PIONEER PROJECT';document.querySelector('#panel-title').textContent=title[1];dialog.dataset.view=key;renderPanel(key);if(!dialog.open)dialog.showModal();content.scrollTop=0;}
function closePanel(){dialog.close()}
document.querySelector('#close-panel').addEventListener('click',closePanel);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openPanel(b.dataset.open);const a=e.target.closest('[data-action]');if(a)action(a.dataset.action,a)});
const stats=()=>`<div class="stat-strip"><div class="stat-block"><span>龙门币</span><strong>${state.credits}</strong></div><div class="stat-block"><span>合成玉</span><strong>${state.orundum}</strong></div><div class="stat-block"><span>至纯源石</span><strong>${state.originite}</strong></div></div>`;
function renderPanel(key){
 switch(key){
 case 'sanity':content.innerHTML=`<div class="stat-strip"><div class="stat-block"><span>当前理智</span><strong>${state.sanity}<small> / 180</small></strong></div><div class="stat-block"><span>至纯源石</span><strong>${state.originite}</strong></div></div><p class="modal-lead">消耗 1 至纯源石，恢复 135 点理智。恢复后可超过理智上限。</p><div class="action-row"><p>理智会在进入作战时消耗。</p><button class="action-button" data-action="restore" ${state.originite<1?'disabled':''}>确认恢复 · 1 源石</button></div>`;break;
 case 'wallet':content.innerHTML=stats()+`<p class="modal-lead">龙门币用于采购，合成玉用于干员寻访，至纯源石可用于恢复理智。</p><div class="action-row"><button class="action-button secondary" data-open="store">前往采购中心</button><button class="action-button" data-open="headhunt">前往干员寻访</button></div>`;break;
 case 'terminal':renderTerminal();break;
 case 'squads':renderSquads();break;
 case 'operators':renderOperators();break;
 case 'store':renderStore();break;
 case 'recruit':renderRecruit();break;
 case 'headhunt':renderHeadhunt();break;
 case 'missions':renderMissions();break;
 case 'base':renderBase();break;
 case 'warehouse':renderWarehouse();break;
 case 'settings':content.innerHTML=`<div class="setting-row"><label for="sound">交互音效<small>按钮点击时播放轻微提示音</small></label><input type="checkbox" id="sound" ${settings.sound?'checked':''}></div><div class="setting-row"><label for="motion">界面动效<small>卡片反馈与面板切换</small></label><input type="checkbox" id="motion" ${settings.motion?'checked':''}></div><div class="action-row"><p>演示进度仅保留在当前页面中。</p><button class="action-button secondary" data-action="reset">重置演示进度</button></div>`;document.querySelector('#sound').onchange=e=>{settings.sound=e.target.checked;saveSettings()};document.querySelector('#motion').onchange=e=>{settings.motion=e.target.checked;saveSettings()};break;
 case 'profile':content.innerHTML=`<div class="stat-strip"><div class="stat-block"><span>DOCTOR</span><strong>秋雨巫女</strong></div><div class="stat-block"><span>LEVEL</span><strong>120</strong></div></div><p class="modal-lead">ID: 208375938<br>愿主保佑，博士。</p><button class="action-button" data-action="copy-id">复制博士 ID</button>`;break;
 case 'scenery':content.innerHTML=`<div class="tabs"><button class="tab" data-action="scenery" data-src="observatory-day" aria-selected="true">天光</button><button class="tab" data-action="scenery" data-src="observatory-night" aria-selected="false">星轨</button></div><img class="scenery-preview" src="assets/observatory-day.webp" alt="白昼中的孤星天文观测室">`;break;
 case 'calendar':renderCalendar();break;
 case 'mail':renderMail();break;
 case 'announcements':content.innerHTML=`<div class="list-row"><div><h3>星语共愿 · 纪念活动</h3><p>每日签到，领取龙门币与养成材料。</p></div><button class="action-button" data-open="calendar">前往</button></div><div class="list-row"><div><h3>采购中心 · 新装上架</h3><p>查看本期陈列与物资。</p></div><button class="action-button" data-open="store">查看</button></div>`;break;
 case 'friends':content.innerHTML=`<div class="empty-message">暂无好友记录</div><p class="modal-lead">博士 ID：208375938</p><button class="action-button" data-action="copy-id">复制博士 ID</button>`;break;
 case 'archives':content.innerHTML=`<div class="cards"><button class="data-card" data-open="operators"><span class="index">01 / PERSONNEL</span><h3>干员档案</h3><p>查看已收录的干员与职业。</p></button><button class="data-card" data-open="scenery"><span class="index">02 / SCENERY</span><h3>场景档案</h3><p>天光与星轨。</p></button><button class="data-card" data-open="profile"><span class="index">03 / DOCTOR</span><h3>博士档案</h3><p>秋雨巫女 · LV.120</p></button></div>`;break;
 case 'news':content.innerHTML=`<p class="modal-lead">BREAKING NEWS / 新装限时上架</p><div class="result-box"><span class="stars">NEW ARRIVALS</span><strong>时代系列</strong><p>本期陈列已更新。</p></div><div class="action-row"><button class="action-button" data-open="store">进入采购中心</button></div>`;break;
 case 'event-exodus':case 'event-unrealized':content.innerHTML=`<div class="event-art ${key==='event-unrealized'?'unrealized-art':''}" role="img" aria-label="${titles[key][1]}活动插画"></div><p class="modal-lead">${titles[key][1]} · 活动终端</p><div class="action-row"><p>活动入口已开放</p><button class="action-button" data-action="event-terminal">进入活动作战</button></div>`;break;
 }
}
const operators=[{name:'能天使',en:'EXUSIAI',job:'狙击',stars:6,lv:90},{name:'银灰',en:'SILVERASH',job:'近卫',stars:6,lv:90},{name:'阿米娅',en:'AMIYA',job:'术师',stars:5,lv:80},{name:'白面鸮',en:'PTILOPSIS',job:'医疗',stars:5,lv:80},{name:'德克萨斯',en:'TEXAS',job:'先锋',stars:5,lv:80},{name:'星熊',en:'HOSHIGUMA',job:'重装',stars:6,lv:90}];
let activeSquad=0, squads=[[0,1,2,3],[4,1,2,3],[4,5,0,3],[0,2,4,5]],editingSlot=-1;
function renderSquads(){content.innerHTML=`<div class="tabs" role="tablist" aria-label="编队选择">${[1,2,3,4].map((n,i)=>`<button class="tab" role="tab" aria-selected="${activeSquad===i}" data-action="squad-tab" data-id="${i}">编队 ${n}</button>`).join('')}</div><div class="squad-slots">${squads[activeSquad].map((id,i)=>`<button class="squad-slot" data-action="edit-slot" data-id="${i}" aria-label="更换第 ${i+1} 位干员 ${operators[id].name}"><span>${String(i+1).padStart(2,'0')}</span><b>${operators[id].name}</b><small>${operators[id].job} / LV.${operators[id].lv}</small></button>`).join('')}</div><div class="action-row"><p>点击干员位置可更换编队成员。</p><button class="action-button" data-action="save-squad">保存编队</button></div><div id="squad-picker"></div>`}
function renderOperators(){content.innerHTML=`<div class="search-field"><input id="operator-search" type="search" placeholder="搜索干员" aria-label="搜索干员"><select id="operator-class" aria-label="筛选职业"><option>全部职业</option>${['先锋','近卫','重装','狙击','术师','医疗'].map(n=>`<option>${n}</option>`).join('')}</select></div><div class="cards" id="operator-list"></div>`;const update=()=>{const q=document.querySelector('#operator-search').value.toLowerCase(),job=document.querySelector('#operator-class').value;const rows=operators.filter(o=>(o.name.includes(q)||o.en.toLowerCase().includes(q))&&(job==='全部职业'||o.job===job));document.querySelector('#operator-list').innerHTML=rows.length?rows.map(o=>`<button class="data-card" data-action="operator-detail" data-id="${operators.indexOf(o)}"><div class="operator-portrait"><span>${o.en.slice(0,2)}</span></div><span class="stars">${'★'.repeat(o.stars)}</span><h3>${o.name}</h3><p>${o.job} · 精英 2 · LV.${o.lv}</p></button>`).join(''):'<p class="empty-message">没有匹配的干员</p>'};document.querySelector('#operator-search').oninput=update;document.querySelector('#operator-class').onchange=update;update()}
let terminalTab=0,selectedStage=0,completedStages=new Set();
const stageGroups=[[['0-1','坍塌','主线作战'],['1-7','暴君','主线作战'],['2-10','不治之症','主线作战']],[['CE-6','机密情报押运','龙门币'],['LS-6','机动卫队','作战记录'],['AP-5','粉碎防御','采购凭证']],[['EX-1','出苍白海','活动作战'],['UR-1','未许之地','活动作战'],['EX-2','远方的回响','活动作战']]];
function renderTerminal(){content.innerHTML=`<div class="tabs" role="tablist" aria-label="作战类型">${['主线作战','资源收集','活动作战'].map((n,i)=>`<button class="tab" role="tab" aria-selected="${i===terminalTab}" data-action="terminal-tab" data-id="${i}">${n}</button>`).join('')}</div><div class="cards">${stageGroups[terminalTab].map((s,i)=>`<button class="data-card ${selectedStage===i?'selected':''}" aria-pressed="${selectedStage===i}" data-action="select-stage" data-id="${i}"><span class="index">${s[0]}</span><h3>${s[1]}</h3><p>${s[2]}<br>理智消耗 10</p>${completedStages.has(s[0])?'<span class="badge">已完成</span>':''}</button>`).join('')}</div><div class="action-row"><p>当前理智 ${state.sanity} / 180</p><button class="action-button" data-action="start-operation" ${state.sanity<10?'disabled':''}>开始演示作战 →</button></div>`}
const inventory=[{name:'基础作战记录',en:'BATTLE RECORD',count:128,price:2000},{name:'赤金',en:'PURE GOLD',count:64,price:1500},{name:'技巧概要·卷1',en:'SKILL SUMMARY',count:36,price:1000},{name:'招聘许可',en:'RECRUITMENT PERMIT',count:12,price:3000}];
function renderStore(){content.innerHTML=stats()+`<div class="cards">${inventory.map((p,i)=>`<div class="data-card"><span class="index">${p.en}</span><h3>${p.name}</h3><p>库存 ${p.count}</p><div class="action-row"><button class="action-button" data-action="buy" data-id="${i}" ${state.credits<p.price?'disabled':''}>${p.price} 龙门币</button></div></div>`).join('')}</div>`}
function renderWarehouse(){content.innerHTML=`<div class="cards">${inventory.map((p,i)=>`<div class="data-card"><span class="index">MATERIAL / 0${i+1}</span><h3>${p.name}</h3><p>${p.en}</p><b class="inventory-count">× ${p.count}</b></div>`).join('')}</div>`}
let tags=[],recruitHours=9,recruitStatus='idle';
function renderRecruit(){content.innerHTML=`<p class="modal-lead">选择至多 3 个招募标签，并设置招募时间。</p><div class="tag-list">${['近战位','远程位','输出','防护','治疗','支援'].map(t=>`<button class="tag" aria-pressed="${tags.includes(t)}" data-action="tag" data-tag="${t}" ${recruitStatus!=='idle'?'disabled':''}>${t}</button>`).join('')}</div><div class="range-row"><label for="recruit-hours">招募时间</label><input id="recruit-hours" type="range" min="1" max="9" value="${recruitHours}" ${recruitStatus!=='idle'?'disabled':''}><output for="recruit-hours">${recruitHours}:00:00</output></div><div class="action-row"><p>招聘许可 ${inventory[3].count} · 消耗 500 龙门币</p><button class="action-button" data-action="${recruitStatus==='recruiting'?'finish-recruit':'start-recruit'}" ${(recruitStatus==='idle'&&(inventory[3].count<1||state.credits<500))?'disabled':''}>${recruitStatus==='recruiting'?'查看演示招募结果':'开始招募'}</button></div>${recruitStatus==='recruiting'?'<p class="section-label">招募中 · 可直接查看演示结果</p>':''}`;document.querySelector('#recruit-hours').oninput=e=>{recruitHours=Number(e.target.value);content.querySelector('output').textContent=recruitHours+':00:00'}}
let headhuntCount=0;
function renderHeadhunt(){content.innerHTML=`<div class="result-box"><span class="stars">PIONEER PROJECT</span><strong>标准寻访</strong><p>每次寻访消耗 600 合成玉</p></div><div class="action-row"><p>持有合成玉 ${state.orundum}</p><button class="action-button" data-action="pull" ${state.orundum<600?'disabled':''}>寻访一次 · 600 合成玉</button></div><div id="pull-result"></div>`}
const missions=[{name:'与罗德岛同行',desc:'登录主界面',reward:1000,done:true,claimed:false},{name:'整装待发',desc:'保存任意一支编队',reward:2000,done:false,claimed:false},{name:'完成一次作战',desc:'在终端完成一次演示作战',reward:3000,done:false,claimed:false}];
function renderMissions(){content.innerHTML=`<div class="tabs"><button class="tab" aria-selected="true">每日任务</button><span class="section-label">${missions.filter(m=>m.claimed).length} / ${missions.length} 已领取</span></div>${missions.map((m,i)=>`<div class="list-row"><div><h3>${m.name}</h3><p>${m.desc}</p><span class="reward">龙门币 × ${m.reward}</span></div><button class="action-button" data-action="claim" data-id="${i}" ${!m.done||m.claimed?'disabled':''}>${m.claimed?'已领取':m.done?'领取':'未完成'}</button></div>`).join('')}`}
function renderBase(){content.innerHTML=`<div class="stat-strip"><div class="stat-block"><span>待收取订单</span><strong>${state.deliveries}</strong></div><div class="stat-block"><span>预计收益 / 龙门币</span><strong>${state.deliveries*1200}</strong></div></div><div class="cards"><div class="data-card"><span class="index">TRADING POST</span><h3>贸易站</h3><p>${state.deliveries?'订单已完成，等待收取。':'所有订单已收取。'}</p><span class="badge">运转中</span></div><div class="data-card"><span class="index">FACTORY</span><h3>制造站</h3><p>赤金生产线运转正常。</p><span class="badge">运转中</span></div><div class="data-card"><span class="index">POWER PLANT</span><h3>发电站</h3><p>电力供应充足。</p><span class="badge">运转中</span></div></div><div class="action-row"><p>收取后，龙门币将计入资源。</p><button class="action-button" data-action="collect" ${!state.deliveries?'disabled':''}>收取全部产物</button></div>`}
let signed=false,mailClaimed=false;
function renderCalendar(){content.innerHTML=`<p class="modal-lead">星语共愿纪念活动 · 七日签到</p><div class="calendar-grid">${[1,2,3,4,5,6,7].map(n=>`<div class="calendar-day ${n===1&&signed?'checked':''}">DAY ${String(n).padStart(2,'0')}<b>${n===7?'2000':'500'}</b>龙门币</div>`).join('')}</div><div class="action-row"><p>${signed?'今日奖励已领取。':'今日可领取 500 龙门币。'}</p><button class="action-button" data-action="sign" ${signed?'disabled':''}>${signed?'已签到':'今日签到'}</button></div>`}
function renderMail(){content.innerHTML=`<div class="list-row"><div><h3>罗德岛物资补给</h3><p>博士，请查收本日物资。<br>龙门币 × 1000</p></div><button class="action-button" data-action="mail" ${mailClaimed?'disabled':''}>${mailClaimed?'已领取':'领取附件'}</button></div>`}
const settings={sound:false,motion:!matchMedia('(prefers-reduced-motion:reduce)').matches};
try{const saved=JSON.parse(localStorage.getItem('lone-star-settings')||'null');if(saved&&typeof saved.sound==='boolean')settings.sound=saved.sound;if(saved&&typeof saved.motion==='boolean')settings.motion=saved.motion}catch{}
function saveSettings(){document.body.classList.toggle('reduce-motion',!settings.motion);try{localStorage.setItem('lone-star-settings',JSON.stringify(settings))}catch{}}
saveSettings();let audioContext;
document.addEventListener('click',e=>{if(!settings.sound||!e.target.closest('button'))return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.connect(gain);gain.connect(audioContext.destination);osc.frequency.setValueAtTime(830,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(420,audioContext.currentTime+.055);gain.gain.setValueAtTime(.025,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.07);osc.start();osc.stop(audioContext.currentTime+.07)}catch{}});
let quoteIndex=0;
function action(name,el){
 switch(name){
 case 'restore':if(state.originite<1)return;state.originite--;state.sanity+=135;sync();renderPanel('sanity');toast('理智已恢复 +135');break;
 case 'terminal-tab':terminalTab=Number(el.dataset.id);selectedStage=0;renderTerminal();break;
 case 'select-stage':selectedStage=Number(el.dataset.id);renderTerminal();break;
 case 'start-operation':if(state.sanity<10)return;state.sanity-=10;state.credits+=500;completedStages.add(stageGroups[terminalTab][selectedStage][0]);missions[2].done=true;sync();renderTerminal();toast('作战完成 · 理智 −10 · 龙门币 +500');break;
 case 'event-terminal':terminalTab=2;selectedStage=dialog.dataset.view==='event-unrealized'?1:0;openPanel('terminal');break;
 case 'squad-tab':activeSquad=Number(el.dataset.id);editingSlot=-1;renderSquads();break;
 case 'edit-slot':editingSlot=Number(el.dataset.id);document.querySelector('#squad-picker').innerHTML=`<p class="section-label">选择第 ${editingSlot+1} 位干员</p><div class="tag-list">${operators.map((o,i)=>`<button class="tag" data-action="pick-operator" data-id="${i}" ${squads[activeSquad].includes(i)&&squads[activeSquad][editingSlot]!==i?'disabled':''}>${o.name}</button>`).join('')}</div>`;break;
 case 'pick-operator':squads[activeSquad][editingSlot]=Number(el.dataset.id);editingSlot=-1;renderSquads();break;
 case 'save-squad':missions[1].done=true;toast('编队 '+(activeSquad+1)+' 已保存');break;
 case 'operator-detail':{const o=operators[Number(el.dataset.id)];content.innerHTML=`<div class="stat-strip"><div class="stat-block"><span>${o.en}</span><strong>${o.name}</strong></div><div class="stat-block"><span>${o.job} / 精英 2</span><strong>LV.${o.lv}</strong></div></div><span class="stars">${'★'.repeat(o.stars)}</span><div class="action-row"><button class="action-button secondary" data-open="operators">返回干员列表</button><button class="action-button" data-open="squads">前往编队</button></div>`;break;}
 case 'buy':{const p=inventory[Number(el.dataset.id)];if(state.credits<p.price)return;state.credits-=p.price;p.count++;sync();renderStore();toast(p.name+' ×1 已加入仓库');break;}
 case 'tag':if(tags.includes(el.dataset.tag))tags=tags.filter(t=>t!==el.dataset.tag);else if(tags.length<3)tags.push(el.dataset.tag);else{toast('最多可选择 3 个招募标签');return}renderRecruit();break;
 case 'start-recruit':if(state.credits<500||inventory[3].count<1||recruitStatus!=='idle')return;state.credits-=500;inventory[3].count--;recruitStatus='recruiting';sync();renderRecruit();toast('公开招募已开始');break;
 case 'finish-recruit':recruitStatus='idle';content.innerHTML=`<div class="result-box"><span class="stars">★★★★</span><strong>${tags.includes('治疗')?'调香师':tags.includes('防护')?'蛇屠箱':'白雪'}</strong><p>演示招募完成</p></div><div class="action-row"><button class="action-button" data-open="recruit">返回招募</button></div>`;break;
 case 'pull':if(state.orundum<600)return;state.orundum-=600;sync();renderHeadhunt();{const o=operators[[4,3,0][headhuntCount++%3]];document.querySelector('#pull-result').innerHTML=`<div class="result-box" style="margin-top:22px"><span class="stars">${'★'.repeat(o.stars)}</span><strong>${o.name}</strong><p>${o.job} · 演示寻访结果</p></div>`;}break;
 case 'claim':{const m=missions[Number(el.dataset.id)];if(m.claimed||!m.done)return;m.claimed=true;state.credits+=m.reward;sync();renderMissions();toast('奖励已领取 · 龙门币 +'+m.reward);break;}
 case 'collect':if(!state.deliveries)return;{const reward=state.deliveries*1200;state.credits+=reward;state.deliveries=0;sync();renderBase();toast('产物已收取 · 龙门币 +'+reward);}break;
 case 'sign':if(signed)return;signed=true;state.credits+=500;sync();renderCalendar();toast('签到成功 · 龙门币 +500');break;
 case 'mail':if(mailClaimed)return;mailClaimed=true;state.credits+=1000;sync();renderMail();toast('附件已领取 · 龙门币 +1000');break;
 case 'copy-id':if(navigator.clipboard)navigator.clipboard.writeText('208375938').then(()=>toast('博士 ID 已复制')).catch(()=>toast('博士 ID：208375938'));else toast('博士 ID：208375938');break;
 case 'scenery':content.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',String(b===el)));content.querySelector('img').src='assets/'+el.dataset.src+'.webp';content.querySelector('img').alt=el.dataset.src.endsWith('day')?'白昼中的孤星天文观测室':'星轨之下的孤星天文观测室';break;
 case 'quote':{const quotes=['愿主保佑，博士。','博士，今日的工作已经准备好了。','雪停之后，一起出去走走吧。'];quoteIndex=(quoteIndex+1)%quotes.length;const line=document.querySelector('#voice-line');line.hidden=false;line.textContent=quotes[quoteIndex];break;}
 case 'reset':state={...initial};missions.forEach((m,i)=>{m.claimed=false;m.done=i===0});[128,64,36,12].forEach((n,i)=>inventory[i].count=n);completedStages.clear();signed=false;mailClaimed=false;recruitStatus='idle';tags=[];recruitHours=9;headhuntCount=0;squads=[[0,1,2,3],[4,1,2,3],[4,5,0,3],[0,2,4,5]];activeSquad=0;quoteIndex=0;document.querySelector('#voice-line').hidden=true;sync();toast('演示进度已重置');break;
 }
}
sync();
// Exclude the mirrored decorative title from the control's accessible name.
document.querySelectorAll('.tile[data-open],.store-tile').forEach(el=>el.setAttribute('aria-label',titles[el.dataset.open][1]));
document.addEventListener('keydown',e=>{
 const current=e.target.closest('[role="tablist"] [role="tab"]');
 if(!current||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();
 const tabs=[...current.parentElement.querySelectorAll('[role="tab"]')],index=tabs.indexOf(current);
 const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 const actionName=tabs[next].dataset.action,id=tabs[next].dataset.id;
 tabs[next].click();
 content.querySelector(`[data-action="${actionName}"][data-id="${id}"]`)?.focus();
});
