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


async def run(job_id):
    # Modal: ish ma'lumoti (kanal, xabar raqamlari, hisob seansi) bot orqali olinadi; natija ZIP kanalga, hisobot botga
    import urllib.request
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    key = hashlib.sha256(("ub-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:40]
    def wapi(path, body=None):
        rq = urllib.request.Request(W + path, data=json.dumps(body).encode() if body is not None else None, headers={"x-key": key, "content-type": "application/json", "user-agent": "InterDiktorAlign"}, method="POST" if body is not None else "GET")
        return json.loads(urllib.request.urlopen(rq, timeout=60).read() or b"{}")
    j = wapi("/ub/dkjob?id=" + job_id)
    if not j.get("a"):
        return
    try:
        c = TelegramClient(StringSession(j["session"]), int(os.environ["TG_API_ID"]), os.environ["TG_API_HASH"])
        await c.connect()
        if not await c.is_user_authorized():
            raise Exception("hisob ulanishi bekor qilingan (asosiy botda /ulanish kerak)")
        await c.get_dialogs(limit=200)  # yangi seansda kanal "tanish" bo'lishi uchun
        ch = await c.get_entity(int(j["chat"]))
        ma, md = await c.get_messages(ch, ids=[int(j["a"]), int(j["d"])])
        os.makedirs("/tmp/dk", exist_ok=True)
        ap = await c.download_media(ma, file="/tmp/dk/audio")
        dp = await c.download_media(md, file="/tmp/dk/")
        if not str(dp).lower().endswith((".docx", ".txt")):
            raise Exception("matn fayli .docx yoki .txt bo'lishi kerak")
        r = process(ap, dp, "/tmp/dk/seg", os.environ.get("DK_MODEL", "medium"))
        zp = f"/tmp/dk/toplam_{j['a']}.zip"
        with zipfile.ZipFile(zp, "w", zipfile.ZIP_STORED) as z:
            for fn in sorted(os.listdir("/tmp/dk/seg")):
                z.write(os.path.join("/tmp/dk/seg", fn), fn)
        cap = f"✅ Moslandi: {r['n']} ta bo'lak, {r['sec'] // 60} daqiqa {r['sec'] % 60} soniya ({r['sents']} gapdan)."
        if r["lown"]:
            cap += f"\nIshonchi past bo'laklar: {r['lown']} ta — eshitib tekshirish kerak:\n" + "\n".join(f"• {x[0]}: {x[1]}" for x in r["low"][:8])
        if r["lost"]:
            cap += f"\n⚠️ {r['lost']} ta gap ovozda topilmadi (matn ovozdan uzunroq bo'lishi mumkin)."
        m = await c.send_file(ch, zp, caption=cap[:1000], reply_to=int(j["a"]), force_document=True)
        wapi("/ub/dkres", {"id": job_id, "ok": 1, "zip": m.id, **r})
        await c.disconnect()
    except Exception as e:
        try:
            wapi("/ub/dkres", {"id": job_id, "ok": 0, "err": str(e)[:300]})
        except Exception:
            pass
        raise


if __name__ == "__main__":
    print(json.dumps(process(sys.argv[1], sys.argv[2], sys.argv[3], *(sys.argv[4:6])), ensure_ascii=False, indent=1))
