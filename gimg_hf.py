# Multfilm rasmlarini Hugging Face'dagi bepul FLUX Space'lari orqali chizish (ZeroGPU kunlik limiti).
# Vazifa worker'dan olinadi, rasmlar va hisobot worker'ga qo'yiladi.
import json, os, shutil, time, urllib.request
from gradio_client import Client

W = "https://inter-futbol-bot.gcw808.workers.dev"
H = {"User-Agent": "Mozilla/5.0"}
def up(name, data):
    urllib.request.urlopen(urllib.request.Request(W + "/dsup?k=zq8Rk2x&n=" + name, data=data, method="POST", headers=H), timeout=120).read()
def get(name):
    return urllib.request.urlopen(urllib.request.Request(W + "/dsget?k=Hq7pZ2vLx9&n=" + name, headers=H), timeout=60).read()

job = json.loads(get(os.environ.get("IMGJOB", "imgjob")))
tok = os.environ.get("HF_TOKEN")
SPACES = job.get("spaces") or ["black-forest-labs/FLUX.1-schnell", "black-forest-labs/FLUX.1-dev"]
st = {"id": job["id"], "results": []}
clients = {}
def client(sp):
    if sp not in clients: clients[sp] = Client(sp, token=tok) if tok else Client(sp)
    return clients[sp]
W_, H_ = job.get("w", 768), job.get("h", 1344)
for i, sc in enumerate(job["scenes"]):
    key = sc.get("key") or f"{i:02d}"; res = {"key": key, "ok": False, "tries": []}
    for sp in SPACES:
        try:
            c = client(sp)
            kw = dict(prompt=job["style"] + " " + sc["prompt"], seed=sc.get("seed", 0), randomize_seed=False, width=W_, height=H_, api_name="/infer")
            if "schnell" in sp: kw["num_inference_steps"] = 4
            else: kw.update(guidance_scale=3.5, num_inference_steps=28)
            out = c.predict(**kw)
            path = out[0] if isinstance(out, (list, tuple)) else out
            if isinstance(path, dict): path = path.get("path") or path.get("url")
            data = open(path, "rb").read()
            up(f"{job['id']}_{key}", data); res.update(ok=True, space=sp, bytes=len(data)); break
        except Exception as e:
            res["tries"].append([sp, str(e)[:300]])
    st["results"].append(res); print(json.dumps(res)[:400], flush=True)
    up(job["id"] + "_status", json.dumps(st, ensure_ascii=False).encode())
print("TAYYOR", sum(r["ok"] for r in st["results"]), "/", len(job["scenes"]))
