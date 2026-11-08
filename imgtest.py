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


def gen_poll(prompt, seed):
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


TITLE = "O'zbekiston milliy futbol terma jamoasi 1992-yilda tashkil etilgan"
TITLE_NA = "Özbekiston milliy futbol terma jamoasi 1992-yilda taşkil etilgan"
NEG = "no text, no letters, no logos, no watermark, no real identifiable people"

variants = [
    ("A_kino", "Cinematic wide shot of an old Soviet-era football stadium in Tashkent at golden dusk in 1992, floodlights glowing, empty green pitch, "
     "subtle blue, white and green color grading, atmospheric haze, film grain, highly detailed, " + NEG, 11),
    ("B_retro", "Retro 1990s sports poster illustration, vintage leather football ball in the center, stylized map silhouette of Central Asia in the background, "
     "halftone texture, aged paper, palette of sky blue, white, green and thin red lines, bold graphic shapes, " + NEG, 23),
    ("C_foto", "Nostalgic vintage 1992 photograph look, close-up of a classic black and white leather football on fresh grass, a blue-white-green striped scarf lying beside it, "
     "shallow depth of field, warm evening light, kodak film grain, " + NEG, 37),
    ("D_badiiy", "Epic digital painting, silhouettes of footballers running out of a stadium tunnel into bright light, blue and green light beams, "
     "dramatic, dynamic, painterly brush strokes, 1990s nostalgia, faces not visible, " + NEG, 51),
]
order = [("cf", gen_cf), ("gemini", gen_gemini), ("pollinations", gen_poll)]
for key, prompt, seed in variants:
    im, src = bg(prompt, seed, order)
    if im is None:
        continue
    im = im.filter(ImageFilter.GaussianBlur(0.5))
    shade_left(im)
    d = ImageDraw.Draw(im)
    # yil — katta ochiq raqam
    fy = card.font("black", 150)
    d.text((60, 120), "1992", font=fy, fill=(255, 255, 255, 255))
    d.rectangle([60, 300, 66, 470], fill=(91, 182, 55))
    title_block(im, TITLE_NA, 90, 300, 600, 46)
    brand(im, "QIZIQARLI FAKT")
    d.text((60, H - 40), "Rasm sun'iy intellekt yordamida yaratilgan (" + src + ")", font=card.font("med", 16), fill=(200, 205, 215))
    im.save(f"{OUT}/{key}_{src}.jpg", quality=92)

# E — AI'siz, mavzuga mos dizayn: bayroqlar (ilk raqiblar), katta "1992"
try:
    im = Image.new("RGB", (W, H), (8, 14, 24))
    d = ImageDraw.Draw(im, "RGBA")
    for i, c in enumerate([(30, 144, 206), (255, 255, 255), (30, 160, 70)]):
        d.polygon([(760 + i * 70, 0), (900 + i * 70, 0), (620 + i * 70, H), (480 + i * 70, H)], fill=c + (38,))
    fy = card.font("black", 260)
    d.text((W - 60, 40), "1992", font=fy, fill=(255, 255, 255, 30), anchor="ra")
    raw, _ = http("https://flagcdn.com/w320/uz.png")
    uz = Image.open(io.BytesIO(raw)).convert("RGBA").resize((200, 100))
    im.paste(uz, (60, 70), uz)
    title_block(im, TITLE_NA, 60, 200, 700, 52)
    d.text((60, 470), "Ilk yilda faqat 4 raqib:", font=card.font("bold", 26), fill=(91, 182, 55))
    for i, cc in enumerate(["tj", "tm", "kz", "kg"]):
        raw, _ = http(f"https://flagcdn.com/w160/{cc}.png")
        fl = Image.open(io.BytesIO(raw)).convert("RGBA").resize((96, 64))
        d.rounded_rectangle([60 + i * 120 - 4, 516 - 4, 60 + i * 120 + 100, 516 + 68], radius=8, fill=(255, 255, 255, 40))
        im.paste(fl, (60 + i * 120, 516), fl)
    lg = card.logo(84, False)
    im.paste(lg, (W - 84 - 42, H - 84 - 36), lg)
    im.save(f"{OUT}/E_dizayn_noAI.jpg", quality=92)
except Exception as e:
    LOG.append(["E", str(e)[:200]])

json.dump(LOG, open(f"{OUT}/log.json", "w"), ensure_ascii=False, indent=1, default=str)
print(json.dumps(LOG, ensure_ascii=False, default=str)[:3000])
