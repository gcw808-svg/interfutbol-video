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

_LOG = []
_print = print


def print(*a, **k):  # jurnal Modal'da ishlaganda /ub/plog ga yuboriladi
    _LOG.append(" ".join(str(x) for x in a)); _print(*a, **k)

BOT = os.environ["BOT_TOKEN"]
W = "https://inter-futbol-bot.gcw808.workers.dev"
KEY = hashlib.sha256(("ub-" + BOT).encode()).hexdigest()[:40]
LIB = -1004498416461
# ARXIV (2026-11-19, Bahtiyor aka: "rasmlar sonini cheklash noo'rin, qancha ko'p bo'lsa shuncha yaxshi — kelgusida generatsiya dasturiga g'oya bo'ladi"):
# yopiq kanal "Inter Futbol — Arxiv". Post bazasiga (LIB) faqat saralangan, chegarali suratlar tushadi; post bazasiga yaramagan (bir necha odam, o'yin lahzasi,
# kichik odam, eski forma, fayl nomida ismi yo'q) yoki chegaradan ortgan HAR BIR erkin litsenziyali surat shu arxivga CHEGARASIZ tashlanadi.
# Bot arxivdan postga surat OLMAYDI (KV faces ga yozilmaydi), shuning uchun u yerda qattiq tekshiruv shart emas. Izohda: ism, #heshteg, manba fayl, muallif, litsenziya.
ARCH = -1004396320401
ARCH_LIMIT = int(os.environ.get("ARCH_LIMIT") or "0")   # bir ishga tushishda arxivga nechta surat (0 — arxiv o'chiq)
ARCH_PER = int(os.environ.get("ARCH_PER") or "12")      # bir odamdan bir ishga tushishda nechta
API = f"https://api.telegram.org/bot{BOT}/"
UA = {"user-agent": "InterFutbolBot/1.2 (https://t.me/Inter_Futbol_TV)"}
H = {"x-key": KEY, "user-agent": "InterFutbolPeople", "content-type": "application/json"}
OK_LIC = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?)", re.I)
PER = int(os.environ.get("PER") or "2")        # bir odamga shu ishga tushishda nechta surat
MAXP = int(os.environ.get("MAXP") or "4")      # bazada bir odamda shuncha surat bo'lsa — o'tkazib yuboriladi
LIMIT = int(os.environ.get("LIMIT") or "40")   # bir ishga tushishda jami nechta surat
DRY = os.environ.get("DRY") == "1"
# AVTOMATIK REJIM (2026-11-19, Bahtiyor aka: "bazani tinimsiz, bitta manbaga tayanmasdan, bir necha manbadan yangilab tur"): people.yml har kuni jadval bilan
# ishga tushadi; ro'yxat har kuni boshqa joydan boshlanadi (aylanma navbat), shuning uchun bir necha kunda hamma odam qayta ko'riladi va manbalarda
# paydo bo'lgan YANGI suratlar o'zi qo'shiladi. Manbalar: 1) Wikidata P18, 2) odamning Commons turkumi, 3) Commons qidiruvi, 4) Commons "depicts" (P180),
# 5) Vikipediyaning 7 tildagi maqolasidagi asosiy surat, 6) Openverse/Flickr (faqat CC BY / CC BY-SA / CC0 / PD; sinovda futbolchilar uchun deyarli
# hech narsa bermadi — suratlar kichik va kam, shuning uchun people.yml'da standart holatda O'CHIQ: SRC_OFF=openverse). Agentlik va yangilik saytlari suratlari baribir OLINMAYDI.
AUTO = os.environ.get("AUTO") == "1"
STEP = int(os.environ.get("STEP") or "110")  # avtomatik rejimda navbat har kuni shuncha odamga suriladi
SRC_OFF = set(x.strip() for x in (os.environ.get("SRC_OFF") or "").split(",") if x.strip())  # manbani o'chirish: depicts, openverse
BAD_T = r"signature|autograph|logo|shirt|jersey|maillot|camiseta|trikot|trophy|statue|mural|graffiti|wax|tussaud|figure|escultura|sculpture|estatua|eterno|painting|puppet|firma| fils |golf|stamp|cropped|boots|predator|poster|banner|tifo|parade|drawing|caricature|cartoon|fan ?art|ai[- ]generated|lookalike|cosplay|toy|lego|sticker|card|wallpaper|edit"

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


# ENG KO'P POST CHIQADIGAN ODAMLAR (yulduzlar, top klub murabbiylari, o'zbek futbolchilari — yuqoridagi birinchi ro'yxat): bazada 20 tagacha surat
# (2026-11-19, Bahtiyor aka: "8 ta kam emasmi") — ular haftasiga bir necha marta postga chiqadi, 8 ta surat tez takrorlanadi; qolganlarga MAXP (8) yetarli.
TOP = {p[0] for p in PEOPLE}
MAXP_TOP = max(MAXP, int(os.environ.get("MAXP_TOP") or "20"))
pn = lambda x: re.sub(r"[^a-z0-9]+", " ", __import__("unicodedata").normalize("NFD", x.lower().replace("ş", "sh").replace("ç", "ch")).encode("ascii", "ignore").decode()).strip()

# 2-bosqich (2026-11-17): bizning klublar tarkibidagi boshqa futbolchilar
PEOPLE += [(n, "", [n.split()[-1]] if len(n.split()) > 1 and len(n.split()[-1]) >= 5 else []) for n in """Aurélien Tchouaméni|Eduardo Camavinga|Éder Militão|Antonio Rüdiger|Dani Carvajal|Arda Güler|Trent Alexander-Arnold|Dean Huijsen|Gavi|Frenkie de Jong|Jules Koundé|Pau Cubarsí|Alejandro Balde|Dani Olmo|Fermín López|Ferran Torres|Marcus Rashford|Bernardo Silva|Rúben Dias|Joško Gvardiol|Omar Marmoush|Jérémy Doku|Tijjani Reijnders|Rayan Cherki|Dominik Szoboszlai|Alexis Mac Allister|Cody Gakpo|Hugo Ekitike|Ibrahima Konaté|Jeremie Frimpong|William Saliba|Gabriel Magalhães|Kai Havertz|Gabriel Martinelli|Leandro Trossard|David Raya|Martín Zubimendi|Eberechi Eze|Enzo Fernández|Moisés Caicedo|Reece James|Marc Cucurella|Pedro Neto|Bryan Mbeumo|Matheus Cunha|Benjamin Šeško|Kobbie Mainoo|Harry Maguire|Matthijs de Ligt|Amad Diallo|Jan Oblak|Koke|Alexander Sørloth|Nicolò Barella|Alessandro Bastoni|Marcus Thuram|Hakan Çalhanoğlu|Federico Dimarco|Yann Sommer|Denzel Dumfries|Mike Maignan|Christian Pulisic|Adrien Rabiot|Fikayo Tomori|Dušan Vlahović|Gleison Bremer|Manuel Locatelli|Francisco Conceição|Jonathan David|Manuel Neuer|Joshua Kimmich|Alphonso Davies|Dayot Upamecano|Luis Díaz|Serge Gnabry|Leon Goretzka|Serhou Guirassy|Gregor Kobel|Karim Adeyemi|Julian Brandt|Nico Schlotterbeck|Vitinha|João Neves|Marquinhos|Désiré Doué|Bradley Barcola|Nuno Mendes|Warren Zaïre-Emery|Lucas Chevalier|Niclas Füllkrug|Patrik Schick|Senne Lammens|Sergio Busquets|Jordi Alba|Rodrigo De Paul|Sadio Mané|Marcelo Brozović|João Félix|Karim Benzema|Toni Kroos|Thomas Müller|Sergio Ramos|Zlatan Ibrahimović|Erik ten Hag|Xavi Hernández|Simone Inzaghi|Roberto Mancini|Unai Emery|Eddie Howe|Ange Postecoglou|Oliver Glasner|Andoni Iraola|Marcelo Bielsa|Lionel Scaloni|Roberto De Zerbi|Luciano Spalletti|Gennaro Gattuso|Roberto Martínez|Ronald Koeman|Luis de la Fuente|Srečko Katanec""".split("|")]
# 3-bosqich (2026-11-18, Bahtiyor aka: "bazani yana to'ldir"): klublarning qolgan futbolchilari, terma jamoa yulduzlari, murabbiylar
PEOPLE += [(n, "", [n.split()[-1]] if len(n.split()) > 1 and len(n.split()[-1]) >= 5 else []) for n in """Mason Mount|Luke Shaw|Lisandro Martínez|Leny Yoro|Diogo Dalot|Noussair Mazraoui|Casemiro|Manuel Ugarte|Joshua Zirkzee|Rasmus Højlund|André Onana|Alejandro Garnacho|Jadon Sancho|Mason Greenwood|Scott McTominay|Romelu Lukaku|Paul Pogba|David de Gea|Raphaël Varane|Jack Grealish|Ederson|John Stones|Kyle Walker|Nathan Aké|Mateo Kovačić|İlkay Gündoğan|Savinho|Andrew Robertson|Joe Gomez|Curtis Jones|Ryan Gravenberch|Wataru Endo|Harvey Elliott|Federico Chiesa|Darwin Núñez|Giorgi Mamardashvili|Milos Kerkez|Ben White|Jurriën Timber|Riccardo Calafiori|Thomas Partey|Jorginho|Gabriel Jesus|Mikel Merino|Noni Madueke|Ethan Nwaneri|Myles Lewis-Skelly|Levi Colwill|Wesley Fofana|Malo Gusto|Roméo Lavia|Nicolas Jackson|Christopher Nkunku|Liam Delap|Estêvão|Dani Ceballos|Brahim Díaz|Ferland Mendy|David Alaba|Lucas Vázquez|Andriy Lunin|Franco Mastantuono|Ronald Araújo|Andreas Christensen|Iñigo Martínez|Marc Casadó|Ansu Fati|Wojciech Szczęsny|José María Giménez|Marcos Llorente|Conor Gallagher|Álex Baena|Giuliano Simeone|Robin Le Normand|Nahuel Molina|Thiago Almada|Henrikh Mkhitaryan|Francesco Acerbi|Stefan de Vrij|Benjamin Pavard|Davide Frattesi|Piotr Zieliński|Mehdi Taremi|Theo Hernández|Ruben Loftus-Cheek|Santiago Giménez|Strahinja Pavlović|Alexis Saelemaekers|Andrea Cambiaso|Weston McKennie|Teun Koopmeiners|Federico Gatti|Khéphren Thuram|Loïs Openda|Kingsley Coman|Leroy Sané|Konrad Laimer|Aleksandar Pavlović|Jonathan Tah|Kim Min-jae|Raphaël Guerreiro|Emre Can|Marcel Sabitzer|Niklas Süle|Felix Nmecha|Pascal Groß|Jobe Bellingham|Maximilian Beier|Gonçalo Ramos|Lee Kang-in|Fabián Ruiz|Lucas Hernández|Willian Pacho|Illia Zabarnyi|Nico Williams|Mikel Oyarzabal|Álvaro Morata|Unai Simón|Granit Xhaka|Xavi Simons|Memphis Depay|Youri Tielemans|Christian Eriksen|Pierre-Emile Højbjerg|Takefusa Kubo|Kaoru Mitoma|Salem Al-Dawsari|Akram Afif|Mohammed Kudus|Riyad Mahrez|Yassine Bounou|Hakim Ziyech|Sofyan Amrabat|Victor Boniface|Ademola Lookman|Tyler Adams|Folarin Balogun|Giovanni Reyna|James Rodríguez|Emiliano Martínez|Ángel Di María|Paulo Dybala|Nicolás Otamendi|Cristian Romero|Bruno Guimarães|Lucas Paquetá|Richarlison|Antony|João Pedro|Javier Mascherano|Thomas Frank|Nuno Espírito Santo|David Moyes|Marco Silva|Fabian Hürzeler|Niko Kovač|Kasper Hjulmand|Sebastian Hoeneß|Cristian Chivu|Igor Tudor|Gian Piero Gasperini|Maurizio Sarri|Stefano Pioli|Vincenzo Italiano|Manuel Pellegrini|Ernesto Valverde|Sérgio Conceição|Jorge Jesus|Hervé Renard|Walid Regragui|Dorival Júnior|Jesse Marsch|Ralf Rangnick|Murat Yakin|Zlatko Dalić|Vincenzo Montella|Domenico Tedesco|Rudi Garcia|Michael Carrick|Rúben Amorim|Graham Potter|Gareth Southgate|Steven Gerrard|Frank Lampard|Wayne Rooney|Xavi|Thiago Motta|Roberto Mancini""".split("|") if n not in [p[0] for p in PEOPLE]]
# o'zbek futbolchilari: (kanaldagi yozilishi, Wikidata qidiruv so'zi)
PEOPLE += [(a, b, [a.split()[-1]]) for a, b in [("Husniddin Aliqulov", "Khusniddin Alikulov"), ("Dostonbek Hamdamov", "Dostonbek Khamdamov"), ("O'tkir Yusupov", "Utkir Yusupov"), ("Farrux Sayfiyev", "Farrukh Sayfiev"), ("Sherzod Nasrullayev", "Sherzod Nasrullaev"), ("Azizbek Turg'unboyev", "Azizbek Turgunboev"), ("Xojimat Erkinov", "Khojimat Erkinov"), ("Jamshid Iskandarov", "Jamshid Iskanderov"), ("Akmal Mozgovoy", "Akmal Mozgovoy"), ("Oston O'runov", "Oston Urunov"), ("Odiljon Hamrobekov", "Odiljon Hamrobekov"), ("Umarali Rahmonaliyev", "Umarali Rakhmonaliev"), ("Sherzod Esanov", "Sherzod Esanov"), ("Mirjalol Qosimov", "Mirjalol Qosimov"), ("Vitaliy Denisov", "Vitaliy Denisov"), ("Anzur Ismoilov", "Anzur Ismailov"), ("Abbos Fayzullayev", "Abbosbek Fayzullaev")][:16]]
TOP |= {p[0] for p in PEOPLE[-16:]}
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
    e = get("https://www.wikidata.org/w/api.php", {"format": "json", "action": "wbgetentities", "ids": q, "props": "claims|sitelinks"}).get("entities", {}).get(q, {})
    cl = e.get("claims", {})
    val = lambda p: [c["mainsnak"]["datavalue"]["value"] for c in cl.get(p, []) if c.get("mainsnak", {}).get("datavalue")]
    out = {}
    def add(pages, main=False, need=None, lead=False):
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
            if re.search(BAD_T, t, re.I):
                continue
            ym = re.search(r"(19|20)\d\d", clean((md.get("DateTimeOriginal") or {}).get("value")) or "")
            art = re.sub(r"^(User:)", "", clean((md.get("Artist") or {}).get("value")))[:70] or "noma'lum muallif"
            out[t] = {"t": t, "url": ii.get("thumburl") or ii["url"], "lic": lic, "art": art, "y": int(ym.group(0)) if ym else 0, "main": main, "lead": lead,
                      "d": clean((md.get("DateTimeOriginal") or {}).get("value"))[:10]}
    ip = {"format": "json", "action": "query", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1920}
    for f in val("P18")[:2]:
        add(get("https://commons.wikimedia.org/w/api.php", {**ip, "titles": "File:" + f}).get("query", {}).get("pages", {}).values(), True)
    # 5-MANBA (2026-11-19): Vikipediyaning 7 tildagi maqolasida shu odamning ASOSIY surati (turli tillar turli surat qo'yadi). Faqat Commons'da turgan
    # (erkin litsenziyali) fayl olinadi — Vikipediyaning o'zidagi "fair use" surat Commons'da bo'lmagani uchun o'zi tushib qoladi.
    if "wiki" not in SRC_OFF:
        lead_f = []
        for w in ("en", "es", "de", "it", "fr", "ru", "uz"):
            ti = (e.get("sitelinks", {}).get(w + "wiki") or {}).get("title")
            if not ti:
                continue
            for x in get(f"https://{w}.wikipedia.org/w/api.php", {"format": "json", "action": "query", "prop": "pageimages", "piprop": "name", "titles": ti}, 2).get("query", {}).get("pages", {}).values():
                if x.get("pageimage") and x["pageimage"] not in lead_f:
                    lead_f.append(x["pageimage"])
            time.sleep(0.15)
        for f in lead_f[:6]:
            add(get("https://commons.wikimedia.org/w/api.php", {**ip, "titles": "File:" + f.replace("_", " ")}).get("query", {}).get("pages", {}).values(), False, None, True)
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
    # 4-MANBA (2026-11-19): Commons tuzilgan ma'lumoti — "suratda tasvirlangan" (P180) aynan shu Wikidata elementi deb belgilangan fayllar
    # (turkumga qo'yilmagan yangi yuklamalar ham chiqadi); kimligi nomdan emas, belgidan — lekin fayl nomida ismi bo'lishi sharti baribir qoladi
    if "depicts" not in SRC_OFF:
        add(get("https://commons.wikimedia.org/w/api.php", {**ip, "generator": "search", "gsrsearch": "haswbstatement:P180=" + q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 50, "gsrsort": "create_timestamp_desc"}).get("query", {}).get("pages", {}).values())
        time.sleep(0.25)
    return sorted(out.values(), key=lambda x: (not x["main"], -x["y"]))


OV_LIC = {"by": "CC BY", "by-sa": "CC BY-SA", "cc0": "CC0", "pdm": "Public domain"}
OV_SRC = {"flickr": "Flickr"}
_ov = {"n": 0, "off": False}


def openverse(name):
    # 6-MANBA (2026-11-19): Openverse — ochiq litsenziyali suratlar qidiruvi (asosan Flickr). Faqat CC BY / CC BY-SA / CC0 / PD (NC va ND olinmaydi:
    # kanal daromad qiladi va surat kartaga qirqiladi). Wikimedia natijalari tashlab ketiladi (ular yuqoridagi manbalarda bor).
    # Kimligi: sarlavhada odamning TO'LIQ ismi (hamma so'zi) bo'lishi shart; bir so'zli ismlar (Pedri, Rodri) bu manbadan olinmaydi.
    # Kalitsiz so'rovlar cheklangan (kuniga ~200) — bir ishga tushishda 120 tadan ko'p so'ralmaydi; 401/403/429 kelsa manba shu ishda o'chadi.
    words = [w for w in pn(name).split() if len(w) >= 3]
    if "openverse" in SRC_OFF or _ov["off"] or _ov["n"] >= 120 or len(words) < 2:
        return []
    _ov["n"] += 1
    try:
        r = requests.get("https://api.openverse.org/v1/images/", params={"q": '"' + name + '"', "license": "by,by-sa,cc0,pdm", "page_size": 20, "mature": "false"}, headers=UA, timeout=40)
    except Exception:
        return []
    if r.status_code in (401, 403, 429):
        _ov["off"] = True; print("openverse cheklovi:", r.status_code, "— shu ishda boshqa so'ralmaydi"); return []
    if r.status_code != 200:
        return []
    out = []
    for it in r.json().get("results", []):
        src = it.get("source") or it.get("provider") or ""
        t = clean(it.get("title"))
        if src not in OV_SRC or it.get("license") not in OV_LIC or (it.get("filetype") or "jpg").lower() not in ("jpg", "jpeg"):
            continue
        if min(it.get("width") or 0, it.get("height") or 0) < 900 or not all(w in pn(t).split() for w in words) or re.search(BAD_T, t, re.I):
            continue
        lic = OV_LIC[it["license"]] + (" " + it["license_version"] if it.get("license_version") and it["license"] in ("by", "by-sa") else "")
        ym = re.search(r"(19|20)\d\d", t)
        out.append({"t": "ov:" + it["id"], "title": t, "url": it["url"], "lic": lic, "art": (clean(it.get("creator")) or "noma'lum muallif")[:70], "y": int(ym.group(0)) if ym else 0,
                    "main": False, "d": "", "src": OV_SRC[src], "page": it.get("foreign_landing_url") or ""})
    return out


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
        delete()
    if os.environ.get("REG") or os.environ.get("DEL"):
        return report()
    have = requests.get(W + "/ub/faces", headers=H, timeout=30).json()
    seen = set(x.strip() for x in open("people_seen.txt", encoding="utf-8").read().split("\n") if x.strip()) if os.path.exists("people_seen.txt") else set()
    seen |= {p.get("wt") for P in have.values() for p in P.get("ph", []) if p.get("wt")}
    try:
        seen |= set(requests.get(W + "/ub/pseen", headers=H, timeout=30).json())
    except Exception as e_:
        print("pseen o'qilmadi", str(e_)[:80])
    picked = []
    only = [x.strip().lower() for x in os.environ.get("ONLY", "").split(",") if x.strip()]
    extra = [(x.strip(), "", []) for x in os.environ.get("ADD", "").split(",") if x.strip()]
    items, total = [], 0
    t0, st = time.time(), {"done": 0, "arch": 0}
    tag = lambda n_: "#" + re.sub(r"[^0-9A-Za-z]+", "_", __import__("unicodedata").normalize("NFD", n_).encode("ascii", "ignore").decode()).strip("_")
    def arch_send(name, c, why, im=None):  # arxiv kanaliga fayl bo'lib; True — yuborildi
        try:
            if im is None:
                im = Image.open(io.BytesIO(requests.get(c["url"], headers=UA, timeout=90).content)).convert("RGB")
            buf = io.BytesIO(); im.save(buf, "JPEG", quality=92, subsampling=0)
            cap_ = f"{name} {tag(name)} #{why}\n{re.sub(r'^File:', '', c['t'])}\nFoto: {c['art']}, {c['lic']} (Wikimedia Commons)" + (f"\n{c['d']}" if c.get("d") else "")
            for k_ in range(2):
                r = requests.post(API + "sendDocument", data={"chat_id": ARCH, "caption": cap_[:1000], "disable_notification": True, "disable_content_type_detection": True},
                                  files={"document": ("".join(ch if ch.isalnum() else "_" for ch in name)[:40] + ".jpg", buf.getvalue(), "image/jpeg")}, timeout=180).json()
                if r.get("ok"):
                    st["arch"] += 1; picked.append(c["t"]); time.sleep(3.2); return True
                time.sleep(float((r.get("parameters") or {}).get("retry_after", 5)) + 1)
            print("  arxivga yuborilmadi", r.get("description"))
        except Exception as e_:
            print("  arxiv xato", str(e_)[:80])
        return False
    def flush(force=False):  # bazaga bo'lib-bo'lib yoziladi — ish vaqt chegarasida uzilsa ham kanalga tushgan suratlar bazasiz qolmaydi
        if len(items) - st["done"] >= (1 if force else 40):
            print("baza:", requests.post(W + "/ub/faceaddm", headers=H, data=json.dumps({"items": items[st["done"]:]}), timeout=60).text[:120]); st["done"] = len(items)
    plist = extra + PEOPLE
    if AUTO and not only:  # aylanma navbat: har kuni boshqa joydan; avval bazada surati YO'Q odamlar, keyin kam suratlilar
        off = (int(time.time() // 86400) * STEP) % len(plist)
        plist = plist[off:] + plist[:off]
        cnt = lambda p: len((have.get(pn(p[0])) or {}).get("ph", []))
        plist = [p for p in plist[:STEP * 2] if cnt(p) == 0] + [p for p in plist[:STEP * 2] if cnt(p) > 0] + plist[STEP * 2:]
        print("avtomatik navbat:", off, "dan,", plist[0][0], "…")
    for name, term, al in plist:
        if total >= LIMIT and (not ARCH_LIMIT or DRY or st["arch"] >= ARCH_LIMIT):
            break  # post bazasi kunlik chegarasi to'lgan bo'lsa ham arxiv o'z chegarasigacha davom etadi
        if time.time() - t0 > float(os.environ.get("MAXSEC") or "2700"):
            print("vaqt chegarasi — to'xtatildi:", name); break
        flush()
        if only and name.lower() not in only:
            continue
        cur = len((have.get(pn(name)) or {}).get("ph", []))
        cap = MAXP_TOP if name in TOP else MAXP
        full = cur >= cap
        if full and (st["arch"] >= ARCH_LIMIT or DRY):
            print("=", name, "bazada", cur, "ta — yetarli"); continue
        try:
            q = qid(term or name)
            if not q:
                print("-", name, "Wikidata topilmadi"); continue
            # KIMLIGI ANIQ BO'LISHI SHART: fayl nomida shu odamning familiyasi (yoki ismi) bo'lishi kerak yoki u Wikidata'dagi asosiy surat (P18) —
            # turkumda boshqa odam nomi bilan atalgan suratlar ham uchraydi (sinovda Pochettino turkumidan "Jenny Taft ..." chiqqan)
            keys = [w for w in pn(term or name).split() + pn(name).split() if len(w) >= 4] or pn(name).split()
            keys = keys[-1:] + keys[:1] + [pn(a) for a in al if len(pn(a)) >= 4]
            raw = [c for c in files(q, [x for x in dict.fromkeys([name, term or name])]) + openverse(term or name) if c["t"] not in seen]
            cand = [c for c in raw if c["main"] or c.get("lead") or c.get("src") or any(k in pn(c["t"]) for k in keys)]
            print(" ", name, q, "nomzodlar:", len(raw), "→ ismi bor:", len(cand))
            got, days = 0, set()
            rej = [(c, "ismsiz", None) for c in raw if c not in cand and not c.get("src")]  # post bazasiga yaramaganlar → arxivga: (nomzod, sabab, yuklangan surat)
            for c in ([] if full or total >= LIMIT else cand[:18]):
                if got >= min(PER, cap - cur) or total >= LIMIT:
                    break
                if c["d"] and c["d"] in days:
                    rej.append((c, "seriya", None)); continue
                if not c["main"] and 0 < c["y"] < 2016 and name not in LEGENDS:
                    rej.append((c, "eski", None)); continue  # eskirgan surat (hozirgi murabbiy futbolchilik davrida va h.k.) — yangilikka mos emas
                if not c["main"] and other(c.get("title") or c["t"], keys):
                    rej.append((c, "kop_odam", None)); continue  # fayl nomida boshqa odam ham bor (ikki futbolchi kurashi) — kim asosiy ekanini aniqlab bo'lmaydi
                try:
                    im = Image.open(io.BytesIO(requests.get(c["url"], headers=UA, timeout=90).content)).convert("RGB")
                    if max(im.size) > 2560:  # tashqi manbadagi asl surat juda katta bo'lishi mumkin
                        im.thumbnail((2560, 2560), Image.LANCZOS)
                except Exception:
                    continue
                if min(im.size) < 900 or gray(im):
                    continue
                box, n, ex = persons.analyse(im)
                if not box or n != 1 or (box[3] - box[1]) < 0.5 or (box[2] - box[0]) < 0.16 or (box[2] - box[0]) * (box[3] - box[1]) < 0.12:
                    rej.append((c, "kop_odam" if n and n > 1 else "kichik", im)); continue
                src = c.get("src") or ""  # bo'sh — Wikimedia Commons (bot post matniga manba nomini o'zi qo'shadi); boshqa manba nomi muallif yozuvining ichida
                credit = f"Foto: {c['art']}, {c['lic']}" + (", " + src if src else "")
                print("+", name, "|", c.get("title") or c["t"], c["y"], f"{im.width}x{im.height}", "|", credit, "|", src or "Commons")
                got += 1; total += 1; days.add(c["d"]); picked.append(c["t"])
                if DRY:
                    continue
                buf = io.BytesIO(); im.save(buf, "JPEG", quality=93, subsampling=0)
                r = requests.post(API + "sendDocument", data={"chat_id": LIB, "caption": (f"{name}\n{credit}\n{c.get('page', '')}" if src else f"{name}\n{credit} (Wikimedia Commons)")[:1000], "disable_notification": True, "disable_content_type_detection": True},
                                  files={"document": ("".join(ch if ch.isalnum() else "_" for ch in name)[:40] + ".jpg", buf.getvalue(), "image/jpeg")}, timeout=180).json()
                if not r.get("ok"):
                    print("  yuborilmadi", r.get("description")); got -= 1; total -= 1; time.sleep(5); continue
                d = r["result"]["document"]
                items.append({"name": name, "al": al, "f": d["file_id"], "uid": d["file_unique_id"], "w": im.width, "h": im.height, "m": r["result"]["message_id"], "b": box, "x": ex, "c": credit, "wt": c["t"]})
                time.sleep(3.2)
            if not got and not full:
                print("-", name, "mos surat yo'q (nomzodlar:", len(cand), ")")
            # ARXIV: post bazasiga yaramaganlar; odamning post bazasi to'lgan bo'lsa — qolgan hamma yangi surat (yaxshilari ham)
            if ARCH_LIMIT and not DRY:
                if full or cur + got >= cap:
                    rej += [(c, "ortiqcha", None) for c in cand if c["t"] not in picked and all(c is not r_[0] for r_ in rej) and not c.get("src")]
                na = 0
                for c, why, im_ in rej:
                    if na >= ARCH_PER or st["arch"] >= ARCH_LIMIT or time.time() - t0 > float(os.environ.get("MAXSEC") or "2700"):
                        break
                    if c["t"] in picked:
                        continue
                    na += arch_send(name, c, why, im_)
                if na:
                    print("  arxivga:", name, na, "ta")
        except Exception as ex_:
            print("-", name, "xato", str(ex_)[:120])
        time.sleep(0.4)
    flush(True)
    print("ITEMS", json.dumps([{k: it[k] for k in ("name", "f", "uid", "m", "wt")} for it in items]))
    print("arxivga jami:", st["arch"])
    print("qo'shildi:", len(items), "| manbalar:", json.dumps({k: sum(1 for it in items if (it["c"].rsplit(", ", 1)[-1] if it["c"].endswith("Flickr") else "Commons") == k) for k in ("Commons", "Flickr")}), "| openverse so'rovlari:", _ov["n"])
    if not DRY:
        try:  # ko'rilgan fayllar KV'da (olib tashlanganlari qayta kelmasin)
            print("pseen:", requests.post(W + "/ub/pseen", headers=H, data=json.dumps({"add": sorted(seen | set(picked))}), timeout=60).text[:60])
        except Exception as e_:
            print("pseen yozilmadi", str(e_)[:80])
    report(items)


def report(items=None):
    if os.environ.get("REPORT") != "1":
        return
    try:
        _print("plog:", requests.post(W + "/ub/plog", headers=H, data=json.dumps({"t": time.strftime("%Y-%m-%d %H:%M:%S"), "items": items or [], "log": _LOG[-1500:]}, ensure_ascii=False).encode(), timeout=60).text[:60])
    except Exception as e_:
        _print("plog yozilmadi", str(e_)[:80])


if __name__ == "__main__":
    main()
