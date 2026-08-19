#!/bin/bash
# 按文件名序拼接分片 → 单文件；随后做语法门禁
set -e
OUT="${1:-sim.html}"
cat src/* > "$OUT"
node -e "
const fs=require('fs');
let s='';
for(const f of fs.readdirSync('src').sort())
  if(f.endsWith('.js') && f!=='10_three.js') s+=fs.readFileSync('src/'+f,'utf8')+'\n';
try{ new Function(s); console.log('SYNTAX OK ->', '$OUT'); }
catch(e){ console.log('SYNTAX ERR:', e.message); process.exit(1); }
"
ls -la "$OUT"
