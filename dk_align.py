# INTER DIKTOR — OVOZ + MATNNI MOSLASH (2026-11-18, Bahtiyor aka: "ovoz tashlab, Word fayl tashlasam, solishtirib hamma so'zlarni o'z o'rniga qo'ysin"):
# "Inter Diktor — Ovozlar" kanaliga tashlangan uzun ovoz yozuvi va uning matni (Word .docx yoki .txt) bir-biriga MAJBURIY MOSLANADI
# (forced alignment: stable-ts + Whisper large-v3, MIT) — matn Word'dan AYNAN olinadi, model faqat har so'zning vaqtini topadi.
# Yozuv gaplarga bo'linadi (2–18 soniya), har bo'lak 24 kHz mono WAV, yonida matni (asl va o'qilishi — uznum.norm). Natija bitta ZIP bo'lib
# kanalga, o'sha ovoz yozuviga javob qilib tashlanadi (metadata.csv: fayl|matn|o'qilishi|boshi|oxiri|ishonch). Ishonchi past bo'laklar hisobotda ko'rsatiladi.
# Modal'da (GPU) ishlaydi; fayllar Bahtiyor akaning hisobi orqali yuklab olinadi (bot 20 MB dan katta faylni ololmaydi).
import csv, hashlib, io, json, os, re, subprocess, sys, zipfile

W = "https://inter-futbol-bot.gcw808.workers.dev"


def _t(x, n=0):
    # OMBOR JURNALLARI HAMMAGA OCHIQ (2026-11-19): ssenariy matni va eshitilgan gaplar jurnalga CHIQARILMAYDI — faqat uzunligi.
    # (video chiqishidan oldin matnni begonalar ko'rmasligi uchun; DK_LOGTEXT=1 faqat yopiq muhitda tashxis uchun)
    x = str(x)
    return x[:n or 200] if os.environ.get("DK_LOGTEXT") == "1" else f"[{len(x)} belgi]"


def docx_text(path):
    # Word matni: sarlavhalar va "o'qima" izohlari o'qilmaydi (skill qoidasi)
    if path.lower().endswith(".txt"):
        raw = open(path, encoding="utf-8", errors="ignore").read().split("\n")
        paras = [(p, "") for p in raw]
    else:
        import docx
        d = docx.Document(path)
        def ptext(p):  # satr uzilishi (Shift+Enter) bo'sh joysiz yopishib qolmasligi uchun: sarlavha va matn bitta xatboshida kelgan hujjatlar bor
            o = []
            for el in p._p.iter():
                tg = el.tag.rsplit("}", 1)[-1]
                if tg == "t":
                    o.append(el.text or "")
                elif tg in ("br", "cr", "pict"):  # pict — gorizontal chiziq (veb/ChatGPT'dan ko'chirilgan matnda sarlavha bilan matn orasida turadi)
                    o.append("\n")
                elif tg == "tab":
                    o.append(" ")
            return "".join(o)
        if os.environ.get("DK_DEBUG", "0") == "1":
            print("xatboshilar:", len(d.paragraphs), flush=True)
            for p in d.paragraphs[:14]:
                print("P>", _t(ptext(p)), "| uslub:", (p.style.name if p.style is not None else ""), flush=True)
            for p in d.paragraphs:
                if "Edgar Davids" in p.text and "Birinchi" in p.text:
                    xx = re.sub(r"\s+", " ", p._p.xml)
                    ii = xx.find("Edgar Davids")
                    print("XML>", _t(xx[max(0, ii - 300):ii + 700], 1000), flush=True)
                    break
        paras = []
        for p in d.paragraphs:
            stn = (p.style.name if p.style is not None else "") or ""
            for ln in ptext(p).split("\n"):
                paras.append((ln, stn))
    out = []
    for t, st in paras:
        t = (t or "").strip()
        if not t or re.match(r"(heading|title|subtitle|sarlavha|заголов)", st, re.I):
            continue
        t = re.sub(r"[\(\[\{][^\)\]\}]*o['‘’ʻʼ`]?qima[^\)\]\}]*[\)\]\}]", " ", t, flags=re.I)
        if re.match(r"\s*o['‘’ʻʼ`]?qima\b", t, re.I):
            continue
        t = re.sub(r"\s+", " ", t).strip()
        # qisqa, oxirida tinish belgisi yo'q qator — bo'lim sarlavhasi ("Edgar Davids", "Petr Chex"): diktor uni o'qimaydi
        if t and len(t.split()) <= 8 and not re.search(r"[.!?…:;,»”\"]$", t):
            continue
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


CYR = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"j","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"s","ч":"ch","ш":"sh","щ":"sh","ъ":"","ы":"i","ь":"","э":"e","ю":"yu","я":"ya","ў":"o","қ":"q","ғ":"g","ҳ":"h","ұ":"u","ү":"u","ө":"o","ә":"a","і":"i","ң":"n","һ":"h"}


def nkey(t):
    # solishtirish uchun yagona ko'rinish: kichik harf, kirill → lotin, o'/g' belgisiz, faqat harf-raqam (Whisper o'zbekchani ba'zan kirillda yozadi)
    t = spoken(t).lower()
    t = "".join(CYR.get(ch, ch) for ch in t)
    t = t.replace("ö", "o").replace("ğ", "g").replace("ş", "sh").replace("ç", "ch")
    t = re.sub(r"[‘’ʻʼ`']", "", t)
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def hear(wavs, lang="uz", keys=None):
    # har bir ovoz faylida nima deyilganini taxminan eshitish (matndagi joyini topish uchun; aniq matn Word'dan olinadi).
    # Natija diskda saqlanadi (keys — faylning o'zgarmas belgisi): qayta moslashda 15 daqiqalik eshitish takrorlanmaydi.
    cdir = os.path.join(os.environ.get("DK_CACHE", "/root/.cache/whisper"), "heard")
    os.makedirs(cdir, exist_ok=True)
    out = [None] * len(wavs)
    for i, k in enumerate(keys or []):
        fp = os.path.join(cdir, k + "_uz2.txt" if os.environ.get("DK_HEAR_HF") else k + ".txt")  # _uz2 — faqat o'zbekcha model HAQIQATAN ishlatilganda yoziladi
        if os.path.exists(fp):
            out[i] = open(fp, encoding="utf-8").read()
    todo = [i for i in range(len(wavs)) if not out[i]]
    if todo:
        done, uzok = [], False
        try:
            import numpy as np
            from faster_whisper import WhisperModel
            root = os.environ.get("DK_CACHE", "/root/.cache/whisper")
            name = os.environ.get("DK_HEAR", "medium")
            hf = os.environ.get("DK_HEAR_HF", "")  # o'zbek tiliga o'rgatilgan Whisper (masalan islomov/rubaistt_v2_medium) — CTranslate2 ko'rinishiga bir marta o'giriladi
            if hf:
                ct = os.path.join(root, "ct2_" + re.sub(r"[^A-Za-z0-9]+", "_", hf))
                try:
                    if not os.path.exists(os.path.join(ct, "model.bin")):
                        subprocess.run(["ct2-transformers-converter", "--model", hf, "--output_dir", ct, "--quantization", "int8", "--force"], check=True, timeout=1500)
                    from huggingface_hub import hf_hub_download
                    import shutil
                    for fn in ("tokenizer.json", "preprocessor_config.json", "vocab.json", "added_tokens.json", "special_tokens_map.json", "normalizer.json", "merges.txt", "tokenizer_config.json"):
                        if not os.path.exists(os.path.join(ct, fn)):
                            for repo in (hf, "openai/whisper-medium"):  # modelda bo'lmasa — asl Whisper medium'niki (tokenlar bir xil)
                                try:
                                    shutil.copy(hf_hub_download(repo, fn), os.path.join(ct, fn))
                                    break
                                except Exception:
                                    pass
                    name = ct
                    uzok = True
                except Exception as e:
                    print("o'zbek modeli tayyorlanmadi, oddiy model ishlatiladi:", str(e)[:200], flush=True)
            fw = WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4, download_root=os.path.join(root, "fw"))
            print("eshitish modeli:", name, flush=True)
            for i in todo:
                raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", wavs[i], "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
                segs, _ = fw.transcribe(np.frombuffer(raw, dtype=np.float32), language=lang, beam_size=2, temperature=0.0, condition_on_previous_text=False, vad_filter=False, no_speech_threshold=None, log_prob_threshold=None, compression_ratio_threshold=None)
                out[i] = " ".join(x.text.strip() for x in segs)
                done.append(i)
                print(f"eshitildi {i + 1}/{len(wavs)}: {_t(out[i])}", flush=True)
            del fw
        except Exception as e:
            print("faster-whisper ishlamadi:", str(e)[:300], flush=True)
        for i in done:  # faqat haqiqatan eshitilganlari saqlanadi (xato bo'lganda bo'sh natija saqlanib qolmasin)
            if keys and out[i]:
                open(os.path.join(cdir, keys[i] + ("_uz2.txt" if uzok else ".txt")), "w", encoding="utf-8").write(out[i])
    return [x or "" for x in out]


def wav_dur(w):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", w], capture_output=True, text=True).stdout.strip() or 0)


def place(sents, heard, durs):
    # HAR BIR OVOZ FAYLI MATNDAGI QAYSI GAPLARGA TO'G'RI KELISHINI TOPISH (2026-11-19).
    # Whisper o'zbekchani yomon eshitadi (ko'p faylda bo'sh yoki chalkash matn), shuning uchun ikki belgi birga ishlatiladi:
    #   1) DAVOMIYLIK — matn uzunligi (o'qilishi bo'yicha belgilar) o'qish tezligiga ko'paytirilganda fayl davomiyligiga mos kelishi kerak;
    #   2) O'XSHASHLIK — eshitilgan matn bor joyda u matn bo'lagiga o'xshashi kerak (langar vazifasini o'taydi).
    # Fayllar matn tartibida; o'qilmagan qatorlar (mavzu, sarlavha, izoh) tashlab o'tilishi mumkin. Dinamik dasturlash bilan eng yaxshi umumiy taqsimot topiladi.
    import difflib
    keys = [nkey(x) for x in sents]
    L = [max(1, len(k)) for k in keys]
    cum = [0]
    for x in L:
        cum.append(cum[-1] + x)
    hk = [nkey(h) for h in heard]
    N, K = len(sents), len(durs)
    rate = cum[-1] / max(1.0, sum(durs))  # belgi/soniya; birinchi taxmin (o'qilmagan qatorlar sabab biroz katta), keyin aniqlashtiriladi
    simc = {}
    def sim(k, s0, e0):
        if len(hk[k]) < 25:
            return None
        key = (k, s0, e0)
        if key not in simc:
            simc[key] = difflib.SequenceMatcher(None, hk[k], " ".join(keys[s0:e0]), autojunk=False).ratio()
        return simc[key]
    best = None
    for it in range(3):
        INF = 1e18
        D = [[INF] * (N + 1) for _ in range(K + 1)]
        P = [[None] * (N + 1) for _ in range(K + 1)]
        D[0][0] = 0.0
        for k in range(K):
            want = durs[k] * rate
            for pe in range(N + 1):
                if D[k][pe] >= INF:
                    continue
                # FAYL MATNDA YO'Q BO'LISHI MUMKIN (2026-11-27: 22 ta ovozli to'plam "ovozlar matnga to'g'ri kelmadi" deb butunlay yiqilgan edi):
                # boshqa matnning yozuvi aralashib qolgan, qayta o'qilgan dubl yoki matnda yo'q qo'shimcha gap. Bunday fayl jarima bilan tashlab o'tiladi —
                # butun to'plam yiqilmaydi, fayl hisobotda "matnda topilmadi" bo'lib ko'rsatiladi.
                if D[k][pe] + 3.5 < D[k + 1][pe]:
                    D[k + 1][pe] = D[k][pe] + 3.5
                    P[k + 1][pe] = (pe, None)
                for s0 in range(pe, min(N, pe + (16 if k == 0 else 12)) ):
                    skip = (s0 - pe) * (0.05 if k == 0 else 0.35)
                    for e0 in range(s0 + 1, N + 1):
                        ch = cum[e0] - cum[s0]
                        if ch > 2.2 * want + 80:
                            break
                        if ch < 0.4 * want:
                            continue
                        er = (ch - want) / want
                        c = min(4.0, 6.0 * er * er)
                        sm = sim(k, s0, e0)
                        if sm is not None:
                            c -= 2.5 * sm
                            if sm < 0.45:  # bog'liq bo'lmagan o'zbekcha matnlar ham harf darajasida 0.3–0.4 o'xshaydi; haqiqiy moslik 0.7+
                                c += 5.0  # aniq eshitilgan, lekin matnning bu joyiga umuman o'xshamaydi — boshqa matn yozuvi; noto'g'ri matn yopishtirilmasin
                        v = D[k][pe] + skip + c
                        if v < D[k + 1][e0]:
                            D[k + 1][e0] = v
                            P[k + 1][e0] = (pe, s0)
        e_end = min(range(N + 1), key=lambda e: D[K][e] + 0.02 * (N - e))
        if D[K][e_end] >= INF:
            return None
        asg, e0 = [], e_end
        for k in range(K, 0, -1):
            pe, s0 = P[k][e0]
            asg.append((e0, e0) if s0 is None else (s0, e0))
            e0 = pe
        asg.reverse()
        best = asg
        tot = sum(cum[e] - cum[s0] for s0, e in asg)
        rate = tot / max(1.0, sum(d for d, (s0, e) in zip(durs, asg) if e > s0))
    out = []
    for k, (s0, e0) in enumerate(best):
        if e0 == s0:
            out.append({"s": s0, "e": e0, "fit": 0.0, "sim": None, "heard": heard[k], "skip": True})
            continue
        want = durs[k] * rate
        fit = (cum[e0] - cum[s0]) / want
        sm = sim(k, s0, e0)
        out.append({"s": s0, "e": e0, "fit": round(fit, 2), "sim": None if sm is None else round(sm, 2), "heard": heard[k]})
    return out


def reconcile(sub, heard):
    # MATNNI OVOZGA MOSLAB TUZATISH (Bahtiyor aka, 2026-11-19: "sarlavha yoki boshqa so'zlar qolib ketgan yoki qo'shilgan bo'lishi mumkin — hammasini tahlil qilsin").
    # Diktor matndan chetga chiqqan joylar aniqlanadi: o'qilmay tashlab ketilgan so'zlar matndan olinadi, qo'shib o'qilgan so'zlar matnga qo'shiladi.
    # Imlo doim Word'dan olinadi; eshitilgan matn faqat QAYSI so'zlar aytilganini bildiradi. O'xshash so'zlar (eshitishdagi mayda xato) o'zgartirilmaydi.
    import difflib
    toks, sid = [], []
    for si, t in enumerate(sub):
        for o in t.split():
            toks.append(o)
            sid.append(si)
    A, back = [], []
    for ti, o in enumerate(toks):
        for wd in nkey(o).split():
            A.append(wd)
            back.append(ti)
    H = nkey(heard).split()
    if len(H) < 4 or not A:
        return list(sub), [], []
    sm = difflib.SequenceMatcher(None, A, H, autojunk=False)
    if sm.ratio() < 0.55:  # eshitish ishonchsiz yoki boshqa matn — tegilmaydi
        return list(sub), [], []
    drop_w = [False] * len(A)
    ins = {}  # token index -> qo'shiladigan so'zlar (shu tokendan KEYIN); -1 — eng boshiga
    dropped, added, doubt = [], [], []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        a_, h_ = A[i1:i2], H[j1:j2]
        if tag == "replace":
            if difflib.SequenceMatcher(None, " ".join(a_), " ".join(h_), autojunk=False).ratio() >= 0.5:
                continue  # bir xil so'zning boshqacha eshitilishi
        # EHTIYOT: eshitish modeli ham adashadi — bitta so'zlik farq va yozuv oxiridagi "musiqa", "the result" kabi uydirmalar
        # (Whisper jimlikda shunday yozadi) matnga KIRITILMAYDI, faqat hisobotda "tekshirish kerak" deb ko'rsatiladi.
        # Faqat 2 va undan ortiq so'zdan iborat aniq farq qo'llanadi (o'qilmay qolgan ibora/gap, qo'shib o'qilgan sarlavha).
        if tag in ("delete", "replace") and a_:
            if len(a_) >= 2:
                for q in range(i1, i2):
                    drop_w[q] = True
            else:
                doubt.append("o'qilmagan bo'lishi mumkin: " + " ".join(a_))
        if tag in ("insert", "replace") and h_:
            junk = all(x in ("musiqa", "the", "result", "subtitr", "subtitrlar", "rahmat", "obuna", "boling", "you", "thank") for x in h_)
            tail = j2 == len(H) and len(h_) <= 3
            if len(h_) >= 2 and not junk and not tail:
                at = back[i1 - 1] if i1 > 0 else -1
                ins.setdefault(at, []).extend(h_)
                added.append(" ".join(h_))
            elif not junk:
                doubt.append("qo'shib o'qilgan bo'lishi mumkin: " + " ".join(h_))
    per = {}
    for q, ti in enumerate(back):
        per.setdefault(ti, []).append(drop_w[q])
    gone = {ti for ti, fl in per.items() if all(fl)}
    run = []
    for ti in range(len(toks)):
        if ti in gone:
            run.append(toks[ti])
        elif run:
            dropped.append(" ".join(run)); run = []
    if run:
        dropped.append(" ".join(run))
    out = [[] for _ in sub]
    if -1 in ins and sub:
        out[0].extend(ins[-1])
    for ti, o in enumerate(toks):
        if ti not in gone:
            out[sid[ti]].append(o)
        if ti in ins:
            out[sid[ti]].extend(ins[ti])
    return [" ".join(x) for x in out], dropped, added + ["? " + d for d in doubt]


def silences(w):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", w, "-af", "silencedetect=noise=-34dB:d=0.22", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r)]
    return [((a + b) / 2, b - a) for a, b in zip(st, en)]


def split_file(w, sub, dur, mx=16.0):
    # fayl ichida gaplar chegarasi: kutilgan vaqt (matn ulushi bo'yicha) atrofidagi eng uzun PAUZA; pauza topilmasa — bo'linmaydi (so'z o'rtasidan kesilmaydi)
    if dur <= mx or len(sub) < 2:
        return [(0.0, dur, 0, len(sub))]
    L = [max(1, len(nkey(x))) for x in sub]
    tot = float(sum(L))
    sil = [x for x in silences(w) if 0.4 < x[0] < dur - 0.4]
    cuts, acc = [], 0
    for i2 in range(len(sub) - 1):
        acc += L[i2]
        t = dur * acc / tot
        near = [x for x in sil if abs(x[0] - t) <= max(1.5, 0.12 * dur)]
        if near:
            m = max(near, key=lambda x: x[1] - 0.25 * abs(x[0] - t))
            cuts.append((m[0], i2 + 1))
    parts, a, ai = [], 0.0, 0
    n_parts = max(2, int(dur // 11) + 1)
    target = dur / n_parts
    for t, idx in cuts:
        if t - a >= 0.75 * target and dur - t >= 0.5 * target and idx > ai:
            parts.append((a, t, ai, idx))
            a, ai = t, idx
    parts.append((a, dur, ai, len(sub)))
    return parts


def process_set(wavs, doc, out_dir, model_name="medium", lang="uz", device=None, keys=None):
    # wavs — tartib bilan 24 kHz mono fayllar. Natija: bo'laklar, metadata.csv, hisobot.csv va oqilmagan.txt
    allsents = sentences(docx_text(doc))
    # "Mavzu: …", "YouTube uchun sarlavha: …", "Teglar: …" kabi yorliqli qatorlar o'qilmaydi — moslashga kiritilmaydi
    meta = [t for t in allsents if re.match(r"^[^.!?:]{1,45}:\s", t) and re.match(r"^(mavzu|youtube|sarlavha|tavsif|teg|heshteg|hashtag|davomiylig|format|manba|izoh|eslatma|kalit|thumbnail|muqova|video|ssenariy|reja|til|ovoz|uslub|maqsad)", t, re.I)]
    sents = [t for t in allsents if t not in meta]
    durs = [wav_dur(w) for w in wavs]
    heard = hear(wavs, lang, keys)
    pl = place(sents, heard, durs)
    print(f"matn: {len(sents)} gap, {sum(len(nkey(x)) for x in sents)} belgi; ovozlar: {len(wavs)} ta, {sum(durs):.0f} s; eshitilgan (25+ belgi): {sum(1 for h in heard if len(nkey(h)) >= 25)} ta", flush=True)
    nomatch = [k for k, x in enumerate(pl or [], 1) if x.get("skip")]
    if nomatch:
        print("matnda topilmagan fayllar:", nomatch, flush=True)
    if pl is None or len(nomatch) > len(wavs) / 2:
        raise Exception("ovozlar matnga to'g'ri kelmadi: matn bu ovozlar uchun juda qisqa yoki boshqa matn")
    os.makedirs(out_dir, exist_ok=True)
    rows, rep, n, used, fixed = [], [], 0, set(), []
    for k, (w, x) in enumerate(zip(wavs, pl), 1):
        if x.get("skip"):
            rep.append([f"{k:03d}", f"{durs[k-1]:.1f}", "", "0.00", "", "", "MATNDA TOPILMADI — bazaga qo'shilmadi", "", x["heard"][:300]])
            continue
        sub0 = sents[x["s"]:x["e"]]
        used.update(range(x["s"], x["e"]))
        sub, dr, ad = reconcile(sub0, x["heard"])
        keep = [i4 for i4, t in enumerate(sub) if t.strip()]  # butunlay o'qilmagan gap bo'lakka kirmaydi
        sub = [sub[i4] for i4 in keep]
        if not sub:
            sub, dr, ad = list(sub0), [], []
        if dr or [q for q in ad if not q.startswith("? ")]:
            fixed.append(f"{k:03d}")
        if dr or ad:
            print(f"  tuzatildi {k}: tashlab ketilgan {len(dr)} ta ibora, qo'shilgan/shubhali {len(ad)} ta", flush=True)
        print(f"fayl {k} ({durs[k-1]:.0f}s): gaplar {x['s']+1}-{x['e']} mos={x['fit']} oxsh={x['sim']} | matn {_t(' '.join(sub))} || eshitilgan {_t(x['heard'])}", flush=True)
        for a, b, i0, i1 in split_file(w, sub, durs[k - 1]):
            n += 1
            fn = f"{n:04d}.wav"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", w, "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", os.path.join(out_dir, fn)], check=True)
            txt = " ".join(sub[i0:i1])
            rows.append([fn, txt, " ".join(spoken(t) for t in sub[i0:i1]), f"{k:03d}", f"{a:.2f}", f"{b:.2f}", f"{x['fit']:.2f}"])
        rep.append([f"{k:03d}", f"{durs[k-1]:.1f}", f"{x['s'] + 1}-{x['e']}", f"{x['fit']:.2f}", "" if x["sim"] is None else f"{x['sim']:.2f}", "; ".join(dr), "; ".join(ad), " ".join(sub)[:400], x["heard"][:300]])
    with open(os.path.join(out_dir, "metadata.csv"), "w", encoding="utf-8", newline="") as f:
        cw = csv.writer(f, delimiter="|")
        cw.writerow(["fayl", "matn", "oqilishi", "manba_ovoz", "boshi", "oxiri", "moslik"])
        cw.writerows(rows)
    with open(os.path.join(out_dir, "hisobot.csv"), "w", encoding="utf-8", newline="") as f:
        cw = csv.writer(f, delimiter="|")
        cw.writerow(["ovoz_fayli", "soniya", "matndagi_gaplar", "moslik(1=aniq)", "oxshashlik", "oqilmay_qolgan_sozlar", "qoshib_oqilgan_sozlar", "tuzatilgan_matn", "eshitilgani"])
        cw.writerows(rep)
    skipped = meta + [sents[i3] for i3 in range(len(sents)) if i3 not in used]
    with open(os.path.join(out_dir, "oqilmagan.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(skipped))
    dur = sum(float(r[5]) - float(r[4]) for r in rows)
    weak = [[r[0], r[3]] for r in rep if r[2] and (abs(float(r[3]) - 1) > 0.22 or (r[4] and float(r[4]) < 0.45))]
    return {"nomatch": nomatch, "fixed": fixed, "n": len(rows), "sec": round(dur), "sents": len(sents), "files": len(wavs), "weak": weak, "miss": [], "skipped": len(skipped), "lown": len(weak), "lost": len(skipped)}


def is_audio(m):
    if m is None or not m.media:
        return False
    if re.match(r"(namuna_|asl_ovoz)", ((m.file.name or "") if m.file else ""), re.I):
        return False  # diktor namunalari — baza yozuvi emas
    if (m.message or "").lstrip().lower().startswith("#matnsiz"):
        return False  # matnsiz (eski) yozuvlar — Word to'plamiga kirmaydi, alohida ishlanadi (dk_old.py)
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
        for t in range(6):  # Modal'da tarmoq ba'zan bir zum uzilib qoladi ("Network is unreachable") — qayta uriniladi
            try:
                return json.loads(urllib.request.urlopen(rq, timeout=60).read() or b"{}")
            except Exception:
                if t == 5:
                    raise
                time.sleep(4 + 4 * t)
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
            if last is None or time.time() - last.date.timestamp() > 150:
                break
            await asyncio.sleep(20)
        if not wapi("/ub/dkjob?id=" + job_id).get("live", 1):  # shu matn uchun yangiroq ish boshlangan — bu eskirgan
            print("eskirgan ish — to'xtadi", flush=True)
            await c.disconnect()
            return
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
        parts, hkeys = [], []
        for k, m in enumerate(sorted(auds, key=lambda x: x.id), 1):
            hkeys.append(f"{abs(int(j['chat']))}_{m.id}_{(m.file.size if m.file else 0) or 0}")
            ap = await c.download_media(m, file=f"/tmp/dk/in/{k:03d}")
            wp = f"/tmp/dk/in/{k:03d}.wav"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", ap, "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", wp], check=True)
            parts.append(wp)
        r = process_set(parts, dp, "/tmp/dk/seg", os.environ.get("DK_MODEL", "medium"), keys=hkeys)
        zp = f"/tmp/dk/toplam_{did}.zip"
        with zipfile.ZipFile(zp, "w", zipfile.ZIP_STORED) as z:
            for fn in sorted(os.listdir("/tmp/dk/seg")):
                z.write(os.path.join("/tmp/dk/seg", fn), fn)
        cap = f"✅ Moslandi ({j.get('v') or 'Kozim Komilov'}): {len(parts)} ta ovoz fayli → {r['n']} ta bo'lak, {r['sec'] // 60} daqiqa {r['sec'] % 60} soniya. Har bir ovoz matndagi o'z joyiga qo'yildi."
        if r["miss"]:
            cap += f"\n⚠️ Matnda joyi topilmagan ovozlar: {', '.join(r['miss'][:15])}-fayl."
        if r.get("nomatch"):
            cap += "\nMatnda topilmadi (bazaga qo'shilmadi): " + ", ".join(f"{a}-fayl" for a in r["nomatch"][:20]) + ". Bular boshqa matnning yozuvi bo'lishi mumkin."
        if r["weak"]:
            cap += "\nEshitib tekshirish kerak (matn uzunligi ovozga unchalik mos emas): " + ", ".join(f"{a}-fayl" for a, b in r["weak"][:14]) + "."
        if r["skipped"]:
            cap += f"\nMatndagi {r['skipped']} ta qator o'qilmagan deb topildi (ro'yxati ZIP ichida: oqilmagan.txt)."
        if r.get("fixed"):
            cap += f"\nMatn ovozga moslab tuzatildi ({len(r['fixed'])} ta faylda so'z tashlab ketilgan yoki qo'shib o'qilgan): {', '.join(r['fixed'][:14])}-fayl. Tafsiloti hisobot.csv da."
        cap += "\nZIP ichida: bo'laklar, metadata.csv, hisobot.csv (qaysi ovoz qaysi matnga tushgani)."
        # O'QITISH BAZASI: to'plam yopiq omborga (Hugging Face, faqat egasi ko'radi) ham saqlanadi — diktorni shu bazada o'qitish uchun
        try:
            if os.environ.get("HF_TOKEN"):
                from huggingface_hub import HfApi
                api = HfApi(token=os.environ["HF_TOKEN"])
                vs = re.sub(r"[^a-z0-9]+", "_", (j.get("v") or "Kozim Komilov").lower()).strip("_")
                api.upload_file(path_or_fileobj=zp, path_in_repo=f"data/{vs}/{did}.zip", repo_id=api.whoami()["name"] + "/inter-diktor", commit_message=f"to'plam {did}: {r['n']} bo'lak")
                print("bazaga saqlandi:", f"data/{vs}/{did}.zip", flush=True)
        except Exception as e:
            print("bazaga saqlanmadi:", str(e)[:200], flush=True)
        m = await c.send_file(ch, zp, caption=cap[:1000], reply_to=did, force_document=True)
        wapi("/ub/dkres", {"id": job_id, "ok": 1, "zip": m.id, "first": min(x.id for x in auds), "last": max(x.id for x in auds), **{k: v for k, v in r.items() if k not in ("weak", "miss", "fixed")}, "fixed": len(r.get("fixed") or []), "weak": len(r["weak"]), "miss": len(r["miss"])})
        await c.disconnect()
    except Exception as e:
        try:
            wapi("/ub/dkres", {"id": job_id, "ok": 0, "err": str(e)[:300]})
        except Exception:
            pass
        raise


async def sweep():
    # NAZORATCHI (2026-11-19, Bahtiyor aka: "Word va audiolarni ketma-ket tashlayveraman, kanal o'zi bir chetdan o'qiyverishi kerak, qolib ketgani bo'lmasin"):
    # kanaldagi HAMMA matn fayllari ko'rib chiqiladi; to'plami yo'q, xato bilan tugagan yoki ovozlari keyin qo'shilgan matn qayta moslashga yuboriladi.
    import time, urllib.request
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    key = hashlib.sha256(("ub-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:40]
    def wapi(path, body=None):
        rq = urllib.request.Request(W + path, data=json.dumps(body).encode() if body is not None else None, headers={"x-key": key, "content-type": "application/json", "user-agent": "InterDiktorSweep"}, method="POST" if body is not None else "GET")
        return json.loads(urllib.request.urlopen(rq, timeout=240).read() or b"{}")
    j = wapi("/ub/dksweep")
    c = TelegramClient(StringSession(j["session"]), int(os.environ["TG_API_ID"]), os.environ["TG_API_HASH"])
    await c.connect()
    await c.get_dialogs(limit=200)
    ch = await c.get_entity(int(j["chat"]))
    ms = [m async for m in c.iter_messages(ch, limit=3000)]
    await c.disconnect()
    ms.sort(key=lambda m: m.id)
    fresh = [m for m in ms if is_audio(m) or doc_name(m)]
    if fresh and time.time() - fresh[-1].date.timestamp() < 180:
        print("hali tashlanmoqda — keyingi safar", flush=True)
        return
    docs = [m.id for m in ms if doc_name(m)]
    todo = []
    for n, d in enumerate(docs):
        prev = docs[n - 1] if n else 0
        nxt = docs[n + 1] if n + 1 < len(docs) else 10 ** 12
        auds = [m.id for m in ms if is_audio(m) and d < m.id < nxt] or [m.id for m in ms if is_audio(m) and prev < m.id < d]
        st = j["sets"].get(str(d))
        why = ""
        if not auds:
            why = ""
        elif not st:
            why = "to'plam yo'q"
        elif st["st"] == "xato":
            # 2026-11-23: matn 617 "ovozlar matnga to'g'ri kelmadi" xatosi bilan har ~10 daqiqada cheksiz qayta yuborilardi
            # (har safar KV yozuvlari va Telegram seansi). Endi: xatodan keyin yangi ovoz/matn qo'shilgan bo'lsa darhol, aks holda 6 soatda bir marta.
            fat = (st.get("at") or 0) / 1000
            newer = any(m.date.timestamp() > fat for m in ms if m.id == d or m.id in auds)
            if newer:
                why = "xato bilan tugagan, keyin yangi fayl qo'shilgan"
            elif time.time() - fat > 6 * 3600:
                why = "xato bilan tugagan (6 soatdan keyin qayta urinish)"
        elif st["st"] == "moslanmoqda" and time.time() - (st.get("at") or 0) / 1000 > 4 * 60:  # ishlar navbat bilan (bitta guruh): nazoratchi ishlayotganda boshqa ish yo'q — demak bu ish navbatda bekor bo'lgan
            why = "osilib qolgan"
        elif st["st"] == "tayyor" and (st.get("files") != len(auds) or st.get("last") != max(auds)):
            why = f"ovozlar soni o'zgargan ({st.get('files')} → {len(auds)})"
        print(f"matn {d}: {len(auds)} ta ovoz, holat {st and st['st']} {('— ' + why) if why else ''}", flush=True)
        if why:
            todo.append(d)
    for d in todo[:1]:  # bittadan: ish tugagach nazoratchi o'zi qayta ishga tushib keyingisini yuboradi (navbatdagi ishlar bir-birini bekor qilmasligi uchun)
        print("qayta moslashga:", d, wapi("/ub/dkredo", {"doc": d}), flush=True)


if __name__ == "__main__":
    print(json.dumps(process(sys.argv[1], sys.argv[2], sys.argv[3], *(sys.argv[4:6])), ensure_ascii=False, indent=1))
