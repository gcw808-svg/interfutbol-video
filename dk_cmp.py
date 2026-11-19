# INTER DIKTOR — ASL O'QISH BILAN SOLISHTIRISH (2026-11-20, Bahtiyor aka: "mana qanday o'qilishi kerak ... solishtir ... diktorni shunga mosla").
# Kanaldagi asl yozuv (MSG) va shu matnning diktor o'qigan nusxasi o'zbekcha eshitish modeli bilan so'zma-so'z o'lchanadi:
# nutq tezligi, pauzalar, "ya'ni"dan keyingi pauza, sonlar qanday aytilgani. Keyin diktor tezligi asl o'qishga moslab qayta o'qiladi va kanalga tashlanadi.
# Jurnalga matn chiqarilmaydi — faqat o'lchovlar va so'ralgan so'zlar.
import hashlib, json, os, re, subprocess, sys, time, urllib.parse
os.environ.setdefault("JOB", "cmp")
import numpy as np, requests, soundfile as sf
import tts as T
import dk_align as A

W, H = T.W, T.H
MSG, DOC, FIND = int(os.environ.get("MSG", "478")), int(os.environ.get("DOC", "474")), os.environ.get("FIND", "11 ta golda")
UA = {"user-agent": "dkcmp"}


def words(fw, path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    segs, _ = fw.transcribe(np.frombuffer(raw, dtype=np.float32), language="uz", beam_size=2, temperature=0.0, condition_on_previous_text=False, word_timestamps=True)
    return [(x.word.strip(), float(x.start), float(x.end)) for s in segs for x in (s.words or []) if x.word.strip()]


def stats(ws, label):
    if not ws:
        print(label, "so'z topilmadi", flush=True)
        return {}
    gaps = [ws[i + 1][1] - ws[i][2] for i in range(len(ws) - 1)]
    letters = sum(len(A.nkey(w[0]).replace(" ", "")) for w in ws)
    total = ws[-1][2] - ws[0][1]
    pause = sum(g for g in gaps if g >= 0.15)
    send = [gaps[i] for i in range(len(gaps)) if re.search(r"[.!?…]$", ws[i][0])]
    comma = [gaps[i] for i in range(len(gaps)) if re.search(r"[,;:—]$", ws[i][0])]
    o = {"harf_sek": letters / max(0.1, total - pause), "umumiy_harf_sek": letters / max(0.1, total), "pauza_ulushi": pause / max(0.1, total),
         "gap_oxiri_pauza": float(np.median(send)) if send else 0.0, "vergul_pauza": float(np.median(comma)) if comma else 0.0, "sozlar": len(ws), "davomiylik": total}
    print(label, json.dumps({k: round(v, 2) for k, v in o.items()}), flush=True)
    for i, w in enumerate(ws):
        k = A.nkey(w[0]).replace(" ", "")
        if k.startswith("yani") or k.startswith("yaani"):
            print(f"  {label} «ya'ni»: so'z {w[2] - w[1]:.2f}s, keyingi pauza {gaps[i] if i < len(gaps) else 0:.2f}s, oldingi pauza {gaps[i - 1] if i else 0:.2f}s", flush=True)
            o["yani_pauza"] = gaps[i] if i < len(gaps) else 0.0
        if re.match(r"(on|bitta|bir|sakkiz|uch|olti|besh)", k) and len(k) <= 9:
            print(f"  {label} son: «{k}» {w[2] - w[1]:.2f}s, keyingi oraliq {gaps[i] if i < len(gaps) else 0:.2f}s", flush=True)
    return o


def synth(m, text, lex, speed, out):
    audio, sr = [], 24000
    for c in T.chunks(T.clean(T.apply_lex(T.cyr2lat(text), lex))):
        wav, sr, _ = m.infer(ref_file="ref.wav", ref_text=REFT, gen_text=c, nfe_step=32, remove_silence=False, speed=speed, seed=1000)
        audio += [np.asarray(wav, dtype=np.float32), np.zeros(int(0.35 * sr), dtype=np.float32)]
    sf.write(out, np.concatenate(audio), sr)


def main():
    global REFT
    k = requests.post(W + "/ub/dkkey", headers=H, json={}, timeout=120).json()["k"]
    from faster_whisper import WhisperModel
    fw = WhisperModel(os.path.join(os.environ.get("DK_CACHE", ".dkcache"), "ct2_islomov_rubaistt_v2_medium"), device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    r = requests.get(W + "/dkx/file", params={"k": k, "m": MSG}, headers=UA, timeout=180)
    r.raise_for_status()
    open("asl.bin", "wb").write(r.content)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "asl.bin", "-ac", "1", "-ar", "24000", "asl.wav"], check=True)
    wr = words(fw, "asl.wav")
    sr_ = stats(wr, "ASL")
    # matn: Word fayldan shu yozuvga to'g'ri keladigan abzats
    r = requests.get(W + "/dkx/file", params={"k": k, "m": DOC}, headers=UA, timeout=180)
    r.raise_for_status()
    open("matn.docx", "wb").write(r.content)
    paras = [p for p in A.docx_text("matn.docx") if FIND.lower() in p.lower()]
    if not paras:
        print("abzats topilmadi", flush=True)
        return
    text = paras[0]
    print("abzats:", len(text), "belgi", flush=True)
    from huggingface_hub import HfApi, hf_hub_download
    from f5_tts.api import F5TTS
    tok = os.environ["HF_TOKEN"]
    api = HfApi(token=tok)
    repo = api.whoami()["name"] + "/inter-diktor"
    fs = [f for f in api.list_repo_files(repo) if f.endswith("/inter_diktor.safetensors")]
    fs.sort(key=lambda f: int(re.sub(r"\D", "", f.split("/")[0]) or 0))
    m = F5TTS(model="F5TTS_v1_Base", ckpt_file=hf_hub_download(repo, fs[-1], token=tok), vocab_file=hf_hub_download("mrmuminov/f5-tts-uzbek", "vocab.txt"), device="cpu")
    print("model:", fs[-1].split("/")[0], flush=True)
    lex = requests.get(W + "/ub/ttslex", headers=H, timeout=30).json() or {}
    ref = requests.get(W + "/ub/ttsref", params={"m": "oddiy"}, headers=H, timeout=60)
    open("ref.wav", "wb").write(ref.content)
    REFT = T.REFS["oddiy"]
    synth(m, text, lex, 0.95, "d1.wav")
    s1 = stats(words(fw, "d1.wav"), "DIKTOR(0.95)")
    spd = 0.95
    if sr_.get("harf_sek") and s1.get("harf_sek"):
        spd = float(np.clip(0.95 * sr_["harf_sek"] / s1["harf_sek"], 0.78, 1.12))
    print(f"moslangan tezlik: {spd:.2f}", flush=True)
    # ASL YOZUVNING O'ZI namuna (uslub manbai) qilib olinadi: model ohang, pauza va so'z ulanishini namunadan oladi — asl o'qishning boshidagi 8–12 soniya
    cut = next((w[2] for w in wr if w[2] >= 8 and re.search(r"[.!?…]$", w[0])), min(12.0, wr[-1][2]))
    cut = min(cut, 14.0)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "asl.wav", "-t", f"{cut + 0.15:.2f}", "ref.wav"], check=True)
    REFT = T.clean(" ".join(w[0] for w in wr if w[2] <= cut + 0.05))
    print(f"asl namuna: {cut:.1f}s", flush=True)
    synth(m, text, lex, spd, "d2.wav")
    stats(words(fw, "d2.wav"), f"DIKTOR(asl namuna, {spd:.2f})")
    for fn, cap in (("d2.wav", f"Namuna — asl o'qishga moslangan (uslub namunasi: sizning shu yozuvingiz, tezlik {spd:.2f})"),):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", fn, "-af", "loudnorm=I=-16:TP=-1.5", "-c:a", "libmp3lame", "-b:a", "160k", "o.mp3"], check=True)
        rr = requests.post(W + "/dkx/send?k=" + k + "&reply=" + str(MSG) + "&name=" + urllib.parse.quote("namuna_moslangan.mp3") + "&cap=" + urllib.parse.quote(cap), data=open("o.mp3", "rb").read(), headers=UA, timeout=180)
        print("yuborildi:", rr.text[:100], flush=True)


main()
