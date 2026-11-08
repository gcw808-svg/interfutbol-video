# Montaj uchun multfilm rasmlarini Gemini orqali chizish. Vazifa (sahnalar ro'yxati) worker'dan olinadi,
# tayyor rasmlar va holat hisoboti yana worker'ga qo'yiladi (3 kunda o'chadi).
import base64, json, os, time, urllib.error, urllib.request, hashlib

KEY = os.environ["GEMINI_KEY"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
DK = hashlib.sha256(("ds-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:24]  # kalit kodda saqlanmaydi
H = {"User-Agent": "Mozilla/5.0"}
API = "https://generativelanguage.googleapis.com/v1beta/models"

def up(name, data):
    urllib.request.urlopen(urllib.request.Request(W + "/dsup?k=" + DK + "&n=" + name, data=data, method="POST", headers=H), timeout=120).read()

def get(name):
    return urllib.request.urlopen(urllib.request.Request(W + "/dsget?k=" + DK + "&n=" + name, headers=H), timeout=60).read()

def call(model, body):
    req = urllib.request.Request(f"{API}/{model}:generateContent", data=json.dumps(body).encode(), method="POST",
                                 headers={"content-type": "application/json", "x-goog-api-key": KEY})
    return json.load(urllib.request.urlopen(req, timeout=180))

job = json.loads(get(os.environ.get("IMGJOB", "imgjob")))
st = {"id": job["id"], "models": [], "results": []}
try:
    req = urllib.request.Request(f"{API}?pageSize=300", headers={"x-goog-api-key": KEY})
    ms = json.load(urllib.request.urlopen(req, timeout=60)).get("models", [])
    st["models"] = [m["name"].split("/")[-1] for m in ms if "image" in m["name"] and "generateContent" in m.get("supportedGenerationMethods", [])]
except Exception as e:
    st["list_error"] = str(e)[:300]
order = job.get("models") or sorted(st["models"], key=lambda m: (("pro" in m) != bool(job.get("prefer_pro")), "preview" in m, m))
st["order"] = order
good = None
for i, sc in enumerate(job["scenes"]):
    res = {"i": i, "ok": False, "tries": []}
    for m in ([good] if good else []) + [x for x in order if x != good]:
        for cfg in ({"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}, {"responseModalities": ["TEXT", "IMAGE"]}):
            body = {"contents": [{"parts": [{"text": job["style"] + " " + sc["prompt"]}]}], "generationConfig": cfg}
            try:
                j = call(m, body)
                parts = [p for c in j.get("candidates", []) for p in c.get("content", {}).get("parts", [])]
                img = next((p.get("inlineData") or p.get("inline_data") for p in parts if p.get("inlineData") or p.get("inline_data")), None)
                if not img:
                    res["tries"].append([m, "rasm yo'q", str(j)[:200]]); continue
                data = base64.b64decode(img["data"])
                up(f"{job['id']}_{i:02d}", data)
                res.update(ok=True, model=m, bytes=len(data), mime=img.get("mimeType") or img.get("mime_type")); good = m
                break
            except urllib.error.HTTPError as e:
                res["tries"].append([m, e.code, e.read().decode(errors="ignore")[:300]])
                if e.code == 429: time.sleep(20)
            except Exception as e:
                res["tries"].append([m, "xato", str(e)[:200]])
        if res["ok"]: break
    st["results"].append(res); print(json.dumps(res)[:400], flush=True)
    up(job["id"] + "_status", json.dumps(st, ensure_ascii=False).encode())
    time.sleep(4)
print("TAYYOR", sum(r["ok"] for r in st["results"]), "/", len(job["scenes"]))
