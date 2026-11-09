# LOGO ROBOTI (2026-11-09): worker navbatidagi (emojiNeed) klub / terma jamoa gerblarini "Inter Futbol klublar" maxsus emoji
# to'plamiga qo'shadi va nomini custom_emoji_id bilan bog'laydi (/ub/emap). Gerb o'zgartirilmaydi — faqat fonsiz 100x100 ga sig'diriladi.
import hashlib, io, json, os, sys, urllib.parse
import requests
from PIL import Image

BOT = os.environ["BOT_TOKEN"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
OWNER = 1408946569
API = f"https://api.telegram.org/bot{BOT}/"
SETS = ["ifklub_by_InterFutbolMuharrirBot"] + [f"ifklub{n}_by_InterFutbolMuharrirBot" for n in range(2, 8)]
H = {"x-key": KEY, "user-agent": "InterFutbolEmoji"}


def png100(url):
    ua = "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)" if "wiki" in url else "Mozilla/5.0"
    r = requests.get(url, headers={"user-agent": ua}, timeout=40)
    r.raise_for_status()
    im = Image.open(io.BytesIO(r.content)).convert("RGBA")
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    if max(im.size) < 40:
        raise Exception("logo juda kichik")
    im.thumbnail((96, 96), Image.LANCZOS)
    if max(im.size) < 96:
        k = 96 / max(im.size)
        im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
    out = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
    out.paste(im, ((100 - im.width) // 2, (100 - im.height) // 2), im)
    b = io.BytesIO()
    out.save(b, "PNG", optimize=True)
    return b.getvalue()


def add(name, data):
    st = json.dumps({"sticker": "attach://f", "format": "static", "emoji_list": ["⚽"]})
    for s in SETS:
        r = requests.post(API + "addStickerToSet", data={"user_id": OWNER, "name": s, "sticker": st}, files={"f": ("f.png", data, "image/png")}, timeout=120).json()
        d = str(r.get("description", ""))
        if not r.get("ok") and "STICKERSET_INVALID" in d:
            r = requests.post(API + "createNewStickerSet", data={"user_id": OWNER, "name": s, "title": "Inter Futbol klublar " + s.split("_")[0][6:], "sticker_type": "custom_emoji", "stickers": json.dumps([json.loads(st)])}, files={"f": ("f.png", data, "image/png")}, timeout=120).json()
            d = str(r.get("description", ""))
        if r.get("ok"):
            ss = requests.post(API + "getStickerSet", data={"name": s}, timeout=60).json()["result"]["stickers"]
            return ss[-1]["custom_emoji_id"]
        if "TOO_MUCH" in d.upper() or "too much" in d:
            continue
        raise Exception(d)
    raise Exception("bo'sh to'plam yo'q")


def main():
    q = requests.get(W + "/ub/emojineed", headers=H, timeout=60).json()
    print("navbat:", len(q))
    done, m = [], {}
    for it in q[:25]:
        try:
            m[it["n"]] = add(it["n"], png100(it["u"]))
            print("+", it["n"])
        except Exception as e:
            print("-", it["n"], str(e)[:160])
        done.append(it["n"])
    if m:
        print(requests.post(W + "/ub/emap", headers={**H, "content-type": "application/json"}, data=json.dumps(m), timeout=60).text[:200])
    print(requests.post(W + "/ub/emojidone", headers={**H, "content-type": "application/json"}, data=json.dumps({"names": done}), timeout=60).text[:200])


if __name__ == "__main__":
    main()
