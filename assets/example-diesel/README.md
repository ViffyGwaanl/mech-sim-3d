# 参考实现：直列四缸涡轮增压柴油机（L 档）

343 个可拾取零件 / 105 条双语零件档案 / 17 步单缸拆解动画 / 数值验证全绿。

src/ 缺 10_three.js（体积原因不入库）——先跑 `scripts/fetch_three.sh
assets/example-diesel/src/10_three.js` 再 `cd assets/example-diesel && bash
../../scripts/build.sh diesel.html` 即可得到可运行成品。

各分片对应 references/ 各篇；拿不准任何写法就打开对应分片抄。
关键锚点：
- 20_core.js  参数表 P / Orbit 相机 / PMREM 画布环境光
- 30_util.js  全部几何生成器与材质库
- 60_valvetrain.js  凸轮-挺柱-推杆-摇臂-气门全链 + 齿轮系相位常数
- 90_kin.js   曲柄滑块 + 升程函数 + 齿轮相位公式 + Wiebe 热力学
- 96_teardown.js  拆解引擎全文（步骤表数据驱动，可整片移植）
