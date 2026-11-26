# INTER DIKTOR — WORD FAYLDAN AUDIO (2026-11-19, Bahtiyor aka: "Kozim Komilovni tanlab Word fayl tashlasam, ichidagi mavzu va abzatslarga qarab audio tayyorlasin").
# Kaggle'ning bepul videokartasida ishlaydi (videokartasiz serverda bir Word soatlab o'qilardi). Word mavzularga (sarlavhalarga) bo'linadi:
# har mavzu — alohida audio fayl, abzatslar orasida pauza. Sarlavha va yorliq qatorlari ("Mavzu:", "YouTube uchun sarlavha:") o'qilmaydi.
# Har bo'lak o'qilgach o'zbekcha eshitish modeli bilan tekshiriladi; mos kelmasa qayta o'qiladi va eng yaxshisi olinadi.
# Matn va sarlavhalar jurnalga chiqarilmaydi (faqat sonlar). K — vaqtinchalik kalit.
import difflib, json, os, re, subprocess, sys, time, traceback, urllib.parse, urllib.request

K = "__K__"
HF = "__HF__"
TID = "__REF__"
W = "https://inter-futbol-bot.gcw808.workers.dev"
RAW = "https://raw.githubusercontent.com/gcw808-svg/interfutbol-video/main/"
LABELS = r"^(mavzu|youtube|sarlavha|tavsif|teg|heshteg|hashtag|davomiylig|format|manba|izoh|eslatma|kalit|thumbnail|muqova|video|ssenariy|reja|til|ovoz|uslub|maqsad)[^.!?:]{0,40}:\s"


def get(path, binary=False):
    rq = urllib.request.Request(W + path, headers={"user-agent": "kgsay"})
    b = urllib.request.urlopen(rq, timeout=180).read()
    return b if binary else json.loads(b or b"{}")


def post(path, data, hdr=None):
    rq = urllib.request.Request(W + path, data=data, method="POST", headers={"user-agent": "kgsay", **(hdr or {})})
    return urllib.request.urlopen(rq, timeout=300).read().decode()


def say(chat, t):
    try:
        post("/dkx/say?k=" + K, json.dumps({"to": chat, "text": t}).encode(), {"content-type": "application/json"})
    except Exception as e:
        print("say xato", type(e).__name__, flush=True)


def sh(c):
    r = subprocess.run(c, shell=True, capture_output=True, text=True, env={**os.environ, "PYTHONHASHSEED": "0"})
    if r.returncode:
        print((r.stderr or "")[-800:].replace(HF, "[HF]"), flush=True)
        raise Exception("buyruq xatosi: " + c[:50])


def sections(path):
    # [(sarlavha, [abzats, ...]), ...] — sarlavha: Word uslubi "Heading/Title" yoki qisqa (≤8 so'z), oxirida tinish belgisi yo'q qator
    if path.lower().endswith(".txt"):
        lines = [(x, "") for x in open(path, encoding="utf-8", errors="ignore").read().split("\n")]
    else:
        import docx
        d = docx.Document(path)
        def ptext(el0):
            o = []
            for el in el0.iter():
                tg = el.tag.rsplit("}", 1)[-1]
                if tg == "t":
                    o.append(el.text or "")
                elif tg in ("br", "cr", "pict"):
                    o.append("\n")
                elif tg == "tab":
                    o.append(" ")
            return "".join(o)
        lines = []
        for p in d.paragraphs:
            stn = (p.style.name if p.style is not None else "") or ""
            lines += [(ln, stn) for ln in ptext(p._p).split("\n")]
        # 2026-11-27: matn jadval, ramka yoki matn maydoni ichida bo'lsa oddiy xatboshilardan hech narsa chiqmaydi — unda hujjatdagi HAMMA xatboshilar olinadi
        def usable(ls):
            return sum(1 for t, st in ls if len((t or "").split()) > 8)
        if usable(lines) < 3:
            allp = []
            for el in d.element.body.iter():
                if el.tag.rsplit("}", 1)[-1] == "p":
                    allp += [(ln, "") for ln in ptext(el).split("\n")]
            print(f"Word: oddiy xatboshilarda matn yo'q ({len(lines)} qator) — butun hujjatdan olindi ({len(allp)} qator)", flush=True)
            if usable(allp) > usable(lines):
                lines = allp
    out, cur = [], ["", []]
    for t, stn in lines:
        t = re.sub(r"[\(\[\{][^\)\]\}]*o['‘’ʻʼ`]?qima[^\)\]\}]*[\)\]\}]", " ", t or "", flags=re.I)
        t = re.sub(r"\s+", " ", t).strip()
        if not t or re.match(r"o['‘’ʻʼ`]?qima\b", t, re.I):
            continue
        if re.match(LABELS, t, re.I):
            continue
        head = bool(re.match(r"(heading|title|subtitle|sarlavha|заголов)", stn, re.I)) or (len(t.split()) <= 8 and not re.search(r"[.!?…:;,»”\"]$", t))
        if head:
            if cur[1]:
                out.append(tuple(cur))
            cur = [t, []]
        else:
            cur[1].append(t)
    if cur[1]:
        out.append(tuple(cur))
    return out


def main():
    os.chdir("/kaggle/working")
    job = get("/dkx/tjob?k=" + K + "&id=" + TID)
    if not job.get("f"):
        print("ish topilmadi", flush=True)
        return
    chat = job["chat"]
    try:
        run(job)
    except Exception as e:
        print("XATO:", traceback.format_exc()[-1500:].replace(HF, "[HF]").replace(K, "[K]"), flush=True)
        say(chat, "⚠️ Word faylni o'qishda xato chiqdi (" + type(e).__name__ + "). Faylni qayta tashlang; takrorlansa menga ayting.")
        raise


def run(job):
    chat, voice = job["chat"], job.get("v") or "Kozim Komilov"
    name = job.get("name") or "matn.docx"
    path = "matn" + (".txt" if name.lower().endswith(".txt") else ".docx")
    open(path, "wb").write(get("/dkx/tfile?k=" + K + "&id=" + TID, True))
    sh("pip install -q f5-tts python-docx")
    for fn in ("tts.py", "uznum.py"):
        open(fn, "wb").write(urllib.request.urlopen(RAW + fn, timeout=60).read())
    os.environ.setdefault("BOT_TOKEN", "x")
    os.environ.setdefault("JOB", "say")
    sys.path.insert(0, ".")
    import numpy as np, soundfile as sf, torch
    import tts as T
    secs = sections(path)
    nchar = sum(len(p) for _, ps in secs for p in ps)
    print(f"mavzular: {len(secs)}, abzatslar: {sum(len(ps) for _, ps in secs)}, belgilar: {nchar}", flush=True)
    if not secs:
        say(chat, "⚠️ Word faylda o'qiladigan matn topilmadi.")
        return
    open("ref.wav", "wb").write(get("/dkx/ttsref?k=" + K + "&m=oddiy", True))
    try:
        lex = get("/dkx/ttslex?k=" + K) or {}
    except Exception:
        lex = {}
    from huggingface_hub import HfApi, hf_hub_download
    api = HfApi(token=HF)
    repo = api.whoami()["name"] + "/inter-diktor"
    fs = [f for f in api.list_repo_files(repo) if f.endswith("/inter_diktor.safetensors")]
    fs.sort(key=lambda f: int(re.sub(r"\D", "", f.split("/")[0]) or 0))
    ckpt = hf_hub_download(repo, fs[-1], token=HF)
    mname = fs[-1].split("/")[0]
    vocab = hf_hub_download("mrmuminov/f5-tts-uzbek", "vocab.txt")
    from f5_tts.api import F5TTS
    m = F5TTS(model="F5TTS_v1_Base", ckpt_file=ckpt, vocab_file=vocab)
    asr = None
    try:
        from transformers import pipeline
        asr = pipeline("automatic-speech-recognition", model="islomov/rubaistt_v2_medium", device=0 if torch.cuda.is_available() else -1, torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32)
    except Exception as e:
        print("eshitish modeli ochilmadi:", type(e).__name__, flush=True)
    CYR = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ж":"j","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"s","ч":"ch","ш":"sh","ъ":"","ь":"","э":"e","ю":"yu","я":"ya","ё":"yo","ў":"o","қ":"q","ғ":"g","ҳ":"h"}
    def nk(t):
        t = "".join(CYR.get(ch, ch) for ch in t.lower())
        return re.sub(r"[^a-z0-9]+", "", re.sub(r"[‘’ʻʼ`']", "", t))
    def score(wav, sr, text):
        import librosa
        y = librosa.resample(wav, orig_sr=sr, target_sr=16000) if sr != 16000 else wav
        h = asr({"raw": y, "sampling_rate": 16000}, generate_kwargs={"language": "uz", "task": "transcribe"})["text"]
        return difflib.SequenceMatcher(None, nk(text), nk(h)).ratio()
    if not (job.get("only") or job.get("find")):
        say(chat, f"🎙 {voice}: Word qabul qilindi — {len(secs)} ta mavzu, {nchar} belgi. O'qiyapman; har mavzu alohida audio bo'lib keladi.")
    t0, sent, low = time.time(), 0, 0
    for si, (title, paras) in enumerate(secs, 1):
        if job.get("only") and si != int(job["only"]):
            continue
        if job.get("find") and not any(job["find"].lower() in p.lower() for p in paras):
            continue
        audio, sr = [], 24000
        for p in paras:
            for c in T.chunks(T.clean(T.apply_lex(T.cyr2lat(p), lex))):
                short = len(c) < 45
                plan = [(0.8, 1000), (0.65, 1077), (0.95, 1154)] if short else [(0.95, 1000), (0.95, 1077), (0.9, 1154)]
                best, bs = None, -1.0
                for spd, seed in (plan if asr else plan[:1]):
                    wav, sr, _ = m.infer(ref_file="ref.wav", ref_text=T.REFS["oddiy"], gen_text=c if re.search(r"[.!?…]$", c) else c + ".", nfe_step=32, remove_silence=False, speed=spd, seed=seed)
                    wav = np.asarray(wav, dtype=np.float32)
                    try:
                        sc = score(wav, sr, c) if asr else 1.0
                    except Exception as e:
                        print("tekshiruv xatosi:", type(e).__name__, flush=True)
                        asr, sc = None, 1.0
                    if sc > bs:
                        best, bs = wav, sc
                    if sc >= 0.92:
                        break
                low += bs < 0.8
                audio += [best, np.zeros(int(0.12 * sr), dtype=np.float32)]  # gaplar orasi asl o'qishdagidek qisqa (o'lchov: 0.26 s)
            audio.append(np.zeros(int(0.5 * sr), dtype=np.float32))  # abzatslar orasida uzunroq pauza
        full = np.concatenate(audio)
        sf.write("o.wav", full, sr)
        sh("ffmpeg -loglevel error -y -i o.wav -af loudnorm=I=-16:TP=-1.5 -ac 1 -ar 44100 -b:a 160k o.mp3")
        ttl = title or os.path.splitext(name)[0]
        fn = ("namuna_" if int(chat) < 0 else "") + f"{si:02d}_" + re.sub(r"[^\w\- ]+", "", ttl)[:50].strip().replace(" ", "_") + ".mp3"
        cap = f"🎙 {voice} · {si}/{len(secs)}" + (f" · {ttl}" if title else "") + f" · model {mname}"
        r = post("/dkx/send?k=" + K + "&to=" + str(chat) + (f"&reply={job['m']}" if job.get("m") else "") + "&name=" + urllib.parse.quote(fn) + "&cap=" + urllib.parse.quote(cap[:900]), open("o.mp3", "rb").read())
        okr = '"ok":true' in r
        sent += okr
        print(f"mavzu {si}/{len(secs)}: {len(full) / sr:.0f} soniya, yuborildi {okr} ({time.time() - t0:.0f}s)", flush=True)
    if not (job.get("only") or job.get("find")):
        say(chat, f"✅ Tayyor: {sent}/{len(secs)} ta audio, {int((time.time() - t0) / 60)} daqiqada." + (f" Tekshiruvdan past o'tgan bo'laklar: {low} ta — o'sha joylarni eshitib ko'ring." if low else ""))


try:
    main()
except Exception:
    print(traceback.format_exc()[-1200:].replace(HF, "[HF]").replace(K, "[K]"), flush=True)
