# Inter Futbol: RASMLAR BAZASI TINIQLASHTIRUVCHISI (2026-11-10, Bahtiyor aka: "xira rasm tashlasam darrov tiniqlashtirib saqlab
# qo'ysin, tiniq holatini saqlab, xira holatini o'chirib tashlasin").
# Kichik suratni (kichik tomoni 1000 px dan kam) Real-ESRGAN "realesr-general-x4v3" bilan 4 marta kattalashtiradi (uzun tomoni 2560 gacha),
# rasmlar kanaliga FAYL qilib (Telegram siqmasligi uchun) qayta yuklaydi, bot bazasida (KV faces) eski surat o'rniga yozadi va
# xira aslini kanaldan o'chiradi. Yuzni qayta chizadigan modellar ishlatilmaydi — odam o'zgarmaydi. Stadion suratlariga tegilmaydi.
#   ONLY  — faqat shu xabar raqam(lar)i (vergul bilan); bo'sh — bazadagi hammasi
#   DEL   — "1": xira asli darrov o'chiriladi; "0": qoladi (raqami bazada "om" bo'lib saqlanadi)
#   PURGE — "1": avval qoldirilgan xira asllar ("om") o'chiriladi, boshqa ish qilinmaydi
import hashlib, io, json, os, sys, time

import numpy as np
import requests
from PIL import Image

BOT = os.environ["BOT_TOKEN"]
W = os.environ.get("WURL", "https://inter-futbol-bot.gcw808.workers.dev")
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
LIB = -1004498416461
API = f"https://api.telegram.org/bot{BOT}/"
H = {"x-key": KEY, "user-agent": "InterFutbolSharp", "content-type": "application/json"}
MINSIDE, MAXLONG = 1000, 2560
_S = {}


def sr4(im):
    # 4 marta kattalashtirish; katta surat xotiraga sig'ishi uchun bo'laklab (ustma-ust 16 px) ishlanadi
    if "s" not in _S:
        import onnxruntime as ort
        _S["s"] = ort.InferenceSession(os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "realesr-general-x4v3.onnx"), providers=["CPUExecutionProvider"])
    a = np.asarray(im.convert("RGB"), dtype=np.float32).transpose(2, 0, 1) / 255.0
    _, h, w = a.shape
    out = np.zeros((3, h * 4, w * 4), dtype=np.float32)
    T, P = 480, 16
    for y in range(0, h, T):
        for x in range(0, w, T):
            y0, x0, y1, x1 = max(0, y - P), max(0, x - P), min(h, y + T + P), min(w, x + T + P)
            o = _S["s"].run(None, {"x": a[None, :, y0:y1, x0:x1]})[0][0]
            ye, xe = min(h, y + T), min(w, x + T)
            out[:, y * 4:ye * 4, x * 4:xe * 4] = o[:, (y - y0) * 4:(ye - y0) * 4, (x - x0) * 4:(xe - x0) * 4]
    return Image.fromarray((out.clip(0, 1).transpose(1, 2, 0) * 255 + 0.5).astype(np.uint8))


def tg(method, **kw):
    for k in range(3):
        try:
            r = requests.post(API + method, timeout=180, **kw).json()
            if r.get("ok") or r.get("error_code") in (400, 403):
                return r
        except Exception as e:
            r = {"ok": False, "description": str(e)[:200]}
        time.sleep(3 + 4 * k)
    return r


def wpost(path, obj):
    return requests.post(W + path, headers=H, data=json.dumps(obj), timeout=40).json()


def main():
    only = {int(x) for x in os.environ.get("ONLY", "").replace(" ", "").split(",") if x.isdigit()}
    dele = os.environ.get("DEL", "0") == "1"
    F = requests.get(W + "/ub/faces", headers=H, timeout=40).json()
    if os.environ.get("PURGE") == "1":
        n = 0
        for P in F.values():
            for p in P.get("ph", []):
                if p.get("om") and (not only or p["om"] in only):
                    r = tg("deleteMessage", data={"chat_id": LIB, "message_id": p["om"]})
                    gone = r.get("ok") or "not found" in str(r.get("description", "")).lower()
                    print("o'chirish", P["n"], p["om"], "OK" if gone else r.get("description"))
                    if gone:
                        wpost("/ub/facesharp", {"purged": p["om"]}); n += 1
        print("o'chirildi:", n)
        return
    done = skip = fail = 0
    for P in F.values():
        for p in P.get("ph", []):
            if (only and p["m"] not in only) or (p.get("sr") and p.get("d")):
                continue
            try:
                f = tg("getFile", data={"file_id": p["f"]})
                raw = requests.get(f"https://api.telegram.org/file/bot{BOT}/{f['result']['file_path']}", timeout=120).content
                im = Image.open(io.BytesIO(raw)).convert("RGB")
            except Exception as e:
                print("XATO yuklash", P["n"], p["m"], str(e)[:120]); fail += 1; continue
            w, h = im.size
            # aniq odam ramkasi va chetdagi begona odamlar (persons.py, YOLOX) — kartada surat shu bo'yicha qirqiladi
            try:
                import persons
                box, pn, ex = persons.analyse(im)
            except Exception as e:
                print("XATO odam topish", str(e)[:120]); box, pn, ex = None, 1, []
            det = {"b": box, "x": ex, "pn": pn} if box else {}
            # 2026-11-22: "sr" belgisi bor, lekin o'zi juda kichik (500 px dan kam — bazaga tayyor holda qo'shilgan) surat baribir kattalashtiriladi
            if min(w, h) >= MINSIDE or (p.get("sr") and min(w, h) >= 500):
                wpost("/ub/facesharp", {"dims": p["m"], "w": w, "h": h, **det})
                print("yetarli", P["n"], p["m"], f"{w}x{h}", "ramka", box, "odam", pn, "chet", ex); skip += 1; continue
            t0 = time.time()
            up = sr4(im)
            if max(up.size) > MAXLONG:
                k = MAXLONG / max(up.size)
                up = up.resize((int(up.width * k + .5), int(up.height * k + .5)), Image.LANCZOS)
            buf = io.BytesIO(); up.save(buf, "JPEG", quality=93, subsampling=0)
            fn = "".join(c if c.isalnum() else "_" for c in P["n"])[:40] + ".jpg"
            r = tg("sendDocument", data={"chat_id": LIB, "caption": f"{P['n']}\n✨ tiniqlashtirildi: {w}×{h} → {up.width}×{up.height}", "disable_notification": True, "disable_content_type_detection": True}, files={"document": (fn, buf.getvalue(), "image/jpeg")})
            if not r.get("ok"):
                print("XATO yuborish", P["n"], p["m"], r.get("description")); fail += 1; continue
            d = r["result"]["document"]
            res = wpost("/ub/facesharp", {"om": p["m"], "f": d["file_id"], "uid": d["file_unique_id"], "w": up.width, "h": up.height, "m": r["result"]["message_id"], "del": 1 if dele else 0, **det})
            if not res.get("ok"):
                tg("deleteMessage", data={"chat_id": LIB, "message_id": r["result"]["message_id"]})  # bazaga yozilmadi — yangi nusxa qaytarib olinadi
                print("XATO baza", P["n"], p["m"], res); fail += 1; continue
            x = ""
            if dele:
                dr = tg("deleteMessage", data={"chat_id": LIB, "message_id": p["m"]})
                x = " | xira asli o'chirildi" if dr.get("ok") else " | xira asli O'CHMADI: " + str(dr.get("description"))
                if not dr.get("ok"):
                    wpost("/ub/facesharp", {"keep": r["result"]["message_id"], "om": p["m"]})
            print("TINIQ", P["n"], p["m"], "->", r["result"]["message_id"], f"{w}x{h} -> {up.width}x{up.height}", "ramka", box, "odam", pn, "chet", ex, "%.0fs" % (time.time() - t0) + x); done += 1
    print(f"yakun: tiniqlashtirildi {done}, yetarli {skip}, xato {fail}")
    if fail and not done:
        sys.exit(1)


if __name__ == "__main__":
    main()
