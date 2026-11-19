# INTER DIKTOR — OVOZGA O'QITISHNI DAVOM ETTIRISH (2026-11-19). Kaggle'ning bepul videokartasida (T4) ishlaydi.
# Avvalgi o'qitilgan model (yopiq ombordagi eng so'nggi runN) ASOS qilib olinadi va ovozlar kanalidan yig'ilgan, so'zma-so'z tekshirilgan
# yangi bazada (data/<ovoz>/*.zip) o'qitish davom ettiriladi. Natija run(N+1) bo'lib omborga saqlanadi; uchta sinov gapi yangi model bilan
# o'qilib, kanalga "Namuna" bo'lib tashlanadi. Kalitlar (K — vaqtinchalik bot kaliti, HF — ombor kaliti) jurnalga chiqarilmaydi.
import csv, glob, json, os, random, re, shutil, subprocess, sys, time, traceback, urllib.parse, urllib.request, zipfile

K = "__K__"
HF = "__HF__"
VOICE = "__VOICE__" or "kozim_komilov"
EPOCHS = int("__EPOCHS__" or 40)
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
            f.write(f"wavs/{os.path.basename(p)}|{t}\n")
    # ---- F5-TTS uchun tayyorlash va o'qitish
    import f5_tts
    pkg = os.path.dirname(f5_tts.__file__) if getattr(f5_tts, "__file__", None) else list(f5_tts.__path__)[0]  # paket __init__siz bo'lishi mumkin
    print("f5_tts:", pkg, os.path.exists(f"{pkg}/train/datasets/prepare_csv_wavs.py"), flush=True)
    data_dir = os.path.abspath(os.path.join(pkg, "..", "..", "data", "inter_custom"))
    os.makedirs(os.path.dirname(data_dir), exist_ok=True)
    pv = os.path.join(os.path.dirname(data_dir), "Emilia_ZH_EN_pinyin")  # tayyorlovchi "asl lug'at"ni shu yerdan qidiradi — o'zbekcha lug'atni qo'yamiz
    os.makedirs(pv, exist_ok=True)
    shutil.copy(vocab, os.path.join(pv, "vocab.txt"))
    sh(f"python {pkg}/train/datasets/prepare_csv_wavs.py /kaggle/working/ds {data_dir}", True, 2500)
    shutil.copy(vocab, os.path.join(data_dir, "vocab.txt"))  # o'zbekcha model lug'ati (asl inglizcha-xitoycha emas)
    print("tayyor baza:", os.listdir(data_dir), flush=True)
    ck_dir = os.path.abspath(os.path.join(pkg, "..", "..", "ckpts", "inter"))
    os.makedirs(ck_dir, exist_ok=True)
    upd_ep = max(1, int(total * 93.75 / 3200))  # bir epochdagi qadamlar (taxminan)
    t0 = time.time()
    r = sh(f"cd {os.path.join(pkg, '..', '..')} && f5-tts_finetune-cli --exp_name F5TTS_v1_Base --dataset_name inter --tokenizer custom --tokenizer_path {vocab} --finetune --pretrain {base_ckpt} "
           f"--epochs {EPOCHS} --learning_rate 1e-5 --batch_size_per_gpu 3200 --batch_size_type frame --max_samples 64 --grad_accumulation_steps 1 --max_grad_norm 1.0 "
           f"--num_warmup_updates {min(300, upd_ep * 2)} --save_per_updates {upd_ep * 10} --last_per_updates {upd_ep * 2} --keep_last_n_checkpoints 1 --logger tensorboard", False, 4000)
    print(f"o'qitish vaqti: {(time.time() - t0) / 60:.0f} daqiqa, kod {r.returncode}", flush=True)
    last = sorted(glob.glob(os.path.join(ck_dir, "model_last.pt")) + glob.glob(os.path.join(ck_dir, "model_*.pt")), key=os.path.getmtime)
    if not last:
        raise Exception("model saqlanmadi: " + (r.stderr or "")[-600:])
    import torch
    from safetensors.torch import save_file
    ck = torch.load(last[-1], map_location="cpu", weights_only=True)
    ema = {k.replace("ema_model.", ""): v for k, v in ck["ema_model_state_dict"].items() if k not in ("initted", "step")}
    save_file(ema, "inter_diktor.safetensors")
    print("qadamlar:", ck.get("update", ck.get("step")), flush=True)
    del ck
    api.upload_file(path_or_fileobj="inter_diktor.safetensors", path_in_repo=f"{new}/inter_diktor.safetensors", repo_id=repo, commit_message=f"{new}: {prev} davomi, {total / 60:.0f} daqiqa baza, {EPOCHS} epoch")
    # ---- namuna: yangi model bilan uchta sinov gapi (asl ovoz namunasi — bazadagi 8–12 soniyalik bo'lak)
    from f5_tts.api import F5TTS
    import numpy as np
    cand = [x for x in rows if 8 <= x[2] <= 12] or rows
    random.seed(7)
    ref = random.choice(cand)
    tts = F5TTS(model="F5TTS_v1_Base", ckpt_file="inter_diktor.safetensors", vocab_file=vocab)
    audio, sr = [], 24000
    for t in TEXTS:
        wav, sr, _ = tts.infer(ref_file=ref[0], ref_text=ref[1], gen_text=clean(t), nfe_step=32, speed=0.95)
        audio += [np.asarray(wav, dtype=np.float32), np.zeros(int(0.45 * sr), dtype=np.float32)]
    sf.write("o.wav", np.concatenate(audio), sr)
    sh('ffmpeg -loglevel error -y -i o.wav -af loudnorm=I=-16:TP=-1.5 -ac 1 -ar 44100 -b:a 160k o.mp3', True)
    cap = f"Namuna {LABEL} — yangi o'qitilgan diktor ({new}: {total / 60:.0f} daqiqalik bazada {EPOCHS} bosqich)"
    print(post("/dkx/send?k=" + K + "&dst=chan&name=" + urllib.parse.quote(f"namuna_{LABEL}.mp3") + "&cap=" + urllib.parse.quote(cap), open("o.mp3", "rb").read()), flush=True)
    api.upload_file(path_or_fileobj=b"done", path_in_repo=f"{new}/DONE", repo_id=repo, commit_message="tugadi")


try:
    main()
except Exception:
    print("O'QITISH XATOSI:", traceback.format_exc()[-3000:].replace(HF, "[HF]"), flush=True)
    raise
