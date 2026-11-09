# STADION ROBOTI (2026-11-10): bizning klublar uchun uy stadionining ERKIN LITSENZIYALI suratini (Wikimedia Commons: CC0, PD, CC BY, CC BY-SA)
# topib, "Inter Futbol — Rasmlar" kanaliga muallif va litsenziya bilan tashlaydi va bot bazasiga (KV stadiums) yozadi.
# Faqat stadionlar — odamlarning suratlari yig'ilmaydi.
import hashlib, html, json, os, re, sys, time
import requests

BOT = os.environ["BOT_TOKEN"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
LIB = -1004498416461
API = f"https://api.telegram.org/bot{BOT}/"
UA = {"user-agent": "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)"}
H = {"x-key": KEY, "user-agent": "InterFutbolStadium"}
LIMIT = int(os.environ.get("LIMIT", "15"))
OK_LIC = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?)", re.I)


def clubs():
    src = open("worker/worker.js", encoding="utf-8").read()
    m = re.search(r"const CLUB_EMOJI = (\[.*?\]\]\]);", src, re.S)
    arr = json.loads(m.group(1))
    lg = re.compile(r"league|liga\b|ligasi|\blig\b|bundesliga|serie a|ligue|\bmls\b|eredivisie|\bcup\b|kubog|chempionat|primeira|pro league|s[uü]per lig|conference|terma", re.I)
    out = [names[0] for _id, _em, names in arr[8:] if not any(lg.search(x) for x in names)]
    return out


def wd(params):
    params = {"format": "json", **params}
    return requests.get("https://www.wikidata.org/w/api.php", params=params, headers=UA, timeout=40).json()


def club_qid(name):
    r = wd({"action": "wbsearchentities", "search": name, "language": "en", "type": "item", "limit": 7})
    for it in r.get("search", []):
        d = (it.get("description") or "").lower()
        if re.search(r"(association )?football club|soccer (club|team)|football team", d) and "women" not in d and "national" not in d:
            return it["id"]
    return None


def claim(ent, p):
    # hozirgi qiymat: "preferred" darajali yoki tugash sanasi (P582) yo'q bo'lgani; eski (tarixiy) stadionlar tanlanmaydi
    cs = [c for c in ent.get("claims", {}).get(p, []) if c.get("mainsnak", {}).get("datavalue")]
    cs = [c for c in cs if c.get("rank") != "deprecated"]
    pref = [c for c in cs if c.get("rank") == "preferred"]
    cur = [c for c in cs if "P582" not in c.get("qualifiers", {})]
    for c in (pref or cur or cs[-1:]):
        return c["mainsnak"]["datavalue"]["value"]
    return None


def commons(fname):
    r = requests.get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "format": "json", "titles": "File:" + fname, "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1280}, headers=UA, timeout=40).json()
    page = next(iter(r["query"]["pages"].values()))
    ii = (page.get("imageinfo") or [None])[0]
    if not ii:
        return None
    md = ii.get("extmetadata", {})
    lic = html.unescape(re.sub(r"<[^>]+>", "", (md.get("LicenseShortName") or {}).get("value", ""))).strip()
    art = html.unescape(re.sub(r"<[^>]+>", "", (md.get("Artist") or {}).get("value", ""))).strip()[:80]
    if not OK_LIC.search(lic):
        return None
    return {"url": ii.get("thumburl") or ii["url"], "lic": lic, "art": art or "noma'lum muallif", "page": ii.get("descriptionurl", "")}


def main():
    have = requests.get(W + "/ub/stadiums", headers=H, timeout=30).json()
    redo = [x.strip() for x in os.environ.get("REDO", "").split(",") if x.strip()]
    todo = redo + [c for c in clubs() if c not in have and c not in redo]
    print("klublar:", len(todo), "yangi; bazada:", len(have))
    added = 0
    for club in todo:
        if added >= LIMIT:
            break
        try:
            q = club_qid(club)
            if not q:
                print("-", club, "Wikidata topilmadi"); continue
            e = wd({"action": "wbgetentities", "ids": q, "props": "claims"})["entities"][q]
            cs = [c for c in e.get("claims", {}).get("P115", []) if c.get("mainsnak", {}).get("datavalue") and c.get("rank") != "deprecated"]
            cur = [c for c in cs if c.get("rank") == "preferred"] or [c for c in cs if "P582" not in c.get("qualifiers", {})] or cs[-1:]
            ids = [c["mainsnak"]["datavalue"]["value"]["id"] for c in cur]
            if not ids:
                print("-", club, "stadion yo'q"); continue
            vq = ids[0]
            if len(ids) > 1:  # bir nechta "hozirgi" stadion — eng sig'imlisi (P1083) tanlanadi (eski kichik stadionlar emas)
                ents = wd({"action": "wbgetentities", "ids": "|".join(ids[:10]), "props": "claims"})["entities"]
                cap = lambda q: float(((claim(ents.get(q, {}), "P1083") or {}).get("amount") or "0").lstrip("+") or 0)
                vq = max(ids[:10], key=cap)
            ve = wd({"action": "wbgetentities", "ids": vq, "props": "claims|labels", "languages": "en"})["entities"][vq]
            img = claim(ve, "P18")
            sname = (ve.get("labels", {}).get("en") or {}).get("value", "")
            if not img:
                print("-", club, sname, "surati yo'q"); continue
            c = commons(img)
            if not c:
                print("-", club, sname, "litsenziya mos emas"); continue
            data = requests.get(c["url"], headers=UA, timeout=60).content
            cap = f"🏟 {sname} — {club}\nFoto: {c['art']}, {c['lic']} (Wikimedia Commons)"
            r = requests.post(API + "sendPhoto", data={"chat_id": LIB, "caption": cap[:1000], "disable_notification": True}, files={"photo": ("s.jpg", data, "image/jpeg")}, timeout=120).json()
            if not r.get("ok"):
                print("-", club, "yuborilmadi", r.get("description")); continue
            fid = r["result"]["photo"][-1]["file_id"]
            requests.post(W + "/ub/stadium", headers={**H, "content-type": "application/json"}, data=json.dumps({"club": club, "s": sname, "f": fid, "c": f"Foto: {c['art']}, {c['lic']}"}), timeout=30)
            added += 1
            print("+", club, "—", sname, "|", c["lic"])
            time.sleep(3)
        except Exception as ex:
            print("-", club, "xato", str(ex)[:120])
    print("qo'shildi:", added)


if __name__ == "__main__":
    main()
