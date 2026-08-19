# mech-sim-3d

[中文](#中文) · [English](#english)

**在线案例 / Live example:** <https://washer.papertok.ai/>

一个面向 Codex / Agent 工作流的机械 3D 仿真 Skill，以及使用该 Skill 制作的完整洗烘一体机可视化案例。

> A Codex skill for building high-fidelity, offline, single-file Three.js simulations, bundled with a complete washer-dryer visualization made with the skill.

![洗烘一体机三种烘干技术 3D 对比界面 / Interactive 3D washer-dryer comparison](assets/example-washer-dryer/docs/preview.png)

## 联系与关注 / Connect

欢迎扫码关注微信公众号，或添加个人微信。<br>
Scan the QR codes to follow the official account or add Gwaanl on WeChat.

| 微信公众号 / Official Account | 个人微信 / Personal WeChat |
|:---:|:---:|
| <img src="assets/example-washer-dryer/docs/wechat-official-account.jpg" alt="Page & Pause 微信公众号二维码 / Official Account QR code" width="300"> | <img src="assets/example-washer-dryer/docs/wechat-personal.png" alt="Gwaanl 个人微信二维码 / Personal WeChat QR code" width="220"> |
| 微信扫码关注 Page & Pause<br>Scan with WeChat to follow Page & Pause | 微信扫码添加 Gwaanl<br>Scan with WeChat to add Gwaanl |

---

## 中文

### 项目简介

本仓库把 **Skill 与案例放在一起**：根目录是可安装的 `mech-sim-3d` Skill，`assets/example-washer-dryer/` 是使用该 Skill 制作并公开的完整单文件 3D 网站。案例以统一工况对比直排式、冷凝式和热泵式三种洗烘一体机烘干路线。

### Skill 能做什么

- 以真实工程尺寸和参数表驱动机械建模，而不是只靠目测比例。
- 使用闭式运动学方程逐帧计算机构姿态，避免增量动画漂移。
- 支持零件信息卡、剖切、半透明、爆炸图、介质流动和拆解装配。
- 提供分站讲解、自动出题，以及数值断言、UI 冒烟和截图验收工具。
- 输出可通过 `file://` 直接打开、无需运行时 CDN 的单文件 Three.js 页面。

### 完整案例：洗烘一体机三种烘干技术对比

- [打开在线案例](https://washer.papertok.ai/)
- [查看案例源码与完整说明](assets/example-washer-dryer/)
- 支持三种技术切换、介质回路、实时工况指标、预设视角、剖切、爆炸图、140 个可拾取零件、84 条中英双语零件档案，以及 22 步拆解/装配演示。
- 演示数据用于统一工况下的工程比较，不代表所有品牌或机型。

本案例在交互表达和机械系统可视化方面的创作灵感，来自 B 站 UP 主温述卿展示的“四冲程柴油机 3D 交互仿真”。本项目围绕洗烘一体机三种烘干路线独立制作。

<img src="assets/example-washer-dryer/docs/inspiration-wenshuqing-bilibili.png" alt="灵感来源：B站 UP 主温述卿的四冲程柴油机 3D 交互仿真视频页面" width="760">

> 图片与原视频内容版权归 Bilibili 及原作者所有；此处仅作来源说明与致谢。

### 仓库结构

```text
SKILL.md                              Skill 入口与完整工作流
references/                           架构、几何、运动、交互、教学与验证规范
assets/example-diesel/                直列四缸柴油机参考源码
assets/example-washer-dryer/          完整洗烘一体机 3D 案例与双语说明
assets/visual-pack/                    材质、特效与声音扩展
scripts/                               构建、Three.js 获取与浏览器验证脚本
```

### 安装与使用

从 [Releases](https://github.com/ViffyGwaanl/mech-sim-3d/releases) 下载 `mech-sim-3d.skill`，再导入支持 `.skill` 文件的 Codex / Agent 环境。也可以克隆本仓库并保留目录结构。

安装后可以直接对 Agent 说：

```text
用 mech-sim-3d 做一个可离线运行的行星齿轮箱 3D 教学页，包含剖切、爆炸图和传动比演示。
```

构建参考柴油机需要 `curl`、Node.js 和浏览器：

```bash
bash scripts/fetch_three.sh assets/example-diesel/src/10_three.js
cd assets/example-diesel
bash ../../scripts/build.sh diesel.html
```

完整验收方法见 [`references/verification.md`](references/verification.md)。

### 许可

本仓库以 [MIT License](LICENSE) 开源。Three.js 的版权与许可见案例中的 [第三方声明](assets/example-washer-dryer/THIRD_PARTY_NOTICES.md)。

---

## English

### Overview

This repository keeps the **skill and its real-world example together**. The root contains the installable `mech-sim-3d` skill, while `assets/example-washer-dryer/` contains a complete single-file 3D website created with it. The example compares vented, water-cooled condensing, and heat-pump washer-dryer technologies under one shared operating scenario.

### What the skill provides

- Parameter-driven geometry based on real engineering dimensions.
- Closed-form kinematics evaluated every frame to avoid incremental animation drift.
- Part information cards, section cuts, transparency, exploded views, fluid flow, and teardown or reassembly sequences.
- Guided learning stations, automatically generated quizzes, numerical assertions, UI smoke tests, and screenshot checks.
- Offline, single-file Three.js deliverables that open directly through `file://` without a runtime CDN.

### Complete example: washer-dryer technology comparison

- [Open the live example](https://washer.papertok.ai/)
- [Browse the example source and full bilingual documentation](assets/example-washer-dryer/)
- Explore three drying technologies, fluid circuits, live operating metrics, preset views, section cuts, exploded views, 140 selectable parts, 84 bilingual component profiles, and a 22-step teardown or reassembly sequence.
- Demonstration data provides an engineering comparison under a shared scenario; it is not a universal claim for every appliance.

The interaction and mechanical-visualization concept was inspired by a “Four-Stroke Diesel Engine 3D Interactive Simulation” shared by Bilibili creator Wenshuqing / 温述卿. This washer-dryer comparison was independently created around its own subject and engineering model.

<img src="assets/example-washer-dryer/docs/inspiration-wenshuqing-bilibili.png" alt="Inspiration: Bilibili creator Wenshuqing's four-stroke diesel engine 3D interactive simulation" width="760">

> The screenshot and original video remain the property of Bilibili and their respective creator. They are included solely for attribution and contextual reference.

### Repository structure

```text
SKILL.md                              Skill entry point and complete workflow
references/                           Architecture, geometry, motion, interaction, pedagogy, and verification guidance
assets/example-diesel/                Inline-four diesel-engine reference source
assets/example-washer-dryer/          Complete washer-dryer 3D example and bilingual documentation
assets/visual-pack/                    Materials, effects, and sound extensions
scripts/                               Build, Three.js acquisition, and browser-verification tools
```

### Install and use

Download `mech-sim-3d.skill` from [Releases](https://github.com/ViffyGwaanl/mech-sim-3d/releases), then import it into a Codex or Agent environment that supports `.skill` files. You can also clone this repository and preserve its directory structure.

Example prompt:

```text
Use mech-sim-3d to build an offline 3D teaching page for a planetary gearbox, including a section cut, exploded view, and gear-ratio demonstration.
```

To build the diesel-engine reference, install `curl`, Node.js, and a browser, then run:

```bash
bash scripts/fetch_three.sh assets/example-diesel/src/10_three.js
cd assets/example-diesel
bash ../../scripts/build.sh diesel.html
```

See [`references/verification.md`](references/verification.md) for the complete validation workflow.

### License

This repository is released under the [MIT License](LICENSE). See the example’s [third-party notice](assets/example-washer-dryer/THIRD_PARTY_NOTICES.md) for the Three.js copyright and license information.
