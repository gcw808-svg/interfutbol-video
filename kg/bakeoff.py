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
    print("REF_TEXT uzunligi:", len(ref_text), flush=True)
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
    # ---- B: Navoiy TTS (CosyVoice2 asosida, Apache-2.0) — MUALLIFLARNING O'Z skripti bilan (inference.py).
    # 1-urinishda modelni o'zim boshqacha usulda (zero-shot, namuna matni bilan) chaqirganim uchun tushunarsiz ovoz chiqqan edi.
    try:
        if ONLY and "B" not in ONLY:
            raise KeyboardInterrupt
        os.environ["PYTHONHASHSEED"] = "0"
        if not os.path.exists("CosyVoice"):
            sh("git clone -q --recursive https://github.com/FunAudioLLM/CosyVoice.git && cd CosyVoice && git checkout -q 074ca6dc9e80a2f424f1f74b48bdd7d3fea531cc && git submodule update --init --recursive", True)
        from huggingface_hub import snapshot_download
        nv = snapshot_download("aisha-org/navoiy-tts", local_dir="navoiy-tts")
        print("navoiy fayllari:", sorted(os.listdir(nv))[:30], flush=True)
        # 2026-11-28: Kaggle muhiti (Python 3.13, numpy 2) CosyVoice talab qilgan eski kutubxonalar bilan urishdi (numpy 1.26 qo'yilgach transformers ochilmadi).
        # Shuning uchun Navoiy ALOHIDA muhitda (Python 3.10, CosyVoice'ning o'z nusxalari) ishlatiladi — asosiy muhitga tegilmaydi.
        sh("pip install -q uv 2>&1 | tail -1")
        sh("uv venv /kaggle/working/cv --python 3.10 2>&1 | tail -2", True)
        PY = "/kaggle/working/cv/bin/python"
        sh(f"uv pip install -q --python {PY} --extra-index-url https://download.pytorch.org/whl/cu121 torch==2.3.1 torchaudio==2.3.1 2>&1 | tail -3", True)
        # paketlar guruhlab o'rnatiladi: bittasi yig'ilmasa qolganlari qolib ketmasin ("| tail" xatoni yashirib, hammasi o'rnatilmay qolgan edi)
        for grp in ("numpy==1.26.4 transformers==4.51.3 huggingface_hub==0.36.2 'setuptools<81' wheel cython",
                    "HyperPyYAML==1.2.3 omegaconf==2.3.0 hydra-core==1.3.2 conformer==0.3.2 diffusers==0.29.0 inflect==7.3.1 librosa==0.10.2 lightning==2.2.4 x-transformers==2.11.24 rich soundfile==0.12.1 protobuf==4.25 pydantic==2.7.0",
                    "modelscope==1.20.0 onnx==1.16.0 onnxruntime==1.18.0 wetext==0.0.4 gdown wget networkx==3.1 matplotlib pyarrow",
                    "openai-whisper", "pyworld==0.3.4"):  # whisper: eski nusxa yangi setuptools bilan yig'ilmadi — yangisi
            r = sh(f"uv pip install -q --python {PY} {grp}")
            print("o'rnatish:", grp.split()[0], "…", "ok" if r.returncode == 0 else "XATO", flush=True)
        sh(f"uv pip install -q --python {PY} 'setuptools<81'")  # keyingi paketlar yangilab yuborgan bo'lsa qaytariladi
        sh(f'{PY} -c "import pkg_resources; print(\'pkg_resources ok\')" 2>&1 | tail -2')
        sh(f'{PY} -c "import hyperpyyaml, onnxruntime, modelscope, whisper, diffusers, lightning; print(\'kutubxonalar ok\')" 2>&1 | tail -4')
        if os.path.exists("navoiy-tts/requirements.txt"):
            sh(f"uv pip install -q --python {PY} -r navoiy-tts/requirements.txt 2>&1 | tail -3")
        sh(f'{PY} -c "from transformers import Qwen2ForCausalLM; import transformers, torch; print(transformers.__version__, torch.__version__, torch.cuda.is_available(), \'qwen2 ok\')" 2>&1 | tail -6')
        base = snapshot_download("FunAudioLLM/CosyVoice2-0.5B", local_dir="CosyVoice/pretrained_models/CosyVoice2-0.5B")
        sh(f"{PY} navoiy-tts/inference.py --help | head -8")
        for i, t in enumerate(TEXTS, 1):
            r = sh(f'{PY} navoiy-tts/inference.py --cosyvoice-dir CosyVoice --base-model-dir CosyVoice/pretrained_models/CosyVoice2-0.5B --checkpoint navoiy-tts/emotion_600h_joint.pt --reference ref24.wav --text "{t}" --emotion calm --output o/B{i}.wav')
            if not os.path.exists(f"o/B{i}.wav"):
                raise Exception("inference.py natija bermadi: " + (r.stderr or r.stdout or "")[-1200:])
        done.append("B")
    except KeyboardInterrupt:
        pass
    except Exception:
        print("B ishlamadi: " + traceback.format_exc()[-2500:], flush=True)
    # ---- TEKSHIRUV: har namuna o'zbekcha model bilan qayta eshitiladi — so'zlarning necha foizi to'g'ri aytilgani o'lchanadi.
    # 75% dan past (tushunarsiz) namuna kanalga YUBORILMAYDI (2026-11-19: tekshirmasdan yuborilgan B tushunarsiz chiqqan edi).
    score = {}
    try:
        import difflib, re, torch
        from transformers import pipeline
        asr = pipeline("automatic-speech-recognition", model="islomov/rubaistt_v2_medium", device=0 if torch.cuda.is_available() else -1)
        nk = lambda x: re.sub(r"[^a-z0-9 ]+", "", re.sub(r"[‘’ʻʼ`']", "", x.lower())).split()
        for L in list(done):
            rs = []
            for i, t in enumerate(TEXTS, 1):
                sh(f"ffmpeg -loglevel error -y -i o/{L}{i}.wav -ac 1 -ar 16000 o/{L}{i}_16.wav")
                h = asr(f"o/{L}{i}_16.wav", generate_kwargs={"language": "uz", "task": "transcribe"})["text"]
                rs.append(difflib.SequenceMatcher(None, nk(t), nk(h), autojunk=False).ratio())
                print(f"TEKSHIRUV {L}{i}: {rs[-1]:.2f}", flush=True)
            score[L] = sum(rs) / len(rs)
            if score[L] < 0.75:
                done.remove(L)
                print(f"{L} tushunarsiz ({score[L]:.2f}) — yuborilmaydi", flush=True)
    except Exception:
        print("tekshiruv ishlamadi: " + traceback.format_exc()[-1200:], flush=True)
    print("BAHOLAR:", json.dumps(score), flush=True)
    # ---- natijalar
    if done and not ONLY:
        say("Diktor namunalari: bir xil 3 ta gap, bir xil ovoz namunasi (Kozim Komilov), har xil model. Eshitib, qaysi HARF odamga ko'proq o'xshashini ayting. Avval asl ovoz, keyin namunalar.")
        send("ref24.wav", "ASL OVOZ (taqqoslash uchun)", "asl_ovoz.mp3")
    if done:
        for L in done:
            sh("ffmpeg -loglevel error -y " + " ".join(f"-i o/{L}{i}.wav" for i in (1, 2, 3)) + f' -filter_complex "[0][1][2]concat=n=3:v=0:a=1" o/{L}.wav', True)
            send(f"o/{L}.wav", f"Namuna {L} (yangi)" + (f" — so'zlar aniqligi {round(score[L] * 100)}%" if L in score else ""), f"namuna_{L}_yangi.mp3")
    print("Solishtirish tugadi: " + (", ".join(done) or "hech biri ishlamadi"), flush=True)


main()
