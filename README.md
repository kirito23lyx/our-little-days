# 晶晶 × 以轩 · 我们的小小日子

一个纯静态的私人小站，不用装任何东西，双击 `打开网站.cmd`（或直接双击 `index.html`）就能看。

## 里面有什么

| 板块 | 内容 |
| --- | --- |
| 开场首页 | 两个人的名字、一张合照、「我们已经在一起 N 天」（每天自动加） |
| 回忆时间线 | 相识 → 第一次见面 → 每一次见面的日期，每个节点配照片和一句话 |
| 专属相册 | 34 张照片，按「约会 / 旅行 / 日常」分组，点开可放大、左右翻页 |
| 纪念日 | 恋爱纪念日、两个生日（晶晶是农历八月初一，已换算好）、相识日、第一次见面，外加下一个重要日子的倒计时 |
| 互动小游戏 | 九宫格拼图（用你们的合照）+「你还记得吗」六题小问答 |

右上角的「胶片 / 奶油」开关可以随时切换两套风格，选择会被记住（刷新也不变）。
也可以直接用链接带风格打开：`index.html?theme=film` 或 `index.html?theme=cream`。

## 想改文字

全部文字都在 `assets/js/data.js` 里，用记事本打开就能改：

- `window.SITE` —— 名字、在一起的日子、相识日、第一次见面
- `window.TIMELINE` —— 时间线每个节点的日期、标签、标题、句子、配图编号
- `window.DATES` —— 纪念日（农历生日那张表已经算到 2045 年）
- `window.QUIZ` —— 问答题目，`answer` 是正确选项的序号（从 0 开始数）

改完存盘，刷新网页即可。

## 想换照片

1. 把新照片放进 `HJJ/日期/` 目录（和现在一样，目录名就是见面日期）
2. 打开 `tools/build_assets.py`，在 `CURATED` 列表里加一行：`(照片序号, 分组, "日期", "一句话")`
   - 序号来自同目录的 `photo-index.json`（`python tools/build_assets.py` 会顺带读它）
   - 分组只能填 `date` / `travel` / `daily`
3. 运行（需要 Pillow）：
   ```bat
   python tools/build_assets.py
   ```
   它会重新压缩出 webp 并更新 `assets/js/photos.js`，原来的照片不会被改动。

`HERO_IDX` 是首页大图的序号，`PUZZLE_IDX` 是拼图用的照片。

## 目录结构

```
our-little-days/
├─ index.html            页面骨架
├─ assets/
│  ├─ css/style.css      两套皮肤的全部样式
│  ├─ js/data.js         ← 所有文字都在这
│  ├─ js/photos.js       照片清单（脚本生成）
│  ├─ js/app.js          交互逻辑
│  └─ img/               压缩后的照片（webp）
├─ tools/
│  ├─ build_assets.py    照片压缩 + 生成 photos.js
│  ├─ shoot.cjs          截图自查（开发用，可以删）
│  └─ test.cjs           交互自测（开发用，可以删）
└─ 打开网站.cmd
```

## 线上地址（已发布）

**https://kirito23lyx.github.io/our-little-days/**

- 已用 GitHub Pages 发布，**公开可见**，手机微信里点开就能看，不用登录。
- 仓库：<https://github.com/kirito23lyx/our-little-days>
- 想带风格直接分享：在链接后面加 `?theme=film`（胶片）或 `?theme=cream`（奶油）。

### 以后改了内容怎么更新

在这个文件夹里执行：

```bat
git add -A
git commit -m "update"
git push
```

推上去大约 1 分钟后线上自动更新（GitHub Pages 会重新构建）。

### 关于隐私

GitHub Pages 的免费方案要求仓库是公开的，所以照片和源码都在公开仓库里，
拿到链接的人都能看，搜索引擎理论上也可能收录。如果哪天想收紧：

- 换成 Netlify / Cloudflare Pages（可以配合私密仓库 + 访问密码）；或
- 把仓库删掉、把链接撤下（但已经被人保存的图片收不回来）。

需要「输口令才能进」的页面，可以再加。
