/* ==================================================================== 配气机构 */
const VALVES=[], EV_PEAK=(P.evOpen+P.evClose)/2, IN_PEAK=(P.ivOpen+P.ivClose)/2;
const EV_HALF=(P.evClose-P.evOpen)/4, IN_HALF=(P.ivClose-P.ivOpen)/4;
const CAMG=new T.Group(); CAMG.position.set(0,P.camY,P.camZ); G_VT.add(CAMG);

/* --------------------------------------------------------------- 凸轮轴 */
(function camshaft(){
  const L=P.blockX*2+70;
  const sh=new T.Mesh(new T.CylinderGeometry(17,17,L,30),MAT.nitride);
  sh.rotation.z=Math.PI/2; sh.userData.partId='camshaft'; CAMG.add(sh); PICKABLE.push(sh);
  /* 轴颈 ×5 */
  MBX.forEach(x=>{ const j=new T.Mesh(new T.CylinderGeometry(24,24,26,30),MAT.polish);
    j.rotation.z=Math.PI/2; j.position.x=x; CAMG.add(j);
    const b=new T.Mesh(new T.CylinderGeometry(28,28,22,30,1,true),MAT.bronze);
    b.rotation.z=Math.PI/2; b.position.x=x; b.userData.partId='cambush'; CAMG.add(b); PICKABLE.push(b); });
  /* 凸轮 ×8 */
  for(let i=0;i<4;i++){
    for(const t of ['ex','in']){
      const peak = t==='ex'?EV_PEAK:IN_PEAK, half=t==='ex'?EV_HALF:IN_HALF;
      const nose = (((peak-P.phase[i])/2)%360+360)%360;
      const s=camShape(P.camBase,P.camLift,half,nose);
      const hp=new T.Path(); hp.absarc(0,0,17,0,Math.PI*2,true); s.holes.push(hp);
      const g=profileYZ(s,22);
      const x=CX(i)+(t==='ex'?-P.valveDX:P.valveDX);
      add(CAMG,g,MAT.nitride,'camlobe',{pos:[x,0,0],cyl:i,vtype:t});
    }
  }
  ANIM.cam=CAMG;
})();

/* --------------------------- 挺柱 / 推杆 / 摇臂 / 气门 / 弹簧 / 弹簧座 */
const rockerGeo=(()=>{
  const s=new T.Shape();
  const PY=0, PZ=0, VZ=-P.armValve, UZ=P.armPush;   // 局部：支点原点，气门端 z=-36，推杆端 z=+56
  s.moveTo(VZ-13, 9); s.lineTo(VZ-13,-9);
  s.quadraticCurveTo(VZ-16,-13, VZ-9,-13);
  s.lineTo(-6,-13); s.lineTo(16,-14); s.lineTo(UZ-6,-11);
  s.quadraticCurveTo(UZ+9,-11, UZ+9,-1);
  s.lineTo(UZ+9, 10); s.quadraticCurveTo(UZ+9,15, UZ+2,15);
  s.lineTo(14,18); s.lineTo(-8,16); s.lineTo(VZ-9,13);
  s.quadraticCurveTo(VZ-16,13, VZ-13,9); s.closePath();
  const h=new T.Path(); h.absarc(0,0,11,0,Math.PI*2,true); s.holes.push(h);
  const h2=new T.Path(); h2.absarc(UZ,2,5,0,Math.PI*2,true); s.holes.push(h2);
  return profileZY(s,18);
})();
/* 摇臂轴 */
(function rockshaft(){
  const g=new T.Mesh(new T.CylinderGeometry(10,10,P.blockX*2-20,26),MAT.polish);
  g.rotation.z=Math.PI/2; g.position.set(0,P.rockShaftY,P.rockShaftZ);
  g.userData.partId='rockshaft'; G_VT.add(g); PICKABLE.push(g);
})();

for(let i=0;i<4;i++){
  for(const t of ['ex','in']){
    const dx = t==='ex'?-P.valveDX:P.valveDX, x=CX(i)+dx;
    const peak = t==='ex'?EV_PEAK:IN_PEAK, half=t==='ex'?EV_HALF:IN_HALF;
    const dH = t==='ex'?P.valveHead.ex:P.valveHead.in;
    /* 挺柱 */
    const tap=new T.Group(); G_VT.add(tap); tap.position.set(x,0,P.camZ);
    const tb=add(tap,(()=>{const g=tubeGeo(P.tappetD/2,P.tappetD/2-5,66,26); g.translate(0,P.camY+20+33,0); return g;})(),MAT.nitride,'tappet',{cyl:i,vtype:t});
    const tf=add(tap,(()=>{const g=cyl(P.tappetD/2,P.tappetD/2,7,26); g.translate(0,P.camY+23.5,0); return g;})(),MAT.nitride,'tappet',{cyl:i,vtype:t});
    /* 推杆 */
    const pr=new T.Group(); G_VT.add(pr);
    const y0=P.camY+20+66, y1=P.rockShaftY-6;
    const pg=tubeAlong([[x,y0,P.camZ],[x,(y0+y1)/2,P.camZ+(P.pushZtop-P.camZ)*0.5],[x,y1,P.pushZtop]],5.5,16,12);
    add(pr,pg,MAT.polish,'pushrod',{cyl:i,vtype:t});
    const cup=new T.Mesh(new T.SphereGeometry(9,18,12,0,Math.PI*2,0,Math.PI/2),MAT.polish);
    cup.position.set(x,y0-2,P.camZ); pr.add(cup);
    /* 摇臂 */
    const rk=new T.Group(); rk.position.set(x,P.rockShaftY,P.rockShaftZ); G_VT.add(rk);
    add(rk,rockerGeo,MAT.cast,'rocker',{cyl:i,vtype:t});
    const adj=new T.Mesh(new T.CylinderGeometry(7,7,16,16),MAT.polish);
    adj.position.set(0,4,P.armPush); rk.add(adj);
    /* 气门 */
    const vg=latheY([[0,0],[dH/2-7,0],[dH/2,4.6],[dH/2,8.4],[dH/2-7,13],[13,20],[8.5,30],
                     [P.valveStem/2,40],[P.valveStem/2,170],[P.valveStem/2-1.4,173],[0,173]],40);
    const vgrp=new T.Group(); vgrp.position.set(x,P.headBot,0); G_VT.add(vgrp);
    add(vgrp,vg,t==='ex'?MAT.hot:MAT.polish,'valve',{cyl:i,vtype:t});
    /* 弹簧 + 弹簧座 + 锁夹 */
    const sp=new T.Mesh(springGeo(21,4.6,6.5,62),MAT.polish);
    sp.position.set(x,P.headTop,0); sp.userData.partId='vspring'; sp.userData.cyl=i; sp.userData.vtype=t;
    sp.castShadow=true; G_VT.add(sp); PICKABLE.push(sp);
    const seat=new T.Mesh(new T.CylinderGeometry(29,29,5,28),MAT.darkSteel); seat.position.set(x,P.headTop-2,0); G_VT.add(seat);
    const ret=new T.Group(); ret.position.set(x,P.headTop+62,0); G_VT.add(ret);
    const rm=new T.Mesh(new T.CylinderGeometry(26,17,10,28),MAT.darkSteel); rm.position.y=3; rm.userData.partId='retainer';
    rm.userData.cyl=i; rm.userData.vtype=t; ret.add(rm); PICKABLE.push(rm);
    const kp=new T.Mesh(new T.CylinderGeometry(8,6.5,11,20),MAT.polish); kp.position.y=4; ret.add(kp);
    /* 气门油封 */
    const os=new T.Mesh(new T.CylinderGeometry(9.5,11,10,20),MAT.rubber);
    os.position.set(x,P.headTop-8,0); os.userData.partId='vseal'; G_FAST.add(os); PICKABLE.push(os);
    VALVES.push({cyl:i,type:t,x,peak,half,tap,pr,rk,vgrp,sp,ret,lift:0,camLift:0,
      p0:{tap:tap.position.clone(),pr:pr.position.clone(),rk:rk.position.clone(),
          vgrp:vgrp.position.clone(),sp:sp.position.clone(),ret:ret.position.clone()}});
  }
}

/* --------------------------------------------------------------- 正时齿轮系 */
const GEARS={};
(function timingGears(){
  const gx=-P.blockX-42;
  const dCam=Math.hypot(P.camY,P.camZ), m=2*dCam/(24+48);
  const mk=(z,pos,part)=>{
    const s=gearShape(m,z);
    const hp=new T.Path(); hp.absarc(0,0, z===24?26:z*m/2-30, 0,Math.PI*2,true); s.holes.push(hp);
    const g=profileYZ(s,24);
    const mesh=add(G_VT,g,MAT.gear,part,{pos:[gx,pos[0],pos[1]]});
    /* 轮辐 */
    if(z>24){ const w=new T.Mesh(new T.CylinderGeometry(z*m/2-28,z*m/2-28,10,40),MAT.gear);
      w.rotation.z=Math.PI/2; w.position.set(gx,pos[0],pos[1]); G_VT.add(w);
      const hb=new T.Mesh(new T.CylinderGeometry(30,30,26,26),MAT.gear);
      hb.rotation.z=Math.PI/2; hb.position.set(gx,pos[0],pos[1]); G_VT.add(hb); }
    return mesh;
  };
  GEARS.crank=mk(24,[0,0],'crankgear');
  GEARS.cam  =mk(48,[P.camY,P.camZ],'camgear');
  GEARS.pump =mk(48,[265,121],'pumpgear');
  GEARS.betaCam = Math.atan2(P.camZ,P.camY);
  GEARS.betaPump= Math.atan2(121-P.camZ,265-P.camY);
  GEARS.z1=24; GEARS.z2=48;
  /* 惰轮轴/油泵齿轮 */
  const dOil=Math.hypot(78,53.5);
  const zo=Math.round(2*dOil/m-24);
  const so=gearShape(m,zo); const hp=new T.Path(); hp.absarc(0,0,zo*m/2-26,0,Math.PI*2,true); so.holes.push(hp);
  GEARS.oil=add(G_OIL,profileYZ(so,20),MAT.gear,'oilgear',{pos:[gx,-78,53.5]});
  GEARS.betaOil=Math.atan2(53.5,-78); GEARS.zOil=zo;
})();
