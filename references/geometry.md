# 几何建模手册

全部生成器的完整实现在 `assets/example-diesel/src/30_util.js`（约 200 行），
直接整片复制进新项目再增删。本篇讲约定、选型和易错点。

## 0. 坐标约定（先读这节，返工大户）

发动机类机器的世界系：X = 曲轴轴线（纵向），Y = 上，Z = 横向。
ExtrudeGeometry 把 Shape 画在 (x,y) 平面、沿 +z 挤出——必须显式变换到目标平面。
参考实现定义三个约定函数，**画任何剖面前先想清楚用哪个**：

```js
profileZY(shape, len)  // 剖面画在"主视图"(z,y)平面，沿 X 挤出，居中
                       // 用于：机体/曲轴箱/缸盖壳体/连杆/摇臂/油底壳
profileYZ(shape, len)  // 剖面画在 (y,z) 平面（极坐标件视角），沿 X 挤出
                       // 用于：绕 X 轴旋转的盘类——齿轮/凸轮/曲柄臂/平衡重
plateXZ(shape, thick)  // 剖面画在水平 (x,z) 面，沿 Y 挤出（y∈[0,thick]）
                       // 用于：带孔平板——缸体顶板/缸垫/火力面/翅片
```

区别本质是旋转矩阵不同。profileYZ 用于旋转件是因为其 shape 角 0° 对应世界 +Y、
逆时针为正，与 `rotation.x = θ` 的驱动方向自洽——齿轮相位公式依赖这一点。

这三个约定默认**主旋转轴 = X** 的机器布局。若你的机器主轴沿 Z（如立式泵、
钟表正面视角），别硬套：仿照参考实现的矩阵写一个 profileXY（挤出→Z），
并同步把驱动改成 rotation.z——实测代理在蒸汽机布局上验证过这条适配路径。

## 1. 基础形状工具

```js
rr(w,h,r)                  // 圆角矩形 Shape（中心原点）
hole(shape,cx,cy,r)        // 往 Shape 打圆孔（absarc 反向路径）
tubeGeo(ro,ri,h,seg)       // 空心圆筒（挤出环形剖面，轴向 Y）
latheY(pts,seg)            // 旋成体：[[r0,y0],[r1,y1]...] 绕 Y 旋转
                           //   活塞/气门/喷油器/皮带轮都是一张母线表
tubeAlong(pts,r,seg,rad)   // CatmullRom 路径扫掠圆管：管路/歧管/推杆
mergeGeos(list)            // 同材质几何合并（省 draw call，含无索引兜底）
boltGeo(d,len,hh)          // 六角螺栓（头 + 杆）
springGeo(R,wire,coils,len)// 螺旋弹簧（两端并紧收径），压缩动画用 scale.y
```

带孔壳体（外轮廓 - 内轮廓）：内轮廓 `getPoints()` 后**倒序**压成 Path 塞进
holes——方向错了孔会变成实心。

## 2. 传动件

**渐开线齿轮 `gearShape(m, z, ha, hf, backlash)`**：真渐开线齿廓（压力角 20°，
含齿根过渡）。配对齿轮中心距必须 = m(z1+z2)/2；已知中心距反解模数
`m = 2d/(z1+z2)`。啮合相位公式见 motion.md——齿轮不是装饰，齿要真的咬合。
`backlash`（法向侧隙，mm，默认 0）：做"齿面接触/互不侵入"类数值断言时必须
给一个真实侧隙（0.1–0.3mm 量级），零侧隙齿廓在啮合区必然数值交叠，
实测代理为此浪费过一轮调试。

**凸轮 `camShape(rb, lift, halfDeg, noseDeg)` + `camProfile(x)`**：
基圆 + 升程型线（余弦^1.2 缓冲）。关键约定：凸轮几何的桃尖角 `nose` 与运动学的
升程函数 `liftOf(psi)` 必须来自**同一组相位常数**，否则画的凸轮和算的升程对不上。
参考实现从配气正时（开闭角）反算 peak/half，再喂给两者。

**蜗壳 `voluteGeo(R0,R1,r0,r1,turns,seg,rad)`**：截面半径随包角收缩的螺旋扫掠，
手写 BufferGeometry。涡轮/压气机/离心泵壳全用它。

**叶轮 `wheelGeo(n,rh,rt,h,twist,thick,back)`**：n 片扭曲叶片 + 轮毂 + 可选背板，
手写顶点。径流式（涡轮/压气机/水泵）通用，twist 正负决定旋向。

## 3. 紧固件与细节件

原则：**示意但在场**。螺栓/垫片/密封圈用简化模型，但位置数量对。

- 同规格螺栓阵列一律 InstancedMesh（缸盖 14 条 = 1 个 draw call）。
  注意 InstancedMesh 也能被 Raycaster 拾取，信息卡照常工作。
- 垫片 = 带孔薄板 plateXZ；O 圈/油封 = TorusGeometry；卡箍 = 窄圆筒。

## 4. 材质库

`M(name, opts, outer)` 工厂：MeshStandardMaterial + 命名 + 记录基准透明度
（半透明模式要恢复用）。`outer=1` 的材质：挂 clippingPlanes（会被剖切）+
DoubleSide（剖面不漏底）+ 进 OUTER 数组（半透明模式批量改 opacity）。

调质套路：铸件 roughness .6–.75 / metalness .9；机加工面 .28–.4 / 1.0；
磨削件 .1；橡胶 metalness .02 roughness .9；半透明介质体（水套/油道）
transparent + opacity .22–.3 + depthWrite=false + renderOrder 5–7。

**新增"外壳类"材质必须带 outer 标志**，否则剖切时它不被切、半透明时它不变透明。
反向同样要检查：**藏在壳体内部的实体遮挡件**（浮动侧板、隔板、大块橡胶）如果
不挂 outer，剖切/半透明模式下它会原样挡住你想展示的转子——内部大件要么挂
outer 一起剖，要么在这两种模式下主动降透明度。

## 5. 三维标注

canvas 画 sprite：底部半透明圆角衬底 + 中文大字 + 英文小字，
`depthTest=false` + renderOrder 20 悬浮。数量克制（≤10 张），可开关。

## 6. 精度语义

"0.1mm 级视觉精度"指：尺寸链取自真实参数表、配合间隙按真实量级建模且放大
可见（活塞-缸壁 0.35mm、轴瓦间隙等）、圆分段数保证轮廓平滑不见棱。
它不是 CAD 实体精度——告知用户这是教学/演示级，不能出加工图。
