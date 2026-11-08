# Diktor o'qitish boshqaruvchisi (GitHub Actions'da har 30 daqiqada ishlaydi).
# Vazifasi: o'qitish tugamagan bo'lsa va hech qayerda ishlamayotgan bo'lsa — uni avval Kaggle'da,
# Kaggle GPU vaqti tugagan bo'lsa Modal'da ishga tushiradi. Natija Hugging Face omborida saqlanadi,
# shuning uchun har safar o'qitish to'xtagan joyidan davom etadi.
import hashlib, json, os, subprocess, sys, tempfile, urllib.parse, urllib.request
from huggingface_hub import HfApi, hf_hub_download

W = "https://inter-futbol-bot.gcw808.workers.dev"
K = hashlib.sha256(("ds-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:24]  # kalit kodda saqlanmaydi
KERNEL = os.environ.get("KAGGLE_KERNEL", "baxtiyoraxrarov/notebookdb9f80e52d")
EVENT = os.environ.get("GITHUB_EVENT_NAME", "schedule")

def note(text):
    try:
        req = urllib.request.Request(W + "/ftres?k=" + K + "&cap=" + urllib.parse.quote("[boshqaruvchi] " + text), data=b"", method="POST", headers={"User-Agent": "Mozilla/5.0"})
        urllib.request.urlopen(req, timeout=30)
    except Exception as e:
        print("note xato", e)

def run(cmd):
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    out = (p.stdout or "") + (p.stderr or "")
    print("+", cmd, "\n", out[-2000:], flush=True)
    return p.returncode, out

api = HfApi(token=os.environ["HF_TOKEN"])
repo = api.whoami()["name"] + "/inter-diktor"
api.create_repo(repo, private=True, exist_ok=True)

def read_control():
    try:
        return json.load(open(hf_hub_download(repo, "control.json", token=os.environ["HF_TOKEN"], force_download=True)))
    except Exception:
        return None

def write_control(c):
    api.upload_file(path_or_fileobj=json.dumps(c).encode(), path_in_repo="control.json", repo_id=repo, commit_message="control")

if EVENT == "workflow_dispatch":
    prev = read_control() or {}
    ctl = {k: prev[k] for k in ("kaggle_prev_run",) if k in prev}
    ctl.update({"run": os.environ.get("IN_RUN") or "run4", "epochs": int(os.environ.get("IN_EPOCHS") or 100),
                "prefer": os.environ.get("IN_PREFER") or "auto", "active": True})
    write_control(ctl)
    note(f"🔁 {ctl['run']} o'qitishi kuzatuvga olindi ({ctl['epochs']} epoch, afzal: {ctl['prefer']}).")
else:
    ctl = read_control()
    if not ctl or not ctl.get("active"):
        print("faol o'qitish yo'q"); sys.exit(0)

RUN = ctl["run"]
if api.file_exists(repo, f"{RUN}/DONE"):
    ctl["active"] = False; write_control(ctl)
    print("tugagan"); sys.exit(0)

# --- hozir biror joyda ishlayaptimi?
kaggle_ok = bool(os.environ.get("KAGGLE_API_TOKEN") or (os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY")))
modal_ok = bool(os.environ.get("MODAL_TOKEN_ID") and os.environ.get("MODAL_TOKEN_SECRET"))
if kaggle_ok:
    rc, out = run(f"kaggle kernels status {KERNEL}")
    low = out.lower()
    if rc != 0 or "traceback" in low:
        print("Kaggle holatini bilib bo'lmadi — xavfsizlik uchun hech narsa ishga tushirilmaydi"); sys.exit(1)
    if "running" in low or "queued" in low:
        print("Kaggle'da ishlayapti"); sys.exit(0)
if modal_ok:
    rc, out = run("modal app list --json")
    try:
        apps = json.loads(out[out.index("["):])
        if any(a.get("Description", a.get("description", "")) == "inter-diktor" and "stopped" not in str(a.get("State", a.get("state", ""))).lower() for a in apps):
            print("Modal'da ishlayapti"); sys.exit(0)
    except Exception as e:
        print("modal ro'yxat xato", e)

# --- Kaggle'dagi oxirgi tugagan o'qitish modelini botga ulash (Hugging Face'ga ko'chirish)
def publish_kaggle_output():
    prev = ctl.get("kaggle_prev_run", "run3")
    target = f"{prev}/inter_diktor.safetensors"
    if api.file_exists(repo, target): return
    d = tempfile.mkdtemp()
    run(f'kaggle kernels output {KERNEL} -p {d} --file-pattern "inter_diktor[.]safetensors$"')
    for root, _, fs in os.walk(d):
        if "inter_diktor.safetensors" in fs:
            api.upload_file(path_or_fileobj=os.path.join(root, "inter_diktor.safetensors"), path_in_repo=target, repo_id=repo, commit_message=f"{prev} modeli")
            note(f"📦 {prev} modeli botdagi diktorga ulandi.")
            return
    print("Kaggle natijasida model topilmadi")
if kaggle_ok:
    try: publish_kaggle_output()
    except Exception as e: print("model ko'chirish xato:", e)
    # Kaggle'da tugagan o'qitish modeli HF'ga ko'chirilgan bo'lsa — bu o'qitish tugagan hisoblanadi
    # (HF'ga saqlash ishlamagan holatda ham qayta boshidan ishga tushirib GPU vaqtini isrof qilmaslik uchun).
    if ctl.get("kaggle_prev_run") == RUN and api.file_exists(repo, f"{RUN}/inter_diktor.safetensors"):
        api.upload_file(path_or_fileobj=b"done", path_in_repo=f"{RUN}/DONE", repo_id=repo, commit_message="tugadi")
        ctl["active"] = False; write_control(ctl)
        note(f"✅ {RUN} o'qitishi tugadi, yangi model botdagi diktorga ulandi."); sys.exit(0)

# --- ishga tushirish
def kaggle_gpu_left():
    """Kaggle'dagi qolgan GPU soati (bilib bo'lmasa None)."""
    rc, out = run("kaggle quota -v")
    for line in out.splitlines():
        parts = [x.strip() for x in line.split(",")]
        if parts and parts[0].upper() == "GPU" and len(parts) >= 3:
            try: return float(parts[2].rstrip("h")), (parts[4] if len(parts) > 4 else "")
            except ValueError: pass
    return None, ""

def launch_kaggle():
    left, refresh = kaggle_gpu_left()
    if left is not None and left < 1.0:
        return False, f"quota: {left:.1f} soat qoldi, yangilanish: {refresh}"
    d = tempfile.mkdtemp()
    cell = (f'!curl -s -A "Mozilla/5.0" "{W}/dsget?k={K}&n=script" -o run.py && '
            f'DS_KEY={K} DIKTOR_RUN={RUN} DIKTOR_EPOCHS={ctl["epochs"]} python run.py')
    nb = {"cells": [{"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": [cell]}],
          "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}},
          "nbformat": 4, "nbformat_minor": 4}
    json.dump(nb, open(os.path.join(d, "diktor.ipynb"), "w"))
    meta = {"id": KERNEL, "title": KERNEL.split("/")[1], "code_file": "diktor.ipynb", "language": "python",
            "kernel_type": "notebook", "is_private": True, "enable_gpu": True, "enable_internet": True,
            "machine_shape": "NvidiaTeslaT4"}
    json.dump(meta, open(os.path.join(d, "kernel-metadata.json"), "w"))
    rc, out = run(f"kaggle kernels push -p {d}")
    if rc != 0 or "error" in out.lower() or "quota" in out.lower():
        if "machine_shape" in out or "machineshape" in out.lower():
            meta.pop("machine_shape"); json.dump(meta, open(os.path.join(d, "kernel-metadata.json"), "w"))
            rc, out = run(f"kaggle kernels push -p {d}")
    ok = rc == 0 and "quota" not in out.lower() and "error" not in out.lower()
    return ok, out

def launch_modal():
    run(f'modal secret create inter-hf HF_TOKEN="$HF_TOKEN" DS_KEY="{K}" --force > /dev/null')
    rc, out = run(f"modal run --detach modal_app.py --run {RUN} --epochs {ctl['epochs']}")
    return rc == 0, out

prefer = ctl.get("prefer", "auto")
order = ["modal", "kaggle"] if prefer == "modal" else ["kaggle", "modal"]
for plat in order:
    if plat == "kaggle" and kaggle_ok:
        ok, out = launch_kaggle()
        if ok:
            left, _ = kaggle_gpu_left()
            ctl["kaggle_prev_run"] = RUN; write_control(ctl)
            note(f"▶️ {RUN} Kaggle'da ishga tushirildi" + (f" (GPU vaqtidan {left:.1f} soat qoldi)." if left is not None else ".")); sys.exit(0)
        note("ℹ️ Kaggle'da ishga tushmadi" + (" (GPU vaqti tugagan)" if "quota" in out.lower() else "") + " — keyingi variant sinab ko'riladi.")
    if plat == "modal" and modal_ok:
        ok, out = launch_modal()
        if ok:
            note(f"▶️ {RUN} Modal'da ishga tushirildi."); sys.exit(0)
        note("⚠️ Modal'da ham ishga tushmadi: " + out[-200:])
if kaggle_ok or modal_ok:
    note("⚠️ Bo'sh GPU topilmadi, 30 daqiqadan keyin yana urinib ko'raman.")
else:
    print("Kaggle/Modal kalitlari hali sozlanmagan")
