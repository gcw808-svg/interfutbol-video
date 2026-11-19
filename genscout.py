# RAZVEDKACHI ROBOT (2026-11-19, Bahtiyor aka: "rasm generatsiyasi o'zini o'zi rivojlantirib, yangi usullardan foydalanib tursin" va
# "foydalangan kodlarimizni o'zimizda saqlab qo'y — kelgusida kodini yopib qo'ysa yoki o'chirib yuborsa ham biz bemalol ishlashimiz kerak"):
# 1) SCOUT — haftada bir marta Hugging Face'dagi ochiq rasm modellarini (text-to-image, image-to-image) ko'rib chiqadi va FAQAT model FAYLLARINING
#    litsenziyasi tijoratga to'liq ruxsat beradiganlarini (Apache-2.0, MIT, BSD, CC0) ro'yxatga oladi. Litsenziya kod omboridan emas, model omborining
#    o'z belgisidan olinadi (tuzoq: kodi Apache bo'lib, og'irliklari notijorat bo'lgan modellar bor). Yopiq (gated), LoRA, kvantlangan/qayta yuklangan
#    nusxalar va kattalar uchun modellar olinmaydi. Natija: gen/models.json (holat) va gen/MODELLAR.md (jadval); yangi model chiqsa adminga xabar.
# 2) MIRROR — tanlangan modelning HAMMA fayli (og'irliklar, sozlamalar, LICENSE) o'zimizning yopiq Hugging Face omborimizga fayl-ma-fayl ko'chiriladi
#    (asl ombor o'chirilsa yoki yopilsa ham bizdagi nusxa qoladi; Apache-2.0 berilgan versiyadan qaytarib olinmaydi). Qo'shimcha: manba commit raqami,
#    fayllar ro'yxati va sha256 lari MANIFEST.json da. Kod kutubxonalari (diffusers va h.k.) g'ildirak (wheel) fayllari ham shu omborga "_code/" ga.
import json, os, re, sys, time, hashlib, subprocess
import requests

UA = {"user-agent": "InterFutbolGenScout/1.0"}
HF = "https://huggingface.co/api/models"
OK = {"apache-2.0", "mit", "bsd-3-clause", "bsd-2-clause", "cc0-1.0", "unlicense"}
BAD_TAG = re.compile(r"^(lora|gguf|not-for-all-audiences|nsfw|onnx|mlx|openvino)$|^base_model:(quantized|adapter|finetune|merge):", re.I)
BAD_ID = re.compile(r"uncensor|nsfw|lora|gguf|quant|fp8|nunchaku|-int[48]|4bit|8bit|abliter", re.I)
MIN_LIKES = int(os.environ.get("MIN_LIKES") or "150")
STATE, TABLE = "gen/models.json", "gen/MODELLAR.md"
W = "https://inter-futbol-bot.gcw808.workers.dev"


def get(url, params=None):
    for k in range(3):
        try:
            r = requests.get(url, params=params, headers=UA, timeout=60)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        time.sleep(3 + 4 * k)
    return None


def lic(tags):
    return next((t.split(":", 1)[1] for t in tags if t.startswith("license:")), "")


def scout():
    st = json.load(open(STATE, encoding="utf-8")) if os.path.exists(STATE) else {"models": {}, "rejected": {}}
    seen = {}
    for task in ("text-to-image", "image-to-image"):
        for sort in ("trendingScore", "likes"):
            for m in get(HF, {"pipeline_tag": task, "sort": sort, "direction": -1, "limit": 100}) or []:
                seen.setdefault(m["id"], m)
    new, today = [], time.strftime("%Y-%m-%d")
    for mid, m in sorted(seen.items()):
        tags = m.get("tags", [])
        why = ""
        if m.get("likes", 0) < MIN_LIKES: why = "kam ma'lum"
        elif any(BAD_TAG.search(t) for t in tags) or BAD_ID.search(mid): why = "nusxa/LoRA/kvant yoki kattalar uchun"
        elif lic(tags) not in OK: why = "litsenziya: " + (lic(tags) or "ko'rsatilmagan")
        if why:
            if lic(tags) and lic(tags) not in OK and m.get("likes", 0) >= 500 and not BAD_ID.search(mid):
                st["rejected"][mid] = {"lic": lic(tags), "likes": m.get("likes", 0), "seen": today}  # mashhur, lekin litsenziyasi to'g'ri kelmaydi — jadvalda ko'rsatiladi
            continue
        d = get(f"{HF}/{mid}", {"blobs": "true"}) or {}
        if d.get("gated") or d.get("private") or d.get("disabled"):
            st["rejected"][mid] = {"lic": lic(tags) + " (yopiq kirish)", "likes": m.get("likes", 0), "seen": today}; continue
        sib = d.get("siblings", [])
        gb = round(sum((x.get("size") or 0) for x in sib) / 1e9, 1)
        if gb < 0.5:
            continue
        has_lic = any(re.match(r"(LICENSE|LICENCE)", x["rfilename"], re.I) for x in sib)
        rec = st["models"].get(mid)
        if not rec:
            rec = st["models"][mid] = {"first": today, "status": "yangi"}; new.append(mid)
        rec.update({"lic": lic(tags), "likes": d.get("likes", 0), "gb": gb, "task": d.get("pipeline_tag", ""), "sha": d.get("sha", ""), "created": (d.get("createdAt") or "")[:10],
                    "lib": d.get("library_name", ""), "lic_file": has_lic, "seen": today})
        time.sleep(0.3)
    for mid, rec in st["models"].items():  # asl ombor yo'qolgan yoki litsenziyasi o'zgargan bo'lsa — belgilash (bizdagi nusxa qoladi)
        if rec.get("seen") != today:
            d = get(f"{HF}/{mid}")
            if d is None: rec["upstream"] = "asl ombor topilmadi (" + today + ")"
            elif lic(d.get("tags", [])) != rec.get("lic"): rec["upstream"] = "litsenziya o'zgargan: " + lic(d.get("tags", [])) + " (" + today + ")"
    st["checked"] = today
    os.makedirs("gen", exist_ok=True)
    json.dump(st, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    rows = sorted(st["models"].items(), key=lambda kv: -kv[1].get("likes", 0))
    md = ["# Rasm generatsiyasi: tijoratga ruxsatli ochiq modellar", "", f"Oxirgi tekshiruv: {today}. Robot: genscout.py (har dushanba). Litsenziya model fayllari bo'yicha tekshiriladi.", "",
          "| Model | Litsenziya | Hajmi (GB) | Chiqqan | Yoqtirishlar | Holati | Bizdagi nusxa |", "|---|---|---|---|---|---|---|"]
    md += [f"| {mid} | {r['lic']} | {r['gb']} | {r.get('created','')} | {r['likes']} | {r['status']}{' — ' + r['upstream'] if r.get('upstream') else ''} | {r.get('mirror','—')} |" for mid, r in rows]
    md += ["", "## Mashhur, lekin bizga to'g'ri kelmaydi (litsenziya)", "", "| Model | Litsenziya | Yoqtirishlar |", "|---|---|---|"]
    md += [f"| {mid} | {r['lic']} | {r['likes']} |" for mid, r in sorted(st["rejected"].items(), key=lambda kv: -kv[1]["likes"])[:25]]
    open(TABLE, "w", encoding="utf-8").write("\n".join(md) + "\n")
    print("ruxsatli modellar:", len(st["models"]), "| yangi:", new)
    if new and os.environ.get("BOT_TOKEN") and os.environ.get("NOTIFY") == "1":
        note("🔭 Rasm modellari razvedkasi: tijoratga ruxsatli yangi ochiq model(lar) chiqdi:\n" + "\n".join(f"• {m} — {st['models'][m]['lic']}, {st['models'][m]['gb']} GB" for m in new[:8]) + "\n\nSinovdan o'tkazib, natijani ko'rsataman.")


def note(text):
    try:
        key = hashlib.sha256(("ub-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:40]
        print("xabar:", requests.post(W + "/ub/note", headers={"x-key": key, "content-type": "application/json", "user-agent": "genscout"}, data=json.dumps({"text": text}), timeout=40).text[:60])
    except Exception as e:
        print("xabar yuborilmadi", str(e)[:80])


def mirror(mid):
    from huggingface_hub import HfApi, hf_hub_download
    tok = os.environ["HF_TOKEN"]; api = HfApi(token=tok)
    d = get(f"{HF}/{mid}", {"blobs": "true"})
    if not d or lic(d.get("tags", [])) not in OK or d.get("gated"):
        print("ko'chirilmaydi: litsenziya yoki kirish to'g'ri kelmaydi", mid); sys.exit(1)
    me = api.whoami()["name"]
    dst = f"{me}/inter-gen-{mid.split('/')[-1].lower()}"
    api.create_repo(dst, private=True, exist_ok=True, repo_type="model")
    have = {x.rfilename: getattr(x, "size", None) for x in api.model_info(dst, files_metadata=True).siblings}
    sha, man, n = d["sha"], [], 0
    for x in sorted(d["siblings"], key=lambda s: s.get("size") or 0):
        fn, size = x["rfilename"], x.get("size") or 0
        man.append({"f": fn, "size": size, "sha256": (x.get("lfs") or {}).get("sha256", "")})
        if have.get(fn) == size and size:
            continue
        p = hf_hub_download(mid, fn, revision=sha, local_dir="mirror_tmp")
        api.upload_file(path_or_fileobj=p, path_in_repo=fn, repo_id=dst, commit_message=f"nusxa: {fn}")
        os.remove(p); n += 1
        print("+", fn, round(size / 1e6), "MB", flush=True)
    api.upload_file(path_or_fileobj=json.dumps({"source": mid, "commit": sha, "license": lic(d["tags"]), "date": time.strftime("%Y-%m-%d"), "files": man}, indent=1).encode(),
                    path_in_repo="MANIFEST.json", repo_id=dst, commit_message="manifest")
    # kod: shu modelni ishlatadigan kutubxonalarning aniq versiyadagi g'ildirak fayllari (PyPI o'chsa ham o'rnatish mumkin bo'lsin)
    pk = [p for p in (os.environ.get("CODE") or "diffusers transformers accelerate safetensors sentencepiece tokenizers huggingface_hub").split() if p]
    os.makedirs("code_tmp", exist_ok=True)
    subprocess.run([sys.executable, "-m", "pip", "download", "-q", "--no-deps", "-d", "code_tmp"] + pk, check=False)
    fr = subprocess.run([sys.executable, "-m", "pip", "download", "-q", "--no-deps", "--no-binary", ":all:", "-d", "code_tmp/src", "diffusers"], check=False)
    if os.listdir("code_tmp"):
        api.upload_folder(folder_path="code_tmp", path_in_repo="_code", repo_id=dst, commit_message="kod kutubxonalari (wheel + manba)")
    print("kod fayllari:", sorted(os.listdir("code_tmp"))[:12])
    st = json.load(open(STATE, encoding="utf-8")) if os.path.exists(STATE) else {"models": {}, "rejected": {}}
    rec = st["models"].setdefault(mid, {"first": time.strftime("%Y-%m-%d"), "status": "yangi", "lic": lic(d["tags"]), "likes": d.get("likes", 0), "gb": round(sum(f["size"] for f in man) / 1e9, 1)})
    rec["mirror"] = f"{dst} @ {sha[:8]} ({time.strftime('%Y-%m-%d')})"
    if rec.get("status") == "yangi": rec["status"] = "saqlangan"
    json.dump(st, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    print("ko'chirildi:", mid, "→", dst, "| yangi fayllar:", n, "| jami:", len(man))


if __name__ == "__main__":
    if os.environ.get("MIRROR"):
        mirror(os.environ["MIRROR"].strip())
    scout()
