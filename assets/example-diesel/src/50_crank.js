/* ==================================================== 曲轴 · 连杆 · 活塞组 */
const MBX=[-280,-140,0,140,280];
const CRANK = new T.Group(); G_CR.add(CRANK);
const PISTONS=[], RODS=[], CAPS=[];

(function crankshaft(){
  const rMain=P.mainJ/2, rRod=P.rodJ/2, R=P.crankR, TH=26;   // 曲柄臂厚
  /* 主轴颈 */
  MBX.forEach((x,i)=>{
    const j=new T.Mesh(new T.CylinderGeometry(rMain,rMain,34,44),MAT.polish);
    j.rotation.z=Math.PI/2; j.position.x=x; j.castShadow=j.receiveShadow=true;
    j.userData.partId='mainjournal'; CRANK.add(j); PICKABLE.push(j);
    const fl=new T.Mesh(new T.CylinderGeometry(rMain+3,rMain+3,3,44),MAT.steel);
    fl.rotation.z=Math.PI/2; fl.position.x=x+18.5; CRANK.add(fl);
    const fl2=fl.clone(); fl2.position.x=x-18.5; CRANK.add(fl2);
  });
  /* 每缸：连杆轴颈 + 两片曲柄臂(含平衡重) */
  for(let i=0;i<4;i++){
    const x=CX(i), a=(i===0||i===3)?0:180, ar=a*D2R;
    const py=R*Math.cos(ar), pz=R*Math.sin(ar);
    const j=new T.Mesh(new T.CylinderGeometry(rRod,rRod,58,40),MAT.polish);
    j.rotation.z=Math.PI/2; j.position.set(x,py,pz); j.castShadow=j.receiveShadow=true;
    j.userData.partId='rodjournal'; j.userData.cyl=i; CRANK.add(j); PICKABLE.push(j);
    for(const sx of [-1,1]){
      const wx = x + sx*(29+TH/2);
      /* 平衡重扇形 */
      const cw=new T.Shape(); const t0=(a+180-64)*D2R, t1=(a+180+64)*D2R;
      cw.moveTo(0,0); cw.lineTo(100*Math.cos(t0),100*Math.sin(t0));
      cw.absarc(0,0,100,t0,t1,false); cw.lineTo(0,0); cw.closePath();
      add(CRANK, profileYZ(cw,TH), MAT.cast, 'counterweight', {pos:[wx,0,0],cyl:i});
      /* 曲柄臂 */
      const arm=new T.Shape(); const w=44;
      const ux=Math.cos(ar), uy=Math.sin(ar);
      const px_=-uy*w, py_=ux*w;
      arm.moveTo(px_,py_); arm.lineTo(px_+ux*R,py_+uy*R);
      arm.absarc(ux*R,uy*R, w, Math.atan2(py_,px_), Math.atan2(py_,px_)+Math.PI, false);
      arm.lineTo(-px_,-py_); arm.absarc(0,0,w,Math.atan2(-py_,-px_),Math.atan2(-py_,-px_)+Math.PI,false);
      arm.closePath();
      add(CRANK, profileYZ(arm,TH), MAT.cast,'crankweb',{pos:[wx,0,0],cyl:i});
      /* 润滑油孔（主轴颈 → 连杆轴颈） */
      const oh=new T.Mesh(new T.CylinderGeometry(3.4,3.4,R+8,10),MAT.oilv);
      oh.position.set(wx, py/2, pz/2); oh.material.depthWrite=false;
      oh.rotation.x = -Math.atan2(pz,py)+Math.PI/2; oh.rotation.x=0;
      oh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), new T.Vector3(0,py,pz).normalize());
      oh.userData.partId='crankoil'; CRANK.add(oh);
    }
  }
  /* 前端轴颈 + 后端法兰 */
  const fs=new T.Mesh(new T.CylinderGeometry(34,34,86,32),MAT.polish);
  fs.rotation.z=Math.PI/2; fs.position.x=-P.blockX-40; fs.userData.partId='crankshaft'; CRANK.add(fs); PICKABLE.push(fs);
  const fs2=new T.Mesh(new T.CylinderGeometry(46,46,44,32),MAT.steel);
  fs2.rotation.z=Math.PI/2; fs2.position.x=-330; CRANK.add(fs2);
  const rf=new T.Mesh(new T.CylinderGeometry(76,76,22,40),MAT.steel);
  rf.rotation.z=Math.PI/2; rf.position.x=P.blockX+22; rf.userData.partId='crankshaft'; CRANK.add(rf); PICKABLE.push(rf);
  /* 前后油封 */
  for(const [x,r] of [[-P.blockX-6,42],[P.blockX+8,80]]){
    const s=new T.Mesh(new T.TorusGeometry(r,6,10,44),MAT.rubber);
    s.rotation.y=Math.PI/2; s.position.x=x; s.userData.partId='crankseal'; G_FAST.add(s); PICKABLE.push(s);
  }
  ANIM.crank=CRANK;
})();

/* ------------------------------------------------------------- 飞轮 & 齿圈 */
(function flywheel(){
  const g=new T.Group(); G_CR.add(g); g.position.x=P.blockX+56;
  const d=new T.Mesh(new T.CylinderGeometry(178,178,26,64),MAT.cast);
  d.rotation.z=Math.PI/2; d.userData.partId='flywheel'; g.add(d); PICKABLE.push(d);
  const h=new T.Mesh(new T.CylinderGeometry(96,96,44,44),MAT.cast); h.rotation.z=Math.PI/2; h.position.x=-14; g.add(h);
  const fr=new T.Mesh(new T.TorusGeometry(150,16,12,54),MAT.cast); fr.rotation.y=Math.PI/2; fr.position.x=14; g.add(fr);
  /* 起动齿圈（渐开线齿）——挂在飞轮组内随飞轮旋转 */
  const z=118, m=2*186/z;
  const gs=gearShape(m,z);
  const hp=new T.Path(); hp.absarc(0,0,168,0,Math.PI*2,true); gs.holes.push(hp);
  const rg=profileYZ(gs,20); rg.translate(16,0,0);
  add(g, rg, MAT.gear, 'ringgear');
  /* 飞轮螺栓——同样随飞轮旋转 */
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2;
    const b=new T.Mesh(boltGeo(16,26),MAT.darkSteel);
    b.position.set(-12, 62*Math.cos(a), 62*Math.sin(a)); b.rotation.z=-Math.PI/2;
    b.userData.partId='bolt'; g.add(b); PICKABLE.push(b); }
  ANIM.flywheel=g;
})();

/* --------------------------------------------------- 曲轴皮带轮 / 扭转减振器 */
(function damper(){
  const g=new T.Group(); G_CR.add(g); g.position.x=-P.blockX-96;
  const hub=new T.Mesh(new T.CylinderGeometry(52,52,38,36),MAT.steel); hub.rotation.z=Math.PI/2;
  hub.userData.partId='damper'; g.add(hub); PICKABLE.push(hub);
  const rub=new T.Mesh(new T.CylinderGeometry(78,78,34,44),MAT.rubber); rub.rotation.z=Math.PI/2; g.add(rub);
  const ring=new T.Mesh(new T.CylinderGeometry(92,92,30,48),MAT.cast); ring.rotation.z=Math.PI/2; ring.position.x=-2; g.add(ring);
  for(let i=0;i<3;i++){ const v=new T.Mesh(new T.TorusGeometry(90,4.5,8,48),MAT.cast);
    v.rotation.y=Math.PI/2; v.position.x=-12+i*11; g.add(v); }
  ANIM.damper=g;
})();

/* ------------------------------------------------------ 活塞 / 环 / 销 / 连杆 */
const rodShapeCache={};
function rodBody(){
  const L=P.rodLen, Rb=48.5, Rs=30, wb=30, ws=19;
  const s=new T.Shape();
  s.moveTo(Rb,0);
  s.absarc(0,0,Rb,0,50*D2R,false);
  s.quadraticCurveTo(wb+8, L*0.40, ws+5, L*0.74);
  s.absarc(0,L,Rs,-22*D2R,202*D2R,false);
  s.quadraticCurveTo(-(ws+13), L*0.40, -Rb*Math.cos(50*D2R), Rb*Math.sin(50*D2R));
  s.absarc(0,0,Rb,130*D2R,180*D2R,false);
  s.lineTo(Rb,0); s.closePath();
  const h1=new T.Path(); h1.moveTo(P.rodJ/2+2.4,0); h1.absarc(0,0,P.rodJ/2+2.4,0,Math.PI,false); h1.lineTo(P.rodJ/2+2.4,0); h1.closePath();
  const h2=new T.Path(); h2.absarc(0,L,P.pinD/2+2.5,0,Math.PI*2,true);
  s.holes.push(h1,h2); return s;
}
function rodCap(){
  const Rb=48.5;
  const s=new T.Shape();
  s.moveTo(Rb,0); s.absarc(0,0,Rb,0,-180*D2R,true); s.lineTo(-Rb,0);
  s.lineTo(-Rb-8,-6); s.lineTo(-Rb-8,-26); s.lineTo(Rb+8,-26); s.lineTo(Rb+8,-6); s.lineTo(Rb,0); s.closePath();
  const h=new T.Path(); h.moveTo(-P.rodJ/2-2.4,0); h.absarc(0,0,P.rodJ/2+2.4,Math.PI,Math.PI*2,false); h.lineTo(-P.rodJ/2-2.4,0); h.closePath();
  s.holes.push(h); return s;
}
function pistonGeo(){
  const R=P.bore/2-0.35;
  const pr=[[0,-46],[32,-46],[46,-48],[R-1,-42],[R,-24],[R,12],
    [R,15],[R-6,15],[R-6,18.4],[R,18.4],
    [R,25],[R-6,25],[R-6,28.4],[R,28.4],
    [R,35],[R-6.5,35],[R-6.5,39.6],[R,39.6],
    [R,50],[R-1.5,54],[38,55],[34.5,51],[30,41],[22,37],[14,41],[8,50],[0,46]];
  return latheY(pr,64);
}
const PGEO=pistonGeo(), RGEO=profileZY(rodBody(),30), CGEO=profileZY(rodCap(),30);
const RINGG=[tubeGeo(P.bore/2+0.05,P.bore/2-6.4,3.2,52),tubeGeo(P.bore/2+0.05,P.bore/2-6.4,3.2,52),tubeGeo(P.bore/2+0.05,P.bore/2-6.6,4.4,52)];
for(let i=0;i<4;i++){
  const x=CX(i);
  const grp=new T.Group(); G_CR.add(grp);
  const pis=add(grp,PGEO,MAT.piston,'piston',{cyl:i}); pis.position.x=x;
  const bowl=new T.Mesh(new T.SphereGeometry(1,4,4),MAT.piston); bowl.visible=false; grp.add(bowl);
  const rings=[];
  [16.7,26.7,37.3].forEach((yy,k)=>{
    const r=add(grp,RINGG[k],k<2?MAT.ring:MAT.polish,'ring',{cyl:i,ringIdx:k});
    r.position.set(x,yy,0); rings.push({m:r,y:yy});
  });
  const pin=add(grp, (()=>{const gg=tubeGeo(P.pinD/2,P.pinD/2-9,P.pinL,28); gg.rotateZ(Math.PI/2); return gg;})(),
                MAT.polish,'pin',{cyl:i}); pin.position.x=x;
  const rod=add(grp,RGEO,MAT.steel,'conrod',{cyl:i});
  const cap=add(grp,CGEO,MAT.steel,'rodcap',{cyl:i});
  /* 连杆大头瓦（上下两片） */
  const shU=(()=>{const sh=new T.Shape(); sh.absarc(0,0,P.rodJ/2+2.4,0,Math.PI,false);
    sh.absarc(0,0,P.rodJ/2+0.4,Math.PI,0,true); sh.closePath(); return profileZY(sh,29);})();
  const shD=(()=>{const sh=new T.Shape(); sh.absarc(0,0,P.rodJ/2+2.4,Math.PI,Math.PI*2,false);
    sh.absarc(0,0,P.rodJ/2+0.4,Math.PI*2,Math.PI,true); sh.closePath(); return profileZY(sh,29);})();
  const bu=add(grp,shU,MAT.bearing,'rodbrg',{cyl:i}), bd=add(grp,shD,MAT.bearing,'rodbrg',{cyl:i});
  /* 小头衬套 */
  const bush=(()=>{const gg=tubeGeo(P.pinD/2+2.4,P.pinD/2+0.4,30,28); gg.rotateZ(Math.PI/2); return gg;})();
  const bs=add(grp,bush,MAT.bronze,'smallbush',{cyl:i});
  /* 连杆螺栓 */
  const bolts=[];
  for(const sz of [-1,1]){ const b=new T.Mesh(boltGeo(14,54),MAT.darkSteel);
    b.userData.partId='rodbolt'; b.userData.cyl=i; grp.add(b); PICKABLE.push(b); bolts.push({m:b,sz}); }
  PISTONS.push({i,x,mesh:pis,rings,pin,grp});
  RODS.push({i,x,rod,cap,bu,bd,bs,bolts});
}
