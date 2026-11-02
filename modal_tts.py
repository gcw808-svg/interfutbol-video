# Botdagi diktorni Modal videokartasida tez ishlatish (tts.py ning o'zi, faqat GPU'da).
import os, subprocess
import modal

app = modal.App("inter-diktor-tts")
image = (modal.Image.debian_slim(python_version="3.11")
         .apt_install("ffmpeg")
         .pip_install("f5-tts", "soundfile", "requests", "huggingface_hub")
         .add_local_file("tts.py", "/root/tts.py")
         .add_local_file("uznum.py", "/root/uznum.py"))
hf_cache = modal.Volume.from_name("inter-hf-cache", create_if_missing=True)

@app.function(image=image, gpu="T4", timeout=1800, secrets=[modal.Secret.from_name("inter-tts")],
              volumes={"/root/.cache/huggingface": hf_cache})
def speak(job: str, mood: str = "oddiy"):
    env = dict(os.environ, JOB=job, MOOD=mood, DIKTOR_NFE="32")
    subprocess.run(["python", "/root/tts.py"], cwd="/root", env=env, check=True)
    hf_cache.commit()

@app.local_entrypoint()
def main(job: str, mood: str = "oddiy"):
    speak.remote(job, mood)
