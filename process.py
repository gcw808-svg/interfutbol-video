# Inter Futbol: admin yuborgan videoga logotip qo'yish va Gemini bilan sharh yozish
import json, os, re, subprocess, time, urllib.request, urllib.parse

BOT = os.environ["BOT_TOKEN"]
KEY = os.environ.get("GEMINI_KEY", "")
CHAT = os.environ["CHAT_ID"]
FID = os.environ["FILE_ID"]
NOTE = os.environ.get("NOTE", "")
MSG_ID = int(os.environ.get("MSG_ID") or 0)
API_ID = int(os.environ.get("TG_API_ID") or 0)
API_HASH = os.environ.get("TG_API_HASH", "")
MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
KB = {"inline_keyboard": [[{"text": "✅ Chop etish", "callback_data": "ucpub"}],
                          [{"text": "✏️ Tahrirlash", "callback_data": "ucedit"}, {"text": "❌ Bekor qilish", "callback_data": "ucskip"}]]}


def tg(method, **params):
    data = json.dumps(params).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{BOT}/{method}", data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def say(text):
    try:
        tg("sendMessage", chat_id=CHAT, text=text)
    except Exception:
        pass


def http_json(url, data=None, headers=None, method=None, timeout=120):
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r), r.headers


PROMPT = """Sen o'zbek tilidagi "Inter Futbol" Telegram kanalining muharririsan.
Ilova qilingan futbol videosini ko'r va eshit. Shu video uchun o'zbek tilida (lotin yozuvi) qisqa post yoz.
Tuzilishi:
1-qator: mos emoji + <b>QISQA SARLAVHA</b>
Bo'sh qator.
2–4 ta qisqa gap: videoda nima bo'layotgani, kim nima deyapti (gaplarning mazmunini qisqa yetkaz).
Bo'sh qator.
2–3 ta heshteg.
Qoidalar: faqat videoda ko'rgan va eshitganingni yoz, o'ylab topma. Klub va o'yinchi nomlarini o'zbekcha qabul qilingan shaklda yoz. Faqat <b> tegidan foydalan. "VIDEO" so'zini, 🎬, 🗓, 🏟 belgilarini yozma. Post 700 belgidan oshmasin. Faqat tayyor post matnini qaytar."""


def gemini_caption(path):
    if not KEY:
        return ""
    size = os.path.getsize(path)
    # File API ga yuklash
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/upload/v1beta/files?key={KEY}",
        data=json.dumps({"file": {"display_name": "video"}}).encode(),
        headers={"X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
                 "X-Goog-Upload-Header-Content-Length": str(size), "X-Goog-Upload-Header-Content-Type": "video/mp4",
                 "content-type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        up = r.headers.get("X-Goog-Upload-URL")
    with open(path, "rb") as f:
        info, _ = http_json(up, data=f.read(), headers={"X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize",
                                                         "content-length": str(size)}, method="POST", timeout=300)
    file = info["file"]
    for _ in range(60):
        if file.get("state") == "ACTIVE":
            break
        time.sleep(3)
        file, _ = http_json(f"https://generativelanguage.googleapis.com/v1beta/{file['name']}?key={KEY}")
    prompt = PROMPT + (f"\n\nAdmin izohi (kontekst uchun): {NOTE}" if NOTE.strip() else "")
    body = {"contents": [{"parts": [{"text": prompt}, {"file_data": {"mime_type": "video/mp4", "file_uri": file["uri"]}}]}],
            "generationConfig": {"temperature": 0.5, "maxOutputTokens": 4096}}
    for model in MODELS:
        for attempt in range(3):
            try:
                j, _ = http_json(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}",
                                 data=json.dumps(body).encode(), headers={"content-type": "application/json"}, method="POST", timeout=180)
                text = "".join(p.get("text", "") for p in j["candidates"][0]["content"]["parts"]).strip()
                if text:
                    return text
            except Exception as e:
                print("gemini", model, e)
                time.sleep(3)
    return ""


def clean(text):
    text = re.sub(r"```[a-z]*", "", text).strip()
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = "\n".join(l for l in text.split("\n") if not re.search("🗓|🏟", l))
    text = re.sub(r"🎬\s*", "", text)
    text = re.sub(r"\bVIDEO\s*[|:—-]\s*", "", text, flags=re.I)
    # faqat <b> qoldiriladi
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:1000]


def make_logo(path="logo.png"):
    # InterFutbol belgisi: yarim shaffof to'q fon ustida oq "i" va yashil "F"
    from PIL import Image, ImageDraw
    K = 4
    S = 220 * K
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=36 * K, fill=(20, 22, 30, 185))
    x0, y0, x1, y1 = 175, 103, 1065, 1044
    pad = 34 * K
    sc = min((S - 2 * pad) / (x1 - x0), (S - 2 * pad) / (y1 - y0))
    ox = (S - (x1 - x0) * sc) / 2 - x0 * sc
    oy = (S - (y1 - y0) * sc) / 2 - y0 * sc
    P = lambda pts: [(ox + x * sc, oy + y * sc) for x, y in pts]
    d.polygon(P([(175, 103), (366, 103), (366, 251), (175, 251)]), fill="#FFFFFF")
    d.polygon(P([(175, 305), (366, 305), (366, 1044), (175, 1044)]), fill="#FFFFFF")
    d.polygon(P([(428, 305), (1065, 305), (954, 456), (428, 456)]), fill="#5BB637")
    d.polygon(P([(428, 528), (894, 528), (783, 679), (578, 679), (578, 874), (428, 1044)]), fill="#5BB637")
    img.resize((220, 220), Image.LANCZOS).save(path)


def mt_client():
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    c = TelegramClient(StringSession(), API_ID, API_HASH)
    c.start(bot_token=BOT)
    return c


def mt_download():
    # katta videolar (2 GB gacha) to'liq Telegram protokoli orqali yuklanadi
    c = mt_client()
    try:
        m = c.get_messages(int(CHAT), ids=MSG_ID)
        if not m or not m.media:
            return False
        c.download_media(m, file="in.mp4")
        return os.path.exists("in.mp4")
    finally:
        c.disconnect()


def mt_send(caption, html, w, h, dur):
    from telethon import Button
    from telethon.tl.types import DocumentAttributeVideo
    c = mt_client()
    try:
        btn = [[Button.inline("✅ Chop etish", b"ucpub")], [Button.inline("✏️ Tahrirlash", b"ucedit"), Button.inline("❌ Bekor qilish", b"ucskip")]]
        c.send_file(int(CHAT), "out.mp4", caption=caption, parse_mode="html" if html else None, buttons=btn,
                    supports_streaming=True, attributes=[DocumentAttributeVideo(dur, w, h, supports_streaming=True)])
        return True
    finally:
        c.disconnect()


def main():
    make_logo()
    use_mt = bool(API_ID and API_HASH and MSG_ID)
    if use_mt:
        try:
            ok = mt_download()
        except Exception as e:
            print("mt_download", e)
            ok = False
        if not ok:
            say("⚠️ Videoni yuklab bo'lmadi.")
            return
    else:
        f = tg("getFile", file_id=FID)
        if not f.get("ok"):
            say("⚠️ Videoni yuklab bo'lmadi (20 MB dan katta bo'lishi mumkin).")
            return
        urllib.request.urlretrieve(f"https://api.telegram.org/file/bot{BOT}/{f['result']['file_path']}", "in.mp4")
    pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation:stream_tags=rotate",
                         "-of", "json", "in.mp4"], capture_output=True, text=True)
    s0 = (json.loads(pr.stdout or "{}").get("streams") or [{}])[0]
    W, H = int(s0.get("width") or 1280), int(s0.get("height") or 720)
    rot = str((s0.get("tags") or {}).get("rotate", "")) + " " + " ".join(str(d.get("rotation", "")) for d in s0.get("side_data_list") or [])
    if re.search(r"(^|\s)-?(90|270)\b", rot):
        W, H = H, W
    side = min(W, H)
    lw = max(48, int(side * 0.17) // 2 * 2)
    m = max(8, int(side * 0.035))
    flt = f"[1:v]scale={lw}:-1[lg];[0:v][lg]overlay=x=main_w-overlay_w-{m}:y={m}"
    cmd = ["ffmpeg", "-y", "-i", "in.mp4", "-i", "logo.png", "-filter_complex", flt,
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "out.mp4"]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print(p.stderr[-3000:])
        say("⚠️ Videoga logotip qo'yishda xato bo'ldi. Boshqa formatdagi (MP4) video bilan urinib ko'ring.")
        return
    caption = ""
    try:
        caption = clean(gemini_caption("in.mp4"))
    except Exception as e:
        print("caption", e)
    if not caption:
        caption = "<b>Inter Futbol</b>"
        say("ℹ️ Sharh yozib bo'lmadi — videoni «✏️ Tahrirlash» orqali o'zingiz matn bilan to'ldiring.")
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                            "-of", "json", "out.mp4"], capture_output=True, text=True)
    pj = json.loads(probe.stdout or "{}")
    st = (pj.get("streams") or [{}])[0]
    dur = int(float((pj.get("format") or {}).get("duration") or 0))
    if use_mt:
        try:
            mt_send(caption, True, int(st.get("width", 0)), int(st.get("height", 0)), dur)
            return
        except Exception as e:
            print("mt_send html", e)
            try:
                plain = re.sub(r"<[^>]+>", "", caption).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
                mt_send(plain, False, int(st.get("width", 0)), int(st.get("height", 0)), dur)
                return
            except Exception as e2:
                print("mt_send", e2)
                say("⚠️ Tayyor videoni yuborib bo'lmadi.")
                return
    args = ["curl", "-sS", "-F", f"chat_id={CHAT}", "-F", "video=@out.mp4", "-F", "supports_streaming=true",
            "-F", f"width={st.get('width', 0)}", "-F", f"height={st.get('height', 0)}", "-F", f"duration={dur}",
            "--form-string", f"reply_markup={json.dumps(KB)}"]
    r = json.loads(subprocess.run(args + ["--form-string", f"caption={caption}", "-F", "parse_mode=HTML",
                                          f"https://api.telegram.org/bot{BOT}/sendVideo"], capture_output=True, text=True).stdout or "{}")
    if not r.get("ok"):
        print(r)
        plain = re.sub(r"<[^>]+>", "", caption).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
        r = json.loads(subprocess.run(args + ["--form-string", f"caption={plain}", f"https://api.telegram.org/bot{BOT}/sendVideo"],
                                      capture_output=True, text=True).stdout or "{}")
    if not r.get("ok"):
        say("⚠️ Tayyor videoni yuborib bo'lmadi: " + str(r.get("description", ""))[:200])


try:
    main()
except Exception as e:
    print("xato", e)
    say("⚠️ Video ishlovida xato bo'ldi. Qayta urinib ko'ring.")
