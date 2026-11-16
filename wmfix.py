# ESKI iF BELGISINI ALMASHTIRISH (2026-11-17, Bahtiyor aka: "logoni to'liq olib tashlab, boshqatdan fonsiz logoni qo'y... hamma rasmlarni o'zgartir"):
# manba surati bilan chiqqan eski postlarda to'q kvadratli belgi rasmga qotib qolgan. Har post uchun: bot postning hozirgi rasmini beradi (/ub/postimg) ->
# belgi yashil "F" bo'yicha topiladi -> o'sha joy LaMa (big-lama, Apache-2.0) bilan fon qilib to'ldiriladi (odamlar o'zgarmaydi) ->
# yangi fonsiz belgi qo'yiladi (card.paste_mark; burchak odam boshiga tushmaydigan qilib tanlanadi) -> /ub/repimg post rasmini almashtiradi (matn va tugma saqlanadi).
import hashlib, io, json, os, sys, time, urllib.request
import numpy as np
from PIL import Image

W = "https://inter-futbol-bot.gcw808.workers.dev"


def wmbox(im):
    Wd, Hd = im.size
    s = int(min(Wd, Hd) * 0.34)
    a = np.asarray(im.crop((Wd - s, 0, Wd, s)).convert("RGB")).astype(int)
    g = (abs(a[..., 0] - 91) < 38) & (abs(a[..., 1] - 182) < 38) & (abs(a[..., 2] - 55) < 45)
    if g.sum() < 12:
        return None
    ys, xs = np.where(g)
    fx0, fx1, fy0, fy1 = np.percentile(xs, 1), np.percentile(xs, 99), np.percentile(ys, 1), np.percentile(ys, 99)
    fw, fh = fx1 - fx0 + 1, fy1 - fy0 + 1
    if fw > s * 0.5 or fh > s * 0.5 or fw < 5:
        return None
    gw, gh = fw / 0.716, fh / 0.785
    cx = (fx1 + 1 - gw / 2) + (Wd - s)
    cy = fy1 + 1 - gh / 2
    S = max(gh, gw) * 220 / 152
    if S > min(Wd, Hd) * 0.24 or cx + S / 2 < Wd * 0.8:
        return None  # belgi emas (yashil forma, maydon va h.k.)
    return [cx - S / 2, cy - S / 2, cx + S / 2, cy + S / 2]


def heads(im):
    try:
        import persons
        out = []
        for x0, y0, x1, y1, sc in persons.detect(im):
            if (y1 - y0) < im.height * 0.25:
                continue
            w = x1 - x0
            out.append((x0 + w * 0.12, y0, x1 - w * 0.12, y0 + (y1 - y0) * 0.24))
        return out
    except Exception as e:
        print("persons", e)
        return []


def corner(im):
    import card
    Wd, Hd = im.size
    s = card.mark_size(Wd)
    m = int(round(Wd * 44 / 1080))
    hs = heads(im)
    best = ("tr", 1e9)
    for pos in ("tr", "tl", "br", "bl"):
        x = m if pos in ("tl", "bl") else Wd - s - m
        y = m if pos in ("tr", "tl") else Hd - s - m
        ov = sum(max(0, min(x + s, h[2]) - max(x, h[0])) * max(0, min(y + s, h[3]) - max(y, h[1])) for h in hs)
        if ov < s * s * 0.04:
            return pos
        if ov < best[1]:
            best = (pos, ov)
    return best[0]


_L = {}


def clean(im):
    b = wmbox(im)
    if not b:
        return None
    if "m" not in _L:
        from simple_lama_inpainting import SimpleLama
        _L["m"] = SimpleLama()
    Wd, Hd = im.size
    p = max(8, (b[2] - b[0]) * 0.2)
    box = (max(0, int(b[0] - p)), max(0, int(b[1] - p)), min(Wd, int(b[2] + p + 1)), min(Hd, int(b[3] + p + 1)))
    mask = Image.new("L", (Wd, Hd), 0)
    mask.paste(255, box)
    res = _L["m"](im, mask).crop((0, 0, Wd, Hd)).convert("RGB")
    out = im.copy()
    f = max(2, int(p * 0.4))  # faqat belgi atrofi almashtiriladi, chegarasi yumshoq
    from PIL import ImageFilter
    out.paste(res, (0, 0), mask.filter(ImageFilter.GaussianBlur(f)).point(lambda v: min(255, int(v * 1.6))))
    return out


def process(im):
    import card
    c = clean(im)
    if c is None:
        return None, ""
    pos = corner(c)
    card.paste_mark(c, pos)
    return c, pos


def main():
    bot = os.environ["BOT_TOKEN"]
    key = hashlib.sha256(("ub-" + bot).encode()).hexdigest()[:40]
    H = {"x-key": key, "user-agent": "InterFutbolWmfix"}
    posts = [int(x) for x in os.environ.get("POSTS", "").replace(",", " ").split() if x.isdigit()]
    gap = int(os.environ.get("GAP", "25"))
    dry = bool(os.environ.get("DRY"))
    ok = []
    for n, mid in enumerate(posts):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(W + "/ub/postimg?id=%d" % mid, headers=H), timeout=40))
            if not j.get("f"):
                print(mid, "- rasm yo'q:", j.get("why")); continue
            fp = json.load(urllib.request.urlopen("https://api.telegram.org/bot%s/getFile?file_id=%s" % (bot, j["f"]), timeout=40))["result"]["file_path"]
            im = Image.open(io.BytesIO(urllib.request.urlopen("https://api.telegram.org/file/bot%s/%s" % (bot, fp), timeout=120).read())).convert("RGB")
            out, pos = process(im)
            if out is None:
                print(mid, "- eski belgi topilmadi, tegilmadi", im.size); continue
            buf = io.BytesIO(); out.save(buf, "JPEG", quality=94, subsampling=0)
            if dry:
                print(mid, "+ (sinov)", im.size, pos); continue
            r = urllib.request.urlopen(urllib.request.Request(W + "/ub/repimg?id=%d" % mid, data=buf.getvalue(), headers={**H, "content-type": "image/jpeg"}), timeout=60).read().decode()[:120]
            print(mid, "+", im.size, pos, r); ok.append(mid)
            if n < len(posts) - 1:
                time.sleep(gap)
        except Exception as e:
            print(mid, "- xato:", repr(e)[:200])
    print("TAYYOR:", len(ok), "ta —", ok)


if __name__ == "__main__":
    main()
