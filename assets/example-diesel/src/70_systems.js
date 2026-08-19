/* ================================================================ 燃油系统 */
const NODE={};
(function fuel(){
  const g=G_FUEL;
  /* 直列高压油泵 */
  const px=-170, py=272, pz=156;
  const body=new T.Mesh(new T.BoxGeometry(300,104,84),MAT.aluCast);
  body.position.set(px,py,pz); body.userData.partId='ipump'; g.add(body); PICKABLE.push(body); body.castShadow=true;
  const low=new T.Mesh(new T.BoxGeometry(310,52,92),MAT.aluCast);
  low.position.set(px,py-72,pz); low.userData.partId='ipump'; g.add(low); PICKABLE.push(low);
  const gov=new T.Mesh(new T.CylinderGeometry(48,48,70,28),MAT.aluCast);
  gov.rotation.z=Math.PI/2; gov.position.set(px+186,py-30,pz); gov.userData.partId='governor'; g.add(gov); PICKABLE.push(gov);
  /* 出油阀 + 高压油管 → 喷油器 */
  NODE.fuelHP=[];
  for(let i=0;i<4;i++){
    const ox=px-114+i*76, x=CX(i);
    const dv=new T.Mesh(new T.CylinderGeometry(13,15,44,20),MAT.polish);
    dv.position.set(ox,py+70,pz); dv.userData.partId='delivery'; g.add(dv); PICKABLE.push(dv);
    const pts=[[ox,py+88,pz],[ox,py+190,pz+18],[lerp(ox,x,.5),480,110],[x,556,26],[x,574,3]];
    const pipe=tubeAlong(pts,5.2,52,12);
    add(g,pipe,MAT.polish,'hpline',{cyl:i});
    const core=tubeAlong(pts,2.2,52,8);
    const cm=add(g,core,MAT.fuelv,'hpline',{cyl:i,noShadow:1}); cm.renderOrder=7; cm.material.depthWrite=false;
    NODE.fuelHP.push(pts);
  }
  /* 喷油器 ×4 */
  NODE.inj=[];
  for(let i=0;i<4;i++){
    const x=CX(i);
    const prof=[[0,0],[3.2,0],[3.6,6],[5,14],[5,60],[9,66],[9,150],[13,158],[13,196],
                [17,202],[17,236],[13,242],[13,258],[16,262],[16,286]];
    const im=add(g,latheY(prof,26),MAT.polish,'injector',{cyl:i,pos:[x,P.headBot-4,0]});
    const nut=new T.Mesh(new T.CylinderGeometry(21,21,26,6),MAT.darkSteel);
    nut.position.set(x,P.headBot+232,0); nut.userData.partId='injector'; nut.userData.cyl=i; g.add(nut); PICKABLE.push(nut);
    const rt=new T.Mesh(new T.CylinderGeometry(7,7,20,14),MAT.polish); rt.position.set(x,P.headBot+276,0); g.add(rt);
    /* 铜垫 */
    const cw=new T.Mesh(new T.CylinderGeometry(11,11,2.4,20),MAT.copper);
    cw.position.set(x,P.headBot+2,0); cw.userData.partId='injwasher'; G_FAST.add(cw); PICKABLE.push(cw);
    /* 喷雾锥（喷射时显示） */
    const spray=new T.Group(); spray.position.set(x,P.headBot-4,0); G_FUEL.add(spray);
    for(let k=0;k<6;k++){
      const a=k/6*Math.PI*2;
      const cone=new T.Mesh(new T.ConeGeometry(9,64,10,1,true),
        new T.MeshBasicMaterial({color:0xffd98a,transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
      cone.position.set(Math.cos(a)*22,-28,Math.sin(a)*22);
      cone.rotation.z=-Math.cos(a)*0.62; cone.rotation.x=Math.sin(a)*0.62;
      cone.renderOrder=30; spray.add(cone);
    }
    spray.visible=false; NODE.inj.push(spray);
  }
  /* 燃油滤清器 + 输油泵 */
  const ff=new T.Mesh(new T.CylinderGeometry(52,52,150,32),MAT.paint);
  ff.position.set(232,300,168); ff.userData.partId='ffilter'; g.add(ff); PICKABLE.push(ff); ff.castShadow=true;
  const fh=new T.Mesh(new T.CylinderGeometry(56,56,26,32),MAT.aluCast); fh.position.set(232,382,168); g.add(fh);
  const lp=new T.Mesh(new T.CylinderGeometry(30,30,54,24),MAT.aluCast);
  lp.rotation.x=Math.PI/2; lp.position.set(px+60,py-116,pz+34); lp.userData.partId='liftpump'; g.add(lp); PICKABLE.push(lp);
  /* 低压油路 */
  add(g,tubeAlong([[232,300-70,168],[210,180,180],[px+70,px*0+150,pz+40]],6,40,10),MAT.brass,'fuelline');
  add(g,tubeAlong([[px+60,py-140,pz+34],[px+30,py-120,pz+60],[px-60,py-72,pz+46]],6,30,10),MAT.brass,'fuelline');
  add(g,tubeAlong([[-330,600,0],[-100,592,-14],[240,594,20],[300,520,120],[280,420,168]],5,60,10),MAT.brass,'returnline');
  NODE.pumpTop=[px,py+88,pz];
})();

/* ================================================================ 润滑系统 */
(function lube(){
  const g=G_OIL;
  /* 机油泵（齿轮泵） */
  const ox=-P.blockX-42, oy=-78, oz=53.5;
  const pb=new T.Mesh(new T.CylinderGeometry(58,58,52,32),MAT.aluCast);
  pb.rotation.z=Math.PI/2; pb.position.set(ox-40,oy,oz); pb.userData.partId='opump'; g.add(pb); PICKABLE.push(pb);
  const pb2=new T.Mesh(new T.BoxGeometry(52,96,86),MAT.aluCast);
  pb2.position.set(ox-40,oy-30,oz); pb2.userData.partId='opump'; g.add(pb2); PICKABLE.push(pb2);
  /* 集滤器 + 吸油管 */
  const st=new T.Mesh(new T.BoxGeometry(120,20,90),MAT.polish);
  st.position.set(120,-274,0); st.userData.partId='strainer'; g.add(st); PICKABLE.push(st);
  const stm=new T.Mesh(new T.BoxGeometry(112,4,82),new T.MeshStandardMaterial({color:0x8a9099,metalness:1,roughness:.5,wireframe:true}));
  stm.position.set(120,-266,0); g.add(stm);
  add(g,tubeAlong([[120,-264,0],[0,-250,20],[-200,-190,40],[ox-20,-110,oz]],11,50,12),MAT.polish,'pickup');
  /* 机油滤清器 + 机油冷却器 */
  const of=new T.Mesh(new T.CylinderGeometry(56,56,168,32),MAT.paint);
  of.rotation.x=Math.PI/2; of.position.set(60,60,196); of.userData.partId='ofilter'; g.add(of); PICKABLE.push(of); of.castShadow=true;
  const ofh=new T.Mesh(new T.BoxGeometry(150,120,44),MAT.aluCast);
  ofh.position.set(60,66,104); ofh.userData.partId='filterhead'; g.add(ofh); PICKABLE.push(ofh);
  const oc=new T.Mesh(new T.BoxGeometry(230,96,52),MAT.copper);
  oc.position.set(60,178,116); oc.userData.partId='ocooler'; g.add(oc); PICKABLE.push(oc); oc.castShadow=true;
  for(let i=0;i<9;i++){ const p=new T.Mesh(new T.BoxGeometry(228,3,50),MAT.brass);
    p.position.set(60,140+i*9,116); g.add(p); }
  /* 油道连管 */
  add(g,tubeAlong([[ox-40,oy+50,oz],[-300,20,96],[-40,60,110],[10,66,104]],10,40,12),MAT.polish,'oilline');
  add(g,tubeAlong([[110,66,104],[180,90,60],[200,118,-40],[210,120,-72]],10,40,12),MAT.polish,'oilline');
  /* 机油尺 */
  add(g,tubeAlong([[250,-60,120],[250,60,132],[248,190,150],[246,300,150]],6,30,8),MAT.polish,'dipstick');
  const dk=new T.Mesh(new T.CylinderGeometry(11,9,26,16),MAT.plastic); dk.position.set(246,316,150); g.add(dk);
  NODE.oilPump=[ox-40,oy,oz];
})();

/* ================================================================ 冷却系统 */
(function cooling(){
  const g=G_COOL;
  const wx=-P.blockX-120, wy=210;
  /* 水泵 */
  const wv=new T.Mesh(voluteGeo(96,52,44,26,1.0,90,16),MAT.aluCast);
  wv.position.set(wx,wy,0); wv.rotation.y=Math.PI/2; wv.userData.partId='wpump'; g.add(wv); PICKABLE.push(wv); wv.castShadow=true;
  const wh=new T.Mesh(new T.CylinderGeometry(62,62,56,32),MAT.aluCast);
  wh.rotation.z=Math.PI/2; wh.position.set(wx+18,wy,0); wh.userData.partId='wpump'; g.add(wh); PICKABLE.push(wh);
  const imp=new T.Mesh(wheelGeo(8,20,54,26,-0.9,5,true),MAT.cast);
  imp.rotation.z=Math.PI/2; imp.position.set(wx-4,wy,0); imp.userData.partId='impeller'; g.add(imp); PICKABLE.push(imp);
  ANIM.impeller=imp;
  /* 风扇 */
  const fan=new T.Group(); fan.position.set(wx-96,wy,0); g.add(fan);
  const fh=new T.Mesh(new T.CylinderGeometry(34,34,40,24),MAT.darkSteel); fh.rotation.z=Math.PI/2; fan.add(fh);
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2;
    const bl=new T.Mesh(new T.BoxGeometry(8,168,74),MAT.plastic);
    bl.position.set(0,Math.cos(a)*118,Math.sin(a)*118);
    bl.rotation.x=-a+Math.PI/2; bl.rotation.z=0;
    bl.rotateY(0.55);
    bl.userData.partId='fan'; fan.add(bl); PICKABLE.push(bl);
  }
  ANIM.fan=fan;
  /* 节温器 */
  const th=new T.Mesh(new T.CylinderGeometry(52,58,64,28),MAT.aluCast);
  th.position.set(-P.blockX-30,470,0); th.userData.partId='thermostat'; g.add(th); PICKABLE.push(th); th.castShadow=true;
  const thv=new T.Mesh(new T.CylinderGeometry(30,30,10,24),MAT.brass); thv.position.set(-P.blockX-30,466,0); g.add(thv);
  ANIM.thermo=thv;
  const outl=new T.Mesh(new T.CylinderGeometry(30,34,60,24),MAT.aluCast);
  outl.rotation.z=Math.PI/2; outl.position.set(-P.blockX-70,470,0); g.add(outl);
  /* 散热器 */
  const rx=-700;
  const core=new T.Mesh(new T.BoxGeometry(58,430,470),MAT.alu2);
  core.position.set(rx,wy,0); core.userData.partId='radiator'; g.add(core); PICKABLE.push(core); core.castShadow=true;
  const fin=new T.InstancedMesh(new T.BoxGeometry(56,424,1.6),MAT.alu2,46);
  const mtx=new T.Matrix4();
  for(let i=0;i<46;i++){ mtx.makeTranslation(rx,wy,-230+i*10.2); fin.setMatrixAt(i,mtx); }
  fin.userData.partId='radiator'; g.add(fin); PICKABLE.push(fin);
  for(const sy of [-1,1]){
    const tk=new T.Mesh(new T.BoxGeometry(72,62,486),MAT.paint);
    tk.position.set(rx,wy+sy*246,0); tk.userData.partId='radtank'; g.add(tk); PICKABLE.push(tk);
  }
  const cap=new T.Mesh(new T.CylinderGeometry(34,30,30,24),MAT.polish); cap.position.set(rx,wy+292,-150); g.add(cap);
  /* 水管 */
  add(g,tubeAlong([[-P.blockX-96,470,0],[-520,468,0],[-660,440,-140],[rx+10,wy+250,-150]],26,50,16),MAT.hose,'uphose');
  add(g,tubeAlong([[rx+20,wy-244,110],[-600,20,120],[-500,120,60],[wx-40,wy-30,50],[wx-16,wy-6,26]],26,50,16),MAT.hose,'lowhose');
  /* 水泵 → 缸体水套 */
  add(g,tubeAlong([[wx+40,wy,0],[-380,180,-40],[-350,200,-60]],22,24,14),MAT.aluCast,'wtransfer');
  NODE.rad=[rx,wy,0]; NODE.wp=[wx,wy,0];
})();

/* ============================================================ 进排气与增压 */
(function airsys(){
  const g=G_AIR;
  /* 排气歧管 */
  const ey=378, ez=-152;
  const log=new T.Mesh(new T.CylinderGeometry(31,31,600,26),MAT.hot);
  log.rotation.z=Math.PI/2; log.position.set(-20,ey,ez); log.userData.partId='exmanifold'; g.add(log); PICKABLE.push(log); log.castShadow=true;
  for(let i=0;i<4;i++){
    const x=CX(i)-P.valveDX;
    const r=tubeAlong([[x,ey,-P.blockZ-16],[x,ey,-120],[lerp(x,-20,.35),ey,ez]],21,26,14);
    add(g,r,MAT.hot,'exmanifold',{cyl:i});
    const fl=new T.Mesh(new T.BoxGeometry(58,58,12),MAT.hot); fl.position.set(x,ey,-P.blockZ-12); g.add(fl);
    const gk=new T.Mesh(new T.BoxGeometry(60,60,3),MAT.gasket); gk.position.set(x,ey,-P.blockZ-4); gk.userData.partId='exgasket'; G_FAST.add(gk); PICKABLE.push(gk);
  }
  add(g,tubeAlong([[280,ey,ez],[330,ey,-180],[352,368,-214]],26,20,14),MAT.hot,'exmanifold');
  /* 进气歧管 */
  const iy=310, iz=-150;
  const im=new T.Mesh(new T.BoxGeometry(600,80,58),MAT.aluCast);
  im.position.set(-20,iy,iz); im.userData.partId='inmanifold'; g.add(im); PICKABLE.push(im); im.castShadow=true;
  for(let i=0;i<4;i++){
    const x=CX(i)+P.valveDX;
    const r=tubeAlong([[x,338,-P.blockZ-16],[x,332,-116],[lerp(x,-20,.3),iy+6,iz+20]],23,26,14);
    add(g,r,MAT.aluCast,'inmanifold',{cyl:i});
    const gk=new T.Mesh(new T.BoxGeometry(62,62,3),MAT.gasket); gk.position.set(x,338,-P.blockZ-4); gk.userData.partId='ingasket'; G_FAST.add(gk); PICKABLE.push(gk);
  }
  /* 涡轮增压器 */
  const tb=new T.Group(); tb.position.set(352,352,-250); g.add(tb);
  const turb=new T.Mesh(voluteGeo(128,74,46,22,1.0,110,18),MAT.hot);
  turb.position.set(0,0,42); turb.userData.partId='turbine'; tb.add(turb); PICKABLE.push(turb); turb.castShadow=true;
  const th2=new T.Mesh(new T.CylinderGeometry(76,76,54,36),MAT.hot); th2.rotation.x=Math.PI/2; th2.position.set(0,0,34); tb.add(th2);
  const comp=new T.Mesh(voluteGeo(120,70,42,20,1.0,110,18),MAT.alu);
  comp.position.set(0,0,-52); comp.userData.partId='compressor'; tb.add(comp); PICKABLE.push(comp); comp.castShadow=true;
  const ch2=new T.Mesh(new T.CylinderGeometry(70,70,50,36),MAT.alu); ch2.rotation.x=Math.PI/2; ch2.position.set(0,0,-44); tb.add(ch2);
  const cen=new T.Mesh(new T.CylinderGeometry(46,52,68,32),MAT.aluCast); cen.rotation.x=Math.PI/2; cen.position.set(0,0,-4); cen.userData.partId='chra'; tb.add(cen); PICKABLE.push(cen);
  for(let i=0;i<4;i++){ const rib=new T.Mesh(new T.TorusGeometry(48,4,8,28),MAT.aluCast); rib.position.set(0,0,-24+i*14); tb.add(rib); }
  const rot=new T.Group(); tb.add(rot);
  const tw=new T.Mesh(wheelGeo(11,17,60,54,1.15,6,false),MAT.hot);
  tw.rotation.x=-Math.PI/2; tw.position.set(0,0,58); tw.userData.partId='turbwheel'; rot.add(tw); PICKABLE.push(tw);
  const cw2=new T.Mesh(wheelGeo(9,16,56,50,-1.25,5,true),MAT.alu);
  cw2.rotation.x=Math.PI/2; cw2.position.set(0,0,-64); cw2.userData.partId='compwheel'; rot.add(cw2); PICKABLE.push(cw2);
  const sft=new T.Mesh(new T.CylinderGeometry(11,11,140,20),MAT.polish); sft.rotation.x=Math.PI/2; rot.add(sft);
  ANIM.turbo=rot;
  const wg=new T.Mesh(new T.CylinderGeometry(38,38,40,26),MAT.hot); wg.rotation.x=Math.PI/2; wg.position.set(352,250,-240); wg.userData.partId='wastegate'; g.add(wg); PICKABLE.push(wg);
  /* 排气出口 */
  add(g,tubeAlong([[352,352,-168],[352,300,-150],[352,170,-140],[352,40,-140]],36,30,18),MAT.hot,'exhpipe');
  /* 中冷器 */
  const icx=-810;
  const ic=new T.Mesh(new T.BoxGeometry(52,250,440),MAT.alu2);
  ic.position.set(icx,150,0); ic.userData.partId='intercooler'; g.add(ic); PICKABLE.push(ic); ic.castShadow=true;
  const icf=new T.InstancedMesh(new T.BoxGeometry(50,244,1.6),MAT.alu2,40);
  { const mtx=new T.Matrix4(); for(let i=0;i<40;i++){ mtx.makeTranslation(icx,150,-215+i*11); icf.setMatrixAt(i,mtx);} }
  icf.userData.partId='intercooler'; g.add(icf); PICKABLE.push(icf);
  for(const sz of [-1,1]){ const tk=new T.Mesh(new T.BoxGeometry(64,266,54),MAT.alu);
    tk.position.set(icx,150,sz*236); tk.userData.partId='intercooler'; g.add(tk); PICKABLE.push(tk); }
  /* 增压管路：压气机 → 中冷器 → 进气歧管 */
  add(g,tubeAlong([[472,352,-302],[430,300,-370],[200,180,-400],[-300,90,-390],[-700,110,-300],[icx+10,150,-236]],30,70,16),MAT.hose,'boostpipe');
  add(g,tubeAlong([[icx+10,150,236],[-600,180,300],[-200,250,-60],[-90,300,-130],[-40,306,-150]],30,70,16),MAT.hose,'boostpipe');
  /* 空气滤清器 */
  const af=new T.Mesh(new T.CylinderGeometry(84,84,230,32),MAT.plastic);
  af.rotation.z=Math.PI/2; af.position.set(300,140,-430); af.userData.partId='airfilter'; g.add(af); PICKABLE.push(af); af.castShadow=true;
  add(g,tubeAlong([[186,140,-430],[200,240,-400],[300,300,-330],[344,340,-306]],30,40,16),MAT.hose,'inpipe');
  NODE.turbo=[352,352,-250]; NODE.ic=[icx,150,0];
})();

/* ============================================================ 紧固与密封件 */
(function fasteners(){
  const bg=boltGeo(20,74,14);
  const pos=[];
  for(const x of [-280,-140,0,140,280]) for(const z of [-76,76]) pos.push([x,P.headTop,z]);
  for(let i=0;i<4;i++) pos.push([CX(i),P.headTop,88-12]);
  const hb=new T.InstancedMesh(bg,MAT.darkSteel,pos.length);
  const m4=new T.Matrix4();
  pos.forEach((p,i)=>{ m4.makeTranslation(p[0],p[1]+16,p[2]); hb.setMatrixAt(i,m4); });
  hb.userData.partId='headbolt'; hb.castShadow=true; G_FAST.add(hb); PICKABLE.push(hb);
  /* 主轴承盖螺栓 */
  const mb=new T.InstancedMesh(boltGeo(18,86,12),MAT.darkSteel,10);
  let k=0; for(const x of MBX) for(const z of [-40,40]){ m4.makeTranslation(x,-58,z); m4.multiply(new T.Matrix4().makeRotationZ(Math.PI)); mb.setMatrixAt(k++,m4); }
  mb.userData.partId='mainbolt'; mb.castShadow=true; G_FAST.add(mb); PICKABLE.push(mb);
  /* 油底壳螺栓 */
  const pn=[];
  for(let i=0;i<13;i++){ const x=-330+i*55; pn.push([x,-136,-108],[x,-136,108]); }
  const pb=new T.InstancedMesh(boltGeo(12,34,9),MAT.darkSteel,pn.length);
  pn.forEach((p,i)=>{ m4.makeTranslation(p[0],p[1]+4,p[2]); m4.multiply(new T.Matrix4().makeRotationZ(Math.PI)); pb.setMatrixAt(i,m4); });
  pb.userData.partId='panbolt'; G_FAST.add(pb); PICKABLE.push(pb);
  /* 气门室罩螺栓 */
  const vb=[]; for(let i=0;i<7;i++){ const x=-300+i*100; vb.push([x,P.coverTop,-62],[x,P.coverTop,62]); }
  const vbm=new T.InstancedMesh(boltGeo(11,26,8),MAT.polish,vb.length);
  vb.forEach((p,i)=>{ m4.makeTranslation(p[0],p[1]+10,p[2]); vbm.setMatrixAt(i,m4); });
  vbm.userData.partId='vcbolt'; G_FAST.add(vbm); PICKABLE.push(vbm);
})();

/* ================================================================== 三维标注 */
const LABELS=[];
[['气缸盖 Cylinder Head','CYLINDER HEAD',[0,560,-150],'#dff6fa'],
 ['气缸体 Cylinder Block','CYLINDER BLOCK',[-430,120,190],'#dff6fa'],
 ['曲轴 Crankshaft','CRANKSHAFT',[120,-90,220],'#e8f0ff'],
 ['涡轮增压器 Turbocharger','TURBOCHARGER',[352,470,-320],'#ffd0c8'],
 ['散热器 Radiator','RADIATOR',[-700,500,0],'#bfe0ff'],
 ['中冷器 Intercooler','CHARGE AIR COOLER',[-810,330,0],'#bfe0ff'],
 ['高压油泵 Injection Pump','INJECTION PUMP',[-170,410,260],'#f6e9a8'],
 ['机油滤清器 Oil Filter','OIL FILTER',[60,-30,300],'#ffdca8'],
 ['飞轮 Flywheel','FLYWHEEL',[470,-140,0],'#e8f0ff'],
 ['正时齿轮系 Timing Gears','TIMING GEAR TRAIN',[-470,-190,120],'#dff6fa']
].forEach(([a,b,p,c])=>{ const s=labelSprite(a,b,c); s.position.set(p[0],p[1],p[2]); ROOT.add(s); LABELS.push(s); });
