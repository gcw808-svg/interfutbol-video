# VIDEO ROBOTI (2026-11-19, Bahtiyor aka: "video arxivga video avtomatik yig'adigan qil").
# Internetdan FAQAT ERKIN LITSENZIYALI futbol videolarini (Wikimedia Commons: CC0, Public domain, CC BY, CC BY-SA) topadi, mp4 ga o'giradi va
# "Inter Futbol — Video Arxiv" kanaliga muallif va litsenziyasi bilan tashlaydi; yozuv bot orqali D1 bazasiga tushadi.
# Mualliflik huquqi ostidagi videolar (o'yin lavhalari, telekanal va klub videolari, YouTube) YIG'ILMAYDI — skill qoidasi: boshqalarning videosi nusxalanmaydi.
# Bot kaliti bu yerga kelmaydi: fayl botning /ub/vdsend manzili orqali Telegram'ga uzatiladi.
import hashlib, html, json, os, random, re, subprocess, sys, tempfile, time
import requests

BOT = os.environ["BOT_TOKEN"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
H = {"x-key": KEY, "user-agent": "InterFutbolVidscout"}
UA = {"user-agent": "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)"}
LIMIT = int(os.environ.get("LIMIT") or "6")
DRY = os.environ.get("DRY") == "1"
API = "https://commons.wikimedia.org/w/api.php"
OK_LIC = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?)", re.I)
# futbolga aloqasi yo'q yoki kanal yo'nalishiga kirmaydigan narsalar (boshqa sport turlari, ayollar futboli, o'yinlar, robotlar)
BAD = re.compile(r"american football|gridiron|\bnfl\b|\bncaa\b|college football|quarterback|touchdown|super bowl|rugby|sipi tau|\bhaka\b|australian rules|\bafl\b|gaelic|"
                 r"canadian football|table football|foosball|subbuteo|futsal|beach soccer|baseball|yankees|\bmlb\b|basketball|\bnba\b|hockey|cricket|tennis|handball|volleyball|"
                 r"wom[ae]n|femen|f[eé]minin|frauen|damen|girls|ladies|video ?game|gameplay|robocup|robot|simulation|esports|\bfifa \d\d\b|pro evolution|"
                 r"quidditch|kinderen|children|kids|school|cheerlead|parade|protest|riot|accident|injur", re.I)
# QAT'IY: nomida yoki turkumlarida aynan futbol so'zi bo'lishi shart ("stadium", "goal" yetarli emas — birinchi ishga tushishda beysbol va regbi videosi o'tib ketgan edi)
GOOD = re.compile(r"association football|soccer|f[uú]tbol|fu[sß]ball|calcio|futebol|футбол|football club|football team|football match|football stadium|\bfc\b|"
                  r"premier league|la ?liga|serie a|bundesliga|ligue 1|champions league|world cup|uefa|fifa", re.I)
ROOTS = ["Category:Videos of association football", "Category:Videos of association football matches", "Category:Videos of association football players",
         "Category:Videos of association football supporters", "Category:Videos of association football stadiums", "Category:Videos of FIFA World Cup"]
QUERIES = ["association football match", "soccer goal", "association football stadium", "association football supporters", "soccer training", "penalty kick soccer",
           "FIFA World Cup", "UEFA Champions League", "Uzbekistan football", "Pakhtakor", "Fußball Tor", "calcio stadio", "fútbol estadio"]
GKEY = os.environ.get("GEMINI_KEY", "")
try:
    import imageio_ffmpeg
    FF = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FF = "ffmpeg"


def clean(x):
    return html.unescape(re.sub(r"<[^>]+>", "", x or "")).strip()


II = {"prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiextmetadatafilter": "LicenseShortName|Artist|Categories|ImageDescription"}


def api(p):
    for i in range(3):
        try:
            r = requests.get(API, params={"action": "query", "format": "json", **p}, headers=UA, timeout=40)
            if r.status_code == 200:
                return r.json().get("query") or {}
        except Exception as e:
            print("  so'rov xatosi:", str(e)[:100])
        time.sleep(4 + 4 * i)
    return {}


def search(q):
    return list(api({"generator": "search", "gsrsearch": "filetype:video " + q, "gsrnamespace": 6, "gsrlimit": 40, **II}).get("pages", {}).values())


def cat_files(cat):
    return list(api({"generator": "categorymembers", "gcmtitle": cat, "gcmtype": "file", "gcmlimit": 60, **II}).get("pages", {}).values())


def cat_tree(roots, cap=120):
    out, queue = [], [(r, 0) for r in roots]
    while queue and len(out) < cap:
        c, d = queue.pop(0)
        if c in out or BAD.search(c):
            continue
        out.append(c)
        if d < 3:
            for m in api({"list": "categorymembers", "cmtitle": c, "cmtype": "subcat", "cmlimit": 60}).get("categorymembers", []):
                queue.append((m["title"], d + 1))
            time.sleep(0.7)
    return out


def ai_ok(path, dur):
    """3 ta kadrni Gemini'ga ko'rsatib so'raydi: bu erkaklar futbolimi. None — model javob bermadi (matn tekshiruvi bilan qolamiz)."""
    if not GKEY:
        return None
    import base64
    parts = [{"text": "These are 3 frames from one video. Is it clearly about men's association football (soccer): a match, goal, training, stadium or supporters? "
                      "Answer NO for any other sport (baseball, rugby, American football, futsal, basketball...), women's or children's football, video games, "
                      "interviews without football, violence or accidents. Reply with JSON only: {\"football\": true|false, \"what\": \"short description\"}"}]
    for k, t in enumerate([0.2, 0.5, 0.8]):
        fr = path + ".%d.jpg" % k
        subprocess.run([FF, "-y", "-v", "error", "-ss", "%.2f" % (dur * t), "-i", path, "-frames:v", "1", "-vf", "scale=640:-2", fr], capture_output=True, timeout=120)
        if os.path.exists(fr):
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(open(fr, "rb").read()).decode()}})
    if len(parts) < 2:
        return None
    for m in ["gemini-3.8-flash", "gemini-3.5-flash-lite"]:
        try:
            r = requests.post("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent" % m, headers={"x-goog-api-key": GKEY, "content-type": "application/json"},
                              data=json.dumps({"contents": [{"parts": parts}], "generationConfig": {"temperature": 0}}), timeout=90)
            if r.status_code != 200:
                continue
            t = "".join(p.get("text", "") for p in r.json()["candidates"][0]["content"]["parts"])
            mm = re.search(r"\{.*\}", t, re.S)
            j = json.loads(mm.group(0)) if mm else {}
            if "football" in j:
                print("    AI:", j.get("football"), "—", str(j.get("what", ""))[:80]); return bool(j["football"])
        except Exception as e:
            print("    AI xatosi:", str(e)[:80])
    return None


def probe(path):
    try:
        e = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True, timeout=60).stderr
        d = re.search(r"Duration: (\d+):(\d+):(\d+\.?\d*)", e); v = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", e)
        return (int(v.group(1)) if v else 0), (int(v.group(2)) if v else 0), (int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3)) if d else 0.0)
    except Exception:
        return 0, 0, 0.0


def encode(src, dst, crf):
    vf = "scale=w='if(gt(iw,ih),min(1280,iw),-2)':h='if(gt(iw,ih),-2,min(1280,ih))',fps=30,format=yuv420p"
    r = subprocess.run([FF, "-y", "-v", "error", "-i", src, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-c:a", "aac", "-b:a", "128k", "-ac", "2",
                        "-movflags", "+faststart", dst], capture_output=True, text=True, timeout=1500)
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 20000


def main():
    seen_r = requests.get(W + "/ub/vdseen", headers=H, timeout=40).json()
    if not seen_r.get("ok"):
        print("::error::Video roboti: bot bazasi javob bermadi —", seen_r.get("err")); sys.exit(1)
    seen = set(seen_r.get("keys") or [])
    print("bazada:", seen_r.get("total"), "ta video; ko'rilgan manbalar:", len(seen))
    # O'ZINI TOZALASH: robot avval qo'shgan videolar joriy qoidalar bilan qayta tekshiriladi — mos kelmay qolgani kanaldan va ro'yxatdan olib tashlanadi
    purged = 0
    try:
        items = requests.get(W + "/ub/vdlist", headers=H, timeout=40).json().get("items") or []
        bad = [x["m"] for x in items if x.get("auto") and (BAD.search(x.get("n") or "") or BAD.search(x.get("src") or ""))]
        if bad and not DRY:
            print("tozalash:", requests.post(W + "/ub/vddel", headers={**H, "content-type": "application/json"}, data=json.dumps({"m": bad}), timeout=120).text[:300]); purged = len(bad)
    except Exception as e:
        print("tozalash xatosi:", str(e)[:120])
    if os.environ.get("Q"):
        srcs = [("q", os.environ["Q"])]
    else:
        cats = cat_tree(ROOTS); random.shuffle(cats); print("turkumlar:", len(cats))
        srcs = [("c", c) for c in cats] + [("q", q) for q in random.sample(QUERIES, len(QUERIES))]
    added, rej, errs, looked = [], [], 0, 0
    tmp = tempfile.mkdtemp()
    for kind, q in srcs:
        if len(added) >= LIMIT or looked > 400:
            break
        pages = cat_files(q) if kind == "c" else search(q)
        if pages:
            print(("turkum:" if kind == "c" else "qidiruv:"), q[:70], "—", len(pages), "ta fayl")
        time.sleep(1.5)
        for pg in pages:
            if len(added) >= LIMIT:
                break
            title = pg.get("title", ""); key = "commons:" + title
            ii = (pg.get("imageinfo") or [None])[0]
            if not ii or key in seen:
                continue
            seen.add(key); looked += 1
            md = ii.get("extmetadata") or {}
            lic = clean((md.get("LicenseShortName") or {}).get("value")); art = clean((md.get("Artist") or {}).get("value"))[:80] or "noma'lum muallif"
            cats_t = clean((md.get("Categories") or {}).get("value")) + (" | " + q if kind == "c" else "")
            text = " ".join([title, clean((md.get("ImageDescription") or {}).get("value"))[:600], cats_t])
            dur = float(ii.get("duration") or 0); w, h = int(ii.get("width") or 0), int(ii.get("height") or 0); size = int(ii.get("size") or 0)
            why = ""
            if not str(ii.get("mime", "")).startswith("video/"): why = "video emas"
            elif not OK_LIC.search(lic): why = "litsenziya: " + (lic or "yo'q")
            elif BAD.search(text): why = "mavzu mos emas"
            elif not GOOD.search(title + " " + cats_t): why = "futbol belgisi yo'q"
            elif min(w, h) and min(w, h) < 480: why = "sifati past (%dx%d)" % (w, h)
            elif dur and (dur < 4 or dur > 180): why = "uzunligi mos emas (%d s)" % dur
            elif size > 300 * 1024 * 1024: why = "juda katta"
            if why:
                rej.append(key); print("  -", title[:70], "→", why); continue
            name = re.sub(r"\.[a-z0-9]{2,5}$", "", title.replace("File:", ""), flags=re.I).replace("_", " ").strip()[:110]
            print("  +", title[:80], "|", lic, "|", "%dx%d" % (w, h), "%.0fs" % dur)
            if DRY:
                added.append(name); continue
            try:
                src = os.path.join(tmp, "in.bin"); dst = os.path.join(tmp, "out.mp4")
                with requests.get(ii["url"], headers=UA, stream=True, timeout=180) as r:
                    r.raise_for_status()
                    with open(src, "wb") as f:
                        for ch in r.iter_content(1 << 20):
                            f.write(ch)
                ok = encode(src, dst, 23)
                if ok and os.path.getsize(dst) > 47 * 1024 * 1024:
                    ok = encode(src, dst, 29)
                if not ok or os.path.getsize(dst) > 47 * 1024 * 1024:
                    rej.append(key); print("    o'girib bo'lmadi yoki 47 MB dan katta"); continue
                ow, oh, od = probe(dst)
                if od < 4 or od > 185 or min(ow, oh) < 480:
                    rej.append(key); print("    o'lchovdan o'tmadi: %dx%d %.0fs" % (ow, oh, od)); continue
                if ai_ok(dst, od) is False:
                    rej.append(key); print("    AI: futbol emas — o'tkazib yuborildi"); continue
                cap = "%s\n\nManba: Wikimedia Commons\nMuallif: %s · %s\n%s\n#avto" % (name, art, lic, ii.get("descriptionurl", ""))
                meta = json.dumps({"n": name, "src": key, "cr": "%s, %s, Wikimedia Commons" % (art, lic)}, ensure_ascii=False)
                with open(dst, "rb") as f:
                    rr = requests.post(W + "/ub/vdsend", params={"meta": meta}, headers=H, data={"caption": cap[:1000], "duration": str(int(round(od))), "width": str(ow), "height": str(oh)},
                                       files={"video": ("video.mp4", f, "video/mp4")}, timeout=900)
                j = rr.json() if rr.headers.get("content-type", "").startswith("application/json") else {"ok": False, "err": "http %d" % rr.status_code}
                if j.get("ok"):
                    added.append(name); print("    arxivga yozildi: №%s (%s), %.1f MB" % (j.get("m"), j.get("how"), os.path.getsize(dst) / 1048576))
                else:
                    errs += 1; seen.discard(key); print("    yuborilmadi:", j.get("err"))
                time.sleep(5)
            except Exception as e:
                errs += 1; seen.discard(key); print("    xato:", str(e)[:160])
    if rej and not DRY:
        try:
            requests.post(W + "/ub/vdseen", headers={**H, "content-type": "application/json"}, data=json.dumps({"keys": rej}), timeout=40)
        except Exception:
            pass
    print("::notice::Video roboti: ko'rildi %d, qo'shildi %d, rad etildi %d, xato %d, tozalandi %d, AI %s%s" % (looked, len(added), len(rej), errs, purged, "bor" if GKEY else "yo'q", (" | " + "; ".join(x[:40] for x in added[:6])) if added else ""))
    if errs and not added:
        sys.exit(1)


if __name__ == "__main__":
    main()
