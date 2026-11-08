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
    raw, ct = http("https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt) + f"?width=1280&height=720&seed={seed}&nologo=true&model=flux", timeout=180)
    if "image" not in ct:
        raise Exception("rasm emas: " + ct)
    return raw


def bg(prompt, seed, prefer):
    for name, fn in prefer:
        try:
            b = fn(prompt, seed)
            im = Image.open(io.BytesIO(b)).convert("RGB")
            LOG.append([name, "ok", im.size])
            return ImageOps.fit(im, (W, H), Image.LANCZOS), name
        except Exception as e:
            LOG.append([name, "xato", str(e)[:300]])
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
NEG = "no text, no letters, no numbers, no logos, no watermark, no identifiable real people"
order = [("hf", gen_hf), ("pollinations", gen_poll)]
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

# 1) KINO — to'liq AI surat, pastda sarlavha (teleko'rsatuv uslubi)
im, src = bg("Cinematic wide shot of an old 1990s football stadium in Tashkent at golden dusk, floodlights glowing, green pitch, crowd silhouettes far away, blue white green color grading, atmospheric haze, film grain, " + NEG, 11, order)
if im:
    im = im.convert("RGBA"); grad(im, 0, 245, 300); chip(im, "QIZIQARLI FAKT", 60, 50)
    d = ImageDraw.Draw(im); y = title_block(im, TITLE_NA, 60, 470, 1000, 50)
    d.text((60, y + 6), SUB, font=card.font("med", 24), fill=(215, 225, 235)); iflogo(im); save(im, "1_kino_" + src)

# 2) RETRO PLAKAT — markazda katta yil, ostida sarlavha
im, src = bg("Retro 1990s sports poster illustration, vintage leather football ball flying over stylized mountains and a stadium, halftone dots, aged paper texture, sky blue, white, green palette with thin red accents, bold graphic shapes, " + NEG, 23, order)
if im:
    im = im.convert("RGBA"); grad(im, 120, 230, 0); d = ImageDraw.Draw(im)
    fy = card.xfont("oswald-latin-700-normal.woff", 210, "1992")
    d.text((W // 2 + 4, 250 + 4), "1992", font=fy, fill=(0, 0, 0, 160), anchor="mm"); d.text((W // 2, 250), "1992", font=fy, fill=(255, 255, 255), anchor="mm", stroke_width=3, stroke_fill=GREEN)
    f = card.font("black", 44); ls = card.wrap(d, TITLE_NA, f, 1000)
    for k, l in enumerate(ls): d.text((W // 2, 430 + k * 56), l, font=f, fill=(255, 255, 255), anchor="mm")
    d.text((W // 2, 430 + len(ls) * 56 + 10), SUB, font=card.font("med", 22), fill=(220, 230, 240), anchor="mm")
    chip(im, "QIZIQARLI FAKT", 60, 50); iflogo(im); save(im, "2_retro_" + src)

# 3) BO'LINGAN — chapda brend panel, o'ngda qiya ramkada AI surat
im2, src = bg("Nostalgic vintage 1992 photograph, close-up of a classic leather football on fresh grass, a blue white green striped scarf beside it, shallow depth of field, warm evening light, kodak film grain, " + NEG, 37, order)
if im2:
    im = Image.new("RGBA", (W, H), (8, 14, 24, 255))
    mask = Image.new("L", (W, H), 0); ImageDraw.Draw(mask).polygon([(620, 0), (W, 0), (W, H), (500, H)], fill=255)
    im.paste(im2.convert("RGBA"), (0, 0), mask); d = ImageDraw.Draw(im)
    d.line([(620, 0), (500, H)], fill=GREEN, width=8)
    chip(im, "QIZIQARLI FAKT", 60, 50); d.text((60, 120), "1992", font=card.font("black", 120), fill=GREEN)
    y = title_block(im, TITLE_NA, 60, 270, 470, 40); d.text((60, y + 10), "Ilk yilda faqat 4 raqib", font=card.font("med", 24), fill=(200, 210, 220))
    iflogo(im); save(im, "3_bolingan_" + src)

# 4) BADIIY — futbolchilar siluetlari, chapda matn
im, src = bg("Epic digital painting, silhouettes of footballers running out of a stadium tunnel into bright light, blue and green light beams, dramatic, painterly brush strokes, 1990s nostalgia, faces not visible, " + NEG, 51, order)
if im:
    im = im.convert("RGBA"); shade_left(im, 230, 20, 0.7); d = ImageDraw.Draw(im)
    chip(im, "QIZIQARLI FAKT", 60, 50); d.text((60, 110), "1992", font=card.font("black", 140), fill=(255, 255, 255))
    d.rectangle([60, 290, 66, 470], fill=GREEN); title_block(im, TITLE_NA, 90, 290, 560, 44); iflogo(im); save(im, "4_badiiy_" + src)

# 5) DIZAYN (AI'siz) — mavzuga mos: bayroqlar, katta yil fonda
im = Image.new("RGBA", (W, H), (8, 14, 24, 255)); d = ImageDraw.Draw(im, "RGBA")
for k, c in enumerate([(30, 144, 206), (255, 255, 255), (30, 160, 70)]):
    d.polygon([(860 + k * 70, 0), (1000 + k * 70, 0), (720 + k * 70, H), (580 + k * 70, H)], fill=c + (34,))
big = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(big).text((W - 50, H // 2), "1992", font=card.font("black", 250), fill=(255, 255, 255, 40), anchor="rm"); im = Image.alpha_composite(im, big); d = ImageDraw.Draw(im, "RGBA")
raw, _ = http("https://flagcdn.com/w320/uz.png"); uz = Image.open(io.BytesIO(raw)).convert("RGBA").resize((150, 75)); im.paste(uz, (60, 60), uz)
y = title_block(im, TITLE_NA, 60, 170, 640, 48)
d.text((60, y + 30), "Ilk yilda faqat 4 raqib:", font=card.font("bold", 26), fill=GREEN)
for k, cc in enumerate(["tj", "tm", "kz", "kg"]):
    raw, _ = http(f"https://flagcdn.com/w160/{cc}.png"); fl = Image.open(io.BytesIO(raw)).convert("RGBA").resize((96, 64))
    d.rounded_rectangle([60 + k * 120 - 4, y + 76, 60 + k * 120 + 100, y + 76 + 72], radius=8, fill=(255, 255, 255, 40)); im.paste(fl, (60 + k * 120, y + 80), fl)
iflogo(im); save(im, "5_dizayn_AIsiz")

json.dump(LOG, open(f"{OUT}/log.json", "w"), ensure_ascii=False, indent=1, default=str)
print(json.dumps(LOG, ensure_ascii=False, default=str)[:3000])
