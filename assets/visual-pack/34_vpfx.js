/* ==================== 视觉升级包 · 后处理：选择性辉光 + 外壳描边 (无 addons) */
const FX=(function(){
  const LAYER=3, BLACK=new THREE.Color(0x000000);
  let R,S,C, rtG,rtA,rtB, quadS,quadC, mBlur,mComp, hull=null, hTarget=null, hMat, hScaleM=new THREE.Matrix4();
  let on=true, strength=0.85, inited=false;
  function quadGeo(){ const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,-1,0, 3,-1,0, -1,3,0]),3));
    g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0, 2,0, 0,2]),2)); return g; }
  function init(renderer,scene,camera,opt){
    if(inited) return FXAPI; inited=true;
    R=renderer; S=scene; C=camera; opt=opt||{};
    if(opt.strength!==undefined) strength=opt.strength;
    const w=innerWidth,h=innerHeight, po={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false};
    rtG=new THREE.WebGLRenderTarget(w/2|0,h/2|0,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
    rtA=new THREE.WebGLRenderTarget(w/2|0,h/2|0,po); rtB=new THREE.WebGLRenderTarget(w/2|0,h/2|0,po);
    quadS=new THREE.Scene(); quadC=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
    mBlur=new THREE.ShaderMaterial({uniforms:{t:{value:null},d:{value:new THREE.Vector2(1,0)},px:{value:new THREE.Vector2(1/w,1/h)}},
      vertexShader:VS, fragmentShader:`varying vec2 vUv; uniform sampler2D t; uniform vec2 d,px;
      void main(){ vec4 s=texture2D(t,vUv)*0.227;
        vec2 o1=d*px*1.3846, o2=d*px*3.2308;
        s+=(texture2D(t,vUv+o1)+texture2D(t,vUv-o1))*0.3162;
        s+=(texture2D(t,vUv+o2)+texture2D(t,vUv-o2))*0.0702;
        gl_FragColor=s; }`,depthTest:false,depthWrite:false});
    mComp=new THREE.ShaderMaterial({uniforms:{t:{value:null},k:{value:strength}},
      vertexShader:VS, fragmentShader:`varying vec2 vUv; uniform sampler2D t; uniform float k;
      void main(){ vec3 c=texture2D(t,vUv).rgb; gl_FragColor=vec4(c*k,1.0); }`,
      transparent:true, blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false});
    const q=new THREE.Mesh(quadGeo(),mBlur); q.frustumCulled=false; quadS.add(q); quadS.userData.q=q;
    hMat=new THREE.MeshBasicMaterial({color:0x37e0f2,side:THREE.BackSide,transparent:true,opacity:.5,depthWrite:false,fog:false});
    const v=document.createElement('div');
    v.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:5;background:radial-gradient(ellipse at 50% 46%,transparent 58%,rgba(0,0,0,.36) 100%)';
    document.body.appendChild(v);
    addEventListener('resize',()=>{ const w2=innerWidth/2|0,h2=innerHeight/2|0;
      rtG.setSize(w2,h2); rtA.setSize(w2,h2); rtB.setSize(w2,h2);
      mBlur.uniforms.px.value.set(2/innerWidth,2/innerHeight); });
    return FXAPI;
  }
  function pass(mat,src,dst){ quadS.userData.q.material=mat;
    if(mat===mBlur) mBlur.uniforms.t.value=src.texture; else mComp.uniforms.t.value=src.texture;
    R.setRenderTarget(dst||null); if(dst) R.clear(); R.render(quadS,quadC); }
  function render(){
    if(!inited){ return; }
    R.render(S,C);
    if(on){
      const bg=S.background, fog=S.fog; S.background=BLACK; S.fog=null;
      const sm=R.shadowMap.autoUpdate; R.shadowMap.autoUpdate=false;
      C.layers.set(LAYER);
      R.setRenderTarget(rtG); R.clear(); R.render(S,C);
      C.layers.set(0);
      R.shadowMap.autoUpdate=sm; S.background=bg; S.fog=fog;
      mBlur.uniforms.d.value.set(1,0); pass(mBlur,rtG,rtA);
      mBlur.uniforms.d.value.set(0,1); pass(mBlur,rtA,rtB);
      mBlur.uniforms.d.value.set(1.8,0); pass(mBlur,rtB,rtA);
      mBlur.uniforms.d.value.set(0,1.8); pass(mBlur,rtA,rtB);
      const ac=R.autoClear; R.autoClear=false; pass(mComp,rtB,null); R.autoClear=ac;
    }
    R.setRenderTarget(null);
  }
  function glow(o,en){ (en===false)?o.layers.disable(LAYER):o.layers.enable(LAYER); }
  function outline(target){
    if(hull){ hull.parent&&hull.parent.remove(hull); hull=null; hTarget=null; }
    if(!target||target.isInstancedMesh||!target.geometry) return;
    target.geometry.computeBoundingSphere&&target.geometry.computeBoundingSphere();
    const c=(target.geometry.boundingSphere&&target.geometry.boundingSphere.center)||new THREE.Vector3();
    hScaleM.makeTranslation(c.x,c.y,c.z).multiply(new THREE.Matrix4().makeScale(1.04,1.04,1.04))
      .multiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z));
    hull=new THREE.Mesh(target.geometry,hMat);
    hull.matrixAutoUpdate=false; hull.frustumCulled=false; hull.renderOrder=1;
    hTarget=target; S.add(hull); update();
  }
  function update(){ if(hull&&hTarget){ hTarget.updateWorldMatrix(true,false);
    hull.matrix.copy(hTarget.matrixWorld).multiply(hScaleM); } }
  const FXAPI={init,render,glow,outline,update,
    set enabled(v){on=v;}, get enabled(){return on;},
    set strength(v){ strength=v; if(mComp) mComp.uniforms.k.value=v; }, get strength(){return strength;}};
  return FXAPI;
})();
