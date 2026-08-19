/* ==================================================== 单缸拆解 / 装配 动画 */
const BYPART={};
ROOT.traverse(o=>{ const id=o.userData&&o.userData.partId; if(id){ (BYPART[id]=BYPART[id]||[]).push(o); } });
function q(id,cyl){ const a=BYPART[id]||[];
  return cyl===undefined?a.slice():a.filter(m=>m.userData.cyl===undefined||m.userData.cyl===cyl); }
const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

const TD={on:false, cyl:0, t:0, play:0, speed:1, steps:[], items:[], hidden:[], N:0, lastStep:-99, prevState:null};

/* --------------------------------------------------------- 拆解步骤定义 */
function buildSteps(c){
  const VI=VALVES.find(v=>v.cyl===c&&v.type==='in'), VE=VALVES.find(v=>v.cyl===c&&v.type==='ex');
  const pk=PISTONS[c], rd=RODS[c], cx=CX(c)*S;
  const CAM_TOP ={t:[cx,4.70,0], r:12.0, p:1.24, h:0.64};
  const CAM_MID ={t:[cx,2.30,0], r:12.5, p:1.34, h:0.52};
  const CAM_LOW ={t:[cx,0.55,0], r:14.0, p:1.44, h:0.44};
  const CAM_ALL ={t:[cx,2.60,0], r:19.5, p:1.28, h:0.62};
  const K=1;
  return [
  {n:'气门室罩 · 罩盖密封垫', en:'Valve Cover & Gasket', cam:CAM_TOP,
   tip:'按对角顺序分次松开 14 条 M8 罩盖螺栓，垂直提起罩盖，取下橡胶密封垫。',
   spec:'装复扭矩 12 N·m（切勿超拧，过力会压溃胶垫导致渗油）；密封垫压缩率 25–35 %，建议更换新垫。',
   items:[[[ANIM.cover],[0,430,0]], [q('vcgasket'),[0,398,0]], [q('vcbolt'),[0,470,0]]]},

  {n:'摇臂轴总成', en:'Rocker Shaft Assembly', cam:CAM_TOP,
   tip:'先回松该缸两只摇臂的气门间隙调整螺钉，再由外向内分 2–3 次松开摇臂座螺栓，整体平吊起摇臂轴总成。',
   spec:'摇臂比 1.556:1；装复后按"双阀重叠法"调整冷态间隙：进气 0.25 mm、排气 0.51 mm。摇臂轴内孔为油道，装复前须吹通。',
   items:[[q('rockshaft'),[0,300,0]], [[VI.rk,VE.rk],[0,300,0],K], [q('rockstand'),[0,300,0]]]},

  {n:'推杆 ×2', en:'Push Rods', cam:CAM_TOP,
   tip:'逐根向上抽出推杆，按原缸号与进/排位置编号摆放，不得互换。检查两端球头点蚀与杆身弯曲。',
   spec:'长度 ≈300 mm、外径 Ø11 中空导油；许用弯曲跳动 < 0.3 mm，超差必须更换，否则高速时气门跟随性失效。',
   items:[[[VI.pr,VE.pr],[0,250,0],K]]},

  {n:'喷油器 · 高压油管 · 紫铜垫', en:'Injector, HP Line & Copper Washer', cam:CAM_TOP,
   tip:'先松高压油管两端锥形接头（禁止扳弯管路），再拆喷油器压板，用专用拔具垂直取出喷油器，立即封堵油孔防尘。',
   spec:'紫铜垫为一次性件必须更换；喷油器压紧扭矩 60 N·m；开启压力 25 MPa、6×Ø0.28 mm 喷孔需上试验台校验雾化与滴漏。',
   items:[[q('injector',c),[0,300,0]], [q('hpline',c),[0,300,0]], [q('injwasher',c),[0,272,0]]]},

  {n:'缸盖螺栓 ×14', en:'Cylinder Head Bolts', cam:CAM_TOP,
   tip:'必须在冷态下，由两端向中心、分 2–3 次对称松开 14 条 M20 缸盖螺栓，防止缸盖翘曲。',
   spec:'装复为屈服点法三级拧紧：60 → 120 N·m → 再转 90°，顺序由中心向两端对称扩展。螺栓属塑性变形件，伸长量超限须整组更换。',
   items:[[q('headbolt'),[0,360,0]]]},

  {n:'气缸盖（含气门与弹簧）', en:'Cylinder Head Assembly', cam:CAM_TOP,
   tip:'用吊环垂直提起缸盖，避免刮伤火力面与定位销；缸盖不可倒置放置，以免碰伤气门锥面。',
   spec:'火力面平面度 ≤0.05 mm、纵向 ≤0.10 mm，超差需光磨（磨削量有上限）；重新装配必须使用新缸垫。',
   items:[[[ANIM.head],[0,330,0]], [[VI.vgrp,VE.vgrp,VI.sp,VE.sp,VI.ret,VE.ret],[0,330,0],K]]},

  {n:'气缸垫', en:'Cylinder Head Gasket', cam:CAM_MID,
   tip:'揭下多层钢缸垫。检查缸口包边是否有冲蚀、发蓝或烧穿——这是判断爆震、缸盖翘曲或螺栓失效最直接的证据。',
   spec:'厚度 1.5 mm（压紧后 1.2）；一次性件严禁重复使用，且不得涂任何密封胶。',
   items:[[q('hgasket'),[0,246,0]]]},

  {n:'气门弹簧 · 弹簧座 · 锁夹', en:'Valve Spring, Retainer & Collets', cam:CAM_TOP,
   tip:'用气门弹簧压缩器压下弹簧座，取出两瓣锥形锁夹（用磁性棒，切勿弹飞），缓慢释放弹簧。',
   spec:'自由长度 62 mm；闭合预紧力 340 N、全开 720 N。自由长度衰减 >2 mm 或垂直度偏差 >1.5° 须成组更换。',
   items:[[[VI.sp,VE.sp],[0,150,0],K], [[VI.ret,VE.ret],[0,215,0],K]]},

  {n:'进气门 · 排气门', en:'Intake & Exhaust Valves', cam:CAM_TOP,
   tip:'从火力面一侧抽出气门，按缸号与进/排位置编号存放。检查杆部拉伤、锥面烧蚀与头部下沉量。',
   spec:'杆径 Ø8，杆-导管间隙 进 0.03–0.06 / 排 0.05–0.08 mm；下沉极限 1.5 mm；配研后密封带宽 1.5–2.0 mm，位于锥面中部。',
   items:[[[VI.vgrp,VE.vgrp],[0,-165,0],K]]},

  {n:'油底壳 · 集滤器', en:'Oil Pan & Pickup Strainer', cam:CAM_LOW,
   tip:'放净机油，卸下 26 条 M8 螺栓取下油底壳，再拆集滤器与吸油管。检查壳底金属碎屑——那是轴瓦或活塞损伤的早期信号。',
   spec:'装复扭矩 24 N·m，对角交叉分 2 次拧紧；结合面涂厌氧密封胶，集滤器吸口距壳底约 8 mm。',
   items:[[[ANIM.pan],[0,-270,0]], [q('panbolt'),[0,-312,0]]]},

  {n:'连杆盖 · 连杆螺栓 · 下轴瓦', en:'Rod Cap, Bolts & Lower Shell', cam:CAM_MID,
   tip:'转动曲轴使该缸到下止点，核对缸号与方向标记，均匀分次松开两条 M14 连杆螺栓，平稳取下连杆盖。',
   spec:'连杆盖与连杆体为胀断配对件，绝不可互换或反装；装复 80 N·m + 60°，螺栓伸长 0.15–0.20 mm。轴瓦间隙 0.04–0.09 mm，用塑性量隙线检测。',
   items:[[[rd.cap],[0,-185,0],K], [rd.bolts.map(b=>b.m),[0,-225,0],K], [[rd.bd],[0,-160,0],K]]},

  {n:'活塞连杆总成', en:'Piston & Connecting Rod Assembly', cam:CAM_MID,
   tip:'先刮除缸口积碳台阶，再用木柄从曲轴箱一侧向上顶出活塞连杆总成，全程不得刮伤缸壁与曲柄销。',
   spec:'活塞顶方向标记必须朝发动机前端；重新装入须用活塞环压缩器，三环开口按 120° 互错并避开活塞销方向。',
   items:[[[pk.mesh,pk.pin,rd.rod,rd.bu,rd.bs].concat(pk.rings.map(r=>r.m)),[0,345,0],K]]},

  {n:'活塞环组 ×3', en:'Piston Ring Pack', cam:CAM_TOP,
   tip:'用活塞环装卸钳由上而下依次取出第一道梯形气环、第二道锥面环与第三道组合油环，注意气环有装配方向（内切口朝上）。',
   spec:'端隙：一环 0.30–0.45、二环 0.45–0.65、油环 0.25–0.55 mm；侧隙 0.06–0.10 mm。环槽磨损须换活塞。',
   items:[[[pk.rings[2].m],[0,60,0],K], [[pk.rings[1].m],[0,112,0],K], [[pk.rings[0].m],[0,168,0],K]]},

  {n:'活塞销 · 连杆分离', en:'Gudgeon Pin Removal', cam:CAM_TOP,
   tip:'取下两端卡簧，把活塞放入约 80 ℃ 温水中加热数分钟，全浮式活塞销即可手工推出，连杆与活塞分离。',
   spec:'销 Ø38×88 mm，与销座间隙 0.005–0.015 mm、与小头衬套 0.02–0.05 mm；活塞、销、连杆为称重分组件，更换须同组匹配（重量差 ≤8 g）。',
   items:[[[pk.pin],[190,0,0],K], [[rd.rod,rd.bu,rd.bs],[0,-250,0],K]]},

  {n:'主轴承盖 ×5', en:'Main Bearing Caps', cam:CAM_LOW,
   tip:'核对每道轴承盖的缸号与前后方向标记，由外向内分 2–3 次松开 10 条 M18 螺栓。',
   spec:'装复 120 N·m + 90°；轴承盖与缸体一次配镗，绝对不可互换位置或调头，主轴承孔同轴度 ≤0.02 mm。',
   items:[[q('maincap'),[0,-165,0]], [q('mainbolt'),[0,-205,0]]]},

  {n:'曲轴 · 主轴瓦', en:'Crankshaft & Main Bearings', cam:CAM_LOW,
   tip:'用吊具水平吊出曲轴，严禁磕碰轴颈；取出上下主轴瓦并按位置编号，检查瓦背贴合与合金层剥落。',
   spec:'主轴颈 Ø83、连杆颈 Ø69；圆度/圆柱度 ≤0.005 mm；轴瓦间隙 0.05–0.11 mm；轴向间隙由止推片控制 0.10–0.33 mm。',
   items:[[[ANIM.crank,ANIM.flywheel,ANIM.damper,GEARS.crank],[0,-250,0]], [q('mainbrg'),[0,-215,0]]]},

  {n:'气缸套', en:'Cylinder Liner', cam:CAM_ALL,
   tip:'用专用拉缸器把干式缸套向上拔出；清理缸体承孔的锈蚀与凸起，检查承孔圆度。',
   spec:'压装过盈量 0.03–0.08 mm；重新压装后须再次珩磨出 45°±5° 交叉网纹，Ra 0.4 μm，内径 Ø102 H7。',
   items:[[q('liner',c),[0,330,0]]], cam2:CAM_ALL}
  ];
}

/* --------------------------------------------------------- 位移表构建 */
function tdBuild(){
  TD.steps=buildSteps(TD.cyl); TD.N=TD.steps.length;
  const map=new Map();
  TD.steps.forEach((st,i)=>{ (st.items||[]).forEach(([objs,v,kin])=>{
    (objs||[]).forEach(o=>{ if(!o) return;
      let e=map.get(o);
      if(!e){ e={o, b:o.position.clone(), kin:!!kin, s:[]}; map.set(o,e); }
      if(kin) e.kin=true;
      e.s.push({i, v});
    });
  });});
  TD.items=[...map.values()];
}
let tdUiT=0;
function applyTeardown(dt){
  if(!TD.on){ if(TD.needReset){ TD.items.forEach(it=>{ if(!it.kin) it.o.position.copy(it.b); }); TD.needReset=false; } return; }
  if(TD.play){
    TD.t=clamp(TD.t+TD.play*TD.speed*(dt||0.016)/2.15, 0, TD.N);
    if(TD.t<=0||TD.t>=TD.N){ TD.play=0; tdBtns(); tdSync(); }
    else { tdUiT+=(dt||0.016); if(tdUiT>0.12){ tdUiT=0; tdSync(); } }
  }
  const t=TD.t;
  for(const it of TD.items){
    let x=0,y=0,z=0;
    for(const s of it.s){ const e=easeIO(clamp((t-s.i)*1.75,0,1)); x+=s.v[0]*e; y+=s.v[1]*e; z+=s.v[2]*e; }
    if(it.kin){ it.o.position.x+=x; it.o.position.y+=y; it.o.position.z+=z; }
    else it.o.position.set(it.b.x+x, it.b.y+y, it.b.z+z);
  }
  const cur=t<=0.001?-1:Math.min(TD.N-1, Math.ceil(t-0.001)-1);
  if(cur!==TD.lastStep){ TD.lastStep=cur; tdCaption(cur);
    const st=TD.steps[Math.max(0,cur)];
    if(st&&st.cam&&TD.play) controls.fly(new T.Vector3(st.cam.t[0],st.cam.t[1],st.cam.t[2]), st.cam.r, st.cam.p, st.cam.h, 900);
  }
}

/* --------------------------------------------------------- 进入 / 退出 */
function tdVisible(on){
  if(on){
    TD.hidden=[];
    const hide=o=>{ if(o&&o.visible){ o.visible=false; TD.hidden.push(o);} };
    const KEEP={injector:1,injwasher:1,hpline:1};
    [G_FUEL,G_OIL,G_COOL,G_AIR].forEach(g=>g.children.forEach(o=>{
      const id=o.userData.partId, cy=o.userData.cyl;
      if(!(KEEP[id] && (cy===undefined||cy===TD.cyl))) hide(o);
    }));
    PISTONS.forEach((p,i)=>{ if(i!==TD.cyl) hide(p.grp); });
    VALVES.forEach(v=>{ if(v.cyl!==TD.cyl){ [v.tap,v.pr,v.rk,v.vgrp,v.sp,v.ret].forEach(hide); } });
    LABELS.forEach(hide);
    ['exgasket','ingasket'].forEach(id=>(BYPART[id]||[]).forEach(hide));
    ['injwasher','vseal'].forEach(id=>(BYPART[id]||[]).forEach(o=>{ if(o.userData.cyl!==undefined&&o.userData.cyl!==TD.cyl) hide(o); }));
  } else { TD.hidden.forEach(o=>o.visible=true); TD.hidden=[]; }
  rebuildPick();
}
function tdEnter(){
  if(TD.on) return;
  if(typeof TOUR!=='undefined'&&TOUR.on) tourEnd();
  if(typeof QZ!=='undefined'&&QZ.on) qzEnd(true);
  TD.prevState={play:ST.play, theta:ST.theta, clip:ST.clip, ghost:ST.ghost, exp:ST.explode, flow:ST.flow, labels:ST.labels};
  ST.play=false; $('bPlay').textContent='▶ 播放'; $('bPlay').classList.remove('on');
  if(ST.clip){ ST.clip=false; $('tClip').classList.remove('on'); applyClip(); }
  if(ST.ghost){ ST.ghost=false; $('tGhost').classList.remove('on'); applyGhost(); }
  ST.explode=0; rExp.value=0; rExp.dispatchEvent(new Event('input'));
  ST.theta=((180-P.phase[TD.cyl])%720+720)%720; syncAng(); updateKinematics();
  if(ST.flow){ ST.flow=false; $('tFlow').classList.remove('on'); }
  if(ST.paths){ ST.paths=false; $('tPath').classList.remove('on'); }
  $('legend').classList.add('off');
  TD.on=true; TD.t=0; TD.play=0; TD.lastStep=-99; TD.needReset=true;
  tdBuild(); tdVisible(true); tdSync(); tdList();
  $('tdBody').classList.remove('hidden'); $('tdCap').classList.add('show');
  $('tdOn').textContent='✕ 退出拆解模式'; $('tdOn').classList.add('on');
  ['left'].forEach(()=>{});
  const st=TD.steps[0];
  controls.fly(new T.Vector3(st.cam.t[0],st.cam.t[1],st.cam.t[2]), st.cam.r, st.cam.p, st.cam.h, 900);
  tdCaption(-1);
}
function tdExit(){
  if(!TD.on) return;
  TD.t=0; TD.play=0; applyTeardown();       // 归位
  TD.on=false; TD.needReset=true; applyTeardown();
  tdVisible(false);
  $('tdBody').classList.add('hidden'); $('tdCap').classList.remove('show');
  $('tdOn').textContent='▶ 进入拆解模式'; $('tdOn').classList.remove('on');
  const s=TD.prevState||{};
  if(s.play){ ST.play=true; $('bPlay').textContent='⏸ 暂停'; $('bPlay').classList.add('on'); }
  if(s.flow){ ST.flow=true; $('tFlow').classList.add('on'); }
  if(s.theta!==undefined){ ST.theta=s.theta; syncAng(); }
  if(s.labels){ LABELS.forEach(l=>l.visible=true); }
  $('legend').classList.remove('off');
  setView('free');
}

/* --------------------------------------------------------- 界面 */
(function tdUI(){
  const css=document.createElement('style');
  css.textContent=`
#tdList{list-style:none;margin:8px 0 0;padding:0;max-height:172px;overflow-y:auto;scrollbar-width:thin}
#tdList::-webkit-scrollbar{width:4px}#tdList::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:3px}
#tdList li{display:flex;gap:7px;align-items:center;padding:4px 6px;border-radius:5px;font-size:10.5px;color:var(--tx3);cursor:pointer;transition:.12s}
#tdList li:hover{background:rgba(255,255,255,.05);color:var(--tx2)}
#tdList li b{font-family:var(--mono);font-size:9px;width:15px;text-align:right;opacity:.6;font-weight:400}
#tdList li.done{color:var(--tx2)}
#tdList li.done b{color:var(--acc)}
#tdList li.cur{background:rgba(51,199,214,.16);color:#dffbff;box-shadow:inset 0 0 0 1px rgba(51,199,214,.34)}
#tdList li.cur b{color:var(--acc2);opacity:1}
#tdCap{position:absolute;left:50%;transform:translateX(-50%) translateY(10px);bottom:16px;width:min(720px,62vw);
  background:var(--panel2);border:1px solid rgba(51,199,214,.30);border-radius:12px;padding:12px 16px 13px;
  opacity:0;pointer-events:none;transition:.18s;z-index:55;box-shadow:0 14px 44px rgba(0,0,0,.65)}
#tdCap.show{opacity:1;transform:translateX(-50%)}
#tdCap .r1{display:flex;align-items:baseline;gap:10px}
#tdCap .no{font-family:var(--mono);font-size:11px;color:var(--acc2);background:rgba(51,199,214,.12);
  border:1px solid rgba(51,199,214,.3);border-radius:5px;padding:2px 7px;flex:none}
#tdCap .nz{font-size:15px;font-weight:600}
#tdCap .ne{font-family:var(--mono);font-size:10px;color:var(--tx3);letter-spacing:.03em}
#tdCap .g{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px;margin-top:9px}
#tdCap .b{border-left:2px solid rgba(255,255,255,.10);padding-left:9px}
#tdCap .b.k{border-left-color:var(--amber)}
#tdCap .lb{font-size:9px;letter-spacing:.14em;color:var(--tx3);margin-bottom:2px}
#tdCap .tx{font-size:11.5px;line-height:1.55;color:var(--tx)}
#tdCap .b.k .tx{color:#ffd79a}
#tdCap .pg{height:2px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:10px;overflow:hidden}
#tdCap .pg i{display:block;height:100%;background:linear-gradient(90deg,var(--acc),var(--acc2));width:0%}
@media (max-width:1100px){#tdCap{width:78vw}#tdCap .g{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  const p=document.createElement('div'); p.className='panel';
  p.innerHTML=`<h4>单缸拆解动画 <em>TEARDOWN</em></h4><div class="pad">
    <div class="btns"><button id="tdOn" class="wide">▶ 进入拆解模式<kbd>T</kbd></button></div>
    <div id="tdBody" class="hidden" style="margin-top:9px">
      <div class="row"><label>目标缸</label><div class="btns" style="flex:1">
        <button data-tdc="0" class="on">1缸</button><button data-tdc="1">2缸</button>
        <button data-tdc="2">3缸</button><button data-tdc="3">4缸</button></div></div>
      <div class="btns" style="margin:9px 0">
        <button id="tdPrev">⏮ 上一步</button><button id="tdPlay" class="wide">▶ 播放拆解</button>
        <button id="tdNext">下一步 ⏭</button><button id="tdAsm" class="wide">⟲ 逆序装配</button></div>
      <div class="row"><label>进度</label><input type="range" id="tdRange" min="0" max="17" step="0.02" value="0"><div class="val" id="tdVal">0 / 17</div></div>
      <div class="row"><label>节奏</label><input type="range" id="tdSpeed" min="30" max="260" step="5" value="100"><div class="val" id="tdSpeedV">1.00 ×</div></div>
      <ol id="tdList"></ol>
    </div></div>`;
  const left=$('left'), ps=left.querySelectorAll('.panel');
  left.insertBefore(p, ps[2]);
  const cap=document.createElement('div'); cap.id='tdCap'; document.body.appendChild(cap);

  $('tdOn').onclick=()=>{ TD.on?tdExit():tdEnter(); };
  $('tdPlay').onclick=()=>{ TD.play=TD.play===1?0:1; if(TD.t>=TD.N)TD.t=0; tdBtns(); };
  $('tdAsm').onclick=()=>{ TD.play=TD.play===-1?0:-1; if(TD.t<=0)TD.t=TD.N; tdBtns(); };
  $('tdPrev').onclick=()=>{ TD.play=0; tdBtns(); tdGoto(Math.max(0,Math.ceil(TD.t-1.001))); };
  $('tdNext').onclick=()=>{ TD.play=0; tdBtns(); tdGoto(Math.min(TD.N,Math.floor(TD.t+1.001))); };
  document.querySelectorAll('[data-tdc]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('[data-tdc]').forEach(x=>x.classList.remove('on')); b.classList.add('on');
    const wasT=TD.t; TD.t=0; applyTeardown(); TD.needReset=true; applyTeardown();
    tdVisible(false); TD.cyl=+b.dataset.tdc;
    ST.theta=((180-P.phase[TD.cyl])%720+720)%720; syncAng(); updateKinematics();
    tdBuild(); tdVisible(true); TD.t=Math.min(wasT,TD.N); TD.lastStep=-99; tdSync(); tdList();
  });
  const rr2=$('tdRange');
  rr2.addEventListener('input',()=>{ TD.play=0; tdBtns(); TD.t=+rr2.value; tdSync(); });
  const sp=$('tdSpeed');
  sp.addEventListener('input',()=>{ TD.speed=+sp.value/100; $('tdSpeedV').textContent=TD.speed.toFixed(2)+' ×';
    sp.style.setProperty('--p',((sp.value-30)/230*100)+'%'); });
  sp.dispatchEvent(new Event('input'));
})();

function tdBtns(){
  $('tdPlay').textContent=TD.play===1?'⏸ 暂停':'▶ 播放拆解';
  $('tdPlay').classList.toggle('on',TD.play===1);
  $('tdAsm').textContent=TD.play===-1?'⏸ 暂停装配':'⟲ 逆序装配';
  $('tdAsm').classList.toggle('on',TD.play===-1);
}
function tdGoto(v){ TD.t=clamp(v,0,TD.N); tdSync();
  const cur=Math.min(TD.N-1,Math.max(0,Math.ceil(TD.t-0.001)-1)); const st=TD.steps[cur];
  if(st&&st.cam) controls.fly(new T.Vector3(st.cam.t[0],st.cam.t[1],st.cam.t[2]), st.cam.r, st.cam.p, st.cam.h, 800);
}
function tdSync(){
  const r=$('tdRange'); r.max=TD.N; r.value=TD.t;
  r.style.setProperty('--p',(TD.t/TD.N*100)+'%');
  $('tdVal').textContent=Math.round(TD.t*10)/10+' / '+TD.N;
  const cur=TD.t<=0.001?-1:Math.min(TD.N-1,Math.ceil(TD.t-0.001)-1);
  document.querySelectorAll('#tdList li').forEach((li,i)=>{
    li.classList.toggle('cur',i===cur); li.classList.toggle('done',i<cur); });
  const ac=document.querySelector('#tdList li.cur'), lst=$('tdList');
  if(ac&&lst) lst.scrollTop=clamp(ac.offsetTop-lst.clientHeight/2+ac.offsetHeight/2,0,lst.scrollHeight);
}
function tdList(){
  $('tdList').innerHTML=TD.steps.map((s,i)=>'<li data-i="'+i+'"><b>'+(i+1)+'</b>'+s.n+'</li>').join('');
  document.querySelectorAll('#tdList li').forEach(li=>li.onclick=()=>{ TD.play=0; tdBtns(); tdGoto(+li.dataset.i+1); });
}
function tdCaption(cur){
  const cap=$('tdCap'); if(!cap) return;
  if(cur<0){
    cap.innerHTML='<div class="r1"><span class="no">READY</span><span class="nz">第 '+(TD.cyl+1)+' 缸 · 整机装配状态</span>'+
      '<span class="ne">CYLINDER '+(TD.cyl+1)+' · ASSEMBLED</span></div>'+
      '<div class="g"><div class="b"><div class="lb">操作</div><div class="tx">点击「播放拆解」按真实检修顺序逐件分离，或拖动进度条手动逐步观察；也可点右侧步骤列表直接跳转。</div></div>'+
      '<div class="b k"><div class="lb">当前曲轴位置</div><div class="tx">该缸已转至下止点（便于取连杆盖与顶出活塞）</div></div></div><div class="pg"><i></i></div>';
    return;
  }
  const s=TD.steps[cur];
  cap.innerHTML='<div class="r1"><span class="no">'+(cur+1)+' / '+TD.N+'</span><span class="nz">'+s.n+'</span>'+
    '<span class="ne">'+s.en+'</span></div>'+
    '<div class="g"><div class="b"><div class="lb">拆卸要点 REMOVAL</div><div class="tx">'+s.tip+'</div></div>'+
    '<div class="b k"><div class="lb">装配规范 / 技术条件 REFIT SPEC</div><div class="tx">'+s.spec+'</div></div></div>'+
    '<div class="pg"><i style="width:'+((cur+1)/TD.N*100).toFixed(1)+'%"></i></div>';
}
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') return;
  const k=e.key.toLowerCase();
  if(k==='t'){ TD.on?tdExit():tdEnter(); }
  else if(TD.on&&k===']'){ $('tdNext').click(); }
  else if(TD.on&&k==='['){ $('tdPrev').click(); }
});
