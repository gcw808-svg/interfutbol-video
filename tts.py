# Inter Futbol diktor: botdan kelgan matnni Bahtiyor aka ovozida o'qish (F5-TTS, o'zbekcha model, videokartasiz)
import hashlib, io, json, os, re, subprocess, sys, time
import numpy as np, requests, soundfile as sf, torch
import torchaudio
from uznum import norm

BOT = os.environ["BOT_TOKEN"]; JOB = os.environ["JOB"]; MOOD = os.environ.get("MOOD", "oddiy")
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
H = {"x-key": KEY, "user-agent": "InterFutbolTTS"}
API = f"https://api.telegram.org/bot{BOT}/"
REFS = {
    "oddiy": "Eng muhimi, g'olib futbolchi mukofotni o'zida saqlab qoladi. Bu esa Oltin to'pni sportdagi eng shaxsiy va qadrli sovrinlardan biriga aylantiradi.",
    "xafa": "Tilni deyarli bilmay kelgan o'smir uchun bu katta qadam. Ammo uning oldida hali eng og'ir sinovlar turardi.",
    "hayajon": "Bugun futbol olamidagi eng noodatiy garovlar va ularning kutilmagan oqibatlari haqida gaplashamiz!",
}
torch.set_num_threads(os.cpu_count() or 2)

def _load(p, *a, **k):
    x, sr = sf.read(p, dtype="float32", always_2d=True)
    return torch.from_numpy(x.T.copy()), sr
torchaudio.load = _load  # torchcodec'siz o'qish

def say(chat, text):
    requests.post(API + "sendMessage", json={"chat_id": chat, "text": text}, timeout=30)

def clean(t):
    t = re.sub(r"https?://\S+", "", t)
    t = re.sub(r"[\U0001F000-\U0001FFFF☀-➿️#*_~`<>\[\]|]", " ", t)
    t = t.replace("ʻ", "'").replace("‘", "'").replace("’", "'").replace("ʼ", "'").replace("`", "'")
    t = norm(t)
    t = re.sub(r"[«»“”\"]", "", t)
    return re.sub(r"\s+", " ", t).strip()

def chunks(t, mx=170):
    sents = re.split(r"(?<=[.!?…])\s+", t)
    out, cur = [], ""
    for s in sents:
        while len(s) > mx:  # juda uzun gapni vergul bo'yicha bo'lamiz
            cut = s.rfind(",", 0, mx)
            cut = cut if cut > 40 else s.rfind(" ", 0, mx)
            if cur: out.append(cur); cur = ""
            out.append(s[:cut + 1].strip()); s = s[cut + 1:].strip()
        if len(cur) + len(s) + 1 > mx and cur: out.append(cur); cur = s
        else: cur = (cur + " " + s).strip()
    if cur: out.append(cur)
    return [c for c in out if c]

def main():
    j = requests.get(W + "/ub/ttsjob", params={"id": JOB}, headers=H, timeout=30).json()
    if not j: return
    chat, text = j["chat"], j["text"]
    ref = requests.get(W + "/ub/ttsref", params={"m": MOOD}, headers=H, timeout=60)
    ref.raise_for_status()
    open("ref.wav", "wb").write(ref.content)
    t0 = time.time()
    from huggingface_hub import hf_hub_download
    from f5_tts.api import F5TTS
    ckpt, mname = None, "asosiy model"
    tok = os.environ.get("HF_TOKEN")
    if tok:  # Bahtiyor aka ovozida o'qitilgan eng so'nggi model (Hugging Face yopiq ombori)
        try:
            from huggingface_hub import HfApi
            api = HfApi(token=tok); repo = api.whoami()["name"] + "/inter-diktor"
            fs = [f for f in api.list_repo_files(repo) if f.endswith("/inter_diktor.safetensors")]
            if fs:
                fs.sort(key=lambda f: int(re.sub(r"\D", "", f.split("/")[0]) or 0))
                ckpt = hf_hub_download(repo, fs[-1], token=tok); mname = fs[-1].split("/")[0]
        except Exception as e:
            print("o'qitilgan model topilmadi:", e, flush=True)
    if not ckpt:
        ckpt = hf_hub_download("mrmuminov/f5-tts-uzbek", "model.safetensors")
    vocab = hf_hub_download("mrmuminov/f5-tts-uzbek", "vocab.txt")
    tts = F5TTS(model="F5TTS_v1_Base", ckpt_file=ckpt, vocab_file=vocab, device="cpu")
    parts = chunks(clean(text))
    NFE = 32 if len(text) <= 400 else 16  # qisqa matnda sifat yuqoriroq
    sr_out, audio = 24000, []
    gap = np.zeros(int(0.35 * 24000), dtype=np.float32)
    for i, c in enumerate(parts):
        wav, sr_out, _ = tts.infer(ref_file="ref.wav", ref_text=REFS[MOOD], gen_text=c, nfe_step=NFE, remove_silence=False, speed=0.95)
        audio += [np.asarray(wav, dtype=np.float32), gap]
        print(f"{i+1}/{len(parts)} tayyor, {time.time()-t0:.0f}s", flush=True)
    full = np.concatenate(audio)
    sf.write("diktor.wav", full, sr_out)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "diktor.wav", "-af", "loudnorm=I=-16:TP=-1.5", "-c:a", "libmp3lame", "-b:a", "128k", "diktor.mp3"], check=True)
    cap = text if len(text) <= 900 else text[:897] + "…"
    with open("diktor.mp3", "rb") as f:
        r = requests.post(API + "sendAudio", data={"chat_id": chat, "caption": cap, "title": f"Inter Futbol diktor ({mname})", "performer": "Inter Futbol"}, files={"audio": ("diktor.mp3", f, "audio/mpeg")}, timeout=120).json()
    if not r.get("ok"): say(chat, "⚠️ Audioni yuborib bo'lmadi: " + str(r.get("description")))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        try:
            j = requests.get(W + "/ub/ttsjob", params={"id": JOB}, headers=H, timeout=30).json()
            if j: say(j["chat"], "⚠️ Diktor xatosi: " + str(e)[:300])
        finally:
            raise
