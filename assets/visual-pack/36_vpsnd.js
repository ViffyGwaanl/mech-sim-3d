/* ==================== 视觉升级包 · WebAudio 机器声合成（默认关，手势后可用） */
const SND=(function(){
  let ctx=null, master=null, ch={}, on=false;
  function mkNoise(){ const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
  function ensure(){
    if(ctx) return;
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    const nb=mkNoise();
    const mk=(build)=>{ const g=ctx.createGain(); g.gain.value=0; g.connect(master); build(g); return {g}; };
    ch.fan=mk(g=>{ const s=ctx.createBufferSource(); s.buffer=nb; s.loop=true;
      const f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=520; f.Q.value=1.1;
      s.connect(f); f.connect(g); s.start(); ch.fan_f=f; });
    ch.water=mk(g=>{ const s=ctx.createBufferSource(); s.buffer=nb; s.loop=true;
      const f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=1500;
      s.connect(f); f.connect(g); s.start(); });
    ch.comp=mk(g=>{ const o1=ctx.createOscillator(); o1.type='sawtooth'; o1.frequency.value=52;
      const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=104;
      const lfo=ctx.createOscillator(); lfo.frequency.value=3.4;
      const lg=ctx.createGain(); lg.gain.value=.24;
      const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380;
      lfo.connect(lg); lg.connect(g.gain);
      o1.connect(f); o2.connect(f); f.connect(g); o1.start(); o2.start(); lfo.start(); });
    ch.motor=mk(g=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=110;
      const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=800;
      o.connect(f); f.connect(g); o.start(); ch.motor_o=o; });
  }
  function toggle(v){
    on=(v===undefined)?!on:!!v;
    try{ ensure(); ctx.resume&&ctx.resume(); }catch(e){ on=false; return on; }
    master.gain.linearRampToValueAtTime(on?0.85:0, ctx.currentTime+0.25);
    return on;
  }
  function lv(name,v,t){ const c=ch[name]; if(!c||!ctx) return;
    c.g.gain.linearRampToValueAtTime(Math.max(0,Math.min(1,v)), ctx.currentTime+(t||0.15)); }
  /* update({fan:0..1, water:0..1, comp:0..1, motorRpm:0..1600}) 每 ~100ms 调一次 */
  function update(s){ if(!ctx||!on) return;
    if(s.fan!==undefined){ lv('fan',s.fan*.5); ch.fan_f&&(ch.fan_f.frequency.value=380+s.fan*640); }
    if(s.water!==undefined) lv('water',s.water*.33);
    if(s.comp!==undefined) lv('comp',s.comp*.42);
    if(s.motorRpm!==undefined){ lv('motor', s.motorRpm>1?Math.min(.3,.05+s.motorRpm/4000):0);
      ch.motor_o&&(ch.motor_o.frequency.value=60+s.motorRpm*.11); } }
  return {toggle,update,lv, get on(){return on;}};
})();
