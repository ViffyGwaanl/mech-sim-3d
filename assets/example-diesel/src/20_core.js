/* ============================================================================
   四冲程柴油机 高精度 3D 交互仿真  |  Inline-4 Turbo Diesel Simulator
   建模单位：毫米 (mm)，根节点整体缩放 0.01 → 1 世界单位 = 100 mm
   ========================================================================== */
const T = THREE;
const D2R = Math.PI/180, R2D = 180/Math.PI;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(t)=>t*t*(3-2*t);
const S = 0.01;                       // mm -> world

/* ---------------------------------------------------------------- 发动机参数 */
const P = {
  bore:102, stroke:120, rodLen:202, pinOff:0,
  nCyl:4, pitch:140, cr:17.5, disp:3.923,
  crankR:60,                                   // 曲柄半径 = 行程/2
  deckY:318.5,                                 // 缸体上平面高度
  gasketT:1.5, headBot:320, headTop:425, coverTop:545,
  camY:105, camZ:70, camBase:20, camLift:7.07, // 凸轮：基圆 R20，最大凸轮升程 7.07
  rockRatio:1.556, valveLift:11.0,             // 摇臂比 56:36 = 1.556 → 气门升程 11.0
  rockShaftY:498, rockShaftZ:36, armPush:56, armValve:36,
  valveDX:30, valveHead:{in:42,ex:38}, valveStem:8, valveTip:492,
  pushZtop:92, pushZbot:70, tappetTop:195, tappetD:25,
  mainJ:83, rodJ:69,                           // 主轴颈 / 连杆轴颈 直径
  pinD:38, pinL:88, compHeight:55,             // 活塞销 / 压缩高
  order:[1,3,4,2],                             // 点火顺序
  phase:[0,180,540,360],                       // 各缸循环相位(°)：cyl1,2,3,4
  timing:{ IVO:-16, IVC:36, EVO:-46, EVC:16 }, // 相对上/下止点(°)
  injAdv:12,
  idle:750, rated:2500,
  blockZ:88, blockX:352,
};
// 循环角(0=压缩上止点/着火)：做功0-180 排气180-360 进气360-540 压缩540-720
P.evOpen = 180 - 46; P.evClose = 360 + 16;  // 134 → 376
P.ivOpen = 360 - 16; P.ivClose = 540 + 36;  // 344 → 576

/* ---------------------------------------------------------------- 全局状态 */
const ST = {
  play:true, rpm:1200, load:45, timeScale:0.18, theta:0,
  clip:false, clipPos:10, ghost:false, flow:true, paths:false, explode:0,
  shadow:true, grid:true, labels:true, autoRot:false, autoQuality:true, invX:false, invY:false, invZoom:false,
  water:60, oil:2.6, boost:0.0, egt:220, cylP:1, torque:0,
  hover:null, fps:60, view:'free'
};

/* ---------------------------------------------------------------- 渲染器 */
const app = document.getElementById('app');
const renderer = new T.WebGLRenderer({antialias:true, powerPreference:'high-performance', stencil:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
app.appendChild(renderer.domElement);

const scene = new T.Scene();
scene.background = new T.Color(0x080a0d);
scene.fog = new T.Fog(0x080a0d, 34, 120);

const camera = new T.PerspectiveCamera(38, innerWidth/innerHeight, 0.05, 300);

/* 剖切平面（世界坐标，法线 -Z：z > c 的部分被切掉） */
const CLIP = new T.Plane(new T.Vector3(0,0,-1), 1000);
const CLIPS = [CLIP];

/* ---------------------------------------------------------------- 环境光照 */
function buildEnv(){
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0,0,0,256);
  sky.addColorStop(0.00,'#2a3644'); sky.addColorStop(0.42,'#6f8296');
  sky.addColorStop(0.50,'#9fb0c0'); sky.addColorStop(0.56,'#4a545e');
  sky.addColorStop(1.00,'#242a31');
  g.fillStyle=sky; g.fillRect(0,0,512,256);
  // 柔光灯箱（给金属提供长条高光）
  const boxes=[[70,26,150,46,'#ffffff',.95],[300,34,120,40,'#eaf4ff',.75],[190,150,220,26,'#93b6d8',.45],[430,60,70,60,'#ffd9a8',.55],[10,90,90,70,'#cfe2f5',.45],[240,96,120,60,'#b9cee2',.4]];
  for(const [x,y,w,h,col,a] of boxes){
    const rg=g.createRadialGradient(x+w/2,y+h/2,2,x+w/2,y+h/2,Math.max(w,h)/1.2);
    rg.addColorStop(0,col); rg.addColorStop(1,'rgba(0,0,0,0)');
    g.globalAlpha=a; g.fillStyle=rg; g.beginPath(); g.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,7); g.fill();
  }
  g.globalAlpha=1;
  const tex = new T.CanvasTexture(c);
  tex.mapping = T.EquirectangularReflectionMapping;
  tex.colorSpace = T.SRGBColorSpace;
  const pm = new T.PMREMGenerator(renderer); pm.compileEquirectangularShader();
  const env = pm.fromEquirectangular(tex).texture;
  pm.dispose(); tex.dispose();
  return env;
}
scene.environment = buildEnv();

const key = new T.DirectionalLight(0xffffff, 2.35);
key.position.set(16, 24, 15); key.castShadow = true;
key.shadow.mapSize.set(2048,2048);
key.shadow.camera.near=6; key.shadow.camera.far=70;
key.shadow.camera.left=-11; key.shadow.camera.right=11;
key.shadow.camera.top=11; key.shadow.camera.bottom=-11;
key.shadow.bias=-0.0009; key.shadow.normalBias=0.02;
scene.add(key);
const fill = new T.DirectionalLight(0x9dc4ff, 1.15); fill.position.set(-18,8,-14); scene.add(fill);
const fill2= new T.DirectionalLight(0xbcd4f0, 0.70); fill2.position.set(-20,5,12); scene.add(fill2);
const rim  = new T.DirectionalLight(0xffcf9a, 0.85); rim.position.set(-5,-9,19); scene.add(rim);
const rim2 = new T.DirectionalLight(0xa8c8ea, 0.60); rim2.position.set(14,4,-19); scene.add(rim2);
scene.add(new T.HemisphereLight(0x9dc0e4, 0x1b2028, 0.85));
const inner = new T.PointLight(0xbfd8f0, 22, 14, 1.6); inner.position.set(0,1.6,0); scene.add(inner);

/* 地面 */
const ground = new T.Group(); scene.add(ground);
const shadowPlane = new T.Mesh(new T.PlaneGeometry(120,120),
  new T.ShadowMaterial({opacity:0.42}));
shadowPlane.rotation.x = -Math.PI/2; shadowPlane.position.y = -3.05;
shadowPlane.receiveShadow = true; ground.add(shadowPlane);
const grid = new T.GridHelper(90, 90, 0x2a3a46, 0x161d24);
grid.position.y = -3.05; grid.material.transparent=true; grid.material.opacity=0.5;
ground.add(grid);
const halo = new T.Mesh(new T.CircleGeometry(17,64), new T.MeshBasicMaterial({color:0x0e1a22,transparent:true,opacity:.55}));
halo.rotation.x=-Math.PI/2; halo.position.y=-3.048; ground.add(halo);

/* ---------------------------------------------------------------- 相机控制器 */
class Orbit{
  constructor(cam,dom){
    this.cam=cam; this.dom=dom;
    this.target=new T.Vector3(-1.2,1.1,0);
    this.tTarget=this.target.clone();
    this.sph=new T.Spherical(18, 1.16, 0.86);
    this.tSph=this.sph.clone();
    this.min=1.2; this.max=78; this.damp=0.14;
    this._p={}; this._mode=0; this._px=0; this._py=0; this._pd=0;
    dom.addEventListener('pointerdown',e=>this.down(e));
    dom.addEventListener('pointermove',e=>this.move(e));
    addEventListener('pointerup',e=>this.up(e));
    addEventListener('pointercancel',e=>this.up(e));
    dom.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.pow(0.94, (ST.invZoom?-1:1)*e.deltaY*0.012));},{passive:false});
    dom.addEventListener('contextmenu',e=>e.preventDefault());
  }
  down(e){ try{this.dom.setPointerCapture(e.pointerId);}catch(_){} this._p[e.pointerId]={x:e.clientX,y:e.clientY};
    const n=Object.keys(this._p).length;
    this._mode = n>1?3:(e.button===2||e.shiftKey?2:1);
    this._px=e.clientX; this._py=e.clientY;
    if(n>1) this._pd=this.dist();
  }
  dist(){ const k=Object.keys(this._p); if(k.length<2)return 0;
    const a=this._p[k[0]],b=this._p[k[1]]; return Math.hypot(a.x-b.x,a.y-b.y); }
  move(e){
    if(!(e.pointerId in this._p)) return;
    this._p[e.pointerId]={x:e.clientX,y:e.clientY};
    const dx=e.clientX-this._px, dy=e.clientY-this._py;
    this._px=e.clientX; this._py=e.clientY;
    if(this._mode===3){ const d=this.dist(); if(this._pd) this.zoom(d/this._pd); this._pd=d; this.pan(dx*0.5,dy*0.5); }
    else if(this._mode===1){ const sx=ST.invX?-1:1, sy=ST.invY?-1:1;
      this.tSph.theta -= dx*0.0052*sx; this.tSph.phi = clamp(this.tSph.phi - dy*0.0052*sy, 0.045, Math.PI-0.045); }
    else if(this._mode===2){ this.pan(dx,dy); }
  }
  up(e){ delete this._p[e.pointerId]; if(!Object.keys(this._p).length) this._mode=0; else this._pd=this.dist(); }
  zoom(f){ this.tSph.radius = clamp(this.tSph.radius/f, this.min, this.max); }
  pan(dx,dy){
    const k = this.tSph.radius*Math.tan(this.cam.fov*D2R/2)*2/innerHeight;
    const m = this.cam.matrix.elements;
    const vx=new T.Vector3(m[0],m[1],m[2]).multiplyScalar(-dx*k);
    const vy=new T.Vector3(m[4],m[5],m[6]).multiplyScalar( dy*k);
    this.tTarget.add(vx).add(vy);
  }
  fly(tgt,r,phi,theta,ms=760){
    this._fly={t0:performance.now(),ms, a:{t:this.tTarget.clone(),r:this.tSph.radius,p:this.tSph.phi,h:this.tSph.theta},
               b:{t:tgt.clone(),r,p:phi,h:theta}};
  }
  update(){
    if(this._fly){
      const f=this._fly, u=clamp((performance.now()-f.t0)/f.ms,0,1), e=smooth(u);
      this.tTarget.lerpVectors(f.a.t,f.b.t,e);
      this.tSph.radius=lerp(f.a.r,f.b.r,e);
      this.tSph.phi=lerp(f.a.p,f.b.p,e);
      let dh=f.b.h-f.a.h; while(dh>Math.PI)dh-=2*Math.PI; while(dh<-Math.PI)dh+=2*Math.PI;
      this.tSph.theta=f.a.h+dh*e;
      if(u>=1) this._fly=null;
    }
    if(ST.autoRot && !this._mode && !this._fly) this.tSph.theta += 0.0022;
    this.target.lerp(this.tTarget,this.damp);
    this.sph.radius=lerp(this.sph.radius,this.tSph.radius,this.damp);
    this.sph.phi   =lerp(this.sph.phi,this.tSph.phi,this.damp);
    this.sph.theta =lerp(this.sph.theta,this.tSph.theta,this.damp);
    const v=new T.Vector3().setFromSpherical(this.sph);
    this.cam.position.copy(this.target).add(v);
    this.cam.lookAt(this.target);
    this.cam.updateMatrixWorld();
  }
}
const controls = new Orbit(camera, renderer.domElement);

/* ---------------------------------------------------------------- 根节点 */
const ROOT = new T.Group(); ROOT.scale.setScalar(S); scene.add(ROOT);
const PICKABLE = [];       // 可拾取网格
const GROUPS = {};         // 系统分组
const ANIM = {};           // 动画引用

function group(id,label,color,parent){
  const g=new T.Group(); g.name=id; (parent||ROOT).add(g);
  GROUPS[id]={g,label,color,vis:true,parts:[]};
  return g;
}
