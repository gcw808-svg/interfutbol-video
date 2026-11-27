# INTER DIKTOR — SIFAT TAJRIBASI (2026-11-27). Bahtiyor aka: "unchalik o'zgarish yo'q ... mukammallashtirish yo'llarini izla".
# Topilgan sabab-taxmin (F5-TTS'ni kichik bazada o'qitganlar tajribasi): o'rganish tezligi juda past bo'lsa (bizda 1e-5 va oxirigacha nolga tushadi)
# model deyarli o'zgarmaydi — "farq sezilmaydi". Bu tajribada tezlik 5 barobar katta (5e-5) va o'qitish BOSQICHLARGA bo'linadi:
# har bosqichdan keyin model saqlanadi (exp/<belgi><epoch>) va AYNAN BIR XIL matn, bir xil ohang namunasi bilan o'qilib kanalga tashlanadi
# (namuna_E00 — hozirgi model, E03, E06, ...). Eng yaxshisini Bahtiyor aka quloq bilan tanlaydi — keyin o'sha asosiy modelga aylantiriladi.
# Hozirgi asosiy model (runN) O'ZGARMAYDI. Matn jurnalga chiqarilmaydi.
import csv, glob, json, os, random, re, shutil, subprocess, sys, time, traceback, urllib.parse, urllib.request, zipfile

K = "__K__"
HF = "__HF__"
VOICE = "__VOICE__" or "kozim_komilov"
EPOCHS = int("__EPOCHS__" or 3)  # bir bosqichdagi epochlar
STAGES = 4
LR = "5e-5"
LABEL = "__LABEL__" or "D"
W = "https://inter-futbol-bot.gcw808.workers.dev"
TEXTS = [
    "Kecha kechqurun bo‘lib o‘tgan o‘yinda mezbonlar so‘nggi daqiqalarda g‘alaba golini urishdi.",
    "Murabbiy o‘yindan keyin jamoasining xarakterini alohida ta’kidladi va muxlislarga minnatdorlik bildirdi.",
    "Endi savol tug‘iladi: bu jamoa mavsum oxirigacha shu sur’atni saqlab qola oladimi?",
]


def sh(c, check=False, tail=1500):
    print("+", c.replace(HF, "[HF]").replace(K, "[K]")[:300], flush=True)
    r = subprocess.run(c, shell=True, capture_output=True, text=True, env={**os.environ, "PYTHONHASHSEED": "0"})
    print((r.stdout or "")[-tail:].replace(HF, "[HF]"), (r.stderr or "")[-tail:].replace(HF, "[HF]"), flush=True)
    if check and r.returncode:
        raise Exception("buyruq xatosi: " + c[:60])
    return r


def post(path, data, hdr=None):
    rq = urllib.request.Request(W + path, data=data, method="POST", headers={"user-agent": "kg", **(hdr or {})})
    return urllib.request.urlopen(rq, timeout=180).read().decode()


def say(t):
    try:
        post("/dkx/say?k=" + K, json.dumps({"text": t}).encode(), {"content-type": "application/json"})
    except Exception as e:
        print("say xato", str(e)[:100], flush=True)


def clean(t):
    t = t.replace("ʻ", "'").replace("‘", "'").replace("’", "'").replace("ʼ", "'").replace("`", "'")
    t = re.sub(r"[«»“”\"]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def main():
    os.chdir("/kaggle/working")
    sh("nvidia-smi | head -12")
    sh("pip install -q f5-tts", True)
    from huggingface_hub import HfApi, hf_hub_download
    api = HfApi(token=HF)
    repo = api.whoami()["name"] + "/inter-diktor"
    files = api.list_repo_files(repo)
    runs = sorted({int(re.sub(r"\D", "", f.split("/")[0])) for f in files if re.match(r"run\d+/inter_diktor\.safetensors$", f)})
    prev, new = f"run{runs[-1]}", f"run{runs[-1] + 1}"
    print("asos:", prev, "→ yangi:", new, flush=True)
    base_ckpt = hf_hub_download(repo, f"{prev}/inter_diktor.safetensors", token=HF)
    vocab = hf_hub_download("mrmuminov/f5-tts-uzbek", "vocab.txt")
    # ---- baza
    os.makedirs("ds/wavs", exist_ok=True)
    rows, total = [], 0.0
    import soundfile as sf
    for f in sorted(x for x in files if x.startswith(f"data/{VOICE}/") and x.endswith(".zip")):
        zp = hf_hub_download(repo, f, token=HF)
        sid = os.path.basename(f)[:-4]
        with zipfile.ZipFile(zp) as z:
            meta = list(csv.reader(z.read("metadata.csv").decode("utf-8").splitlines(), delimiter="|"))
            for r in meta[1:]:
                if len(r) < 3 or not r[2].strip():
                    continue
                data = z.read(r[0])
                out = f"ds/wavs/{sid}_{r[0]}"
                open(out, "wb").write(data)
                d = sf.info(out).duration
                txt = clean(r[2])
                if 1.2 <= d <= 22 and 3 <= len(txt) <= 400 and len(txt) / d < 28:
                    rows.append((out, txt, d))
                    total += d
                else:
                    os.remove(out)
    print(f"baza: {len(rows)} bo'lak, {total / 60:.1f} daqiqa", flush=True)
    if total < 600:
        raise Exception("baza juda kichik")
    with open("ds/metadata.csv", "w", encoding="utf-8") as f:
        f.write("audio_file|text\n")
        for p, t, d in rows:
            f.write(f"{os.path.abspath(p)}|{t}\n")
    # ---- F5-TTS uchun tayyorlash va o'qitish
    import f5_tts
    pkg = os.path.dirname(f5_tts.__file__) if getattr(f5_tts, "__file__", None) else list(f5_tts.__path__)[0]  # paket __init__siz bo'lishi mumkin
    print("f5_tts:", pkg, os.path.exists(f"{pkg}/train/datasets/prepare_csv_wavs.py"), flush=True)
    data_dir = os.path.abspath(os.path.join(pkg, "..", "..", "data", "inter_custom"))
    os.makedirs(os.path.dirname(data_dir), exist_ok=True)
    pv = os.path.join(os.path.dirname(data_dir), "Emilia_ZH_EN_pinyin")  # tayyorlovchi "asl lug'at"ni shu yerdan qidiradi — o'zbekcha lug'atni qo'yamiz
    os.makedirs(pv, exist_ok=True)
    shutil.copy(vocab, os.path.join(pv, "vocab.txt"))
    sh(f"python {pkg}/train/datasets/prepare_csv_wavs.py /kaggle/working/ds/metadata.csv {data_dir}", True, 2500)
    shutil.copy(vocab, os.path.join(data_dir, "vocab.txt"))  # o'zbekcha model lug'ati (asl inglizcha-xitoycha emas)
    print("tayyor baza:", os.listdir(data_dir), flush=True)
    ck_dir = os.path.abspath(os.path.join(pkg, "..", "..", "ckpts", "inter"))
    os.makedirs(ck_dir, exist_ok=True)
    # asos model fayli "toza" kalitlar bilan saqlangan; o'qituvchi esa EMA ko'rinishini kutadi ("ema_model." old qo'shimchasi, initted, step) — moslab beramiz
    import torch
    from safetensors.torch import load_file, save_file
    sd = load_file(base_ckpt)
    if not any(k.startswith("ema_model.") for k in sd):
        sd = {"ema_model." + k: v for k, v in sd.items() if k not in ("initted", "step")}
        sd["initted"] = torch.tensor(True)
        sd["step"] = torch.tensor(0)
        base_ckpt = "/kaggle/working/asos_ema.safetensors"
        save_file(sd, base_ckpt)
    print("asos kalitlari:", len(sd), flush=True)
    del sd
    upd_ep = max(1, int(total * 93.75 / 3200))  # bir epochdagi qadamlar (taxminan)
    # ---- sinov matni: 474-to'plamdagi Bahtiyor aka ko'rsatgan asl yozuv (4-fayl) matni + bazada yo'q uchta gap; ohang namunasi — ovozning doimiy namunasi
    for fn in ("tts.py", "uznum.py"):
        open(fn, "wb").write(urllib.request.urlopen("https://raw.githubusercontent.com/gcw808-svg/interfutbol-video/main/" + fn, timeout=60).read())
    os.environ.setdefault("BOT_TOKEN", "x")
    os.environ.setdefault("JOB", "tune")
    sys.path.insert(0, ".")
    import numpy as np
    import tts as T
    probe = ""
    try:
        with zipfile.ZipFile(hf_hub_download(repo, f"data/{VOICE}/474.zip", token=HF)) as z:
            mrows = list(csv.reader(z.read("metadata.csv").decode("utf-8").splitlines(), delimiter="|"))[1:]
            probe = " ".join(r[1] for r in mrows if r[3] == "004")
    except Exception as e:
        print("sinov matni olinmadi:", type(e).__name__, flush=True)
    texts = ([probe] if probe else []) + TEXTS
    def wget(path):
        return urllib.request.urlopen(urllib.request.Request(W + path, headers={"user-agent": "kg"}), timeout=120).read()
    open("ref.wav", "wb").write(wget("/dkx/ttsref?k=" + K + "&m=" + VOICE))
    reft = json.loads(wget("/dkx/ttsreft?k=" + K + "&m=" + VOICE)).get("t")
    lex = json.loads(wget("/dkx/ttslex?k=" + K) or b"{}")
    print("sinov matni:", sum(len(x) for x in texts), "belgi; ohang namunasi matni:", len(reft or ""), "belgi", flush=True)
    from f5_tts.api import F5TTS

    def render(ckpt_plain, tag, note):
        tts = F5TTS(model="F5TTS_v1_Base", ckpt_file=ckpt_plain, vocab_file=vocab)
        audio, sr = [], 24000
        for t in texts:
            for c in T.chunks(T.clean(T.apply_lex(T.cyr2lat(t), lex))):
                wav, sr, _ = tts.infer(ref_file="ref.wav", ref_text=reft, gen_text=c, nfe_step=32, speed=0.95, seed=1000)
                audio += [np.asarray(wav, dtype=np.float32), np.zeros(int(0.12 * sr), dtype=np.float32)]
            audio.append(np.zeros(int(0.6 * sr), dtype=np.float32))
        sf.write("o.wav", np.concatenate(audio), sr)
        sh('ffmpeg -loglevel error -y -i o.wav -af loudnorm=I=-16:TP=-1.5 -ac 1 -ar 44100 -b:a 160k o.mp3', True)
        r = post("/dkx/send?k=" + K + "&dst=chan&name=" + urllib.parse.quote(f"namuna_{tag}.mp3") + "&cap=" + urllib.parse.quote(f"Namuna {tag} — {note}. Matn va ohang namunasi hamma namunada bir xil."), open("o.mp3", "rb").read())
        print("namuna", tag, r[:60], flush=True)
        del tts
        torch.cuda.empty_cache()

    plain0 = hf_hub_download(repo, f"{prev}/inter_diktor.safetensors", token=HF)
    render(plain0, f"{LABEL}00", f"hozirgi model ({prev})")
    cur = base_ckpt
    for st in range(1, STAGES + 1):
        for f in glob.glob(os.path.join(ck_dir, "*")):
            os.remove(f)
        t0 = time.time()
        r = sh(f"cd {os.path.join(pkg, '..', '..')} && f5-tts_finetune-cli --exp_name F5TTS_v1_Base --dataset_name inter --tokenizer custom --tokenizer_path {vocab} --finetune --pretrain {cur} "
               f"--epochs {EPOCHS} --learning_rate {LR} --batch_size_per_gpu 3200 --batch_size_type frame --max_samples 64 --grad_accumulation_steps 1 --max_grad_norm 1.0 "
               f"--num_warmup_updates {min(200, upd_ep)} --save_per_updates {upd_ep * 50} --last_per_updates {upd_ep} --keep_last_n_checkpoints 1 --logger tensorboard", False, 3000)
        print(f"bosqich {st}: {(time.time() - t0) / 60:.0f} daqiqa, kod {r.returncode}", flush=True)
        last = sorted(glob.glob(os.path.join(ck_dir, "model_*.pt")), key=os.path.getmtime)
        if not last:
            e = r.stderr or ""
            raise Exception("model saqlanmadi: " + re.sub(r'"[\w.]+", ', "", e[max(e.rfind("Traceback"), 0):])[:1500])
        ck = torch.load(last[-1], map_location="cpu", weights_only=True)
        ema = {k.replace("ema_model.", ""): v for k, v in ck["ema_model_state_dict"].items() if k not in ("initted", "step")}
        print("qadamlar:", ck.get("update", ck.get("step")), flush=True)
        del ck
        tag = f"{LABEL}{st * EPOCHS:02d}"
        plain = f"/kaggle/working/{tag}.safetensors"
        save_file(ema, plain)
        api.upload_file(path_or_fileobj=plain, path_in_repo=f"exp/{tag}/inter_diktor.safetensors", repo_id=repo, commit_message=f"tajriba {tag}: {prev} + {st * EPOCHS} epoch, lr {LR}")
        pre = {"ema_model." + k: v for k, v in ema.items()}
        pre["initted"] = torch.tensor(True)
        pre["step"] = torch.tensor(0)
        cur = f"/kaggle/working/asos_{tag}.safetensors"
        save_file(pre, cur)
        del ema, pre
        render(plain, tag, f"tajriba: {prev} + {st * EPOCHS} bosqich, tezlik {LR}")
        os.remove(plain)
    say(f"Tajriba tugadi: kanalda namuna_{LABEL}00 (hozirgi model) va namuna_{LABEL}{EPOCHS:02d} … namuna_{LABEL}{STAGES * EPOCHS:02d} turibdi — bir xil matn, bir xil ohang namunasi. Eng yaxshisini ayting.")


try:
    main()
except Exception:
    print("O'QITISH XATOSI:", traceback.format_exc()[-3000:].replace(HF, "[HF]"), flush=True)
    raise
