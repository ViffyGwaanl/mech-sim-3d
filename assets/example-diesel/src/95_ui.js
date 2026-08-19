/* ==================================================================== 界面层 */
const $=id=>document.getElementById(id);
const card=$('card');
let ACTIVE=PICKABLE.slice();
function chainVisible(o){ let p=o; while(p){ if(p.visible===false) return false; p=p.parent; } return true; }
function rebuildPick(){ ACTIVE=PICKABLE.filter(chainVisible); }

/* ---------------- 系统显隐列表 ---------------- */
(function sysList(){
  const box=$('sysList');
  const order=['fixed','crank','valve','fuel','oil','cool','air','fast'];
  const cnt={};
  PICKABLE.forEach(m=>{ const s=DB[m.userData.partId]; if(s) cnt[s.sys]=(cnt[s.sys]||0)+1; });
  order.forEach(k=>{
    const G=GROUPS[k]; if(!G) return;
    const d=document.createElement('div'); d.className='tog on'; d.dataset.k=k;
    d.innerHTML='<i></i><span class="swatch" style="background:'+G.color+'"></span>'+G.label+'<em>'+(cnt[k]||0)+'</em>';
    d.onclick=()=>{ G.vis=!G.vis; G.g.visible=G.vis; d.classList.toggle('on',G.vis); rebuildPick(); };
    box.appendChild(d);
  });
  const d2=document.createElement('div'); d2.className='tog on';
  d2.innerHTML='<i></i><span class="swatch" style="background:#4dc98a"></span>流动示意体（水套/油道/气道）';
  d2.onclick=()=>{ const v=!d2.classList.contains('on'); d2.classList.toggle('on',v);
    [MAT.water,MAT.oilv,MAT.airv,MAT.gasv,MAT.fuelv].forEach(m=>m.visible=v); };
  box.appendChild(d2);
})();

/* ---------------- 图例 ---------------- */
$('legend').innerHTML=
  '<div class="col"><div class="li" style="color:#c8d3de;font-size:9px;letter-spacing:.12em">介质流向 MEDIA</div>'+
  [['rgb(70,170,255)','冷却液 Coolant','82→95℃'],['rgb(255,170,50)','机油 Oil','2.5–4.5 bar'],
   ['rgb(90,210,245)','增压空气 Charge Air','0–1.6 bar'],['rgb(255,95,70)','废气 Exhaust','450–750℃']]
  .map(([c,a,b])=>'<div class="li"><i style="background:'+c+'"></i>'+a+' <u>'+b+'</u></div>').join('')+'</div>'+
  '<div class="col"><div class="li" style="color:#c8d3de;font-size:9px;letter-spacing:.12em">冲程 STROKE</div>'+
  STROKES.map(s=>'<div class="li"><i style="background:'+s.c+'"></i>'+s.n+' <u>'+s.e+'</u></div>').join('')+'</div>'+
  '<div class="col"><div class="li" style="color:#c8d3de;font-size:9px;letter-spacing:.12em">材质 MATERIAL</div>'+
  [['#585e66','铸铁 Cast Iron'],['#b6bcc3','铝合金 Aluminium'],['#d3d9df','磨削钢 Ground Steel'],
   ['#c78a4e','轴瓦合金 Bearing Alloy'],['#14161a','橡胶 Rubber']]
  .map(([c,a])=>'<div class="li"><i style="background:'+c+';height:9px;width:9px;border-radius:2px"></i>'+a+'</div>').join('')+'</div>';

/* ---------------- 四缸相位条 ---------------- */
(function cylBars(){
  const b=$('cyls');
  b.innerHTML=[0,1,2,3].map(i=>'<div class="cylrow"><b>'+(i+1)+'缸</b><div class="cylbar">'+
    STROKES.map(s=>'<span style="background:'+s.c+'33"></span>').join('')+
    '<i id="cm'+i+'"></i></div><u id="cs'+i+'">—</u></div>').join('')+
    '<div style="font-family:var(--mono);font-size:8.5px;color:var(--tx3);margin-top:3px;display:flex;justify-content:space-between"><span>0°</span><span>180</span><span>360</span><span>540</span><span>720°</span></div>';
})();

/* ---------------- 控件 ---------------- */
function bindRange(id,vid,fmt,set){
  const el=$(id), v=$(vid);
  const upd=()=>{ el.style.setProperty('--p', ((el.value-el.min)/(el.max-el.min)*100)+'%'); v.textContent=fmt(+el.value); set(+el.value); };
  el.addEventListener('input',upd); upd(); return el;
}
const rRpm=bindRange('sRpm','vRpm',v=>v+' r/min',v=>ST.rpm=v);
const rLoad=bindRange('sLoad','vLoad',v=>v+' %',v=>ST.load=v);
const rTime=bindRange('sTime','vTime',v=>(v/100).toFixed(2)+' ×',v=>ST.timeScale=v/100);
const rAng=bindRange('sAng','vAng',v=>v+' °',v=>{ if(!ST.play) ST.theta=v; });
const rClip=bindRange('sClip','vClip',v=>v+' mm',v=>{ST.clipPos=v; applyClip();});
const rExp=bindRange('sExp','vExp',v=>v+' %',v=>ST.explode=v/100);
$('sAng').addEventListener('pointerdown',()=>{ if(ST.play) togglePlay(); });

function togglePlay(){ ST.play=!ST.play; $('bPlay').textContent=ST.play?'⏸ 暂停':'▶ 播放'; $('bPlay').classList.toggle('on',ST.play); }
$('bPlay').onclick=togglePlay;
$('bStep').onclick=()=>{ if(ST.play) togglePlay(); ST.theta=(ST.theta+5)%720; syncAng(); };
function syncAng(){ rAng.value=ST.theta; rAng.style.setProperty('--p',(ST.theta/720*100)+'%'); $('vAng').textContent=Math.round(ST.theta)+' °'; }

function tog(id,key,cb){ const el=$(id);
  el.classList.toggle('on',!!ST[key]);
  el.onclick=()=>{ ST[key]=!ST[key]; el.classList.toggle('on',ST[key]); cb&&cb(ST[key]); }; return el; }
tog('tClip','clip',applyClip);
tog('tGhost','ghost',applyGhost);
tog('tFlow','flow');
tog('tPath','paths');
tog('tShadow','shadow',v=>{ renderer.shadowMap.enabled=v; scene.traverse(o=>{if(o.isMesh)o.castShadow=v&&!o.userData.noShadow;}); });
tog('tGrid','grid',v=>{ ground.visible=v; });
tog('tLabels','labels',v=>{ LABELS.forEach(l=>l.visible=v); });
tog('tRot','autoRot');
tog('tInvX','invX');
tog('tInvY','invY');
tog('tInvZoom','invZoom');

function applyClip(){ CLIP.constant = ST.clip ? ST.clipPos*S : 1000; $('rClip').style.opacity=ST.clip?1:.35; }
function applyGhost(){
  OUTER.forEach(m=>{ if(ST.ghost){ m.transparent=true; m.opacity=.24; m.depthWrite=false; }
                     else { m.transparent=m.userData.base.tr; m.opacity=m.userData.base.op; m.depthWrite=true; }
                     m.needsUpdate=true; });
}
applyClip();

/* ---------------- 视角预设 ---------------- */
const VIEWS={
  free   :{t:[-1.2,1.1,0], r:18.0,p:1.16, h:0.86, clip:false},
  side   :{t:[-1.0,1.2,0], r:16.5,p:1.545,h:Math.PI, clip:false},
  top    :{t:[-1.4,1.4,0], r:16.5,p:0.17, h:0.62, clip:false},
  front  :{t:[-2.0,1.3,0],r:15.5, p:1.30, h:-0.90, clip:false},
  section:{t:[-0.4,1.5,0], r:13.0,p:1.34, h:0.26, clip:true,  cp:6},
  valve  :{t:[0,4.3,0],   r:8.4,  p:1.32, h:0.62, clip:true,  cp:6},
  crank  :{t:[0,0.5,0],   r:10.0, p:1.44, h:0.42, clip:true,  cp:46},
  turbo  :{t:[3.4,3.4,-2.3],r:9.0,p:1.22, h:-2.30,clip:false}
};
function setView(k,snap){
  const v=VIEWS[k]||VIEWS.free; ST.view=k;
  if(v.clip!==undefined && v.clip!==ST.clip){ ST.clip=v.clip; $('tClip').classList.toggle('on',ST.clip); }
  if(v.cp!==undefined){ ST.clipPos=v.cp; rClip.value=v.cp; rClip.style.setProperty('--p',((v.cp+100)/220*100)+'%'); $('vClip').textContent=v.cp+' mm'; }
  applyClip();
  controls.fly(new T.Vector3(v.t[0],v.t[1],v.t[2]), v.r, v.p, v.h);
  if(snap){ controls._fly=null;
    controls.tTarget.set(v.t[0],v.t[1],v.t[2]); controls.target.copy(controls.tTarget);
    controls.tSph.set(v.r,v.p,v.h); controls.sph.copy(controls.tSph); controls.update(); }
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===k));
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));

/* ---------------- 爆炸图 ---------------- */
function applyExplode(){
  const t=ST.explode;
  for(const e of EXP){ e.o.position.set(e.b.x+e.v.x*t, e.b.y+e.v.y*t, e.b.z+e.v.z*t); }
}

/* ---------------- 拾取与信息卡 ---------------- */
const ray=new T.Raycaster(); ray.params.Points.threshold=0.05;
const mouse=new T.Vector2(-9,-9); let mx=0,my=0, hovering=null, hoverMat=null, savedMat=null;
renderer.domElement.addEventListener('pointermove',e=>{
  mx=e.clientX; my=e.clientY;
  mouse.x=(e.clientX/innerWidth)*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
});
renderer.domElement.addEventListener('pointerleave',()=>{ mouse.set(-9,-9); });
renderer.domElement.addEventListener('dblclick',()=>{
  if(!hovering) return;
  const b=new T.Box3().setFromObject(hovering), c=b.getCenter(new T.Vector3());
  const size=b.getSize(new T.Vector3()).length();
  controls.fly(c, clamp(size*1.9,1.1,14), controls.tSph.phi, controls.tSph.theta, 700);
});
const HLCACHE=new Map();
function highlight(m){
  if(hovering===m) return;
  if(hovering && savedMat){ hovering.material=savedMat; }
  hovering=m; savedMat=null;
  if(!m) return;
  savedMat=m.material;
  let hm=HLCACHE.get(m.material.uuid);
  if(!hm){ hm=m.material.clone(); hm.emissive=new T.Color(0x1d7f8c); hm.emissiveIntensity=1.0;
           hm.clippingPlanes=m.material.clippingPlanes; HLCACHE.set(m.material.uuid,hm); }
  m.material=hm;
}
function pick(){
  if(mouse.x<-5){ highlight(null); card.classList.remove('show'); return; }
  ray.setFromCamera(mouse,camera);
  const hits=ray.intersectObjects(ACTIVE,false);
  let h=null;
  for(const it of hits){ if(chainVisible(it.object) && it.object.userData.partId && DB[it.object.userData.partId]){ h=it.object; break; } }
  if(!h){ highlight(null); card.classList.remove('show'); return; }
  if(h!==hovering){ highlight(h); renderCard(h); }
  else updateState(h);
  card.classList.add('show');
  const w=card.offsetWidth||322, hh=card.offsetHeight||260;
  card.style.left=Math.min(mx+18, innerWidth-w-12)+'px';
  card.style.top =Math.min(Math.max(12,my-40), innerHeight-hh-12)+'px';
}
function renderCard(m){
  const id=m.userData.partId, d=DB[id]; if(!d) return;
  const sy=SYSNAME[d.sys]||['—','#888'];
  card.innerHTML=
   '<div class="hd"><div class="nz">'+d.zh+'</div><div class="ne">'+d.en+'</div>'+
   '<span class="sys" style="background:'+sy[1]+'22;border:1px solid '+sy[1]+'55;color:'+sy[1]+'">'+sy[0]+'</span></div>'+
   '<div class="bd">'+
   '<div class="sec"><div class="lb">材料与制造工艺 MATERIAL & PROCESS</div><div class="tx">'+d.mat+'</div></div>'+
   '<div class="sec"><div class="lb">功能 FUNCTION</div><div class="tx">'+d.fn+'</div></div>'+
   '<div class="sec"><div class="lb">关键设计参数 KEY PARAMETERS</div><dl class="kv">'+
     d.ps.map(p=>'<dt>'+p[0]+'</dt><dd>'+p[1]+'</dd>').join('')+'</dl></div>'+
   '<div class="sec"><div class="lb">当前运动 / 工作状态 LIVE STATE</div><div class="st" id="cst">—</div></div></div>';
  updateState(m);
}
function updateState(m){
  const d=DB[m.userData.partId]; const el=$('cst'); if(!el||!d||!d.st) return;
  try{ el.innerHTML=d.st(m.userData); }catch(e){ el.textContent='—'; }
}

/* ---------------- 仪表绘制 ---------------- */
const dc=$('dial').getContext('2d'), pc=$('pv').getContext('2d');
function drawDial(){
  const W=440,H=176; dc.clearRect(0,0,W,H);
  /* 左：转速表 */
  const cx=108,cy=100,R=76;
  dc.lineWidth=9; dc.lineCap='round';
  dc.strokeStyle='rgba(255,255,255,.07)'; dc.beginPath(); dc.arc(cx,cy,R,Math.PI*0.78,Math.PI*2.22); dc.stroke();
  const a0=Math.PI*0.78, a1=Math.PI*2.22, u=clamp(ST.rpm/2800,0,1);
  const gd=dc.createLinearGradient(cx-R,0,cx+R,0); gd.addColorStop(0,'#33c7d6'); gd.addColorStop(.7,'#7de3ee'); gd.addColorStop(1,'#f0a63c');
  dc.strokeStyle=gd; dc.beginPath(); dc.arc(cx,cy,R,a0,a0+(a1-a0)*u); dc.stroke();
  dc.strokeStyle='rgba(226,86,74,.85)'; dc.lineWidth=4;
  dc.beginPath(); dc.arc(cx,cy,R+9,a0+(a1-a0)*(2500/2800),a1); dc.stroke();
  dc.lineWidth=1.5; dc.strokeStyle='rgba(255,255,255,.28)';
  for(let i=0;i<=7;i++){ const a=a0+(a1-a0)*i/7;
    dc.beginPath(); dc.moveTo(cx+Math.cos(a)*(R-16),cy+Math.sin(a)*(R-16));
    dc.lineTo(cx+Math.cos(a)*(R-8),cy+Math.sin(a)*(R-8)); dc.stroke();
    dc.fillStyle='rgba(160,175,190,.75)'; dc.font='10px ui-monospace,monospace'; dc.textAlign='center';
    dc.fillText(i*4/10+'', cx+Math.cos(a)*(R-28), cy+Math.sin(a)*(R-28)+3); }
  const na=a0+(a1-a0)*u;
  dc.strokeStyle='#eafcff'; dc.lineWidth=2.5; dc.beginPath(); dc.moveTo(cx,cy);
  dc.lineTo(cx+Math.cos(na)*(R-14),cy+Math.sin(na)*(R-14)); dc.stroke();
  dc.fillStyle='#eafcff'; dc.beginPath(); dc.arc(cx,cy,5,0,7); dc.fill();
  dc.textAlign='center'; dc.fillStyle='#e8eef5'; dc.font='600 26px ui-monospace,monospace';
  dc.fillText(Math.round(ST.rpm), cx, cy+42);
  dc.font='9px ui-monospace,monospace'; dc.fillStyle='#5f6f80'; dc.fillText('r/min ×1000', cx, cy+56);
  /* 右：曲轴转角 / 冲程盘 */
  const bx=326,by=88,BR=72;
  for(let k=0;k<4;k++){
    dc.beginPath(); dc.moveTo(bx,by);
    dc.arc(bx,by,BR,-Math.PI/2+k*Math.PI/2,-Math.PI/2+(k+1)*Math.PI/2); dc.closePath();
    dc.fillStyle=STROKES[k].c+'22'; dc.fill();
    dc.strokeStyle='rgba(255,255,255,.08)'; dc.lineWidth=1; dc.stroke();
  }
  const psi=KIN[0].psi, pa=-Math.PI/2+psi/720*Math.PI*2;
  dc.strokeStyle=KIN[0].stroke.c; dc.lineWidth=3;
  dc.beginPath(); dc.moveTo(bx,by); dc.lineTo(bx+Math.cos(pa)*BR,by+Math.sin(pa)*BR); dc.stroke();
  dc.fillStyle='#e8eef5'; dc.beginPath(); dc.arc(bx,by,4,0,7); dc.fill();
  dc.font='600 19px ui-monospace,monospace'; dc.textAlign='center'; dc.fillStyle='#e8eef5';
  dc.fillText(Math.round(ST.theta)+'°', bx, by+BR+28);
  dc.font='10px "PingFang SC",sans-serif'; dc.fillStyle=KIN[0].stroke.c;
  dc.fillText('1缸 '+KIN[0].stroke.n, bx, by+BR+44);
  dc.font='8px ui-monospace,monospace'; dc.fillStyle='#5f6f80';
  dc.fillText('CRANK ANGLE 0–720°', bx, by-BR-8);
}
function drawPV(){
  const W=440,H=240; pc.clearRect(0,0,W,H);
  const L=34,Rr=8,Tp=10,B=26, w=W-L-Rr, h=H-Tp-B;
  for(let k=0;k<4;k++){ pc.fillStyle=STROKES[k].c+'14'; pc.fillRect(L+w*k/4,Tp,w/4,h); }
  pc.strokeStyle='rgba(255,255,255,.10)'; pc.lineWidth=1;
  for(let i=0;i<=5;i++){ const y=Tp+h*i/5; pc.beginPath(); pc.moveTo(L,y); pc.lineTo(L+w,y); pc.stroke();
    pc.fillStyle='#5f6f80'; pc.font='9px ui-monospace,monospace'; pc.textAlign='right';
    pc.fillText(Math.round(180-180*i/5), L-5, y+3); }
  pc.beginPath();
  for(let i=0;i<TRACE.length;i++){ const x=L+w*i/(TRACE.length-1), y=Tp+h*(1-clamp(TRACE[i]/180,0,1));
    i?pc.lineTo(x,y):pc.moveTo(x,y); }
  pc.strokeStyle='#33c7d6'; pc.lineWidth=1.8; pc.stroke();
  pc.lineTo(L+w,Tp+h); pc.lineTo(L,Tp+h); pc.closePath();
  pc.fillStyle='rgba(51,199,214,.10)'; pc.fill();
  const px=L+w*(KIN[0].psi/720);
  pc.strokeStyle='#fff'; pc.lineWidth=1; pc.setLineDash([3,3]);
  pc.beginPath(); pc.moveTo(px,Tp); pc.lineTo(px,Tp+h); pc.stroke(); pc.setLineDash([]);
  const py=Tp+h*(1-clamp(KIN[0].press/180,0,1));
  pc.fillStyle='#fff'; pc.beginPath(); pc.arc(px,py,3.2,0,7); pc.fill();
  pc.fillStyle='#5f6f80'; pc.font='9px ui-monospace,monospace'; pc.textAlign='center';
  ['0','180','360','540','720'].forEach((t,i)=>pc.fillText(t, L+w*i/4, H-9));
  pc.textAlign='left'; pc.fillText('bar', 4, Tp+8);
}
function refreshTrace(){
  CYC=buildCycle(ST.boost,ST.load);
  for(let i=0;i<TRACE.length;i++) TRACE[i]=cylPressure(i/(TRACE.length-1)*720);
  $('pvmax').textContent='p_max '+Math.round(Math.max.apply(null,TRACE))+' bar @ '+
    (TRACE.indexOf(Math.max.apply(null,TRACE))/(TRACE.length-1)*720).toFixed(0)+'°';
}

/* ---------------- 面板刷新 ---------------- */
function meter(id,v,max,dec){ const e=$(id); if(e) e.style.width=clamp(v/max*100,0,100)+'%'; }
function refreshPanel(){
  $('gT').innerHTML=f1(ST.water)+'<small>℃</small>'; meter('mT',ST.water,110);
  $('gP').innerHTML=f1(ST.oil,2)+'<small>bar</small>'; meter('mP',ST.oil,6);
  $('gB').innerHTML=f1(ST.boost,2)+'<small>bar</small>'; meter('mB',ST.boost,2);
  $('gE').innerHTML=Math.round(ST.egt)+'<small>℃</small>'; meter('mE',ST.egt,800);
  $('gC').innerHTML=f1(KIN[0].press)+'<small>bar</small>'; meter('mC',KIN[0].press,180);
  $('gQ').innerHTML=Math.round(ST.torque)+'<small>N·m</small>'; meter('mQ',ST.torque,400);
  for(let i=0;i<4;i++){
    const k=KIN[i]; const m=$('cm'+i), s=$('cs'+i);
    if(m) m.style.left=(k.psi/720*100)+'%';
    if(s){ s.textContent=k.stroke.n.replace(' / 膨胀',''); s.style.color=k.stroke.c; }
  }
}

/* ---------------- 快捷键 ---------------- */
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') return;
  const k=e.key.toLowerCase();
  if(k===' '){ e.preventDefault(); togglePlay(); }
  else if(k==='1') setView('free'); else if(k==='2') setView('side');
  else if(k==='3') setView('top');  else if(k==='4') setView('front');
  else if(k==='5') setView('section');
  else if(k==='c') $('tClip').click();
  else if(k==='x') $('tGhost').click();
  else if(k==='f') $('tFlow').click();
  else if(k==='p') $('tPath').click();
  else if(k==='e'){ rExp.value=+rExp.value>0?0:100; rExp.dispatchEvent(new Event('input')); }
  else if(k==='h'){ ['left','right','brand','legend','hud','help'].forEach(id=>$(id).classList.toggle('off'));
    const tc=$('tdCap'); if(tc) tc.style.visibility=tc.style.visibility==='hidden'?'':'hidden'; }
  else if(k==='r'){ ST.theta=0; syncAng(); setView('free'); }
});
$('bGo').onclick=()=>{ $('guide').classList.add('hidden'); };
$('help').onclick=()=>{ $('guide').classList.remove('hidden'); };

renderer.domElement.addEventListener('webglcontextlost',e=>{
  e.preventDefault();
  const d=document.createElement('div');
  d.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,11,.92);z-index:999;color:#7de3ee;font-size:14px;letter-spacing:.1em;flex-direction:column;gap:10px';
  d.innerHTML='<div>渲染上下文已丢失（显卡资源被系统回收）</div><div style="font-size:11px;color:#93a2b3">刷新页面即可恢复</div>';
  document.body.appendChild(d);
});
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

/* ---------------- 主循环 ---------------- */
let last=performance.now(), fFrames=0, fT=0, pickT=0, uiT=0, trT=0, qLow=0;
function loop(){
  requestAnimationFrame(loop);
  const now=performance.now(); const raw=(now-last)/1000; last=now; const dt=Math.min(raw,0.06);
  if(ST.play){ ST.theta=(ST.theta+ST.rpm*6*ST.timeScale*dt)%720; }
  updateKinematics(); updateThermo(dt); updateFlows(dt); applyExplode(); applyTeardown(dt); applyLearn(dt); controls.update();
  pickT+=dt; if(pickT>0.045){ pickT=0; pick(); }
  uiT+=dt; if(uiT>0.07){ uiT=0; refreshPanel(); drawDial(); drawPV(); if(ST.play) syncAng(); }
  trT+=dt; if(trT>0.35){ trT=0; refreshTrace(); }
  renderer.render(scene,camera);
  fFrames++; fT+=raw;
  if(fT>0.5){ ST.fps=fFrames/fT; fFrames=0; fT=0;
    if(ST.autoQuality){ if(ST.fps<22){ if(++qLow>4){ qLow=0; if(ST.shadow) $('tShadow').click();
        else if(renderer.getPixelRatio()>1) renderer.setPixelRatio(1); else ST.autoQuality=false; } } else qLow=0; }
    $('hud').innerHTML='<b>'+ST.fps.toFixed(0)+'</b> FPS &nbsp; <b>'+(renderer.info.render.triangles/1000).toFixed(0)+'k</b> 三角面 &nbsp; <b>'+renderer.info.render.calls+'</b> draw calls<br>'
      +'零件 <b>'+PICKABLE.length+'</b> · 悬停查看信息 · 双击聚焦零件';
  }
}
