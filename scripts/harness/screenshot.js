// 用法: node screenshot.js <html路径> '[["名字","页面内JS代码"],...]'
// 每项先执行代码(可用 setView(k,1) 快照跳转)，等 2.2s，暂停 rAF 后截图
const {chromium}=require('playwright');
const fs=require('fs');
const EXE=(()=>{ const d='/opt/pw-browsers';
  try{ for(const n of fs.readdirSync(d)) if(/^chromium-\d+$/.test(n))
    return d+'/'+n+'/chrome-linux/chrome'; }catch(e){} return undefined; })();
const HTML=process.argv[2], LIST=JSON.parse(process.argv[3]);
(async()=>{
  const b=await chromium.launch({executablePath:EXE,
    args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:740}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('file://'+HTML); await p.waitForTimeout(4000);
  await p.evaluate(()=>{ const g=document.getElementById('bGo'); g&&g.click();
    if(window.ST) ST.autoQuality=false; });
  for(const [f,code] of LIST){
    await p.evaluate(()=>{ if(window.__raf){window.requestAnimationFrame=window.__raf; window.__raf=null; loop();} });
    await p.evaluate('(()=>{'+code+'})()'); await p.waitForTimeout(2200);
    await p.evaluate(()=>{ if(!window.__raf){window.__raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=()=>0;} });
    await p.waitForTimeout(500);
    await p.screenshot({path:f+'.png',timeout:120000}); console.log('shot',f);
  }
  console.log('ERRORS:',errs.length,errs.slice(0,6)); await b.close();
})();
