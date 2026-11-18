# Inter Futbol: ASOSIY ish bajaruvchi (Modal) — natija/yangilik kartochkasini chizish (card.py) va
# postni Bahtiyor akaning hisobi nomidan chiqarish/tahrirlash (ub.py). 2026-11-08 dan GitHub Actions o'rniga
# shu ishlaydi (GitHub bepul daqiqalari tejaladi); Modal ishlamasa bot avvalgidek GitHub'ni chaqiradi (zaxira).
# Kirish faqat maxfiy kalit (x-key) bilan. Kod (card.py, ub.py) shu reponing o'zidan olinadi — dizayn bir xil.
import os

import modal
from fastapi import Request, Response

app = modal.App("inter-jobs")
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("fonts-dejavu-core", "curl", "unzip")
    .pip_install("pillow==10.4.0", "fastapi[standard]", "telethon", "cryptg", "numpy", "onnxruntime", "requests")
    .run_commands(
        # GitHub'dagi bilan bir xil shriftlar: Inter 4.1 va Oswald (@fontsource 5.3.0)
        "curl -sSL --retry 3 -o /tmp/inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip"
        " && mkdir -p /usr/share/fonts/truetype/inter-dl"
        " && unzip -o -j -q /tmp/inter.zip extras/ttf/Inter-Black.ttf extras/ttf/Inter-ExtraBold.ttf extras/ttf/Inter-Bold.ttf"
        " extras/ttf/Inter-Medium.ttf extras/ttf/Inter-Regular.ttf -d /usr/share/fonts/truetype/inter-dl && rm /tmp/inter.zip",
        "mkdir -p /root/fonts && curl -sSL --retry 3 -o /root/fonts/oswald-latin-700-normal.woff "
        "https://cdn.jsdelivr.net/npm/@fontsource/oswald@5.3.0/files/oswald-latin-700-normal.woff",
    )
    .add_local_file("models/realesr-general-x4v3.onnx", "/root/models/realesr-general-x4v3.onnx")  # sifat oshiruvchi (card.py _sr)
    .add_local_file("card.py", "/root/card.py")
    .add_local_file("ub.py", "/root/ub.py")
    # odamlar roboti (people.py) — GitHub daqiqalarini tejash uchun shu yerda ishlaydi (2026-11-18)
    .add_local_file("models/yolox_tiny.onnx", "/root/models/yolox_tiny.onnx")
    .add_local_file("persons.py", "/root/persons.py")
    .add_local_file("people_seen.txt", "/root/people_seen.txt")
    .add_local_file("people.py", "/root/people.py")
)
SECRETS = [modal.Secret.from_name("inter-jobs")]
# INTER DIKTOR: ovoz + matnni moslash (dk_align.py) — alohida obraz (kartochka obraziga tegmaydi); Whisper modeli doimiy diskda saqlanadi
dk_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install("stable-ts", "python-docx", "telethon", "cryptg")
    .add_local_file("uznum.py", "/root/uznum.py")
    .add_local_file("dk_align.py", "/root/dk_align.py")
)
dk_models = modal.Volume.from_name("inter-whisper", create_if_missing=True)


@app.function(image=image, secrets=SECRETS, timeout=300, retries=1)
def run_card(job: str):
    import runpy

    os.environ["JOB"] = job
    os.chdir("/root")
    runpy.run_path("/root/card.py", run_name="__main__")


@app.function(image=image, secrets=SECRETS, timeout=300)
def run_ub(job: str):
    import asyncio
    import sys

    sys.path.insert(0, "/root")
    os.environ["JOB"] = job
    import ub

    asyncio.run(ub.post(job))


# Modal hisobida to'lov usuli yo'q — videokarta (GPU) berilmaydi, shuning uchun protsessorda ishlaydi (sekinroq: 10 daqiqalik yozuv ~10–20 daqiqa).
# Karta ulansa: gpu="T4" qo'shib, DK_MODEL ni "large-v3" qilish mumkin.
@app.function(image=dk_image, secrets=SECRETS, timeout=3600, cpu=8.0, memory=12288, volumes={"/root/.cache/whisper": dk_models})
def run_dkalign(job: str):
    import asyncio
    import sys

    sys.path.insert(0, "/root")
    os.chdir("/root")
    import dk_align

    try:
        asyncio.run(dk_align.run(job))
    finally:
        dk_models.commit()


@app.function(image=image, secrets=SECRETS, timeout=3600, cpu=2.0)
def run_people(job: str):
    # job — JSON: people.yml kirishlari (ONLY, ADD, PER, LIMIT, MAXP, DRY, DEL, REG); natija /ub/plog ga yoziladi
    import json
    import runpy
    import sys

    for k, v in json.loads(job).items():
        os.environ[str(k).upper()] = str(v)
    os.environ["REPORT"] = "1"
    os.chdir("/root")
    sys.path.insert(0, "/root")
    runpy.run_path("/root/people.py", run_name="__main__")


@app.function(image=image, secrets=SECRETS, timeout=60)
@modal.fastapi_endpoint(method="POST")
async def dispatch(request: Request):
    if request.headers.get("x-key") != os.environ.get("JOBS_KEY"):
        return Response(status_code=403)
    j = await request.json()
    wf, job = j.get("wf"), str(j.get("job") or "")
    if not job:
        return Response(status_code=400)
    if wf == "card.yml":
        await run_card.spawn.aio(job)
    elif wf == "ubpost.yml":
        await run_ub.spawn.aio(job)
    elif wf == "people.yml":
        await run_people.spawn.aio(job)
    elif wf == "dkalign.yml":
        await run_dkalign.spawn.aio(job)
    else:
        return Response(status_code=400)
    return {"ok": True}
