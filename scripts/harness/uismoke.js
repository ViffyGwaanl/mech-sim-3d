// 用法: node uismoke.js <html路径>  —— 遍历常见控件与快捷键，报告报错数
const {chromium}=require('playwright');
const fs=require('fs');
const EXE=(()=>{ const d='/opt/pw-browsers';
  try{ for(const n of fs.readdirSync(d)) if(/^chromium-\d+$/.test(n))
    return d+'/'+n+'/chrome-linux/chrome'; }catch(e){} return undefined; })();
(async()=>{
  const b=await chromium.launch({executablePath:EXE,
    args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:740}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('file://'+process.argv[2]); await p.waitForTimeout(4000);
  const r=await p.evaluate(()=>{
    const log=[];
    try{
      const g=document.getElementById('bGo'); g&&g.click();
      document.querySelectorAll('button').forEach(b=>{ try{b.click();b.click();}catch(e){log.push(b.id+':'+e.message);} });
      document.querySelectorAll('.tog').forEach(t=>{ try{t.click();t.click();}catch(e){log.push('tog:'+e.message);} });
      document.querySelectorAll('input[type=range]').forEach(s=>{ try{
        s.value=s.max; s.dispatchEvent(new Event('input'));
        s.value=s.min; s.dispatchEvent(new Event('input'));}catch(e){log.push(s.id+':'+e.message);} });
      for(const k of [' ','1','2','3','4','5','c','x','f','p','e','h','h','r','t','t'])
        dispatchEvent(new KeyboardEvent('keydown',{key:k}));
    }catch(e){ log.push('FATAL:'+e.message); }
    return log;
  });
  await p.waitForTimeout(1500);
  console.log('smoke log:',JSON.stringify(r));
  console.log('ERRORS:',errs.length,errs.slice(0,8));
  await b.close(); process.exit(errs.length||r.length?1:0);
})();
