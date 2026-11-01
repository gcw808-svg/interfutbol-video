# Inter Futbol: litsenziyali klub/liga logotiplaridan Telegram maxsus emoji to'plamini yaratish
# Logotiplar o'zgartirilmaydi: faqat fonsiz PNG 100x100 o'lchamga sig'diriladi (nisbat saqlanadi)
import hashlib, io, json, os, urllib.parse, urllib.request
import requests
from PIL import Image

BOT = os.environ["BOT_TOKEN"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
OWNER = 1408946569
SET = "ifklub_by_InterFutbolMuharrirBot"
TITLE = "Inter Futbol klublar"
ITEMS = json.load(open("sticker_list.json", encoding="utf-8"))  # [[nom, "club"|"league"], ...]
API = f"https://api.telegram.org/bot{BOT}/"


def emoji_png(name):
    r = requests.get(W + "/lg/" + urllib.parse.quote(name.lower()), headers={"user-agent": "InterFutbolStickers"}, timeout=30)
    r.raise_for_status()
    im = Image.open(io.BytesIO(r.content)).convert("RGBA")
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    im.thumbnail((96, 96), Image.LANCZOS)
    out = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
    out.paste(im, ((100 - im.width) // 2, (100 - im.height) // 2), im)
    buf = io.BytesIO()
    out.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def main():
    files, stickers, names = {}, [], []
    for i, (name, kind) in enumerate(ITEMS[:50]):
        try:
            files[f"f{i}"] = (f"f{i}.png", emoji_png(name), "image/png")
        except Exception as e:
            print("logo yo'q:", name, e)
            continue
        stickers.append({"sticker": f"attach://f{i}", "format": "static", "emoji_list": ["⚽" if kind == "club" else "🏆"]})
        names.append(name)
    r = requests.post(API + "createNewStickerSet", data={"user_id": OWNER, "name": SET, "title": TITLE, "sticker_type": "custom_emoji", "stickers": json.dumps(stickers)}, files=files, timeout=300).json()
    print("create:", r.get("ok"), r.get("description"))
    if not r.get("ok"):
        return
    st = requests.post(API + "getStickerSet", data={"name": SET}, timeout=60).json()["result"]["stickers"]
    m = {n: s["custom_emoji_id"] for n, s in zip(names, st)}
    print(len(m), "ta emoji")
    req = urllib.request.Request(W + "/ub/emap", data=json.dumps(m).encode(), headers={"x-key": KEY, "content-type": "application/json", "user-agent": "InterFutbolStickers"}, method="POST")
    print(urllib.request.urlopen(req, timeout=60).read().decode())


if __name__ == "__main__":
    main()
