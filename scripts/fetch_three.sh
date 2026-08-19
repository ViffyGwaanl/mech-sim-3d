#!/bin/bash
# 下载并固定 three.js r160.1 UMD（最后一个含 UMD 构建的版本线）→ src/10_three.js
set -e
OUT="${1:-src/10_three.js}"
curl -sf -o "$OUT" "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.min.js"
if SZ=$(stat -f%z "$OUT" 2>/dev/null); then
  : # macOS / BSD stat
else
  SZ=$(stat -c%s "$OUT") # GNU stat
fi
[ "$SZ" -gt 600000 ] || { echo "下载异常：$SZ bytes"; exit 1; }
echo "three r160.1 UMD -> $OUT ($SZ bytes)"
echo "提示：00_head.html 里需要一段 console.warn 过滤器吞掉 r150+ 的 UMD 弃用警告（见范例）"
