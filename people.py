# ODAMLAR ROBOTI (2026-11-17, Bahtiyor aka: "bazada rasmlar xilma-xilligi juda kam, ko'paytirish yo'lini top va ko'paytir"):
# futbolchi va murabbiylarning ERKIN LITSENZIYALI suratlarini (Wikimedia Commons: CC0, PD, CC BY, CC BY-SA) Wikidata orqali topib,
# "Inter Futbol — Rasmlar" kanaliga muallif va litsenziya bilan fayl qilib tashlaydi va bot bazasiga (KV faces) yozadi.
# Kimligi yuzdan EMAS — Wikidata elementi (P18) va shu odamning Commons turkumidan aniqlanadi. Suratda aniq BITTA yirik odam bo'lishi shart
# (persons.py), kichik (qisqa tomoni 1000 px dan kam) va oq-qora suratlar olinmaydi. Muallif yozuvi bazada "c" maydonida saqlanadi —
# bot shu surat ishlatilgan post matniga "Foto: muallif, litsenziya, Wikimedia Commons" qatorini o'zi qo'shadi (rasmga yozilmaydi).
# Agentlik (Getty, AP va h.k.) suratlari, boshqa saytlardan olingan suratlar YIG'ILMAYDI.
import hashlib, html, io, json, os, re, sys, time
import requests
from PIL import Image
import persons

BOT = os.environ["BOT_TOKEN"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
LIB = -1004498416461
API = f"https://api.telegram.org/bot{BOT}/"
UA = {"user-agent": "InterFutbolBot/1.2 (https://t.me/Inter_Futbol_TV)"}
H = {"x-key": KEY, "user-agent": "InterFutbolPeople", "content-type": "application/json"}
OK_LIC = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?)", re.I)
PER = int(os.environ.get("PER", "2"))        # bir odamga shu ishga tushishda nechta surat
MAXP = int(os.environ.get("MAXP", "4"))      # bazada bir odamda shuncha surat bo'lsa — o'tkazib yuboriladi
LIMIT = int(os.environ.get("LIMIT", "40"))   # bir ishga tushishda jami nechta surat
DRY = os.environ.get("DRY") == "1"

# (kanalda yoziladigan ism, Wikidata qidiruv so'zi, qo'shimcha nomlar)
PEOPLE = [
    ("Erling Haaland", "", ["Haaland", "Håland", "Haland"]), ("Kylian Mbappé", "", ["Mbappé", "Mbappe"]), ("Vinícius Júnior", "Vinícius Júnior", ["Vinícius", "Vinicius Junior", "Vini Jr"]),
    ("Jude Bellingham", "", ["Bellingham"]), ("Lamine Yamal", "", ["Yamal"]), ("Robert Lewandowski", "", ["Lewandowski"]), ("Pedri", "Pedri", []),
    ("Raphinha", "Raphinha", []), ("Mohamed Salah", "", ["Salah"]), ("Virgil van Dijk", "", ["Van Dijk"]), ("Florian Wirtz", "", ["Wirtz"]),
    ("Bukayo Saka", "", ["Saka"]), ("Martin Ødegaard", "", ["Ødegaard", "Odegaard"]), ("Declan Rice", "", []), ("Cole Palmer", "", ["Palmer"]),
    ("Bruno Fernandes", "Bruno Fernandes", []), ("Harry Kane", "", ["Kane"]), ("Jamal Musiala", "", ["Musiala"]), ("Michael Olise", "", ["Olise"]),
    ("Lautaro Martínez", "", ["Lautaro"]), ("Rafael Leão", "", ["Leão"]), ("Kenan Yıldız", "", ["Yıldız"]), ("Ousmane Dembélé", "", ["Dembélé"]),
    ("Achraf Hakimi", "", ["Hakimi"]), ("Khvicha Kvaratskhelia", "", ["Kvaratskhelia"]), ("Antoine Griezmann", "", ["Griezmann"]),
    ("Julián Álvarez", "Julián Álvarez", []), ("Rodri", "Rodri", []), ("Phil Foden", "", ["Foden"]), ("Kevin De Bruyne", "", ["De Bruyne"]),
    ("Neymar", "Neymar", []), ("Luka Modrić", "", ["Modrić", "Modric"]), ("Thibaut Courtois", "", ["Courtois"]), ("Federico Valverde", "", ["Valverde"]),
    ("Cristiano Ronaldo", "", ["Ronaldo"]), ("Lionel Messi", "", ["Messi"]), ("Luis Suárez", "Luis Suárez", []), ("Victor Osimhen", "", ["Osimhen"]),
    ("Alexander Isak", "", ["Isak"]), ("Viktor Gyökeres", "", ["Gyökeres"]), ("Endrick", "Endrick", []), ("Rodrygo", "Rodrygo", []),
    ("Gianluigi Donnarumma", "", ["Donnarumma"]), ("Alisson Becker", "Alisson", ["Alisson"]), ("Son Heung-min", "", ["Son"]),
    ("Pep Guardiola", "", ["Guardiola"]), ("Carlo Ancelotti", "", ["Ancelotti"]), ("Xabi Alonso", "", []), ("Mikel Arteta", "", ["Arteta"]),
    ("Luis Enrique", "Luis Enrique", []), ("Diego Simeone", "", ["Simeone"]), ("Hansi Flick", "Hansi Flick", ["Flick"]), ("Arne Slot", "", ["Slot"]),
    ("Thomas Tuchel", "", ["Tuchel"]), ("Mauricio Pochettino", "", ["Pochettino"]), ("José Mourinho", "", ["Mourinho"]), ("Jürgen Klopp", "", ["Klopp"]),
    ("Zinedine Zidane", "", ["Zidane"]), ("Vincent Kompany", "", ["Kompany"]), ("Massimiliano Allegri", "", ["Allegri"]), ("Antonio Conte", "", ["Conte"]),
    ("Enzo Maresca", "", ["Maresca"]), ("Ruben Amorim", "Ruben Amorim", ["Amorim"]), ("Fabio Cannavaro", "", ["Cannavaro"]),
    ("Didier Deschamps", "", ["Deschamps"]), ("Julian Nagelsmann", "", ["Nagelsmann"]), ("Gareth Bale", "", ["Bale"]),
    ("Abduqodir Husanov", "Abdukodir Khusanov", ["Husanov"]), ("Eldor Shomurodov", "", ["Shomurodov"]), ("Abbosbek Fayzullayev", "Abbosbek Fayzullaev", ["Fayzullayev"]),
    ("Jaloliddin Masharipov", "", ["Masharipov"]), ("Otabek Shukurov", "", ["Shukurov"]), ("Rustam Ashurmatov", "", ["Ashurmatov"]),
    ("Igor Sergeyev", "Igor Sergeev", ["Sergeyev"]), ("Server Djeparov", "", ["Djeparov"]), ("Maksim Shatskix", "Maksim Shatskikh", ["Shatskix"]),
    ("Ignatiy Nesterov", "", ["Nesterov"]), ("Odil Ahmedov", "Odil Ahmedov", ["Ahmedov"]), ("Timur Kapadze", "", ["Kapadze"]),
]


def get(url, params, tries=3):
    for k in range(tries):
        try:
            r = requests.get(url, params=params, headers=UA, timeout=40)
            if r.status_code == 200:
                return r.json()
            time.sleep(4 + 6 * k)
        except Exception:
            time.sleep(3)
    return {}


def qid(term):
    r = get("https://www.wikidata.org/w/api.php", {"format": "json", "action": "wbsearchentities", "search": term, "language": "en", "type": "item", "limit": 7})
    for it in r.get("search", []):
        d = (it.get("description") or "").lower()
        if re.search(r"football|soccer", d) and not re.search(r"women|american football|club|team|stadium|referee", d):
            return it["id"]
    return None


def clean(v):
    return html.unescape(re.sub(r"<[^>]+>", "", v or "")).strip()


def files(q):
    e = get("https://www.wikidata.org/w/api.php", {"format": "json", "action": "wbgetentities", "ids": q, "props": "claims"}).get("entities", {}).get(q, {})
    cl = e.get("claims", {})
    val = lambda p: [c["mainsnak"]["datavalue"]["value"] for c in cl.get(p, []) if c.get("mainsnak", {}).get("datavalue")]
    out = {}
    def add(pages, main=False):
        for pg in pages:
            ii = (pg.get("imageinfo") or [None])[0]
            if not ii or ii.get("mime") != "image/jpeg" or min(ii.get("width", 0), ii.get("height", 0)) < 1000:
                continue
            md = ii.get("extmetadata", {})
            lic = clean((md.get("LicenseShortName") or {}).get("value"))
            if not OK_LIC.search(lic):
                continue
            t = pg["title"]
            if re.search(r"signature|autograph|logo|shirt|jersey|maillot|camiseta|trikot|trophy|statue|mural|graffiti|wax|tussaud|figure|escultura|sculpture|estatua|stamp|cropped|boots|predator|poster|banner|tifo|parade", t, re.I):
                continue
            ym = re.search(r"(19|20)\d\d", clean((md.get("DateTimeOriginal") or {}).get("value")) or "")
            art = re.sub(r"^(User:)", "", clean((md.get("Artist") or {}).get("value")))[:70] or "noma'lum muallif"
            out[t] = {"t": t, "url": ii.get("thumburl") or ii["url"], "lic": lic, "art": art, "y": int(ym.group(0)) if ym else 0, "main": main,
                      "d": clean((md.get("DateTimeOriginal") or {}).get("value"))[:10]}
    ip = {"format": "json", "action": "query", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1920}
    for f in val("P18")[:2]:
        add(get("https://commons.wikimedia.org/w/api.php", {**ip, "titles": "File:" + f}).get("query", {}).get("pages", {}).values(), True)
    for c in val("P373")[:1]:
        cm = lambda title: get("https://commons.wikimedia.org/w/api.php", {**ip, "generator": "categorymembers", "gcmtitle": title, "gcmtype": "file", "gcmlimit": 120}).get("query", {}).get("pages", {}).values()
        add(cm("Category:" + c))
        # ichki turkumlar ("Erling Haaland in 2024" kabi) — eng yangi yillar birinchi, 5 tagacha
        sub = get("https://commons.wikimedia.org/w/api.php", {"format": "json", "action": "query", "list": "categorymembers", "cmtitle": "Category:" + c, "cmtype": "subcat", "cmlimit": 60}).get("query", {}).get("categorymembers", [])
        yr = lambda t: max([int(x) for x in re.findall(r"(?:19|20)\d\d", t)] or [0])
        for sc in sorted([x["title"] for x in sub if not re.search(r"signature|autograph|shirt|jersey|statue|mural|family|wife|videos|audio", x["title"], re.I)], key=lambda t: -yr(t))[:5]:
            add(cm(sc)); time.sleep(0.3)
    return sorted(out.values(), key=lambda x: (not x["main"], -x["y"]))


def gray(im):
    sm = im.resize((48, 48)).convert("RGB")
    return sum(max(p) - min(p) for p in sm.getdata()) / (48 * 48) < 9


def delete():
    # tekshiruvdan o'tmagan suratlarni bazadan va rasmlar kanalidan olib tashlash: DEL = JSON [{"name":..., "uid":..., "m": xabar raqami}]
    for it in json.loads(os.environ["DEL"]):
        r = requests.post(W + "/ub/facedel", headers=H, data=json.dumps({"name": it["name"], "uid": it["uid"]}), timeout=30).text[:60]
        d = requests.post(API + "deleteMessage", data={"chat_id": LIB, "message_id": it["m"]}, timeout=30).json().get("ok")
        print("x", it["name"], it["m"], r, "kanal:", d); time.sleep(0.6)


def main():
    if os.environ.get("DEL"):
        return delete()
    have = requests.get(W + "/ub/faces", headers=H, timeout=30).json()
    pn = lambda x: re.sub(r"[^a-z0-9]+", " ", __import__("unicodedata").normalize("NFD", x.lower().replace("ş", "sh").replace("ç", "ch")).encode("ascii", "ignore").decode()).strip()
    only = [x.strip().lower() for x in os.environ.get("ONLY", "").split(",") if x.strip()]
    extra = [(x.strip(), "", []) for x in os.environ.get("ADD", "").split(",") if x.strip()]
    items, total = [], 0
    for name, term, al in extra + PEOPLE:
        if total >= LIMIT:
            break
        if only and name.lower() not in only:
            continue
        cur = len((have.get(pn(name)) or {}).get("ph", []))
        if cur >= MAXP:
            print("=", name, "bazada", cur, "ta — yetarli"); continue
        try:
            q = qid(term or name)
            if not q:
                print("-", name, "Wikidata topilmadi"); continue
            # KIMLIGI ANIQ BO'LISHI SHART: fayl nomida shu odamning familiyasi (yoki ismi) bo'lishi kerak yoki u Wikidata'dagi asosiy surat (P18) —
            # turkumda boshqa odam nomi bilan atalgan suratlar ham uchraydi (sinovda Pochettino turkumidan "Jenny Taft ..." chiqqan)
            keys = [w for w in pn(term or name).split() + pn(name).split() if len(w) >= 4] or pn(name).split()
            keys = keys[-1:] + keys[:1] + [pn(a) for a in al if len(pn(a)) >= 4]
            raw = files(q)
            cand = [c for c in raw if c["main"] or any(k in pn(c["t"]) for k in keys)]
            print(" ", name, q, "nomzodlar:", len(raw), "→ ismi bor:", len(cand))
            got, days = 0, set()
            for c in cand[:14]:
                if got >= min(PER, MAXP - cur) or total >= LIMIT:
                    break
                if c["d"] and c["d"] in days:
                    continue
                if not c["main"] and 0 < c["y"] < 2016:
                    continue  # eskirgan surat (hozirgi murabbiy futbolchilik davrida va h.k.) — yangilikka mos emas
                if re.search(r"\b(and|with|vs|und|et|y)\b|,| -\d", re.sub(r"\b(v|vs)\b[^-]*$", "", c["t"]).replace("File:", "")) and not c["main"] and len(re.findall(r"[A-ZÀ-Ý][a-zà-ÿ]+ [A-ZÀ-Ý][a-zà-ÿ]+", c["t"])) > 1 + sum(1 for k in keys if k in pn(c["t"])):
                    continue  # fayl nomida boshqa odam ham bor (ikki futbolchi kurashi) — kim asosiy ekanini aniqlab bo'lmaydi
                try:
                    im = Image.open(io.BytesIO(requests.get(c["url"], headers=UA, timeout=90).content)).convert("RGB")
                except Exception:
                    continue
                if min(im.size) < 900 or gray(im):
                    continue
                box, n, ex = persons.analyse(im)
                if not box or n != 1 or (box[3] - box[1]) < 0.5 or (box[2] - box[0]) < 0.16 or (box[2] - box[0]) * (box[3] - box[1]) < 0.12:
                    continue
                credit = f"Foto: {c['art']}, {c['lic']}"
                print("+", name, "|", c["t"], c["y"], f"{im.width}x{im.height}", "|", credit)
                got += 1; total += 1; days.add(c["d"])
                if DRY:
                    continue
                buf = io.BytesIO(); im.save(buf, "JPEG", quality=93, subsampling=0)
                r = requests.post(API + "sendDocument", data={"chat_id": LIB, "caption": f"{name}\n{credit} (Wikimedia Commons)"[:1000], "disable_notification": True, "disable_content_type_detection": True},
                                  files={"document": ("".join(ch if ch.isalnum() else "_" for ch in name)[:40] + ".jpg", buf.getvalue(), "image/jpeg")}, timeout=180).json()
                if not r.get("ok"):
                    print("  yuborilmadi", r.get("description")); got -= 1; total -= 1; time.sleep(5); continue
                d = r["result"]["document"]
                items.append({"name": name, "al": al, "f": d["file_id"], "uid": d["file_unique_id"], "w": im.width, "h": im.height, "m": r["result"]["message_id"], "b": box, "x": ex, "c": credit})
                time.sleep(3.2)
            if not got:
                print("-", name, "mos surat yo'q (nomzodlar:", len(cand), ")")
        except Exception as ex_:
            print("-", name, "xato", str(ex_)[:120])
        time.sleep(0.4)
    if items:
        print("baza:", requests.post(W + "/ub/faceaddm", headers=H, data=json.dumps({"items": items}), timeout=60).text[:120])
    print("ITEMS", json.dumps([{k: it[k] for k in ("name", "f", "uid", "m")} for it in items]))
    print("qo'shildi:", len(items))


if __name__ == "__main__":
    main()
