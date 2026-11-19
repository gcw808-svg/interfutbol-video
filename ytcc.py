# YOUTUBE CC SINOVI (2026-11-19, Bahtiyor aka: "YouTube'ning o'zi ruxsat bergan videolar bor — ulardan foydalanish mumkin").
# Faqat SINOV: YouTube qidiruvining "Creative Commons" filtri bilan futbol videolari topiladimi, litsenziya belgisi o'qiladimi
# va GitHub serveridan bitta videoni yuklab olish ishlaydimi. Arxivga HECH NARSA qo'shilmaydi.
import os, sys, urllib.parse
import yt_dlp

QUERIES = (os.environ.get("Q") or "football match highlights|soccer goals|football stadium fans").split("|")
CC = "&sp=EgIwAQ%253D%253D"  # YouTube qidiruv filtri: Creative Commons


def note(kind, msg):
    print("::%s::%s" % (kind, msg.replace("\n", " ")[:900]))


def main():
    flat = yt_dlp.YoutubeDL({"quiet": True, "extract_flat": True, "playlistend": 12, "skip_download": True})
    full = yt_dlp.YoutubeDL({"quiet": True, "skip_download": True, "noplaylist": True})
    ids, serr = [], ""
    for q in QUERIES:
        try:
            r = flat.extract_info("https://www.youtube.com/results?search_query=" + urllib.parse.quote(q) + CC, download=False)
            for e in (r.get("entries") or [])[:12]:
                if e and e.get("id") and e["id"] not in ids:
                    ids.append(e["id"])
        except Exception as e:
            serr = str(e)[:200]
    print("qidiruvdan:", len(ids), "ta video", serr)
    cc, notcc, ierr, cands, rows = 0, 0, "", [], []
    for vid in ids[:18]:
        try:
            i = full.extract_info("https://www.youtube.com/watch?v=" + vid, download=False)
        except Exception as e:
            ierr = str(e)[:220]; continue
        lic = str(i.get("license") or "")
        ok = "creative commons" in lic.lower()
        cc += ok; notcc += (not ok)
        row = "%s | %s | %ss | %s | obunachi %s | %s" % (vid, "CC" if ok else "CC EMAS", i.get("duration"), (i.get("channel") or "")[:30], i.get("channel_follower_count"), (i.get("title") or "")[:60])
        print(" ", row); rows.append(row)
        if ok and 8 <= (i.get("duration") or 0) <= 240:
            cands.append(vid)
    note("notice", "YouTube CC sinovi — qidiruv: %d ta video%s; ma'lumoti o'qildi: CC %d, CC emas %d%s" % (len(ids), (" (xato: " + serr + ")") if serr else "", cc, notcc, (" | o'qish xatosi: " + ierr) if ierr else ""))
    if rows:
        note("notice", "Namunalar: " + " || ".join(rows[:5]))
    if not cands:
        note("warning", "Yuklab olish sinalmadi: mos (CC, 8–240 soniya) video topilmadi"); return
    derr = ""
    for vid in cands[:3]:
        try:
            yt_dlp.YoutubeDL({"quiet": True, "format": "b[ext=mp4][height<=720]/b[height<=720]/b", "outtmpl": "/tmp/yt_%(id)s.%(ext)s", "noplaylist": True}).download(["https://www.youtube.com/watch?v=" + vid])
            f = [x for x in os.listdir("/tmp") if x.startswith("yt_" + vid)]
            if f:
                note("notice", "Yuklab olish ISHLADI: %s, %.1f MB" % (vid, os.path.getsize("/tmp/" + f[0]) / 1048576)); return
        except Exception as e:
            derr = str(e)[:300]
    note("warning", "Yuklab olish ISHLAMADI: " + derr)


main()
