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


def render_card(j):
    # 1-variant (2026-yil 5-noyabr): ikki shisha panel; har panelda logotip, klub nomi va shu klub gollari (ism oq, daqiqa yashil)
    hg, ag = j.get("hg") or [], j.get("ag") or []
    if not (hg or ag):
        return render_card_plain(j)
    Wd, Hd = 1280, 720
    hl, al = get_logo(j.get("homeLogo"), 140), get_logo(j.get("awayLogo"), 140)
    c1 = main_color(hl) if hl else (30, 60, 140)
    c2 = main_color(al) if al else (140, 30, 40)
    im = glass_bg(c1, c2)
    boxes = ([50, 150, 500, 650], [Wd - 500, 150, Wd - 50, 650])
    for bx in boxes:
        glass(im, bx)
    league_top(im, j, 140, 80)
    d = ImageDraw.Draw(im, "RGBA")
    lines = [n + " " + ", ".join(m) for n, m in hg + ag]
    n = max(len(hg), len(ag))
    s = 26 if n <= 3 else 23 if n <= 5 else 20
    f = font("bold", s)
    while s > 16 and any(d.textlength(t, font=f) + 30 > 450 - 70 for t in lines):
        s -= 1
        f = font("bold", s)
    lh = min(s + 14, 165 / max(n, 1))
    for bx, lg_, name, col, gs in ((boxes[0], hl, j["home"], c1, hg), (boxes[1], al, j["away"], c2, ag)):
        cx = (bx[0] + bx[2]) // 2
        if lg_:
            x_, y_ = cx - lg_.width // 2, 250 - lg_.height // 2
            if is_dark(lg_):
                paste_glow(im, lg_, x_, y_, 255, 8)
                paste_glow(im, lg_, x_, y_, 210, 22)
            else:
                paste_glow(im, lg_, x_, y_, 110, 20)
        club_name(im, cx, 320, name, col, bx)
        d = ImageDraw.Draw(im, "RGBA")
        for i, (p, ms) in enumerate(gs):
            y = 470 + i * lh
            t1, t2 = p + " ", ", ".join(ms)
            w = d.textlength(t1 + t2, font=f) + 30
            x = cx - w / 2
            ball(d, x + 9, y, 9)
            d.text((x + 30, y), t1, font=f, fill=WHITE, anchor="lm")
            d.text((x + 30 + d.textlength(t1, font=f), y), t2, font=f, fill=GREEN, anchor="lm")
    a, b = j["score"].split(":")
    d.text((Wd // 2, 330), f"{a} - {b}", font=font("black", 120), fill=WHITE, anchor="mm")
    d.text((Wd // 2, 430), "ÖYIN YAKUNLANDI", font=font("bold", 22), fill=(230, 235, 240), anchor="mm")
    lg = logo(64, False)
    im.paste(lg, (Wd // 2 - 32, 600), lg)
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
    # surat topilmagan yangilik: chapda klub logotiplari (asosiy klub rangida), o'ngda yirik sarlavha, tepada liga, pastda iF
    Wd, Hd = 1280, 720
    NAVY = (10, 14, 22)
    hl = get_logo(j.get("homeLogo"), 520)
    al = get_logo(j.get("awayLogo"), 130)
    c1 = main_color(hl) if hl else (40, 70, 60)
    im = Image.new("RGB", (Wd, Hd), NAVY)
    d = ImageDraw.Draw(im, "RGBA")
    for x in range(560):
        t = x / 560
        d.line([x, 0, x, Hd], fill=tuple(int(c1[i] * 0.6 * (1 - t) + NAVY[i] * t) for i in range(3)))
    if hl:
        faint = hl.copy()
        faint.putalpha(faint.split()[3].point(lambda v: v * 22 // 100))
        im.paste(faint, (-90, (Hd - faint.height) // 2), faint)
        main = hl.copy()
        main.thumbnail((180, 180), Image.LANCZOS)
        cy = 250 if al else Hd // 2
        x_, y_ = 190 - main.width // 2, cy - main.height // 2
        if is_dark(main):
            paste_glow(im, main, x_, y_, 230, 14)
        else:
            paste_glow(im, main, x_, y_, 80, 16)
        if al:
            x_, y_ = 190 - al.width // 2, 470 - al.height // 2
            if is_dark(al):
                paste_glow(im, al, x_, y_, 230, 12)
            else:
                paste_glow(im, al, x_, y_, 80, 14)
    else:
        big = logo(220, False)
        im.paste(big, (190 - 110, Hd // 2 - 110), big)
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle([560, 150, 566, 570], fill=GREEN + (255,))
    title = j.get("title") or "Inter Futbol"
    f = font("black", 54)
    lines = wrap(d, title, f, 620)
    if len(lines) > 5:
        f = font("black", 44)
        lines = wrap(d, title, f, 620)[:6]
    lh = int(f.size * 1.22)
    y = (Hd - lh * len(lines)) / 2
    for ln in lines:
        d.text((610, y), ln, font=f, fill=WHITE)
        y += lh
    paste_league_free(im, j, 120, Wd - 100, 95)
    lg = logo(56, False)
    im.paste(lg, (Wd - 70 - 28, Hd - 60 - 28), lg)
    return im


def render(j):
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
