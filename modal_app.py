# Diktor o'qitishining Modal (zaxira GPU) varianti. Boshqaruvchi `modal run --detach modal_app.py` bilan ishga tushiradi.
import os, subprocess, urllib.request
import modal

app = modal.App("inter-diktor")
image = (modal.Image.debian_slim(python_version="3.11")
         .apt_install("ffmpeg", "git", "curl")
         .pip_install("f5-tts", "bitsandbytes", "soundfile", "huggingface_hub", "accelerate"))

@app.function(image=image, gpu="A10G", timeout=24 * 3600, secrets=[modal.Secret.from_name("inter-hf")])
def train(run: str = "run4", epochs: int = 100):
    os.environ.update(DIKTOR_RUN=run, DIKTOR_EPOCHS=str(epochs), DIKTOR_PLATFORM="modal", DIKTOR_WORK="/root/work")
    req = urllib.request.Request("https://inter-futbol-bot.gcw808.workers.dev/dsget?k=Hq7pZ2vLx9&n=script", headers={"User-Agent": "Mozilla/5.0"})
    open("/root/run.py", "wb").write(urllib.request.urlopen(req, timeout=60).read())
    subprocess.run(["python", "/root/run.py"], check=True)

@app.local_entrypoint()
def main(run: str = "run4", epochs: int = 100):
    train.remote(run, epochs)
