# Inter Futbol: rasm topilmagan yangilik uchun mavzuga mos kartochka (1280x720)
# Natija bo'lsa: shisha uslubi (jamoa ranglari, ikki panel, klub nomi ostida klub rangidagi chiziq)
import glob, hashlib, io, json, os, time, urllib.error, urllib.parse, urllib.request
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


UA = "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)"


def jget(url):
    req = urllib.request.Request(url, headers={"user-agent": UA, "api-user-agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def has_alpha(im):
    # haqiqiy logotip odatda shaffof fonda (stadion surati emas)
    a = im.split()[3]
    return a.getextrema()[0] < 30


def alt_logo(name, size):
    # asosiy manzil ishlamasa — boshqa manbalardan qidiradi (2026-11-08):
    # 1) ESPN qidiruvi  2) Wikidata (P154 — rasmiy logotip fayli)  3) Vikipediya maqolasi rasmi (faqat shaffof fonli bo'lsa)
    q = urllib.parse.quote(name or "")
    if not q:
        return None
    try:
        j = jget("https://site.web.api.espn.com/apis/search/v2?query=" + q + "&limit=6")
        for g in j.get("results") or []:
            if g.get("type") != "team":
                continue
            for c in g.get("contents") or []:
                if "women" in (c.get("subtitle") or "").lower():
                    continue
                tid = (c.get("uid") or "").split("~t:")[-1]
                if tid.isdigit():
                    lg = get_logo("https://a.espncdn.com/i/teamlogos/soccer/500/" + tid + ".png", size)
                    if lg:
                        print("LOGO-ESPN", name, tid)
                        return lg
    except Exception as e:
        print("alt espn", e)
    try:
        j = jget("https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=5&search=" + q)
        ids = [x["id"] for x in j.get("search") or []]
        if ids:
            e = jget("https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=" + "|".join(ids))
            for i in ids:
                cl = e.get("entities", {}).get(i, {}).get("claims", {})
                p31 = [c["mainsnak"].get("datavalue", {}).get("value", {}).get("id") for c in cl.get("P31", [])]
                if "Q476028" not in p31 and "Q103229495" not in p31:  # futbol klubi
                    continue
                for c in cl.get("P154", []):
                    f = c["mainsnak"].get("datavalue", {}).get("value")
                    if f:
                        lg = get_logo("https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(f.replace(" ", "_")) + "?width=500", size)
                        if lg:
                            print("LOGO-WIKIDATA", name, f)
                            return lg
    except Exception as e:
        print("alt wikidata", e)
    try:
        j = jget("https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=" + urllib.parse.quote((name or "") + " football club"))
        t = (j.get("query", {}).get("search") or [{}])[0].get("title")
        if t:
            sm = jget("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(t.replace(" ", "_")))
            src = (sm.get("thumbnail") or {}).get("source")
            if src:
                lg = get_logo(src, size)
                if lg and has_alpha(lg):
                    print("LOGO-WIKI", name, t)
                    return lg
    except Exception as e:
        print("alt wiki", e)
    return None


def get_logo(url, size):
    if not url:
        return None
    try:
        # 3 marta urinish: logotip yuklanmay qolsa kartochka xunuk chiqmasin
        for k in range(3):
            try:
                req = urllib.request.Request(url, headers={"user-agent": UA})
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


MISSING = []  # zaxira belgi qo'yilgan klublar — workerga xabar qilinadi (admin ogohlantirishi)


def monogram(name, size):
    # zaxira: logotip hech qayerdan yuklanmasa bo'sh joy qolmasin — klub bosh harflari doirada (2026-11-08)
    w = [x for x in (name or "?").replace("-", " ").split() if x[:1].isalpha()] or ["?"]
    ini = (w[0][0] + (w[1][0] if len(w) > 1 else "")).upper()
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([2, 2, size - 3, size - 3], fill=(70, 82, 104, 255), outline=(235, 238, 245, 255), width=max(3, size // 30))
    d.text((size / 2, size / 2), ini, font=font("black", int(size * 0.38)), fill=(245, 247, 250), anchor="mm")
    print("LOGO-ZAXIRA", name)
    MISSING.append(name or "?")
    return im


def crest(url, size, name):
    # logotip zanjiri: berilgan manzil -> ESPN qidiruv -> Wikidata -> Vikipediya -> bosh harfli zaxira belgi
    return get_logo(url, size) or alt_logo(name, size) or monogram(name, size)


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


def is_dark(lg, th=75):
    sm = lg.copy()
    sm.thumbnail((48, 48))
    px = [(r, g, b) for r, g, b, a in sm.getdata() if a > 200]
    if not px:
        return False
    return sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px) / len(px) < th


def blends(lg):
    # logotip deyarli bir rangli (masalan Liverpool, Nottingham Forest — qizil) va o'z rangidagi fonda yo'qolib ketadi
    c = main_color(lg)
    sm = lg.copy()
    sm.thumbnail((64, 64))
    px = [(r, g, b) for r, g, b, a in sm.getdata() if a > 200]
    if len(px) < 20:
        return False
    return sum(1 for p in px if sum((p[i] - c[i]) ** 2 for i in range(3)) ** 0.5 < 90) / len(px) >= 0.9


def paste_disc(im, lg, x, y):
    # bir rangli logotip ortida och doira — fon bilan qo'shilib ketmasin (2026-11-08)
    cx, cy = x + lg.width / 2, y + lg.height / 2
    lg = lg.copy()
    lg.thumbnail((int(lg.width * 0.74), int(lg.height * 0.74)), Image.LANCZOS)
    x, y = int(cx - lg.width / 2), int(cy - lg.height / 2)
    r = max(lg.width, lg.height) / 2 + 13
    sh = Image.new("L", (int(r * 2 + 60), int(r * 2 + 60)), 0)
    ImageDraw.Draw(sh).ellipse([30, 34, 30 + r * 2, 34 + r * 2], fill=110)
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    blk = Image.new("RGBA", sh.size, (0, 0, 0, 0))
    blk.putalpha(sh)
    im.paste(blk, (int(cx - r - 30), int(cy - r - 30)), blk)
    d = ImageDraw.Draw(im, "RGBA")
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(246, 247, 250, 245))
    im.paste(lg, (x, y), lg)


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
    hl, al = crest(j.get("homeLogo"), 180, j.get("home")), crest(j.get("awayLogo"), 180, j.get("away"))
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
            if blends(lg_):
                paste_disc(im, lg_, x_, y_)
            elif is_dark(lg_):
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
    if len(w) >= 4 and " ".join(w[-3:-1]).lower() in ("van der", "van den", "van de", "de la", "de los", "dos santos"):
        return " ".join(w[-3:])
    if len(w) >= 3 and w[-2].lower() in ("el", "de", "van", "von", "da", "di", "del", "dos", "le", "la", "ten", "ter", "al", "mac", "mc", "ben", "abu", "do", "du", "st.", "san", "dal", "della"):
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
    # chiziqdan TEPADA faqat gollar; qizil va sariq kartochkalar chiziqdan PASTDA (Bahtiyor aka, 2026-11-08)
    hrows = [("g", n, ms) for n, ms in (j.get("hg") or [])]
    arows = [("g", n, ms) for n, ms in (j.get("ag") or [])]
    hr_ = [(n, m, False) for n, m in (j.get("hr") or [])]
    ar_ = [(n, m, False) for n, m in (j.get("ar") or [])]
    # sariq kartochkalar (Bahtiyor aka tanlovi yB1, 2026-11-08): gollar ostida chiziq va ixcham qatorlar, bizning futbolchi yashil ramkada
    hy = [(x[0], x[1], bool(x[2]) if len(x) > 2 else False) for x in (j.get("hy") or [])]
    ay = [(x[0], x[1], bool(x[2]) if len(x) > 2 else False) for x in (j.get("ay") or [])]
    if not (hrows or arows or hy or ay or hr_ or ar_):
        return render_card_plain(j)
    Wd = 1280
    hl, al = crest(j.get("homeLogo"), 140, j.get("home")), crest(j.get("awayLogo"), 140, j.get("away"))
    c1 = main_color(hl) if hl else (30, 60, 140)
    c2 = main_color(al) if al else (140, 30, 40)
    yc = bool(hy or ay or hr_ or ar_)
    d = ImageDraw.Draw(Image.new("RGB", (8, 8)), "RGBA")  # o'lchash uchun
    lines = [n + " " + ", ".join(m) for _, n, m in hrows + arows]
    n = max(len(hrows), len(arows))
    fy = font("bold", 19)
    # kartochkalar RO'YXAT ko'rinishida: har futbolchi alohida qatorda (avval qizil, keyin sariq) — Bahtiyor aka, 2026-11-08
    one = lambda items: [[(it[0] if it[2] else short_name(it[0]), it[1], it[2])] for it in items]
    yl = {0: [("r", l) for l in one(hr_)] + [("y", l) for l in one(hy)],
          1: [("r", l) for l in one(ar_)] + [("y", l) for l in one(ay)]}
    s = 26 if n <= 3 else 23 if n <= 5 else 20
    if yc:
        s = min(24, s)
    f = font("bold", s)
    while s > 16 and any(d.textlength(t, font=f) + 30 > 450 - 70 for t in lines):
        s -= 1
        f = font("bold", s)
    # ro'yxat uzun bo'lsa yozuv kichraymaydi — rasm bo'yiga cho'ziladi
    lh = s + (10 if yc else 14)
    gy0, ly_ = (445, 220) if yc else (470, 250)
    need = 0
    for gs, cl in ((hrows, yl[0]), (arows, yl[1])):
        y = gy0 + len(gs) * lh - (lh / 2 if gs else 0)
        if cl:
            y += (14 + 24 if gs else 0) + (len(cl) - 1) * 30 + 15
        need = max(need, y)
    bot = max(680 if yc else 650, int(need + 34))
    Hd = bot + (40 if yc else 70)
    im = glass_bg(c1, c2, Wd, Hd)
    top = 140 if yc else 150
    boxes = ([50, top, 500, bot], [Wd - 500, top, Wd - 50, bot])
    for bx in boxes:
        glass(im, bx)
    league_top(im, j, 120 if yc else 140, 70 if yc else 80)
    d = ImageDraw.Draw(im, "RGBA")
    for side, (bx, lg_, name, col, gs) in enumerate(((boxes[0], hl, j["home"], c1, hrows), (boxes[1], al, j["away"], c2, arows))):
        cx = (bx[0] + bx[2]) // 2
        if lg_:
            x_, y_ = cx - lg_.width // 2, ly_ - lg_.height // 2
            if blends(lg_):
                paste_disc(im, lg_, x_, y_)
            elif is_dark(lg_):
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
            for ck, ln in yl[side]:
                txt = ",  ".join(a_ + " " + b_ for a_, b_, _ in ln)
                fy = font("bold", 19)
                k_ = 19
                while k_ > 14 and d.textlength(txt, font=fy) + 26 > 400:  # uzun ism panel chetidan chiqmasin
                    k_ -= 1
                    fy = font("bold", k_)
                w = d.textlength(txt, font=fy) + 26
                x = cx - w / 2
                if ck == "r":
                    d.rounded_rectangle([x + 7 - 5.6, y - 8, x + 7 + 5.6, y + 8], radius=2, fill=(226, 48, 48, 255))
                else:
                    ycard(d, x + 7, y, 0.8)
                xx = x + 26
                for k, (a_, b_, uz) in enumerate(ln):
                    if uz:
                        d.rounded_rectangle([xx - 6, y - 15, xx + d.textlength(a_ + " " + b_, font=fy) + 6, y + 15], radius=9, fill=GREEN + (70,), outline=GREEN + (230,), width=2)
                    d.text((xx, y), a_ + " ", font=fy, fill=WHITE, anchor="lm")
                    xx += d.textlength(a_ + " ", font=fy)
                    d.text((xx, y), b_, font=fy, fill=(240, 110, 110) if ck == "r" else YEL, anchor="lm")
                    xx += d.textlength(b_, font=fy)
                    if k < len(ln) - 1:
                        d.text((xx, y), ",  ", font=fy, fill=WHITE, anchor="lm")
                        xx += d.textlength(",  ", font=fy)
                y += 30
    a, b = j["score"].split(":")
    d.text((Wd // 2, 330), f"{a} - {b}", font=font("black", 120), fill=WHITE, anchor="mm")
    d.text((Wd // 2, 430), "ÖYIN YAKUNLANDI", font=font("bold", 22), fill=(230, 235, 240), anchor="mm")
    lg = logo(64, False)
    im.paste(lg, (Wd // 2 - 32, Hd - 110 if yc else Hd - 120), lg)
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
            if blends(lg_):
                paste_disc(im, lg_, x_, y_)
            elif is_dark(lg_):
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


def club_palette(lg):
    # KLUB RANGIDAGI FON (Bahtiyor aka tanlovi "C1 klub to'q", 2026-11-08): ranglar logoning o'zidan olinadi.
    # Qaytaradi: (to'q asos rang, och urg'u rang) yoki None (logo rangsiz — oq/qora/kulrang bo'lsa eski fon qoladi).
    import colorsys
    sm = lg.convert("RGBA").resize((80, 80))
    cnt = {}
    for r, g, b, a in sm.getdata():
        if a < 200:
            continue
        h, l, s_ = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s_ < 0.35 or l < 0.12 or l > 0.88:
            continue
        k = (r // 24, g // 24, b // 24)
        cnt[k] = cnt.get(k, 0) + 1
    tot = sum(cnt.values())
    if tot < 120:  # rangli qism juda kam (masalan Juventus, Real Madrid) — eski to'q fon
        return None
    cols = [tuple(c * 24 + 12 for c in k) for k, n in sorted(cnt.items(), key=lambda x: -x[1]) if n >= tot * 0.03][:8]
    hls = lambda c: colorsys.rgb_to_hls(*(v / 255 for v in c))
    def tune(c, f=1.2, lmin=None, lmax=None):
        h, l, s_ = hls(c)
        s_ = min(1, s_ * f)
        if lmin is not None: l = max(l, lmin)
        if lmax is not None: l = min(l, lmax)
        return tuple(int(v * 255) for v in colorsys.hls_to_rgb(h, l, s_))
    base = min(cols, key=sum)
    cand = [c for c in cols if 0.4 < hls(c)[1] < 0.82] or cols
    acc = tune(max(cand, key=lambda c: hls(c)[2]), 1.2, lmin=0.55, lmax=0.72)
    return tune(base, 1.1, lmax=0.3), acc


def club_bg(im, lg, pal):
    # to'q gradient + logoning orqasida urg'u rangidagi nur + formadagidek nozik diagonal chiziqlar + o'ngda juda xira katta logo
    Wd, Hd = im.size
    import colorsys
    base, acc = pal
    mono = blends(lg)  # bir rangli gerb (Liverpool kabi): fon to'qroq, ortida oq nur — gerb fonga qo'shilib ketmasin
    sc = lambda c, mx: tuple(int(v * mx / max(1, max(c))) for v in c)
    top, bot = (sc(base, 40), sc(base, 14)) if mono else (sc(base, 72), sc(base, 26))
    h_, l_, s_ = colorsys.rgb_to_hls(*(v / 255 for v in base))
    glow = (228, 232, 240) if mono else tuple(int(v * 255) for v in colorsys.hls_to_rgb(h_, 0.42, min(1, s_)))  # nur — asos rangning yorug'i
    d = ImageDraw.Draw(im)
    for y in range(Hd):
        t = y / Hd
        d.line([0, y, Wd, y], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    gl = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    ImageDraw.Draw(gl).ellipse([270 - 330, Hd // 2 - 330, 270 + 330, Hd // 2 + 330], fill=glow + (90 if mono else 150,))
    gl = gl.filter(ImageFilter.GaussianBlur(120))
    im.paste(gl, (0, 0), gl)
    st = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    for k in range(-Hd, Wd, 46):
        sd.line([k, Hd, k + Hd, 0], fill=acc + (14,), width=18)
    im.paste(st, (0, 0), st)
    big = lg.convert("RGBA").resize((560, 560))
    big.putalpha(big.getchannel("A").point(lambda v: int(v * 0.045)))
    im.paste(big, (880, 30), big)


def stat_block(im, st, acc):
    # RAQAMLARDA o'ng qismi: rukn, ism, liga/mavsum/sana, raqamli plitkalar (2 ustun), manba
    d = ImageDraw.Draw(im, "RGBA")
    # rukn nomi rasmda yozilmaydi (Bahtiyor aka qoidasi, 2026-11-09)
    nm = st.get("name") or ""
    s = 56
    while s > 36 and d.textlength(nm, font=font("black", s)) > 620:
        s -= 2
    d.text((610, 182 + (56 - s)), nm, font=font("black", s), fill=WHITE)
    sub = st.get("sub") or ""
    fs = 20
    while fs > 14 and d.textlength(sub, font=font("med", fs)) > 620:
        fs -= 1
    d.text((610, 252), sub, font=font("med", fs), fill=(200, 215, 235))
    tiles = (st.get("tiles") or [])[:6]
    rows = (len(tiles) + 1) // 2
    th = 120 if rows <= 2 else 84
    gap = 20 if rows <= 2 else 14
    fv_s = 58 if rows <= 2 else 44
    tl = Image.new("RGBA", im.size, (0, 0, 0, 0))
    td = ImageDraw.Draw(tl)
    pos = []
    for k in range(len(tiles)):
        x, y = 610 + (k % 2) * 300, 300 + (k // 2) * (th + gap)
        pos.append((x, y))
        td.rounded_rectangle([x, y, x + 280, y + th], radius=16, fill=(255, 255, 255, 18), outline=acc + (70,), width=2)
    im.paste(tl, (0, 0), tl)
    d = ImageDraw.Draw(im, "RGBA")
    for k, (v, l) in enumerate(tiles):
        x, y = pos[k]
        fv = font("black", fv_s)
        d.text((x + 22, y + th // 2), v, font=fv, fill=acc if k == 0 else WHITE, anchor="lm")
        lx = x + 36 + d.textlength(v, font=fv)
        fl = 22
        while fl > 14 and lx + d.textlength(l, font=font("bold", fl)) > x + 268:
            fl -= 1
        d.text((lx, y + th // 2 + 4), l, font=font("bold", fl), fill=(200, 215, 235), anchor="lm")
    if st.get("src"):
        d.text((610, 300 + rows * (th + gap) - gap + 18), "Manba: " + st["src"], font=font("med", 16), fill=(160, 175, 195))


# ================= TIK YANGILIK KARTOCHKASI (1080x1350, Bahtiyor aka talabi 2026-11-09: "uzunasiga qo'y") =================
# Bazada odamning surati bo'lsa (j["face"]) — tepada surat, pastda gerb va sarlavha; bo'lmasa — katta gerb, logo rangidagi fon.
# "Raqamlarda" (j["stat"]) — chapda surat yoki gerb, o'ngda raqamlar ustuni. Rukn nomi (FIKR, RAQAMLARDA...) yozilmaydi.
def get_photo(url):
    if not url:
        return None
    for k in range(3):
        try:
            req = urllib.request.Request(url, headers={"user-agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return Image.open(io.BytesIO(r.read())).convert("RGB")
        except Exception as e:
            print("photo", e)
    return None


def _cover(src, w, h, fy=0.15):
    r = max(w / src.width, h / src.height)
    im = src.resize((int(src.width * r + .5), int(src.height * r + .5)), Image.LANCZOS)
    x = (im.width - w) // 2
    y = int((im.height - h) * fy)
    im = im.crop((x, y, x + w, y + h))
    if r > 1.3:
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return im


def _vfade(im, y0, y1, col, a0=0, a1=255, x0=0, x1=None):
    g = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    for y in range(y0, y1):
        d.line([x0, y, x1 or im.width, y], fill=tuple(col) + (int(a0 + (a1 - a0) * (y - y0) / max(1, y1 - y0)),))
    im.paste(g, (0, 0), g)


def _stripes(im, acc, y0=0, alpha=11):
    Wd, Hd = im.size
    st = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    for k in range(-Hd, Wd, 52):
        sd.line([k, Hd, k + Hd, 0], fill=tuple(acc) + (alpha,), width=20)
    if y0:
        ImageDraw.Draw(st).rectangle([0, 0, Wd, y0], fill=(0, 0, 0, 0))
    im.paste(st, (0, 0), st)


def _shadow_paste(im, lg, x, y, blur=16, op=0.6):
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    blk = Image.new("RGBA", lg.size, (0, 0, 0, 255))
    blk.putalpha(lg.getchannel("A").point(lambda v: int(v * op)))
    sh.paste(blk, (x, y + 10), blk)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    im.paste(sh, (0, 0), sh)
    im.paste(lg, (x, y), lg)


def _title_v(d, title, x, y, maxw, maxh, start=72, minsize=44):
    s = start
    while True:
        f = font("black", s)
        lines = wrap(d, title, f, maxw)
        lh = int(s * 1.2)
        if (len(lines) * lh <= maxh and len(lines) <= 6) or s <= minsize:
            break
        s -= 4
    for ln in lines[:7]:
        d.text((x, y), ln, font=f, fill=WHITE)
        y += lh
    return y


def render_news_v(j):
    Wd, Hd = 1080, 1350
    src = j.get("leftLogo") or ""
    crest_ = get_logo(src, 460) if src else None
    lgl = None if crest_ else get_logo(j.get("leagueLogo"), 420)
    if not crest_ and not lgl:
        for u in (j.get("clubLogos") or [])[:1]:
            crest_ = get_logo(u, 460)
    mark = crest_ or lgl
    if lgl and not crest_:
        mark, _g = league_mark(lgl, j.get("league") or "")
    if mark and max(mark.size) < 400:  # kichik logo (masalan FotMob 192 px) — kattalashtiriladi
        k = 440 / max(mark.size)
        mark = mark.resize((int(mark.width * k), int(mark.height * k)), Image.LANCZOS)
        if crest_:
            crest_ = mark
    pal = club_palette(mark) if mark else None
    base, acc = pal if pal else ((10, 14, 22), GREEN)
    sc = lambda c, mx: tuple(int(v * mx / max(1, max(c))) for v in c)
    face = get_photo(j.get("face")) if j.get("face") else None
    st = j.get("stat") if (j.get("stat") or {}).get("tiles") else None
    im = Image.new("RGB", (Wd, Hd), (10, 14, 22))
    d = ImageDraw.Draw(im)
    top, bot = (sc(base, 74), sc(base, 20)) if pal else ((22, 28, 40), (8, 10, 16))
    for y in range(Hd):
        t = y / Hd
        d.line([0, y, Wd, y], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    dark = sc(base, 18) if pal else (8, 10, 16)
    if st:
        LW = 660
        if face:
            im.paste(_cover(face, LW, Hd, 0.12), (0, 0))
            _vfade(im, 820, Hd, dark, 0, 245, 0, LW)
        else:
            _stripes(im, acc)
            if mark:
                big = mark.resize((int(mark.width * 900 / max(mark.size)), int(mark.height * 900 / max(mark.size))))
                big.putalpha(big.getchannel("A").point(lambda v: int(v * 0.05)))
                im.paste(big, (-220, 420), big)
                m2 = mark.copy()
                m2.thumbnail((420, 420), Image.LANCZOS)
                _shadow_paste(im, m2, (LW - m2.width) // 2, 330)
        d = ImageDraw.Draw(im, "RGBA")
        d.rectangle([LW, 0, Wd, Hd], fill=(0, 0, 0, 120))
        d.line([LW, 0, LW, Hd], fill=tuple(acc), width=6)
        tiles = st["tiles"][:5]
        rh = (Hd - 200) // max(4, len(tiles))
        for k, (v, l) in enumerate(tiles):
            cy = 40 + k * rh + rh // 2
            fv = font("black", 136 if len(tiles) <= 4 else 110)
            while d.textlength(v, font=fv) > Wd - LW - 60:
                fv = font("black", fv.size - 8)
            d.text(((LW + Wd) // 2, cy - 30), v, font=fv, fill=tuple(acc) if k == 0 else WHITE, anchor="mm")
            d.text(((LW + Wd) // 2, cy + 74), str(l).upper(), font=font("bold", 26), fill=(205, 218, 235), anchor="mm")
            if k:
                d.line([LW + 50, 40 + k * rh, Wd - 50, 40 + k * rh], fill=(255, 255, 255, 40), width=2)
        nm = (st.get("name") or "").split()
        y = 900
        if len(nm) > 1:
            d.text((60, y), " ".join(nm[:-1]).upper(), font=font("black", 56), fill=(220, 230, 245)); y += 66
        fs = 100
        while fs > 50 and d.textlength((nm[-1] if nm else "").upper(), font=font("black", fs)) > LW - 100:
            fs -= 6
        d.text((60, y), (nm[-1] if nm else "").upper(), font=font("black", fs), fill=WHITE); y += int(fs * 1.15)
        if face and crest_:
            c2 = crest_.copy(); c2.thumbnail((110, 110), Image.LANCZOS); _shadow_paste(im, c2, 60, 60); d = ImageDraw.Draw(im, "RGBA")
        for ln in wrap(d, st.get("sub") or "", font("med", 30), LW - 110)[:2]:
            d.text((62, y + 8), ln, font=font("med", 30), fill=(200, 215, 235)); y += 42
        if st.get("src"):
            d.text((62, Hd - 70), "Manba: " + st["src"], font=font("med", 22), fill=(150, 165, 190))
    elif face:
        im.paste(_cover(face, Wd, 900, 0.12), (0, 0))
        _vfade(im, 560, 900, dark)
        d = ImageDraw.Draw(im, "RGBA")
        d.rectangle([0, 900, Wd, Hd], fill=tuple(dark))
        _stripes(im, acc, 860, 10)
        if mark:
            m2 = mark.copy(); m2.thumbnail((130, 130), Image.LANCZOS); _shadow_paste(im, m2, 60, 900 - 70 - m2.height // 2)
        d = ImageDraw.Draw(im, "RGBA")
        y = _title_v(d, j.get("title") or "Inter Futbol", 60, 930, Wd - 120, 300, 64, 40)
        d.rectangle([60, y + 16, 190, y + 22], fill=tuple(acc))
    else:
        _stripes(im, acc)
        if mark:
            big = mark.resize((int(mark.width * 760 / max(mark.size)), int(mark.height * 760 / max(mark.size))))
            big.putalpha(big.getchannel("A").point(lambda v: int(v * 0.045)))
            im.paste(big, (Wd - big.width + 200, 40), big)
            gl = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
            glow = (228, 232, 240) if (not pal or blends(mark) or is_dark(mark, 50)) else sc(acc, 200)
            ImageDraw.Draw(gl).ellipse([Wd // 2 - 340, 400 - 340, Wd // 2 + 340, 400 + 340], fill=tuple(glow) + (70 if not pal or blends(mark) else 120,))
            gl = gl.filter(ImageFilter.GaussianBlur(120))
            im.paste(gl, (0, 0), gl)
            m2 = mark.copy(); m2.thumbnail((440, 440), Image.LANCZOS)
            _shadow_paste(im, m2, (Wd - m2.width) // 2, 400 - m2.height // 2, 20)
        else:
            lg = logo(300, False); im.paste(lg, ((Wd - 300) // 2, 250), lg)
        d = ImageDraw.Draw(im, "RGBA")
        d.rectangle([60, 720, 190, 728], fill=tuple(acc))
        _title_v(d, j.get("title") or "Inter Futbol", 60, 760, Wd - 120, 420, 76, 44)
    mk = logo(92, False)
    im.paste(mk, (Wd - 92 - 40, Hd - 92 - 34), mk)
    return im


def render_news(j):
    # 2026-11-08 qo'shimcha: chapda klub gerbi bo'lsa fon klub ranglarida (club_palette/club_bg), "Raqamlarda" — plitkalar (stat_block)
    # YANGILIK KARTOCHKASI (Bahtiyor aka tasdiqlagan dizayn, 2026-11-08):
    # fonda yangilikda tilga olingan klublarning xira logotiplari (4 tagacha), chapda katta liga logotipi
    # (liga bo'lmasa - birinchi klub, u ham bo'lmasa - iF), o'ngda yashil chiziq va sarlavha, o'ng pastki burchakda kattaroq iF.
    Wd, Hd = 1280, 720
    NAVY = (10, 14, 22)
    im = Image.new("RGB", (Wd, Hd), NAVY)
    urls = [u for u in (j.get("clubLogos") or [j.get("homeLogo"), j.get("awayLogo")]) if u and u != j.get("leftLogo")][:4]  # chapdagi asosiy gerb fonda takrorlanmaydi
    clubs = [c for c in (get_logo(u, 360) for u in urls) if c]
    lgl = get_logo(j.get("leagueLogo"), 240)
    # chapdagi gerb (terma jamoa — UFA va h.k.) yoki birinchi klub gerbi — kattaroq, 340 px (Bahtiyor aka tasdiqlagan, 2026-11-08)
    crest = get_logo(j.get("leftLogo"), 340) if j.get("leftLogo") else None
    # gerb rangidagi fon: chapda klub yoki terma jamoa (UFA) gerbi bo'lsa (Bahtiyor aka, 2026-11-08: UFA ham)
    # chapda gerb bo'lmasa — liga logotipi (yoki birinchi klub) ranglari olinadi
    psrc = crest or lgl or (clubs[0] if clubs else None)
    pal = club_palette(psrc) if psrc else None
    if pal:
        club_bg(im, psrc, pal)
        clubs = []
    if not lgl and not crest and len(clubs) > 1:
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
    elif (crest or lgl) and not pal:
        big = get_logo(j.get("leftLogo") if crest else j.get("leagueLogo"), 700)
        if big:
            f = faint(big, 12)
            im.paste(f, (Wd - f.width + 120, (Hd - f.height) // 2), f)
    if not pal:
        sh = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        for x in range(Wd):
            sd.line([x, 0, x, Hd], fill=(8, 10, 16, int(235 - 120 * x / Wd)))
        im.paste(sh, (0, 0), sh)
    left = crest or lgl or (get_logo(urls[0], 340) if urls else None)
    if left:
        glow_ = False
        if lgl and not crest:
            left, glow_ = league_mark(left, j.get("league") or "")
        x_, y_ = 270 - left.width // 2, Hd // 2 - left.height // 2
        if glow_ or (is_dark(left, 50) if (crest or not lgl) else is_dark(left)):  # klub gerbi faqat juda to'q bo'lsa (Liverpool kabi qizil — yo'q)
            # to'q liga logotipi (masalan Premier League) to'q fonda yo'qolmasin: ortida yumshoq oq yorug'lik doirasi
            r = int(max(left.width, left.height) * 0.62)
            halo = Image.new("L", (r * 2 + 240, r * 2 + 240), 0)
            ImageDraw.Draw(halo).ellipse([120, 120, 120 + r * 2, 120 + r * 2], fill=150)
            halo = halo.filter(ImageFilter.GaussianBlur(34))
            wl = Image.new("RGBA", halo.size, (235, 238, 245, 0))
            wl.putalpha(halo)
            im.paste(wl, (270 - halo.width // 2, Hd // 2 - halo.height // 2), wl)
            paste_glow(im, left, x_, y_, 255, 12)
        elif pal:
            # gerb ostida yumshoq soya (C1 dizayni)
            m = left.getchannel("A").point(lambda v: int(v * 0.66))
            sh_ = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
            blk = Image.new("RGBA", left.size, (0, 0, 0, 255))
            blk.putalpha(m)
            sh_.paste(blk, (x_, y_ + 15), blk)
            sh_ = sh_.filter(ImageFilter.GaussianBlur(18))
            im.paste(sh_, (0, 0), sh_)
            im.paste(left, (x_, y_), left)
        else:
            paste_glow(im, left, x_, y_, 70, 16)
    else:
        big = logo(220, False)
        im.paste(big, (270 - 110, Hd // 2 - 110), big)
    acc = pal[1] if pal else GREEN
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle([560, 150, 566, 570], fill=acc + (255,))
    st = j.get("stat")
    if st and st.get("tiles"):
        stat_block(im, st, acc)
        mk = logo(84, False)
        im.paste(mk, (Wd - 80 - 42, Hd - 70 - 42), mk)
        return im
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
    hl, al = crest(j.get("homeLogo"), 170, j.get("home")), crest(j.get("awayLogo"), 170, j.get("away"))
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
            if blends(lg_):
                paste_disc(im, lg_, x_, y_)
            elif is_dark(lg_):
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
    im = render_news(j) if j.get("hz") else render_news_v(j)  # 2026-11-09: yangilik kartochkalari tik (1080x1350)
    buf = io.BytesIO()
    if j.get("face"):
        im.convert("RGB").save(buf, "JPEG", quality=92)  # suratli kartochka — hajm kichik bo'lsin
    else:
        im.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def wapi(path, data=None, ctype="application/json"):
    req = urllib.request.Request(W + path, data=data, headers={"x-key": KEY, "content-type": ctype, "user-agent": "InterFutbolCard"}, method="POST" if data is not None else "GET")
    # vaqtinchalik 5xx/tarmoq xatosida 3 marta qayta urinadi (2026-11-08: 503 tufayli kartochka yangilanmay qolgan edi)
    for k in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            if e.code < 500 or k == 2:
                raise
        except urllib.error.URLError:
            if k == 2:
                raise
        time.sleep(4 * (k + 1))

if __name__ == "__main__":
    job = os.environ.get("JOB")
    if job and job.startswith("logotest:"):
        # sinov: zaxira logotip manbalari ishlayaptimi (yuklamaydi, faqat jurnalga yozadi)
        for nm in job[9:].split("|"):
            lg = alt_logo(nm, 140)
            print("TEST", nm, "->", lg.size if lg else "TOPILMADI")
        job = None
    if job:
        j = wapi("/ub/cjob?id=" + job)
        if j:
            img = render(j)
            wapi("/ub/card?id=" + job + ("&miss=" + urllib.parse.quote("|".join(sorted(set(MISSING)))) if MISSING else ""), img, "image/png")
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
