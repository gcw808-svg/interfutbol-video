# INTER DIKTOR — ESKI YOZUVLARNI TOPISH VA BAZAGA QO'SHISH (2026-11-19, Bahtiyor aka: "o'sha audiolarni ham Inter Diktorga tashlab qo'y";
# qaysi suhbatda ekanini eslay olmagani uchun OVOZ bo'yicha aniqlashga ruxsat bergan).
# Shaxsiy suhbatlardagi har bir audio diktor ovozi (kanaldagi Kozim Komilov yozuvlari) bilan solishtiriladi; faqat AYNAN shu ovoz bo'lganlari
# ovozlar kanaliga "#matnsiz" belgisi bilan ko'chiriladi. Matni yo'q — o'zbekcha model eshitib yozadi, pauzalardan bo'laklanadi va o'qitish bazasiga saqlanadi.
# Jurnal OCHIQ: suhbat nomi, xabar matni va eshitilgan gaplar jurnalga chiqarilmaydi — faqat sonlar.
import asyncio, csv, hashlib, json, os, re, subprocess, sys, time, urllib.request, zipfile
import numpy as np

W = "https://inter-futbol-bot.gcw808.workers.dev"
THR = float(os.environ.get("THR", "0.85"))
DRY = os.environ.get("DRY", "") == "1"


def wav16(src, dst, ss=None, t=None):
    c = ["ffmpeg", "-loglevel", "error", "-y"] + (["-ss", str(ss)] if ss is not None else []) + (["-t", str(t)] if t else []) + ["-i", src, "-ac", "1", "-ar", "16000", dst]
    subprocess.run(c, check=True)


def isaud(m):
    f = m.file
    return bool(f and ((f.mime_type or "").startswith("audio/") or m.voice) and not (f.name or "").lower().startswith(("namuna_", "asl_ovoz")))


async def main():
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    from resemblyzer import VoiceEncoder, preprocess_wav
    key = hashlib.sha256(("ub-" + os.environ["BOT_TOKEN"]).encode()).hexdigest()[:40]
    j = json.loads(urllib.request.urlopen(urllib.request.Request(W + "/ub/dksweep", headers={"x-key": key, "user-agent": "dkold"}), timeout=120).read())
    enc = VoiceEncoder("cpu", verbose=False)
    def emb(path, ss, t=30):
        w = path + f"_{int(ss)}.wav"
        wav16(path, w, ss, t)
        x = enc.embed_utterance(preprocess_wav(w))
        os.remove(w)
        return x / (np.linalg.norm(x) + 1e-9)
    c = TelegramClient(StringSession(j["session"]), int(os.environ["TG_API_ID"]), os.environ["TG_API_HASH"])
    await c.connect()
    await c.get_dialogs(limit=300)
    os.makedirs("a", exist_ok=True)
    ch = await c.get_entity(int(j["chat"]))
    chan = [m async for m in c.iter_messages(ch, limit=3000)]
    have = {(m.file.size, int(m.file.duration or 0)) for m in chan if isaud(m)}  # kanalda allaqachon bor yozuvlar (qayta ko'chirmaslik uchun)
    refs = [m for m in chan if isaud(m) and not (m.message or "").lower().startswith("#matnsiz")]
    R = [emb(await c.download_media(m, file=f"a/r{m.id}"), 2) for m in refs[::max(1, len(refs) // 10)][:10]]
    ref = np.mean(R, axis=0)
    ref /= np.linalg.norm(ref)
    picked, n = [], 0
    async for d in c.iter_dialogs(limit=300):
        if not d.is_user or getattr(d.entity, "bot", False):
            continue
        ms = [m async for m in c.iter_messages(d.entity, limit=2000) if isaud(m)]
        if len(ms) < 5:
            continue
        n += 1
        ok = dup = 0
        for m in sorted(ms, key=lambda x: x.id):
            try:
                dur = float(m.file.duration or 0)
                if dur < 4 or (m.file.size or 0) > 150 * 1024 * 1024:
                    continue
                if (m.file.size, int(dur)) in have:
                    dup += 1
                    continue
                p = await c.download_media(m, file=f"a/c{n}_{m.id}")
                pts = [2] if dur < 45 else [2, max(2, dur / 2 - 15), max(2, dur - 40)]
                sims = [float(np.dot(ref, emb(p, ss))) for ss in pts]
                if min(sims) >= THR:
                    ok += 1
                    picked.append((n, m, p, dur))
                    have.add((m.file.size, int(dur)))
                else:
                    os.remove(p)
            except Exception as e:
                print("  o'tkazib yuborildi:", type(e).__name__, flush=True)
        print(f"SUHBAT {n}: {len(ms)} ta audio → diktor ovozi {ok} ta, kanalda bor {dup} ta", flush=True)
    tot = sum(x[3] for x in picked)
    print(f"JAMI: {len(picked)} ta yozuv, {tot / 60:.0f} daqiqa", flush=True)
    if DRY or not picked:
        await c.disconnect()
        return
    # ---- kanalga ko'chirish (asl fayl, manbasi ko'rsatilmaydi)
    for k, (cn, m, p, dur) in enumerate(picked, 1):
        try:
            await c.send_file(ch, m.media, caption="#matnsiz eski yozuv", silent=True)
        except Exception:
            await c.send_file(ch, p, caption="#matnsiz eski yozuv", silent=True)
        await asyncio.sleep(1.2)
    await c.disconnect()
    print("kanalga ko'chirildi:", len(picked), flush=True)
    # ---- eshitish (o'zbekcha model) va bo'laklash
    sys.path.insert(0, ".")
    import dk_align as A
    from faster_whisper import WhisperModel
    root = os.environ.get("DK_CACHE", ".dkcache")
    ct = os.path.join(root, "ct2_islomov_rubaistt_v2_medium")
    if not os.path.exists(os.path.join(ct, "model.bin")):
        A.hear([], "uz")  # modelni tayyorlash yo'li dk_align ichida; bo'sh ro'yxat bilan faqat keshni tekshiradi
        subprocess.run(["ct2-transformers-converter", "--model", "islomov/rubaistt_v2_medium", "--output_dir", ct, "--quantization", "int8", "--force"], check=True, timeout=1800)
        from huggingface_hub import hf_hub_download
        import shutil
        for fn in ("tokenizer.json", "preprocessor_config.json", "vocab.json", "added_tokens.json", "special_tokens_map.json", "normalizer.json", "merges.txt", "tokenizer_config.json"):
            if not os.path.exists(os.path.join(ct, fn)):
                for repo in ("islomov/rubaistt_v2_medium", "openai/whisper-medium"):
                    try:
                        shutil.copy(hf_hub_download(repo, fn), os.path.join(ct, fn))
                        break
                    except Exception:
                        pass
    fw = WhisperModel(ct, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    os.makedirs("seg", exist_ok=True)
    rows, nseg, tsec = [], 0, 0.0
    for k, (cn, m, p, dur) in enumerate(picked, 1):
        w = p + ".wav"
        wav16(p, w)
        raw = np.frombuffer(open(w, "rb").read()[44:], dtype=np.int16).astype(np.float32) / 32768.0
        segs, _ = fw.transcribe(raw, language="uz", beam_size=2, temperature=0.0, condition_on_previous_text=False, word_timestamps=True, vad_filter=True)
        words = [(x.word.strip(), float(x.start), float(x.end)) for sg in segs for x in (sg.words or []) if x.word.strip()]
        # pauzadan bo'lish: 4–14 soniyalik bo'laklar, gap oxirida yoki 0.35 s dan uzun pauzada
        cur = []
        def flush():
            nonlocal cur, nseg, tsec
            if cur and cur[-1][2] - cur[0][1] >= 2.0:
                a, b = max(0.0, cur[0][1] - 0.1), cur[-1][2] + 0.12
                nseg += 1
                fn = f"{nseg:05d}.wav"
                subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", p, "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", os.path.join("seg", fn)], check=True)
                txt = " ".join(x[0] for x in cur)
                rows.append([fn, txt, A.spoken(txt), f"e{cn}_{k:03d}", f"{a:.2f}", f"{b:.2f}", "asr"])
                tsec += b - a
            cur = []
        for i, wd in enumerate(words):
            cur.append(wd)
            d0 = cur[-1][2] - cur[0][1]
            gap = (words[i + 1][1] - wd[2]) if i + 1 < len(words) else 9
            if d0 >= 14 or (d0 >= 4 and (gap >= 0.35 or re.search(r"[.!?…]$", wd[0]))) or gap >= 1.2:
                flush()
        flush()
        print(f"eshitildi {k}/{len(picked)} ({dur:.0f}s) → jami {nseg} bo'lak", flush=True)
    with open("seg/metadata.csv", "w", encoding="utf-8", newline="") as f:
        cw = csv.writer(f, delimiter="|")
        cw.writerow(["fayl", "matn", "oqilishi", "manba_ovoz", "boshi", "oxiri", "moslik"])
        cw.writerows(rows)
    zp = f"eski_{int(time.time())}.zip"
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_STORED) as z:
        for fn in sorted(os.listdir("seg")):
            z.write(os.path.join("seg", fn), fn)
    from huggingface_hub import HfApi
    api = HfApi(token=os.environ["HF_TOKEN"])
    api.upload_file(path_or_fileobj=zp, path_in_repo=f"data/kozim_komilov/{zp}", repo_id=api.whoami()["name"] + "/inter-diktor", commit_message=f"eski yozuvlar: {nseg} bo'lak")
    kk = json.loads(urllib.request.urlopen(urllib.request.Request(W + "/ub/dkkey", data=b"{}", headers={"x-key": key, "content-type": "application/json", "user-agent": "dkold"}), timeout=120).read())["k"]
    txt = f"✅ Eski yozuvlar topildi va bazaga qo'shildi: {len(picked)} ta yozuv (diktor ovozi bo'yicha tanlangan), {nseg} ta bo'lak, {int(tsec // 60)} daqiqa {int(tsec % 60)} soniya. Matni o'zbekcha model bilan eshitib yozildi. Kanalda ular «#matnsiz eski yozuv» belgisi bilan turibdi."
    urllib.request.urlopen(urllib.request.Request(W + "/dkx/say?k=" + kk, data=json.dumps({"text": txt}).encode(), headers={"content-type": "application/json", "user-agent": "dkold"}), timeout=60).read()
    print(f"BAZAGA: {nseg} bo'lak, {tsec / 60:.0f} daqiqa", flush=True)


asyncio.run(main())
