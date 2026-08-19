/* ============================ 视觉升级包 · 物理材质与影棚 (UMD 兼容, 无 addons) */
const VMAT={
  /* 透射玻璃：真实折射（门玻璃/观察窗）。厚件给 thickness，薄壳给小值 */
  glass:o=>new THREE.MeshPhysicalMaterial(Object.assign({
    color:0xffffff, transmission:1, thickness:8, roughness:.06, ior:1.49,
    clearcoat:1, clearcoatRoughness:.08, metalness:0,
    attenuationColor:new THREE.Color(0xd9f2f5), attenuationDistance:900, side:THREE.DoubleSide},o)),
  /* 家电清漆钣金：白色钢板+清漆层 */
  paint:o=>new THREE.MeshPhysicalMaterial(Object.assign({
    color:0xeef1f4, roughness:.34, metalness:.05, clearcoat:.85, clearcoatRoughness:.18,
    envMapIntensity:1.0},o)),
  /* 拉丝不锈钢（各向异性高光；r160 支持，缺失时自动退化） */
  brushed:o=>{const m=new THREE.MeshPhysicalMaterial(Object.assign({
    color:0xd6dade, metalness:1, roughness:.30, envMapIntensity:1.25},o));
    if('anisotropy' in m){ m.anisotropy=.8; m.anisotropyRotation=Math.PI/2; } return m;},
  chrome:o=>new THREE.MeshPhysicalMaterial(Object.assign({
    color:0xffffff, metalness:1, roughness:.07, envMapIntensity:1.5},o)),
  softPlastic:o=>new THREE.MeshPhysicalMaterial(Object.assign({
    color:0x30343a, roughness:.6, metalness:.05, clearcoat:.25, clearcoatRoughness:.5},o)),
};
/* 影棚：渐变穹顶 + 展示台 + 发光环（发光环记得 FX.glow(ring)） */
function buildStudio(scene, opt){
  opt=opt||{}; const R=opt.r||8.5, y0=opt.y===undefined?-3.06:opt.y;
  const g=new THREE.Group(); g.name='studio';
  const c=document.createElement('canvas'); c.width=4; c.height=512;
  const ctx=c.getContext('2d'); const gr=ctx.createLinearGradient(0,0,0,512);
  gr.addColorStop(0,'#233240'); gr.addColorStop(.42,'#0d141b');
  gr.addColorStop(.72,'#070a0e'); gr.addColorStop(1,'#04060a');
  ctx.fillStyle=gr; ctx.fillRect(0,0,4,512);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const dome=new THREE.Mesh(new THREE.SphereGeometry(72,40,24),
    new THREE.MeshBasicMaterial({map:tex, side:THREE.BackSide, fog:false, depthWrite:false}));
  dome.renderOrder=-10; g.add(dome);
  const pod=new THREE.Mesh(new THREE.CylinderGeometry(R,R*1.035,.16,72),
    new THREE.MeshPhysicalMaterial({color:0x14181d,roughness:.24,metalness:.6,clearcoat:.9,clearcoatRoughness:.12}));
  pod.position.y=y0+.08; pod.receiveShadow=true; g.add(pod);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(R*.985,.028,10,110),
    new THREE.MeshBasicMaterial({color:0x2fd8ea}));
  ring.rotation.x=Math.PI/2; ring.position.y=y0+.165; g.add(ring);
  scene.add(g);
  return {group:g, ring, podium:pod};
}
