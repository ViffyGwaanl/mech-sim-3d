/* ================================================================ 分组定义 */
const G_FIX  = group('fixed','固定件 · 机体','#8892a0');
const G_CR   = group('crank','曲柄连杆机构','#d3d9df');
const G_VT   = group('valve','配气机构','#7de3ee');
const G_FUEL = group('fuel','燃油系统','#e0c341');
const G_OIL  = group('oil','润滑系统','#f0a63c');
const G_COOL = group('cool','冷却系统','#4b9df0');
const G_AIR  = group('air','进排气与增压','#e2564a');
const G_FAST = group('fast','紧固与密封件','#9aa2ab');
const G_FLOW = group('flow','流动示意','#4dc98a');
const EXP=[];
function expl(o,v){ EXP.push({o, b:o.position.clone(), v:new T.Vector3(v[0],v[1],v[2])}); return o; }
const CX = i => (i-(P.nCyl-1)/2)*P.pitch;      // 各缸中心 X 坐标

/* ==================================================================== 气缸体 */
(function block(){
  const g = new T.Group(); G_FIX.add(g);
  const L=P.blockX*2, W=P.blockZ*2;   // 704 × 176

  /* --- 上平面（顶板 + 4 缸孔 + 水孔 + 螺栓孔） --- */
  const deck = rr(L, W, 16);
  for(let i=0;i<4;i++) hole(deck, CX(i), 0, P.bore/2);
  for(const x of [-280,-140,0,140,280]) for(const z of [-76,76]) hole(deck,x,z,7);
  for(let i=0;i<4;i++) hole(deck,CX(i),88-12,7);
  for(let i=0;i<4;i++){ hole(deck,CX(i)-52,58,9); hole(deck,CX(i)+52,-58,9); }  // 水孔
  const deckG = plateXZ(deck, 20); deckG.translate(0,P.deckY-20,0);
  add(g, deckG, MAT.iron, 'block').userData.sys='fixed';

  /* --- 缸套（干式） --- */
  for(let i=0;i<4;i++){
    const s=tubeGeo(P.bore/2+7, P.bore/2, 168, 56); s.translate(CX(i), P.deckY-20-84, 0);
    add(g, s, MAT.nitride, 'liner', {cyl:i});
  }
  /* --- 冷却水套（半透明体积） --- */
  const jk = rr(L-26, W-26, 12);
  for(let i=0;i<4;i++) hole(jk, CX(i), 0, P.bore/2+7.2);
  const jkG = plateXZ(jk, 150); jkG.translate(0, P.deckY-170, 0);
  const jkM = add(g, jkG, MAT.water, 'jacket', {noShadow:1}); jkM.renderOrder=6; jkM.material.depthWrite=false;

  /* --- 缸体外壁（水套外围铸壁） --- */
  const wallS = rr(L, W, 16); const wi=rr(L-26, W-26, 12);
  wallS.holes.push(new T.Path(wi.getPoints(40).map(p=>new T.Vector2(p.x,p.y)).reverse().map(p=>p)) );
  {
    const pth=new T.Path(); const ps=wi.getPoints(60); pth.moveTo(ps[ps.length-1].x, ps[ps.length-1].y);
    for(let i=ps.length-2;i>=0;i--) pth.lineTo(ps[i].x,ps[i].y); wallS.holes=[pth];
  }
  const wallG = plateXZ(wallS, 152); wallG.translate(0,P.deckY-172,0);
  add(g, wallG, MAT.iron, 'block');

  /* --- 曲轴箱（Y-Z 截面沿 X 挤出） --- */
  const cs=new T.Shape();
  cs.moveTo(-P.blockZ, 146); cs.lineTo(P.blockZ,146); cs.lineTo(P.blockZ,60);
  cs.lineTo(100,20); cs.lineTo(100,-118); cs.lineTo(112,-118); cs.lineTo(112,-136);
  cs.lineTo(-112,-136); cs.lineTo(-112,-118); cs.lineTo(-100,-118); cs.lineTo(-100,20);
  cs.lineTo(-P.blockZ,60); cs.closePath();
  {  // 内腔（挖空成壳体）
    const h=new T.Path();
    h.moveTo(-84,146); h.lineTo(-84,40); h.lineTo(-86,-110); h.lineTo(86,-110);
    h.lineTo(84,40); h.lineTo(84,146); h.closePath(); cs.holes.push(h);
  }
  add(g, profileZY(cs, L), MAT.iron, 'block');

  /* --- 主轴承隔板 ×5 + 轴承盖 + 轴瓦 --- */
  const MB=[-280,-140,0,140,280], mr=P.mainJ/2;
  MB.forEach((x,i)=>{
    const bs=new T.Shape();
    bs.moveTo(-84,146); bs.lineTo(84,146); bs.lineTo(84,10); bs.lineTo(60,-20);
    bs.absarc(0,0,mr+22,-Math.PI*0.16, -Math.PI*0.84, true);
    bs.lineTo(-60,-20); bs.lineTo(-84,10); bs.closePath();
    const hp=new T.Path(); hp.absarc(0,0,mr+2.5,Math.PI,0,true); hp.closePath(); bs.holes.push(hp);
    add(g, profileZY(bs,22), MAT.iron, 'bulkhead', {pos:[x,0,0]});
    // 主轴承盖
    const cs2=new T.Shape();
    cs2.moveTo(-58,0); cs2.lineTo(58,0); cs2.lineTo(58,-46); cs2.lineTo(44,-62);
    cs2.lineTo(-44,-62); cs2.lineTo(-58,-46); cs2.closePath();
    const hp2=new T.Path(); hp2.absarc(0,0,mr+2.5,Math.PI,Math.PI*2,false); hp2.closePath();
    cs2.holes.push(hp2);
    const cap = add(g, profileZY(cs2,26), MAT.cast, 'maincap', {pos:[x,0,0]});
    expl(cap,[0,-86,0]);
    // 上下主轴瓦
    for(const up of [1,0]){
      const sh=new T.Shape(); sh.absarc(0,0,mr+2.4, up?0:Math.PI, up?Math.PI:Math.PI*2, false);
      sh.absarc(0,0,mr+0.4, up?Math.PI:Math.PI*2, up?0:Math.PI, true); sh.closePath();
      add(g, profileZY(sh, up?21:25), MAT.bearing, 'mainbrg', {pos:[x,0,0]});
    }
  });

  /* --- 主油道（缸体内纵向） --- */
  const og=new T.Mesh(new T.CylinderGeometry(7,7,L-40,20),MAT.oilv);
  og.rotation.z=Math.PI/2; og.position.set(0,120,-72); og.material.depthWrite=false; og.renderOrder=6;
  og.userData.partId='gallery'; g.add(og); PICKABLE.push(og);
  MB.forEach(x=>{
    const d=new T.Mesh(new T.CylinderGeometry(4.2,4.2,138,12),MAT.oilv);
    d.position.set(x,60,-36); d.material.depthWrite=false; d.renderOrder=6;
    d.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), new T.Vector3(0,-120,72).normalize());
    d.userData.partId='gallery'; g.add(d);
    const u=new T.Mesh(new T.CylinderGeometry(3.6,3.6,200,10),MAT.oilv);
    u.position.set(x,220,-78); u.material.depthWrite=false; u.renderOrder=6; u.userData.partId='gallery'; g.add(u);
  });

  ANIM.blockGroup=g;
})();

/* ==================================================================== 气缸垫 */
(function gasket(){
  const s=rr(P.blockX*2, P.blockZ*2, 16);
  for(let i=0;i<4;i++) hole(s, CX(i), 0, P.bore/2-1);
  for(const x of [-280,-140,0,140,280]) for(const z of [-76,76]) hole(s,x,z,7.5);
  for(let i=0;i<4;i++){ hole(s,CX(i)-52,58,9.5); hole(s,CX(i)+52,-58,9.5); }
  const gg=plateXZ(s,P.gasketT); gg.translate(0,P.deckY,0);
  const m=add(G_FAST, gg, MAT.gasket, 'hgasket'); expl(m,[0,132,0]);
  // 缸口密封环（不锈钢包边）
  for(let i=0;i<4;i++){
    const r=tubeGeo(P.bore/2+2.5,P.bore/2-1,P.gasketT+0.6,48); r.translate(CX(i),P.deckY+P.gasketT/2,0);
    const rm=add(G_FAST,r,MAT.polish,'hgasket'); expl(rm,[0,132,0]);
  }
})();

/* ==================================================================== 气缸盖 */
(function head(){
  const g=new T.Group(); G_FIX.add(g); expl(g,[0,170,0]);
  const L=P.blockX*2, W=P.blockZ*2, y0=P.headBot, y1=P.headTop;

  /* 火力面板（含气门座孔、喷油器孔、推杆孔） */
  const s=rr(L,W,16);
  for(let i=0;i<4;i++){
    hole(s, CX(i)-P.valveDX, 0, P.valveHead.ex/2-3);
    hole(s, CX(i)+P.valveDX, 0, P.valveHead.in/2-3);
    hole(s, CX(i), 0, 9);                                  // 喷油器
    hole(s, CX(i)-P.valveDX, P.pushZbot, 13); hole(s, CX(i)+P.valveDX, P.pushZbot, 13);
  }
  for(const x of [-280,-140,0,140,280]) for(const z of [-76,76]) hole(s,x,z,7);
  const fd=plateXZ(s,18); fd.translate(0,y0,0);
  add(g, fd, MAT.head, 'head');

  /* 缸盖主体（壳体） */
  const bs=new T.Shape();
  bs.moveTo(-W/2,y0+18); bs.lineTo(W/2,y0+18); bs.lineTo(W/2,y1-6);
  bs.lineTo(W/2-8,y1); bs.lineTo(-W/2+8,y1); bs.lineTo(-W/2,y1-6); bs.closePath();
  const hb=new T.Path(); hb.moveTo(-W/2+14,y0+22); hb.lineTo(-W/2+14,y1-14);
  hb.lineTo(W/2-14,y1-14); hb.lineTo(W/2-14,y0+22); hb.closePath(); bs.holes.push(hb);
  add(g, profileZY(bs,L), MAT.head, 'head');
  /* 缸盖顶板（气门弹簧座 / 摇臂座 / 推杆通道） */
  const ts=rr(L,W,16);
  for(let i=0;i<4;i++){
    hole(ts, CX(i)-P.valveDX, 0, 15); hole(ts, CX(i)+P.valveDX, 0, 15);
    hole(ts, CX(i), 0, 11);
    hole(ts, CX(i)-P.valveDX, 78, 12); hole(ts, CX(i)+P.valveDX, 78, 12);
  }
  const tp=plateXZ(ts,14); tp.translate(0,y1-14,0);
  add(g, tp, MAT.head, 'head');
  /* 缸盖水套 */
  const ws=rr(L-40,W-40,12);
  for(let i=0;i<4;i++){ hole(ws,CX(i)-P.valveDX,0,26); hole(ws,CX(i)+P.valveDX,0,26); hole(ws,CX(i),0,14); }
  const wg=plateXZ(ws,44); wg.translate(0,y0+22,0);
  const wm=add(g,wg,MAT.water,'headjacket',{noShadow:1}); wm.renderOrder=6; wm.material.depthWrite=false;

  /* 进/排气道（半透明流道体） */
  for(let i=0;i<4;i++){
    const x=CX(i);
    const ip=tubeAlong([[x+P.valveDX,y0+16,0],[x+P.valveDX,y0+34,-16],[x+P.valveDX,y0+30,-58],[x+P.valveDX,y0+18,-W/2-16]],17,34,18);
    const im=add(g,ip,MAT.airv,'intport',{cyl:i,noShadow:1}); im.renderOrder=5; im.material.depthWrite=false;
    const ep=tubeAlong([[x-P.valveDX,y0+16,0],[x-P.valveDX,y0+40,-14],[x-P.valveDX,y0+60,-52],[x-P.valveDX,y0+58,-W/2-16]],15,34,18);
    const em=add(g,ep,MAT.gasv,'exhport',{cyl:i,noShadow:1}); em.renderOrder=5; em.material.depthWrite=false;
    /* 气门座圈 & 导管 */
    for(const [dx,rad] of [[-P.valveDX,P.valveHead.ex/2],[P.valveDX,P.valveHead.in/2]]){
      const seat=new T.Mesh(new T.CylinderGeometry(rad+3.4,rad-0.6,7,32,1,true),MAT.nitride);
      seat.position.set(x+dx,y0+3.5,0); seat.userData.partId='seat'; seat.userData.cyl=i; g.add(seat); PICKABLE.push(seat);
      const gd=tubeGeo(9,P.valveStem/2+0.3,84,20); gd.translate(x+dx,y0+62,0);
      add(g,gd,MAT.bronze,'guide',{cyl:i});
    }
  }
  /* 摇臂轴座 */
  for(let i=0;i<5;i++){
    const x=(i-2)*140;
    const ps=new T.Shape(); ps.moveTo(-17,y1-2); ps.lineTo(-17,P.rockShaftY);
    ps.absarc(0,P.rockShaftY,17,Math.PI,0,true); ps.lineTo(17,y1-2); ps.closePath();
    const hp=new T.Path(); hp.absarc(0,P.rockShaftY,10.4,0,Math.PI*2,true); ps.holes.push(hp);
    add(g,profileZY(ps,26),MAT.cast,'rockstand',{pos:[x,0,P.rockShaftZ]});
  }
  ANIM.head=g;
})();

/* ============================================================== 气缸盖罩 */
(function cover(){
  const g=new T.Group(); G_FIX.add(g); expl(g,[0,300,0]);
  const L=P.blockX*2-8, W=P.blockZ*2-8, y0=P.headTop, y1=P.coverTop;
  const s=new T.Shape();
  s.moveTo(-W/2,y0); s.lineTo(W/2,y0); s.lineTo(W/2,y1-26);
  s.quadraticCurveTo(W/2,y1,W/2-26,y1); s.lineTo(-W/2+26,y1);
  s.quadraticCurveTo(-W/2,y1,-W/2,y1-26); s.closePath();
  const h=new T.Path();
  h.moveTo(-W/2+7,y0); h.lineTo(-W/2+7,y1-28); h.quadraticCurveTo(-W/2+7,y1-7,-W/2+28,y1-7);
  h.lineTo(W/2-28,y1-7); h.quadraticCurveTo(W/2-7,y1-7,W/2-7,y1-28); h.lineTo(W/2-7,y0); h.closePath();
  s.holes.push(h);
  const cm=add(g,profileZY(s,L),MAT.alu,'vcover');
  cm.material=MAT.alu;
  // 加油口 & 呼吸器
  const oil=new T.Mesh(new T.CylinderGeometry(26,28,34,28),MAT.alu); oil.position.set(-250,y1+10,0); oil.userData.partId='oilcap'; g.add(oil); PICKABLE.push(oil);
  const cap=new T.Mesh(new T.CylinderGeometry(30,26,14,28),MAT.plastic); cap.position.set(-250,y1+32,0); cap.userData.partId='oilcap'; g.add(cap); PICKABLE.push(cap);
  const br=new T.Mesh(new T.CylinderGeometry(15,15,40,20),MAT.alu); br.position.set(230,y1+18,30); br.userData.partId='breather'; g.add(br); PICKABLE.push(br);
  // 罩垫
  const gs=rr(L,W,10); const gh=rr(L-16,W-16,8);
  { const pth=new T.Path(); const ps=gh.getPoints(60); pth.moveTo(ps[ps.length-1].x,ps[ps.length-1].y);
    for(let i=ps.length-2;i>=0;i--) pth.lineTo(ps[i].x,ps[i].y); gs.holes=[pth]; }
  const gg=plateXZ(gs,4); gg.translate(0,y0-4,0);
  const gm=add(G_FAST,gg,MAT.rubber,'vcgasket'); expl(gm,[0,284,0]);
  ANIM.cover=g;
})();

/* ================================================================ 油底壳 */
(function pan(){
  const g=new T.Group(); G_FIX.add(g); expl(g,[0,-215,0]);
  const s=new T.Shape();
  s.moveTo(-112,-136); s.lineTo(112,-136); s.lineTo(112,-152); s.lineTo(86,-186);
  s.lineTo(86,-292); s.lineTo(74,-304); s.lineTo(-74,-304); s.lineTo(-86,-292);
  s.lineTo(-86,-186); s.lineTo(-112,-152); s.closePath();
  const h=new T.Path();
  h.moveTo(-104,-142); h.lineTo(104,-142); h.lineTo(104,-152); h.lineTo(78,-184);
  h.lineTo(78,-292); h.lineTo(-78,-292); h.lineTo(-78,-184); h.lineTo(-104,-152); h.closePath();
  s.holes.push(h);
  add(g, profileZY(s, P.blockX*2), MAT.paint, 'pan');
  // 端板
  for(const sx of [-1,1]){
    const e=rr(176,168,10); const eg=plateXZ(e,10); eg.rotateZ(Math.PI/2); eg.translate(sx*P.blockX,-222,0);
    add(g,eg,MAT.paint,'pan');
  }
  // 放油螺塞
  const pl=new T.Mesh(new T.CylinderGeometry(15,15,16,6),MAT.darkSteel); pl.position.set(300,-300,0);
  pl.userData.partId='drain'; g.add(pl); PICKABLE.push(pl);
  // 机油液面（半透明）
  const lv=new T.Mesh(new T.BoxGeometry(P.blockX*2-16,2,150),MAT.oilv);
  lv.position.set(0,-250,0); lv.material.depthWrite=false; lv.renderOrder=4; lv.userData.partId='oilsump'; g.add(lv); PICKABLE.push(lv);
  const lv2=new T.Mesh(new T.BoxGeometry(P.blockX*2-18,50,148),MAT.oilv);
  lv2.position.set(0,-276,0); lv2.material.depthWrite=false; lv2.renderOrder=4; lv2.userData.partId='oilsump'; g.add(lv2);
  ANIM.pan=g;
})();

/* ============================================================== 飞轮壳 */
(function bell(){
  const g=new T.Group(); G_FIX.add(g); expl(g,[285,0,0]);
  const x0=P.blockX+6;
  const s=new T.Shape(); s.absarc(0,60,215,0,Math.PI*2,false);
  const h=new T.Path(); h.absarc(0,60,196,0,Math.PI*2,true); s.holes.push(h);
  const b=profileZY(s,72); b.translate(x0+36,0,0);
  add(g,b,MAT.aluCast,'bell');
  const fl=new T.Shape(); fl.absarc(0,60,215,0,Math.PI*2,false);
  const fh=new T.Path(); fh.absarc(0,60,150,0,Math.PI*2,true); fl.holes.push(fh);
  const fg=profileZY(fl,16); fg.translate(x0+80,0,0);
  add(g,fg,MAT.aluCast,'bell');
  // 与缸体连接的方形法兰
  const sq=rr(190,182,14); const sqh=rr(150,150,10);
  { const pth=new T.Path(); const ps=sqh.getPoints(50); pth.moveTo(ps[ps.length-1].x,ps[ps.length-1].y);
    for(let i=ps.length-2;i>=0;i--) pth.lineTo(ps[i].x,ps[i].y); sq.holes=[pth]; }
  const sg=plateXZ(sq,14); sg.rotateZ(Math.PI/2); sg.translate(x0+7,10,0);
  add(g,sg,MAT.aluCast,'bell');
})();

/* ========================================================== 正时齿轮室 */
(function timing(){
  const g=new T.Group(); G_FIX.add(g);
  const x0=-P.blockX-8;
  // 齿轮室壳体
  const s=new T.Shape();
  s.moveTo(-100,-140); s.lineTo(150,-140); s.lineTo(150,300); s.lineTo(-100,300); s.closePath();
  const h=new T.Path(); h.moveTo(-88,-128); h.lineTo(138,-128); h.lineTo(138,288); h.lineTo(-88,288); h.closePath();
  s.holes.push(h);
  add(g, profileZY(s,86), MAT.aluCast,'tcase',{pos:[x0-43,0,0]});
  // 正时齿轮室盖（可爆炸移开）
  const cs=rr(452,262,18);
  const cg=plateXZ(cs,14); cg.rotateZ(Math.PI/2); cg.translate(x0-86,80,25);
  const cm=add(g,cg,MAT.aluCast,'tcover'); expl(cm,[-285,0,0]);
  ANIM.tcover=cm;
})();
