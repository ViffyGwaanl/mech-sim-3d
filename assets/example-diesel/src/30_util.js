/* ============================================================ 材质库 (PBR) */
const OUTER=[], ALLMAT=[];
function M(name, o, outer){
  const m = new T.MeshStandardMaterial(Object.assign({
    color:0x888888, roughness:.5, metalness:1, envMapIntensity:1.0
  }, o));
  m.name=name; m.userData.base={op:m.opacity, tr:m.transparent};
  if(outer){ m.clippingPlanes=CLIPS; m.clipShadows=true; m.side=T.DoubleSide; OUTER.push(m); }
  ALLMAT.push(m); return m;
}
const MAT = {
  iron:      M('铸铁',{color:0x585e66,roughness:.74,metalness:.88,envMapIntensity:.85},1),
  ironIn:    M('铸铁-内壁',{color:0x4a5057,roughness:.86,metalness:.7,envMapIntensity:.6}),
  head:      M('缸盖铸铁',{color:0x616873,roughness:.70,metalness:.88,envMapIntensity:.9},1),
  alu:       M('铝合金',{color:0xb6bcc3,roughness:.40,metalness:1,envMapIntensity:1.1},1),
  aluCast:   M('铸铝',{color:0x9fa6ad,roughness:.62,metalness:.95,envMapIntensity:.95},1),
  steel:     M('锻钢',{color:0x8b929b,roughness:.34,metalness:1,envMapIntensity:1.15}),
  polish:    M('磨削钢',{color:0xd3d9df,roughness:.10,metalness:1,envMapIntensity:1.35}),
  nitride:   M('渗氮钢',{color:0x777f89,roughness:.24,metalness:1,envMapIntensity:1.2}),
  gear:      M('渗碳齿轮钢',{color:0x99a1aa,roughness:.28,metalness:1,envMapIntensity:1.2}),
  piston:    M('共晶铝硅活塞',{color:0xc9cdd2,roughness:.30,metalness:1,envMapIntensity:1.2}),
  ring:      M('活塞环',{color:0x3f454c,roughness:.28,metalness:1,envMapIntensity:1.1}),
  bearing:   M('铜铅轴瓦',{color:0xc78a4e,roughness:.35,metalness:1,envMapIntensity:1.2}),
  bronze:    M('青铜导管',{color:0xb5793f,roughness:.45,metalness:1,envMapIntensity:1.05}),
  copper:    M('紫铜',{color:0xc4703c,roughness:.28,metalness:1,envMapIntensity:1.25},1),
  rubber:    M('丁腈橡胶',{color:0x22252a,roughness:.94,metalness:.02,envMapIntensity:.5}),
  hose:      M('硅胶软管',{color:0x2b2f36,roughness:.86,metalness:.03,envMapIntensity:.6},1),
  gasket:    M('复合垫片',{color:0x2f6a52,roughness:.80,metalness:.25,envMapIntensity:.6},1),
  paint:     M('涂装钢板',{color:0x2e353e,roughness:.55,metalness:.55,envMapIntensity:.85},1),
  alu2:      M('散热铝',{color:0x8e969e,roughness:.55,metalness:1,envMapIntensity:.95},1),
  darkSteel: M('发黑钢',{color:0x35393f,roughness:.42,metalness:1,envMapIntensity:.9},1),
  cast:      M('球墨铸铁',{color:0x50565d,roughness:.66,metalness:.9,envMapIntensity:.85}),
  hot:       M('耐热合金',{color:0x6b6055,roughness:.62,metalness:.95,envMapIntensity:.9},1),
  plastic:   M('工程塑料',{color:0x2b3038,roughness:.6,metalness:.1,envMapIntensity:.7},1),
  water:     M('冷却液',{color:0x2b8fd8,roughness:.15,metalness:0,transparent:true,opacity:.26,envMapIntensity:1.4,side:T.DoubleSide}),
  oilv:      M('机油',{color:0xd08b1e,roughness:.18,metalness:0,transparent:true,opacity:.24,envMapIntensity:1.4,side:T.DoubleSide}),
  airv:      M('进气',{color:0x5ec8e8,roughness:.2,metalness:0,transparent:true,opacity:.22,envMapIntensity:1.2,side:T.DoubleSide}),
  gasv:      M('废气',{color:0xd2564b,roughness:.2,metalness:0,transparent:true,opacity:.22,envMapIntensity:1.2,side:T.DoubleSide}),
  fuelv:     M('柴油',{color:0xe0c341,roughness:.2,metalness:0,transparent:true,opacity:.26,envMapIntensity:1.2,side:T.DoubleSide}),
};
MAT.brass = M('黄铜',{color:0xc9a24a,roughness:.30,metalness:1,envMapIntensity:1.2},1);

/* ======================================================== 坐标变换与挤出工具 */
const M_YZX = new T.Matrix4().set(0,0,1,0, 1,0,0,0, 0,1,0,0, 0,0,0,1);
const M_ZYX = new T.Matrix4().set(0,0,-1,0, 0,1,0,0, 1,0,0,0, 0,0,0,1);
/* 轮廓画在 (z,y) 主视图平面，沿 X 挤出（机体/连杆/摇臂等） */
function profileZY(shape, len, opts){
  const g = new T.ExtrudeGeometry(shape, Object.assign({depth:len, bevelEnabled:false, curveSegments:24}, opts||{}));
  g.applyMatrix4(M_ZYX); g.translate(len/2,0,0); g.computeVertexNormals(); return g;
}
/* 轮廓画在 (y,z) 平面，沿 X 挤出（发动机横截面类零件） */
function profileYZ(shape, len, opts){
  const g = new T.ExtrudeGeometry(shape, Object.assign({depth:len, bevelEnabled:false, curveSegments:24}, opts||{}));
  g.applyMatrix4(M_YZX); g.translate(-len/2,0,0); g.computeVertexNormals(); return g;
}
/* 轮廓画在 (x,z) 平面，沿 Y 挤出（带孔平板类零件），返回 y∈[0,thick] */
function plateXZ(shape, thick, opts){
  const g = new T.ExtrudeGeometry(shape, Object.assign({depth:thick, bevelEnabled:false, curveSegments:24}, opts||{}));
  g.rotateX(Math.PI/2); g.translate(0,thick,0); g.computeVertexNormals(); return g;
}
function rr(w,h,r){ // 圆角矩形 Shape，中心在原点
  const s=new T.Shape(); const x=w/2,y=h/2; r=Math.min(r,x,y);
  s.moveTo(-x+r,-y); s.lineTo(x-r,-y); s.quadraticCurveTo(x,-y,x,-y+r);
  s.lineTo(x,y-r); s.quadraticCurveTo(x,y,x-r,y); s.lineTo(-x+r,y);
  s.quadraticCurveTo(-x,y,-x,y-r); s.lineTo(-x,-y+r); s.quadraticCurveTo(-x,-y,-x+r,-y);
  return s;
}
function hole(shape,cx,cy,r,seg){ const p=new T.Path(); p.absarc(cx,cy,r,0,Math.PI*2,true); shape.holes.push(p); return shape; }
function cyl(rt,rb,h,seg,open){ return new T.CylinderGeometry(rt,rb,h,seg||32,1,!!open); }
function tubeGeo(ro,ri,h,seg){ // 空心圆筒
  const s=new T.Shape(); s.absarc(0,0,ro,0,Math.PI*2,false);
  const p=new T.Path(); p.absarc(0,0,ri,0,Math.PI*2,true); s.holes.push(p);
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:seg||48});
  g.translate(0,0,-h/2); g.rotateX(-Math.PI/2); g.computeVertexNormals(); return g;
}
function latheY(pts,seg){ return new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])), seg||40); }
function curve(pts){ return new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2])),false,'centripetal',0.4); }
function tubeAlong(pts,r,seg,rad){ return new T.TubeGeometry(curve(pts), seg||64, r, rad||16, false); }

/* 渐开线齿轮轮廓（模数 m，齿数 z，压力角 20°） */
function gearShape(m,z,ha,hf,backlash){
  ha=ha||1.0; hf=hf||1.25; backlash=backlash||0;        // 法向侧隙 mm（接触断言需 >0）
  const rp=m*z/2, rb=rp*Math.cos(20*D2R), ra=rp+ha*m, rf=rp-hf*m;
  const inv=a=>Math.tan(a)-a;
  const invP=inv(20*D2R), half=Math.PI/(2*z)+invP - backlash/(2*rp); // 基圆上半齿厚角
  const s=new T.Shape(); const pt=[];
  const flank=(sign)=>{ const out=[];
    const r0=Math.max(rf,rb*1.0005), N=9;
    for(let i=0;i<=N;i++){ const r=lerp(r0,ra,i/N); const a=Math.acos(clamp(rb/r,-1,1));
      const th=half-inv(a); out.push([r,sign*th]); } return out; };
  for(let k=0;k<z;k++){
    const base=k*2*Math.PI/z;
    const A=flank(1), B=flank(-1).reverse();
    if(rf<rb){ pt.push([rf, base+half*1.05]); }
    for(const [r,t] of A) pt.push([r, base+t]);
    for(const [r,t] of B) pt.push([r, base-t]);
    if(rf<rb){ pt.push([rf, base-half*1.05]); }
    const nb=base+2*Math.PI/z;
    pt.push([rf, lerp(base-half*1.05, nb+half*1.05, .5)]);
  }
  pt.forEach((q,i)=>{ const x=q[0]*Math.cos(q[1]), y=q[0]*Math.sin(q[1]); i?s.lineTo(x,y):s.moveTo(x,y); });
  s.closePath(); return s;
}
/* 凸轮型线：基圆 rb，升程 lift，半包角 halfDeg（凸轮角），桃尖指向 shape 角 nose */
function camProfile(x){ return Math.pow(0.5+0.5*Math.cos(Math.PI*clamp(x,0,1)), 1.2); }
function camShape(rb,lift,halfDeg,nose){
  const s=new T.Shape(); const N=220; const pts=[];
  for(let i=0;i<N;i++){
    const a=i/N*360;               // shape 角
    let d=((a-nose)%360+540)%360-180;   // 与桃尖夹角
    const r = rb + lift*camProfile(Math.abs(d)/halfDeg);
    const th=a*D2R; pts.push([r*Math.cos(th), r*Math.sin(th)]);
  }
  pts.forEach((p,i)=> i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath(); return s;
}
/* 螺旋弹簧 */
function springGeo(R,wire,coils,len,seg){
  const N=seg||coils*26, pts=[];
  for(let i=0;i<=N;i++){ const u=i/N, a=u*coils*2*Math.PI;
    const rr2 = R*(u<0.06? .93+u*1.2 : (u>0.94? .93+(1-u)*1.2 : 1));
    pts.push(new T.Vector3(rr2*Math.cos(a), u*len, rr2*Math.sin(a))); }
  return new T.TubeGeometry(new T.CatmullRomCurve3(pts), N, wire/2, 8, false);
}
/* 六角螺栓（沿 +Y，头部在 y=0..hh） */
function boltGeo(d,len,hh){
  hh=hh||d*0.68;
  const gs=[];
  const head=new T.CylinderGeometry(d*0.95,d*0.95,hh,6); head.translate(0,hh/2,0); gs.push(head);
  const sh=new T.CylinderGeometry(d*0.5,d*0.5,len,14); sh.translate(0,-len/2,0); gs.push(sh);
  return mergeGeos(gs);
}
/* 简易几何合并（同属性） */
function mergeGeos(list){
  let vt=0, ix=0, hasIdx=true;
  list.forEach(g=>{ if(!g.index) hasIdx=false; });
  list.forEach(g=>{ if(!g.index){ const n=g.attributes.position.count; const arr=new Uint32Array(n); for(let i=0;i<n;i++)arr[i]=i; g.setIndex(new T.BufferAttribute(arr,1)); } });
  const attrs=['position','normal','uv'];
  let np=0, ni=0; list.forEach(g=>{ np+=g.attributes.position.count; ni+=g.index.count; });
  const out=new T.BufferGeometry();
  const pos=new Float32Array(np*3), nor=new Float32Array(np*3), uv=new Float32Array(np*2), idx=new Uint32Array(ni);
  let po=0,uo=0,io=0,vo=0;
  for(const g of list){
    const p=g.attributes.position, n=g.attributes.normal, u=g.attributes.uv;
    pos.set(p.array.subarray(0,p.count*3),po); if(n) nor.set(n.array.subarray(0,n.count*3),po);
    if(u) uv.set(u.array.subarray(0,u.count*2),uo);
    const gi=g.index.array; for(let i=0;i<g.index.count;i++) idx[io+i]=gi[i]+vo;
    po+=p.count*3; uo+=p.count*2; io+=g.index.count; vo+=p.count;
  }
  out.setAttribute('position',new T.BufferAttribute(pos,3));
  out.setAttribute('normal',new T.BufferAttribute(nor,3));
  out.setAttribute('uv',new T.BufferAttribute(uv,2));
  out.setIndex(new T.BufferAttribute(idx,1));
  out.computeBoundingSphere(); return out;
}
/* 蜗壳（涡轮/压气机）：螺旋扫掠，截面半径随包角收缩 */
function voluteGeo(R0,R1,r0,r1,turns,seg,rad,plane){
  const g=new T.BufferGeometry(), pos=[],nor=[],idx=[];
  for(let i=0;i<=seg;i++){
    const u=i/seg, a=u*turns*2*Math.PI;
    const R=lerp(R0,R1,u), r=lerp(r0,r1,u);
    const cx=R*Math.cos(a), cy=R*Math.sin(a);
    const tx=-Math.sin(a), ty=Math.cos(a);
    for(let j=0;j<=rad;j++){
      const v=j/rad*Math.PI*2;
      const nx=Math.cos(a)*Math.cos(v), ny=Math.sin(a)*Math.cos(v), nz=Math.sin(v);
      pos.push(cx+r*nx, cy+r*ny, r*nz); nor.push(nx,ny,nz);
    }
  }
  for(let i=0;i<seg;i++) for(let j=0;j<rad;j++){
    const a0=i*(rad+1)+j, b0=a0+rad+1;
    idx.push(a0,b0,a0+1, a0+1,b0,b0+1);
  }
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));
  g.setIndex(idx); g.computeVertexNormals();
  if(plane==='yz') g.applyMatrix4(M_YZX);
  return g;
}
/* 叶轮：n 片扭曲叶片 */
function wheelGeo(n,rh,rt,h,twist,thick,back){
  const gs=[];
  const hub=new T.CylinderGeometry(rh*0.86,rh,h,24); hub.translate(0,h/2,0); gs.push(hub);
  if(back){ const bp=new T.CylinderGeometry(rt*0.98,rt*0.9,thick*1.4,28); bp.translate(0,thick*0.7,0); gs.push(bp); }
  for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2, seg=7, pts=[];
    const bg=new T.BufferGeometry(), pos=[],idx=[];
    for(let k=0;k<=seg;k++){
      const u=k/seg, r=lerp(rh*0.96,rt,u), y=lerp(h*0.92,thick*0.9,u*u);
      const tw=a+twist*u*(1-u*0.35);
      const c=Math.cos(tw), s2=Math.sin(tw), t=thick*(1-0.45*u);
      // 叶片前后两面（沿切向偏移）
      const nx=-s2, nz=c;
      pos.push(r*c+nx*t*0.5, y, r*s2+nz*t*0.5);
      pos.push(r*c-nx*t*0.5, y, r*s2-nz*t*0.5);
      pos.push(r*c+nx*t*0.5, thick*0.35, r*s2+nz*t*0.5);
      pos.push(r*c-nx*t*0.5, thick*0.35, r*s2-nz*t*0.5);
    }
    for(let k=0;k<seg;k++){ const o=k*4;
      idx.push(o,o+4,o+1, o+1,o+4,o+5);      // 上缘
      idx.push(o+2,o+3,o+6, o+3,o+7,o+6);    // 下缘
      idx.push(o,o+2,o+4, o+2,o+6,o+4);      // 侧 A
      idx.push(o+1,o+5,o+3, o+3,o+5,o+7);    // 侧 B
    }
    bg.setAttribute('position',new T.Float32BufferAttribute(pos,3)); bg.setIndex(idx);
    bg.computeVertexNormals(); if(!bg.attributes.uv){ const n2=bg.attributes.position.count; bg.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n2*2),2)); }
    gs.push(bg);
  }
  return mergeGeos(gs);
}
/* 凸包（皮带外包络） */
function hull(pts){
  pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[],up=[];
  for(const p of pts){ while(lo.length>=2&&cross(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop(); lo.push(p); }
  for(let i=pts.length-1;i>=0;i--){ const p=pts[i]; while(up.length>=2&&cross(up[up.length-2],up[up.length-1],p)<=0)up.pop(); up.push(p); }
  lo.pop(); up.pop(); return lo.concat(up);
}

/* ================================================================ 网格注册 */
let MESHID=0;
function add(parent, geo, mat, partId, opt){
  const m = new T.Mesh(geo, mat);
  m.castShadow = !(opt&&opt.noShadow); m.receiveShadow = true;
  m.userData.partId = partId; m.userData.id = ++MESHID;
  if(opt){ Object.assign(m.userData, opt); if(opt.pos) m.position.set(opt.pos[0],opt.pos[1],opt.pos[2]);
           if(opt.rot) m.rotation.set(opt.rot[0]||0,opt.rot[1]||0,opt.rot[2]||0); }
  parent.add(m);
  if(partId) PICKABLE.push(m);
  return m;
}
function labelSprite(txt,sub,color){
  const c=document.createElement('canvas'); c.width=512; c.height=128; const g=c.getContext('2d');
  g.clearRect(0,0,512,128);
  g.fillStyle='rgba(8,11,15,.72)'; g.strokeStyle='rgba(120,200,220,.30)'; g.lineWidth=2;
  const rw=504,rh=104,rx=4,ry=12,rr2=18;
  g.beginPath(); g.moveTo(rx+rr2,ry); g.lineTo(rx+rw-rr2,ry); g.quadraticCurveTo(rx+rw,ry,rx+rw,ry+rr2);
  g.lineTo(rx+rw,ry+rh-rr2); g.quadraticCurveTo(rx+rw,ry+rh,rx+rw-rr2,ry+rh); g.lineTo(rx+rr2,ry+rh);
  g.quadraticCurveTo(rx,ry+rh,rx,ry+rh-rr2); g.lineTo(rx,ry+rr2); g.quadraticCurveTo(rx,ry,rx+rr2,ry); g.closePath();
  g.fill(); g.stroke();
  g.font='600 44px "PingFang SC","Microsoft YaHei",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.shadowColor='rgba(0,0,0,.9)'; g.shadowBlur=10;
  g.fillStyle=color||'#dff6fa'; g.fillText(txt,256,52);
  g.font='500 23px ui-monospace,monospace'; g.fillStyle='rgba(150,215,230,.92)'; g.fillText(sub||'',256,92);
  const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace;
  const sp=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthTest:false,depthWrite:false}));
  sp.scale.set(216,54,1); sp.renderOrder=20; return sp;
}
