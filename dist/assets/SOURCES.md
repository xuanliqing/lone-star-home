# 素材来源

核对日期：2026-09-26。

## 白天背景

- 文件：`observatory-day-original.png`
- 内容：《明日方舟》首页动态场景「星迹」的白天背景资源，BWIKI 文件名 `Bg lonetrail 1 2.png`。
- 来源页面：https://wiki.biligame.com/arknights/游戏个性化内容
- PNG 地址：https://patchwiki.biligame.com/images/arknights/5/51/17ahe0gq9lcqmzzffviuhb892k7jcen.png
- 实测：1820 × 1024，2,702,466 字节。按来源原文件保存，未放大、锐化或经 AI 重绘。
- 这是找到的公开 PNG 资源，未确认存在更高分辨率的官方静态源图，不标为 4K。
- 游戏美术版权属于上海鹰角网络科技有限公司及其关联公司；BWIKI 为社区资料来源，本项目不主张该图片版权。

## 既有素材

`observatory-day.webp`、`observatory-night.webp`、`reference.webp` 为用户最初提供的素材。夜景继续使用用户提供的完整画面；检索到的夜间 PNG 不包含相同星空效果，未直接替换。

`paper-grain.svg`、`orbit-etch.svg`、`dial-etch.svg` 为本项目的代码绘制装饰。

## 图标重绘

`index.html` 内的 `i-squad`、`i-operator`、`i-store`、`i-recruit`、`i-headhunt`、`i-mission` 和 `i-base` 依据用户提供的 `reference.webp` 重绘为可缩放 SVG。参考的是原截图中的轮廓、切口、圆盘分区与阵列结构，保留主页现有功能标签。没有使用截图切片作为按钮图标，也没有引入官方站点的 SVG 文件或字体。

后续按用户补充的 参考截图 校准标题倒影、同心环宽度、彩色侧边和小标记；双环补充半圆切口与金色圆点，`i-warehouse` 重建交错点阵和空心节点。标题使用系统 Arial Narrow 粗体与细轮廓，未打包字体文件。

## 2026-09-28 动态界面观察

用户追加表盘截图：参考截图。主题为「天想」，配套场景为「星迹」。官方主题/场景介绍：https://ak.gryphline.com/news/2614 。

实际在浏览器播放、暂停并对照的实机视频：

- 对-阿瓜-特装型《30源石的天想星迹（孤星）主题界面+BGM实装展示！「明日方舟」》：https://www.bilibili.com/video/BV1tFiGBBE2g/ 。观察夜间界面的分层光环、机械图案与表盘反光。
- 狱狱ovo《以防你不知道孤星主题界面的切换是怎么样的》：https://www.bilibili.com/video/BV1e8vQB4Emp/ 。在约 2–3 秒观察白天橙色图案、Base 图案填充/反色状态，以及后续昼夜切换。这个视频里的形态切换不等于已精确测得独立的循环周期。
- 鸢羽白河《【明日方舟】如果你同时换上主题和场景，就会得到一个好轴，指体力显示盘》：https://www.bilibili.com/video/BV1osiGBnE19/ 。对照约 10–32 秒的轨道、反光与球体遮挡层次。

实现为本项目编写的 SVG/CSS：薄白色表圈、黑玻璃细颗粒、分段红黄青紫弧线、前景暗色球体遮挡、三层椭圆转面、轨道短尾迹、高光位移和图标局部扫光。原循环中的上下漂浮与彩色星云已替换。轨道周期 18/14/11 秒，玻璃高光 13 秒，球面光照 17 秒；图标反色和指针停顿节奏是基于观感的近似设计，并非提取的游戏原始动画参数或逐帧复现。

未下载或打包视频、音频、游戏动画文件；保留已有浏览器主页功能与静态背景。计时的真实数值与进度遮罩不受装饰循环控制。

## 2026-09-28 夜版组件的官方动态演示

- 主要依据：明日方舟官方版主「明日方舟AI四号机」2025-12-27 发布的《【新增动态主题场景】》：https://www.taptap.cn/moment/754008618860285138 。在官方帖内实际观看第二张循环动图，核对天想主题的夜间图标、材质与场景切换；这是一份官方动态演示 GIF，并非 B 站用户上传的视频。
- 官方动图：https://img2-tc.tapimg.com/moment/etag/lo-MA7gxoT4wnGWuuluH5SWuKiVc_20251227160049.gif/_tap_ugc.gif 。原显示尺寸 720 × 575，含标题和活动信息。仅用于浏览器观察，未下载或打包到网站。
- 官方上架说明：https://ak.hypergryph.com/news/2837 。用于核对「天想星迹组合包」及主题/场景名称。
- 辅助细节对照：上文列出的 BV1tFiGBBE2g 实机录像。其上传者为玩家，不能标为官方发布。

观察到的夜版差异：深黑微绿面板、乳白标题与弱倒影；快捷图标的深色圆心和开放环线；待办浅色球面上的深色阵列；天气卡对应图标的浅色六边框；收藏卡和管理顶栏转为橙红，收藏图标为多重开放圆弧；Guide 深色、Archives 橙红；日程页签转为赭金色；表盘增加乳白标记和浅色操作按钮。独立 SVG 夜版符号与 CSS 材质依据这些差异重绘，保留浏览器主页功能文案。

周边虹彩光晕采用低饱和青、紫、灰金色缓慢转动及明暗变化。17 秒旋转和 9 秒呼吸属于观感校准，并非游戏原始动画时序；未声称像素级或逐帧一致。背景沿用现有静态夜景，新增昼夜淡入淡出。

## 2026-09-28 阿米娅「寰宇独奏」动态立绘

- 官方名称和动作对照：https://ak.hypergryph.com/archive/dynamicCompile/202412473 。已在官网播放标准动作；官网视频含宣传画面，不作为主页播放器嵌入。
- 官方皮肤公告：https://www.taptap.cn/moment/620354980443851942 。医疗升变状态的「寰宇独奏」。
- 动画模型来源：社区 isHarryh/Ark-Models，目录 https://github.com/isHarryh/Ark-Models/tree/main/models_illust/dyn_illust_1037_amiya3_sale%2313 。原始 .skel、纹理 .png 保持内容不变；本地分别命名 amiya.skel、amiya.png，atlas 仅改为对应的本地纹理文件名。
- 解析确认：Spine 3.8.99，543 个骨骼；Idle 约 5.33 秒、Interact 18 秒、Special 约 11.67 秒。本主页使用前两种动作。模型源于社区归档，不能称为鹰角提供的网页组件。
- 1.0.3 默认恢复模型完整背景与道具插槽，包括花枝、琴盒、漂浮物与灯光平面；背景和角色共同播放原 Idle / Interact 骨骼与形变时间线。关闭「皮肤背景与动效」时，仅显示 C_ 与 Violin_ 插槽，并排除原场景中游离的 C_Light_B / C_Light_C 灯光平面。主界面站位、透明合成、环境投影、固定镜头和暂停规则由本项目实现；扩大画布显示场景时不改变角色位置和比例，天文台仍为底层背景。未加入整张图片摇摆来代替骨骼动画。
- 1.0.5 补齐独立 Unity 背景：1.0.3 的“完整”仅指 Spine 文件内部，未包含另一套星盘、飞鸟与粒子资源。现从官方公开资源包 `arts/dynchars/char_1037_amiya3_sale#13.ab` 提取原始纹理、网格、节点变换和 Idle / Interact 动画曲线；本地为 `amiya/scene/`，导出脚本为 `scripts/export-amiya-scene.py`。资源 URL：https://ak.hycdn.cn/assetbundle/official/Android/assets/25-03-27-16-19-10-4d4819/arts_dynchars_char_1037_amiya3_sale__13.dat ，索引参考：https://github.com/ArknightsAssets/NewAssets/blob/main/hot_update_list-cn.json 。没有把官方演示视频下载或嵌入页面。
- 独立背景使用 36 张解码纹理、7 组网格（含 Unity 标准四边形）、76 个渲染节点、10 份 Idle / Interact 动画曲线。按原 Spine 资源 0.01 的缩放与人物对齐；保留原始贴图与几何细节。浏览器使用轻量 WebGL 适配器重建 UV 扰动、溶解、粒子发射、寿命和旋转；未实现 Unity 的屏幕空间折射、全部材质属性动画及全部粒子模块，部分外部共用噪声/发光贴图采用程序化近似，因此不宣称与游戏逐帧一致。背景与角色共用暂停与绘制时钟。
- 1.0.2 修正透明合成：原纹理为预乘 alpha，纹理上传不再额外预乘，Spine 渲染器和 WebGL 画布均按 PMA 混合；取消夜间对立绘的 brightness(.91) / saturate(.87)，保留原贴图亮度与颜色。原 PNG、atlas 和骨骼文件未修改。参考：[Spine 透明混合](https://esotericsoftware.com/spine-unity-rendering#Transparency-and-Draw-Order)、[贴图与渲染混合格式匹配](https://en.esotericsoftware.com/forum/d/4111-texture-packing-settings)。
- 静态后备图来源页面：https://wiki.biligame.com/arknights/阿米娅（医疗） 。资源 https://patchwiki.biligame.com/images/arknights/4/4e/0vazg4x6vip7t73dolcbuqtq2ffr5z1.png ，2344 × 2344，保存为 amiya/portrait.png；仅在动态不可用时加载。
- 渲染库：EsotericSoftware/spine-runtimes 的 3.8 分支官方构建 https://github.com/EsotericSoftware/spine-runtimes/tree/3.8/spine-ts/build ，保存为 vendor/spine-webgl.js；保留原始运行库许可 vendor/SPINE-LICENSE.txt。运行库遵循 Spine Runtimes License Agreement，不是 MIT 许可；其使用与再分发条件以附带许可为准。
- 游戏角色、美术、骨骼动画版权归鹰角网络及相关权利人，本项目仅作用户指定的本地主页展示，不主张角色与动画原创，不代表取得商业再分发授权。
