# Inter Futbol: natijalar, turnir jadvali va to'purarlar ro'yxatini rasmga chizish (1080 kenglik)
import io, json, os, urllib.request
from PIL import Image, ImageDraw
import card
from card import font, xfont, get_logo, paste_glow, is_dark, logo, WHITE, GREEN, W, KEY

Wd = 1080
GREY = (150, 160, 172)
ROW_BG = (255, 255, 255, 12)
MAX_H = 2400  # bitta rasmdagi ro'yxat qismining eng katta balandligi


def wapi(path, data=None, ctype="application/json"):
    req = urllib.request.Request(W + path, data=data, headers={"x-key": KEY, "content-type": ctype, "user-agent": "InterFutbolTable"}, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read() or b"{}")


LOGO_CACHE = {}


def lg(j, name, size):
    u = (j.get("logos") or {}).get(name)
    if not u:
        return None
    k = (u, size)
    if k not in LOGO_CACHE:
        LOGO_CACHE[k] = get_logo(u, size)
    return LOGO_CACHE[k]


def paste_logo(im, l, cx, cy):
    if not l:
        return
    x, y = int(cx - l.width / 2), int(cy - l.height / 2)
    if is_dark(l):
        paste_glow(im, l, x, y, 220, 6)
    else:
        im.paste(l, (x, y), l)


def name_font(text, size):
    return xfont("oswald-latin-700-normal.woff", size, text)


def clip(d, text, f, maxw):
    if d.textlength(text, font=f) <= maxw:
        return text
    while text and d.textlength(text + "…", font=f) > maxw:
        text = text[:-1]
    return text.rstrip() + "…"


def background(h):
    im = Image.new("RGB", (Wd, h))
    px = ImageDraw.Draw(im)
    for y in range(h):
        t = y / max(1, h)
        px.line([0, y, Wd, y], fill=(int(14 - 6 * t), int(22 - 8 * t), int(38 - 14 * t)))
    return im


def header(im, j, sub=""):
    d = ImageDraw.Draw(im, "RGBA")
    title = j.get("title") or ""
    x = 48
    if j.get("league"):
        l = lg(j, j["league"], 92)
        if l:
            paste_logo(im, l, 48 + 46, 78)
            x = 48 + 92 + 26
    d.text((x, 62 if sub else 78), title.upper() if j["kind"] != "matches" else title, font=font("black", 40), fill=WHITE, anchor="lm")
    if sub:
        d.text((x, 104), sub, font=font("bold", 24), fill=GREY, anchor="lm")
    d.rectangle([0, 150, Wd, 154], fill=GREEN + (255,))
    return 182


def footer(im, h):
    l = logo(64, False)
    im.paste(l, (Wd // 2 - 32, h - 86), l)


# ---------- turnir jadvali ----------
def standings_blocks(j):
    L = j["L"]
    blocks = []
    for g in j["groups"]:
        if g.get("name"):
            blocks.append(("ghead", 60, g["name"]))
        blocks.append(("shead", 44, L))
        for r in g["rows"]:
            blocks.append(("srow", 50, r))
    return blocks


COLS = [("pl", 700), ("w", 772), ("d", 830), ("l", 888), ("gd", 960), ("pts", 1036)]


def draw_standings(im, d, j, kind, y, h, data):
    if kind == "ghead":
        d.text((48, y + 34), data.upper(), font=font("black", 28), fill=WHITE, anchor="lm")
    elif kind == "shead":
        for k, x in COLS:
            d.text((x, y + 24), data[k], font=font("bold", 20), fill=GREY, anchor="mm")
    else:
        r = data
        if r["p"] % 2:
            d.rounded_rectangle([28, y + 3, Wd - 28, y + h - 3], radius=10, fill=ROW_BG)
        d.text((86, y + h // 2), str(r["p"]), font=font("bold", 24), fill=GREY, anchor="rm")
        paste_logo(im, lg(j, r["n"], 36), 130, y + h // 2)
        f = name_font(r["n"], 28)
        d.text((166, y + h // 2), clip(d, r["n"], f, 500), font=f, fill=WHITE, anchor="lm")
        vals = {"pl": r["g"], "w": r.get("w"), "d": r.get("d"), "l": r.get("l"), "gd": (("+" if (r["gd"] or 0) > 0 else "") + str(r["gd"])), "pts": r["pts"]}
        for k, x in COLS:
            v = vals[k]
            d.text((x, y + h // 2), "" if v is None else str(v), font=font("black" if k == "pts" else "bold", 28 if k == "pts" else 24), fill=WHITE if k == "pts" else (210, 216, 224), anchor="mm")


# ---------- natijalar / o'yinlar ----------
def matches_blocks(j):
    blocks = []
    multi = len({g["day"] for g in j["groups"]}) > 1 or bool(j.get("showDay"))
    for g in j["groups"]:
        blocks.append(("mhead", 70, {"comp": g["comp"], "day": g["day"] if multi else ""}))
        for m in g["items"]:
            blocks.append(("mrow", 62 if not m.get("st") else 74, m))
    return blocks


def draw_matches(im, d, j, kind, y, h, data):
    if kind == "mhead":
        paste_logo(im, lg(j, data["comp"], 40), 72, y + 38)
        d.text((108, y + 38), data["comp"], font=font("black", 30), fill=WHITE, anchor="lm")
        if data["day"]:
            d.text((Wd - 48, y + 38), data["day"], font=font("bold", 22), fill=GREY, anchor="rm")
        d.line([48, y + h - 4, Wd - 48, y + h - 4], fill=(255, 255, 255, 40), width=2)
        return
    m = data
    cy = y + 31
    cx = Wd // 2
    d.rounded_rectangle([28, y + 3, Wd - 28, y + h - 3], radius=12, fill=ROW_BG)
    if m["s"]:
        d.rounded_rectangle([cx - 62, cy - 22, cx + 62, cy + 22], radius=10, fill=(255, 255, 255, 235))
        d.text((cx, cy), m["s"].replace(":", " : "), font=font("black", 30), fill=(12, 16, 24), anchor="mm")
    else:
        d.rounded_rectangle([cx - 62, cy - 22, cx + 62, cy + 22], radius=10, outline=(255, 255, 255, 120), width=2)
        d.text((cx, cy), m["t"], font=font("bold", 26), fill=WHITE, anchor="mm")
    paste_logo(im, lg(j, m["h"], 38), cx - 100, cy)
    paste_logo(im, lg(j, m["a"], 38), cx + 100, cy)
    fh, fa = name_font(m["h"], 26), name_font(m["a"], 26)
    d.text((cx - 134, cy), clip(d, m["h"], fh, 330), font=fh, fill=WHITE, anchor="rm")
    d.text((cx + 134, cy), clip(d, m["a"], fa, 330), font=fa, fill=WHITE, anchor="lm")
    if m.get("st"):
        d.text((cx, cy + 34), m["st"], font=font("bold", 18), fill=GREY, anchor="mm")


# ---------- to'purarlar ----------
def scorers_blocks(j):
    return [("chead", 44, j["L"])] + [("crow", 64, r) for r in j["rows"]]


def draw_scorers(im, d, j, kind, y, h, data):
    if kind == "chead":
        d.text((166, y + 24), data["player"], font=font("bold", 20), fill=GREY, anchor="lm")
        d.text((1010, y + 24), data["goals"], font=font("bold", 20), fill=GREY, anchor="mm")
        return
    r = data
    if r["p"] % 2:
        d.rounded_rectangle([28, y + 3, Wd - 28, y + h - 3], radius=10, fill=ROW_BG)
    d.text((86, y + h // 2), str(r["p"]), font=font("bold", 24), fill=GREY, anchor="rm")
    paste_logo(im, lg(j, r["t"], 40), 130, y + h // 2)
    f = name_font(r["n"], 28)
    d.text((166, y + 22), clip(d, r["n"], f, 720), font=f, fill=WHITE, anchor="lm")
    d.text((166, y + 48), r["t"], font=font("bold", 18), fill=GREY, anchor="lm")
    d.text((1010, y + h // 2), str(r["goals"]), font=font("black", 32), fill=WHITE, anchor="mm")


# ---------- barcha klub va ligalar katalogi ----------
def catalog_blocks(j):
    blocks = []
    for g in j["groups"]:
        blocks.append(("ghead", 64, g["title"]))
        it = g["items"]
        for i in range(0, len(it), 3):
            blocks.append(("grow", 64, it[i:i + 3]))
    return blocks


def draw_catalog(im, d, j, kind, y, h, data):
    if kind == "ghead":
        d.text((48, y + 36), data.upper(), font=font("black", 28), fill=WHITE, anchor="lm")
        d.line([48, y + h - 6, Wd - 48, y + h - 6], fill=(255, 255, 255, 40), width=2)
        return
    for i, n in enumerate(data):
        x = 32 + i * 340
        d.rounded_rectangle([x, y + 4, x + 328, y + h - 4], radius=12, fill=ROW_BG)
        paste_logo(im, lg(j, n, 40), x + 34, y + h // 2)
        f = name_font(n, 22)
        d.text((x + 64, y + h // 2), clip(d, n, f, 255), font=f, fill=WHITE, anchor="lm")


def render_pages(j):
    kind = j["kind"]
    blocks = {"standings": standings_blocks, "matches": matches_blocks, "scorers": scorers_blocks, "catalog": catalog_blocks}[kind](j)
    draw = {"standings": draw_standings, "matches": draw_matches, "scorers": draw_scorers, "catalog": draw_catalog}[kind]
    # iloji bo'lsa bitta rasm; sig'masa ro'yxat 2 yoki 3 ta teng qismga bo'linadi
    total = sum(b[1] for b in blocks)
    k = max(1, -(-total // MAX_H))
    target = total / k
    pages, cur, hsum = [], [], 0
    for i, b in enumerate(blocks):
        heads = ("ghead", "shead", "mhead", "chead")
        if cur and len(pages) < k - 1 and hsum + b[1] / 2 > target and cur[-1][0] not in heads:
            pages.append(cur)
            cur, hsum = [], 0
            if b[0] == "srow":  # yangi qismda ham ustun sarlavhasi bo'lsin
                cur.append(("shead", 44, j["L"]))
                hsum += 44
        cur.append(b)
        hsum += b[1]
    if cur:
        pages.append(cur)
    out = []
    for i, pg in enumerate(pages):
        h = 182 + sum(b[1] for b in pg) + 130
        im = background(h)
        sub = f"{i + 1}/{len(pages)}" if len(pages) > 1 else j.get("sub", "")
        y = header(im, j, sub)
        d = ImageDraw.Draw(im, "RGBA")
        for k, bh, data in pg:
            draw(im, d, j, k, y, bh, data)
            y += bh
        footer(im, h)
        buf = io.BytesIO()
        im.save(buf, "PNG", optimize=True)
        out.append(buf.getvalue())
    return out


if __name__ == "__main__":
    job = os.environ.get("JOB")
    j = wapi("/ub/tjob?id=" + job)
    if j:
        pages = render_pages(j)
        for i, png in enumerate(pages):
            wapi(f"/ub/timg?id={job}&last={1 if i == len(pages) - 1 else 0}", png, "image/png")
