# 验证协议（不可跳过）

"语法通过 + 我觉得逻辑对"的代码在本类项目里首次打开的实际报错率很高；参考实现
首次无头打开就抓到一个 undefined 引用。**每个阶段末端都要真的打开页面**。
现成脚本在 `scripts/harness/`。

## 1. 无头浏览器基座

```js
const {chromium}=require('playwright');
const b=await chromium.launch({
  executablePath: EXE,   // 见下
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
```

- 云沙箱里 `/opt/pw-browsers/` 已有 chromium；npm 装的 playwright 版本若与
  预下载版本不匹配会去找不存在的目录——**显式传 executablePath**
  （`ls /opt/pw-browsers/chromium-*/chrome-linux/chrome` 取第一个）。
- SwiftShader 软渲染 15–25fps 属正常，性能结论看三角面/drawcall 预算，
  不看无头 FPS。
- 收集 `page.on('pageerror')` 与 console error，最终必须双零。

## 2. 截图技巧（防超时）

连续 rAF 渲染下 `page.screenshot()` 常超时。截图前暂停渲染循环：

```js
const pause =p=>p.evaluate(()=>{ if(!window.__raf){window.__raf=
  window.requestAnimationFrame.bind(window); window.requestAnimationFrame=()=>0;} });
const resume=p=>p.evaluate(()=>{ if(window.__raf){window.requestAnimationFrame=
  window.__raf; window.__raf=null; loop();} });
// resume → setView(k, /*snap*/1) → 等 2s → pause → 等 0.5s → screenshot
```

**每张截图都要用 Read 真的看**：构图、遮挡、材质观感、标签重叠、UI 完整性。
数值断言抓逻辑错，截图抓"看起来不对"——两者不可互替。

## 3. 数值断言电池（阶段 4 门禁 + 总验收）

在页面上下文里全周期采样（每 0.5–7° 一步调 updateKinematics），断言：

| 断言 | 判据 |
|---|---|
| 机构闭合 | 连杆两端点距 − 杆长，全周期 max < 0.001 mm |
| 名义行程 | s(0°) − s(180°) = 行程 ±0.1% |
| 峰值升程与相位 | max lift = 设计值；出现角 = 型线峰值角 |
| 事件正时 | 升程穿越 0.05mm 的角度 = 设计开闭角 ±2° |
| 运动干涉 | 全周期 min(件间间隙) > 0（气门-活塞、活塞-缸盖…） |
| 传动比 | 主角 +360° 后从动件转角 = ±360°/i（含转向） |
| 物理量级 | 压力/温度峰值落在该机器的真实区间 |
| 覆盖完整 | PICKABLE 的 partId 全部在 DB；dbmiss === [] |

拆解动画加测：进入→t=N→回 0→退出，关键件坐标与初始快照全等；所有目标
（每个缸）切换一轮无残留 hidden、无报错。

两条实测教训：**断言公式本身也要自检**——先拿一个手算得出的已知位形喂给断言，
确认断言在"应该通过"时通过、把参数故意改坏时报错，再去测模型（实测出现过
mod 运算写错、pnpoly 奇偶翻转写错导致的假阴/假阳）；需要点-在-多边形、最近距
之类几何自检时优先用成熟写法并先用正方形等平凡形状标定。

## 3.5 输入语义断言（**必做，本技能最贵的一次盲区**）

数值断言测的是"模型对不对"，**测不到"手感对不对"**。真实事故：滚轮缩放方向
写反（向后滚变成放大），从第一台机器一路复制到全部 5 台和技能范例，期间跑过
几十项运动学/守恒断言、上百张截图目检，全部通过——因为**没有一项断言碰过输入
事件的方向语义**，直到用户上手第一分钟就发现。

标准语义（三键鼠标，浏览器 deltaY 符号）：

| 输入 | deltaY | 期望 |
|---|---|---|
| 滚轮向后拉（scroll down） | > 0 | 缩小＝相机距离**变大** |
| 滚轮向前推（scroll up） | < 0 | 放大＝相机距离**变小** |

断言写法（合成事件，不需要真人）：

```js
const wheel=dy=>{ const r0=controls.tSph.radius;
  renderer.domElement.dispatchEvent(new WheelEvent('wheel',{deltaY:dy,bubbles:true,cancelable:true}));
  return controls.tSph.radius-r0; };
assert(wheel(+120) > 0, '向后滚必须拉远');
assert(wheel(-120) < 0, '向前推必须拉近');
```

同一套路覆盖全部输入：左键拖拽旋转方向、右键/Shift 平移方向、双指捏合、
反转开关三件套（invX/invY/invZoom）打开后符号确实翻转。**任何带方向的交互都
要有一条断言**，否则它就是下一个只能靠用户发现的 bug。

## 4. UI 冒烟（总验收）

脚本一次性遍历：每个视角预设、每个开关点两下（开→关）、每个滑块拉到 max 再
min、每个按钮、全部快捷键 dispatch 一遍——过程 0 报错。参考实现的冒烟脚本
（final.js 模式）直接改列表即可复用。

悬停抽样：网格扫描视口若干点，逐点设 mouse 坐标调 pick()，收集命中 partId 与
实时状态文本，确认卡片内容非空、状态文本随 θ 变化。

## 5. 审查清单（发货前最后过一遍）

- [ ] 双零：pageerror=0、console error=0（含加载期）
- [ ] 数值电池全绿，结果数字写进交付说明（用户看得到的可信度）
- [ ] 全部视角截图逐张目检过
- [ ] 剖切+半透明+爆炸+拆解 各截一张确认效果
- [ ] 旋转链审计：所有该转的都在转（齿圈/螺栓圈/叶轮/风扇…）
- [ ] 三角面/drawcall 在预算内；HUD 显示的统计与 renderer.info 一致
- [ ] 文件是单文件、双击本地可开（file:// 协议下无跨域资源）
- [ ] 操作引导键位与实际监听一致
