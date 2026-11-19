# INTER DIKTOR — namuna o'qitish (2026-11-19): muharrir botidagi AVVALGI diktor (Bahtiyor aka ovozida o'qitilgan F5 modeli, run4)
# va uning matn tayyorlash qoidalari (talaffuz lug'ati, sonlar, kirill→lotin, bo'laklash) bilan berilgan matnlarni o'qiydi.
# Natija diktor boti orqali adminning shaxsiy chatiga yuboriladi. GitHub'da (videokartasiz) ishlaydi.
import hashlib, json, os, re, subprocess, sys, time, urllib.parse
os.environ.setdefault("JOB", "namuna")
import numpy as np, requests, soundfile as sf, torch
import tts as T  # eski diktor kodlari: clean, apply_lex, cyr2lat, chunks, REFS

W = T.W
H = T.H
TEXTS = json.loads(os.environ.get("TEXTS") or "[]") or [
    "Kecha kechqurun bo‘lib o‘tgan o‘yinda mezbonlar so‘nggi daqiqalarda g‘alaba golini urishdi.",
    "Murabbiy o‘yindan keyin jamoasining xarakterini alohida ta’kidladi va muxlislarga minnatdorlik bildirdi.",
    "Endi savol tug‘iladi: bu jamoa mavsum oxirigacha shu sur’atni saqlab qola oladimi?",
]
LABEL = os.environ.get("LABEL", "C")
MOOD = os.environ.get("MOOD", "oddiy")
RUN = os.environ.get("RUN", "")
TID = os.environ.get("TID", "")  # diktor botida yozilgan matn (KV'da; jurnalga chiqmaydi)


def main():
    k = requests.post(W + "/ub/dkkey", headers=H, json={}, timeout=120).json()["k"]
    job = {}
    if TID:
        job = requests.get(W + "/ub/dktext", params={"id": TID}, headers=H, timeout=60).json() or {}
        if not job.get("t"):
            print("matn topilmadi (eskirgan)", flush=True)
            return
        TEXTS[:] = [x.strip() for x in re.split(r"\n+", job["t"]) if x.strip()]
    try:
        _say(k, job)
    except Exception as e:
        if job.get("chat"):
            requests.post(W + "/dkx/say?k=" + k, json={"to": job["chat"], "text": "⚠️ O'qishda xato chiqdi: " + type(e).__name__ + ". Matnni qayta yuboring."}, headers={"user-agent": "dksay"}, timeout=60)
        raise


def load_asr():
    # o'zbekcha eshitish modeli (moslashda ishlatiladigan, keshda tayyor turadi); bo'lmasa nazoratsiz o'qiladi
    try:
        from faster_whisper import WhisperModel
        ct = os.path.join(os.environ.get("DK_CACHE", ".dkcache"), "ct2_islomov_rubaistt_v2_medium")
        if not os.path.exists(os.path.join(ct, "model.bin")):
            print("eshitish modeli keshda yo'q — nazoratsiz", flush=True)
            return None
        return WhisperModel(ct, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    except Exception as e:
        print("eshitish modeli ochilmadi:", type(e).__name__, flush=True)
        return None


def score(fw, wav, sr, text):
    import difflib
    import dk_align as A
    sf.write("chk.wav", wav, sr)
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", "chk.wav", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    segs, _ = fw.transcribe(np.frombuffer(raw, dtype=np.float32), language="uz", beam_size=2, temperature=0.0, condition_on_previous_text=False)
    h = A.nkey(" ".join(x.text for x in segs)).replace(" ", "")
    e = A.nkey(text).replace(" ", "")
    return difflib.SequenceMatcher(None, e, h).ratio() if e else 0.0


def _say(k, job):
    ref = requests.get(W + "/ub/ttsref", params={"m": MOOD}, headers=H, timeout=60)
    ref.raise_for_status()
    open("ref.wav", "wb").write(ref.content)
    from huggingface_hub import HfApi, hf_hub_download
    from f5_tts.api import F5TTS
    tok = os.environ["HF_TOKEN"]
    api = HfApi(token=tok)
    repo = api.whoami()["name"] + "/inter-diktor"
    fs = [f for f in api.list_repo_files(repo) if f.endswith("/inter_diktor.safetensors") and (not RUN or f.startswith(RUN + "/"))]
    fs.sort(key=lambda f: int(re.sub(r"\D", "", f.split("/")[0]) or 0))
    ckpt = hf_hub_download(repo, fs[-1], token=tok)
    print("model:", fs[-1], flush=True)
    vocab = hf_hub_download("mrmuminov/f5-tts-uzbek", "vocab.txt")
    m = F5TTS(model="F5TTS_v1_Base", ckpt_file=ckpt, vocab_file=vocab, device="cpu")
    try:
        lex = requests.get(W + "/ub/ttslex", headers=H, timeout=30).json() or {}
    except Exception:
        lex = {}
    print("lug'at:", len(lex), "ta so'z", flush=True)
    NFE = int(os.environ.get("NFE") or 32)  # videokartasiz: uzun matnda qadamlar kamaytiriladi (tezlik uchun)
    fw, scores = load_asr(), []
    TRIES = 3 if sum(len(x) for x in TEXTS) <= 700 else 2
    audio, sr = [], 24000
    gap = np.zeros(int(0.45 * 24000), dtype=np.float32)
    t0 = time.time()
    for t in TEXTS:
        for c in T.chunks(T.clean(T.apply_lex(T.cyr2lat(t), lex))):
            # SIFAT NAZORATI (2026-11-19, Bahtiyor aka: "g'alati o'qidi, sifatni oshir"): har bo'lak o'qilgach o'zbekcha eshitish modeli bilan tekshiriladi —
            # aytilgani matnga mos kelmasa (so'z yutilgan, buzilgan, ortiqcha tovush) boshqa urinish qilinadi va ENG YAXSHISI olinadi.
            best, bs = None, -1.0
            # JUDA QISQA MATN ("Bahti qalesan" — umuman o'qilmagan edi): model qisqa gapga juda kam vaqt ajratadi va tovush chiqmaydi/buziladi —
            # qisqa bo'lakda sekinroq tezliklar ham sinab ko'riladi (ko'proq vaqt beriladi) va tekshiruvdan eng yaxshi o'tgani olinadi.
            short = len(c) < 45
            plan = [(0.8, 1000), (0.65, 1077), (0.95, 1154), (0.55, 1231)] if short else [(0.95, 1000 + n * 77) for n in range(TRIES)]
            for n, (spd, seed) in enumerate(plan if fw else plan[:1]):
                wav, sr, _ = m.infer(ref_file="ref.wav", ref_text=T.REFS[MOOD], gen_text=c if re.search(r"[.!?…]$", c) else c + ".", nfe_step=NFE, remove_silence=False, speed=spd, seed=seed)
                wav = np.asarray(wav, dtype=np.float32)
                sc = score(fw, wav, sr, c) if fw else 1.0
                print(f"  urinish {n + 1}: moslik {sc:.2f}", flush=True)
                if sc > bs:
                    best, bs = wav, sc
                if sc >= 0.93:
                    break
            scores.append(bs)
            audio += [best, gap]
            print(f"tayyor: [{len(c)} belgi] moslik {bs:.2f} ({time.time() - t0:.0f}s)", flush=True)
    sf.write("o.wav", np.concatenate(audio), sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "o.wav", "-af", "loudnorm=I=-16:TP=-1.5", "-c:a", "libmp3lame", "-b:a", "160k", "o.mp3"], check=True)
    if job.get("chat"):
        cap = f"🎙 {job.get('v') or 'Kozim Komilov'} · model {fs[-1].split('/')[0]} · {len(job['t'])} belgi"
        r = requests.post(W + "/dkx/send?k=" + k + "&to=" + str(job["chat"]) + (f"&reply={job['m']}" if job.get("m") else "") + "&name=" + urllib.parse.quote("diktor_" + time.strftime("%H%M%S") + ".mp3") + "&cap=" + urllib.parse.quote(cap), data=open("o.mp3", "rb").read(), headers={"user-agent": "dksay"}, timeout=180)
        print("yuborildi:", r.text[:120], flush=True)
        return
    cap = os.environ.get("CAP") or f"Namuna {LABEL} — avvalgi diktor (sizning ovozingizga o'rgatilgan model, {fs[-1].split('/')[0]})"
    r = requests.post(W + "/dkx/send?k=" + k + "&name=" + urllib.parse.quote(f"namuna_{LABEL}.mp3") + "&cap=" + urllib.parse.quote(cap), data=open("o.mp3", "rb").read(), headers={"user-agent": "dksay"}, timeout=180)
    print("yuborildi:", r.text[:200], flush=True)


main()
