# ESKI iF BELGISINI ALMASHTIRISH (2026-11-17, Bahtiyor aka: "logoni to'liq olib tashlab, boshqatdan fonsiz logoni qo'y... hamma rasmlarni o'zgartir"):
# manba surati bilan chiqqan eski postlarda to'q kvadratli belgi rasmga qotib qolgan. Har post uchun: bot postning hozirgi rasmini beradi (/ub/postimg) ->
# belgi yashil "F" bo'yicha topiladi -> o'sha joy LaMa (big-lama, Apache-2.0) bilan fon qilib to'ldiriladi (odamlar o'zgarmaydi) ->
# yangi fonsiz belgi qo'yiladi (card.paste_mark; burchak odam boshiga tushmaydigan qilib tanlanadi) -> /ub/repimg post rasmini almashtiradi (matn va tugma saqlanadi).
import base64, hashlib, io, json, os, sys, time, urllib.request
import numpy as np
from PIL import Image

W = "https://inter-futbol-bot.gcw808.workers.dev"


def wmbox(im):
    # yashil "F" — o'ng yuqori burchakka eng yaqin, shakli mos (eni/bo'yi ~0,86) yashil bo'lak; chapida oq "i" ustuni bo'lishi shart
    import cv2
    Wd, Hd = im.size
    s = int(min(Wd, Hd) * 0.34)
    a = np.asarray(im.crop((Wd - s, 0, Wd, s)).convert("RGB")).astype(int)
    g = ((abs(a[..., 0] - 91) < 38) & (abs(a[..., 1] - 182) < 38) & (abs(a[..., 2] - 55) < 45)).astype(np.uint8)
    kk = max(3, int(s * 0.05)) | 1
    gc = cv2.morphologyEx(g, cv2.MORPH_CLOSE, np.ones((kk, 3), np.uint8))  # "F" ikki bo'lakdan iborat — tik yo'nalishda birlashtiriladi
    n, lab, st, _ = cv2.connectedComponentsWithStats(gc, connectivity=8)
    best = None
    for k in range(1, n):
        x, y, w, h, ar = [int(v) for v in st[k]]
        if w < 6 or h < 6 or w > s * 0.5 or h > s * 0.5 or not (0.55 <= w / h <= 1.25) or not (0.25 <= ar / (w * h) <= 0.8):
            continue
        ix0, ix1 = max(0, int(x - w * 0.42)), max(1, int(x - w * 0.10))
        col = a[y:y + h, ix0:ix1]
        if col.size == 0 or (col.min(axis=2) > 185).mean() < 0.45:
            continue  # chapida oq "i" yo'q — belgi emas
        d = (s - (x + w)) + y  # burchakka yaqinlik
        if best is None or d < best[0]:
            best = (d, x, y, w, h)
    if not best:
        return None
    _, x, y, fw, fh = best
    gw, gh = fw / 0.716, fh / 0.785
    cx = (x + fw - gw / 2) + (Wd - s)
    cy = y + fh - gh / 2
    S = max(gh, gw) * 220 / 152
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
    # belgi joyi: odam boshiga tushmaydigan burchak; bir nechta bo'lsa — tepa o'ng afzal, lekin u yerda mayda tafsilot ko'p bo'lsa (gerb, yozuv)
    # eng "tinch" burchak olinadi (310-post: belgi formadagi klub gerbi ustiga tushgan edi, 2026-11-17)
    import card, cv2
    Wd, Hd = im.size
    s = card.mark_size(Wd)
    m = int(round(Wd * 44 / 1080))
    hs = heads(im)
    lap = np.abs(cv2.Laplacian(cv2.cvtColor(np.asarray(im.convert("RGB")), cv2.COLOR_RGB2GRAY), cv2.CV_32F, ksize=3))
    sc = {}
    for pos in ("tr", "tl", "br", "bl"):
        x = m if pos in ("tl", "bl") else Wd - s - m
        y = m if pos in ("tr", "tl") else Hd - s - m
        ov = sum(max(0, min(x + s, h[2]) - max(x, h[0])) * max(0, min(y + s, h[3]) - max(y, h[1])) for h in hs) / float(s * s)
        sc[pos] = (ov, float(lap[max(0, y):y + s, max(0, x):x + s].mean()))
    free = [p for p in sc if sc[p][0] < 0.04]
    if not free:
        return min(sc, key=lambda p: sc[p][0])
    calm = min(sc[p][1] for p in free)
    if "tr" in free and sc["tr"][1] <= max(calm * 2.2, calm + 6):
        return "tr"
    return min(free, key=lambda p: sc[p][1])


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
    # TEZLIK (2026-11-17): model butun rasmda emas, belgi atrofidagi bo'lakda ishlaydi (2560 px rasmda 30 soniya o'rniga 2-3 soniya — GitHub daqiqalari tejaladi)
    side = int(max(384, (box[2] - box[0]) * 4.5))
    side = min(side, Wd, Hd) // 8 * 8
    cx0 = min(max(0, (box[0] + box[2]) // 2 - side // 2), Wd - side)
    cy0 = min(max(0, (box[1] + box[3]) // 2 - side // 2), Hd - side)
    reg = (cx0, cy0, cx0 + side, cy0 + side)
    sub = im.crop(reg)
    k = min(1.0, 768 / side)  # juda katta bo'lak kichraytirib ishlanadi, keyin faqat belgi joyi qaytariladi
    if k < 1:
        ss = int(side * k) // 8 * 8
        r0 = _L["m"](sub.resize((ss, ss), Image.LANCZOS), mask.crop(reg).resize((ss, ss), Image.NEAREST)).crop((0, 0, ss, ss)).convert("RGB").resize((side, side), Image.LANCZOS)
    else:
        r0 = _L["m"](sub, mask.crop(reg)).crop((0, 0, side, side)).convert("RGB")
    res = im.copy()
    res.paste(r0, reg[:2])
    out = im.copy()
    f = max(2, int(p * 0.4))  # faqat belgi atrofi almashtiriladi, chegarasi yumshoq
    from PIL import ImageFilter
    out.paste(res, (0, 0), mask.filter(ImageFilter.GaussianBlur(f)).point(lambda v: min(255, int(v * 1.6))))
    return out


def process(im, force=""):
    import card
    c = clean(im)
    if c is None:
        return None, ""
    pos = force or corner(c)
    card.paste_mark(c, pos)
    return c, pos


def main():
    bot = os.environ["BOT_TOKEN"]
    key = hashlib.sha256(("ub-" + bot).encode()).hexdigest()[:40]
    H = {"x-key": key, "user-agent": "InterFutbolWmfix"}
    posts = [int(x) for x in os.environ.get("POSTS", "").replace(",", " ").split() if x.isdigit()]
    gap = int(os.environ.get("GAP", "25"))
    dry = bool(os.environ.get("DRY"))
    FORCE = {int(a): b for a, b in (x.split(":") for x in os.environ.get("POS", "").split() if ":" in x)}  # POS="310:bl 136:tl" — burchakni qo'lda berish
    ok = []; fail = []
    for n, mid in enumerate(posts):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(W + "/ub/postimg?raw=1&id=%d" % mid, headers=H), timeout=40))
            if not j.get("f"):
                print(mid, "- rasm yo'q:", j.get("why")); continue
            fp = json.load(urllib.request.urlopen("https://api.telegram.org/bot%s/getFile?file_id=%s" % (bot, j["f"]), timeout=40))["result"]["file_path"]
            im = Image.open(io.BytesIO(urllib.request.urlopen("https://api.telegram.org/file/bot%s/%s" % (bot, fp), timeout=120).read())).convert("RGB")
            src = os.path.join("tmpimg", "wm_%d.jpg" % mid)  # qo'lda tuzatish: omborga qo'yilgan eski belgili nusxa (post rasmi allaqachon almashgan bo'lsa)
            if os.path.exists(src):
                im = Image.open(src).convert("RGB")
            out, pos = process(im, FORCE.get(mid, ""))
            if out is None:
                print(mid, "- eski belgi topilmadi, tegilmadi", im.size); continue
            if max(out.size) > 1920:  # juda katta rasm bot so'roviga og'irlik qiladi (503) — Telegram baribir 1280–2560 gacha siqadi
                kk = 1920 / max(out.size); out = out.resize((int(out.width * kk + .5), int(out.height * kk + .5)), Image.LANCZOS)
            buf = io.BytesIO(); out.save(buf, "JPEG", quality=92)
            if dry:
                print(mid, "+ (sinov)", im.size, pos); continue
            h2 = ""
            if j.get("html"):  # og'ir matn ishlovi alohida so'rovda — xato bersa zararsiz qayta uriniladi
                for k in range(4):
                    try:
                        h2 = json.load(urllib.request.urlopen(urllib.request.Request(W + "/ub/html2", data=json.dumps({"html": j["html"]}).encode(), headers={**H, "content-type": "application/json"}), timeout=40)).get("html2") or ""
                        break
                    except Exception as e:
                        time.sleep(6)
            r = ""
            for k in range(3):  # bot vaqtincha javob bermasa (503) — 40 soniyadan keyin qayta urinadi; ikki marta almashtirish zararsiz
                try:
                    r = urllib.request.urlopen(urllib.request.Request(W + "/ub/repimg?id=%d" % mid, data=buf.getvalue(), headers={**H, "content-type": "image/jpeg", "x-keep": "1"}), timeout=60).read().decode()[:120]
                    break
                except Exception as e:
                    if k == 2:
                        raise
                    print(mid, "qayta urinish:", repr(e)[:80]); time.sleep(15)
            print(mid, "+", im.size, pos, r); ok.append(mid)
            if n < len(posts) - 1:
                time.sleep(gap)
        except Exception as e:
            print(mid, "- xato:", repr(e)[:200]); fail.append(mid); time.sleep(15)
    if fail and not dry:  # xato bergan postlar navbatga qaytariladi (Telegram/bot vaqtincha javob bermagan bo'lishi mumkin)
        try:
            print("navbatga qaytdi:", fail, urllib.request.urlopen(urllib.request.Request(W + "/ub/wmq", data=json.dumps({"items": fail}).encode(), headers={**H, "content-type": "application/json"}), timeout=40).read().decode()[:100])
        except Exception as e:
            print("navbatga qaytarilmadi:", fail, repr(e)[:100])
    print("TAYYOR:", len(ok), "ta —", ok)


if __name__ == "__main__":
    main()
