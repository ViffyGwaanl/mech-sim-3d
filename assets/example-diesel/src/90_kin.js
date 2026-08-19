/* ============================================================ 运动学 / 热力学 */
const KIN=[{},{},{},{}];
const Ap=Math.PI/4*P.bore*P.bore, Vd=Ap*P.stroke, Vc=Vd/(P.cr-1);
const SMAX=P.crankR+P.rodLen;
function pistonS(phi){ const r=P.crankR,L=P.rodLen,sn=Math.sin(phi);
  return r*Math.cos(phi)+Math.sqrt(L*L-r*r*sn*sn); }
function pistonV(phi,w){ const r=P.crankR,L=P.rodLen,sn=Math.sin(phi),cs=Math.cos(phi);
  return -w*r*(sn + r*sn*cs/Math.sqrt(L*L-r*r*sn*sn)); }
function volAt(phi){ return Vc + Ap*(SMAX-pistonS(phi)); }
const STROKES=[
  {n:'做功 / 膨胀',e:'POWER',c:'#e2564a'},
  {n:'排气',      e:'EXHAUST',c:'#98a3b0'},
  {n:'进气',      e:'INTAKE',c:'#4b9df0'},
  {n:'压缩',      e:'COMPRESSION',c:'#f0a63c'}];
function liftOf(psi,peak,half,maxLift){
  let d=((psi-peak)/2)%360; d=((d+540)%360)-180;
  return maxLift*camProfile(Math.abs(d)/half);
}
let CYC=new Float64Array(721).fill(1e5);
function buildCycle(boost,load){
  const g=1.35, Q=2600*load/100, soc=-6, dur=48;
  const P0=(1.0+boost)*1e5, pEx=(1.08+boost*0.35)*1e5;
  const arr=new Float64Array(721);
  const wieb=a=> a<=soc?0:(a>=soc+dur?1:1-Math.exp(-6.9*Math.pow((a-soc)/dur,1.5)));
  let p=P0*0.96, prevX=0;
  const steps=(720-P.ivClose)+P.evOpen;
  for(let k=0;k<=steps;k++){
    const psi=(P.ivClose+k)%720, a=psi>360?psi-720:psi;
    const V =volAt((psi%360)*D2R)*1e-9;
    const V2=volAt(((psi+1)%360)*D2R)*1e-9;
    const x=wieb(a), dx=Math.max(0,x-prevX); prevX=x;
    p += (g-1)*Q*dx/V - g*p*(V2-V)/V;
    if(p<5e4) p=5e4;
    arr[psi]=p;
  }
  const pEV=arr[P.evOpen];
  for(let psi=P.evOpen;psi<=P.ivOpen;psi++)
    arr[psi%720]=lerp(pEV,pEx,Math.pow(clamp((psi-P.evOpen)/48,0,1),0.55));
  for(let psi=P.ivOpen;psi<P.ivClose;psi++)
    arr[psi%720]=lerp(pEx,P0*0.96,clamp((psi-P.ivOpen)/44,0,1));
  arr[720]=arr[0];
  return arr;
}
function cylPressure(psi){
  const a=((psi%720)+720)%720, i=a|0, f=a-i;
  return (CYC[i]+(CYC[i+1]-CYC[i])*f)/1e5;
}
let TRACE=new Array(241).fill(1);

function updateKinematics(){
  const th=ST.theta, thr=th*D2R;
  /* --- 曲轴 / 飞轮 / 减振器 --- */
  ANIM.crank.rotation.x=thr; ANIM.flywheel.rotation.x=thr; ANIM.damper.rotation.x=thr;
  /* --- 活塞 · 连杆 --- */
  const w=ST.rpm*Math.PI/30;
  for(let i=0;i<4;i++){
    const psi=((th+P.phase[i])%720+720)%720, phi=(psi%360)*D2R;
    const s=pistonS(phi), v=pistonV(phi,w)/1000;
    const cy=P.crankR*Math.cos(phi), cz=P.crankR*Math.sin(phi);
    const pk=PISTONS[i], rd=RODS[i];
    pk.mesh.position.set(pk.x,s,0); pk.pin.position.set(pk.x,s,0);
    for(const r of pk.rings) r.m.position.set(pk.x,s+r.y,0);
    const dir=new T.Vector3(0,s-cy,-cz).normalize();
    const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir);
    const cp=new T.Vector3(pk.x,cy,cz);
    for(const o of [rd.rod,rd.cap,rd.bu,rd.bd]){ o.position.copy(cp); o.quaternion.copy(q); }
    rd.bs.position.set(pk.x,s,0);
    const qf=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI);
    for(const b of rd.bolts){
      b.m.position.copy(new T.Vector3(0,-26,b.sz*41).applyQuaternion(q)).add(cp);
      b.m.quaternion.copy(q).multiply(qf);
    }
    const st=STROKES[Math.floor(psi/180)];
    const pr=cylPressure(psi);
    KIN[i]={psi,phi,s,v,stroke:st,press:pr,vol:volAt(phi),cy,cz,
            up: v>0, dispFromTDC: SMAX-s};
  }
  /* --- 凸轮轴 / 气门 --- */
  ANIM.cam.rotation.x=-thr/2;
  for(const V of VALVES){
    const psi=KIN[V.cyl].psi;
    const cl=liftOf(psi,V.peak,V.half,P.camLift), vl=cl*P.rockRatio;
    V.camLift=cl; V.lift=vl;
    const q0=V.p0;
    V.tap.position.set(q0.tap.x, q0.tap.y+cl, q0.tap.z);
    V.pr .position.set(q0.pr.x,  q0.pr.y+cl,  q0.pr.z);
    V.rk .position.copy(q0.rk);
    V.rk.rotation.x=-Math.asin(clamp(vl/P.armValve,-1,1));
    V.vgrp.position.set(q0.vgrp.x, q0.vgrp.y-vl, q0.vgrp.z);
    V.sp .position.copy(q0.sp);
    V.sp.scale.y=(62-vl)/62;
    V.ret.position.set(q0.ret.x, q0.ret.y-vl, q0.ret.z);
  }
  KIN.forEach((k,i)=>{
    k.inLift=0; k.exLift=0;
  });
  for(const V of VALVES){ if(V.type==='in') KIN[V.cyl].inLift=V.lift; else KIN[V.cyl].exLift=V.lift; }
  /* --- 正时齿轮 --- */
  const mp=(beta,zA,zB,phiA)=> beta+Math.PI-Math.PI/zB+(zA/zB)*(beta-phiA);
  const p1=GEARS.betaCam+thr;
  GEARS.crank.rotation.x=p1;
  const p2=mp(GEARS.betaCam,24,48,p1); GEARS.cam.rotation.x=p2;
  GEARS.pump.rotation.x=mp(GEARS.betaPump,48,48,p2);
  GEARS.oil.rotation.x=mp(GEARS.betaOil,24,GEARS.zOil,p1);
  /* --- 附件旋转 --- */
  const spin=thr*1.15;
  if(ANIM.fan) ANIM.fan.rotation.x=spin;
  if(ANIM.impeller) ANIM.impeller.rotation.x=spin;
  if(ANIM.turbo) ANIM.turbo.rotation.z=(ANIM.turbo.rotation.z + 0.42*(0.25+ST.boost)*(ST.rpm/900))%(Math.PI*2);
  /* --- 喷油 --- */
  for(let i=0;i<4;i++){
    const psi=KIN[i].psi, a=psi>360?psi-720:psi;
    const on = ST.load>2 && a>=-P.injAdv && a<=(-P.injAdv+8+ST.load*0.22);
    NODE.inj[i].visible=on;
    KIN[i].inject=on;
    if(on) NODE.inj[i].children.forEach((c,k)=>{ c.material.opacity=0.30+0.32*Math.random(); });
  }
}

/* ------------------------------------------------------------ 工况模拟 */
function updateThermo(dt){
  const rpm=ST.rpm, ld=ST.load/100;
  const bTarget=1.62*Math.pow(clamp((rpm-700)/1800,0,1),1.45)*(0.18+0.82*ld);
  ST.boost=lerp(ST.boost,bTarget,clamp(dt*1.6,0,1));
  const wTarget=76+ld*18+clamp((rpm-1200)/2600,0,1)*6;
  ST.water=lerp(ST.water,wTarget,clamp(dt*0.12,0,1));
  const pT=clamp(0.9+rpm*0.00185,0.9,5.4)*(1-clamp((ST.water-85)/120,0,.28));
  ST.oil=lerp(ST.oil,pT,clamp(dt*1.2,0,1));
  ST.egt=lerp(ST.egt,150+ld*520+clamp((rpm-800)/1800,0,1)*130,clamp(dt*0.8,0,1));
  const shape=1-Math.pow((rpm-1500)/1500,2)*0.28;
  ST.torque=Math.max(0,380*ld*clamp(shape,0.35,1.05));
  ST.cylP=KIN[0].press;
  if(ANIM.thermo) ANIM.thermo.position.y=466+(ST.water>82?clamp((ST.water-82)/8,0,1)*16:0);
}
