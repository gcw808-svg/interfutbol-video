# Inter Futbol: ZAXIRA kartochka chizuvchi (Modal). GitHub Actions ishlamay qolsa, bot kartochkani shu yerda chizdiradi.
# card.py bilan bir xil dizayn (card.py shu reponing o'zidan olinadi). Kirish faqat maxfiy kalit (x-key) bilan.
import os

import modal
from fastapi import Request, Response

app = modal.App("inter-card")
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("fonts-inter", "fonts-dejavu-core", "curl")
    .pip_install("pillow==10.4.0", "fastapi[standard]", "numpy", "onnxruntime")
    .run_commands(
        "mkdir -p /root/fonts && curl -sSL -o /root/fonts/oswald-latin-700-normal.woff "
        "https://cdn.jsdelivr.net/npm/@fontsource/oswald@5.0.17/files/oswald-latin-700-normal.woff"
    )
    .add_local_file("models/realesr-general-x4v3.onnx", "/root/models/realesr-general-x4v3.onnx")
    .add_local_file("card.py", "/root/card.py")
)


@app.function(image=image, secrets=[modal.Secret.from_name("inter-card")], timeout=120)
@modal.fastapi_endpoint(method="POST")
async def render(request: Request):
    if request.headers.get("x-key") != os.environ.get("CARD_KEY"):
        return Response(status_code=403)
    j = await request.json()
    import sys

    sys.path.insert(0, "/root")
    import card

    return Response(content=card.render(j), media_type="image/png")
