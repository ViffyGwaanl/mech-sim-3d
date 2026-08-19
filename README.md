# mech-sim-3d

一个面向 Codex / Agent 工作流的机械 3D 仿真 Skill：把发动机、泵、齿轮箱、压缩机、机器人机构等工程系统，制作成可离线运行的单文件 Three.js 交互网页。

> A Codex skill for building high-fidelity, offline, single-file Three.js simulations of machines and physical systems.

## 能做什么

- 以真实工程尺寸和参数表驱动建模，而不是只靠目测比例。
- 使用闭式运动学方程逐帧计算机构姿态，避免增量动画漂移。
- 支持零件悬停信息卡、剖切、半透明、爆炸图、介质流动与拆解装配。
- M 档及以上提供分站讲解与基于零件档案自动出题的学习模式。
- 提供无头浏览器脚本，用数值断言、UI 冒烟和截图共同验收。

## 仓库结构

```text
SKILL.md                         Skill 入口与完整工作流
references/                     架构、几何、运动、交互、教学与验证规范
assets/example-diesel/          直列四缸涡轮增压柴油机参考源码
assets/visual-pack/             材质、特效与声音扩展
scripts/                        构建、Three.js 获取与浏览器验证脚本
```

## 安装

最方便的方式是从 [Releases](https://github.com/ViffyGwaanl/mech-sim-3d/releases) 下载 `mech-sim-3d.skill`，再导入支持 `.skill` 文件的 Codex / Agent 环境。

也可以克隆本仓库，把整个目录放入宿主的 skills 目录；请保留 `SKILL.md`、`references/`、`assets/` 和 `scripts/` 的相对位置。

## 使用示例

安装后可以直接对 Agent 说：

```text
用 mech-sim-3d 做一个可离线运行的行星齿轮箱 3D 教学页，包含剖切、爆炸图和传动比演示。
```

## 构建参考柴油机

需要 `curl`、Node.js 和浏览器。Three.js r160.1 会在构建前单独下载，不直接提交进仓库。

```bash
bash scripts/fetch_three.sh assets/example-diesel/src/10_three.js
cd assets/example-diesel
bash ../../scripts/build.sh diesel.html
```

生成的 `diesel.html` 是可通过 `file://` 直接打开的单文件页面。完整验收方法见 [`references/verification.md`](references/verification.md)。

## 设计原则

本 Skill 的目标不是只做“看起来像”的动画，而是让几何尺寸、运动关系、工作状态与教学交互可以被检查和复现。不同机器的参数、边界条件和安全规范应以对应设备资料为准。

## License

本仓库以 [MIT License](LICENSE) 开源。构建时获取的 Three.js 由其作者按 MIT License 发布。
