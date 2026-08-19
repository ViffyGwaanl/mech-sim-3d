---
name: mech-sim-3d
description: 把任意机械/工程/物理系统做成可离线运行的单文件高精度 3D 交互仿真网页（Three.js）：真实工程尺寸参数化建模、闭式运动学驱动、PBR 材质、鼠标悬停零件信息卡（中英双语的材料/功能/关键参数/实时运动状态）、剖切与半透明、爆炸图、介质流动粒子、逐步拆解装配动画、工况仪表面板，并用无头浏览器做数值断言 + 截图双重验证。Use this skill whenever the user asks for a 3D simulation / interactive simulator / working-principle demo of ANY machine or mechanism — engine, pump, gearbox, compressor, turbine, robot arm, linkage, valve, clock, hydraulic or cooling circuit, human joint — or says 3D仿真 / 交互演示 / 工作原理动画 / 拆解动画 / 剖视图 / 数字孪生 / cutaway / teardown / "show how X works in 3D", even if they only name the machine ("做一个变速箱的3D页面"). Also use it to audit, extend, or add features (teardown, flow, info cards) to a simulator previously built with this pattern.
---

# mech-sim-3d：通用机械 3D 交互仿真

产出一个**单文件 HTML**，双击即可离线运行，也可 iframe 嵌入网页。本技能是从一台
完整交付的直列四缸涡轮增压柴油机仿真（343 个可拾取零件、105 条双语零件档案、17 步
拆解动画、零控制台报错、数值验证全绿）中提炼的，`assets/example-diesel/` 就是那份
完整源码——**它是本技能的权威参考实现，写任何子系统前先看它对应的分片**。

`assets/example-washer-dryer/` 是使用本 Skill 制作并公开的完整单文件案例，包含三种技术
路线对比、介质回路、实时工况指标、140 个可拾取零件、84 条双语档案和 22 步拆装演示。
需要参考“多方案横向对比”或完整交付页面时，先阅读该目录的 `README.md`，再按需检查
`index.html`；不要为了普通机械建模默认加载这个大型成品文件。

## 交付定义（Definition of Done）

一个合格的仿真同时满足：

1. 单文件、离线可运行（three.js UMD 内联）；打开即动，无任何控制台报错。
2. 所有尺寸来自一张**真实工程参数表**（mm 为单位的 `P` 对象），不是目测比例。
2.5 画质走 references/visual.md 的三层杠杆：玻璃/清漆/拉丝用 MeshPhysicalMaterial，
   showcase 件启用 visual-pack（辉光+描边+影棚+声音）。
3. 运动由**闭式运动学方程**驱动（曲柄滑块、凸轮型线、齿轮啮合相位……），每帧
   从当前主角（曲轴角/输入轴角）**绝对重写**所有位姿——绝不用 `+=` 增量累积。
4. 鼠标悬停任意零件弹出信息卡：中英文名、材料与制造工艺、功能、关键设计参数、
   **实时**运动/工作状态（闭包函数，不是静态文本）。
5. 至少具备：视角预设（含飞行过渡）、剖切平面、机体半透明、爆炸图、转速/负荷
   可调、暂停后可逐度拖动主角度、**方向反转三件套（拖拽左右 / 拖拽上下 / 滚轮
   缩放，游戏惯例）**——默认必须是标准语义，开关只是逃生口。
6. 有介质就有流动粒子（冷却液/油/气/电流……），流量随工况变化。
7. 机构类主题配**逐步拆解/装配动画**（真实检修顺序 + 每步拆装要点卡）。
   M 档及以上另配**教学层**：讲解模式（分站镜头+多零件高亮+解说词）与
   考一考（考题由零件档案 DB 自动生成，零人工编写）——见 references/pedagogy.md。
8. 通过 `references/verification.md` 的两道验收：数值断言电池 + 逐张截图目检。

## 第 0 步：定规模

按用户诉求选档，防止过度工程：

- **S 档**（"演示一下原理"）：1 个机构、10–40 零件、无拆解动画可选。半天量级。
- **M 档**（"做个交互教学页"）：完整机器、40–120 零件、全交互 + 拆解。默认档。
- **L 档**（"高精度、全系统"）：多子系统、200+ 零件、流体 + 热力学 + 拆解。
  参考实现即 L 档。

用户没说清时按 M 档做，在回复开头声明假设。规模只影响零件数量与系统数量，
**不降低**第 1–8 条交付定义。

## 架构铁律

违反其中任何一条的代价我们都真实付过，见 references/architecture.md 的事故记录：

1. **分片源码 + cat 构建**。永远不要直接编辑 800KB 的成品文件。布局：

   ```
   src/00_head.html   HTML 壳 + 全部 CSS
   src/10_three.js    three.min.js r160 UMD（scripts/fetch_three.sh 下载）
   src/12_gap.html    </script><script>"use strict";
   src/20_core.js     参数表 P、状态 ST、渲染器、灯光、自研轨道相机
   src/30_util.js     材质库 + 几何生成器工具箱
   src/40..70_*.js    按子系统建模（固定件/运动件/各流体系统）
   src/80_flow.js     流动粒子
   src/90_kin.js      运动学 + 物理
   src/92_parts.js    零件信息库 DB
   src/94_learn.js    教学层：讲解 + 考核（M 档及以上）
   src/95_ui.js       交互层 + 主循环
   src/96_teardown.js 拆解动画（可选）
   src/97_start.js    启动
   src/99_tail.html   收尾
   构建：cat src/* 按序 > out.html（scripts/build.sh）
   每写完一片：node -e "new Function(所有js拼接)" 做语法门禁。
   ```

2. **three.js 用 r160 UMD 从 cdnjs 下载后内联**（`scripts/fetch_three.sh`）。
   r150+ 的 UMD 会打印弃用警告，00_head 里有一段 console.warn 过滤器专门吞掉它。
   不用 ES Modules（无法单文件内联 importmap 到处跑），不用更高版本（UMD 已删除）。

3. **毫米建模，根节点缩放**。所有几何按真实 mm 尺寸建，`ROOT.scale = 0.01`。
   参数表 `P` 是唯一尺寸来源；相机/雾/灯光距离按世界单位（1 = 100mm）配。

4. **全局四件套**：`P`（工程参数）、`ST`（运行状态）、`DB`（零件档案）、
   `ANIM`（动画引用）。所有模块通过它们协作，不搞模块化封装——单文件场景里
   函数声明提升是朋友。

5. 浏览器存储 API 一律禁用（artifact 环境不支持 localStorage）。

## 工作流（每阶段末端有验证门）

**阶段 1 —— 参数表**。先做研究后建模：查该机器的真实量级（缸径行程、齿数模数、
转速范围、压力温度……），写成 `P` 对象和一张给用户看的参数表。尺寸编不准，
后面全部白做。

**阶段 2 —— 骨架**。00_head + 20_core + 30_util + 97_start 拼出"空场景 + UI 壳"：
渲染器（ACESFilmic、PMREM 画布环境光、软阴影）、自研 Orbit（左旋/右移/滚轮缩放/
双击聚焦/飞行过渡）、控制面板 CSS 体系。直接从参考实现抄这三片再改，不要重写。
→ 验证门：无头浏览器打开，0 报错，截图看空场景光照正常。

**阶段 3 —— 建模**。按子系统一片一个文件。几何全部用 30_util.js 的生成器工具箱
（挤出剖面、旋成体、扫掠管、渐开线齿轮、凸轮型线、弹簧、蜗壳、叶轮、螺栓、
InstancedMesh 紧固件阵列），见 references/geometry.md。**先读它的坐标约定一节**，
profileZY/profileYZ 用错平面是本技能记录在案的第一大返工来源。
每个可交互网格经 `add()` 注册 partId 进 PICKABLE。
→ 验证门：截图逐个子系统目检形状、位置、比例。

**阶段 4 —— 运动学**。闭式方程每帧绝对重写位姿；齿轮啮合相位用公式反解，
让齿真的咬合。见 references/motion.md。
→ 验证门：数值断言（连杆闭合误差 ≈ 0、行程/升程/相位/传动比/最小间隙），
在无头浏览器里跑全周期采样，不是目测。

**阶段 5 —— 流动与物理**。CatmullRom 车道 + 等距采样点粒子流；简化物理模型
（一阶滞后的温度/压力，需要时做逐度热力学积分）驱动仪表。见 references/motion.md。

**阶段 6 —— 交互层**。DB 信息卡（含实时状态闭包）、射线拾取 + 高亮材质缓存、
视角预设（fly + snap 双模式）、剖切/半透明/爆炸、系统显隐、仪表画布、操作引导
浮层。见 references/interaction.md。拆解动画引擎（步骤表 + 运动学之上的加性偏移 +
每步镜头 + 进入/退出状态保护）也在这一篇。
→ 验证门：脚本遍历点击**每一个**控件两次，0 报错；悬停采样验证信息卡内容。

**阶段 7 —— 总验收**。跑 references/verification.md 的完整清单：数值电池、
UI 冒烟、全视角截图逐张目检（构图、遮挡、材质、标签）、性能预算
（三角面 < 35 万、draw call < 600、桌面 60fps）。修复后再交付 + 简短操作引导。

## 参考文档路由

| 要做的事 | 先读 |
|---|---|
| 起工程、构建、渲染器、相机、灯光、性能预算 | references/architecture.md |
| 任何几何：剖面挤出/齿轮/凸轮/弹簧/蜗壳/叶轮/管路/紧固件 | references/geometry.md |
| 运动学、齿轮相位、流动粒子、热力学、拆解动画引擎 | references/motion.md |
| 信息卡 DB、拾取、视角、剖切、UI 面板、快捷键 | references/interaction.md |
| 讲解模式、自测考核（DB 自动出题） | references/pedagogy.md |
| 画质升级：物理材质/辉光描边/影棚/声音/技术选型 | references/visual.md |
| 界面设计语言（默认 paper 工程手册风，去 AI 味）、多配置联动铁律 | references/design.md |
| 无头浏览器验证、截图技巧、断言电池、审查清单 | references/verification.md |
| 完整可运行范例（任何拿不准的写法） | assets/example-diesel/src/ |

## 质量门槛（量化）

- 语法门禁每片必过；成品 0 控制台报错、0 pageerror。
- 运动闭合误差 < 0.001 mm；名义行程/升程误差 < 0.1%。
- 运动件间最小间隙 > 0（用全周期采样证明，不是看着没撞）。
- 每个 PICKABLE partId 在 DB 有条目（脚本检查 dbmiss 为空数组）。
- 信息卡实时状态函数全部 try/catch 包裹（单条坏档案不能杀死整个卡片系统）。
- 三角面 < 350k、draw call < 600；集成自动降质（低帧率先关阴影再降像素比）。
- 拆解模式进入→播完→逆播→退出后，全部坐标与初始快照 bit 级一致。

## 已知天坑 Top 12（每条都真实发生过）

1. **挤出平面搞混**：ExtrudeGeometry 的 (x,y) 剖面到底映到世界哪两轴，先写
   注释再写代码；参考实现为此定义了 profileZY / profileYZ / plateXZ 三个显式约定。
2. **透明体写深度**：水套/油道半透明体必须 `depthWrite=false` + renderOrder 分层，
   否则后面的零件被"透明墙"裁掉。
3. **剖切要逐材质**：clippingPlanes 挂在材质上；新加"外壳类"材质忘了挂就会剖不断。
4. **增量旋转漂移**：任何 `rotation.x +=` 都是隐患，一律 `= f(theta)`。
5. **拆解偏移要叠加在运动学之后**：主循环顺序 updateKinematics → applyTeardown，
   且运动学必须绝对重写位姿，否则退出拆解后零件回不去原位。
6. **子部件挂错父节点**：飞轮齿圈挂在场景根上导致飞轮转齿圈不转——旋转体的
   附属件必须挂进旋转组。交付前做"旋转链审计"：列出每个该转的东西问它父节点是谁。
7. **无头截图挂死**：连续渲染下 Playwright screenshot 会超时；截图前暂停
   requestAnimationFrame，截完恢复（harness 里有现成函数）。
8. **SwiftShader 帧率≠真机**：无头环境 15–25fps 正常，性能结论以三角面/drawcall
   预算为准。启动参数需 `--use-gl=swiftshader --enable-unsafe-swiftshader`。
9. **雾距按世界单位配**：mm 思维配雾 = 整个场景灰白一片。
10. **相机预设要 fly + snap 双模式**：截图/测试用 snap（立即到位），用户交互用 fly。
11. **剖视相机要站在被切掉的一侧**，否则看到的是完好外壳（详见 interaction.md）。
12. **断言公式先自检再用**：拿已知位形标定断言本身，防假阴/假阳（详见 verification.md）。
13. **输入方向必须有断言**：滚轮/拖拽/平移的方向语义，数值断言与截图目检**都测不到**。
    本技能出过最贵的一次——滚轮缩放反向从第一台复制到全部 5 台机器与范例，几十项
    断言全绿、上百张截图目检通过，用户上手一分钟就发现。合成 WheelEvent 写断言，
    成本 5 行（详见 verification.md 3.5）。

## 交互默认键位（保持一致性）

Space 暂停 · 1–5 视角 · C 剖切 · X 半透明 · F 粒子 · P 流线 · E 爆炸 ·
H 隐藏界面 · R 复位 · T 拆解模式 · [ ] 拆解单步 · G 讲解模式 · Q 考一考。

## 交付

构建产物用 SendUserFile 发送；说明一句操作要点即可，不要长篇复述功能。
若用户会反复回看（教学页/仪表板性质），按宿主环境规则考虑持久化为 artifact。
