# INTER DIKTOR — MODELLARNI SOLISHTIRISH (2026-11-19). Kaggle'ning bepul videokartasida ishlaydi.
# Bir xil matn bir xil ovoz namunasi (Kozim Komilov) bilan har xil ochiq modellarda o'qitiladi; natijalar ovozlar kanaliga
# HARF bilan (A, B, ...) tashlanadi — qaysi harf qaysi model ekani faqat jurnalda (tinglovchi xolis tanlashi uchun).
# K — bot bergan vaqtinchalik kalit (6 soat, faqat kanal fayllarini o'qish va natija yuborish).
import json, os, subprocess, sys, traceback, urllib.parse, urllib.request

K = "__K__"
REF_MSG = int("__REF__")
ONLY = "__ONLY__".strip()  # bo'sh — hammasi; "B" — faqat shu model
W = "https://inter-futbol-bot.gcw808.workers.dev"
TEXTS = [
    "Kecha kechqurun bo‘lib o‘tgan o‘yinda mezbonlar so‘nggi daqiqalarda g‘alaba golini urishdi.",
    "Murabbiy o‘yindan keyin jamoasining xarakterini alohida ta’kidladi va muxlislarga minnatdorlik bildirdi.",
    "Endi savol tug‘iladi: bu jamoa mavsum oxirigacha shu sur’atni saqlab qola oladimi?",
]


def sh(c, check=False):
    print("+", c, flush=True)
    r = subprocess.run(c, shell=True, capture_output=True, text=True, env={**os.environ, "PYTHONHASHSEED": "0"})  # oldingi model muhitni buzgan qiymatni qoldiradi — pip yiqilardi
    print((r.stdout or "")[-1500:], (r.stderr or "")[-1500:], flush=True)
    if check and r.returncode:
        raise Exception("buyruq xatosi: " + c[:80] + " :: " + (r.stderr or "")[-300:])
    return r


def post(path, data, hdr=None):
    rq = urllib.request.Request(W + path, data=data, method="POST", headers={"user-agent": "kg", **(hdr or {})})
    return urllib.request.urlopen(rq, timeout=180).read().decode()


def say(t):
    try:
        print("SAY:", t, flush=True)
        post("/dkx/say?k=" + K, json.dumps({"text": t}).encode(), {"content-type": "application/json"})
    except Exception as e:
        print("say xato", e, flush=True)


def send(path, cap, name):
    mp3 = path[:-4] + ".mp3"
    sh(f'ffmpeg -loglevel error -y -i "{path}" -ac 1 -ar 44100 -b:a 160k "{mp3}"', True)
    print(post("/dkx/send?k=" + K + "&name=" + urllib.parse.quote(name) + "&cap=" + urllib.parse.quote(cap), open(mp3, "rb").read()), flush=True)


def main():
    os.makedirs("/kaggle/working/o", exist_ok=True)
    os.chdir("/kaggle/working")
    sh("nvidia-smi | head -15")
    rq = urllib.request.Request(f"{W}/dkx/file?k={K}&m={REF_MSG}", headers={"user-agent": "kg"})  # oddiy Python nomi bilan so'rovni Cloudflare 403 bilan qaytaradi
    open("ref_src", "wb").write(urllib.request.urlopen(rq, timeout=120).read())
    sh("ffmpeg -loglevel error -y -i ref_src -ac 1 -ar 24000 ref24.wav && ffmpeg -loglevel error -y -i ref_src -ac 1 -ar 16000 ref16.wav", True)
    # namuna matni: o'zbekchaga o'rgatilgan Whisper bilan eshitib olinadi
    ref_text = ""
    try:
        import torch
        from transformers import pipeline
        asr = pipeline("automatic-speech-recognition", model="islomov/rubaistt_v2_medium", device=0 if torch.cuda.is_available() else -1)
        ref_text = asr("ref16.wav", generate_kwargs={"language": "uz", "task": "transcribe"})["text"].strip()
        del asr
        torch.cuda.empty_cache()
    except Exception:
        traceback.print_exc()
    print("REF_TEXT:", ref_text, flush=True)
    done = []
    # ---- A: hozirgi model (F5-TTS o'zbekcha) — taqqoslash uchun asos
    try:
        if ONLY and "A" not in ONLY:
            raise KeyboardInterrupt
        sh("pip install -q f5-tts", True)
        from huggingface_hub import hf_hub_download
        from f5_tts.api import F5TTS
        import soundfile as sf
        tts = F5TTS(model="F5TTS_v1_Base", ckpt_file=hf_hub_download("mrmuminov/f5-tts-uzbek", "model.safetensors"), vocab_file=hf_hub_download("mrmuminov/f5-tts-uzbek", "vocab.txt"))
        for i, t in enumerate(TEXTS, 1):
            wav, sr, _ = tts.infer(ref_file="ref24.wav", ref_text=ref_text, gen_text=t, nfe_step=32)
            sf.write(f"o/A{i}.wav", wav, sr)
        del tts
        done.append("A")
    except KeyboardInterrupt:
        pass
    except Exception:
        print("A ishlamadi: " + traceback.format_exc()[-1500:], flush=True)
    # ---- B: Navoiy TTS (CosyVoice2 asosida, Apache-2.0)
    try:
        if ONLY and "B" not in ONLY:
            raise KeyboardInterrupt
        import torch
        torch.cuda.empty_cache()
        os.environ["PYTHONHASHSEED"] = "0"
        if not os.path.exists("CosyVoice"):
            sh("git clone -q --recursive https://github.com/FunAudioLLM/CosyVoice.git && cd CosyVoice && git checkout -q 074ca6dc9e80a2f424f1f74b48bdd7d3fea531cc && git submodule update --init --recursive", True)
        sh("pip install -q hyperpyyaml conformer==0.3.2 diffusers lightning modelscope inflect omegaconf hydra-core wetext onnxruntime-gpu gdown wget x-transformers einops rich pyworld openai-whisper 2>&1 | tail -3")
        sys.path.insert(0, "/kaggle/working/CosyVoice")
        sys.path.insert(0, "/kaggle/working/CosyVoice/third_party/Matcha-TTS")
        from huggingface_hub import hf_hub_download, snapshot_download
        base = snapshot_download("FunAudioLLM/CosyVoice2-0.5B", local_dir="cv2base")
        ck = hf_hub_download("aisha-org/navoiy-tts", "emotion_600h_joint.pt")
        import torchaudio
        from cosyvoice.cli.cosyvoice import CosyVoice2
        cv = CosyVoice2(base, load_jit=False, load_trt=False, fp16=False)
        sd = torch.load(ck, map_location="cpu")
        if isinstance(sd, dict) and "state_dict" in sd:
            sd = sd["state_dict"]
        sd = {k: (v.float() if v.is_floating_point() else v) for k, v in sd.items() if hasattr(v, "shape")}  # og'irliklar BF16 da saqlangan — oddiy aniqlikka o'tkaziladi
        print("navoiy kalitlari:", len(sd), list(sd)[:6], flush=True)
        tgt = cv.model.llm
        r = tgt.load_state_dict(sd, strict=False)
        tgt.float()
        print("llm turi:", next(tgt.parameters()).dtype, "| namuna:", sh("ffprobe -v error -show_entries format=duration:stream=sample_rate -of csv=p=0 ref16.wav").stdout.strip(), flush=True)
        print("llm yuklandi: yetishmagan", len(r.missing_keys), "ortiqcha", len(r.unexpected_keys), r.unexpected_keys[:5], flush=True)
        if len(r.missing_keys) > 0.5 * len(tgt.state_dict()):
            raise Exception("checkpoint llm ga mos emas: " + str(list(sd)[:4]))
        from cosyvoice.utils.file_utils import load_wav
        p16 = load_wav("ref16.wav", 16000)
        def gen(t):  # CosyVoice'ning yangi nusxasida namuna FAYL YO'LI bo'lib beriladi, eskisida — tovush massivi
            try:
                return [o["tts_speech"] for o in cv.inference_zero_shot(t, ref_text, "/kaggle/working/ref16.wav", stream=False, text_frontend=False)]
            except Exception as e1:
                print("yo'l bilan bo'lmadi, massiv bilan urinilyapti:", traceback.format_exc()[-1800:], flush=True)
                return [o["tts_speech"] for o in cv.inference_zero_shot(t, ref_text, p16, stream=False, text_frontend=False)]
        for i, t in enumerate(TEXTS, 1):
            outs = gen(t)
            torchaudio.save(f"o/B{i}.wav", torch.cat(outs, dim=1), cv.sample_rate)
        done.append("B")
    except KeyboardInterrupt:
        pass
    except Exception:
        print("B ishlamadi: " + traceback.format_exc()[-2500:], flush=True)
    # ---- natijalar
    if done and not ONLY:
        say("Diktor namunalari: bir xil 3 ta gap, bir xil ovoz namunasi (Kozim Komilov), har xil model. Eshitib, qaysi HARF odamga ko'proq o'xshashini ayting. Avval asl ovoz, keyin namunalar.")
        send("ref24.wav", "ASL OVOZ (taqqoslash uchun)", "asl_ovoz.mp3")
    if done:
        for L in done:
            sh("ffmpeg -loglevel error -y " + " ".join(f"-i o/{L}{i}.wav" for i in (1, 2, 3)) + f' -filter_complex "[0][1][2]concat=n=3:v=0:a=1" o/{L}.wav', True)
            send(f"o/{L}.wav", f"Namuna {L}", f"namuna_{L}.mp3")
    print("Solishtirish tugadi: " + (", ".join(done) or "hech biri ishlamadi"), flush=True)


main()
