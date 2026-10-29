# -*- coding: utf-8 -*-
"""
生成网站用的图片资源（webp），并输出 assets/js/photos.js
只读取 HJJ 下的原始照片，不改动其它目录，也不动 our-story。
"""
import os
import json
from PIL import Image, ImageOps

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(BASE)                      # E:\Desktop\study\网站
IMG_DIR = os.path.join(BASE, "assets", "img")
JS_DIR = os.path.join(BASE, "assets", "js")
os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(JS_DIR, exist_ok=True)

index = json.load(open(os.path.join(ROOT, "photo-index.json"), encoding="utf-8"))

# (原始序号, 分组 date/travel/daily, 日期, 一句话)
CURATED = [
    (0,  "date",   "2026.10.01", "一起走过的那条长廊"),
    (2,  "date",   "2026.10.01", ""),
    (4,  "date",   "2026.10.01", ""),
    (6,  "date",   "2026.10.01", ""),
    (8,  "date",   "2026.10.01", "那天光线刚刚好"),
    (10, "date",   "2026.10.01", ""),
    (11, "date",   "2026.10.01", "这张你最好看"),
    (12, "date",   "2026.10.01", ""),
    (13, "date",   "2026.10.01", ""),
    (14, "date",   "2026.10.11", "第一次拍大头贴，四格都是我们"),
    (40, "date",   "2026.09.13", "9.13 的那面绿墙"),
    (41, "date",   "2026.09.13", ""),
    (29, "date",   "2026.10.25", "猫咖门口的自拍"),
    (30, "date",   "2026.10.25", ""),
    (31, "date",   "2026.10.25", "它在你怀里睡着了"),
    (32, "date",   "2026.10.25", ""),
    (33, "date",   "2026.10.25", "三只猫，两个人"),
    (34, "date",   "2026.10.25", "这只特别黏你"),
    (36, "date",   "2026.10.25", ""),
    (38, "date",   "2026.10.25", "猫主子的正面"),
    (20, "travel", "2026.10.17", "山脚下的那栋楼"),
    (21, "travel", "2026.10.17", ""),
    (25, "travel", "2026.10.02", "夜里走的那条路"),
    (42, "travel", "2026.09.19", "路边的合影"),
    (16, "daily",  "2026.10.17", "10.17 的晚上"),
    (17, "daily",  "2026.10.17", ""),
    (18, "daily",  "2026.10.17", ""),
    (19, "daily",  "2026.10.17", "便利店里的你"),
    (26, "daily",  "2026.10.02", "牵手"),
    (27, "daily",  "2026.10.20", "你点的那杯，我记住了"),
    (28, "daily",  "2026.10.20", ""),
    (44, "daily",  "她的照片",   "我的视角"),
    (45, "daily",  "她的照片",   "抬头的一瞬间"),
    (46, "daily",  "她的照片",   ""),
]

HERO_IDX = 20
PUZZLE_IDX = 40


def save_webp(im, path, quality):
    im.save(path, "WEBP", quality=quality, method=6)


def fit(im, max_side):
    w, h = im.size
    s = min(1.0, max_side / float(max(w, h)))
    if s >= 1.0:
        return im
    return im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)


def load(i):
    p = os.path.join(ROOT, index[i])
    im = Image.open(p)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")
    else:
        im = im.convert("RGB")
    return im


photos = []
for i, group, date, caption in CURATED:
    im = load(i)
    w, h = im.size

    big = fit(im, 1500)
    save_webp(big, os.path.join(IMG_DIR, "p%d.webp" % i), 82)

    thumb = fit(im, 700)
    save_webp(thumb, os.path.join(IMG_DIR, "t%d.webp" % i), 74)

    photos.append({
        "id": i,
        "group": group,
        "date": date,
        "caption": caption,
        "w": w,
        "h": h,
        "src": "assets/img/p%d.webp" % i,
        "thumb": "assets/img/t%d.webp" % i,
    })
    print("ok", i, im.size)

# 首页大图
hero = load(HERO_IDX)
save_webp(fit(hero, 1900), os.path.join(IMG_DIR, "hero.webp"), 84)

# 拼图用的方图
sq = load(PUZZLE_IDX)
w, h = sq.size
side = min(w, h)
sq = sq.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
save_webp(fit(sq, 960), os.path.join(IMG_DIR, "puzzle.webp"), 84)

# 时间线 / 纪念日里的小图（统一 4:3）
cover = load(HERO_IDX)
save_webp(fit(cover, 1100), os.path.join(IMG_DIR, "hero_sm.webp"), 78)


# ---- 相册排序：先放几张打头的好照片，其余按日期轮播，避免同一天的连在一起 ----
LEAD = [20, 14, 40, 26, 27, 44]
by_id = {p["id"]: p for p in photos}
order = []
for i in LEAD:
    if i in by_id and i not in order:
        order.append(i)

buckets = {}
for p in photos:
    if p["id"] in order:
        continue
    buckets.setdefault(p["date"], []).append(p["id"])

# 日期桶按第一次出现的顺序排
keys = []
for p in photos:
    if p["date"] not in keys:
        keys.append(p["date"])

rest = []
while any(buckets.get(k) for k in keys):
    for k in keys:
        if buckets.get(k):
            rest.append(buckets[k].pop(0))

photos = [by_id[i] for i in order] + [by_id[i] for i in rest]

js = "/* 由 tools/build_assets.py 自动生成，改动请改脚本后重新运行 */\n"
js += "window.PHOTOS = " + json.dumps(photos, ensure_ascii=False, indent=2) + ";\n"
open(os.path.join(JS_DIR, "photos.js"), "w", encoding="utf-8").write(js)

total = sum(os.path.getsize(os.path.join(IMG_DIR, f)) for f in os.listdir(IMG_DIR))
print("photos:", len(photos), "assets:", len(os.listdir(IMG_DIR)), "size MB:", round(total / 1048576, 2))
