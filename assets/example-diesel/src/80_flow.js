/* ============================================================ 流动可视化 */
function sprite(col){
  const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  const rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(.28,col);
  rg.addColorStop(.75,col.replace('rgb','rgba').replace(')',',0.35)')); rg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=rg; g.beginPath(); g.arc(32,32,32,0,7); g.fill();
  const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t;
}
const FLOWS=[];
function makeFlow(name,label,color,lanes,count,size,speed,additive,tubeR){
  const polys=lanes.map(pts=>{
    const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2])), !!pts.closed,'centripetal',0.35);
    const N=Math.max(120,Math.round(c.getLength()/9));
    return {P:c.getSpacedPoints(N), L:c.getLength(), N, curve:c};
  });
  const total=count;
  const pos=new Float32Array(total*3), state=[];
  for(let i=0;i<total;i++){
    const li=i%polys.length;
    state.push({l:li, t:(i/total)*polys[li].N + Math.random()*3});
  }
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(pos,3));
  const mat=new T.PointsMaterial({size, map:sprite(color), transparent:true, depthWrite:false,
    blending:additive?T.AdditiveBlending:T.NormalBlending, sizeAttenuation:true, opacity:additive?.95:1});
  const pts=new T.Points(geo,mat); pts.frustumCulled=false; pts.renderOrder=25; ROOT.add(pts);
  /* 半透明流线管 */
  const tg=new T.Group(); ROOT.add(tg); tg.visible=false;
  polys.forEach(pl=>{
    const t=new T.Mesh(new T.TubeGeometry(pl.curve, Math.min(240,pl.N), tubeR||6, 8, false),
      new T.MeshBasicMaterial({color:new T.Color(color), transparent:true, opacity:.16, depthWrite:false, side:T.DoubleSide}));
    t.renderOrder=3; tg.add(t);
  });
  const F={name,label,color,polys,state,geo,pts,tubes:tg,speed};
  FLOWS.push(F); return F;
}
/* ---- 冷却液大循环 ---- */
const coolPts=[[-472,210,0],[-400,200,-40],[-330,190,-62],[-210,200,-62],[-210,262,-40],
 [-70,250,-62],[-70,282,-30],[70,250,-62],[70,282,-30],[210,250,-62],[210,292,-20],
 [300,300,-10],[300,352,20],[210,362,26],[70,366,20],[-70,366,-16],[-210,362,20],
 [-330,382,0],[-382,462,0],[-520,468,0],[-660,440,-140],[-690,452,-150],
 [-700,380,-60],[-700,260,60],[-700,120,-60],[-700,-20,60],[-690,-34,110],
 [-600,20,120],[-500,120,60],[-500,180,50],[-488,204,26]];
coolPts.closed=true;
makeFlow('cool','冷却液 Coolant','rgb(70,170,255)',[coolPts],320,0.085,1.0,false,7);

/* ---- 机油循环 ---- */
const oilPts=[[120,-274,0],[0,-250,20],[-200,-190,40],[-390,-120,53],[-412,-78,53],[-402,-20,66],
 [-300,20,96],[-40,60,110],[10,66,104],[60,60,170],[110,66,104],[60,140,116],[60,190,116],
 [180,96,60],[210,122,-72],[100,120,-72],[-60,120,-72],[-280,120,-72],[-280,64,-40],[-280,14,-8],
 [-140,60,-60],[-140,240,-78],[-140,430,-78],[-140,496,36],[70,498,36],[280,496,36],
 [286,466,80],[300,200,96],[300,-100,66],[250,-250,26]];
oilPts.closed=true;
makeFlow('oil','机油 Lube Oil','rgb(255,170,50)',[oilPts],300,0.082,1.0,false,6);

/* ---- 进气（空滤→压气机→中冷→进气歧管→进气道） ---- */
const spiralC=[]; for(let i=0;i<=26;i++){ const u=i/26, R=lerp(74,124,u), a=-u*Math.PI*1.9;
  spiralC.push([352+R*Math.cos(a), 352+R*Math.sin(a), -302]); }
const airMain=[[414,140,-430],[280,140,-430],[220,180,-420],[300,300,-346],[352,346,-330],[352,352,-316]]
  .concat(spiralC)
  .concat([[472,352,-302],[430,300,-370],[200,180,-400],[-300,90,-390],[-700,110,-300],[-800,150,-236],
           [-800,150,-100],[-800,150,100],[-800,150,236],[-600,180,300],[-200,250,-60],[-90,300,-130],[-40,306,-150]]);
const airLanes=[airMain];
for(let i=0;i<4;i++){ const x=CX(i)+P.valveDX;
  airLanes.push([[-20+ (i-1.5)*30,310,-150],[lerp(x,-20,.3),316,-130],[x,332,-116],[x,338,-104],
                 [x,P.headBot+18,-58],[x,P.headBot+30,-16],[x,P.headBot+14,0],[x,P.headBot-30,0],[x,P.headBot-70,4]]); }
makeFlow('air','进气 Charge Air','rgb(90,210,245)',airLanes,300,0.075,2.1,true,6);

/* ---- 废气（排气道→歧管→涡轮→排气管） ---- */
const spiralT=[]; for(let i=0;i<=26;i++){ const u=i/26, R=lerp(128,76,u), a=u*Math.PI*1.9;
  spiralT.push([352+R*Math.cos(a), 352+R*Math.sin(a), -208]); }
const gasLanes=[];
for(let i=0;i<4;i++){ const x=CX(i)-P.valveDX;
  gasLanes.push([[x,P.headBot-60,4],[x,P.headBot+10,0],[x,P.headBot+40,-14],[x,P.headBot+58,-60],
                 [x,378,-104],[x,378,-120],[lerp(x,-20,.35),378,-152],[Math.max(x,60),378,-152],[280,378,-152]]); }
gasLanes.push([[280,378,-152],[330,378,-180],[352,368,-214]].concat(spiralT)
  .concat([[352,352,-196],[352,352,-172],[352,300,-150],[352,170,-140],[352,40,-140]]));
makeFlow('gas','废气 Exhaust','rgb(255,95,70)',gasLanes,280,0.078,2.4,true,6);

function updateFlows(dt){
  const rpm=ST.rpm, ld=0.35+0.65*ST.load/100;
  for(const F of FLOWS){
    if(!ST.flow){ F.pts.visible=false; continue; } F.pts.visible=true;
    const v=(F.name==='cool'||F.name==='oil') ? (260+rpm*1.15)*F.speed*(F.name==='cool'?(ST.water>82?1:0.34):1)
                                              : (300+rpm*1.5)*ld*F.speed;
    const arr=F.geo.attributes.position.array;
    for(let i=0;i<F.state.length;i++){
      const st=F.state[i], pl=F.polys[st.l];
      st.t += v*dt*(pl.N-1)/pl.L;
      if(st.t>=pl.N-1) st.t -= (pl.N-1);
      const i0=st.t|0, f=st.t-i0, a=pl.P[i0], b=pl.P[Math.min(i0+1,pl.N-1)];
      arr[i*3]  =a.x+(b.x-a.x)*f;
      arr[i*3+1]=a.y+(b.y-a.y)*f;
      arr[i*3+2]=a.z+(b.z-a.z)*f;
    }
    F.geo.attributes.position.needsUpdate=true;
    F.tubes.visible=ST.paths;
  }
}
