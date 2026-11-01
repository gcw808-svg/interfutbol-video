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


def logo(size):
    K = 4
    S = 220 * K
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=36 * K, fill=(20, 22, 30, 230))
    x0, y0, x1, y1 = 175, 103, 1065, 1044
    pad = 34 * K
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


def render(j):
    Wd, Hd = 1280, 720
    im = background(Wd, Hd)
    d = ImageDraw.Draw(im, "RGBA")
    league = (j.get("league") or "").upper()
    if league:
        f = font("bold", 30)
        tw = d.textlength(league, font=f)
        d.rounded_rectangle([60, 56, 60 + tw + 44, 106], radius=25, fill=GREEN + (255,))
        d.text((82, 81), league, font=f, fill=(10, 20, 12), anchor="lm")
    if j.get("score") and j.get("home") and j.get("away"):
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
    d.text((Wd - 60, Hd - 50), "@Inter_Futbol_TV", font=font("med", 28), fill=(200, 208, 216), anchor="rm")
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
