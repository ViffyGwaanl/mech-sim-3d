# Washer-Dryer Drying Tech Comparator

用一个可离线运行的 3D 交互页面，对比洗烘一体机的三种烘干路线：直排式、冷凝式与热泵式。

> An offline, single-file Three.js simulation comparing vented, condenser, and heat-pump washer-dryer technologies.

## 在线演示

**[打开 GitHub Pages 演示](https://viffygwaanl.github.io/washer-dryer-compare/)**

![洗烘一体机三种烘干技术 3D 对比界面](docs/preview.png)

## 页面内容

- 三种烘干技术的气流、冷凝水与制冷剂回路可视化。
- 直排式、冷凝式、热泵式一键切换与并排指标对比。
- 烘干进度、倍速、视角、剖切、半透明、爆炸图和系统显隐控制。
- 实时温湿度、除湿速率、累计电耗、累计耗水及热泵 COP 仪表。
- 零部件双语信息卡、分站讲解、自动出题和 22 步拆解/装配演示。
- Three.js r160 已内联，不依赖 CDN；下载后双击即可运行。

## 本地运行

无需构建或安装依赖：

```text
下载 index.html → 双击打开
```

也可以用任意静态服务器打开，例如：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000/`。

## 主要操作

- 鼠标左键旋转，右键平移，滚轮缩放，双击聚焦零件。
- `1`–`5` 切换视角，`C` 剖切，`X` 半透明，`F` 粒子，`P` 流线。
- `E` 爆炸图，`T` 拆解，`G` 讲解，`Q` 考一考，`H` 隐藏界面。

## 模型口径

页面使用“洗涤 8 kg / 烘干 5 kg、需除水 2.0 kg”的统一工况来解释三种技术的工作差异。能耗、耗水、时长和 COP 是该演示工况下的工程化比较值，不代表所有品牌与机型；实际表现会随负载、含水率、环境温湿度、程序和硬件设计变化。

## 技术与许可

项目由原生 HTML、CSS、JavaScript 和内联 Three.js r160 构成，页面源码以 [MIT License](LICENSE) 开源。Three.js 的版权与许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
