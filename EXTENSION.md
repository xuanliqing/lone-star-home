# 孤星 · Chrome 新标签页扩展

这是可离线加载界面与动态立绘的 Manifest V3 扩展。保持当前界面、阿米娅位置和 120% 大小；无需 Node.js、预览服务或开机后台程序。

1.0.3 默认显示「寰宇独奏」自带的背景与场景动效。点击阿米娅下方「背景」或设置中的「皮肤背景与动效」可以切换独立立绘，选择会保存在本机。更新已安装扩展后，在 `chrome://extensions` 点击刷新，再打开新标签页即可看到新版。

1.0.5 进一步补齐独立于人物模型的星盘、飞鸟、金色刻度和星光动画。所有新增素材均在扩展内，无需联网加载模型。

## 从源码构建与安装

先在项目目录执行 `npm run build:extension`。构建结果位于 `build/chrome-extension/`。

1. 在 Chrome 地址栏输入 `chrome://extensions`。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择 **`build/chrome-extension`**。
4. 新建标签页（Ctrl+T）即可进入孤星主页。如果 Chrome 提示新标签页发生变化，选择保留此扩展。

构建完成后选择包含 `manifest.json` 的 `build/chrome-extension` 目录。安装后请保留该目录。

## Chrome 启动页和主页按钮

扩展接管新标签页。要在每次启动 Chrome 时显示它，在 `chrome://settings/onStartup` 选择「打开新标签页」。若要工具栏的主页按钮也进入这里，在 `chrome://settings/appearance` 开启「显示主页按钮」并选择「打开新标签页」。

扩展不会自动覆盖你原来的启动设置。若之前设成了 `127.0.0.1:4173`，请改为上面的新标签页选项，便不再依赖本地服务。

## 迁移原主页数据

原网页与扩展各自保存数据。原主页「个性设置 → 导出备份」，再在扩展主页「个性设置 → 导入备份」选择该 JSON 并确认。收藏、便签、待办、天气城市和偏好均可迁移。

同一扩展的多个新标签页共用本机存储。更新时在 `chrome://extensions` 点击该扩展的刷新按钮，不要先卸载；卸载前先导出备份。安装包内不含个人便签或浏览记录。

## 资源与权限

- 背景、图标、代码与 Spine 立绘资源在包内；动态立绘直接读取扩展资源。
- 仅声明两个天气接口域名的联网权限：`api.open-meteo.com`、`geocoding-api.open-meteo.com`。
- 不读取 Chrome 浏览历史、原生书签或其他网页；页面的「搜索记录」只记录在此主页提交的搜索，「网站收藏」是主页自己的收藏列表。
- 搜索和外链由浏览器正常打开。无内容脚本，无后台常驻服务，无远程脚本。
- 来源与署名见 `assets/SOURCES.md`，Spine 运行库许可见 `vendor/SPINE-LICENSE.txt`。

## 从源项目更新安装目录

在项目根目录执行 `npm run build:extension`，再执行 `npm run check:extension`。构建复制当前 `dist` 和扩展配置到项目内的 `build/chrome-extension` 目录。公开身份 key 保持不变，便于更新后继续使用相同的本地数据。

Chrome 官方参考：[新标签页替换](https://developer.chrome.com/docs/extensions/develop/ui/override-chrome-pages)、[加载已解压的扩展](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)、[扩展 CSP](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)。
