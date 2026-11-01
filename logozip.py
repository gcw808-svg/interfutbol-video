# Inter Futbol: botga yuborilgan ZIP arxivdagi litsenziyali logotiplarni o'rnatish
# Fayl nomi = klub/liga nomi (masalan "West Ham United.png"). Logotip o'zgartirilmaydi:
# faqat fon (bo'lsa) olib tashlanadi va o'lchami kichraytiriladi. Telegram'da logosi yo'q
# klublar uchun "Inter Futbol klublar" maxsus emoji to'plamiga stiker qo'shiladi.
import hashlib, io, json, os, unicodedata, urllib.parse, zipfile
import requests
from PIL import Image, ImageDraw

BOT = os.environ["BOT_TOKEN"]
CHAT = os.environ.get("CHAT_ID")
FILE_ID = os.environ["FILE_ID"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
OWNER = 1408946569
SET = "ifklub_by_InterFutbolMuharrirBot"
TITLE = "Inter Futbol klublar"
API = f"https://api.telegram.org/bot{BOT}/"
H = {"x-key": KEY, "user-agent": "InterFutbolLogoZip"}


def say(text):
    if CHAT:
        requests.post(API + "sendMessage", json={"chat_id": int(CHAT), "text": text}, timeout=30)


def remove_bg(im):
    # fon faqat burchaklar bir xil, to'liq shaffofsiz rangda bo'lsa olib tashlanadi
    if im.split()[3].getextrema()[0] < 250:
        return im
    w, h = im.size
    cs = [im.getpixel(p) for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]]
    base = cs[0]
    if any(max(abs(c[i] - base[i]) for i in range(3)) > 12 for c in cs):
        return im
    im = im.copy()
    for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(im, p, (0, 0, 0, 0), thresh=24)
    return im


def load(data, ext):
    if ext == ".svg":
        import cairosvg
        data = cairosvg.svg2png(bytestring=data, output_width=1000)
    return Image.open(io.BytesIO(data)).convert("RGBA")


def main():
    fp = requests.get(API + "getFile", params={"file_id": FILE_ID}, timeout=30).json()["result"]["file_path"]
    z = zipfile.ZipFile(io.BytesIO(requests.get(f"https://api.telegram.org/file/bot{BOT}/{fp}", timeout=120).content))
    files = {}
    for n in z.namelist():
        if n.endswith("/") or "__MACOSX" in n:
            continue
        base, ext = os.path.splitext(os.path.basename(n))
        ext = ext.lower()
        if ext not in (".png", ".svg", ".webp"):
            continue
        name = unicodedata.normalize("NFC", base).strip()
        if name not in files or ext == ".png":  # PNG bo'lsa, SVG dan ustun
            files[name] = (n, ext)
    done, failed, need_emoji = [], [], []
    for name, (n, ext) in sorted(files.items()):
        try:
            im = remove_bg(load(z.read(n), ext))
            bb = im.getbbox()
            if bb:
                im = im.crop(bb)
            im.thumbnail((600, 600), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "PNG", optimize=True)
            r = requests.post(W + "/ub/lgput", params={"name": name, "t": "club"}, data=buf.getvalue(), headers={**H, "content-type": "image/png"}, timeout=60).json()
            done.append(name)
            if not r.get("emoji"):
                need_emoji.append((name, im))
        except Exception as e:
            print("xato", name, e)
            failed.append(name)
    # stikerlar (maxsus emoji)
    added = []
    exists = requests.post(API + "getStickerSet", data={"name": SET}, timeout=60).json().get("ok")
    for name, im in need_emoji:
        e = im.copy()
        e.thumbnail((96, 96), Image.LANCZOS)
        out = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
        out.paste(e, ((100 - e.width) // 2, (100 - e.height) // 2), e)
        b = io.BytesIO()
        out.save(b, "PNG", optimize=True)
        st = {"sticker": "attach://f", "format": "static", "emoji_list": ["⚽"]}
        if exists:
            r = requests.post(API + "addStickerToSet", data={"user_id": OWNER, "name": SET, "sticker": json.dumps(st)}, files={"f": ("f.png", b.getvalue(), "image/png")}, timeout=60).json()
        else:
            r = requests.post(API + "createNewStickerSet", data={"user_id": OWNER, "name": SET, "title": TITLE, "sticker_type": "custom_emoji", "stickers": json.dumps([st])}, files={"f": ("f.png", b.getvalue(), "image/png")}, timeout=60).json()
            exists = r.get("ok")
        if r.get("ok"):
            added.append(name)
        else:
            print("stiker xato", name, r.get("description"))
    if added:
        st = requests.post(API + "getStickerSet", data={"name": SET}, timeout=60).json()["result"]["stickers"]
        m = {n: s["custom_emoji_id"] for n, s in zip(added, st[-len(added):])}
        requests.post(W + "/ub/emap", data=json.dumps(m).encode(), headers={**H, "content-type": "application/json"}, timeout=60)
    msg = f"✅ Logotiplar o'rnatildi: {len(done)} ta.\n🧩 Stikerlar to'plamiga qo'shildi: {len(added)} ta."
    if failed:
        msg += "\n⚠️ O'qib bo'lmadi: " + ", ".join(failed)
    say(msg)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        say("⚠️ Logotiplar arxivini ishlab bo'lmadi: " + str(e)[:200])
        raise
