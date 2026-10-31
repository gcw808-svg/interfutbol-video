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


async def post(job):
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    j = wapi("/ub/job?id=" + job)
    if not j.get("html"):
        return
    try:
        c = TelegramClient(StringSession(j["session"]), API_ID, API_HASH)
        await c.connect()
        if not await c.is_user_authorized():
            raise Exception("hisob ulanishi bekor qilingan (qayta /ulanish kerak)")
        ch = j["channel"]
        if j.get("photo"):
            f = io.BytesIO(http(j["photo"], headers={"user-agent": "InterFutbolUB"}, timeout=60))
            f.name = "photo.jpg"
            m = await c.send_file(ch, f, caption=j["html"], parse_mode="html")
        else:
            m = await c.send_message(ch, j["html"], parse_mode="html", link_preview=bool(j.get("video")))
        await c.disconnect()
        wapi("/ub/done", {"id": job, "ok": True, "msg_id": m.id})
    except Exception as e:
        print("xato", e)
        wapi("/ub/done", {"id": job, "ok": False, "err": str(e)[:300]})


if __name__ == "__main__":
    if sys.argv[1] == "login":
        asyncio.run(login(int(os.environ["CHAT_ID"])))
    else:
        asyncio.run(post(os.environ["JOB"]))
