# 画质升级：从"能看"到"惊艳"

三层杠杆，按性价比排序。资产 `assets/visual-pack/` 三件套已在柴油机与
洗烘对比机上实战验证。

## 1. 零成本层：把 r160 UMD 自带的高级材质用起来

MeshPhysicalMaterial 在 r160 UMD 里实测支持：transmission（真折射玻璃，
含 thickness/ior/attenuation）、clearcoat（家电钣金/车漆的清漆层）、
anisotropy（拉丝金属的长条高光）、sheen、iridescence（dispersion 不支持，
r17x 才有）。观感提升最大的三个用法：**玻璃门/观察窗用 transmission**、
**外壳钣金用 clearcoat**、**不锈钢转子用 anisotropy**。visual-pack 的
`VMAT.glass/paint/brushed/chrome/softPlastic` 直接用。

坑（实测）：SwiftShader 无头环境下 transmission 玻璃 roughness≥0.06 会
糊成磨砂白挡住内部，降到 ~0.015 才通透；真机 GPU 无此问题——**按无头
表现调参数再交付**，宁可真机上更透一点。

## 2. visual-pack 三件套（UMD 兼容、无 addons，整片当分片编入）

- `32_vpmat.js`：上述材质工厂 + `buildStudio(scene,{r})` 影棚（渐变穹顶+
  展示台+发光环）。坑：展示台默认高度要按机器脚底对齐（参数 y），
  且仰视机位 phi 不要超过 ~1.6，否则被台面挡死。
- `34_vpfx.js`：`FX.init(renderer,scene,camera)` 后主循环改
  `FX.update(); FX.render()`。选择性辉光（layer 3 二次渲染→半分辨率两轮
  高斯 ping-pong→加色合成）：`FX.glow(mesh)` 给发热件/指示灯/光环；
  外壳法描边 `FX.outline(mesh)` 接进 highlight()（对 InstancedMesh 自动
  跳过）；自带 CSS 暗角。坑：多 pass 后 `renderer.info` 只剩最后一个
  quad 的统计——性能读数要 `info.autoReset=false` 并在循环头手动
  reset，读到的 drawcall 含辉光 pass（≈纯场景 1.5 倍）。
- `36_vpsnd.js`：WebAudio 合成机器声（风机=带通噪声、压缩机=52Hz 锯齿+
  AM 抖动、水声=高通噪声、电机=低通锯齿随转速变调）。默认关，面板开关调
  `SND.toggle()`，工况循环 ~0.1s 调一次 `SND.update({fan,water,comp,motorRpm})`。
  无头下 AudioContext 会 suspended——API 不抛错即算过验。

再加三个便宜的电影感手段：入场镜头（snap 到远机位再 fly 进）、
剖切/悬停时的内腔点光、把"讲解模式"的每站镜头当运镜设计。

## 3. 换武器层：什么时候离开"单文件 UMD three"

按需求触发，不要为技术而技术：

- **要 SSAO/SSR/DoF 级后处理** → 放弃 UMD 单文件铁律，改 ESM + 构建
  （esbuild 单命令打包回单文件），引 pmndrs/postprocessing 与 N8AO。
- **要剖切面带"盖面"的实体感断面**（工程图观感）→ three-bvh-csg 做真
  布尔剖切（配 three-mesh-bvh 加速），这是当前剖切（裸剖无盖）最大的
  观感升级点。
- **要时间线编舞级的导览动画** → Theatre.js（或 GSAP）驱动镜头+高亮+
  字幕，讲解模式即升级为"可拖动时间轴的纪录片"。
- **要更强开箱效果/可视化编辑器** → Babylon.js（自带 glow/SSAO/节点
  材质）或 PlayCanvas（引擎开源+在线编辑器）。迁移成本高于收益，除非
  团队长期投入。
- **WebGPU/TSL**（2026 现状：three WebGPURenderer 已可生产使用，但走
  ESM/构建路线，与 UMD 单文件不兼容）→ 大场景/计算粒子需求再迁。
- **照片级实物** → 换资产管线而不是换引擎：Blender 建模（倒角+烘焙 AO+
  真贴图）导 glTF+Draco，代码只做装配与驱动；或 3D 高斯泼溅扫描真机。
- **质量标杆**参考 ciechanow.ski（Bartosz Ciechanowski 的交互文章）：
  它的震撼来自"每一张图都可拖动+叙事编排"，不是引擎——印证第 2 层
  （编舞+材质）比换引擎优先。

## 4. 验收补充

辉光开/关各截一张对比；玻璃门透视筒内一张；夜景感（低环境光+辉光）一张；
声音开关在冒烟脚本里点两次不抛错；performance 预算按含辉光 pass 的口径记录。
