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


pn = lambda x: re.sub(r"[^a-z0-9]+", " ", __import__("unicodedata").normalize("NFD", x.lower().replace("ş", "sh").replace("ç", "ch")).encode("ascii", "ignore").decode()).strip()

# 2-bosqich (2026-11-17): bizning klublar tarkibidagi boshqa futbolchilar
PEOPLE += [(n, "", [n.split()[-1]] if len(n.split()) > 1 and len(n.split()[-1]) >= 5 else []) for n in """Aurélien Tchouaméni|Eduardo Camavinga|Éder Militão|Antonio Rüdiger|Dani Carvajal|Arda Güler|Trent Alexander-Arnold|Dean Huijsen|Gavi|Frenkie de Jong|Jules Koundé|Pau Cubarsí|Alejandro Balde|Dani Olmo|Fermín López|Ferran Torres|Marcus Rashford|Bernardo Silva|Rúben Dias|Joško Gvardiol|Omar Marmoush|Jérémy Doku|Tijjani Reijnders|Rayan Cherki|Dominik Szoboszlai|Alexis Mac Allister|Cody Gakpo|Hugo Ekitike|Ibrahima Konaté|Jeremie Frimpong|William Saliba|Gabriel Magalhães|Kai Havertz|Gabriel Martinelli|Leandro Trossard|David Raya|Martín Zubimendi|Eberechi Eze|Enzo Fernández|Moisés Caicedo|Reece James|Marc Cucurella|Pedro Neto|Bryan Mbeumo|Matheus Cunha|Benjamin Šeško|Kobbie Mainoo|Harry Maguire|Matthijs de Ligt|Amad Diallo|Jan Oblak|Koke|Alexander Sørloth|Nicolò Barella|Alessandro Bastoni|Marcus Thuram|Hakan Çalhanoğlu|Federico Dimarco|Yann Sommer|Denzel Dumfries|Mike Maignan|Christian Pulisic|Adrien Rabiot|Fikayo Tomori|Dušan Vlahović|Gleison Bremer|Manuel Locatelli|Francisco Conceição|Jonathan David|Manuel Neuer|Joshua Kimmich|Alphonso Davies|Dayot Upamecano|Luis Díaz|Serge Gnabry|Leon Goretzka|Serhou Guirassy|Gregor Kobel|Karim Adeyemi|Julian Brandt|Nico Schlotterbeck|Vitinha|João Neves|Marquinhos|Désiré Doué|Bradley Barcola|Nuno Mendes|Warren Zaïre-Emery|Lucas Chevalier|Niclas Füllkrug|Patrik Schick|Senne Lammens|Sergio Busquets|Jordi Alba|Rodrigo De Paul|Sadio Mané|Marcelo Brozović|João Félix|Karim Benzema|Toni Kroos|Thomas Müller|Sergio Ramos|Zlatan Ibrahimović|Erik ten Hag|Xavi Hernández|Simone Inzaghi|Roberto Mancini|Unai Emery|Eddie Howe|Ange Postecoglou|Oliver Glasner|Andoni Iraola|Marcelo Bielsa|Lionel Scaloni|Roberto De Zerbi|Luciano Spalletti|Gennaro Gattuso|Roberto Martínez|Ronald Koeman|Luis de la Fuente|Srečko Katanec""".split("|")]
# afsonalar (tarixiy faktlar uchun) — eski suratlar ham olinadi
LEGENDS = """Diego Maradona|Ronaldinho|Ronaldo Nazário|David Beckham|Thierry Henry|Andrés Iniesta|Gianluigi Buffon|Paolo Maldini|Francesco Totti|Andrea Pirlo|Kaká|Wayne Rooney|Steven Gerrard|Frank Lampard|Carles Puyol|Iker Casillas|Bastian Schweinsteiger|Arjen Robben|Franck Ribéry|Robin van Persie|Dennis Bergkamp|Eric Cantona|Ryan Giggs|Paul Scholes|Alex Ferguson|Arsène Wenger|Roberto Baggio|Alessandro Del Piero|Javier Zanetti|Raúl González|Luís Figo|Roberto Carlos|Cafu|Rivaldo|Samuel Eto'o|Didier Drogba|Fernando Torres|David Villa|Xabi Alonso|Philipp Lahm|Miroslav Klose|Oliver Kahn|Michael Ballack|Andriy Shevchenko|Pavel Nedvěd|Clarence Seedorf|Patrick Vieira|Petr Čech|John Terry|Rio Ferdinand|Michael Owen|Alan Shearer|Gary Lineker|Fabio Capello|Marcello Lippi|Vicente del Bosque|Louis van Gaal|Guus Hiddink|Rafael Benítez|Claudio Ranieri|Zinedine Zidane""".split("|")
PEOPLE += [(n, "", [n.split()[-1]] if len(n.split()) > 1 and len(n.split()[-1]) >= 5 else []) for n in LEGENDS if n not in [p[0] for p in PEOPLE]]


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


def files(q, names=()):
    e = get("https://www.wikidata.org/w/api.php", {"format": "json", "action": "wbgetentities", "ids": q, "props": "claims"}).get("entities", {}).get(q, {})
    cl = e.get("claims", {})
    val = lambda p: [c["mainsnak"]["datavalue"]["value"] for c in cl.get(p, []) if c.get("mainsnak", {}).get("datavalue")]
    out = {}
    def add(pages, main=False, need=None):
        for pg in pages:
            ii = (pg.get("imageinfo") or [None])[0]
            if not ii or ii.get("mime") != "image/jpeg" or min(ii.get("width", 0), ii.get("height", 0)) < 900:
                continue
            if need is not None:  # qidiruv natijasi: fayl shu odamning Commons turkumida (yoki nomi bor ichki turkumda) turishi shart
                cats = " | ".join(pn(c_["title"].replace("Category:", "")) for c_ in pg.get("categories", []))
                # turkum nomi AYNAN shu odamniki bo'lishi kerak ("Luis Enrique Mejía Godoy", "Igor Sergeev (voice actor)" — boshqa odamlar, 2026-11-17 sabog'i)
                ok_ = lambda c_: any(n_ and re.fullmatch(re.escape(n_) + r"( (in|by|at|with|during|as|playing|training|portraits?|\d{4}).*)?", c_) for n_ in need)
                if not any(ok_(c_) for c_ in cats.split(" | ")):
                    continue
            md = ii.get("extmetadata", {})
            lic = clean((md.get("LicenseShortName") or {}).get("value"))
            if not OK_LIC.search(lic):
                continue
            t = pg["title"]
            if re.search(r"signature|autograph|logo|shirt|jersey|maillot|camiseta|trikot|trophy|statue|mural|graffiti|wax|tussaud|figure|escultura|sculpture|estatua|eterno|painting|puppet|firma| fils |golf|stamp|cropped|boots|predator|poster|banner|tifo|parade", t, re.I):
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
        subs = sorted([x["title"] for x in sub if not re.search(r"signature|autograph|shirt|jersey|statue|mural|family|wife|videos|audio", x["title"], re.I)], key=lambda t: -yr(t))[:6]
        for sc in subs:
            add(cm(sc)); time.sleep(0.25)
        # ikkinchi daraja ("... by year" → "... in 2025"): eng yangi 4 ta
        deep = []
        for sc in subs[:3]:
            deep += [x["title"] for x in get("https://commons.wikimedia.org/w/api.php", {"format": "json", "action": "query", "list": "categorymembers", "cmtitle": sc, "cmtype": "subcat", "cmlimit": 40}).get("query", {}).get("categorymembers", [])]
        for sc in sorted(set(deep), key=lambda t: -yr(t))[:4]:
            add(cm(sc)); time.sleep(0.25)
    # FAYL NOMI BO'YICHA QIDIRUV (2026-11-17, ikkinchi bosqich): turkumda nomsiz yotgan suratlardan tashqari Commons'ning o'zida ism bo'yicha qidiriladi;
    # natija faqat shu odamning turkumiga (yoki nomi bor turkumga) tegishli bo'lsa olinadi — bir xil ismli boshqa odam aralashmasin
    need = [pn(c) for c in val("P373")[:1]] + [pn(x) for x in names if len(pn(x).split()) >= 2 or len(pn(x)) >= 6]
    for nm in names[:2]:
        add(get("https://commons.wikimedia.org/w/api.php", {**ip, "prop": "imageinfo|categories", "cllimit": 500, "generator": "search", "gsrsearch": '"' + nm + '"', "gsrnamespace": 6, "gsrlimit": 40}).get("query", {}).get("pages", {}).values(), False, need)
        time.sleep(0.25)
    return sorted(out.values(), key=lambda x: (not x["main"], -x["y"]))


def other(title, keys):
    # fayl nomida ikkinchi odam: "A and B", "A 10, B 11" yoki o'yin surati "Ism Familiya Boshqa Odam Davlat v Davlat"
    t = re.sub(r"^File:|\.jpe?g$", "", title, flags=re.I)
    if re.search(r"\b(and|und|et)\b|&|,", t):
        return True
    m = re.search(r"^(.*?)\s+\S+\s+vs?\.?\s+\S", t, re.I)
    if not m:
        return False
    kw = set(w for k in keys for w in k.split())
    rest = [w for w in pn(m.group(1)).split() if w not in kw and not w.isdigit()]
    return len(rest) >= 2


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
    if os.environ.get("REG"):  # kanalga tushgan, lekin bazaga yozilmay qolgan suratlarni ro'yxatga olish: REG = JSON (faceaddm items)
        print("baza:", requests.post(W + "/ub/faceaddm", headers=H, data=json.dumps({"items": json.loads(os.environ["REG"])}), timeout=60).text[:120])
    if os.environ.get("DEL"):
        return delete()
    if os.environ.get("REG"):
        return
    have = requests.get(W + "/ub/faces", headers=H, timeout=30).json()
    seen = set(x.strip() for x in open("people_seen.txt", encoding="utf-8").read().split("\n") if x.strip()) if os.path.exists("people_seen.txt") else set()
    seen |= {p.get("wt") for P in have.values() for p in P.get("ph", []) if p.get("wt")}
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
            raw = [c for c in files(q, [x for x in dict.fromkeys([name, term or name])]) if c["t"] not in seen]
            cand = [c for c in raw if c["main"] or any(k in pn(c["t"]) for k in keys)]
            print(" ", name, q, "nomzodlar:", len(raw), "→ ismi bor:", len(cand))
            got, days = 0, set()
            for c in cand[:18]:
                if got >= min(PER, MAXP - cur) or total >= LIMIT:
                    break
                if c["d"] and c["d"] in days:
                    continue
                if not c["main"] and 0 < c["y"] < 2016 and name not in LEGENDS:
                    continue  # eskirgan surat (hozirgi murabbiy futbolchilik davrida va h.k.) — yangilikka mos emas
                if not c["main"] and other(c["t"], keys):
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
                items.append({"name": name, "al": al, "f": d["file_id"], "uid": d["file_unique_id"], "w": im.width, "h": im.height, "m": r["result"]["message_id"], "b": box, "x": ex, "c": credit, "wt": c["t"]})
                time.sleep(3.2)
            if not got:
                print("-", name, "mos surat yo'q (nomzodlar:", len(cand), ")")
        except Exception as ex_:
            print("-", name, "xato", str(ex_)[:120])
        time.sleep(0.4)
    for k in range(0, len(items), 150):  # worker bir so'rovda 200 tagacha oladi
        print("baza:", requests.post(W + "/ub/faceaddm", headers=H, data=json.dumps({"items": items[k:k + 150]}), timeout=60).text[:120])
    print("ITEMS", json.dumps([{k: it[k] for k in ("name", "f", "uid", "m", "wt")} for it in items]))
    print("qo'shildi:", len(items))


if __name__ == "__main__":
    main()
