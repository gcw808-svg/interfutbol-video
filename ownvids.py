# O'Z VIDEOLARIMIZ ROBOTI (2026-11-19, Bahtiyor aka: "ha" — o'z videolarimizni arxivga ko'chirish).
# Instagram'dagi O'Z hisobimiz (@interfutbol_tv) videolarini rasmiy API orqali (bot orqali, kalit bu yerga kelmaydi) olib,
# "Inter Futbol — Video Arxiv" kanaliga va D1 bazasiga ko'chiradi. Yangilaridan boshlab, har ishga tushishda LIMIT tadan; ko'chirilgani qayta olinmaydi.
# Video o'zgartirilmaydi (47 MB dan katta bo'lsagina siqiladi). Instagram ba'zi videolarning faylini bermaydi (masalan musiqasi cheklangan) — ular o'tkazib yuboriladi.
import json, os, re, sys, tempfile, time
import requests
from vidscout import W, H, FF, probe
import subprocess

LIMIT = int(os.environ.get("LIMIT") or "25")
MAXB = 47 * 1024 * 1024


def shrink(src, dst, crf):
    vf = "scale=w='if(gt(iw,ih),min(1920,iw),-2)':h='if(gt(iw,ih),-2,min(1920,ih))',format=yuv420p"
    r = subprocess.run([FF, "-y", "-v", "error", "-i", src, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-c:a", "aac", "-b:a", "128k",
                        "-movflags", "+faststart", dst], capture_output=True, text=True, timeout=1500)
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 20000


def main():
    sr = requests.get(W + "/ub/vdseen", headers=H, timeout=40).json()
    if not sr.get("ok"):
        print("::error::O'z videolar roboti: bot bazasi javob bermadi —", sr.get("err")); sys.exit(1)
    seen = set(sr.get("keys") or [])
    tmp = tempfile.mkdtemp(); added, skipped, nofile, errs, pages, total, after = 0, 0, [], 0, 0, 0, ""
    while added < LIMIT and pages < 40:
        r = requests.get(W + "/ub/igmedia", params={"limit": 50, **({"after": after} if after else {})}, headers=H, timeout=60).json()
        if not r.get("ok"):
            # Meta ishlab chiquvchi hisobi to'xtatilgan bo'lsa ("API access blocked") — bu kod xatosi emas: ogohlantirib, xatosiz tugaydi (har 3 soatda qizil ish bo'lmasin)
            print("::warning::O'z videolar roboti: Instagram javob bermadi — %s" % r.get("err")); sys.exit(0 if "blocked" in str(r.get("err")).lower() else 1)
        pages += 1
        for it in r.get("data") or []:
            if it.get("media_type") != "VIDEO":
                continue
            total += 1; key = "ig:" + str(it.get("id"))
            if key in seen:
                skipped += 1; continue
            if added >= LIMIT:
                break
            if not it.get("media_url"):
                nofile.append(key); continue
            cap0 = (it.get("caption") or "").strip()
            line = next((x.strip() for x in cap0.split("\n") if x.strip() and not x.strip().startswith("#")), "")
            day = (it.get("timestamp") or "")[:10]
            name = (re.sub(r"\s+", " ", line)[:100] or "Instagram video") + (" (" + day + ")" if day else "")
            try:
                src = os.path.join(tmp, "in.mp4"); dst = os.path.join(tmp, "out.mp4")
                with requests.get(it["media_url"], stream=True, timeout=180) as d:
                    d.raise_for_status()
                    with open(src, "wb") as f:
                        for ch in d.iter_content(1 << 20):
                            f.write(ch)
                path = src
                if os.path.getsize(src) > MAXB:
                    ok = shrink(src, dst, 24)
                    if ok and os.path.getsize(dst) > MAXB:
                        ok = shrink(src, dst, 30)
                    if not ok or os.path.getsize(dst) > MAXB:
                        nofile.append(key); print("  juda katta, siqib bo'lmadi:", name[:60]); continue
                    path = dst
                w, h, du = probe(path)
                cap = "%s\n\nManba: o'z Instagram sahifamiz (@interfutbol_tv)\n%s\n#oz #instagram" % (name, it.get("permalink", ""))
                meta = json.dumps({"n": name, "src": key, "cr": "o'z videomiz, Instagram", "own": 1}, ensure_ascii=False)
                with open(path, "rb") as f:
                    rr = requests.post(W + "/ub/vdsend", params={"meta": meta}, headers=H, data={"caption": cap[:1000], "duration": str(int(round(du))), "width": str(w), "height": str(h)},
                                       files={"video": ("video.mp4", f, "video/mp4")}, timeout=900)
                j = rr.json() if rr.headers.get("content-type", "").startswith("application/json") else {"ok": False, "err": "http %d" % rr.status_code}
                if j.get("ok"):
                    added += 1; seen.add(key); print("  + №%s %s (%.1f MB, %dx%d, %.0fs)" % (j.get("m"), name[:60], os.path.getsize(path) / 1048576, w, h, du))
                else:
                    errs += 1; print("  yuborilmadi:", name[:50], "—", j.get("err"))
                    if "Too Many Requests" in str(j.get("err")):
                        time.sleep(40)
                time.sleep(4)
            except Exception as e:
                errs += 1; print("  xato:", name[:50], "—", str(e)[:140])
        after = r.get("next") or ""
        if not after:
            break
    if nofile:
        try:
            requests.post(W + "/ub/vdseen", headers={**H, "content-type": "application/json"}, data=json.dumps({"keys": nofile}), timeout=40)
        except Exception:
            pass
    print("::notice::O'z videolar (Instagram): ko'rilgan video %d, ko'chirildi %d, avval ko'chirilgan %d, fayli berilmagan %d, xato %d, %s" % (total, added, skipped, len(nofile), errs, "oxirigacha ko'rildi" if not after else "davomi keyingi ishga tushishda"))
    if errs and not added:
        sys.exit(1)


if __name__ == "__main__":
    main()
