# 架构与工程化

完整可运行版本见 `assets/example-diesel/src/`，本篇解释"为什么这样做"并给出可直接
抄改的最小代码。行号指示均指参考实现。

## 1. 构建流水线

```bash
scripts/fetch_three.sh          # 下载并固定 three r160 UMD → src/10_three.js
bash scripts/build.sh out.html  # 按文件名序 cat src/* → 单文件
node -e "new Function(所有js拼接)"   # 语法门禁（不启动浏览器就能抓 90% 低级错误）
```

分片按两位数前缀排序；`12_gap.html` 只有三行：`</script><script>"use strict";`，
把 three 库和业务代码分进两个 script 块（便于 three 的弃用警告过滤器生效，也避免
单个巨型 script 的解析错误定位困难）。

## 2. 渲染器与光照（20_core.js）

关键选择及理由：

- `ACESFilmicToneMapping + SRGBColorSpace`：金属 PBR 不过曝的前提。
- 环境光照不用外部 HDR（单文件禁网络资源）：**用 2D canvas 画一张渐变天空 +
  几个柔光灯箱，经 PMREMGenerator 转成环境贴图**。金属长条高光全靠这几个灯箱。
- 三向灯：key（带 2048 阴影，shadow camera 的 left/right/top/bottom 要罩住整机）、
  冷色 fill、暖色 rim，再加一个 HemisphereLight 和一个放在机体内部的 PointLight
  （剖切/拆解时照亮内腔，否则内壁死黑）。
- 雾 `new T.Fog(bg, 34, 120)`——按世界单位（1=100mm）配；配成 mm 量级会白屏。
- `renderer.localClippingEnabled = true`（剖切必需）。

## 3. 自研轨道相机（20_core.js class Orbit）

不用 OrbitControls（UMD 版不含，另拉文件破坏单文件原则），自研 ~70 行：

- 球坐标 `Spherical(radius, phi, theta)` + 阻尼插值（target/tTarget 双份，lerp 0.14）。
- pointer 事件统一处理鼠标+触屏：单指旋转、右键/Shift 平移、双指捏合缩放。
- `fly(target, r, phi, theta, ms)`：smoothstep 飞行过渡，theta 走最短弧
  （±π 归一化，否则会绕远路转一圈）。
- 视角预设需要 **fly + snap 双模式**：`setView(k, snap)`。snap 直接写平滑值与
  目标值并立即 update——自动化截图和拆解镜头都依赖它。

## 4. 全局状态

```js
const P  = { bore:102, stroke:120, ... };  // 唯一尺寸真源，全部 mm
const ST = { play, rpm, load, theta, clip, ghost, flow, explode, ... };
const DB = { partId: {zh,en,sys,mat,fn,ps,st}, ... };
const ANIM = { crank, flywheel, cam, ... };  // 需要每帧驱动的引用
const PICKABLE = [];                          // 可拾取网格
const GROUPS = {};                            // 系统分组（显隐控制）
```

`add(parent, geo, mat, partId, opt)` 是唯一网格入口：设置阴影、注册 userData、
push 进 PICKABLE。绕过它创建的网格就不可悬停（参考实现里飞轮螺栓最初就漏了）。

## 5. 主循环节流

```js
function loop(){
  requestAnimationFrame(loop);
  // dt 用 raw 计 FPS、clamp(0.06) 后驱动物理
  if(ST.play) ST.theta = (ST.theta + rpm*6*timeScale*dt) % 720;
  updateKinematics(); updateThermo(dt); updateFlows(dt);
  applyExplode(); applyTeardown(dt); controls.update();
  pickT>0.045 && pick();          // 射线拾取 ~22Hz 足够
  uiT>0.07   && refreshPanels();  // DOM 仪表 ~14Hz
  trT>0.35   && refreshTrace();   // 重算示功曲线更低频
  renderer.render(scene, camera);
}
```

DOM 写入是隐性大头，仪表刷新绝不能每帧做。

## 6. 性能预算与自动降质

预算：三角面 < 350k、draw call < 600、几何数 < 500。省面数的杠杆按收益排序：
紧固件用 InstancedMesh（一次 draw call 画几十个螺栓）、旋成体/挤出的分段数
按可见尺寸配（小件 16 段、大圆 48 段）、同材质小件 mergeGeos 合并。

自动降质（95_ui.js）：连续 4 个采样窗 FPS<22 → 先关阴影 → 再降 pixelRatio 到 1
→ 然后停手。桌面阈值别设高，SwiftShader 无头环境本来就只有 15–25fps。

## 7. 防御性收尾

- `webglcontextlost` 监听：preventDefault + 全屏提示"刷新即可恢复"。
- resize 监听更新 aspect 与 size。
- 加载浮层：three 初始化 + 首帧后淡出，避免白屏期。
- devicePixelRatio clamp 到 2（4K 屏不炸显存）。

## 8. 事故记录（为什么有这些规矩）

- 相机预设只写 fly 没写 snap → 无头测试里镜头永远在半路，截图全废，排查 40 分钟。
- 雾按 mm 配 → 首屏全灰，以为灯光全坏。
- 三角面没预算 → 散热器翅片用实体建了 46 片 ×2 套，后改 InstancedMesh 省 90 个
  draw call。
- 忘记给附件材质挂 clippingPlanes → 剖切模式下涡轮/软管浮在半空不被剖。
