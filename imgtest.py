# Sinov: fakt/yangilik uchun ijodiy rasm variantlari (AI fon + Inter Futbol bezagi). Natijalar /tmp/out ga yoziladi
# (GitHub artifact). Bir nechta bepul manba sinaladi: Cloudflare Workers AI (FLUX), Gemini rasm modellari, Pollinations.
import base64, io, json, os, sys, time, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import card
from PIL import Image, ImageDraw, ImageFilter, ImageOps

OUT = "/tmp/out"
os.makedirs(OUT, exist_ok=True)
W, H = 1280, 720
LOG = []


def http(url, data=None, headers=None, timeout=120):
    req = urllib.request.Request(url, data=data, headers=headers or {}, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("content-type", "")


def gen_cfw(prompt, seed):
    # botning o'zidagi Cloudflare Workers AI (env.AI) orqali
    import hashlib
    key = hashlib.sha256(("ub-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:40]
    raw, ct = http("https://inter-futbol-bot.gcw808.workers.dev/ub/aiimg", json.dumps({"prompt": prompt, "seed": seed}).encode(), {"x-key": key, "content-type": "application/json", "user-agent": "InterFutbolImg"}, 120)
    if "image" not in ct:
        raise Exception(raw[:200])
    return raw


def gen_cf(prompt, seed):
    acc, tok = os.environ.get("CF_ACC"), os.environ.get("CF")
    raw, _ = http(f"https://api.cloudflare.com/client/v4/accounts/{acc}/ai/run/@cf/black-forest-labs/flux-1-schnell",
                  json.dumps({"prompt": prompt, "steps": 8, "seed": seed}).encode(), {"Authorization": "Bearer " + tok, "content-type": "application/json"})
    j = json.loads(raw)
    return base64.b64decode(j["result"]["image"])


def gen_gemini(prompt, seed):
    key = os.environ["GEMINI_KEY"]
    api = "https://generativelanguage.googleapis.com/v1beta/models"
    raw, _ = http(f"{api}?pageSize=300", headers={"x-goog-api-key": key})
    ms = [m["name"].split("/")[-1] for m in json.loads(raw).get("models", []) if "image" in m["name"] and "generateContent" in m.get("supportedGenerationMethods", [])]
    LOG.append(["gemini models", ms])
    last = None
    for m in sorted(ms, key=lambda x: ("pro" in x, "preview" in x)):
        try:
            body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}}}
            raw, _ = http(f"{api}/{m}:generateContent", json.dumps(body).encode(), {"content-type": "application/json", "x-goog-api-key": key}, 180)
            j = json.loads(raw)
            for c in j.get("candidates", []):
                for p in c.get("content", {}).get("parts", []):
                    d = p.get("inlineData") or p.get("inline_data")
                    if d:
                        LOG.append(["gemini ok", m])
                        return base64.b64decode(d["data"])
            last = str(j)[:200]
        except urllib.error.HTTPError as e:
            last = f"{m} {e.code} {e.read().decode(errors='ignore')[:200]}"
    raise Exception(last)


HFC = {}
def gen_hf(prompt, seed):
    from gradio_client import Client
    last = None
    for sp in ["black-forest-labs/FLUX.1-schnell", "black-forest-labs/FLUX.1-dev"]:
        try:
            if sp not in HFC:
                HFC[sp] = Client(sp, token=os.environ.get("HF_TOKEN") or None)
            kw = dict(prompt=prompt, seed=seed, randomize_seed=False, width=1344, height=768, api_name="/infer")
            if "schnell" in sp: kw["num_inference_steps"] = 4
            else: kw.update(guidance_scale=3.5, num_inference_steps=28)
            out = HFC[sp].predict(**kw)
            path = out[0] if isinstance(out, (list, tuple)) else out
            if isinstance(path, dict): path = path.get("path") or path.get("url")
            LOG.append(["hf ok", sp])
            return open(path, "rb").read()
        except Exception as e:
            last = sp + " " + str(e)[:200]
    raise Exception(last)


def gen_poll(prompt, seed):
    time.sleep(16)
    raw, ct = http("https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt) + f"?width=1280&height=720&seed={seed}&nologo=true&model=flux&referrer=interfutbol", timeout=180)
    if "image" not in ct:
        raise Exception("rasm emas: " + ct)
    return raw


VQ = "Look at this image for a football (soccer) news channel. Answer strictly in JSON {\"ok\":true/false,\"why\":\"...\"}. ok=false if ANY: American football / rugby ball or gridiron field; any visible letters, words, numbers or fake logos; distorted/extra limbs or melted faces; recognizable real person; violence. Otherwise ok=true."
def vision_ok(b):
    key = os.environ.get("GEMINI_KEY")
    if not key: return True, "kalit yo'q"
    for m in ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"]:
        try:
            body = {"contents": [{"parts": [{"text": VQ}, {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(b).decode()}}]}], "generationConfig": {"temperature": 0, "maxOutputTokens": 200}}
            raw, _ = http(f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent", json.dumps(body).encode(), {"content-type": "application/json", "x-goog-api-key": key}, 60)
            t = "".join(p.get("text", "") for c in json.loads(raw).get("candidates", []) for p in c.get("content", {}).get("parts", []))
            j = json.loads(t[t.find("{"): t.rfind("}") + 1])
            return bool(j.get("ok")), m + ": " + str(j.get("why"))[:160]
        except Exception as e:
            last = str(e)[:120]
    return True, "tekshirib bo'lmadi " + last


def bg(prompt, seed, prefer):
    for name, fn in prefer:
        for k in range(3):
            try:
                b = fn(prompt, seed + k * 101)
                im = Image.open(io.BytesIO(b)).convert("RGB")
                buf = io.BytesIO(); im.save(buf, "JPEG", quality=85)
                ok, why = vision_ok(buf.getvalue())
                LOG.append([name, "seed", seed + k * 101, "tekshiruv", ok, why])
                if not ok:
                    im.save(f"{OUT}/rad_{name}_{seed + k * 101}.jpg", quality=70)
                    continue
                return ImageOps.fit(im, (W, H), Image.LANCZOS), name
            except Exception as e:
                LOG.append([name, "xato", str(e)[:300]]); break
    return None, None


def shade_left(im, a0=235, a1=40, upto=0.75):
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    for x in range(W):
        t = min(1, x / (W * upto))
        d.line([x, 0, x, H], fill=(6, 10, 18, int(a0 + (a1 - a0) * t)))
    im.paste(sh, (0, 0), sh)


def title_block(im, title, x, y, maxw, size=54, color=(255, 255, 255)):
    d = ImageDraw.Draw(im)
    s = size
    while s > 30:
        f = card.font("black", s)
        lines = card.wrap(d, title, f, maxw)
        if len(lines) <= 4:
            break
        s -= 2
    for i, l in enumerate(lines):
        d.text((x, y + i * (s + 10)), l, font=f, fill=color)
    return y + len(lines) * (s + 10)


def brand(im, rubric):
    d = ImageDraw.Draw(im, "RGBA")
    lg = card.logo(84, False)
    im.paste(lg, (W - 84 - 42, H - 84 - 36), lg)
    f = card.font("bold", 22)
    tw = d.textlength(rubric, font=f)
    d.rounded_rectangle([60, 56, 60 + tw + 36, 98], radius=21, fill=(91, 182, 55, 235))
    d.text((60 + 18, 77), rubric, font=f, fill=(255, 255, 255), anchor="lm")


TITLE_NA = "Özbekiston milliy futbol terma jamoasi 1992-yilda taşkil etilgan"
SUB = "Ilk yilda faqat 4 raqib: Tojikiston, Turkmaniston, Qozoğiston, Qirğiziston"
NEG = "association football (soccer) only, absolutely no text, no letters, no numbers, no signs, no banners, no logos, no watermark, no identifiable real people"
order = [("cf", gen_cfw), ("hf", gen_hf)]
GREEN = (91, 182, 55)

def grad(im, top, bottom, y0=0):
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    for y in range(y0, H):
        t = (y - y0) / max(1, H - y0); d.line([0, y, W, y], fill=(6, 10, 18, int(top + (bottom - top) * t)))
    im.paste(sh, (0, 0), sh)

def chip(im, text, x, y):
    d = ImageDraw.Draw(im, "RGBA"); f = card.font("bold", 22); tw = d.textlength(text, font=f)
    d.rounded_rectangle([x, y, x + tw + 36, y + 42], radius=21, fill=GREEN + (240,)); d.text((x + 18, y + 21), text, font=f, fill=(255, 255, 255), anchor="lm")

def iflogo(im, size=84):
    lg = card.logo(size, False); im.paste(lg, (W - size - 42, H - size - 36), lg)

def save(im, name):
    im.convert("RGB").save(f"{OUT}/{name}.jpg", quality=92); LOG.append(["saqlandi", name])

# KINO uslubi (Bahtiyor aka tanlovi V1): to'liq AI surat, pastda qorong'i o'tish, sarlavha va izoh, iF; rukn yozuvi yo'q
def kino(name, prompt, seed):
    im, src = bg(prompt + ", " + NEG, seed, order)
    if not im:
        LOG.append(["kino", name, "rasm yo'q"]); return
    im = im.convert("RGBA")
    gr_ = noise_layer = Image.effect_noise((W, H), 22).convert("L").point(lambda v: 128 + (v - 128) // 6)
    grain = Image.merge("RGBA", (gr_, gr_, gr_, Image.new("L", (W, H), 18))); im.alpha_composite(grain)
    grad(im, 0, 248, 300)
    d = ImageDraw.Draw(im); f = card.font("black", 50); ls = card.wrap(d, TITLE_NA, f, 1020)[:2]
    y0 = 600 - len(ls) * 60
    for k, l in enumerate(ls): d.text((60, y0 + k * 60), l, font=f, fill=(255, 255, 255))
    d.text((60, y0 + len(ls) * 60 + 8), SUB, font=card.font("med", 24), fill=(215, 225, 235)); iflogo(im); save(im, name + "_" + src)

kino("K1_stadion", "Cinematic wide shot of an old 1990s football stadium in Tashkent at golden dusk, floodlights glowing, green pitch, crowd silhouettes far away, blue white green color grading, atmospheric haze, film grain", 213)
kino("K2_kiyinish", "Cinematic photo of a vintage 1990s football locker room, white football shirts with blue and green trim hanging on wooden hooks, dramatic warm window light beams, dust particles, moody, film still", 314)
kino("K3_toglar", "Cinematic aerial shot at blue hour of a football stadium glowing with floodlights in a Central Asian city with snowy mountains in the background, city lights, atmospheric, epic, film still", 415)
kino("K4_butsi", "Cinematic close-up of a pair of old leather football boots and a classic black and white soccer ball on grass at sunset, shallow depth of field, warm backlight, blue and green bokeh lights, nostalgic, film still", 516)
kino("K5_tunnel", "Cinematic shot from inside an old concrete stadium tunnel looking out at a bright green football pitch and floodlights, light rain, dramatic contrast, nostalgic 1990s atmosphere, film still", 617)

json.dump(LOG, open(f"{OUT}/log.json", "w"), ensure_ascii=False, indent=1, default=str)
print(json.dumps(LOG, ensure_ascii=False, default=str)[:3000])
