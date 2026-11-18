# INTER DIKTOR — OVOZ + MATNNI MOSLASH (2026-11-18, Bahtiyor aka: "ovoz tashlab, Word fayl tashlasam, solishtirib hamma so'zlarni o'z o'rniga qo'ysin"):
# "Inter Diktor — Ovozlar" kanaliga tashlangan uzun ovoz yozuvi va uning matni (Word .docx yoki .txt) bir-biriga MAJBURIY MOSLANADI
# (forced alignment: stable-ts + Whisper large-v3, MIT) — matn Word'dan AYNAN olinadi, model faqat har so'zning vaqtini topadi.
# Yozuv gaplarga bo'linadi (2–18 soniya), har bo'lak 24 kHz mono WAV, yonida matni (asl va o'qilishi — uznum.norm). Natija bitta ZIP bo'lib
# kanalga, o'sha ovoz yozuviga javob qilib tashlanadi (metadata.csv: fayl|matn|o'qilishi|boshi|oxiri|ishonch). Ishonchi past bo'laklar hisobotda ko'rsatiladi.
# Modal'da (GPU) ishlaydi; fayllar Bahtiyor akaning hisobi orqali yuklab olinadi (bot 20 MB dan katta faylni ololmaydi).
import csv, hashlib, io, json, os, re, subprocess, sys, zipfile

W = "https://inter-futbol-bot.gcw808.workers.dev"


def docx_text(path):
    # Word matni: sarlavhalar va "o'qima" izohlari o'qilmaydi (skill qoidasi)
    if path.lower().endswith(".txt"):
        raw = open(path, encoding="utf-8", errors="ignore").read().split("\n")
        paras = [(p, "") for p in raw]
    else:
        import docx
        d = docx.Document(path)
        paras = [(p.text, (p.style.name if p.style is not None else "") or "") for p in d.paragraphs]
    out = []
    for t, st in paras:
        t = (t or "").strip()
        if not t or re.match(r"(heading|title|subtitle|sarlavha|заголов)", st, re.I):
            continue
        t = re.sub(r"[\(\[\{][^\)\]\}]*o['‘’ʻʼ`]?qima[^\)\]\}]*[\)\]\}]", " ", t, flags=re.I)
        if re.match(r"\s*o['‘’ʻʼ`]?qima\b", t, re.I):
            continue
        t = re.sub(r"\s+", " ", t).strip()
        if t:
            out.append(t)
    return out


def sentences(paras):
    out = []
    for p in paras:
        for s in re.split(r"(?<=[.!?…])\s+(?=[\"«“A-ZА-ЯЎҚҒҲÖĞŞÇ0-9‘'])", p):
            s = s.strip()
            if s:
                out.append(s)
    return out


def spoken(t):
    try:
        import uznum
        return uznum.norm(t)
    except Exception:
        return t


def toks(s):
    return re.findall(r"[^\s]+", s)


def align(audio, sents, model_name="large-v3", lang="uz", device=None):
    import stable_whisper
    model = stable_whisper.load_model(model_name, device=device)
    text = " ".join(spoken(s) for s in sents)
    res = model.align(audio, text, language=lang)
    words = [w for seg in res.segments for w in seg.words]
    return [(w.word.strip(), float(w.start), float(w.end), float(getattr(w, "probability", 0) or 0)) for w in words if w.word.strip()]


def group(sents, words):
    # so'zlar ketma-ketligi matn bilan bir xil tartibda: har gapga uning so'zlari soni bo'yicha vaqt oralig'i beriladi
    key = lambda s: re.sub(r"[^\w']+", "", s.lower(), flags=re.U)
    segs, i = [], 0
    for s in sents:
        want = [key(t) for t in toks(spoken(s)) if key(t)]
        got = []
        j = i
        while j < len(words) and len(got) < len(want):
            if key(words[j][0]):
                got.append(words[j])
            j += 1
        if not got:
            continue
        i = j
        segs.append({"text": s, "spoken": spoken(s), "start": got[0][1], "end": got[-1][2], "prob": sum(g[3] for g in got) / len(got), "w": got})
    return segs


def shape(segs, mn=2.0, mx=18.0):
    out = []
    for s in segs:
        d = s["end"] - s["start"]
        if d > mx:  # uzun gap — vergullardan bo'linadi
            parts, cur = [], []
            for tk, w in zip(toks(s["spoken"]), s["w"]) if len(toks(s["spoken"])) == len(s["w"]) else [(w[0], w) for w in s["w"]]:
                cur.append((tk, w))
                if tk.endswith((",", ";", ":")) and cur[-1][1][2] - cur[0][1][1] >= 4.0:
                    parts.append(cur); cur = []
            if cur:
                parts.append(cur)
            for p in parts:
                out.append({"text": " ".join(x[0] for x in p), "spoken": " ".join(x[0] for x in p), "start": p[0][1][1], "end": p[-1][1][2], "prob": sum(x[1][3] for x in p) / len(p), "split": 1})
        else:
            out.append({k: s[k] for k in ("text", "spoken", "start", "end", "prob")})
    merged = []
    for s in out:  # juda qisqa bo'lak qo'shnisiga qo'shiladi (orasida uzun pauza bo'lmasa)
        if merged and (s["end"] - s["start"] < mn or merged[-1]["end"] - merged[-1]["start"] < mn) and s["start"] - merged[-1]["end"] < 1.2 and s["end"] - merged[-1]["start"] <= mx:
            m = merged[-1]
            m.update(text=m["text"] + " " + s["text"], spoken=m["spoken"] + " " + s["spoken"], end=s["end"], prob=(m["prob"] + s["prob"]) / 2)
        else:
            merged.append(dict(s))
    return merged


def cut(audio, segs, out_dir, pad=0.12, sr=24000):
    os.makedirs(out_dir, exist_ok=True)
    rows = []
    for k, s in enumerate(segs, 1):
        a = max(0.0, s["start"] - pad)
        b = s["end"] + pad
        if k < len(segs):
            b = min(b, max(s["end"], segs[k]["start"] - 0.02))
        fn = f"{k:04d}.wav"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", audio, "-ac", "1", "-ar", str(sr), "-c:a", "pcm_s16le", os.path.join(out_dir, fn)], check=True)
        rows.append([fn, s["text"], s["spoken"], f"{a:.2f}", f"{b:.2f}", f"{s['prob']:.2f}"])
    with open(os.path.join(out_dir, "metadata.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="|")
        w.writerow(["fayl", "matn", "oqilishi", "boshi", "oxiri", "ishonch"])
        w.writerows(rows)
    return rows


def process(audio, doc, out_dir, model_name="large-v3", lang="uz", device=None):
    sents = sentences(docx_text(doc))
    wav = os.path.join(os.path.dirname(out_dir) or ".", "full16k.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", audio, "-ac", "1", "-ar", "16000", wav], check=True)
    words = align(wav, sents, model_name, lang, device)
    segs = shape(group(sents, words))
    rows = cut(audio, segs, out_dir)
    dur = sum(float(r[4]) - float(r[3]) for r in rows)
    low = [r for r in rows if float(r[5]) < 0.45]
    lost = len(sents) - len(group(sents, words))
    return {"n": len(rows), "sec": round(dur), "sents": len(sents), "low": [[r[0], r[1][:80], r[5]] for r in low[:25]], "lown": len(low), "lost": max(0, lost)}


CYR = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"j","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"s","ч":"ch","ш":"sh","щ":"sh","ъ":"","ы":"i","ь":"","э":"e","ю":"yu","я":"ya","ў":"o","қ":"q","ғ":"g","ҳ":"h"}


def nkey(t):
    # solishtirish uchun yagona ko'rinish: kichik harf, kirill → lotin, o'/g' belgisiz, faqat harf-raqam (Whisper o'zbekchani ba'zan kirillda yozadi)
    t = spoken(t).lower()
    t = "".join(CYR.get(ch, ch) for ch in t)
    t = t.replace("ö", "o").replace("ğ", "g").replace("ş", "sh").replace("ç", "ch")
    t = re.sub(r"[‘’ʻʼ`']", "", t)
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def hear(wavs, lang="uz"):
    # har bir ovoz faylida nima deyilganini taxminan eshitish (matndagi joyini topish uchun; aniq matn Word'dan olinadi)
    out = []
    try:
        from faster_whisper import WhisperModel
        fw = WhisperModel(os.environ.get("DK_HEAR", "medium"), device="cpu", compute_type="int8", cpu_threads=8, download_root="/root/.cache/whisper/fw")
        for w in wavs:
            segs, _ = fw.transcribe(w, language=lang, beam_size=1, condition_on_previous_text=False, vad_filter=False)
            out.append(" ".join(x.text.strip() for x in segs))
        del fw
    except Exception as e:
        print("faster-whisper ishlamadi:", str(e)[:200], flush=True)
        import stable_whisper
        m = stable_whisper.load_model(os.environ.get("DK_MODEL", "medium"))
        out = [m.transcribe(w, language=lang, beam_size=1, condition_on_previous_text=False, verbose=None).text for w in wavs]
    return out


def place(sents, heard):
    # har bir ovoz fayli matndagi QAYSI gaplarga to'g'ri kelishini topish: fayllar matn tartibida, o'qilmagan qatorlar (mavzu, sarlavha, izoh) tashlab o'tiladi
    import difflib
    keys = [nkey(x) for x in sents]
    res, ptr = [], 0
    for h in heard:
        hk = nkey(h)
        best = (0.0, None, None)
        if len(hk) >= 8:
            for s0 in range(ptr, min(len(sents), ptr + 14)):
                acc = ""
                for e0 in range(s0 + 1, len(sents) + 1):
                    acc = (acc + " " + keys[e0 - 1]).strip()
                    if len(acc) > 1.9 * len(hk) + 60:
                        break
                    if len(acc) < 0.45 * len(hk):
                        continue
                    r = difflib.SequenceMatcher(None, hk, acc, autojunk=False).ratio() - 0.004 * (s0 - ptr)
                    if r > best[0]:
                        best = (r, s0, e0)
        if best[1] is None or best[0] < 0.35:
            res.append({"s": None, "e": None, "score": round(max(best[0], 0), 2), "heard": h})
        else:
            res.append({"s": best[1], "e": best[2], "score": round(best[0], 2), "heard": h})
            ptr = best[2]
    return res


def process_set(wavs, doc, out_dir, model_name="medium", lang="uz", device=None):
    # wavs — tartib bilan 24 kHz mono fayllar. Natija: bo'laklar (har fayl ichida gaplarga bo'lingan), metadata.csv va hisobot.csv
    import stable_whisper
    sents = sentences(docx_text(doc))
    heard = hear(wavs, lang)
    pl = place(sents, heard)
    for k, x in enumerate(pl, 1):
        print(f"fayl {k}: gaplar {x['s']}..{x['e']} o'xshashlik {x['score']} | {x['heard'][:90]}", flush=True)
    model = stable_whisper.load_model(model_name, device=device)
    os.makedirs(out_dir, exist_ok=True)
    rows, rep, n, used = [], [], 0, set()
    for k, (w, x) in enumerate(zip(wavs, pl), 1):
        if x["s"] is None:
            rep.append([f"{k:03d}", "", f"{x['score']:.2f}", "MATNDA TOPILMADI", x["heard"][:300]])
            continue
        sub = sents[x["s"]:x["e"]]
        used.update(range(x["s"], x["e"]))
        w16 = w[:-4] + "_16k.wav"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", w, "-ac", "1", "-ar", "16000", w16], check=True)
        try:
            res = model.align(w16, " ".join(spoken(t) for t in sub), language=lang)
            words = [(q.word.strip(), float(q.start), float(q.end), float(getattr(q, "probability", 0) or 0)) for sg in res.segments for q in sg.words if q.word.strip()]
            segs = shape(group(sub, words))
        except Exception as e:
            print("moslash xatosi", k, str(e)[:200], flush=True)
            segs = []
        if not segs:  # so'zma-so'z moslab bo'lmadi — fayl butunligicha, matni bilan
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", w], capture_output=True, text=True).stdout.strip() or 0)
            segs = [{"text": " ".join(sub), "spoken": " ".join(spoken(t) for t in sub), "start": 0.0, "end": dur, "prob": 0.0}]
        for i2, sg in enumerate(segs):
            n += 1
            a = max(0.0, sg["start"] - 0.12)
            b = sg["end"] + 0.12
            if i2 + 1 < len(segs):
                b = min(b, max(sg["end"], segs[i2 + 1]["start"] - 0.02))
            fn = f"{n:04d}.wav"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", w, "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", os.path.join(out_dir, fn)], check=True)
            rows.append([fn, sg["text"], sg["spoken"], f"{k:03d}", f"{a:.2f}", f"{b:.2f}", f"{x['score']:.2f}"])
        rep.append([f"{k:03d}", f"{x['s'] + 1}-{x['e']}", f"{x['score']:.2f}", " ".join(sub)[:300], x["heard"][:300]])
    with open(os.path.join(out_dir, "metadata.csv"), "w", encoding="utf-8", newline="") as f:
        cw = csv.writer(f, delimiter="|")
        cw.writerow(["fayl", "matn", "oqilishi", "manba_ovoz", "boshi", "oxiri", "oxshashlik"])
        cw.writerows(rows)
    with open(os.path.join(out_dir, "hisobot.csv"), "w", encoding="utf-8", newline="") as f:
        cw = csv.writer(f, delimiter="|")
        cw.writerow(["ovoz_fayli", "matndagi_gaplar", "oxshashlik", "matn", "eshitilgani"])
        cw.writerows(rep)
    skipped = [sents[i3] for i3 in range(len(sents)) if i3 not in used]
    with open(os.path.join(out_dir, "oqilmagan.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(skipped))
    dur = sum(float(r[5]) - float(r[4]) for r in rows)
    weak = [r for r in rep if r[1] and float(r[2]) < 0.6]
    miss = [r for r in rep if not r[1]]
    return {"n": len(rows), "sec": round(dur), "sents": len(sents), "files": len(wavs), "weak": [[r[0], r[2]] for r in weak], "miss": [r[0] for r in miss], "skipped": len(skipped), "lown": len(weak) + len(miss), "lost": len(skipped)}


def is_audio(m):
    if m is None or not m.media:
        return False
    if m.voice or m.audio:
        return True
    d = m.document
    return bool(d and (d.mime_type or "").startswith("audio/"))


def doc_name(m):
    if m is None or not m.document or is_audio(m):
        return ""
    n = (m.file.name or "") if m.file else ""
    return n if n.lower().endswith((".docx", ".txt")) else ""


async def run(job_id):
    # Modal: bitta MATN fayli (Word) + shu matn o'qilgan BIR NECHTA ovoz fayli (2026-11-19: Bahtiyor aka 1 ta Word va 27 ta qisqa yozuv tashladi).
    # To'plam: matn faylidan KEYIN (keyingi matn fayligacha) tashlangan barcha ovozlar, tartib bilan; keyin ovoz bo'lmasa — matndan OLDIN tashlanganlar.
    # Ovozlar ketma-ket ulanadi va butun matn shu umumiy yozuvga moslanadi. Fayllar hisob seansi orqali o'qiladi (KV'dagi ro'yxatga bog'liq emas).
    import asyncio, time, urllib.request
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    key = hashlib.sha256(("ub-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:40]
    def wapi(path, body=None):
        rq = urllib.request.Request(W + path, data=json.dumps(body).encode() if body is not None else None, headers={"x-key": key, "content-type": "application/json", "user-agent": "InterDiktorAlign"}, method="POST" if body is not None else "GET")
        return json.loads(urllib.request.urlopen(rq, timeout=60).read() or b"{}")
    j = wapi("/ub/dkjob?id=" + job_id)
    if not j.get("d"):
        return
    did = int(j["d"])
    try:
        c = TelegramClient(StringSession(j["session"]), int(os.environ["TG_API_ID"]), os.environ["TG_API_HASH"])
        await c.connect()
        if not await c.is_user_authorized():
            raise Exception("hisob ulanishi bekor qilingan (asosiy botda /ulanish kerak)")
        await c.get_dialogs(limit=200)  # yangi seansda kanal "tanish" bo'lishi uchun
        ch = await c.get_entity(int(j["chat"]))
        # ovozlar tashlab bo'linishini kutish: kanalda 100 soniya yangi fayl kelmasa — boshlanadi (ko'pi bilan 20 daqiqa)
        t0 = time.time()
        while time.time() - t0 < 1200 and not j.get("now"):
            last = None
            async for m in c.iter_messages(ch, limit=30):
                if is_audio(m) or doc_name(m):
                    last = m
                    break
            if last is None or time.time() - last.date.timestamp() > 100:
                break
            await asyncio.sleep(20)
        lo = max(1, did - 400)
        ms = [m for m in await c.get_messages(ch, ids=list(range(lo, did + 401))) if m is not None]
        md = next((m for m in ms if m.id == did), None)
        if not doc_name(md):
            raise Exception("matn fayli .docx yoki .txt bo'lishi kerak")
        prev = max([m.id for m in ms if m.id < did and doc_name(m)] or [0])
        nxt = min([m.id for m in ms if m.id > did and doc_name(m)] or [10 ** 12])
        auds = [m for m in ms if is_audio(m) and did < m.id < nxt] or [m for m in ms if is_audio(m) and prev < m.id < did]
        if not auds:
            raise Exception("bu matnning ovoz fayllari topilmadi — avval Word faylini, keyin shu matnning ovoz fayllarini tashlang")
        os.makedirs("/tmp/dk/in", exist_ok=True)
        dp = await c.download_media(md, file="/tmp/dk/")
        parts = []
        for k, m in enumerate(sorted(auds, key=lambda x: x.id), 1):
            ap = await c.download_media(m, file=f"/tmp/dk/in/{k:03d}")
            wp = f"/tmp/dk/in/{k:03d}.wav"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", ap, "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", wp], check=True)
            parts.append(wp)
        r = process_set(parts, dp, "/tmp/dk/seg", os.environ.get("DK_MODEL", "medium"))
        zp = f"/tmp/dk/toplam_{did}.zip"
        with zipfile.ZipFile(zp, "w", zipfile.ZIP_STORED) as z:
            for fn in sorted(os.listdir("/tmp/dk/seg")):
                z.write(os.path.join("/tmp/dk/seg", fn), fn)
        cap = f"✅ Moslandi: {len(parts)} ta ovoz fayli → {r['n']} ta bo'lak, {r['sec'] // 60} daqiqa {r['sec'] % 60} soniya. Har bir ovoz matndagi o'z joyiga qo'yildi."
        if r["miss"]:
            cap += f"\n⚠️ Matnda joyi topilmagan ovozlar: {', '.join(r['miss'][:15])}-fayl."
        if r["weak"]:
            cap += "\nTekshirish kerak (matnga o'xshashligi past): " + ", ".join(f"{a}-fayl ({b})" for a, b in r["weak"][:12]) + "."
        if r["skipped"]:
            cap += f"\nMatndagi {r['skipped']} ta qator o'qilmagan deb topildi (ro'yxati ZIP ichida: oqilmagan.txt)."
        cap += "\nZIP ichida: bo'laklar, metadata.csv, hisobot.csv (qaysi ovoz qaysi matnga tushgani)."
        m = await c.send_file(ch, zp, caption=cap[:1000], reply_to=did, force_document=True)
        wapi("/ub/dkres", {"id": job_id, "ok": 1, "zip": m.id, "first": min(x.id for x in auds), "last": max(x.id for x in auds), **{k: v for k, v in r.items() if k not in ("weak", "miss")}, "weak": len(r["weak"]), "miss": len(r["miss"])})
        await c.disconnect()
    except Exception as e:
        try:
            wapi("/ub/dkres", {"id": job_id, "ok": 0, "err": str(e)[:300]})
        except Exception:
            pass
        raise


if __name__ == "__main__":
    print(json.dumps(process(sys.argv[1], sys.argv[2], sys.argv[3], *(sys.argv[4:6])), ensure_ascii=False, indent=1))
