/* ==================================================== 教学层：讲解 · 自测 */
(function(){
  const css=document.createElement('style');
  css.textContent=`
#lcap{position:absolute;left:50%;transform:translateX(-50%) translateY(10px);bottom:16px;width:min(700px,60vw);
  background:var(--panel2);border:1px solid rgba(77,201,138,.34);border-radius:12px;padding:12px 16px 13px;
  opacity:0;pointer-events:none;transition:.18s;z-index:56;box-shadow:0 14px 44px rgba(0,0,0,.65)}
#lcap.show{opacity:1;transform:translateX(-50%);pointer-events:auto}
#lcap .r1{display:flex;align-items:baseline;gap:10px}
#lcap .no{font-family:var(--mono);font-size:11px;color:#8ef0bd;background:rgba(77,201,138,.12);
  border:1px solid rgba(77,201,138,.3);border-radius:5px;padding:2px 7px;flex:none}
#lcap .nz{font-size:15px;font-weight:600}
#lcap .ne{font-family:var(--mono);font-size:10px;color:var(--tx3)}
#lcap .tx{font-size:12.5px;line-height:1.7;color:var(--tx);margin-top:7px}
#lcap .tx b{color:#8ef0bd;font-weight:600}
#lcap .dots{display:flex;gap:5px;margin-top:9px}
#lcap .dots i{width:16px;height:3px;border-radius:2px;background:rgba(255,255,255,.12);cursor:pointer}
#lcap .dots i.on{background:#4dc98a}
#lcap .dots i.done{background:rgba(77,201,138,.45)}
#qzOpts{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
#qzOpts button{text-align:left;padding:8px 10px;font-size:11.5px;line-height:1.5;white-space:normal}
#qzOpts button.ok{background:rgba(77,201,138,.25);border-color:#4dc98a;color:#d9ffe9}
#qzOpts button.bad{background:rgba(226,86,74,.22);border-color:#e2564a;color:#ffd9d5}
#lcap .meta{display:flex;justify-content:space-between;align-items:center;margin-top:9px;font-family:var(--mono);font-size:10px;color:var(--tx3)}
#lcap .meta .btns{margin:0}`;
  document.head.appendChild(css);
  const cap=document.createElement('div'); cap.id='lcap'; document.body.appendChild(cap);
  const p=document.createElement('div'); p.className='panel';
  p.innerHTML=`<h4>教学 <em>LEARN</em></h4><div class="pad">
    <div class="btns">
      <button id="bTour" class="wide">▶ 讲解模式<kbd>G</kbd></button>
      <button id="bQuiz" class="wide">✎ 考一考<kbd>Q</kbd></button>
    </div>
    <div id="learnHint" style="margin-top:7px;font-size:10px;color:var(--tx3);line-height:1.5">讲解：分站带你看懂整机 · 考核：题目由零件档案自动生成</div>
  </div></div>`;
  const left=document.getElementById('left');
  left.insertBefore(p, left.querySelectorAll('.panel')[2]);
})();

/* ---------------- 多零件高亮（琥珀色，与悬停青色区分） ---------------- */
const TCACHE=new Map(); let TLIT=[];
function mhl(ids){
  mhlClear();
  if(!ids||!ids.length) return;
  const set=new Set(ids);
  for(const m of PICKABLE){
    if(!set.has(m.userData.partId) || !chainVisible(m) || m===hovering) continue;
    let hm=TCACHE.get(m.material.uuid);
    if(!hm){ hm=m.material.clone(); hm.emissive=new T.Color(0x8a5a10); hm.emissiveIntensity=1.15;
             hm.clippingPlanes=m.material.clippingPlanes; TCACHE.set(m.material.uuid,hm); }
    m.userData._tSaved=m.material; m.material=hm; TLIT.push(m);
  }
}
function mhlClear(){ highlight(null);
  for(const m of TLIT){ if(m.userData._tSaved){ m.material=m.userData._tSaved; delete m.userData._tSaved; } }
  TLIT=[]; }

/* ============================================================ 讲解模式 */
const TOUR={on:false,i:0,t:0,auto:true,prev:null};
const STOPS=[
 {z:'整机总览',e:'OVERVIEW',view:'free',hl:[],dur:14,
  txt:'这是一台<b>直列四缸涡轮增压柴油机</b>：缸径 102 mm、行程 120 mm、排量 3.92 L、压缩比 17.5:1。左侧可调转速与负荷，右侧仪表实时反映工况。鼠标悬停任何零件都会弹出它的档案。'},
 {z:'四冲程循环',e:'FOUR-STROKE CYCLE',view:'section',hl:['piston','liner','ring'],dur:20,
  on:()=>{ ST.rpm=750; rRpm.value=750; rRpm.dispatchEvent(new Event('input')); },
  txt:'柴油机每两转完成一个循环：<b>吸气</b>（活塞下行吸入增压空气）→ <b>压缩</b>（压到约 1/17.5，空气升至 550 ℃ 以上）→ <b>做功</b>（喷入柴油自燃膨胀推动活塞）→ <b>排气</b>。注意右侧相位条：四个缸按 <b>1-3-4-2</b> 错开 180°，任何时刻总有一缸在做功。'},
 {z:'曲柄连杆机构',e:'CRANK TRAIN',view:'crank',hl:['crankshaft','conrod','rodjournal','counterweight','flywheel'],dur:16,
  txt:'活塞的往复运动经<b>连杆</b>转成<b>曲轴</b>的旋转。曲柄半径 60 mm 恰为行程之半；<b>平衡重</b>抵消旋转惯性力；<b>飞轮</b>把做功冲程的能量存起来匀速带过其余三个冲程。'},
 {z:'配气机构',e:'VALVETRAIN',view:'valve',hl:['camshaft','camlobe','tappet','pushrod','rocker','valve','vspring'],dur:18,
  txt:'下置<b>凸轮轴</b>由正时齿轮以曲轴<b>一半转速</b>驱动——这正是"四冲程"的机械本质。凸轮型线经<b>挺柱→推杆→摇臂</b>（放大 1.556 倍）推开气门，最大升程 11 mm；<b>气门弹簧</b>保证高速时气门仍能跟随凸轮落座。'},
 {z:'燃油系统',e:'FUEL SYSTEM',view:'side',hl:['ipump','hpline','injector','ffilter','delivery'],dur:16,
  on:()=>{ ST.load=70; rLoad.value=70; rLoad.dispatchEvent(new Event('input')); },
  txt:'<b>高压油泵</b>把柴油加压到上百兆帕，经各缸<b>等长高压油管</b>送到<b>喷油器</b>，在压缩上止点前 12° 喷入燃烧室。喷雾撞上 550 ℃ 的压缩空气即自燃——柴油机没有火花塞，靠压燃。注意做功缸喷油器上的金色喷雾锥。'},
 {z:'涡轮增压与中冷',e:'TURBO & INTERCOOLER',view:'turbo',hl:['turbine','turbwheel','compressor','compwheel','intercooler','wastegate'],dur:18,
  txt:'废气冲击<b>涡轮</b>（可达 12 万转/分）带动同轴<b>压气机</b>把进气压缩 1.6 bar——同样的气缸装进更多氧气，就能多喷油多出力。压缩变热的空气再经<b>中冷器</b>降温 90 ℃ 提高密度。拉高转速与负荷，看增压表与涡轮转速的响应。'},
 {z:'冷却系统',e:'COOLING',view:'front',hl:['wpump','impeller','thermostat','radiator','jacket','fan'],dur:16,
  on:()=>{ if(!ST.flow) $('tFlow').click(); },
  txt:'蓝色粒子就是冷却液：<b>水泵</b>把它压入缸体水套、上行进缸盖，带走缸壁与鼻梁区的热量。<b>节温器</b> 82 ℃ 前封闭大循环让发动机快速暖机，之后逐渐开启把热水送往<b>散热器</b>。'},
 {z:'润滑系统',e:'LUBRICATION',view:'crank',hl:['opump','ofilter','gallery','strainer','ocooler','mainbrg'],dur:16,
  txt:'橙色粒子是机油：<b>机油泵</b>从油底壳吸油，经<b>滤清器</b>与<b>冷却器</b>压入<b>主油道</b>，再分配到五道主轴承，并经曲轴内斜油孔到连杆轴承——轴与瓦之间靠几微米厚的油膜承载，金属并不接触。'},
 {z:'亲手拆一台',e:'HANDS-ON',view:'free',hl:[],dur:14,
  txt:'到这里你已经认识了它的四大机构与四大系统。接下来：按 <b>T</b> 进入<b>拆解模式</b>按真实检修顺序拆一遍；按 <b>Q</b> 用「考一考」检验自己——题目会从零件档案里随机出。祝玩得开心！'}
];
function tourStart(){
  if(TD.on) tdExit();
  if(QZ.on) qzEnd(true);
  TOUR.on=true; TOUR.i=-1; TOUR.t=0; TOUR.auto=true;
  TOUR.prev={play:ST.play,rpm:ST.rpm,load:ST.load,flow:ST.flow,exp:ST.explode};
  if(!ST.play) togglePlay();
  $('bTour').classList.add('on'); $('bTour').innerHTML='✕ 退出讲解<kbd>G</kbd>';
  tourGo(0);
}
function tourEnd(){
  if(!TOUR.on) return;
  TOUR.on=false; mhlClear(); $('lcap').classList.remove('show');
  $('bTour').classList.remove('on'); $('bTour').innerHTML='▶ 讲解模式<kbd>G</kbd>';
  const s=TOUR.prev||{};
  if(s.rpm){ ST.rpm=s.rpm; rRpm.value=s.rpm; rRpm.dispatchEvent(new Event('input')); }
  setView('free');
}
function tourGo(i){
  if(i<0||i>=STOPS.length){ tourEnd(); return; }
  TOUR.i=i; TOUR.t=0;
  const s=STOPS[i];
  setView(s.view);
  mhl(s.hl);
  if(s.on) try{s.on();}catch(e){}
  const capEl=$('lcap');
  capEl.innerHTML='<div class="r1"><span class="no">'+(i+1)+' / '+STOPS.length+'</span><span class="nz">'+s.z+'</span><span class="ne">'+s.e+'</span></div>'
   +'<div class="tx">'+s.txt+'</div>'
   +'<div class="dots">'+STOPS.map((_,k)=>'<i class="'+(k<i?'done':(k===i?'on':''))+'" data-k="'+k+'"></i>').join('')+'</div>'
   +'<div class="meta"><span id="tourTimer">'+(TOUR.auto?'自动播放中 · 点击暂停':'已暂停 · 点击继续')+'</span>'
   +'<div class="btns"><button id="tourPrev">← 上一站</button><button id="tourPause">'+(TOUR.auto?'⏸':'▶')+'</button><button id="tourNext">下一站 →</button></div></div>';
  capEl.classList.add('show');
  capEl.querySelectorAll('.dots i').forEach(d=>d.onclick=()=>tourGo(+d.dataset.k));
  $('tourPrev').onclick=()=>tourGo(TOUR.i-1);
  $('tourNext').onclick=()=>tourGo(TOUR.i+1);
  $('tourPause').onclick=()=>{ TOUR.auto=!TOUR.auto;
    $('tourPause').textContent=TOUR.auto?'⏸':'▶';
    $('tourTimer').textContent=TOUR.auto?'自动播放中 · 点击暂停':'已暂停 · 点击继续'; };
}
function applyLearn(dt){
  if(!TOUR.on||!TOUR.auto) return;
  TOUR.t+=dt;
  const s=STOPS[TOUR.i];
  if(s && TOUR.t>=s.dur) tourGo(TOUR.i+1);
}

/* ============================================================ 考一考 */
const QZ={on:false,qs:[],i:0,score:0,wrong:[],await:false};
function pickParts(n,fnFilter){
  const seen=new Map();
  for(const m of PICKABLE){
    const id=m.userData.partId, d=DB[id];
    if(!d||!chainVisible(m)) continue;
    if(fnFilter&&!fnFilter(d)) continue;
    if(!seen.has(id)) seen.set(id,{id,d,mesh:m});
  }
  const arr=[...seen.values()];
  for(let i=arr.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr.slice(0,n);
}
function qzStart(){
  if(TD.on) tdExit();
  if(TOUR.on) tourEnd();
  const find=pickParts(4), mc=pickParts(4,()=>true);
  QZ.qs=[
    ...find.map(p=>({type:'find',p})),
    ...mc.map(p=>({type:'mc',p}))
  ].sort(()=>Math.random()-.5);
  if(QZ.qs.length<4){ return; }
  QZ.on=true; QZ.i=0; QZ.score=0; QZ.wrong=[]; QZ.tries=0;
  if(ST.play) togglePlay();
  $('bQuiz').classList.add('on'); $('bQuiz').innerHTML='✕ 退出考核<kbd>Q</kbd>';
  qzShow();
}
function qzEnd(silent){
  QZ.on=false; QZ.await=false; mhlClear();
  $('bQuiz').classList.remove('on'); $('bQuiz').innerHTML='✎ 考一考<kbd>Q</kbd>';
  if(silent){ $('lcap').classList.remove('show'); return; }
  const total=QZ.qs.length;
  const capEl=$('lcap');
  capEl.innerHTML='<div class="r1"><span class="no">成绩</span><span class="nz">'+QZ.score+' / '+total+'</span>'
   +'<span class="ne">'+(QZ.score===total?'PERFECT — 全对！':(QZ.score>=total*0.6?'GOOD':'KEEP GOING'))+'</span></div>'
   +'<div class="tx">'+(QZ.wrong.length? '错题回顾（悬停实物再看一遍档案）：'+QZ.wrong.map(w=>'<b>'+w+'</b>').join(' · ') : '所有零件都认识了。按 <b>T</b> 去拆解模式实践一下吧。')+'</div>'
   +'<div class="meta"><span>题目由 '+Object.keys(DB).length+' 条零件档案自动生成，每次都不同</span><div class="btns"><button id="qzAgain">再来一轮</button><button id="qzClose">关闭</button></div></div>';
  capEl.classList.add('show');
  $('qzAgain').onclick=()=>{ qzEnd(true); qzStart(); };
  $('qzClose').onclick=()=>{ $('lcap').classList.remove('show'); };
}
function qzShow(){
  if(QZ.i>=QZ.qs.length){ qzEnd(); return; }
  const q=QZ.qs[QZ.i], d=q.p.d;
  mhlClear(); QZ.tries=0;
  const head='<div class="r1"><span class="no">第 '+(QZ.i+1)+' / '+QZ.qs.length+' 题</span>';
  const capEl=$('lcap');
  if(q.type==='find'){
    QZ.await='find';
    setView('free');
    capEl.innerHTML=head+'<span class="nz">在整机上点击：'+d.zh+'</span><span class="ne">'+d.en+'</span></div>'
     +'<div class="tx">提示：'+d.fn.slice(0,52)+'…（可旋转缩放寻找；点错 2 次后公布答案）</div>'
     +'<div class="meta"><span id="qzFb">等待点击…</span><div class="btns"><button id="qzSkip">跳过</button><button id="qzQuit">退出</button></div></div>';
  } else {
    QZ.await='mc';
    mhl([q.p.id]);
    const b=new T.Box3().setFromObject(q.p.mesh), c=b.getCenter(new T.Vector3());
    controls.fly(c, clamp(b.getSize(new T.Vector3()).length()*2.2,1.6,12), 1.2, controls.tSph.theta+0.6, 900);
    const wrong=pickParts(8).filter(x=>x.id!==q.p.id).slice(0,3);
    const opts=[{t:d.fn,ok:1},...wrong.map(w=>({t:w.d.fn,ok:0}))].sort(()=>Math.random()-.5);
    capEl.innerHTML=head+'<span class="nz">高亮零件是「'+d.zh+'」，它的作用是？</span><span class="ne">'+d.en+'</span></div>'
     +'<div id="qzOpts">'+opts.map((o,k)=>'<button data-ok="'+o.ok+'">'+String.fromCharCode(65+k)+'. '+o.t.slice(0,64)+(o.t.length>64?'…':'')+'</button>').join('')+'</div>'
     +'<div class="meta"><span id="qzFb">选择一项</span><div class="btns"><button id="qzQuit">退出</button></div></div>';
    capEl.querySelectorAll('#qzOpts button').forEach(bt=>bt.onclick=()=>{
      if(!QZ.await) return;
      if(bt.dataset.ok==='1'){ bt.classList.add('ok'); QZ.score++; $('qzFb').textContent='✓ 正确'; }
      else { bt.classList.add('bad'); QZ.wrong.push(d.zh); $('qzFb').textContent='✗ 应为：'+d.fn.slice(0,40)+'…';
             capEl.querySelector('#qzOpts button[data-ok="1"]').classList.add('ok'); }
      QZ.await=false;
      setTimeout(()=>{ QZ.i++; qzShow(); }, 1500);
    });
  }
  capEl.classList.add('show');
  const skip=$('qzSkip'); if(skip) skip.onclick=()=>{ QZ.wrong.push(d.zh); QZ.i++; qzShow(); };
  $('qzQuit').onclick=()=>qzEnd();
}
function qzClickCheck(){
  if(!QZ.on||QZ.await!=='find'||!hovering) return;
  const q=QZ.qs[QZ.i], d=q.p.d, hid=hovering.userData.partId;
  if(hid===q.p.id || (DB[hid]&&DB[hid].zh===d.zh)){
    QZ.score++; $('qzFb').textContent='✓ 正确！就是它'; QZ.await=false;
    mhl([q.p.id]);
    setTimeout(()=>{ QZ.i++; qzShow(); }, 1100);
  } else {
    QZ.tries++;
    if(QZ.tries>=2){
      QZ.wrong.push(d.zh); QZ.await=false;
      $('qzFb').textContent='✗ 这是「'+(DB[hid]?DB[hid].zh:'?')+'」。正确答案已高亮';
      mhl([q.p.id]);
      const b=new T.Box3().setFromObject(q.p.mesh), c=b.getCenter(new T.Vector3());
      controls.fly(c, clamp(b.getSize(new T.Vector3()).length()*2.2,1.6,12), controls.tSph.phi, controls.tSph.theta, 800);
      setTimeout(()=>{ QZ.i++; qzShow(); }, 2100);
    } else {
      $('qzFb').textContent='✗ 这是「'+(DB[hid]?DB[hid].zh:'?')+'」，再找找（还剩 1 次机会）';
    }
  }
}
renderer.domElement.addEventListener('click',()=>{ pick(); qzClickCheck(); });
document.getElementById('bTour').onclick=()=>{ TOUR.on?tourEnd():tourStart(); };
document.getElementById('bQuiz').onclick=()=>{ QZ.on?qzEnd():qzStart(); };
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') return;
  const k=e.key.toLowerCase();
  if(k==='g'){ TOUR.on?tourEnd():tourStart(); }
  else if(k==='q'){ QZ.on?qzEnd():qzStart(); }
});
