# Inter Futbol: rasm topilmagan yangilik uchun mavzuga mos kartochka (1280x720)
# Natija bo'lsa: shisha uslubi (jamoa ranglari, ikki panel, klub nomi ostida klub rangidagi chiziq)
import glob, hashlib, io, json, os, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BOT = os.environ.get("BOT_TOKEN", "")
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
GREEN = (91, 182, 55)
WHITE = (245, 247, 250)
FONT_DIRS = [os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts"), os.environ.get("FONT_DIR", "")]
NAME_FONT = ("oswald-latin-700-normal.woff", 40, 46)



def font(weight, size):
    pats = {"black": ["*Inter*Black*", "*Inter*ExtraBold*", "*DejaVuSans-Bold*"], "bold": ["*Inter*Bold*", "*DejaVuSans-Bold*"], "med": ["*Inter*Medium*", "*Inter*Regular*", "*DejaVuSans.ttf"]}[weight]
    for p in pats:
        fs = [f for f in glob.glob("/usr/share/fonts/**/" + p, recursive=True) if "Italic" not in f and "Display" not in f and "Condensed" not in f]
        if fs:
            return ImageFont.truetype(sorted(fs, key=len)[0], size)
    return ImageFont.load_default()


def logo(size, bg=True):
    K = 4
    S = 220 * K
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=36 * K, fill=(20, 22, 30, 230))
    x0, y0, x1, y1 = 175, 103, 1065, 1044
    pad = (34 if bg else 6) * K
    sc = min((S - 2 * pad) / (x1 - x0), (S - 2 * pad) / (y1 - y0))
    ox = (S - (x1 - x0) * sc) / 2 - x0 * sc
    oy = (S - (y1 - y0) * sc) / 2 - y0 * sc
    P = lambda pts: [(ox + x * sc, oy + y * sc) for x, y in pts]
    d.polygon(P([(175, 103), (366, 103), (366, 251), (175, 251)]), fill="#FFFFFF")
    d.polygon(P([(175, 305), (366, 305), (366, 1044), (175, 1044)]), fill="#FFFFFF")
    d.polygon(P([(428, 305), (1065, 305), (954, 456), (428, 456)]), fill="#5BB637")
    d.polygon(P([(428, 528), (894, 528), (783, 679), (578, 679), (578, 874), (428, 1044)]), fill="#5BB637")
    return img.resize((size, size), Image.LANCZOS)


def background(Wd, Hd):
    bg = Image.new("RGB", (Wd, Hd))
    px = bg.load()
    for y in range(Hd):
        for x in range(0, Wd):
            t = x / Wd * 0.6 + y / Hd * 0.4
            px[x, y] = (int(10 + 6 * t), int(16 + 26 * t), int(28 - 6 * t))
    d = ImageDraw.Draw(bg, "RGBA")
    # maydon chiziqlari (nozik)
    lc = (255, 255, 255, 18)
    d.line([Wd // 2, 0, Wd // 2, Hd], fill=lc, width=3)
    d.ellipse([Wd // 2 - 150, Hd // 2 - 150, Wd // 2 + 150, Hd // 2 + 150], outline=lc, width=3)
    d.rectangle([-5, Hd // 2 - 200, 170, Hd // 2 + 200], outline=lc, width=3)
    d.rectangle([Wd - 170, Hd // 2 - 200, Wd + 5, Hd // 2 + 200], outline=lc, width=3)
    # yashil urg'u chizig'i
    d.rectangle([0, Hd - 10, Wd, Hd], fill=GREEN + (255,))
    return bg


def fit(d, text, weight, maxw, start, minsize=28):
    s = start
    while s > minsize:
        f = font(weight, s)
        if d.textlength(text, font=f) <= maxw:
            return f
        s -= 4
    return font(weight, minsize)


def wrap(d, text, f, maxw):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def get_logo(url, size):
    if not url:
        return None
    try:
        # 3 marta urinish: logotip yuklanmay qolsa kartochka xunuk chiqmasin
        for k in range(3):
            try:
                req = urllib.request.Request(url, headers={"user-agent": "InterFutbolCard"})
                with urllib.request.urlopen(req, timeout=30) as r:
                    im = Image.open(io.BytesIO(r.read())).convert("RGBA")
                break
            except Exception:
                if k == 2:
                    raise
        bb = im.getbbox()
        if bb:
            im = im.crop(bb)
        im.thumbnail((size, size), Image.LANCZOS)
        return im
    except Exception as e:
        print("logo", e)
        return None


def paste_glow(im, lg, x, y, strength=110, radius=18):
    # to'q fonda ham aniq ko'rinishi uchun logotip ortida yumshoq oq yorug'lik
    pad = radius * 2
    mask = Image.new("L", (lg.width + pad * 2, lg.height + pad * 2), 0)
    mask.paste(lg.split()[3], (pad, pad))
    mask = mask.filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, v * strength // 255))
    glow = Image.new("RGBA", mask.size, (255, 255, 255, 0))
    glow.putalpha(mask)
    im.paste(glow, (x - pad, y - pad), glow)
    im.paste(lg, (x, y), lg)


def is_dark(lg):
    sm = lg.copy()
    sm.thumbnail((48, 48))
    px = [(r, g, b) for r, g, b, a in sm.getdata() if a > 200]
    if not px:
        return False
    return sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px) / len(px) < 75


def paste_league(im, lg, x, y, strength=120, radius=12):
    # to'q rangli liga logotipi (masalan Premier League) to'q fonda yo'qolmasligi uchun oq doira ustiga qo'yiladi
    if is_dark(lg):
        d = ImageDraw.Draw(im, "RGBA")
        cx, cy = x + lg.width / 2, y + lg.height / 2
        r = max(lg.width, lg.height) / 2 + 12
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 247, 250, 255))
        im.paste(lg, (x, y), lg)
    else:
        paste_glow(im, lg, x, y, strength, radius)


def main_color(lg):
    # logotipning asosiy (eng to'yingan, ko'p uchraydigan) rangi
    sm = lg.copy()
    sm.thumbnail((64, 64))
    best, score = (40, 60, 120), -1
    cnt = {}
    for r, g, b, a in sm.getdata():
        if a < 200:
            continue
        mx, mn = max(r, g, b), min(r, g, b)
        if mx < 40 or (mx - mn) < 40:
            continue
        k = (r // 32, g // 32, b // 32)
        cnt[k] = cnt.get(k, 0) + 1 + (mx - mn) / 255
    if cnt:
        k = max(cnt, key=cnt.get)
        best = (k[0] * 32 + 16, k[1] * 32 + 16, k[2] * 32 + 16)
    return best


def shade_v(im, top=90, bottom=200):
    Wd, Hd = im.size
    sh = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for y in range(Hd):
        sd.line([0, y, Wd, y], fill=(5, 8, 14, int(top + (bottom - top) * y / Hd)))
    im.paste(sh, (0, 0), sh)


def glass_bg(c1, c2, Wd=1280, Hd=720):
    im = Image.new("RGB", (Wd, Hd), c1)
    ImageDraw.Draw(im).rectangle([Wd // 2, 0, Wd, Hd], fill=c2)
    im = im.filter(ImageFilter.GaussianBlur(60))
    shade_v(im, 80, 170)
    return im


def glass(im, box, alpha=26, line=60, r=36, white=False):
    p = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(p).rounded_rectangle(box, radius=r, fill=(255, 255, 255, alpha), outline=(255, 255, 255, line), width=2)
    if white:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([box[0], box[1] + 10, box[2], box[3] + 14], radius=r, fill=(0, 0, 0, 90))
        sh = sh.filter(ImageFilter.GaussianBlur(14))
        im.paste(sh, (0, 0), sh)
    im.paste(p, (0, 0), p)


def league_top(im, j, size=150, y=86):
    # liga logotipi fonsiz (league_mark qoidasi bo'yicha)
    paste_league_free(im, j, size, im.width // 2, y)


def xfont(name, size, text=""):
    # qo'shimcha shriftlar (Oswald, Cinzel, Bebas Neue); lotin-1 dan tashqari harf bo'lsa Inter ishlatiladi
    if any(ord(ch) > 0xFF for ch in text):
        return font("black", size)
    for dr in FONT_DIRS:
        if dr:
            fs = glob.glob(os.path.join(dr, "**", name), recursive=True)
            if fs:
                return ImageFont.truetype(fs[0], size)
    return font("black", size)


def wrap_spaced(d, text, f, maxw, sp=0):
    # so'zlarni qatorlarga bo'lish (shrift o'lchami o'zgarmaydi)
    W_ = lambda t: sum(d.textlength(ch, font=f) for ch in t) + sp * max(0, len(t) - 1)
    lines, cur = [], ""
    for w in text.replace("-", "- ").split():
        t = (cur + (" " if cur and not cur.endswith("-") else "") + w) if cur else w
        if W_(t) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:3], W_


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def club_name(im, cx, top, name, col, box):
    # klub nomi: hamma klublarda bir xil o'lchamdagi shrift, uzun bo'lsa 2-3 qatorga bo'linadi; ostida klub rangidagi chiziq
    d = ImageDraw.Draw(im, "RGBA")
    t = name.upper()
    fname, size, lh = NAME_FONT
    f = xfont(fname, size, t)
    x0, y0, x1, y1 = box
    lines, W_ = wrap_spaced(d, t, f, (x1 - x0) - 90)
    n = len(lines)
    ys = top + 50 - (n - 1) * lh / 2
    for i, ln in enumerate(lines):
        d.text((cx, ys + i * lh), ln, font=f, fill=WHITE, anchor="mm")
    yb = ys + (n - 1) * lh + lh / 2 + 6
    d.rounded_rectangle([cx - 46, yb, cx + 46, yb + 7], radius=4, fill=col + (255,))


def render_card_plain(j):
    # gol bo'lmasa (0:0) — oddiy shisha kartochka; ikki alohida panel, katta liga logotipi, klub nomlari klub rangida
    Wd, Hd = 1280, 720
    hl, al = get_logo(j.get("homeLogo"), 180), get_logo(j.get("awayLogo"), 180)
    c1 = main_color(hl) if hl else (30, 60, 140)
    c2 = main_color(al) if al else (140, 30, 40)
    im = glass_bg(c1, c2)
    boxes = ([60, 170, 470, 600], [Wd - 470, 170, Wd - 60, 600])
    for bx in boxes:
        glass(im, bx)
    league_top(im, j, 200, 118)
    a, b = j["score"].split(":")
    for bx, lg_, name, col in ((boxes[0], hl, j["home"], c1), (boxes[1], al, j["away"], c2)):
        cx = (bx[0] + bx[2]) // 2
        if lg_:
            x_, y_ = cx - lg_.width // 2, 320 - lg_.height // 2
            if is_dark(lg_):
                paste_glow(im, lg_, x_, y_, 255, 8)
                paste_glow(im, lg_, x_, y_, 210, 22)
            else:
                paste_glow(im, lg_, x_, y_, 110, 20)
        club_name(im, cx, 440, name, col, bx)
    d = ImageDraw.Draw(im, "RGBA")
    d.text((Wd // 2, 375), f"{a} - {b}", font=font("black", 120), fill=WHITE, anchor="mm")
    d.text((Wd // 2, 478), "\u00d6YIN YAKUNLANDI", font=font("bold", 22), fill=(230, 235, 240), anchor="mm")
    lg = logo(74, False)
    im.paste(lg, (Wd // 2 - 37, 626), lg)
    return im


def ball(d, cx, cy, r):
    # gol belgisi: oq to'p, o'rtasida to'q beshburchak
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE + (255,))
    d.regular_polygon((cx, cy, r * 0.42), 5, rotation=0, fill=(20, 24, 32, 255))


def redcard(d, cx, cy):
    # qizil kartochka belgisi
    d.rounded_rectangle([cx - 7, cy - 10, cx + 7, cy + 10], radius=2, fill=(226, 48, 48, 255))


YEL = (245, 200, 40)


def ycard(d, cx, cy, k=1.0):
    # sariq kartochka belgisi
    d.rounded_rectangle([cx - 7 * k, cy - 10 * k, cx + 7 * k, cy + 10 * k], radius=2, fill=YEL + (255,))


def short_name(n):
    # sariq kartochkalar qatorida faqat familiya ("El Aynaoui", "De Paul" kabi qo'shimchalar bilan)
    w = (n or "").split()
    if len(w) >= 3 and w[-2].lower() in ("el", "de", "van", "von", "da", "di", "del", "dos", "le", "ten", "ter", "al"):
        return " ".join(w[-2:])
    return w[-1] if w else ""


def yellow_lines(d, items, fy, maxw):
    # [(nom, daqiqa, bizning futbolchimi)] -> qatorlar; bizning futbolchi doim alohida qatorda, to'liq ism bilan
    lines, cur = [], []
    for n, m, uz in items:
        it = (n if uz else short_name(n), m, uz)
        if uz:
            if cur:
                lines.append(cur)
                cur = []
            lines.append([it])
            continue
        test = cur + [it]
        if cur and d.textlength(",  ".join(a + " " + b for a, b, _ in test), font=fy) > maxw:
            lines.append(cur)
            cur = [it]
        else:
            cur = test
    if cur:
        lines.append(cur)
    return lines


def render_card(j):
    # 1-variant (2026-yil 5-noyabr): ikki shisha panel; har panelda logotip, klub nomi, shu klub gollari (ism oq, daqiqa yashil) va qizil kartochkalari
    # qatorlar: gollar ("g") va qizil kartochkalar ("r")
    hrows = [("g", n, ms) for n, ms in (j.get("hg") or [])] + [("r", n, [m]) for n, m in (j.get("hr") or [])]
    arows = [("g", n, ms) for n, ms in (j.get("ag") or [])] + [("r", n, [m]) for n, m in (j.get("ar") or [])]
    # sariq kartochkalar (Bahtiyor aka tanlovi yB1, 2026-11-08): gollar ostida chiziq va ixcham qatorlar, bizning futbolchi yashil ramkada
    hy = [(x[0], x[1], bool(x[2]) if len(x) > 2 else False) for x in (j.get("hy") or [])]
    ay = [(x[0], x[1], bool(x[2]) if len(x) > 2 else False) for x in (j.get("ay") or [])]
    if not (hrows or arows or hy or ay):
        return render_card_plain(j)
    Wd, Hd = 1280, 720
    hl, al = get_logo(j.get("homeLogo"), 140), get_logo(j.get("awayLogo"), 140)
    c1 = main_color(hl) if hl else (30, 60, 140)
    c2 = main_color(al) if al else (140, 30, 40)
    im = glass_bg(c1, c2)
    yc = bool(hy or ay)
    boxes = ([50, 140, 500, 680], [Wd - 500, 140, Wd - 50, 680]) if yc else ([50, 150, 500, 650], [Wd - 500, 150, Wd - 50, 650])
    for bx in boxes:
        glass(im, bx)
    league_top(im, j, 120 if yc else 140, 70 if yc else 80)
    d = ImageDraw.Draw(im, "RGBA")
    lines = [n + " " + ", ".join(m) for _, n, m in hrows + arows]
    n = max(len(hrows), len(arows))
    fy = font("bold", 19)
    yl = {0: yellow_lines(d, hy, fy, 330), 1: yellow_lines(d, ay, fy, 330)}
    ly = max(len(yl[0]), len(yl[1]))
    s = 26 if n <= 3 else 23 if n <= 5 else 20
    if yc:
        s = min(24, s)
    f = font("bold", s)
    while s > 16 and any(d.textlength(t, font=f) + 30 > 450 - 70 for t in lines):
        s -= 1
        f = font("bold", s)
    lh = min(s + 14, 165 / max(n, 1))
    if yc:
        room = 660 - 445 - (34 + ly * 30 if ly else 0)
        lh = min(s + 10, room / max(n, 1)) if n else 0
        while n and s > 16 and s + 6 > lh:
            s -= 1
            f = font("bold", s)
    gy0, ly_ = (445, 220) if yc else (470, 250)
    for side, (bx, lg_, name, col, gs) in enumerate(((boxes[0], hl, j["home"], c1, hrows), (boxes[1], al, j["away"], c2, arows))):
        cx = (bx[0] + bx[2]) // 2
        if lg_:
            x_, y_ = cx - lg_.width // 2, ly_ - lg_.height // 2
            if is_dark(lg_):
                paste_glow(im, lg_, x_, y_, 255, 8)
                paste_glow(im, lg_, x_, y_, 210, 22)
            else:
                paste_glow(im, lg_, x_, y_, 110, 20)
        club_name(im, cx, 290 if yc else 320, name, col, bx)
        d = ImageDraw.Draw(im, "RGBA")
        for i, (kind, p, ms) in enumerate(gs):
            y = gy0 + i * lh
            t1, t2 = p + " ", ", ".join(ms)
            w = d.textlength(t1 + t2, font=f) + 30
            x = cx - w / 2
            if kind == "r":
                redcard(d, x + 9, y)
            else:
                ball(d, x + 9, y, 9)
            d.text((x + 30, y), t1, font=f, fill=WHITE, anchor="lm")
            d.text((x + 30 + d.textlength(t1, font=f), y), t2, font=f, fill=GREEN if kind == "g" else (235, 120, 120), anchor="lm")
        if yl[side]:
            y = gy0 + len(gs) * lh - (lh / 2 if gs else 0) + (14 if gs else 0)
            if gs:
                d.line([bx[0] + 50, y, bx[2] - 50, y], fill=(255, 255, 255, 60), width=2)
                y += 24
            for ln in yl[side]:
                txt = ",  ".join(a_ + " " + b_ for a_, b_, _ in ln)
                w = d.textlength(txt, font=fy) + 26
                x = cx - w / 2
                ycard(d, x + 7, y, 0.8)
                xx = x + 26
                for k, (a_, b_, uz) in enumerate(ln):
                    if uz:
                        d.rounded_rectangle([xx - 6, y - 15, xx + d.textlength(a_ + " " + b_, font=fy) + 6, y + 15], radius=9, fill=GREEN + (70,), outline=GREEN + (230,), width=2)
                    d.text((xx, y), a_ + " ", font=fy, fill=WHITE, anchor="lm")
                    xx += d.textlength(a_ + " ", font=fy)
                    d.text((xx, y), b_, font=fy, fill=YEL, anchor="lm")
                    xx += d.textlength(b_, font=fy)
                    if k < len(ln) - 1:
                        d.text((xx, y), ",  ", font=fy, fill=WHITE, anchor="lm")
                        xx += d.textlength(",  ", font=fy)
                y += 30
    a, b = j["score"].split(":")
    d.text((Wd // 2, 330), f"{a} - {b}", font=font("black", 120), fill=WHITE, anchor="mm")
    d.text((Wd // 2, 430), "ÖYIN YAKUNLANDI", font=font("bold", 22), fill=(230, 235, 240), anchor="mm")
    lg = logo(64, False)
    im.paste(lg, (Wd // 2 - 32, 610 if yc else 600), lg)
    return im



def lineup_order(L):
    # tartib: darvozabon, himoyachilar, yarim himoyachilar, hujumchilar
    def g(p):
        p = (p or "").upper()
        if p.startswith("G"):
            return 0
        if "B" in p or p.startswith("CD") or p.startswith("D") and not p.startswith("DM"):
            return 1
        if "M" in p:
            return 2
        return 3
    def side(p):
        # o'ngdan chapga: RB, CD-R, CD, CD-L, LB (yarim himoya va hujumda ham shunday)
        p = (p or "").upper()
        if p.startswith("R"):
            return 0
        if p.endswith("-R"):
            return 1
        if p.endswith("-L"):
            return 3
        if p.startswith("L"):
            return 4
        return 2
    return sorted(L, key=lambda x: (g(x[2] if len(x) > 2 else ""), side(x[2] if len(x) > 2 else "")))


def render_lineup(j):
    # asosiy tarkiblar kartochkasi: ikki shisha panel (logotip, nom, sxema, 11 futbolchi), o'rtada liga, sana va vaqt
    Wd, Hd = 1280, 720
    hl, al = get_logo(j.get("homeLogo"), 96), get_logo(j.get("awayLogo"), 96)
    c1 = main_color(hl) if hl else (30, 60, 140)
    c2 = main_color(al) if al else (140, 30, 40)
    im = glass_bg(c1, c2)
    boxes = ([40, 40, 470, 680], [Wd - 470, 40, Wd - 40, 680])
    for bx in boxes:
        glass(im, bx)
    paste_league_free(im, j, 120, Wd // 2, 120)
    d = ImageDraw.Draw(im, "RGBA")
    d.text((Wd // 2, 236), "ASOSIY", font=font("black", 34), fill=WHITE, anchor="mm")
    d.text((Wd // 2, 276), "TARKIBLAR", font=font("black", 34), fill=WHITE, anchor="mm")
    d.rounded_rectangle([Wd // 2 - 40, 304, Wd // 2 + 40, 310], radius=3, fill=GREEN + (255,))
    if j.get("time"):
        d.text((Wd // 2, 372), j["time"], font=font("black", 64), fill=WHITE, anchor="mm")
        d.text((Wd // 2, 420), "Toşkent vaqti", font=font("bold", 20), fill=(220, 226, 232), anchor="mm")
    if j.get("date"):
        d.text((Wd // 2, 456), j["date"], font=font("bold", 20), fill=(220, 226, 232), anchor="mm")
    lg = logo(64, False)
    im.paste(lg, (Wd // 2 - 32, 596), lg)
    for bx, lg_, name, col, L, fm in ((boxes[0], hl, j["home"], c1, j.get("hl") or [], j.get("hf")), (boxes[1], al, j["away"], c2, j.get("al") or [], j.get("af"))):
        cx = (bx[0] + bx[2]) // 2
        if lg_:
            x_, y_ = cx - lg_.width // 2, 100 - lg_.height // 2
            if is_dark(lg_):
                paste_glow(im, lg_, x_, y_, 255, 8)
                paste_glow(im, lg_, x_, y_, 210, 18)
            else:
                paste_glow(im, lg_, x_, y_, 110, 16)
        d = ImageDraw.Draw(im, "RGBA")
        t = name.upper()
        f = xfont(NAME_FONT[0], 34, t)
        while d.textlength(t, font=f) > (bx[2] - bx[0]) - 60 and f.size > 22:
            f = xfont(NAME_FONT[0], f.size - 2, t)
        d.text((cx, 178), t, font=f, fill=WHITE, anchor="mm")
        if fm:
            d.text((cx, 214), fm, font=font("bold", 22), fill=GREEN, anchor="mm")
        d.line([bx[0] + 30, 240, bx[2] - 30, 240], fill=(255, 255, 255, 50), width=2)
        rows = lineup_order(L)[:11]
        fs = 23
        fn = font("bold", fs)
        fnum = font("black", fs)
        while fs > 16 and any(d.textlength(r[1], font=fn) > (bx[2] - bx[0]) - 120 for r in rows):
            fs -= 1
            fn, fnum = font("bold", fs), font("black", fs)
        lh = 38
        y0 = 268
        for i, r in enumerate(rows):
            y = y0 + i * lh
            d.text((bx[0] + 70, y), str(r[0] or ""), font=fnum, fill=GREEN, anchor="rm")
            d.text((bx[0] + 88, y), r[1], font=fn, fill=WHITE, anchor="lm")
    return im



def league_mark(ll, name=""):
    # liga logotipi FONSIZ: Premier League asl rangida (orqasida yengil nur bilan), boshqa to'q logotiplarning to'q qismlari oqqa aylanadi
    ll = ll.convert("RGBA")
    if "premier" in (name or "").lower():
        return ll, True
    if not is_dark(ll):
        return ll, False
    px = ll.load()
    for yy in range(ll.height):
        for xx in range(ll.width):
            r, g, b, a = px[xx, yy]
            if a:
                mx, mn = max(r, g, b) / 255, min(r, g, b) / 255
                if (mx + mn) / 2 < 0.33:
                    px[xx, yy] = (245, 247, 250, a)
    return ll, False


def paste_league_free(im, j, size, cx, cy):
    ll = get_logo(j.get("leagueLogo"), size)
    if not ll:
        return
    ll, glow_ = league_mark(ll, j.get("league") or "")
    x0, y0 = int(cx - ll.width / 2), int(cy - ll.height / 2)
    if glow_:
        paste_glow(im, ll, x0, y0, 230, 16)
    else:
        im.paste(ll, (x0, y0), ll)


def render_news(j):
    # YANGILIK KARTOCHKASI (Bahtiyor aka tasdiqlagan dizayn, 2026-11-08):
    # fonda yangilikda tilga olingan klublarning xira logotiplari (4 tagacha), chapda katta liga logotipi
    # (liga bo'lmasa - birinchi klub, u ham bo'lmasa - iF), o'ngda yashil chiziq va sarlavha, o'ng pastki burchakda kattaroq iF.
    Wd, Hd = 1280, 720
    NAVY = (10, 14, 22)
    im = Image.new("RGB", (Wd, Hd), NAVY)
    urls = [u for u in (j.get("clubLogos") or [j.get("homeLogo"), j.get("awayLogo")]) if u][:4]
    clubs = [c for c in (get_logo(u, 360) for u in urls) if c]
    lgl = get_logo(j.get("leagueLogo"), 240)
    if not lgl and len(clubs) > 1:
        clubs = clubs[1:]  # chapdagi katta logotip (birinchi klub) fonda takrorlanmasin
    def faint(lg, pct):
        f = lg.copy()
        f.putalpha(f.split()[3].point(lambda v: v * pct // 100))
        return f
    if clubs:
        n = len(clubs)
        step = 300 if n >= 4 else (1180 // n if n > 1 else 0)
        x0 = 60 if n >= 4 else (Wd - (step * (n - 1) + 360)) // 2 + 40
        for k, c in enumerate(clubs):
            f = faint(c, 22)
            im.paste(f, (x0 + k * step + (360 - c.width) // 2, 180 + (k % 2) * 60 + (360 - c.height) // 2), f)
    elif lgl:
        big = get_logo(j.get("leagueLogo"), 700)
        if big:
            f = faint(big, 12)
            im.paste(f, (Wd - f.width + 120, (Hd - f.height) // 2), f)
    sh = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for x in range(Wd):
        sd.line([x, 0, x, Hd], fill=(8, 10, 16, int(235 - 120 * x / Wd)))
    im.paste(sh, (0, 0), sh)
    left = lgl or (get_logo(urls[0], 240) if urls else None)
    if left:
        glow_ = False
        if lgl:
            left, glow_ = league_mark(left, j.get("league") or "")
        x_, y_ = 270 - left.width // 2, Hd // 2 - left.height // 2
        if glow_ or is_dark(left):
            # to'q liga logotipi (masalan Premier League) to'q fonda yo'qolmasin: ortida yumshoq oq yorug'lik doirasi
            r = int(max(left.width, left.height) * 0.62)
            halo = Image.new("L", (r * 2 + 240, r * 2 + 240), 0)
            ImageDraw.Draw(halo).ellipse([120, 120, 120 + r * 2, 120 + r * 2], fill=150)
            halo = halo.filter(ImageFilter.GaussianBlur(34))
            wl = Image.new("RGBA", halo.size, (235, 238, 245, 0))
            wl.putalpha(halo)
            im.paste(wl, (270 - halo.width // 2, Hd // 2 - halo.height // 2), wl)
            paste_glow(im, left, x_, y_, 255, 12)
        else:
            paste_glow(im, left, x_, y_, 70, 16)
    else:
        big = logo(220, False)
        im.paste(big, (270 - 110, Hd // 2 - 110), big)
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle([560, 150, 566, 570], fill=GREEN + (255,))
    title = j.get("title") or "Inter Futbol"
    size = 56
    f = font("black", size)
    lines = wrap(d, title, f, 620)
    while (len(lines) > 5 or int(size * 1.22) * len(lines) > 520) and size > 36:
        size -= 4
        f = font("black", size)
        lines = wrap(d, title, f, 620)
    lines = lines[:7]
    lh = int(size * 1.22)
    y = (Hd - lh * len(lines)) / 2
    for ln in lines:
        d.text((610, y), ln, font=f, fill=WHITE)
        y += lh
    mk = logo(84, False)
    im.paste(mk, (Wd - 80 - 42, Hd - 70 - 42), mk)
    return im


# ---------- istoriya: natija kartochkasi (tik 1080x1920, 2026-yil 7-noyabr tasdiqlangan dizayn) ----------
def _spaced(d, xy, text, f, fill, sp):
    w = sum(d.textlength(ch, font=f) for ch in text) + sp * (len(text) - 1)
    x, y = xy[0] - w / 2, xy[1]
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill, anchor="lm")
        x += d.textlength(ch, font=f) + sp


def _story_meta(j):
    # sana va turnir: post matnidagi "2026-yil 6-noyabr, Turnir." qatoridan olinadi
    import re, html as H
    t = H.unescape(re.sub(r"<[^>]+>", "", j.get("chan") or ""))
    m = re.search(r"(\d{4}-yil \d{1,2}-[a-zA-ZÀ-ɏ'’]+),\s*([^.\n]+)", t)
    return (m.group(1), m.group(2).strip()) if m else ("", j.get("league") or "")


def render_story_result(j):
    Wd, Hd = 1080, 1920
    hl, al = get_logo(j.get("homeLogo"), 170), get_logo(j.get("awayLogo"), 170)
    # rangsiz (qora-oq) logotipda fon kulrang, chiziq oq bo'ladi
    mc = lambda lg_: (lambda c: None if c == (40, 60, 120) else c)(main_color(lg_)) if lg_ else None
    c1, c2 = mc(hl), mc(al)
    dk = lambda c, k: tuple(int(v * k) for v in c)
    top = dk(c1, 0.62) if c1 else (58, 61, 68)
    bot = dk(c2, 0.55) if c2 else (58, 61, 68)
    mid = (10, 14, 22)
    im = Image.new("RGB", (Wd, Hd))
    dd = ImageDraw.Draw(im)
    for y in range(Hd):
        t = y / Hd
        if t < 0.5:
            k = min(1, t / 0.5) ** 1.2
            c = tuple(int(top[i] + (mid[i] - top[i]) * k) for i in range(3))
        else:
            k = min(1, (t - 0.5) / 0.5) ** 0.9
            c = tuple(int(mid[i] + (bot[i] - mid[i]) * k) for i in range(3))
        dd.line([0, y, Wd, y], fill=c)
    paste_league_free(im, j, 120, Wd // 2, 300)
    d = ImageDraw.Draw(im, "RGBA")
    day, comp = _story_meta(j)
    meta = " · ".join(x for x in (comp, day) if x)
    if meta:
        d.text((Wd // 2, 410), meta, font=font("bold", 28), fill=(201, 209, 219), anchor="mm")
    hrows = [("g", n, ms) for n, ms in (j.get("hg") or [])] + [("r", n, [m]) for n, m in (j.get("hr") or [])]
    arows = [("g", n, ms) for n, ms in (j.get("ag") or [])] + [("r", n, [m]) for n, m in (j.get("ar") or [])]

    def panel(y0, lg_, name, col, rows):
        n = len(rows)
        h = max(240, 150 + 44 * n)
        box = [90, y0, Wd - 90, y0 + h]
        glass(im, box, alpha=18, line=40, r=36)
        d = ImageDraw.Draw(im, "RGBA")
        if lg_:
            x_, y_ = 90 + 40 + (170 - lg_.width) // 2, y0 + (h - lg_.height) // 2
            if is_dark(lg_):
                paste_glow(im, lg_, x_, y_, 255, 8)
                paste_glow(im, lg_, x_, y_, 210, 22)
            else:
                paste_glow(im, lg_, x_, y_, 90, 18)
        d = ImageDraw.Draw(im, "RGBA")
        tx = 330
        t = name.upper()
        s = 56
        f = font("black", s)
        while s > 34 and d.textlength(t, font=f) > Wd - 90 - 40 - tx:
            s -= 2
            f = font("black", s)
        ny = y0 + (h - (70 + 44 * n)) // 2 + 26
        d.text((tx, ny), t, font=f, fill=WHITE, anchor="lm")
        d.rounded_rectangle([tx, ny + 36, tx + 90, ny + 42], radius=3, fill=col + (255,))
        fg = font("bold", 30)
        for i, (kind, p, ms) in enumerate(rows):
            y = ny + 80 + i * 44
            t1, t2 = p + " ", ", ".join(ms)
            while d.textlength(t1 + t2, font=fg) > Wd - 90 - 40 - tx and len(t1) > 6:
                t1 = t1[:-2] + " "
            x = tx
            if kind == "r":
                redcard(d, x + 9, y)
                x += 30
            d.text((x, y), t1, font=fg, fill=WHITE, anchor="lm")
            d.text((x + d.textlength(t1, font=fg), y), t2, font=fg, fill=GREEN if kind == "g" else (235, 120, 120), anchor="lm")
        return y0 + h

    hcol = c1 if c1 and max(c1) > 60 else WHITE
    acol = c2 if c2 and max(c2) > 60 else WHITE
    panel(480, hl, j["home"], hcol, hrows)
    a, b = j["score"].split(":")
    d = ImageDraw.Draw(im, "RGBA")
    d.text((Wd // 2, 990), f"{a.strip()} : {b.strip()}", font=font("black", 220), fill=WHITE, anchor="mm")
    _spaced(d, (Wd // 2, 1125), "ÖYIN YAKUNLANDI", font("bold", 30), (168, 179, 194), 7)
    panel(1200, al, j["away"], acol, arows)
    lg = logo(86, False)
    im.paste(lg, (Wd // 2 - 43, Hd - 150 - 86), lg)
    buf = io.BytesIO()
    im.convert("RGB").save(buf, "JPEG", quality=95, subsampling=0)
    return buf.getvalue()


def render(j):
    if j.get("lineup"):
        im = render_lineup(j)
        buf = io.BytesIO()
        im.save(buf, "PNG", optimize=True)
        return buf.getvalue()
    if j.get("score") and j.get("home") and j.get("away"):
        im = render_card(j)
        buf = io.BytesIO()
        im.save(buf, "PNG", optimize=True)
        return buf.getvalue()
    im = render_news(j)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def wapi(path, data=None, ctype="application/json"):
    req = urllib.request.Request(W + path, data=data, headers={"x-key": KEY, "content-type": ctype, "user-agent": "InterFutbolCard"}, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read() or b"{}")

if __name__ == "__main__":
    job = os.environ.get("JOB")
    if job:
        j = wapi("/ub/cjob?id=" + job)
        if j:
            wapi("/ub/card?id=" + job, render(j), "image/png")
            if j.get("story") and j.get("score") and j.get("home") and j.get("away"):
                # tik natija istoriyasi (Telegram + Instagram), faqat top o'yinlar
                try:
                    sj = render_story_result(j)
                    for k in range(3):  # tarmoq xatosida 3 marta urinadi
                        try:
                            wapi("/ub/simg?id=" + job, sj, "image/jpeg")
                            break
                        except Exception as e:
                            print("istoriya qayta", k, e)
                            __import__("time").sleep(10)
                except Exception as e:
                    print("istoriya xato", e)
