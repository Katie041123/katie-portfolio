# 何静瑶 Katie · 作品集

网站文件都在 `site/`，纯静态页面，没有构建步骤。推送到 `main` 分支后，GitHub Actions 会自动发布到 GitHub Pages（仓库 Settings → Pages 里选 GitHub Actions）。

## 本地预览

```bash
python -m http.server 8765 --directory site
```

然后打开 http://127.0.0.1:8765 。

## 文件结构

| 路径 | 内容 |
|---|---|
| `site/index.html` | 页面骨架：开场、首屏、关于、实习旅程、作品、扭蛋机、影像、技能、联系 |
| `site/content.js` | **所有文字内容**：经历、作品、技能、扭蛋里的小事、小人台词等，改内容基本只需要改这里 |
| `site/media.js` | 自动生成，不要手改：长图切片和大图压缩版的对照表 |
| `site/css/style.css` | 全部样式 |
| `site/js/app.js` | 页面渲染、作品筛选、作品详情弹窗（翻页图集）、链接跳转 |
| `site/js/gacha.js` | 「彩蛋 & 扭蛋机」 |
| `site/js/fx.js` | 开场动画、首屏卡片、小人互动、时间线上走路的小 Katie |
| `site/assets/img/` | 自动生成的网页用图（WebP） |
| `design/source/` | 原始素材（小人 PNG、字体），不会发布到网站 |
| `tools/build_assets.py` | 素材生成脚本 |

## 改了内容之后

图片或文字有改动时，在仓库根目录运行：

```bash
python tools/build_assets.py
```

它会重新生成网页用图、长图切片，以及只包含站内用字的手写字体。
**改了 `content.js` 或页面里的中文之后一定要跑一次**，不然新加的字可能显示成默认字体。

需要的 Python 包：Pillow、fontTools、brotli、PyMuPDF。

## 好用的链接

- 直接打开某个作品：`…/katie-portfolio/#work/作品id`，比如 `#work/light`
- 打开某一类作品：`…/katie-portfolio/#works/内容运营`
