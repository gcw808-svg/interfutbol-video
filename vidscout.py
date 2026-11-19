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
BAD = re.compile(r"american football|gridiron|\bnfl\b|rugby|australian rules|\bafl\b|gaelic|canadian football|table football|foosball|subbuteo|futsal|beach soccer|"
                 r"wom[ae]n|femen|f[eé]minin|frauen|damen|girls|ladies|video ?game|gameplay|robocup|robot|simulation|esports|\bfifa \d\d\b|pro evolution|"
                 r"quidditch|kinderen|children|kids|school|cheerlead|parade|protest|riot|accident|injur", re.I)
GOOD = re.compile(r"football|soccer|f[uú]tbol|fu[sß]ball|calcio|futebol|футбол|stadium|stadion|estadio|goal|penalty|free.?kick|supporters|ultras|tifo", re.I)
QUERIES = ["association football match", "football goal", "soccer goal", "football stadium", "football supporters", "football fans stadium", "football training",
           "penalty kick football", "free kick football", "football tifo", "FIFA World Cup", "UEFA Champions League", "football pitch drone", "stadium aerial football",
           "Uzbekistan football", "Pakhtakor", "football derby", "football crowd", "corner kick", "goalkeeper save", "football warm up", "Fußball Tor", "calcio stadio", "fútbol estadio"]


def clean(x):
    return html.unescape(re.sub(r"<[^>]+>", "", x or "")).strip()


def search(q):
    p = {"action": "query", "format": "json", "generator": "search", "gsrsearch": "filetype:video " + q, "gsrnamespace": 6, "gsrlimit": 40,
         "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiextmetadatafilter": "LicenseShortName|Artist|Categories|ImageDescription"}
    for i in range(3):
        try:
            r = requests.get(API, params=p, headers=UA, timeout=40)
            if r.status_code == 200:
                return list((r.json().get("query") or {}).get("pages", {}).values())
        except Exception as e:
            print("  qidiruv xatosi:", str(e)[:100])
        time.sleep(4 + 4 * i)
    return []


def probe(path):
    try:
        o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", path], capture_output=True, text=True, timeout=60).stdout
        j = json.loads(o); st = (j.get("streams") or [{}])[0]
        return int(st.get("width") or 0), int(st.get("height") or 0), float((j.get("format") or {}).get("duration") or 0)
    except Exception:
        return 0, 0, 0.0


def encode(src, dst, crf):
    vf = "scale=w='if(gt(iw,ih),min(1280,iw),-2)':h='if(gt(iw,ih),-2,min(1280,ih))',fps=30,format=yuv420p"
    r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-c:a", "aac", "-b:a", "128k", "-ac", "2",
                        "-movflags", "+faststart", dst], capture_output=True, text=True, timeout=1500)
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 20000


def main():
    seen_r = requests.get(W + "/ub/vdseen", headers=H, timeout=40).json()
    if not seen_r.get("ok"):
        print("::error::Video roboti: bot bazasi javob bermadi —", seen_r.get("err")); sys.exit(1)
    seen = set(seen_r.get("keys") or [])
    print("bazada:", seen_r.get("total"), "ta video; ko'rilgan manbalar:", len(seen))
    qs = [os.environ["Q"]] if os.environ.get("Q") else random.sample(QUERIES, len(QUERIES))
    added, rej, errs, looked = [], [], 0, 0
    tmp = tempfile.mkdtemp()
    for q in qs:
        if len(added) >= LIMIT:
            break
        pages = search(q); print("qidiruv:", q, "—", len(pages), "ta natija")
        time.sleep(2)
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
            text = " ".join([title, clean((md.get("ImageDescription") or {}).get("value"))[:600], clean((md.get("Categories") or {}).get("value"))])
            dur = float(ii.get("duration") or 0); w, h = int(ii.get("width") or 0), int(ii.get("height") or 0); size = int(ii.get("size") or 0)
            why = ""
            if not str(ii.get("mime", "")).startswith("video/"): why = "video emas"
            elif not OK_LIC.search(lic): why = "litsenziya: " + (lic or "yo'q")
            elif BAD.search(text): why = "mavzu mos emas"
            elif not GOOD.search(text): why = "futbol belgisi yo'q"
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
    print("::notice::Video roboti: ko'rildi %d, qo'shildi %d, rad etildi %d, xato %d%s" % (looked, len(added), len(rej), errs, (" | " + "; ".join(x[:40] for x in added[:6])) if added else ""))
    if errs and not added:
        sys.exit(1)


main()
