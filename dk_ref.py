# INTER DIKTOR — OHANG NAMUNASINI YANGILASH (2026-11-27). Bazadagi toza, matni aniq bo'lakdan (9–12 soniya, matnga mosligi eng yaxshi) ovozning
# ohang namunasi tanlanadi va botga saqlanadi (ttsref:<ovoz>). Matn jurnalga chiqarilmaydi.
import csv, hashlib, io, os, re, urllib.parse, zipfile
import requests
from huggingface_hub import HfApi, hf_hub_download

W = "https://inter-futbol-bot.gcw808.workers.dev"
H = {"x-key": hashlib.sha256(("ub-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:40], "user-agent": "dkref"}
VOICE = os.environ.get("VOICE") or "kozim_komilov"
SET = os.environ.get("SET") or "474"
tok = os.environ["HF_TOKEN"]
api = HfApi(token=tok)
zp = hf_hub_download(api.whoami()["name"] + "/inter-diktor", f"data/{VOICE}/{SET}.zip", token=tok)
with zipfile.ZipFile(zp) as z:
    rows = list(csv.reader(z.read("metadata.csv").decode("utf-8").splitlines(), delimiter="|"))[1:]
    cand = []
    for r in rows:
        d = float(r[5]) - float(r[4])
        txt = r[2].strip()
        if 9 <= d <= 12.5 and re.search(r"[.]$", r[1].strip()) and not re.search(r"[?!]", r[1]) and 90 <= len(txt) <= 220:
            cand.append((abs(float(r[6]) - 1) + abs(len(txt) / d - 14.5) / 30, r, d))
    cand.sort(key=lambda x: x[0])
    print("nomzodlar:", len(cand), flush=True)
    _, r, d = cand[int(os.environ.get("PICK") or 0)]
    wav = z.read(r[0])
t = re.sub(r"\s+", " ", r[2].replace("ʻ", "'").replace("‘", "'").replace("’", "'")).strip()
rr = requests.post(W + "/ub/ttsref?m=" + VOICE + "&t=" + urllib.parse.quote(t), data=wav, headers=H, timeout=120)
print(f"namuna saqlandi: {d:.1f} s, {len(t)} belgi, moslik {r[6]} →", rr.text[:80], flush=True)
