# Inter Futbol: postlarni admin hisobi nomidan (klub logotiplari bilan) kanalga chiqarish
# login — QR-kod orqali bir martalik ulanish; post — tayyor postni kanalga yuborish
import asyncio, hashlib, io, json, os, sys, time, urllib.request

BOT = os.environ["BOT_TOKEN"]
API_ID = int(os.environ["TG_API_ID"])
API_HASH = os.environ["TG_API_HASH"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]


def http(url, data=None, headers=None, method=None, timeout=60):
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def wapi(path, body=None):
    h = {"x-key": KEY, "content-type": "application/json", "user-agent": "InterFutbolUB"}
    raw = http(W + path, data=json.dumps(body).encode() if body is not None else None, headers=h, method="POST" if body is not None else "GET")
    return json.loads(raw or b"{}")


def tg(method, **p):
    return json.loads(http(f"https://api.telegram.org/bot{BOT}/{method}", data=json.dumps(p).encode(), headers={"content-type": "application/json"}))


def tg_photo(chat, png, caption):
    b = "----ifub" + str(time.time()).replace(".", "")
    parts = []
    for k, v in (("chat_id", str(chat)), ("caption", caption)):
        parts.append(f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    parts.append(f"--{b}\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"qr.png\"\r\nContent-Type: image/png\r\n\r\n".encode() + png + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())
    return json.loads(http(f"https://api.telegram.org/bot{BOT}/sendPhoto", data=b"".join(parts), headers={"content-type": "multipart/form-data; boundary=" + b}))


async def login(chat):
    import qrcode
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    from telethon.errors import SessionPasswordNeededError
    c = TelegramClient(StringSession(), API_ID, API_HASH)
    await c.connect()
    qr = await c.qr_login()
    last = None
    ok = False
    for _ in range(10):
        buf = io.BytesIO()
        qrcode.make(qr.url).save(buf, "PNG")
        if last:
            try: tg("deleteMessage", chat_id=chat, message_id=last)
            except Exception: pass
        r = tg_photo(chat, buf.getvalue(), "📲 Telefoningizda Telegram → Sozlamalar → Qurilmalar → «Kompyuterni ulash» (Link Desktop Device) bo'limini ochib, shu QR-kodni skanerlang. Kod har 30 soniyada yangilanadi.")
        last = (r.get("result") or {}).get("message_id")
        try:
            await qr.wait(timeout=30)
            ok = True
            break
        except asyncio.TimeoutError:
            await qr.recreate()
        except SessionPasswordNeededError:
            tg("sendMessage", chat_id=chat, text="🔐 Hisobingizda ikki bosqichli parol (Cloud password) yoqilgan. Shu parolni 3 daqiqa ichida botga yuboring. Yuborganingizdan keyin o'sha xabarni o'zingiz o'chirib qo'ying.")
            pw = None
            for _ in range(36):
                time.sleep(5)
                pw = wapi("/ub/pw").get("pw")
                if pw: break
            if not pw:
                tg("sendMessage", chat_id=chat, text="⌛ Parol kelmadi. /ulanish buyrug'ini qayta yuboring.")
                return
            await c.sign_in(password=pw)
            ok = True
            break
    if last:
        try: tg("deleteMessage", chat_id=chat, message_id=last)
        except Exception: pass
    if not ok:
        tg("sendMessage", chat_id=chat, text="⌛ QR-kod skanerlanmadi. /ulanish buyrug'ini qayta yuboring.")
        return
    me = await c.get_me()
    wapi("/ub/session", {"session": c.session.save(), "name": (me.first_name or "") + (" @" + me.username if me.username else "")})
    await c.disconnect()


def story_canvas(raw):
    # istoriya uchun 1080x1920 (9:16) tuval: brend foni, rasm markazda
    try:
        from PIL import Image
    except ImportError:
        os.system("pip install -q pillow")
        from PIL import Image
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    W_, H_ = 1080, 1920
    if abs(im.width * 16 - im.height * 9) <= im.height * 0.3:
        # rasm allaqachon tik (9:16) bo'lsa, to'liq ekranga qo'yiladi
        out = io.BytesIO()
        im.resize((W_, H_), Image.LANCZOS).save(out, "JPEG", quality=95, subsampling=0)
        return out.getvalue()
    bg = Image.new("RGB", (W_, H_), (10, 14, 22))
    w = 1040
    h = int(im.height * w / im.width)
    if h > 1800:
        h = 1800
        w = int(im.width * h / im.height)
    im = im.resize((w, h), Image.LANCZOS)
    bg.paste(im, ((W_ - w) // 2, (H_ - h) // 2))
    out = io.BytesIO()
    bg.save(out, "JPEG", quality=93)
    return out.getvalue()


def done(body):
    # natijani botga yetkazish: tarmoq xatosida 4 marta qayta urinadi
    for i in range(4):
        try:
            return wapi("/ub/done", body)
        except Exception as e:
            print("done xato", e)
            time.sleep(5 * (i + 1))


def plain(s):
    import re, html as H
    return re.sub(r"\s+", " ", H.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def title_words(s):
    import re
    t = plain(s).lower()
    for a, b in (("ö", "o"), ("ğ", "g"), ("ş", "sh"), ("ç", "ch")):
        t = t.replace(a, b)
    t = re.sub(r"['‘’ʻʼ`]", "", t)
    return {w for w in re.split(r"\W+", t) if len(w) > 3}


def same_title(a, b):
    # bir yangilik boshqacha yozilgan bo'lsa ham tanish uchun: sarlavhalardagi umumiy so'zlar solishtiriladi
    A, B = title_words(a), title_words(b)
    n = len(A & B)
    return n >= 4 and n / min(len(A), len(B)) >= 0.7


async def already_posted(c, ch, html):
    # takror chiqmasin: kanalning oxirgi 15 xabarida xuddi shu sarlavha bo'lsa, qayta yubormaydi
    head = plain(html.split("\n")[0])[:60]
    if len(head) < 15:
        return None
    async for m in c.iter_messages(ch, limit=15):
        if plain(m.raw_text or "").startswith(head[:40]) or same_title(html.split("\n")[0], (m.raw_text or "").split("\n")[0]):
            return m.id
    return None


async def post(job):
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    j = wapi("/ub/job?id=" + job)
    if not j.get("html") and not j.get("story") and not j.get("check"):
        return
    try:
        c = TelegramClient(StringSession(j["session"]), API_ID, API_HASH)
        await c.connect()
        if not await c.is_user_authorized():
            raise Exception("hisob ulanishi bekor qilingan (qayta /ulanish kerak)")
        if j.get("check"):
            # kunlik tekshiruv: hisob ishlayaptimi (har kuni ulanish Telegramga hisob "faol" ekanini ham bildiradi)
            me = await c.get_me()
            await c.disconnect()
            done({"id": job, "ok": True, "check": 1, "me": getattr(me, "id", 0)})
            return
        ch = j["channel"]
        if j.get("story"):
            from telethon.tl.functions.stories import SendStoryRequest
            from telethon.tl.types import InputMediaUploadedPhoto, InputPrivacyValueAllowAll
            img = story_canvas(http(j["story"], headers={"user-agent": "InterFutbolUB"}, timeout=60))
            up = await c.upload_file(img, file_name="story.jpg")
            peer = await c.get_input_entity(ch)
            r = await c(SendStoryRequest(peer=peer, media=InputMediaUploadedPhoto(file=up), privacy_rules=[InputPrivacyValueAllowAll()], period=86400))
            sid = next((u.id for u in (getattr(r, "updates", None) or []) if type(u).__name__ == "UpdateStoryID"), 0)
            await c.disconnect()
            done({"id": job, "ok": True, "msg_id": 0, "story": sid})
            return
        if not j.get("edit") and not j.get("story"):
            dup = await already_posted(c, ch, j["html"])
            if dup:
                await c.disconnect()
                print("takror post, yuborilmadi", dup)
                done({"id": job, "ok": True, "msg_id": dup, "dup": True})
                return
        if j.get("edit"):
            # editPhoto bo'lsa — post rasmi ham almashtiriladi (masalan natija kartochkasi yangi dizaynda)
            ef = None
            if j.get("editPhoto"):
                ef = io.BytesIO(http(j["editPhoto"], headers={"user-agent": "InterFutbolUB"}, timeout=60))
                ef.name = "photo.jpg"
            m = await c.edit_message(ch, int(j["edit"]), j["html"], parse_mode="html", link_preview=bool(j.get("video")), file=ef)
        elif j.get("photo"):
            f = io.BytesIO(http(j["photo"], headers={"user-agent": "InterFutbolUB"}, timeout=60))
            f.name = "photo.jpg"
            m = await c.send_file(ch, f, caption=j["html"], parse_mode="html")
        else:
            m = await c.send_message(ch, j["html"], parse_mode="html", link_preview=bool(j.get("video")))
        await c.disconnect()
        posted = m.id
    except Exception as e:
        print("xato", e)
        done({"id": job, "ok": False, "err": str(e)[:300]})
        return
    # post chiqdi — endi faqat muvaffaqiyat haqida xabar beriladi (xato deb qayta yuborilmaydi)
    done({"id": job, "ok": True, "msg_id": posted})


if __name__ == "__main__":
    if sys.argv[1] == "login":
        asyncio.run(login(int(os.environ["CHAT_ID"])))
    else:
        asyncio.run(post(os.environ["JOB"]))
