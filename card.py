# Inter Futbol: rasm topilmagan yangilik uchun mavzuga mos kartochka (1280x720)
import glob, hashlib, io, json, os, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BOT = os.environ.get("BOT_TOKEN", "")
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
GREEN = (91, 182, 55)
WHITE = (245, 247, 250)


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
        req = urllib.request.Request(url, headers={"user-agent": "InterFutbolCard"})
        with urllib.request.urlopen(req, timeout=30) as r:
            im = Image.open(io.BytesIO(r.read())).convert("RGBA")
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


def whiten(lg):
    # to'q rangli logotip to'q fonda ko'rinishi uchun oq (monoxrom) variantda
    w = Image.new("RGBA", lg.size, (255, 255, 255, 0))
    w.putalpha(lg.split()[3])
    return w


def shade_v(im, top=90, bottom=200):
    Wd, Hd = im.size
    sh = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for y in range(Hd):
        sd.line([0, y, Wd, y], fill=(5, 8, 14, int(top + (bottom - top) * y / Hd)))
    im.paste(sh, (0, 0), sh)


def deep(c, k=0.55):
    return tuple(int(v * k) for v in c)


def render_split(j, v=1):
    # uslub 2 oilasi: jamoalar ranglari; v=1 qiya, 2 tik, 3 suv belgisi, 4 shisha panel, 5 yon chiziqlar
    Wd, Hd = 1280, 720
    hl, al = get_logo(j.get("homeLogo"), 230), get_logo(j.get("awayLogo"), 230)
    c1 = main_color(hl) if hl else (30, 60, 140)
    c2 = main_color(al) if al else (140, 30, 40)
    im = Image.new("RGB", (Wd, Hd), c1)
    d = ImageDraw.Draw(im, "RGBA")
    if v == 1:
        d.polygon([(Wd // 2 + 110, 0), (Wd, 0), (Wd, Hd), (Wd // 2 - 110, Hd)], fill=c2 + (255,))
        shade_v(im)
        d = ImageDraw.Draw(im, "RGBA")
        d.line([(Wd // 2 + 110, 0), (Wd // 2 - 110, Hd)], fill=(255, 255, 255, 60), width=4)
    elif v == 2:
        px = im.load()
        for x in range(Wd):
            t = min(1, max(0, (x - Wd * 0.42) / (Wd * 0.16)))
            col = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
            for y in range(Hd):
                px[x, y] = col
        shade_v(im, 110, 210)
    elif v == 3:
        d.rectangle([Wd // 2, 0, Wd, Hd], fill=c2 + (255,))
        for lg_, cx in ((hl, 120), (al, Wd - 120)):
            if lg_:
                big = lg_.resize((lg_.width * 3, lg_.height * 3), Image.LANCZOS)
                a = big.split()[3].point(lambda p: p * 22 // 255)
                big.putalpha(a)
                im.paste(big, (cx - big.width // 2, Hd // 2 - big.height // 2), big)
        shade_v(im, 100, 200)
    elif v == 4:
        d.rectangle([Wd // 2, 0, Wd, Hd], fill=c2 + (255,))
        im = im.filter(ImageFilter.GaussianBlur(60))
        shade_v(im, 80, 170)
        panel = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
        pd = ImageDraw.Draw(panel)
        pd.rounded_rectangle([60, 160, Wd - 60, 570], radius=36, fill=(255, 255, 255, 26), outline=(255, 255, 255, 60), width=2)
        im.paste(panel, (0, 0), panel)
    else:
        im = Image.new("RGB", (Wd, Hd), (12, 15, 22))
        d = ImageDraw.Draw(im, "RGBA")
        for cx, c in ((250, c1), (Wd - 250, c2)):
            gl = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
            ImageDraw.Draw(gl).ellipse([cx - 230, 330 - 230, cx + 230, 330 + 230], fill=c + (150,))
            gl = gl.filter(ImageFilter.GaussianBlur(70))
            im.paste(gl, (0, 0), gl)
        d = ImageDraw.Draw(im, "RGBA")
        d.rectangle([0, 0, 14, Hd], fill=c1 + (255,))
        d.rectangle([Wd - 14, 0, Wd, Hd], fill=c2 + (255,))
    d = ImageDraw.Draw(im, "RGBA")
    ll = get_logo(j.get("leagueLogo"), 104)
    if ll:
        if is_dark(ll):
            ll = whiten(ll)
        im.paste(ll, (Wd // 2 - ll.width // 2, 80 - ll.height // 2), ll)
    for colx, lg_, name in ((250, hl, j["home"]), (Wd - 250, al, j["away"])):
        if lg_:
            paste_glow(im, lg_, colx - lg_.width // 2, 340 - lg_.height // 2, 120, 22)
        nf = fit(d, name.upper(), "black", 400, 44)
        d.text((colx, 510), name.upper(), font=nf, fill=WHITE, anchor="mm")
    a, b = j["score"].split(":")
    if v in (1, 3):
        d.rounded_rectangle([Wd // 2 - 150, 265, Wd // 2 + 150, 415], radius=26, fill=(255, 255, 255, 240))
        d.text((Wd // 2, 340), f"{a} : {b}", font=font("black", 112), fill=(12, 16, 24), anchor="mm")
    elif v == 2:
        d.text((Wd // 2, 340), f"{a}:{b}", font=font("black", 150), fill=WHITE, anchor="mm")
    elif v == 4:
        d.text((Wd // 2, 340), f"{a} - {b}", font=font("black", 130), fill=WHITE, anchor="mm")
    else:
        tf = font("black", 120)
        for x, txt in ((Wd // 2 - 142, a), (Wd // 2 + 32, b)):
            d.rounded_rectangle([x, 265, x + 110, 415], radius=18, fill=(255, 255, 255, 235))
            d.text((x + 55, 336), txt, font=tf, fill=(12, 16, 24), anchor="mm")
        d.text((Wd // 2, 334), ":", font=font("black", 90), fill=WHITE, anchor="mm")
    d.text((Wd // 2, 450), "\u00d6YIN YAKUNLANDI", font=font("bold", 24), fill=(225, 230, 236), anchor="mm")
    lg = logo(78, False)
    im.paste(lg, (Wd // 2 - 39, 600), lg)
    return im


def render_light(j):
    # uslub 3: oq, minimal, gazeta uslubi
    Wd, Hd = 1280, 720
    im = Image.new("RGB", (Wd, Hd), (246, 247, 249))
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle([0, 0, Wd, 120], fill=(14, 20, 30, 255))
    d.rectangle([0, 120, Wd, 128], fill=GREEN + (255,))
    league = (j.get("league") or "").upper()
    ll = get_logo(j.get("leagueLogo"), 64)
    x = 72
    if ll:
        paste_league(im, ll, x, 60 - ll.height // 2, 120, 10)
        x += ll.width + 34
    d.text((x, 60), league or "NATIJA", font=font("black", 34), fill=WHITE, anchor="lm")
    lg = logo(84)
    im.paste(lg, (Wd - 60 - 84, 18), lg)
    hl, al = get_logo(j.get("homeLogo"), 220), get_logo(j.get("awayLogo"), 220)
    for colx, lg_, name in ((270, hl, j["home"]), (Wd - 270, al, j["away"])):
        if lg_:
            im.paste(lg_, (colx - lg_.width // 2, 360 - lg_.height // 2), lg_)
        nf = fit(d, name.upper(), "black", 420, 42)
        d.text((colx, 535), name.upper(), font=nf, fill=(14, 20, 30), anchor="mm")
    a, b = j["score"].split(":")
    d.text((Wd // 2, 350), f"{a}-{b}", font=font("black", 150), fill=(14, 20, 30), anchor="mm")
    d.rounded_rectangle([Wd // 2 - 120, 452, Wd // 2 + 120, 492], radius=20, fill=GREEN + (255,))
    d.text((Wd // 2, 472), "YAKUNLANDI", font=font("bold", 24), fill=WHITE, anchor="mm")
    return im


def render(j):
    st = j.get("style") or "dark"
    if st != "dark" and j.get("score") and j.get("home") and j.get("away"):
        if st.startswith("split"):
            im = render_split(j, int(st[5:] or 1))
        else:
            im = render_light(j)
        buf = io.BytesIO()
        im.save(buf, "PNG", optimize=True)
        return buf.getvalue()
    Wd, Hd = 1280, 720
    im = background(Wd, Hd)
    d = ImageDraw.Draw(im, "RGBA")
    league = (j.get("league") or "").upper()
    lx = 60
    ll = get_logo(j.get("leagueLogo"), 70)
    if ll:
        paste_league(im, ll, 60 + (90 - ll.width) // 2, 81 - ll.height // 2)
        lx = 166
    if league:
        f = font("bold", 30)
        tw = d.textlength(league, font=f)
        d.rounded_rectangle([lx, 56, lx + tw + 44, 106], radius=25, fill=GREEN + (255,))
        d.text((lx + 22, 81), league, font=f, fill=(10, 20, 12), anchor="lm")
    hl, al = get_logo(j.get("homeLogo"), 190), get_logo(j.get("awayLogo"), 190)
    if j.get("score") and j.get("home") and j.get("away") and (hl or al):
        a, b = j["score"].split(":")
        cx, cy = Wd // 2, Hd // 2 + 10
        tf = font("black", 130)
        cw, ch = 125, 170
        for x, txt in ((cx - 18 - cw * len(a), a), (cx + 18, b)):
            wbox = cw * len(txt)
            d.rounded_rectangle([x, cy - ch // 2, x + wbox, cy + ch // 2], radius=20, fill=(18, 22, 30, 255))
            d.rectangle([x, cy + ch // 2 - 12, x + wbox, cy + ch // 2], fill=GREEN + (255,))
            d.text((x + wbox / 2, cy - 4), txt, font=tf, fill=WHITE, anchor="mm")
        d.text((cx, cy - 6), ":", font=font("black", 96), fill=WHITE, anchor="mm")
        for colx, lg_, name in ((250, hl, j["home"]), (Wd - 250, al, j["away"])):
            if lg_:
                paste_glow(im, lg_, colx - lg_.width // 2, cy - 40 - lg_.height // 2 - 30)
            nf = fit(d, name.upper(), "black", 380, 46)
            d.text((colx, cy + 120), name.upper(), font=nf, fill=WHITE, anchor="mm")
        d.text((cx, cy + ch // 2 + 50), "ÖYIN YAKUNLANDI", font=font("bold", 28), fill=(180, 190, 200), anchor="mm")
    elif j.get("score") and j.get("home") and j.get("away"):
        a, b = j["score"].split(":")
        # tablo
        tf = font("black", 150)
        cw, ch = 150, 200
        cx, cy = Wd // 2, Hd // 2 - 10
        boxes = [(cx - 20 - cw * len(a), a), (cx + 20, b)]
        for x, txt in boxes:
            wbox = cw * len(txt)
            d.rounded_rectangle([x, cy - ch // 2, x + wbox, cy + ch // 2], radius=22, fill=(18, 22, 30, 255))
            d.rectangle([x, cy + ch // 2 - 14, x + wbox, cy + ch // 2], fill=GREEN + (255,))
            d.text((x + wbox / 2, cy - 4), txt, font=tf, fill=WHITE, anchor="mm")
        d.text((cx, cy - 6), ":", font=font("black", 110), fill=WHITE, anchor="mm")
        left_edge = cx - 20 - cw * len(a) - 40
        right_edge = cx + 20 + cw * len(b) + 40
        nf_l = fit(d, j["home"].upper(), "black", left_edge - 60, 64)
        nf_r = fit(d, j["away"].upper(), "black", Wd - 60 - right_edge, 64)
        d.text((left_edge, cy), j["home"].upper(), font=nf_l, fill=WHITE, anchor="rm")
        d.text((right_edge, cy), j["away"].upper(), font=nf_r, fill=WHITE, anchor="lm")
        d.text((cx, cy + ch // 2 + 50), "ÖYIN YAKUNLANDI", font=font("bold", 30), fill=(180, 190, 200), anchor="mm")
    else:
        title = j.get("title") or "Inter Futbol"
        f = font("black", 64)
        lines = wrap(d, title, f, Wd - 160)
        if len(lines) > 4:
            f = font("black", 52)
            lines = wrap(d, title, f, Wd - 160)[:5]
        lh = int(f.size * 1.18)
        y = Hd // 2 - lh * len(lines) // 2 + 10
        d.rectangle([60, y + 6, 70, y + lh * len(lines) - 14], fill=GREEN + (255,))
        for i, ln in enumerate(lines):
            d.text((96, y + i * lh), ln, font=f, fill=WHITE)
    lg = logo(96)
    im.paste(lg, (Wd - 60 - 96, 40), lg)
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
    else:
        open("t1.png", "wb").write(render({"title": "Barcelona Alavesni 6:1 hisobida yengdi", "home": "Barcelona", "away": "Alavés", "score": "6:1", "league": "LaLiga"}))
        open("t2.png", "wb").write(render({"title": "Rodri Real örniga Barcelonani tanladi", "league": "LaLiga"}))
        open("t3.png", "wb").write(render({"title": "Manchester United Chelseaga qarşi öyinda mağlub böldi", "home": "Chelsea", "away": "Manchester United", "score": "2:0", "league": "Premier League"}))
