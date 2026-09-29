# 孤星 · 浏览器主页

明日方舟「孤星」风格的浏览器主页，支持 Chrome 新标签页扩展、昼夜主题和阿米娅动态立绘。

## 使用

需安装 Node.js，无需安装 npm 依赖。

```sh
# 构建 Chrome 扩展
npm run build:extension

# 或启动本地预览
npm start
```

在 `chrome://extensions` 开启开发者模式，加载 `build/chrome-extension`；本地预览访问 `http://127.0.0.1:4173/`。详细步骤见 [扩展安装说明](EXTENSION.md)。

也可直接打开 `dist/index.html`，此时立绘使用静态图片。

## 功能

- 多引擎搜索、网址直达与搜索记录。
- 网站收藏、分类及快捷入口。
- 时钟、天气、专注计时、待办和便签。
- 自动昼夜切换、动态立绘与互动效果。
- 显示与动效设置、桌面和手机适配。
- 本地保存，支持 JSON 备份与恢复。

个人数据保存在当前浏览器，不自动跨设备同步。搜索和天气需要联网，天气由 [Open-Meteo](https://open-meteo.com/) 提供，不申请定位权限。

## 文件

- `dist/`：主页代码、样式和动效。
- `dist/assets/`：背景、立绘与场景素材。
- `dist/vendor/`：Spine 运行库及许可。
- `extension/`：Chrome 扩展配置和图标。
- `scripts/`：构建、检查与资源导出脚本。
- `server.mjs`：本地预览服务。

## 检查与素材

```sh
npm run check
npm run build:extension
npm run check:extension
```

[发布检查](SECURITY_REVIEW.md) · [素材来源](dist/assets/SOURCES.md) · [Spine 许可](dist/vendor/SPINE-LICENSE.txt)

游戏素材版权归鹰角网络及相关权利人，Spine 运行库遵循其附带许可。
