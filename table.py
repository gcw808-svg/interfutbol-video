# Inter Futbol: natijalar, turnir jadvali va to'purarlar ro'yxatini rasmga chizish (1080 kenglik)
import io, json, os, time, urllib.request
from PIL import Image, ImageDraw, ImageFilter
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


def paste_comp(im, l, cx, cy, name=""):
    # turnir logotipi fonsiz: Premier League asl rangida yengil nur bilan, boshqa to'q logotiplarning to'q qismlari oqqa aylanadi
    if not l:
        return
    l = l.copy().convert("RGBA")
    x, y = int(cx - l.width / 2), int(cy - l.height / 2)
    if "premier" in (name or "").lower():
        paste_glow(im, l, x, y, 230, 6)
        return
    if is_dark(l):
        px = l.load()
        for yy in range(l.height):
            for xx in range(l.width):
                r, g, b, a = px[xx, yy]
                if a and (max(r, g, b) + min(r, g, b)) / 510 < 0.33:
                    px[xx, yy] = (245, 247, 250, a)
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
        if r.get("hl"):
            # bizning klublar (kanal kuzatadigan klublar) yashil rang bilan ajratiladi
            d.rounded_rectangle([28, y + 3, Wd - 28, y + h - 3], radius=10, fill=GREEN + (52,))
            d.rounded_rectangle([28, y + 3, 35, y + h - 3], radius=3, fill=GREEN + (255,))
        elif r["p"] % 2:
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
        paste_comp(im, lg(j, data["comp"], 40), 72, y + 38, data["comp"])
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


# ---------- istoriya: o'yinlar jadvali (tik 1080x1920, 2026-yil 7-noyabr tasdiqlangan "1-variant") ----------
SW, SH = 1080, 1920
S_TOP, S_BOTTOM = 230, 1670  # Telegram/Instagram tugmalari yopmaydigan xavfsiz qism
S_ROW, S_HDR = 92, 70


def _sfont(w, s):
    return font(w, s)


def _sbg():
    im = Image.new("RGB", (SW, SH), (10, 14, 22))
    gl = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    g = ImageDraw.Draw(gl)
    g.ellipse([SW // 2 - 900, -650, SW // 2 + 900, 520], fill=(91, 182, 55, 34))
    g.ellipse([SW - 500, SH - 420, SW + 500, SH + 420], fill=(91, 182, 55, 22))
    gl = gl.filter(ImageFilter.GaussianBlur(160))
    im.paste(gl, (0, 0), gl)
    return im


def _sday(day):
    # "2026-yil 8-noyabr" -> "8-noyabr"
    return day.split("yil", 1)[-1].strip() if "yil" in day else day


def story_pages(j):
    # turnirlar bo'yicha birlashtiriladi (bir turnir ikki kunga bo'lingan bo'lsa ham bitta guruh)
    days = [g["day"] for g in j["groups"] for _ in g["items"] if g.get("day")]
    main_day = max(set(days), key=days.count) if days else ""
    comps, order = {}, []
    for g in j["groups"]:
        if g["comp"] not in comps:
            comps[g["comp"]] = []
            order.append(g["comp"])
        for m in g["items"]:
            comps[g["comp"]].append((m, "" if (g.get("day") or main_day) == main_day else _sday(g["day"])))
    first_top = S_TOP + 270
    pages, cur, used = [], [], 0
    rest = [(c, comps[c]) for c in order]
    while rest:
        cap = S_BOTTOM - first_top
        used, cur = 0, []
        for c, ms in rest[:]:
            h = S_HDR + S_ROW * len(ms)
            if used + h <= cap:
                cur.append((c, ms))
                used += h
                rest.remove((c, ms))
        if not cur:
            # bitta turnirning o'zi sig'masa, bo'lib yuboriladi
            c, ms = rest[0]
            k = max(1, (cap - S_HDR) // S_ROW)
            cur = [(c, ms[:k])]
            rest[0] = (c, ms[k:])
        pages.append(cur)
    return pages, main_day


def render_story(j):
    pages, main_day = story_pages(j)
    out = []
    for pi, pg in enumerate(pages, 1):
        im = _sbg()
        d = ImageDraw.Draw(im, "RGBA")
        x0 = 60
        d.text((x0, S_TOP), "ÖYINLAR", font=_sfont("black", 84), fill=WHITE, anchor="lt")
        d.text((x0, S_TOP + 94), "JADVALI", font=_sfont("black", 84), fill=GREEN, anchor="lt")
        sub = ((main_day + " · ") if main_day else "") + "Toşkent vaqti bilan"
        d.text((x0, S_TOP + 200), sub, font=_sfont("bold", 34), fill=(168, 179, 194), anchor="lm")
        d.rounded_rectangle([x0, S_TOP + 246, x0 + 140, S_TOP + 252], radius=3, fill=GREEN + (255,))
        if len(pages) > 1:
            t = f"{pi}/{len(pages)}"
            f = _sfont("black", 30)
            w = d.textlength(t, font=f) + 44
            d.rounded_rectangle([SW - 60 - w, S_TOP + 10, SW - 60, S_TOP + 62], radius=26, fill=WHITE + (255,))
            d.text((SW - 60 - w / 2, S_TOP + 36), t, font=f, fill=(10, 14, 22), anchor="mm")
        y = S_TOP + 270
        for comp, ms in pg:
            paste_comp(im, lg(j, comp, 46), x0 + 23, y + 36, comp)
            d = ImageDraw.Draw(im, "RGBA")
            d.text((x0 + 62, y + 36), comp.upper(), font=_sfont("black", 30), fill=(221, 227, 234), anchor="lm")
            y += S_HDR
            for m, nd in ms:
                top_, bot_ = y + 7, y + S_ROW - 7
                cy = (top_ + bot_) // 2
                d.rounded_rectangle([x0, top_, SW - x0, bot_], radius=18, fill=(255, 255, 255, 14), outline=(255, 255, 255, 20), width=1)
                cx = SW // 2
                pw = 146
                d.rounded_rectangle([cx - pw // 2, cy - 30, cx + pw // 2, cy + 30], radius=12, fill=GREEN + (255,))
                tt = m.get("s") or m.get("t") or ""
                if nd:
                    d.text((cx, cy - 7), tt, font=_sfont("black", 34), fill=(10, 14, 22), anchor="mm")
                    d.text((cx, cy + 19), nd, font=_sfont("black", 15), fill=(10, 14, 22), anchor="mm")
                else:
                    d.text((cx, cy), tt, font=_sfont("black", 38), fill=(10, 14, 22), anchor="mm")
                paste_logo(im, lg(j, m["h"], 50), cx - pw // 2 - 36, cy)
                paste_logo(im, lg(j, m["a"], 50), cx + pw // 2 + 36, cy)
                d = ImageDraw.Draw(im, "RGBA")
                fn = _sfont("bold", 30)
                d.text((cx - pw // 2 - 72, cy), clip(d, m["h"], fn, 300), font=fn, fill=WHITE, anchor="rm")
                d.text((cx + pw // 2 + 72, cy), clip(d, m["a"], fn, 300), font=fn, fill=WHITE, anchor="lm")
                y += S_ROW
        l = logo(86, False)
        im.paste(l, (SW // 2 - 43, SH - 150 - 86), l)
        buf = io.BytesIO()
        im.convert("RGB").save(buf, "JPEG", quality=92)
        out.append(buf.getvalue())
    return out


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
        if j.get("multi"):
            # bir nechta liga jadvali bitta albom uchun: har biri alohida rasm
            pages = []
            for sj in j["multi"]:
                pages += render_pages({**sj, "logos": j.get("logos") or {}, "L": j["L"]})
        else:
            pages = render_pages(j)
        if j.get("story") and j.get("kind") == "matches" and not j.get("multi"):
            # tik istoriya (Telegram + Instagram): oddiy rasmdan oldin yuboriladi
            try:
                for i, jpg in enumerate(render_story(j)):
                    if i:
                        time.sleep(45)  # Telegram istoriyalari tartibi buzilmasin
                    for k in range(3):  # tarmoq xatosida 3 marta urinadi
                        try:
                            wapi(f"/ub/simg?id={job}&n={i}", jpg, "image/jpeg")
                            break
                        except Exception as e:
                            print("istoriya qayta", k, e)
                            time.sleep(10)
            except Exception as e:
                print("istoriya xato", e)
        for i, png in enumerate(pages):
            wapi(f"/ub/timg?id={job}&last={1 if i == len(pages) - 1 else 0}", png, "image/png")
