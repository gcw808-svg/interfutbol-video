# Inter Futbol: KANAL POSTLARIDAGI SURATLARNI BAZAGA O'TKAZISH (2026-11-10, Bahtiyor aka: "kanaldagi shunaqa rasmlarni barchasini
# tahrirlab, bazaga jo'natib, sifatini yaxshilab chiq" — 205-post: surat chetida begona odamlar ko'rinib qolgan edi).
# Har bir post uchun: bot post suratini va undagi odamni aniqlaydi (ism post matnidan, yuzdan EMAS; asosiy odam gavdasi ramkasi) →
# burchakdagi iF belgisi kesib olinadi → kichik bo'lsa tiniqlashtiriladi (sharp.sr4) → rasmlar kanaliga fayl bo'lib tushadi va bazaga yoziladi →
# REDRAW=1 bo'lsa post rasmi bazadagi surat bilan qayta chiziladi (tik karta, surat shu odam atrofida qirqiladi).
# Bitta odam aniq ko'rinmagan (2+ kishi, ism noaniq) suratlar o'tkazib yuboriladi — bazaga noto'g'ri odam tushmasligi uchun.
#   POSTS — post raqamlari (vergul bilan);  REDRAW — "1": post rasmi qayta chiziladi;  DRY — "1": faqat hisobot, hech narsa o'zgarmaydi
import io, json, os, re, sys, time

import numpy as np
import requests
from PIL import Image

import persons
import sharp
from sharp import API, BOT, H, LIB, W, tg, wpost


def wm_box(im):
    # o'ng yuqori burchakdagi iF belgisi (to'q kvadrat ichida oq "i" va yashil #5BB637 "F") — yashil harf bo'yicha topiladi
    w, h = im.size
    s = int(min(w, h) * 0.30)
    a = np.asarray(im.crop((w - s, 0, w, s)).convert("RGB")).astype(int)
    g = (abs(a[..., 0] - 91) < 34) & (abs(a[..., 1] - 182) < 34) & (abs(a[..., 2] - 55) < 40)
    if g.sum() < max(12, s * s * 0.002):
        return None
    ys, xs = np.where(g)
    y0, y1, x0, x1 = np.percentile(ys, 2), np.percentile(ys, 98), np.percentile(xs, 2), np.percentile(xs, 98)
    gh, gw = y1 - y0 + 1, x1 - x0 + 1
    if gh > s * 0.6 or gw > s * 0.6:  # yashil maydon/forma — belgi emas
        return None
    # kvadrat: "F" uning o'ng pastki qismida — chapga ~1,3 harf eni, tepaga/pastga ~0,45 harf bo'yi zaxira
    return (w - s + x0 - gw * 1.5, max(0, y0 - gh * 0.6), min(w, w - s + x1 + gw * 0.9), y1 + gh * 0.8)


def clean(im, box):
    # belgini kesib olish: odamga tegmaydigan tomondan (tepa yoki o'ng chet); ikkalasi ham odamni kessa — None
    w, h = im.size
    wm = wm_box(im)
    if not wm:
        return im, box, "belgi topilmadi"
    bx0, by0, bx1, by1 = box[0] * w, box[1] * h, box[2] * w, box[3] * h
    top, left = int(wm[3] + 1), int(wm[0])
    if top <= by0 + h * 0.03:
        c = (0, top, w, h); how = "tepadan"
    elif left >= bx1 - w * 0.03:
        c = (0, 0, left, h); how = "o'ngdan"
    elif left >= bx0 + (bx1 - bx0) * 0.70 and left >= w * 0.6:
        # belgi odamning chetiga (yelka, qo'l) tushgan — o'ng chetdan kesiladi, odam ramkasi enining ko'pi bilan 30% i ketadi
        c = (0, 0, left, h); how = "o'ngdan (odam chetidan ozgina) kesildi"
        out = im.crop(c)
        nb = [max(0, bx0) / out.width, by0 / out.height, min(out.width, bx1) / out.width, min(out.height, by1) / out.height]
        return out, [round(v, 3) for v in nb], "belgi " + how
    else:
        return None, None, "belgi odam ustida"
    out = im.crop(c)
    nb = [max(0, bx0 - c[0]) / out.width, max(0, by0 - c[1]) / out.height, min(out.width, bx1 - c[0]) / out.width, min(out.height, by1 - c[1]) / out.height]
    return out, [round(v, 3) for v in nb], "belgi " + how + " kesildi"


def wiki_one(pid, title):
    # VIKIPEDIYADAN ASL SURAT (2026-11-12, 223-post — Philipp Lahm): tarix/fakt postlarining surati Vikipediya maqolasidan olingan bo'ladi,
    # kanaldagi nusxasida esa iF belgisi yuz yonida turadi va kesib bo'lmaydi. Shuning uchun maqolaning ASL surati (Commons, faqat erkin
    # litsenziya) olinadi: bazaga odam nomi bilan tushadi, post shu surat bilan qayta chiziladi, muallif qatori post matniga qo'shiladi.
    import stadium
    r = requests.get("https://en.wikipedia.org/w/api.php", params={"action": "query", "format": "json", "titles": title, "prop": "pageimages", "piprop": "name", "redirects": 1}, headers=stadium.UA, timeout=40).json()
    fname = next(iter(r["query"]["pages"].values())).get("pageimage")
    c = stadium.commons(fname) if fname else None
    if not c:
        print(pid, "O'TKAZILDI: Vikipediyada erkin litsenziyali surat yo'q |", title, "|", fname); return False
    full = requests.get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "format": "json", "titles": "File:" + fname, "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 2560}, headers=stadium.UA, timeout=40).json()
    ii = next(iter(full["query"]["pages"].values()))["imageinfo"][0]
    im = Image.open(io.BytesIO(requests.get(ii.get("thumburl") or ii["url"], headers=stadium.UA, timeout=120).content)).convert("RGB")
    w0, h0 = im.size
    note = ""
    if min(im.size) < sharp.MINSIDE:
        im = sharp.sr4(im)
        if max(im.size) > sharp.MAXLONG:
            k = sharp.MAXLONG / max(im.size)
            im = im.resize((int(im.width * k + .5), int(im.height * k + .5)), Image.LANCZOS)
        note = "; tiniqlashtirilgan"
    box, pn, ex = persons.analyse(im)
    if not box or pn != 1:
        print(pid, "O'TKAZILDI: suratda bitta odam emas |", title, pn); return False
    art = re.sub(r"^User:", "", c["art"]).strip()
    credit = f"Foto: {art}, {c['lic']}"
    print(pid, title, fname, f"{w0}x{h0} -> {im.width}x{im.height}", "|", credit, "| ramka", box, "| chet", ex)
    if os.environ.get("DRY") == "1":
        return True
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=93, subsampling=0)
    fn = "".join(ch if ch.isalnum() else "_" for ch in title)[:40] + ".jpg"
    r = tg("sendDocument", data={"chat_id": LIB, "caption": f"{title}\n{credit} (Wikimedia Commons){note}\n📌 kanal posti: {pid}", "disable_notification": True, "disable_content_type_detection": True}, files={"document": (fn, buf.getvalue(), "image/jpeg")})
    if not r.get("ok"):
        print(pid, "XATO yuborish:", r.get("description")); return False
    d = r["result"]["document"]
    res = wpost("/ub/faceadd", {"name": title, "f": d["file_id"], "uid": d["file_unique_id"], "w": im.width, "h": im.height, "m": r["result"]["message_id"], "b": box, "x": ex, "src": pid})
    if not res.get("ok"):
        tg("deleteMessage", data={"chat_id": LIB, "message_id": r["result"]["message_id"]}); print(pid, "XATO baza:", res); return False
    time.sleep(20)  # KV yangi yozuvni ko'rsatishi uchun
    print(pid, "qayta chizish:", wpost("/ub/rasm", {"id": pid, "credit": credit + ", Wikimedia Commons"}))
    return True


def main():
    for part in [x for x in os.environ.get("WIKI", "").split(";") if "=" in x]:  # "223=Philipp Lahm;230=..."
        k, v = part.split("=", 1)
        try:
            wiki_one(int(k), v.strip())
        except Exception as e:
            print(k, "XATO:", str(e)[:200])
        time.sleep(5)
    posts = [int(x) for x in os.environ.get("POSTS", "").replace(" ", "").split(",") if x.isdigit()]
    redraw, dry = os.environ.get("REDRAW") == "1", os.environ.get("DRY") == "1"
    F = requests.get(W + "/ub/faces", headers=H, timeout=40).json()
    have = {p.get("src"): P["n"] for P in F.values() for p in P.get("ph", []) if p.get("src")}
    ok = sk = 0
    for pid in posts:
        try:
            if os.environ.get("ONLYDRAW") == "1":  # faqat qayta chizish (surat bazaga o'tkazilmaydi) — masalan to'purarlar jadvali
                rr = wpost("/ub/rasm", {"id": pid}); print(pid, "qayta chizish:", rr); ok += 1; time.sleep(18); continue
            if pid in have:
                print(pid, "bazada bor:", have[pid])
            else:
                pr = wpost("/ub/faceprobe", {"post": pid})
                if not pr.get("ok"):
                    print(pid, "O'TKAZILDI:", pr.get("why")); sk += 1; continue
                f = tg("getFile", data={"file_id": pr["f"]})
                im = Image.open(io.BytesIO(requests.get(f"https://api.telegram.org/file/bot{BOT}/{f['result']['file_path']}", timeout=120).content)).convert("RGB")
                w0, h0 = im.size
                box0, pn, _ = persons.analyse(im)
                why = "" if pr.get("name") else "ism aniqlanmadi"
                why = why or ("" if box0 else "suratda odam topilmadi")
                why = why or ("" if pn == 1 else f"suratda {pn} ta yirik odam")
                if why:
                    print(pid, "O'TKAZILDI:", why, "|", pr.get("title"), "|", pr.get("err", "")); sk += 1; continue
                im2, box, note = clean(im, box0)
                if im2 is None:
                    print(pid, "O'TKAZILDI:", note, "|", pr["name"]); sk += 1; continue
                if min(im2.size) < sharp.MINSIDE:
                    im2 = sharp.sr4(im2)
                    if max(im2.size) > sharp.MAXLONG:
                        k = sharp.MAXLONG / max(im2.size)
                        im2 = im2.resize((int(im2.width * k + .5), int(im2.height * k + .5)), Image.LANCZOS)
                    note += ", tiniqlashtirildi"
                box, pn, ex = persons.analyse(im2)  # tozalangan suratda qayta: aniq ramka va chetdagi begonalar
                if not box:
                    print(pid, "O'TKAZILDI: tozalangach odam topilmadi"); sk += 1; continue
                print(pid, pr["name"], f"{w0}x{h0} -> {im2.width}x{im2.height}", note, "| ramka", box, "| chet", ex)
                if dry:
                    continue
                buf = io.BytesIO(); im2.save(buf, "JPEG", quality=93, subsampling=0)
                fn = "".join(c if c.isalnum() else "_" for c in pr["name"])[:40] + ".jpg"
                r = tg("sendDocument", data={"chat_id": LIB, "caption": f"{pr['name']}\n📌 kanal posti: {pid}", "disable_notification": True, "disable_content_type_detection": True}, files={"document": (fn, buf.getvalue(), "image/jpeg")})
                if not r.get("ok"):
                    print(pid, "XATO yuborish:", r.get("description")); sk += 1; continue
                d = r["result"]["document"]
                res = wpost("/ub/faceadd", {"name": pr["name"], "f": d["file_id"], "uid": d["file_unique_id"], "w": im2.width, "h": im2.height, "m": r["result"]["message_id"], "b": box, "x": ex, "src": pid})
                if not res.get("ok"):
                    tg("deleteMessage", data={"chat_id": LIB, "message_id": r["result"]["message_id"]})
                    print(pid, "XATO baza:", res); sk += 1; continue
            if redraw and not dry:
                rr = wpost("/ub/rasm", {"id": pid}); print(pid, "qayta chizish:", rr); time.sleep(25)
            ok += 1
        except Exception as e:
            print(pid, "XATO:", str(e)[:200]); sk += 1
    print(f"yakun: bajarildi {ok}, o'tkazildi {sk}")


if __name__ == "__main__":
    main()
