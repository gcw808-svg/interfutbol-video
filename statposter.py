# RAQAMLI AFISHA (2026-11-23, Bahtiyor aka namunasi: "shunaqa uslubda yasagin" — Manchester United 34 ta o'tkazilgan gol):
# AI chizgan fon (odamning yuzi yo'q, yozuv va logotipsiz sahna) ustiga gerb, yirik raqam, izoh va pastki qator. 1080x1350.
# JOB = JSON {"prompt", "crest", "num", "label", "foot": [..], "n": variantlar soni, "acc": [r,g,b]}; natija arxiv kanaliga fayl bo'lib tushadi.
import base64, io, json, os, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import card
from PIL import Image, ImageDraw, ImageFilter

Wd, Hd = 1080, 1350
# TASDIQLANGAN USLUB (Bahtiyor aka, 2026-11-23: "Afisha iFsiz 1 — shu variant ma'qul; bundan keyin shunga o'xshash ma'lumotli yangiliklar shu uslubda chiqsin"):
# yomg'irli tungi stadion, darvoza to'ri ichidan ko'rinish, burchakda to'p, chapda orqadan ko'ringan futbolchi; iF belgisisiz. "prompt" berilmasa shu sahna,
# "shirt" — forma rangi (masalan "plain red shirt and white shorts").
STYLE = ("Vertical poster background, rainy night football stadium under bright floodlights. Foreground: view from inside the goal through a wet white goal net with raindrops, "
         "the net strings crossing the edges of the frame. A muddy white football rests in the net in the bottom right corner, large and close. On the far left side of the frame, "
         "in the middle distance, a dejected footballer seen from behind stands alone with hands on hips, wearing a {shirt}. The entire upper right and centre of the image is empty "
         "dark night sky with falling rain, nothing there. Blurred crowd stands low in the background, wet dark green grass, moody dark tones.")
NEG = " Photorealistic sports photography, cinematic, dramatic floodlights. Absolutely no text, no letters, no numbers, no logos, no watermarks, no scoreboard. No visible faces."


def http(url, data=None, headers=None, timeout=180):
    req = urllib.request.Request(url, data=data, headers=headers or {}, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("content-type", "")


def gen_gemini(prompt, seed):
    key = os.environ["GEMINI_KEY"]
    api = "https://generativelanguage.googleapis.com/v1beta/models"
    raw, _ = http(f"{api}?pageSize=300", headers={"x-goog-api-key": key})
    ms = [m["name"].split("/")[-1] for m in json.loads(raw).get("models", []) if "image" in m["name"] and "generateContent" in m.get("supportedGenerationMethods", [])]
    last = "model yo'q"
    for m in sorted(ms, key=lambda x: ("pro" in x, "preview" in x)):
        try:
            body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "4:5"}}}
            raw, _ = http(f"{api}/{m}:generateContent", json.dumps(body).encode(), {"content-type": "application/json", "x-goog-api-key": key})
            for c in json.loads(raw).get("candidates", []):
                for p in c.get("content", {}).get("parts", []):
                    d = p.get("inlineData") or p.get("inline_data")
                    if d:
                        print("  gemini:", m)
                        return base64.b64decode(d["data"])
            last = m + " rasm bermadi"
        except urllib.error.HTTPError as e:
            last = f"{m} {e.code} {e.read().decode(errors='ignore')[:160]}"
    raise Exception(last)


def gen_hf(prompt, seed):
    from gradio_client import Client
    last = None
    for sp in ["black-forest-labs/FLUX.1-dev", "black-forest-labs/FLUX.1-schnell"]:
        try:
            c = Client(sp, token=os.environ.get("HF_TOKEN") or None)
            kw = dict(prompt=prompt, seed=seed, randomize_seed=False, width=1024, height=1280, api_name="/infer")
            if "schnell" in sp: kw["num_inference_steps"] = 4
            else: kw.update(guidance_scale=3.5, num_inference_steps=28)
            out = c.predict(**kw)
            path = out[0] if isinstance(out, (list, tuple)) else out
            if isinstance(path, dict): path = path.get("path") or path.get("url")
            print("  hf:", sp)
            return open(path, "rb").read()
        except Exception as e:
            last = sp + " " + str(e)[:160]
    raise Exception(last)


def gen_poll(prompt, seed):
    raw, ct = http("https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt) + f"?width=1080&height=1350&seed={seed}&nologo=true&model=flux&referrer=interfutbol")
    if "image" not in ct:
        raise Exception("rasm emas: " + ct)
    return raw


def cover(im):
    k = max(Wd / im.width, Hd / im.height)
    im = im.resize((int(im.width * k) + 1, int(im.height * k) + 1), Image.LANCZOS)
    x, y = (im.width - Wd) // 2, (im.height - Hd) // 2
    return im.crop((x, y, x + Wd, y + Hd))


def slant(text, size, fill, k=0.16):
    # Inter Black — qiya (kursiv) ko'rinishda, soyasi bilan
    f = card.font("black", size)
    d0 = ImageDraw.Draw(Image.new("L", (8, 8)))
    b = d0.textbbox((0, 0), text, font=f)
    w, h = b[2] - b[0], b[3] - b[1]
    pad = int(h * k) + 40
    L = Image.new("RGBA", (w + 2 * pad, h + 80), (0, 0, 0, 0))
    ImageDraw.Draw(L).text((pad - b[0], 40 - b[1]), text, font=f, fill=fill)
    L = L.transform(L.size, Image.AFFINE, (1, k, -k * L.height / 2, 0, 1, 0), Image.BICUBIC)
    sh = Image.new("RGBA", L.size, (0, 0, 0, 0))
    sh.paste(Image.new("RGBA", L.size, (0, 0, 0, 255)), (0, 0), L.split()[3].point(lambda v: int(v * 0.75)))
    out = Image.new("RGBA", L.size, (0, 0, 0, 0))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size / 22)), (0, max(2, size // 40)))
    out.alpha_composite(L)
    return out.crop(out.getbbox())


def compose(bg, j):
    im = cover(bg.convert("RGB")).convert("RGBA")
    acc = tuple(j.get("acc") or (225, 30, 38))
    ov = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for y in range(Hd):  # tepada va pastda yozuv uchun qorayish
        a = int(150 * max(0, 1 - y / 700) ** 1.3) + int(235 * max(0, (y - 1060) / 290) ** 1.2)
        od.line([0, y, Wd, y], fill=(4, 6, 10, min(245, a)))
    im.alpha_composite(ov)
    cr = card.get_logo(j.get("crest"), 300) if j.get("crest") else None
    left = 56
    if cr:
        card._shadow_paste(im, cr, 56, 150 - cr.height // 2 + 50)
        left = 56 + cr.width + 30
    maxw = Wd - left - 50
    s = 470
    while s > 200 and slant(j["num"], s, (245, 245, 245, 255)).width > maxw:
        s -= 10
    num = slant(j["num"], s, (245, 245, 245, 255))
    nx, ny = left + (maxw - num.width) // 2, 215
    im.alpha_composite(num, (nx, ny))
    d = ImageDraw.Draw(im)
    ly = ny + num.height + 26
    d.rectangle([left + 10, ly, Wd - 60, ly + 10], fill=acc)
    ls = 92
    while ls > 44 and slant(j["label"], ls, (255, 255, 255, 255)).width > maxw:
        ls -= 4
    lab = slant(j["label"], ls, (255, 255, 255, 255))
    im.alpha_composite(lab, (left + (maxw - lab.width) // 2, ly + 36))
    foot = [str(x) for x in (j.get("foot") or [])]
    if foot:
        fs = 54
        f = card.font("black", fs)
        gap, dot = 44, 9
        tw = lambda: sum(d.textlength(t, font=f) for t in foot) + (len(foot) - 1) * (2 * gap + 2 * dot)
        while fs > 30 and tw() > Wd - 220:
            fs -= 2; f = card.font("black", fs)
        x, y = (Wd - tw()) / 2, 1262
        d.line([40, y, x - 30, y], fill=acc, width=3); d.line([x + tw() + 30, y, Wd - 40, y], fill=acc, width=3)
        for k, t in enumerate(foot):
            d.text((x, y), t, font=f, fill=(255, 255, 255), anchor="lm")
            x += d.textlength(t, font=f)
            if k < len(foot) - 1:
                d.ellipse([x + gap - dot, y - dot, x + gap + dot, y + dot], fill=acc); x += 2 * gap + 2 * dot
    out = im.convert("RGB")
    if j.get("mark", 0):  # odatda iF belgisisiz; "mark": 1 — belgi bilan (Bahtiyor aka, 2026-11-23: "burchakdagi iF logoni olib tashla")
        card.NO_MARK = False
        card.paste_mark(out, "tr")
    return out


if __name__ == "__main__":
    j = json.loads(os.environ["JOB"])
    api = "https://api.telegram.org/bot" + os.environ["BOT_TOKEN"] + "/"
    import requests
    done = 0
    for v in range(int(j.get("n") or 2)):
        raw = None
        for g in (gen_gemini, gen_hf, gen_poll):
            try:
                raw = g((j.get("prompt") or STYLE.format(shirt=j.get("shirt") or "plain dark shirt and white shorts")) + NEG, int(j.get("seed") or 100) + v * 7); break
            except Exception as e:
                print("  -", g.__name__, str(e)[:200])
        if not raw:
            continue
        buf = io.BytesIO(); compose(Image.open(io.BytesIO(raw)), j).save(buf, "JPEG", quality=94, subsampling=0)
        r = requests.post(api + "sendDocument", data={"chat_id": -1003533987068, "caption": (j.get("cap") or "Afisha") + f" — {v + 1}-variant", "disable_notification": True, "disable_content_type_detection": True}, files={"document": (f"afisha_{v + 1}.jpg", buf.getvalue(), "image/jpeg")}, timeout=180).json()
        if r.get("ok"):
            done += 1; print("ARXIV", r["result"]["message_id"], r["result"]["document"]["file_id"])
        else:
            print("  yuborilmadi", r.get("description"))
    sys.exit(0 if done else 1)
