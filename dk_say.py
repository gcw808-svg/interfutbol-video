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
    audio, sr = [], 24000
    gap = np.zeros(int(0.45 * 24000), dtype=np.float32)
    t0 = time.time()
    for t in TEXTS:
        for c in T.chunks(T.clean(T.apply_lex(T.cyr2lat(t), lex))):
            wav, sr, _ = m.infer(ref_file="ref.wav", ref_text=T.REFS[MOOD], gen_text=c, nfe_step=int(os.environ.get("NFE", "32")), remove_silence=False, speed=0.95)
            audio += [np.asarray(wav, dtype=np.float32), gap]
            print(f"tayyor: [{len(c)} belgi] ({time.time() - t0:.0f}s)", flush=True)
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
