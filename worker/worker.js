const FEEDS = [
    { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
    { name: "Sports.ru", url: "https://www.sports.ru/rss/rubric.xml?s=208" },
    { name: "Goal.com", url: "https://www.goal.com/en/google-news/page", type: "sitemap" },
    { name: "Sky Sports", url: "https://www.skysports.com/rss/11095" },
    { name: "Championat", url: "https://www.championat.com/rss/news/football/" },
    { name: "The Guardian", url: "https://www.theguardian.com/football/rss" },
    { name: "ESPN", url: "https://www.espn.com/espn/rss/soccer/news" },
    { name: "Sky Sports News", url: "https://www.skysports.com/rss/12040" },
    { name: "The Independent", url: "https://www.independent.co.uk/sport/football/rss" },
    { name: "Mirror", url: "https://www.mirror.co.uk/sport/football/rss.xml" },
    { name: "Daily Mail", url: "https://www.dailymail.co.uk/sport/football/index.rss" },
    { name: "FourFourTwo", url: "https://www.fourfourtwo.com/feeds/all" },
    { name: "90min", url: "https://www.90min.com/posts.rss" },
    { name: "Soccer.ru", url: "https://www.soccer.ru/rss.xml" },
    // qo'shimcha manbalar (2026-11-08, probe.yml bilan tekshirilgan): klublarga yaqin nashrlar, transferlar va o'zbek legionerlari
    { name: "AS English", url: "https://feeds.as.com/mrss-s/pages/as/site/en.as.com/portada/" },
    { name: "Football Italia", url: "https://football-italia.net/feed/" },
    { name: "Manchester Evening News", url: "https://www.manchestereveningnews.co.uk/sport/football/?service=rss" },
    { name: "Football London", url: "https://www.football.london/?service=rss" },
    { name: "Liverpool Echo", url: "https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss" },
    { name: "Transfermarkt", url: "https://www.transfermarkt.com/rss/news" },
    { name: "The Telegraph", url: "https://www.telegraph.co.uk/football/rss.xml" },
    { name: "Daryo", url: "https://daryo.uz/feed/" },
    { name: "Sports.uz", url: "https://sports.uz/rss" },
    { name: "Gazeta.uz", url: "https://www.gazeta.uz/oz/rss/?section=sport" }, { name: "Kun.uz", url: "https://kun.uz/news/rss" }, { name: "Marca", url: "https://www.marca.com/en/rss/football.xml" }, { name: "Football España", url: "https://www.football-espana.net/feed" },
{ name: "InterFutbol TV", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCDnCDK0EjtZr640DIWbEMUQ", type: "yt" },
];

    const MAX_AGE_HOURS = 6;
    const QUEUE_LIMIT = 40;
    const PRIORITY = /uzbek|o'zbek|pakhtakor|paxtakor|navbahor|nasaf|neftchi|bunyodkor|agmk|surkhon|узбек|пахтакор|насаф|навбахор|нефтчи|шомуродов|shomurodov|husanov|хусанов|fayzullaev|файзуллаев|masharipov|машарипов|urunov|урунов|kaprosh|капрош|fayzullayev|faizullaev|bekhruz karimov|behruz karimov|бехруз каримов|urozov|o'rozov|урозов|makhamadzhonov|mahamadjonov|махамаджонов|hamrobekov|khamrobekov|хамробеков|azizjon ganiev|azizjon g'aniyev|азизжон ганиев|rakhmonaliev|rahmonaliyev|рахмоналиев|sadriddin khasanov|sadriddin hasanov|садриддин хасанов|urinboev|o'rinboyev|уринбоев|abdulla abdullaev|ashurmatov|ashurmatov|ашурматов|aliqulov|alikulov|аликулов|igor sergeev|игорь сергеев|otabek shukurov|отабек шукуров|sherzod temirov|шерзод темиров/i;

    // Kanal yo'nalishi: faqat eng mashhur klublar, turnirlar va o'zbek futboli
    const FOCUS_EN = /\b(man(chester)?\s*(united|utd|city)|liverpool|arsenal|chelsea|real madrid|barcelona|barca|barça|atl[eé]tico( de)? madrid|atleti\b|inter milan|internazionale|nerazzurri|milan|juventus|juve|bayern|dortmund|psg|paris saint-germain|paris sg|al[- ]?nassr|inter miami|ronaldo|messi|mbapp[eé]|yamal|haaland|salah|harry kane|vin[ií]cius|bellingham|lewandowski|saka|cole palmer|bruno fernandes|champions league|world cup|euro 20\d\d|european championship|uzbek)/i;
    // Jamoa nomi uchun qat'iy tekshiruv: "RCD Espanyol de Barcelona" Barcelona emas; ayollar, yoshlar va ikkinchi jamoalar ham bizniki emas (2026-11-08)
    const NOT_OURS = /espanyol|women|\bwfc\b|femen|f[eé]minin|frauen|ladies|\bII\b|\bU-?(1[5-9]|2[0-3])\b|castilla|futuro|primavera|reserves?\b|academy|youth|juniors?\b|atl[eè]tic\b/i;
    // CHET ELDAGI O'ZBEK FUTBOLCHILARI KLUBLARI (Bahtiyor aka qarori, 2026-11-08): o'yinlari jadvalga va natijalarga ham chiqadi.
    // Klubda o'zbek futbolchisi qolmasa (va u top ro'yxatda bo'lmasa) bu yerdan olib tashlanadi; yangi o'zbek legioner klubi qo'shiladi.
    // İstanbul Başakşehir — Eldor Shomurodov, Abbosbek Fayzullayev; Çaykur Rizespor — Husniddin Aliqulov; Braga — olib tashlandi (2026-11-08, Bahtiyor aka qarori: Sadriddin Hasanov U23 jamoasida; asosiy jamoaga chiqsa fmWatch xabar beradi va qaytariladi);
    // Royal Antwerp — Muhammadali O'rinboyev; FC Lugano — Behruz Karimov; Tractor — Odiljon Hamrobekov; Esteghlal — Jaloliddin Masharipov, Rustam Ashurmatov;
    // Persepolis — Oston O'runov, Igor Sergeyev; Baniyas — Azizjon G'aniyev (2026-11-08 FotMob: Al Bataeh'dan o'tgan; Abdulla Abdullayev Neftchi Farg'onaga qaytgani uchun Dibba olib tashlandi); Sabah — Umarali Rahmonaliyev;
    // Radnik Surdulica — Otabek Shukurov; Zakho — Sherzod Temirov. Rossiya: Rubin Kazan — Jahongir O'rozov, Dynamo Makhachkala — Mahmud Mahamadjonov (Bahtiyor aka qarori 2026-11-08: Rossiya klublarining faqat o'yinlari/natijalari; yangiliklardan faqat o'zbek futbolchisi nomi borlari).
    const UZ_CLUBS = /ba[sş]ak[sş]ehir|rizespor|\bantwerp\b|\blugano\b|\btractor\b|traktor sazi|esteghlal(?! khuzestan)|persepolis|bani ?yas|\bsabah\b|radnik surdulica|\bzakho\b|rubin kazan|\brubin\b|d[iy]namo makhachkala/i;
    // Chet eldagi o'zbek futbolchilari ismlari: Rossiya mavzusidagi yangilik shu ismlardan biri bo'lsa ham chiqadi
    const UZ_NAMES = /shomurodov|шомуродов|husanov|khusanov|хусанов|fayzullaev|fayzullayev|faizullaev|файзуллаев|masharipov|машарипов|urunov|урунов|bekhruz karimov|behruz karimov|бехруз каримов|urozov|o'rozov|урозов|makhamadzhonov|mahamadjonov|махамаджонов|hamrobekov|khamrobekov|хамробеков|azizjon ganiev|azizjon g'aniyev|азизжон ганиев|rakhmonaliev|rahmonaliyev|рахмоналиев|sadriddin khasanov|sadriddin hasanov|садриддин хасанов|urinboev|o'rinboyev|уринбоев|abdulla abdullaev|ashurmatov|ашурматов|aliqulov|alikulov|аликулов|igor sergeev|игорь сергеев|otabek shukurov|отабек шукуров|sherzod temirov|шерзод темиров/i;
    // Ayollar jamoalari haqidagi yangiliklar chiqmaydi (2026-11-09 nazorat: Barcelona ayollar jamoasi 5:1 Madrid CFF posti, 178)
    const WOMEN_RE = /\bwomen'?s?\b|\bwfc\b|\bwsl\b|\bnwsl\b|\buwcl\b|lionesses|\bliga f\b|femen[ií]|f[eé]minine?s?\b|frauen|\bladies\b|ayollar|xotin-qizlar|женск|женщин/i;
    // 2026-11-15 (279-post: Chelsea 1:0 Manchester City — ayollar WSL o'yini, sarlavhada "Women" so'zi yo'q edi): ayollar futboli 4 bosqichda to'siladi —
    // 1) sarlavha+tavsif+havola, 2) maqola matni, 3) yozuvchi model SKIP, 4) rasmiy natijalar bazasida o'yin ayollar ligasida bo'lsa (scoreGuard "women")
    const womenItem = (i) => { if (WOMEN_RE.test([i.title, i.desc, String(i.link || "").replace(/[-_\/.]/g, " ")].join(" "))) return true; const tx = String(i.text || ""); if (!tx) return false; return WOMEN_RE.test(tx.slice(0, 800)) || (tx.match(new RegExp(WOMEN_RE.source, "gi")) || []).length >= 2; };
    const topTeam = (...n) => { const t = n.filter(Boolean).join(" "); return !!t && !NOT_OURS.test(t) && (FOCUS_EN.test(t) || /(?<![\p{L}])[OÖ]['ʻ’‘]?zbekiston(?![\p{L}])/u.test(t)); }; // 2026-11-12: ESPN_NAME "Uzbekistan"→"O'zbekiston" qilgani uchun terma jamoa o'yini 09:00 jadvalidan tushib qolgan edi
    const uzTeam = (...n) => { const t = n.filter(Boolean).join(" "); return !!t && !NOT_OURS.test(t) && UZ_CLUBS.test(t); };
    const ourTeam = (...n) => topTeam(...n) || uzTeam(...n);
    const FOCUS_RU = /манчестер|ман сити|ман юнайтед|ливерпул|«арсенал|челси|«реал|реал мадрид|барселон|«барс|атлетико|«интер|интер милан|интер майами|милан|ювентус|бавари|дортмунд|боруссия д|псж|пари сен|наср|роналду|месси|мбаппе|ямал|холанд|салах|кейн|винисиус|беллингем|левандовск|сака|палмер|бруну ферн|лиг[аиуе] чемпионов|лч\b|чемпионат[аеу]? мира|чм-20|чемпионат[аеу]? европы|евро-20|узбек/i;
    const RU_PUNDIT = /мел[её]хин|melyox?in|melyokhin|melekhin|кузяев|баринов|захарян|осипенко|дивеев|оздоев|кругов|радимов|погребняк|самедов|мостов[оа]|бубнов|генич|шалимов|канчельскис|кержаков|глушаков|мамаев|кокорин|смертин|аршавин|губерниев|черданцев|уткин|черчесов|слуцк|гончаренко|карпин|семак|станкович|мусаев|галицк|кафельников|тарханов|кисляк|глушенков|соболев|батраков|миранчук|сперцян|дзюба|акинфеев|akinfeev|смолов|smolov|казанск|kazanskiy|kazansky/i; /* 2026-11-12: 239 (Akinfeev), 242 (Smolov/Kazanskiy) postlari chiqib ketgan */ const RU_DOM = /rossiya terma jamoasi|rossiya milliy|сборн\S* росси|россии по футболу|\bрпл\b|рфпл|«зенит|«спартак|цска|«локомотив|«динамо|«краснодар|«ростов|«рубин|«ахмат|«оренбург|«крылья|«акрон|«пари нн|«факел|«балтика|«химки|сафонов|safonov|комличенко|komlichenko|головин|golovin|тюкавин|tyukavin|лунев|лунёв|мухин|чистяков|пестряков|мелкадзе|самошников|кривцов|russia national team|в россию|прилет\S* в росси|новогорск|arriv\S* in russia|russia squad|russia camp/i; const ruOff = (t) => RU_PUNDIT.test(t) || (RU_DOM.test(t) && !UZ_NAMES.test(t) && !(FOCUS_EN.test(t.replace(/uzbek\S*/gi, "")) || FOCUS_RU.test(t.replace(/узбек\S*/gi, "")))); const isFocus = (i) => { const t = (i.title || "") + " " + (i.desc || ""); if (ruOff(String(i.title || ""))) return false; if (womenItem(i)) return false; return FOCUS_EN.test(t) || FOCUS_RU.test(t) || PRIORITY.test(t); };

    const enc = new TextEncoder();
    async function sha(s) {
    const b = await crypto.subtle.digest("SHA-256", enc.encode(s));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    }
    function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36);
    }
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    function decodeEntities(s) {
    return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
    }
    const unEnt = (t) => { let x = String(t || ""), prev; do { prev = x; x = x.replace(/&nbsp;/g, " ").replace(/&quot;/g, "\"").replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&"); } while (x !== prev); return x; };
    const unAmp = (u) => String(u || "").replace(/&amp;/g, "&").trim();

    export function pickImage(it) {
    let best = null, bw = -1;
    for (const m of it.matchAll(/<media:content\b[^>]*>/g)) {
    const u = m[0].match(/url="([^"]+)"/), w = m[0].match(/width="(\d+)"/);
    if (u && (w ? +w[1] : 0) > bw) { best = u[1]; bw = w ? +w[1] : 0; }
    }
    if (best) return unAmp(best);
    const sm = it.match(/<social-media\b[^>]*?url="([^"]+)"/);
    if (sm) return unAmp(sm[1]);
    const e = it.match(/<enclosure\b[^>]*?url="([^"]+)"/);
    if (e) return unAmp(e[1]);
    const t = it.match(/<media:thumbnail\b[^>]*?url="([^"]+)"/);
    if (t) return unAmp(t[1]).replace(/\/(standard|branded_sport|news)\/\d+\//, "/$1/976/");
    return null;
    }

    export function parseRss(xml, source) {
    const items = [];
    const re = /<item[\s>][\s\S]*?<\/item>/g;
    let m;
    while ((m = re.exec(xml)) && items.length < 15) {
    const it = m[0];
    const get = (tag) => {
    const r = it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return r ? decodeEntities(r[1]) : "";
    };
    const title = get("title");
    const link = get("link") || get("guid");
    if (!title || !link) continue;
    const date = Date.parse(get("pubDate")) || Date.now();
    items.push({ title, link, desc: get("description").slice(0, 600), date, source, img: pickImage(it) });
    }
    return items;
    }

    export function parseYt(xml, source) {
        const items = [];
        for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
        const e = m[1];
        const id = (e.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
        const title = decodeEntities((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
        if (!id || !title) continue;
        const date = Date.parse((e.match(/<published>(.*?)<\/published>/) || [])[1]) || Date.now();
        const desc = decodeEntities((e.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1]).slice(0, 600);
        items.push({ title, link: "https://www.youtube.com/watch?v=" + id, desc, date, source, img: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, video: true });
        if (items.length >= 15) break;
        }
        return items;
        }
        
        export function parseSitemap(xml, source) {
    const items = [];
    for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const u = m[1];
    const loc = (u.match(/<loc>(.*?)<\/loc>/) || [])[1];
    if (!loc || !/\/news\//.test(loc)) continue;
    const title = decodeEntities((u.match(/<news:title>([\s\S]*?)<\/news:title>/) || [])[1]);
    if (!title) continue;
    // Goal.com "qayerda ko'rish", chipta, xarid va stavka sahifalari yangilik emas — ular eng yangi 15 ta o'rinni band qilib, haqiqiy yangiliklarni siqib chiqarardi (2026-11-18)
    if (/^watch\b.*\blive\b|live today|who is (broadcasting|showing)|where to watch|live stream|tv channel|how to (get|buy|watch)|tickets?\b|black friday|cyber monday|\b(football|sports?|fitness|tech|entertainment|boots) deals\b|promo code|betting|odds\b|best .* to buy|kits? .* buy/i.test(title)) continue;
    const date = Date.parse((u.match(/<news:publication_date>(.*?)</) || [])[1]) || Date.now();
    const img = (u.match(/<image:loc>(.*?)<\/image:loc>/) || [])[1];
    items.push({ title, link: unAmp(loc), desc: "", date, source, img: img ? unAmp(img) : null });
    }
    return items.sort((a, b) => b.date - a.date).slice(0, 15);
    }

    function words(t) {
    return new Set(t.toLowerCase().replace(/[^a-z0-9à-ÿа-яё ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
    }
    export function similar(a, b) {
    const A = words(a), B = words(b);
    if (!A.size || !B.size) return false;
    let n = 0;
    for (const w of A) if (B.has(w)) n++;
    return n / Math.min(A.size, B.size) >= 0.6;
    }

    async function kvGet(env, key, def) {
    const v = await env.STATE.get(key);
    if (!v) return def;
    try { return JSON.parse(v); } catch (e) { return v; }  // qo'lda/skriptdan JSON bo'lmagan oddiy matn yozilgan bo'lsa ham yiqilmaydi (2026-11-19: jobsUrl)
    }
    const kvPut = (env, key, val, opts) => env.STATE.put(key, JSON.stringify(val), opts);

    // yangi o'zbek lotin alifbosi (2026): O' → Ö, G' → Ğ, Sh → Ş, Ch → Ç. HTML teglar, havolalar, @nomlar, heshteglar,
// ⟦…⟧ ichidagi original nomlar (klub, futbolchi, murabbiy) va chet tilidagi so'zlar o'zgarmaydi
const NA_KEEP = /^(Christian|Christopher|Chris|Christensen|Achraf|Sanchez|Schmeichel|Pochettino|Chivu|Marchisio|Echeverri|Ochoa|Shaqiri|Fischer|Bochum|Mönchengladbach|Gladbach|Manchester|Michael|Mitchell|Richarlison|Sancho|Chiesa|Shaw|Ashley|Charlton|Chalobah|Chilwell|Kimmich|Fletcher|Richards|Rashford|Champions|Chiellini|Sheffield|Shakhtar|Chicharito|Shearer|Schick|Sesko|Eintracht|Gregoritsch)$/;
// 2026-11-21 (378-post sarlavhasi "Samuel Etöo"): "o'" dan keyin yana "o" kelsa — o'zbekcha emas, xorijiy ism (Eto'o)
const NA_FOREIGN = /^sch|c(?!h)|w|ea|ou|th|ph|ck|ee|oo|ae|o['‘’ʻʼ`]o|[àáâãäåæèéêëìíîïñòóôõøùúûüýÿœß]/i;
const naWord = (w) => (NA_FOREIGN.test(w) || NA_KEEP.test(w) ? w : w
  .replace(/O['‘’ʻʼ`]/g, "Ö").replace(/o['‘’ʻʼ`]/g, "ö")
  .replace(/G['‘’ʻʼ`]/g, "Ğ").replace(/g['‘’ʻʼ`]/g, "ğ")
  .replace(/S[Hh]/g, "Ş").replace(/sh/g, "ş")
  .replace(/C[Hh]/g, "Ç").replace(/ch/g, "ç"));
// KANALDAN QAYTA O'QILGAN MATN (2026-11-17, 320-post: /ub/rasm dan keyin "Eintracht" → "Eintraçt", "Gregoritsch" → "Gregoritsç"):
// kanal matni allaqachon yangi alifboda — unda qolgan "ch"/"sh" faqat xorijiy nomlarda bo'ladi, shuning uchun ular ⟦ ⟧ bilan himoyalanadi
const keepLatin = (t) => (typeof t !== "string" || !t ? t : t.split(/(<[^>]*>|https?:\/\/[^\s<]+|@\w+|⟦[^⟧]*⟧|#[\p{L}\p{N}_]+)/u).map((p, i) => (i % 2 ? p : p.replace(/[\p{L}'‘’ʻʼ`]+/gu, (w) => (/[cs]h/i.test(w) ? "⟦" + w + "⟧" : w)))).join(""));
function newAlpha(t) {
  if (typeof t !== "string" || !t) return t;
  return t.split(/(<[^>]*>|https?:\/\/[^\s<]+|@\w+|⟦[^⟧]*⟧|#[\p{L}\p{N}_]+)/u).map((p, i) => (i % 2
    ? (p.startsWith("⟦") ? (/terma jamoa|milliy|^[OoÖö]['‘’ʻʼ`]?zbek/u.test(p.slice(1, -1)) ? p.slice(1, -1).replace(/[\p{L}'‘’ʻʼ`]+/gu, naWord) : p.slice(1, -1)) : p)
    : p.replace(/[\p{L}'‘’ʻʼ`]+/gu, naWord).replace(/[⟦⟧]/g, ""))).join("");
}
const CLUB_EMOJI = [["5229225598886391482","🇪🇺",["UEFA Champions League","UEFA Chempionlar ligasi","Champions League","Chempionlar ligasi","UCL"]],["5231431395305362990","🇪🇺",["UEFA Europa League","UEFA Yevropa ligasi","Europa League","Yevropa ligasi"]],["5228693186150443616","🇪🇺",["UEFA Conference League","UEFA Konferensiya ligasi","Conference League","Konferensiya ligasi"]],["5229070404538114723","🇪🇸",["LaLiga","La Liga"]],["5231463564610410444","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Premier League","Premyer-liga","APL"]],["5231059781850013741","🇩🇪",["Bundesliga"]],["5229239196752848847","🇮🇹",["Serie A","Seriya A"]],["5228903119856903341","🇫🇷",["Ligue 1"]],["5229106976184642256","🇪🇸",["Barcelona","Barça","Barselona"]],["5228819118886562938","🇪🇸",["Real Madrid"]],["5228969678965092621","🇪🇸",["Villarreal","Viyarreal"]],["5228767424660152076","🇪🇸",["Atlético Madrid","Atletico Madrid","Atlético","Atletico"]],["5228833008810764839","🇪🇸",["Real Betis","Betis"]],["5228747538961577330","🇪🇸",["Celta Vigo","Celta","Selta"]],["5229218799953160879","🇪🇸",["Getafe"]],["5229129889835166520","🇪🇸",["Rayo Vallecano"]],["5228995057926840597","🇪🇸",["Valencia","Valensiya"]],["5228903974555397517","🇪🇸",["Real Sociedad"]],["5228748728667512378","🇪🇸",["Espanyol"]],["5229165851596331635","🇪🇸",["Athletic Bilbao","Athletic Club","Atletik Bilbao"]],["5228679468024899140","🇪🇸",["Sevilla","Seviliya"]],["5229144797666649009","🇪🇸",["Alavés","Alaves"]],["5228798996964757184","🇪🇸",["Elche"]],["5228948874143512533","🇪🇸",["Levante"]],["5228944141089553057","🇪🇸",["Osasuna"]],["5229019534945459184","🇪🇸",["Racing Santander"]],["5228705611490829023","🇪🇸",["Deportivo La Coruña","Deportivo"]],["5229235215318167778","🇪🇸",["Málaga","Malaga"]],["5229188520433722109","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Arsenal"]],["5229158034755855557","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Manchester City","Man City","Manchester Siti"]],["5228886824750984659","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Manchester United","Man United","Man Utd","Manchester Yunayted"]],["5229233772209150738","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Aston Villa"]],["5231337490140403310","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Liverpool","Liverpul"]],["5229050334155947086","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Bournemouth","Bornmut"]],["5228830543499533346","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Sunderland"]],["5229201362385936715","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Brighton","Brayton"]],["5228998743008783911","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Brentford"]],["5229225474332335270","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Chelsea","Chelsi"]],["5229124546895848124","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Fulham"]],["5228935976356715450","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Newcastle United","Newcastle","Nyukasl"]],["5230945617324318078","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Everton"]],["5228805937631901160","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Leeds United","Leeds"]],["5228680374263003270","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Crystal Palace"]],["5229043152970623561","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Nottingham Forest"]],["5229116876084263290","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Tottenham Hotspur","Tottenham","Tottenxem"]],["5229176498820263026","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Coventry City","Coventry"]],["5229143217118687454","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Hull City"]],["5228729538753639272","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Ipswich Town","Ipswich"]],["5229041207350440348","🇩🇪",["Bayern München","Bayern Munich","Bayern","Bavariya"]],["5228859006247804946","🇩🇪",["Borussia Dortmund","Dortmund","Borussiya Dortmund"]],["5228782968146794950","🇩🇪",["RB Leipzig","Leipzig","Leypsig"]],["5229060478868697735","🇩🇪",["VfB Stuttgart","Stuttgart","Shtutgart"]],["5229134567054554174","🇩🇪",["Hoffenheim"]],["5229161436369957022","🇩🇪",["Bayer Leverkusen","Leverkusen"]],["5231268564505237843","🇩🇪",["Freiburg"]],["5229131101015941848","🇩🇪",["Eintracht Frankfurt","Frankfurt"]],["5229220492170276628","🇩🇪",["Augsburg"]],["5228761158302870103","🇩🇪",["Mainz"]],["5231305209166206042","🇩🇪",["Union Berlin"]],["5228756343644527267","🇩🇪",["Borussia Mönchengladbach","Mönchengladbach","Gladbach"]],["5228740851697494952","🇩🇪",["Hamburger SV","Hamburg"]],["5229062201150579539","🇩🇪",["1. FC Köln","Köln","Koln"]],["5228874261971642153","🇩🇪",["Werder Bremen","Werder"]],["5231034587571854758","🇩🇪",["Schalke 04","Schalke"]],["5228930306999886478","🇩🇪",["Paderborn"]],["5229047636916481107","🇮🇹",["Inter Milan","Internazionale","Inter"]],["5228806440143070217","🇮🇹",["Napoli"]],["5228697176175063918","🇮🇹",["AS Roma","Roma"]],["5231076515042595502","🇮🇹",["Como"]],["5229049080025493041","🇮🇹",["AC Milan","Milan"]],["5228838373224915768","🇮🇹",["Juventus","Yuventus"]],["5228777839955849906","🇮🇹",["Atalanta"]],["5228684493136638599","🇮🇹",["Bologna"]],["5229048289751508264","🇮🇹",["Lazio"]],["5229122244793379910","🇮🇹",["Udinese"]],["5229120337827898003","🇮🇹",["Sassuolo"]],["5228742943346569102","🇮🇹",["Torino"]],["5228737196680326677","🇮🇹",["Parma"]],["5229007320058472618","🇮🇹",["Cagliari"]],["5228979338346541631","🇮🇹",["Fiorentina"]],["5229183319228331613","🇮🇹",["Genoa"]],["5228819501138619638","🇮🇹",["Lecce"]],["5229138634388577013","🇮🇹",["Venezia"]],["5229001530442559859","🇮🇹",["Frosinone"]],["5231309164831085442","🇮🇹",["Monza"]],["5228695110295794963","🇫🇷",["Paris Saint-Germain","PSG","Paris SG"]],["5228845580180040609","🇫🇷",["Lens"]],["5229100447834349400","🇫🇷",["Lille"]],["5231157311967369439","🇫🇷",["Olympique Lyonnais","Olympique Lyon","Lyon"]],["5229054882526309312","🇫🇷",["Olympique de Marseille","Olympique Marseille","Marseille","Marsel"]],["5228933966312023870","🇫🇷",["Stade Rennais","Rennes"]],["5229201731753123126","🇫🇷",["AS Monaco","Monaco"]],["5229129125330989966","🇫🇷",["Strasbourg"]],["5228824015149252379","🇫🇷",["Lorient"]],["5228781662476745058","🇫🇷",["Toulouse"]],["5231353175360972858","🇫🇷",["Paris FC"]],["5228750940575675137","🇫🇷",["Brest"]],["5231374147686277146","🇫🇷",["Angers"]],["5228905537923493556","🇫🇷",["Le Havre"]],["5229045854505053556","🇫🇷",["Auxerre"]],["5228784819277704317","🇫🇷",["Nice"]],["5228887383096732008","🇫🇷",["Le Mans"]],["5229169197375857516","🇫🇷",["Troyes"]],["5229236800161101055","🇵🇹",["Benfica"]],["5228739430063316603","🇵🇹",["FC Porto","Porto"]],["5228998803138321269","🇵🇹",["Sporting CP","Sporting Lisbon","Sporting"]],["5230986982154344686","🇵🇹",["Braga"]],["5228918976876160155","🇳🇱",["AFC Ajax","Ajax Amsterdam","Ajax"]],["5231320838552197199","🇳🇱",["PSV Eindhoven","PSV"]],["5229042659049385597","🇳🇱",["Feyenoord"]],["5229160813599697600","🇳🇱",["AZ Alkmaar"]],["5231070742606550524","🇳🇱",["Utrecht"]],["5231192466274686526","🇳🇱",["Heerenveen"]],["5229201306551364797","🏴󠁧󠁢󠁳󠁣󠁴󠁿",["Celtic"]],["5229123748031933157","🏴󠁧󠁢󠁳󠁣󠁴󠁿",["Rangers"]],["5228770332353010673","🇨🇭",["Young Boys"]],["5231070197145707984","🇨🇭",["Basel"]],["5231126482692119677","🇷🇸",["Crvena Zvezda","Red Star Belgrade"]],["5229072732410391473","🇸🇰",["Slovan Bratislava"]],["5228937874732267999","🇨🇿",["Sparta Praha","Sparta Prague"]],["5229210832788826194","🇨🇿",["Slavia Praha","Slavia Prague"]],["5231414378644937763","🇬🇷",["Olympiacos"]],["5229133184075084028","🇬🇷",["AEK Athens","AEK"]],["5231170755215008294","🇬🇷",["PAOK"]],["5231112231990636474","🇩🇰",["FC København","København","Copenhagen"]],["5228680228234106909","🇧🇪",["Club Brugge"]],["5229153709723792559","🇧🇪",["Union Saint-Gilloise"]],["5229199648693985277","🇧🇪",["Anderlecht"]],["5228925702794948068","🇳🇴",["Bodø/Glimt","Bodo/Glimt"]],["5231463263962698297","🇳🇴",["Viking"]],["5228723929526348946","🇦🇹",["LASK"]],["5228827309389164297","🇦🇹",["Red Bull Salzburg","Salzburg"]],["5228703365222938432","🇭🇷",["Dinamo Zagreb"]],["5228897879996805731","🇭🇷",["Hajduk Split"]],["5229023881452364735","🇨🇾",["Pafos"]],["5228721434150351545","🇹🇷",["Trabzonspor"]],["5231113481826115805","🇹🇷",["Fenerbahçe","Fenerbahce"]],["5228853491509801047","🇹🇷",["Galatasaray"]],["5229144110471881758","🇹🇷",["İstanbul Başakşehir","Istanbul Başakşehir","Başakşehir","Basaksehir"]],["5228896514197203798","🇹🇷",["Beşiktaş","Besiktas"]],["5228763911376907679","🇹🇷",["Antalyaspor"]],["5228970138526593353","🇦🇿",["Sabah"]],["5231000803359112676","🇦🇿",["Qarabağ","Qarabag"]],["5231296198324823561","🇰🇿",["Kairat"]],["5231391958915654212","🇺🇦",["Dynamo Kyiv","Dinamo Kiev"]],["5231099209649793047","🇺🇦",["Shakhtar Donetsk","Shakhtar"]],["5229004554099536379","🇸🇦",["Al-Nassr","Al Nassr","Al-Nasr","Al Nasr"]],["5228824461825846585","🇸🇦",["Al-Hilal","Al Hilal"]],["5228816984287781950","🇸🇦",["Al-Ahli","Al Ahli"]],["5229177164540191510","🇸🇦",["Al-Ittihad","Al Ittihad"]],["5228892266474545800","🇺🇸",["Inter Miami"]],["5271935836009557593","🇹🇷",["Çaykur Rizespor","Caykur Rizespor","Rizespor"]],["5271776759010852132","🇹🇷",["Göztepe","Goztepe"]],["5271722002472796801","🇹🇷",["Eyüpspor","Eyupspor"]],["5271708413196269629","🇹🇷",["Gençlerbirliği","Genclerbirligi"]],["5271984790046800215","🇹🇷",["Kasımpaşa","Kasimpasa"]],["5272018475475304876","🇹🇷",["Kayserispor"]],["5271888943556621806","🇹🇷",["Kocaelispor"]],["5274254139096856337","🇹🇷",["Konyaspor"]],["5273859225443924249","🇹🇷",["Samsunspor"]],["5271538740513244871","🇹🇷",["Alanyaspor"]],["5271988226020639100","🇹🇷",["Çorum FK","Corum FK"]],["5471904123127374780","🇹🇷",["Erzurumspor","Erzurum BB"]],["5271617901055476408","🇹🇷",["Gaziantep FK","Gaziantep"]],["5271871265471232922","🇹🇷",["Süper Lig","Super Lig","Turkish Super Lig"]],["5384192391202765602","🇧🇪",["Royal Antwerp","Antwerp"]],["5436070373458226074","🇧🇪",["Jupiler Pro League","Belgian Pro League"]],["5190576094427778496","🇨🇭",["FC Lugano","Lugano"]],["5192864869614911224","🇨🇭",["Swiss Super League"]],["5260329240942902933","🇷🇺",["Rubin Kazan","Rubin"]],["5258273819918897674","🇷🇺",["Dynamo Makhachkala","Dinamo Makhachkala"]],["5257987491629140891","🇷🇺",["Russian Premier League"]],["5415589160482273504","🇷🇸",["Radnik Surdulica"]],["5197628937533946051","🇮🇷",["Tractor","Traktor"]],["5413516422150137611","🇮🇷",["Esteghlal"]],["5951611657527497619","🇮🇷",["Persepolis"]],["5229081081826814114","🇦🇲",["Ararat-Armenia"]],["5230984190425605282","🇭🇺",["Ferencváros","Ferencvaros"]],["5228851739163141373","🇵🇱",["Lech Poznań","Lech Poznan"]],["5226802773474975191","🇧🇬",["Levski Sofia"]],["5229238131600958310","🇳🇴",["Lillestrøm","Lillestrom"]],["5226575118733450362","🇳🇱",["NEC Nijmegen"]],["5226864453500312470","🇨🇾",["Omonia Nicosia","Omonia"]],["5226547678187395904","🇨🇿",["Viktoria Plzeň","Viktoria Plzen"]],["5231430239959166678","🇬🇷",["OFI Crete"]],["5204130921019646728","🇦🇹",["Sturm Graz","SK Sturm Graz"]],["5246748790576164836","🇧🇬",["CSKA Sofia"]],["5443056940924053273","🇷🇴",["Universitatea Craiova","CSU Craiova"]],["5247021538179329919","🇩🇰",["FC Midtjylland","Midtjylland"]],["5204034825421364210","🇸🇪",["Mjällby AIF","Mjällby"]],["5204139678457964829","🇩🇰",["AGF Aarhus","AGF"]],["5443106960113184608","🇦🇱",["Egnatia"]],["5442610058166838205","🏴󠁧󠁢󠁳󠁣󠁴󠁿",["Heart of Midlothian","Hearts"]],["5204441365550769294","🇱🇹",["Žalgiris","Kauno Zalgiris","Zalgiris"]],["5440759919399707870","🇫🇮",["KuPS","KuPS Kuopio"]],["5443152452406781743","🇬🇮",["Lincoln Red Imps"]],["5247088750122540592","🇧🇪",["Sint-Truiden","Sint-Truidense","STVV"]],["5440423992827616770","🇨🇭",["FC Thun"]],["5247059862172505530","🇳🇱",["FC Twente","Twente"]],["5271963422584501669","🇹🇷",["Amed SFK","Amedspor","Amed"]],["5370932165007673613","🇩🇪",["SV Elversberg","Elversberg"]],["5371032619997760375","🇩🇪",["1. FC Heidenheim","Heidenheim"]],["5370663527688209503","🇩🇪",["FC St. Pauli","St. Pauli"]],["5190663844904608184","🇩🇪",["VfL Wolfsburg","Wolfsburg"]],["5280846329780667217","🇵🇹",["Académico de Viseu","Academico de Viseu"]],["5280599455060494223","🇵🇹",["Alverca"]],["5283080588947913249","🇵🇹",["Arouca"]],["5280839831495145813","🇵🇹",["Casa Pia"]],["5283267106492679315","🇵🇹",["Estoril"]],["5280722875240715215","🇵🇹",["Estrela da Amadora","Estrela"]],["5280961555163280423","🇵🇹",["Famalicão","FC Famalicao","Famalicao"]],["5282818175036061819","🇵🇹",["Gil Vicente"]],["5280658510860814376","🇵🇹",["Marítimo","Maritimo"]],["5280874208413383053","🇵🇹",["Moreirense"]],["5280537611826395971","🇵🇹",["CD Nacional","C.D. Nacional"]],["5282886705534237079","🇵🇹",["Rio Ave"]],["5280504123966386349","🇵🇹",["Santa Clara"]],["5280778318973533665","🇵🇹",["Vitória de Guimarães","Vitória de Guimaraes","Vitoria Guimaraes"]],["5283022606889415243","🇵🇹",["Torreense"]],["5260552888479943606","🇷🇺",["Akhmat Grozny","Akhmat"]],["5260432096819710851","🇷🇺",["Akron Tolyatti"]],["5258002030093439398","🇷🇺",["Baltika Kaliningrad"]],["5258445670150341637","🇷🇺",["CSKA Moscow","CSKA Moskva"]],["5258398240826495030","🇷🇺",["Dinamo Moscow","Dinamo Moskva","Dynamo Moscow"]],["5260464618312075002","🇷🇺",["Fakel Voronezh","Fakel"]],["5258092005363322696","🇷🇺",["FC Krasnodar","Krasnodar klubi","Krasnodar jamoasi","Krasnodar tarkibi"]],["5258450519168420663","🇷🇺",["Krylia Sovetov"]],["5258378767444776405","🇷🇺",["Lokomotiv Moscow","Lokomotiv Moskva"]],["5260297449594981728","🇷🇺",["FC Orenburg","Gazovik Orenburg"]],["5402422388480582589","🇷🇺",["Rodina Moscow","Rodina Moskva","FC Rodina"]],["5260563282300797915","🇷🇺",["FC Rostov","Rostov klubi","Rostov jamoasi","Rostov tarkibi"]],["5260421904862314117","🇷🇺",["Spartak Moscow","Spartak Moskva"]],["5260460976179805062","🇷🇺",["Zenit","Zenit St Petersburg"]],["5384455608273502398","🇧🇪",["Waasland-Beveren"]],["5384295517662509811","🇧🇪",["Cercle Brugge","Cercle Brugge KSV"]],["5386319405036628975","🇧🇪",["Royal Charleroi SC","Sporting Charleroi"]],["5381985134494914585","🇧🇪",["Racing Genk","KRC Genk"]],["5384208493035158500","🇧🇪",["KAA Gent"]],["5384360234229725093","🇧🇪",["KV Kortrijk"]],["5384254397645619533","🇧🇪",["OH Leuven"]],["5386743314013776771","🇧🇪",["Lommel SK"]],["5384158800263542374","🇧🇪",["KV Mechelen"]],["5384482580668115361","🇧🇪",["RAAL La Louvière"]],["5384130857206316449","🇧🇪",["Standard Liège","Standard Liege"]],["5384128202916525896","🇧🇪",["KVC Westerlo"]],["5384283500344015129","🇧🇪",["Zulte Waregem","Zulte-Waregem"]],["5395619194643455562","🇸🇦",["Al-Ettifaq","Al Ettifaq"]],["5393276917048710386","🇸🇦",["Al-Fateh","Al Fateh"]],["5393541091897151315","🇸🇦",["Al-Fayha","Al Fayha"]],["5395803904006988082","🇸🇦",["Al-Hazem","Al Hazem"]],["5393437037724470460","🇸🇦",["Al-Khaleej","Al Khaleej"]],["5298732313062980062","🇸🇦",["Al-Kholood","Al Kholood"]],["5393204207547357406","🇸🇦",["Al-Okhdood","Al Okhdood"]],["5393558194456926649","🇸🇦",["Al-Qadsiah","Al Qadsiah"]],["5393171110529378103","🇸🇦",["Al-Riyadh","Al Riyadh"]],["5393470156217292362","🇸🇦",["Al-Shabab","Al Shabab"]],["5395668805810690714","🇸🇦",["Al-Taawoun","Al Taawoun"]],["5393571087948750489","🇸🇦",["Damac"]],["5393310121440876218","🇸🇦",["NEOM SC","Neom SC"]],["5393229139832513013","🇸🇦",["Abha"]],["5393596015938934875","🇸🇦",["Al-Faisaly","Al Faisaly"]],["5213281104030606563","🇺🇸",["Atlanta United","Atlanta United FC"]],["5213429598229898885","🇺🇸",["Austin FC"]],["5213434103650591596","🇺🇸",["Charlotte FC"]],["5212957169007207432","🇺🇸",["Chicago Fire","Chicago Fire FC"]],["5213427880242980249","🇺🇸",["FC Cincinnati"]],["5213405804111078874","🇺🇸",["Colorado Rapids"]],["5213216954399074837","🇺🇸",["Columbus Crew"]],["5213390771725544191","🇺🇸",["D.C. United","DC United"]],["5213391596359263164","🇺🇸",["FC Dallas"]],["5213093744672254765","🇺🇸",["New York Red Bulls","Red Bull New York"]],["5213166617382364991","🇺🇸",["Sporting Kansas City"]],["5212932077808264309","🇨🇦",["Vancouver Whitecaps"]],["5213286588703843635","🇺🇸",["Houston Dynamo","Houston Dynamo FC"]],["5212959415275103821","🇨🇦",["Toronto FC"]],["5211170965123247637","🇺🇸",["Philadelphia Union"]],["5212991219507929925","🇺🇸",["Orlando City","Orlando City SC"]],["5213356588080833477","🇺🇸",["Minnesota United","Minnesota United FC"]],["5213296102056404584","🇺🇸",["New York City FC","NYCFC"]],["5211147819544488468","🇺🇸",["Nashville SC"]],["5213236895932230526","🇺🇸",["LA Galaxy"]],["5211224557725166918","🇺🇸",["LAFC","Los Angeles FC"]],["5213122387809152889","🇨🇦",["CF Montréal","CF Montreal"]],["5213235452823217596","🇺🇸",["New England Revolution"]],["5213261364360914303","🇺🇸",["Portland Timbers"]],["5210990056805773036","🇺🇸",["Real Salt Lake"]],["5213192902582216990","🇺🇸",["Seattle Sounders","Seattle Sounders FC"]],["5212954634976504673","🇺🇸",["San Jose Earthquakes"]],["5212930806497945784","🇺🇸",["St. Louis City","St. Louis CITY SC"]],["5397580238056094701","🇬🇷",["Panathinaikos"]],["5188686381831981143","🇩🇰",["FC Nordsjælland","Nordsjælland"]],["5418001424569107718","🇳🇴",["SK Brann","Brann"]],["5334643951964031632","🏴󠁧󠁢󠁥󠁮󠁧󠁿",["Blackburn Rovers"]],["5409125612658922474","🇦🇪",["Al Bataeh","Al-Bataeh"]],["5364345682335399261","🇺🇸",["Major League Soccer","MLS"]],["5393451674973017912","🇸🇦",["Roshn Saudi League","Saudi Pro League","Saudiya Pro ligasi"]],["5363969112487786119","🇺🇸",["San Diego FC"]],["5409273544217496862","🇦🇪",["Baniyas Club","Baniyas SC","Bani Yas","Baniyas"]],["5406664055232438934","🇦🇪",["Dibba Al-Fujairah","Dibba Al Fujairah","Dibba"]],["5267166055784011483","🇮🇶",["Zakho"]],["5211071077068864850","🇮🇱",["Hapoel Be'er Sheva","Hapoel Beer Sheva","Hapoel Be'er"]],["5381946986595379814","🇸🇮",["NK Celje","Celje"]],["5438431325570758739","🇵🇱",["Jagiellonia Białystok","Jagiellonia Bialystok","Jagiellonia"]]];
// klub logotiplari ("Football clubs" maxsus emoji to'plami). Telegram ularni kanalda bot nomidan ko'rsatmaydi,
// shuning uchun faqat shaxsiy chatdagi qoralamalarga qo'yiladi
let CLUB_RE = null;
// 2026-11-21 (377-post: "Andrey ⚽ Santos"): logo roboti qo'shgan bir so'zli klub nomi (Santos kabi) ism-familiya ichida (oldida bosh harfli so'z) logotip olmaydi
const CLUB_SUF = "(?=(?:['‘’ʻʼ`-]?(?:ning|ni|ga|ka|qa|dagi|dan|da|tan|ta|dek|day|lik|chilar|chi|lar|siz|mi|ham))?(?![\\p{L}\\p{N}]))";
function addLogos(t) {
  if (typeof t !== "string" || !t) return t;
  // sarlavha va asosiy matn alohida: har birida klub/liga birinchi eslatilganda logotip
  const cut = t.indexOf("\n\n");
  if (cut > 0 && cut < 400) return scoreDigits(addLogosPart(t.slice(0, cut)) + "\n\n" + addLogosPart(t.slice(cut + 2)));
  return scoreDigits(addLogosPart(t));
}
// DAVLAT BAYROQLARI (2026-11-09, Bahtiyor aka): davlat nomi yoki millat sifati ("italiyalik") oldidan bayroq; terma jamoa logotipi
// to'plamda bo'lsa (CLUB_EMOJI, masalan "O'zbekiston terma jamoasi") — o'sha logotip (klublar bosqichida); bo'lmasa bayroq. Har bo'limda birinchi eslatishda.
const FLAG = (cc) => [...cc.toUpperCase()].map((c) => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join("");
const ENG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", SCO = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}", WAL = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}";
const COUNTRY_FLAGS = [["UZ", "O'zbekiston"], ["RU", "Rossiya"], ["TR", "Turkiya"], ["ES", "Ispaniya"], ["IT", "Italiya"], ["DE", "Germaniya"], ["FR", "Fransiya"], [ENG, "Angliya"], [SCO, "Shotlandiya"], [WAL, "Uels"], ["PT", "Portugaliya"], ["NL", "Niderlandiya|Gollandiya"], ["BE", "Belgiya"], ["BR", "Braziliya"], ["AR", "Argentina"], ["UY", "Urugvay"], ["CO", "Kolumbiya"], ["MX", "Meksika"], ["US", "AQSh"], ["CA", "Kanada"], ["JP", "Yaponiya"], ["KR", "Janubiy Koreya"], ["KP", "Shimoliy Koreya"], ["CN", "Xitoy"], ["IR", "Eron"], ["IQ", "Iroq"], ["SA", "Saudiya Arabistoni"], ["AE", "BAA|Birlashgan Arab Amirliklari"], ["QA", "Qatar"], ["KZ", "Qozog'iston"], ["KG", "Qirg'iziston"], ["TJ", "Tojikiston"], ["TM", "Turkmaniston"], ["AF", "Afg'oniston"], ["AU", "Avstraliya"], ["EG", "Misr"], ["MA", "Marokash"], ["DZ", "Jazoir"], ["TN", "Tunis"], ["SN", "Senegal"], ["NG", "Nigeriya"], ["CM", "Kamerun"], ["GH", "Gana"], ["CI", "Kot-d'Ivuar"], ["HR", "Xorvatiya"], ["RS", "Serbiya"], ["PL", "Polsha"], ["CZ", "Chexiya"], ["CH", "Shveysariya"], ["AT", "Avstriya"], ["DK", "Daniya"], ["SE", "Shvetsiya"], ["NO", "Norvegiya"], ["FI", "Finlandiya"], ["GR", "Gretsiya"], ["UA", "Ukraina"], ["VE", "Venesuela"], ["CL", "Chili"], ["PE", "Peru"], ["EC", "Ekvador"], ["PY", "Paragvay"], ["BO", "Boliviya"], ["IN", "Hindiston"], ["ID", "Indoneziya"], ["TH", "Tailand"], ["VN", "Vyetnam"], ["JO", "Iordaniya"], ["SY", "Suriya"], ["AZ", "Ozarbayjon"], ["GE", "Gruziya"], ["AM", "Armaniston"], ["HU", "Vengriya"], ["RO", "Ruminiya"], ["BG", "Bolgariya"], ["SI", "Sloveniya"], ["SK", "Slovakiya"], ["IE", "Irlandiya"], ["IS", "Islandiya"], ["CD", "Kongo DR|KDR"], ["BH", "Bahrayn"], ["OM", "Ummon"], ["KW", "Quvayt"], ["LB", "Livan"], ["PS", "Falastin"], ["IL", "Isroil"], ["CR", "Kosta-Rika"], ["PA", "Panama"], ["JM", "Yamayka"], ["NZ", "Yangi Zelandiya"], ["ZA", "Janubiy Afrika|JAR"], ["ML", "Mali"], ["BA", "Bosniya va Gersegovina|Bosniya"], ["AL", "Albaniya"], ["MK", "Shimoliy Makedoniya"], ["ME", "Chernogoriya"], ["CY", "Kipr"], ["LU", "Lyuksemburg"], ["BY", "Belarus"], ["MD", "Moldova"], ["EE", "Estoniya"], ["LV", "Latviya"], ["LT", "Litva"]];
let FLAG_RE = null;
function addFlags(p) {
  if (!FLAG_RE) {
    FLAG_RE = [];
    const rq = (x) => x.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&").replace(/'/g, "['‘’ʻʼ`]?");
    for (const [cc, names] of COUNTRY_FLAGS) {
      const fl = cc.length === 2 ? FLAG(cc) : cc;
      const alts = [...new Set(names.split("|").flatMap((n) => [n, newAlpha(n)]))].sort((a, b) => b.length - a.length).map(rq).join("|");
      // 2026-11-20 (CPU limiti): regex faqat kerak bo'lganda yig'iladi — matnda nomning boshi bo'lmasa umuman tekshirilmaydi
      const keys = [...new Set(names.split("|").flatMap((n) => [n, newAlpha(n)]))].map((n) => n.split("'")[0].toLowerCase());
      FLAG_RE.push({ src: "(^|[^\\p{L}\\p{N}])(⟦?)(?<![\\u{1F1E6}-\\u{1F1FF}\\u{E007F}\\u0003]\\s?⟦?)(" + alts + ")(?=(?:lik|liklar|likni|ning|ni|ga|da|dan|dagi|day)?(?![\\p{L}\\p{N}]))", re: null, fl, keys: keys.some((k) => k.length < 2) ? null : keys });
    }
  }
  const lc = p.toLowerCase();
  for (const F of FLAG_RE) { if (F.keys && !F.keys.some((k) => lc.includes(k))) continue; if (!F.re) F.re = new RegExp(F.src, "iu"); p = p.replace(F.re, (m, a, b, c) => a + F.fl + " " + b + c); }
  return p;
}
// 2026-11-21 (387-post: "Osiyo [UEFA logo] Çempionlar ligasi Elitasi"): Osiyo/Afrika/CONCACAF Chempionlar ligasi oldiga UEFA logotipi qo'yilmaydi
const NON_UEFA = "(?<!(?:Osiyo|AFC|CAF|Afrika|CONCACAF|KONKAKAF|OFC|Okeaniya|Arab)\\s⟦?)";
function addLogosPart(t) {
  if (!CLUB_RE) {
    CLUB_RE = [];
    const ALLN = CLUB_EMOJI.flatMap(([i2, e2, ns]) => ns.map((x) => [i2, x]));
    const rq = (x) => x.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
    // 2026-11-20 (CPU limiti — "sovuq" ishga tushishda 700+ regex yig'ilib, bot Cloudflare tomonidan to'xtatilar va post yo'qolar edi):
    // regex faqat matnda shu nomning hamma so'zlari bor bo'lsa yig'iladi (bir marta) va keyin qayta ishlatiladi
    for (const [id, em, names] of CLUB_EMOJI) for (const n of [...new Set([...names, ...names.map((x) => newAlpha(x))])]) { const mk = () => { const pre = ALLN.filter(([i2, x]) => i2 !== id && x.length > n.length && x.endsWith(" " + n)).map(([, x]) => rq(x.slice(0, x.length - n.length))); return new RegExp("(^|[^\\p{L}\\p{N}])(⟦?)" + (em === "⚽" && !n.includes(" ") ? "(?<!\\p{Lu}\\p{Ll}+ )" : "") + (pre.length ? "(?<!(?:" + pre.join("|") + "))" : "") + (/ampions League|empionlar ligasi/.test(n) && !/^(UEFA|AFC)/.test(n) ? NON_UEFA : "") + "(" + rq(n).replace(/ /g, "⟧? ") + ")" + CLUB_SUF + "(?!\\s+(?:Futbol|Miami))", "gu"); }; CLUB_RE.push([{ mk, re: null, tok: n.split(" ") }, id, em, n.length]); }
    CLUB_RE.sort((a, b) => b[3] - a[3]);
  }
  const used = new Set(), keep = [];
  const out = t.split(/(<[^>]*>|https?:\/\/[^\s<]+|@\w+|#[\p{L}\p{N}_]+)/u).map((p, i) => {
    if (i % 2) return p;
    // har bir eslatishda logotip (Bahtiyor aka qoidasi); nom bir marta almashtirilgach qayta tekshirilmaydi — ikkitalik logotip bo'lmaydi
    for (const [R, id, em] of CLUB_RE) {
      if (!R.tok.every((w) => p.includes(w))) continue;
      const re = R.re || (R.re = R.mk()); re.lastIndex = 0;
      p = p.replace(re, (m, a, b, c) => { used.add(id); keep.push(`<tg-emoji emoji-id="${id}">${em}</tg-emoji> ${b}${c}`); return a + "\u0002" + (keep.length - 1) + "\u0003"; });
    }
    return addFlags(p);
  }).join("");
  return out.replace(/\u0002(\d+)\u0003/g, (m, k) => keep[+k]);
}
// o'yin hisobi (masalan "2:0 hisobida") — Inter Futbol tablo raqamlari (o'z emoji to'plamimiz), doim bitta qatorda
const DIGIT_EMOJI = ["5420146374186414878", "5418051211830014252", "5418091043356736160", "5418293933316814692", "5417974538073845867", "5418029148583014556", "5418224243177464873", "5418223160845710447", "5418075968021509456", "5418334542232595303"];
const COLON_EM = `<tg-emoji emoji-id="5418120085925570966">⏺</tg-emoji>`;
const digEm = (n) => [...String(n)].map((d) => `<tg-emoji emoji-id="${DIGIT_EMOJI[+d]}">${d}\uFE0F\u20E3</tg-emoji>`).join("");
const scoreTiles = (pre, x, y) => {
  const line = pre.replace(/<tg-emoji[^>]*>[^<]*<\/tg-emoji>/g, "L").replace(/<[^>]+>|[⟦⟧]/g, "").split("\n").pop();
  return ([...line].length > 20 ? "\n" : "") + digEm(x) + COLON_EM + digEm(y);
};
const scoreDigits = (t) => t.replace(/<b>[\s\S]*?<\/b>/, (l) => l
  .replace(/(^|[^\d:])(\d{1,2}):(\d{1,2})(?=\s*(?:hisob|-hisob))/, (m, a, x, y, off, s) => { const pre = s.slice(0, off) + a; const tl = scoreTiles(pre, x, y); return (tl[0] === "\n" ? a.replace(/\s+$/, "") : a) + tl; })
  .replace(/([Hh]isob\p{L}*\s+)(\d{1,2}):(\d{1,2})(?![\d:])/u, (m, a, x, y, off, s) => a + scoreTiles(s.slice(0, off) + a, x, y).replace(/^\n/, "")));
const noLogos = (t) => (typeof t === "string" ? t.replace(/<tg-emoji emoji-id="5418120085925570966">⏺<\/tg-emoji>/g, ":").replace(/<tg-emoji[^>]*>(\d)\uFE0F\u20E3<\/tg-emoji>/g, "$1").replace(/<tg-emoji[^>]*>[^<]*<\/tg-emoji>\s?/g, "") : t);
function naBody(body, logos = false) {
  if (!body || typeof body !== "object") return body;
  const b = { ...body };
  const L = logos && b.parse_mode === "HTML" ? addLogos : noLogos;
  if (typeof b.text === "string") b.text = newAlpha(L(b.text));
  if (typeof b.caption === "string") b.caption = newAlpha(L(b.caption));
  if (b.reply_markup?.inline_keyboard) b.reply_markup = { ...b.reply_markup, inline_keyboard: b.reply_markup.inline_keyboard.map((row) => row.map((k) => ({ ...k, text: newAlpha(k.text) }))) };
  return b;
}
// Telegram entities → HTML (nashrga chiqarishda matnni qayta yozish uchun)
function entHtml(text, ents = []) {
  const open = {}, close = {};
  const tag = (e) => ({ bold: ["<b>", "</b>"], italic: ["<i>", "</i>"], underline: ["<u>", "</u>"], strikethrough: ["<s>", "</s>"], code: ["<code>", "</code>"], blockquote: ["<blockquote>", "</blockquote>"], expandable_blockquote: ["<blockquote expandable>", "</blockquote>"], text_link: [`<a href="${esc(e.url || "")}">`, "</a>"] })[e.type];
  for (const e of ents) { const t = tag(e); if (!t) continue; (open[e.offset] = open[e.offset] || []).push(t[0]); (close[e.offset + e.length] = close[e.offset + e.length] || []).unshift(t[1]); }
  let out = "";
  for (let i = 0; i <= text.length; i++) {
    if (close[i]) out += close[i].join("");
    if (open[i]) out += open[i].join("");
    if (i < text.length) out += esc(text[i]);
  }
  return out;
}
const naNodes = (n) => (typeof n === "string" ? newAlpha(n) : Array.isArray(n) ? n.map(naNodes) : n && n.children ? { ...n, children: naNodes(n.children) } : n);
async function tg(env, method, body) {
    const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(naBody(body, body?.chat_id !== env.CHANNEL)),
    });
    const res = await r.json();
    // adminga ketgan ogohlantirishlar KV alertLog'ga ham yoziladi (Claude kompyutersiz nazoratda ko'rishi uchun)
    try { if (method === "sendMessage" && body && body.chat_id !== env.CHANNEL && /⚠️|❌|chiqmadi|ishlamay|uzil|javob bermadi/i.test(String(body.text || ""))) { const L = await kvGet(env, "alertLog", []); L.push({ t: Date.now(), ok: !!res.ok, x: String(body.text).slice(0, 300) }); await kvPut(env, "alertLog", L.slice(-30), { expirationTtl: 14 * 86400 }); } } catch (x) {}
    return res;
    }

    function keyboard(hasImg, article, video) {
    const v = video ? "v" : "";
    const rows = [
    [{ text: "✅ Chop etish", callback_data: v + "pub" }, { text: "🔄 Qayta yozish", callback_data: v + "re" }],
    [{ text: "✏️ Tahrirlash", callback_data: v + "edit" }, { text: "❌ Bekor qilish", callback_data: v + "skip" }],
    ];
    if (!video) { const r = [{ text: "🔁 Rasmni almashtirish", callback_data: "img" }]; if (hasImg) r.push({ text: "🖼 Rasmsiz chop etish", callback_data: "pubnp" }); rows.push(r); }
    if (article) rows.push([{ text: "👁 Batafsil maqolani ko'rish", url: article }]);
    else if (!video) rows.push([{ text: "⏳ Batafsil maqola tayyorlanmoqda…", callback_data: "art" }]);
    return { inline_keyboard: rows };
    }

    async function sendVideo(env, chat, text, url, markup) {
        const body = text + `\n\n▶️ <a href="${esc(url)}">Videoni ko'rish</a>`;
        const r = await tg(env, "sendMessage", { chat_id: chat, text: body, parse_mode: "HTML", reply_markup: markup, link_preview_options: { url, prefer_large_media: true, show_above_text: true } });
        return { ...r, usedImg: null };
        }
        
        // 2026-11-17 (Bahtiyor aka): iF belgisi QORA FONSIZ (faqat belgi, ostida yengil soya), hamma rasmda bir xil o'lchamda — eni rasm enining 12,2% i (card.py paste_mark bilan bir xil)
        const WM = "iVBORw0KGgoAAAANSUhEUgAAAbgAAAG4CAYAAAA3yvKzAAA4W0lEQVR42u2dW4wk53WYz6mant6heVeiBEIekqcY8EOe4gfnwY+BYSTWQxwj8Q2SHdsxDAMJIkFRrNiyLpZlipKii5XIoOA4diQ7lGUksmCJoizeVhQlUhQpUiR3l+SS3CWXe+Fyr7Pd9Z887Cw1O+yqOv9ff/Wl+vuAwc703Hq7Z+qbc/5zEQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASEd5CHguEzAebgDgogjr9lwhPwDgoglr+1wgQQDgosrjj+wAALjA8pgjOwAALraDfZx1IAJCdgCA4NbosdU1jcKQHQAguIE9pkraEdEBAIIbwmOpS/q8LpukEB0AILgVeAx1IM+byXxFheQAAMEt4eOnSy7QeQsI0QEAglsTsemKPH+5JWZIDgAQ3Go9ZjrHj8n93FoPH9+X7BAdACC4OT1eXaWlKx7B9f1+JAcACG7JorZUcekKNHpbwufmFh2SAwAEt4CoTXu+Pefz2zWVaDI/CSI5AEBwCygMySEvnWNBSh+Rmi1AdEgOgIs3LIHcvFLTHgpQckVHlii1GPkhOQBAcAuWW06x9SU6WaDYuooOyQEAglsSuWnmt2PF15fgLPPbfYkOyQFwIYeOBRxd5Zb6vr6f165y60OECA4AENyC5JYqti6S057O4GIFZ5k/rqvoEBwAF3Mej4SPiY3acr3eV1SXetZmEULLGe3NYxwYACC4QT8eKXKrE1CMzLyyk4zncrkiNkv42D4lh+AAuKDzeGSWW4q4Yj4nNV2ZS3IpUsstPQQHAAiuh+kjsSlJ7fi+1AKUlDO42MjNOr4PyQEAgluS1GRMGtIjtFT55Y7iYs/SzCmz2K8TIzwEBwAILlNqMkVuXf9NPZ9LieBiJJfr37b3SYczOgQHwIWd/38HuaXKK7fwckZwMWnJeYivq+QQHQCCQ3AdhZYiM89te29Pjeb6jNpS3zcvySE4gAGzwUOQRX6edGCMwGI/p02wsSlK3fM+3fN60797v07szEjP14/5uorIABAcpAmtLbLyRmpdJdelV85ahJMinxghWc196kOiAIDgkJl0nzsZE6nFvK9Nom2RnEY2TXvkpjMqJL0RmzhF6REoEgQABJcxdZkiH4/gukgupnXAHPKRhrO0OgnFyqUpYmyK7JAYACC4HlOTbVHULFl5hJYS2eUS3Czp1EVtu19PjeLaojrveRuyAwAE13HgclNpfkq6sUlwbYL0nsmlCE4ahCYNEZxXdh7JxZzLAQCsreBS1t14qyq1RXRNcvNKLSZ1mSK4uvTkXqFYhgiuSXLSci7XVnyy9+vIDBHTMgCA4Na69y+2HF+dVZW1L0VRpMrOG2HG9L3Via1VamamZmYiEjpWU7alLInoAIAIrudUZV0xSdPtr3sJIajn4yL66FIEN0tsUiO1Kx8XasRXSPy+NnVEc/TBAQCCyxDVeUvvZ0nNFbWFEPRHfuRHNm677bbfMzNT1UK6LzTVDGtyJGYPWwihKoqieOyxx+5/y1vecntRFBJCkMT74RWdR2YIDwDBQaaJJt5ITK/I7Prrrx/96I/+6M8O4cHb2tq6XkQ+nzjJxCu6pjYFAEBwIHHTPzyVkt4ztKteptOpVFV1aScKKpd4lmitRKqqmpRlOTp37twrjvvZNgVFOjZvIzwABAfOi2XM+Zw4qipVLp9RXYnktCzLTVWdFkWxss9RWZabO4Iu5PLZnLewpE1+RHEAgOAyRXJt51upDdtt0d46/FGgEYUmHokx3QQARHb+sob0doG2XrMuL0N73Appryhtu00iBl4DABEchSKS71zLI6iY87qhRW/a0qqgCY3gff2MEPkBEMENXm4xvW5EcO3i905lSTnTlMh5oCwDBiCCW0v5pU480YQCkyEKzrMzL2Y9EfMnAYAIbkmqKWO2AQw9gitqzuFSIqqUBa8AQAQHiRNMvAUnnqKKYsDpSWsQlbU8zubob/P0zwEAERxCk/ixWLEtA5zBxZ2RNf0x4U03E+EBIDhwrsMRSd8ft66CE8fKH2l5THKcnw718QYAIUWZS3je5m6JWGq6LnKTlrSlJyXZVHQyr4IUJCnzGQMHgOCWq4cuZU7lUCO4mMWl2jCE2SLP3VLO5JDWau1tRKKA4DItPo2J7mK3DsgaCK5Jduocwmwt0V2M7Gj05hqACBHcWmwK6HIe1/a+dWwTiFnQWhetNUnOIztLuM9c2EAitmGAUGQyxIbwps3ZnuKJdRZcbFN4SmQsEreYFqDrOTMQwa3FhgFJaGgeeprS9txmDZGcOLcDxJzncQYnFKbM6Q9iojsEtxJRW+ykjbaIZB0iN2mQmtZIrq54xJu2TJWdknpau3P1RVTX8jOF4AZTuaWO6GydJKc10pMZkZynYnLWeZ1EnMfxlza/7/MWID9zCG6Qk0+8Zz9DP4MzR/tA1whOauRIilJIUXZ8/q2Hr4/oENxS/YXnHSnlSXWu2wF1WzSXGsGJs6pSWzaHk05ajwyMLVHKkYpdBLc253rrUkXpOauzlnM6cUw1qZOlJ11EBDfciE0zfV3NfH8QHYJb+F4z7yDmtiWp63Ixbfr/pkRw2rInru79RHCcmXueV+34eUY0h+DWdcpJzMV/6PM7LUMEpxEVlURwRHQ5BNb2sV2jOiSH4AYrz6GnJ2N747pGcFJTbNLlgon4ljMNqT08r5ZJdkzSQXCDi1DaUpZtact1mwgjDYUhbT1t0jLmS2a8bUhrLVp3rEMEpxGyyy06zuUQ3CCnnK+D6JpK+2MiOGk5X2vqk9OOER6sRsSnieJLfX8fokNyCA5prnAfnCVEcE0izJGiRHarJzSN+Jy2lGSq0LxRH5JDcLBmsrOICK6tclIazuRgGHJLOVPVRKlpQuSmSA7BEb2tZ9SgDdWT3kkm4jxrQ3hEedpReN5Wk1gBxlaAIjkEByty7iYtrQN147a8okNmyE073O4d0u0VnSEuBAfDk5s5zt2kYaN3itwAusiwrTjJI7o+JIcMEdzKHpLbGqcomyI4TfhrnEKhYY/dSr3Q11XiauLbbdsrJGLDPJJDcDDgKE8dvW1dpKYZplAgs/n8gWAZZkF6ROCRlzddLhHiQ1AIrte/FJVNxAs5g1PHbjerWUWUWu6fMn8Qka2W9NQpuVyRX93Pqjm/b8pZHSC4FTewmU2n0+0QwrQoimoV/w9VVU3MLFRVNY2cMVmXitTMqUhtuBCRmlzeP/pyRGxdi1LMOZDAIz1JOKtDhAhu6Xt0an8wR6ORbmxsjEVkvLI/WJfvv9x8881vikxPWqYJI56UkjonVSCx5YzeYqsdLfNZXV1Ppjh3GebKPCA5BLf0zahmZoWIyLPPPjt997vf/bNmpqp6Jcopahak1s23jF3z01Twsvvfutt2v0gIoSqKQl944YUTO/+5poWwFlFo4vllTzn70MhqN1j8lJLYcn1NFI5XdNbheyIqKr96G/Db9K82iGX3yxUBFTsvuuffvS+zbi/33F7WfJzOeFtnvN402LnpgtIkrzDj7eB43Zzvm/U9rty29z7JDKFZg6z7uIggu/mfR5vjdnO8L/Y2z/vMcX+899P7mCBGIriFjQeqE0htnl9VpSzLKxf1YlaENONtzy+ON3rb+z1Cg/Dqoju7EpZWVeUdrGyJBR/qSF9pSzrU5rwHEOLTwTGTRDyRVNttbdcAaxkArpkiOU0srkFwPATZJZajyESm06k6osamSLMpbanOFIw4or+671vsEnSokZq03K/YPXqWILumNG7MGRyi6zdys4ifW88ZWR9yMEdFsGUucgIEN7foTNe8nUAjLiQaecamNWdtGrFOJ0ZE6hQcYpuf4MRxZqyOM7Kc6WprqQS2BJkprQMIbu2qK5d8cHDTL2Vda4BENHEXznU5mrhCBcGttuBS5KYJ8jPHVgvv18yZqkSACG4lU5yWYYbeMk0oMWmv7NQOU0hy/N9VSEcum+g8gpOGs+6958OxAopNm6ZEdF0lxQZwBDeIGXxeiZkjmppHmlIbzvRm/SWskd8nt9hzCU75+c32NZtus5YCk1ly6ZJC9GZWUqNEojIEBz1FmpbQQG0t8rGWrdwxxSbS0jNnHSM57eF9kCZFk7g+zSbptUkuJpry7Bo0Z49nrGARI4Jb294g7fksLaW4RBxN21az1HT35wWnxDyRYqykENvypCY9acm66G1vO0uuVGGOyk2khOBAFl840hbJacPSUWuZGtIki6LhL2PvNuUYgeWQGvKLT2Oa5BfcrChu1tu5U5Sp1ZyaMLuSKA7BMXFmQWLUlkns2jBuq+1rmWPkVpPgutyGxJY7cqsTm84YVDBrzFusLLpGhtrTAGkEB0tkhx9MMmmcEtLyCxqz82zWxaTp+zVNUbnq481MqqqSiK0Br7+zpZqKqDUPtfWOYxOnECWhyhP5pe9zs4gVN5qQtreaTfIesbUVvahV5t08IJkqOAHBrey6nJhJJntnUM6aWlK0XOy9v2DFjPFdu9+3e7TY7tdji0iuug9WWWntf8HXRWoxqca2z2Nn3PwrJj0DwD2DwZv+UJslNEsohtGWn0vEheDWN/2oqmJm+sY3vjG8+c1vfuOubQLFro8rpH1sl8yQmkcwnuGze28Ps962y3dejh07du4LX/jCxSv/t9himGKk9g9//O+8odzU0kKSTlKkRJvA4s/eYtsEYtOXrdkH120moRzpxqE7jz85OVfZLn21rexpq6xklQ6T0LNvE5CWOY4eyTRtE6jbLFCISFGWpVZVVf7Yj/3Yxr333vvAEB78J5544us//MM//K6iKCyEYA0Dm6++kFz+1bTN68rw05/7p9/ZunFDwtRQBiwNoTIZ3zCSA3/z0ie+9ltP/NdQmYm1DiNvE2fXzQNsGiCCW+gfBa2fP5lMdm/03ljVjd5lWY5Onjz5YuS8yav/mjWx7dOTg2LhH4SpBFUr+BGERUejZlqVm0Vx8uAr9//tu5747Rl/fGnLwAUiLAS3npJUVdnY2BiHEMpVFZyqFmVZjsqy3JgRAcdN6S91XGwUYzELUiiCg0WrLqjaVEvdvOf3DvxcNTHVQsRCa+SkHYpOSEEmwMWif2nFzFzUgT82Mctj9y5uBZDlSE2GS5vXjTbv/+ihf3bywLlJUapamPm7POuMHIjgBiG52EKFmM8dYlq3qQcIYDnkNg0X9924ue+Zvz1x65NffOmQlirhBy0C6jj7oqoSwSFGWd9zy7ZGboDFyC3YdLRVbp55/vzD93/k0IdUVSxYzCzXGJnRG4fgBiEuXZPHoK8ByAAyj3O3QqQSsXDvLYd+5vyJS6KF6k6TjHehbuxILhDO4JahQlJp23BLLvaFn1FYhtTkZN/Nm+Pv/umRnz/64Olzl8/dTGoGe+c6s+ePOyK4lYzkdE1Sk6n/t7531gH4g7cQLo1vGI2f/+Yrf/rIn72wX0vVEMwaqoJpwEZwg7ggd5lC73l9aFsJNOE5CPw4wuJCNwnFRlFcPHXp2fs+eOBd1aVQaKFhZxRB09xJcYztQnhCinJVpqHkqKYccopSSVHC6s2FDZPRVrlx34cO/aszRy6Klq8VlsRkYWgTQHCDl2LbL4QO+JfB2/dW0D8ES3Tutr3vps3xI3/2wi8dvufkqaJUs8o08x+p63JMIaQoVzuiU4fU6iSmA09PdhEVv/SwgJYAmY5+aGN84vvnvv7QZ567S1UkBLuyMaNu4S4VkQhucBFZX1M+1vlc0xAcLPLcrSzNwqWw/fX3Pvlr1aWgO8ugLGKsVk7JIUwhRbks47gkIYpbh164lP12BYIDmX/V5GR0zWj0jY8c+olXnjlvu/rdukwnAiK4QawIakrJedfzKI85h/OwgOBtErb3vWFzfPDLx//gwN+8/FLxg1Fc3uHIMfvdiMwQ3EpFax6heaO7oT6WFjmfEsHB/EZx/dDG+PTT5x944GOHPqOF6k7FpNW0vMxLTkgQwS0k8qhbiBojsXWQW9MGcUVwsBTnboVYqOzCfbcc/PULpyalFnq5ndsXhRGNCWdwq3Tx7SOlGSs3XZMzOHG8H6DXc7fNa0ej73zm8C+++PCrl7RU2xnFRRk/ERxIcz9bSmQ3xMfEM83EZPhnkrBc+90m+27cHD/99ROfePSzR54qSrXwg363PqMyIj4Et7QrXSSyeqpJfOuQprQZZ3EambIEyBy5SSg2Sz1/fPu5b3786T8SFdlZXrqIcVoIT0hRrvK8Sk1oAh96ilKcKUyAHkZx2fZoX7Fxz+8f/LfnXtouVNXMbJnkg/QQ3NKc1aUOUx56k7c4pCYIDmTOLQHX3Ly59fAfH/7lF+4/dXHn3E0TBWQ1QjIEhuBWeZqJdtgYsA6rc5pE1iZ35Aa9nbuNbxiNn7v35P/87p8ceVgLl9wsUky55WXIEcEtQ/O3SnfhrdM+vLooDsmB9HHuVo4KuXRu+ur+Dx/8WDUJl8/XbKZQLCIKixWgdPw80psIbmn65dp659ZhJ1yTyJAbzMtwk9E1G6NvfPjQz5w5ul3uit68MrMWgVjD53mlQ3SG4Ja6Ly6m0nIdIrgmmXs2MQB0d1sVJuMbNsePff7oOw/dcfyVmnO3WSKyBnG1CcmTWuw7nYngoFME5TlD8p7XDT1FmbINHaD7EOUf2hidPHB2/7c++cydWqjJ5WZui4i62tKR5pCiREZzCAzBLe2G77bCFF2T0VSe/j8hRQnS0yguLVWqSTi7/9ZDb6suheJyl8BMIVlL1NVWMdmHvAz5Ibhlllxb9DbkaM7b/0eKEnqL3sbXjkYP/o/Dv3zs0TOmpYZdqUmrkVvd2+L413v+FpPaRG4IbunO7LpEd+uYpgTIfu6278bN8YGvHPvwY7cffb4oNVhlnoiti9zavm7sOR5yQ3ArIT91pCWH1geXUm0KIBlW4FTlvo3y5DPnv/WNW5/+C1WxEEwaIre6c7emqG7ePXKIDMEtdDalJOyVW5foDbHB/H7wzKblphb3f+TQf7p0dlqIqu10vLWlJM0RxTW9P6YC05PiRHoIbqklp+KvvFyHikrSlND7KK6tN4zHD/7R4bceffB0tXPuZo7IrUl4dalJT7FKjj44RIbgllJyubaEr0OqEkC697uNxs/edeKPHv3fLzyphQYLJk65tUmtrtnbK7CYdCZCQ3ArVXjSFs0NeVQXYoP+IzezSjfLYvv05OX9tx66LUxNRGxvajIkyq4pXdl2tpeSngQEt3TVkouYfznYP8Z5CCDqFyvIdLSvKPd/5NAvnDu2XV6O3lqlFRJTlXWRnae5mzSksPB0ldOV3mgO2TU+SBbEJJiKqUngEYGaH5QiTMP2vps2x4/9+ZG3P/O1E2e11Moqyxm15Y7e2B6A4AY5xkvWrLikadN3yy+4llJIoYE/BaCBSsL4utH42CNnvvTAHz5z305RieyRW9jzumV+iZWVp1G8j4ZwBAfZ04u6xqlLdfxFOjN9Y8GmoZLKKgumSlodZvxwhaCFysVXJsfueu+T7wlTU738ExdaUpIh4VxOHM3hMQObhRQ+ghuS5EhLOn9tJ+er8ku/+ei/02LmL7J3z5x3VFjb2LDYsWq6gmeY3kjBe5bkKa339KHNEtRV0ZmqhsnFSi6emhSiEsxeJ7FQI7HQY/TmGdg8j+0CCA7mXnxCWrLlQmpB5Nyx7Q1Hm0WdhHZHfIX4tqq3TZtZJcHlOPuRyAn6EnFuZQlis53n8srruvP65X9VgsyWm0XcFiRuykmOszcjekNwQ9wIPvSoTrucIajO/EtX93x+MeNr6q6/9Pe+bru+hjXctvd1rbkfumIXoJSLbYrUJEJsElnhOFNIVi+3Nsl1LT6JqZyMid4QGYIbTCuBkpy8+nWz6AZ5TXzdG6XpEj6XlvhzZgt6Xtum7seU9cdEZLPSlMH5fSShlaBr9IbcENzge+bWsc8tZiKENtze9LpGXEDqhKBLfiGyjM+Bd/GndwKIdUhRhpbb98rOIzVPVJc6pDlmCwEguJURHbLr5wKtDUKrSzPOktvez5EZn1snzbZozVZIdrGpspR0pCQIIyRUQMbILiVVKc5qSukoMGSH4JDdmk4sqTs3axKeNMjNIs4NvTLTJX4MTdLP3dpE55n0kZqOzCG5nK0CbdWSnu3fyA/BIbs1kpx3Np/VRFttqczYCK4umluVCK5L5OYRXFsUlystmXIG11VkKW0CKYUlVE8iuEHLDuF1/6XXhrSkV1qzoro2Ga5SBBd73pYquNxpyTZBpUjOG+GlNn+3RWdG5SSCo0AFpEY6bRFgm9is5jyvLaobSgTnmiSzgJSkOUSWS3hd5CYtW7+94oqRG+JDcDBAsc260KojPdn2NZu+lkVEY7ZELR+5U5IpvW199LpZorSC82vFys2cURvVkggOoNeLgbVIpyl92STHVW4F6Cq2RURtfYqti9zaIjhv6pLoDcEBuIpM2tKZsbe39dwt4068ruX/3v426dA3FiIbuj3CSonaJJPc+ngukRuCA1KZ0RFWaopTHGKzJYvqYs/c+p4r2bW4pKvULGLuZIzcUlfgIDEEB5D1TE/XpKewT7n1nZLMHa2l9rt1lRupSQQHIMs8GHsIcus6naSr4EJC9NZVgqn9byK+Ju++5AYIDgZtpELNMTVSJb6RVgd2cckxU7KvyK09RahiYmIWLNc5XNembnH0u3WVG2dvCA7WaBfc6xqtLVjRUIZvLfvaCufeuLZ9cG29it7bFn1Ri0nRWsPA6pjvZ873WWKfWl9LTFPTkrl2wCE3BAdDpthQ+fv/5AYrRqpmjY3xGtl8rTMusOrYGrCIdTk5Rzs1XYRjZ002Nd5f2b9XzpDC6ysWzawo1abboTr64OntyAZubwQnMz5GxD+dxCs3b5M3AkNwsJYR3s5rG1tF9ePv/sd/vXXjRhmmxpyXgWKVyb4bRvKN//b0Lxx98PQjWmhlwaTDeVuQ9DTkPORGahLBwRpJbfbsRxO5dHb6fFnam8LEghSv29wNK06YyPa+m0bXPv75o+9/+I+f88otV1pSanrgpIPcchb+AIKDFTt/i1o4qoWOtChGWiC4wckt2HTz+vLa04cvfPsbH336c6oiZq+TW+hYxBKzAaAteouVXMq5HCA4WPHikrbiBeVCIENvaAiFSlVdssnd73/qVy6dnV6umL1cRRk6jPGKmVIijt632Ikv0lPRCUTCX8OwTH1obVWOMCCqqW3vu2lz/N0/ee6tx79/ttJSg71ebk2vt7UehISVN7GTW5AbERxAUgoTBltUEiZbN422nv36iU9978+PPLYjN+mQggySr6/NUyiC3IjgAGZGb3v7zdTxsTAQgtm0GJd65uilx/d/+NAnw9REgolY8hSTHH1ubdEZckNwAO7UZJ3U2nrbYNV/EIJUo33lxv4PHfilc8e2tSg1mPUypDlltJi0FJdQUILgANxN0hp5O8hqpybHN47G3/uLI//hhW++cl5LtVCZZJZZahWlRERwTW933dMHCA4GKjciOBluS8Domo3RsUfOfPFbf/jM17RoPXfLLTDvWZw1iMvbwI3chCITWG/pWcNtSG5QdpNQbKhculCdveu9T74zTE31cilR7NDmGDnFFpXELIFFbkRwAK5UZFPRCYIbRPQWJqOtcuO+Dx78yTNHLhZadD538/SueTcBSETqsu28DbkhOKB6slVk9MANZhRX2N66aXN84EvHfvfZu06c2dUSIBJf8JEyV7Jt5FasrLoUkyA3IUUJ65mu1IbVLrCqo7iu2xifePLc3d/8+DN/qYVag9xSUouxZ3BdFpJ2SUkiNyI4WLMUZdsuNqK4VT93K6SaXKheveeDB/7jpbPTH5y6pUVhuYpLxDFnsq3pOyYlidwQHKxhilIaqiaR24pTVba978bN8Xc+8/xbTzxxNhSXU5PqjMoksiikTj7eVoDYzdsxwkJuCA5oIXjd+RySW9XgbWcU19NfPf6Jxz9/9OmdfjfNlHLMmZ70nMl12e2G3IQzOFivvW+zztisYTccrFq/27gsX33h4iP7P3LoNjPTPe0AXZaJeiQnkWtuvLvZWFpKBAcQ1SIgNREbEZys6AockUoLlfs+eODXLpy4VGih4bWTt7jKxtQUZWyBCXJDcAC9nce1yQ5WKDU5vnE0fvC2w7949KHTk6JUs8upSY94YmZF5orgupzzScfCE0BwMCCxeeQmNHqvaPAWwmTzutH4yIOn/+rRz77wlBYz50zGRHGSOPOxbShyzkiNqA3BAXLrFMnBqoziOjM9cff7nnqfBTEza5JP1xRlmzRjxNlVXERtCA6QnCuSI0W5guduJqEaXTMa3fP7B3763EvbTeduKSlKaelv80ZwKQ3ebQUoiA3BAWJzRXJNO+JgWYO3aZiMb9gcffd/Pf8bz9178kJRqu30u4nETfaXhJ1snr63lNQkS0qFNgGAmBYBmdEuQFvAiu9327x+NH75sTNfeei2w9/WQi0E84gt5vzN+7U8mwC8Z3iIjQgOoHMk50ldwrKeu41UJuerU/fdcvB3wtSujOLyrLeRyO3a0iA0z8gtbzFJ0+3IDcEBJEtOkNwKRW8WJqOtjdEDn3z6LSefOie7tgR4ozbvlH/PdBFJlBjSQnAAvbYLNO2FQ3DLee62ve+mzfFTXzr2/qe+eOx4UWqwykTSBybHnL/FRoZdV9yAcAYH4DmDa9vujdCWXW4m1ca+jdHpwxe++61PPfv/tFCxED0+y7PvTZznbDk2aSM7IjiALJFb29tEcMt80bAwlVLs7vcf+I2Lr0wKEbGdpreUiM2zQUAkrvdNpHvvGyA4gCyiEyaXrAY2Ddv7bhqPv/2pZ3/+2KOvhj3nbl6Zxa7JiVmP08ecScSI4ACyTTph4aks57nb5g2j8cGvvPzRx28/8tyec7ccC0o9ac2m9KdIfHM347eEMziA3GdwbWdviG3Jzt3KcVFcPDE5ev9HD33OghSidrlZII/gvGdv86yKRG5EcABJqUmPyIjglubczaYb43J0z+8f+LkLpyaFFhrMOsvLOz7LE7m19b3FNnUjNwQHkEV0itiWewXO5vWj8cN/8vy/f/7+U5d2zt12i2ZvFBcyR3Mxe99yVE4iNwQHkP3cra0ABRax3+260ejF777619/5zHOPFoVWu4pKwh6pBene/5Zy9pYyWJm0JIIDWHjaEsnJova7SShGZbH96uTYN249+D67XC9pYq8T2yz5tH2MLPHZGyA4gE774MS5ZQAWZ7jJ5lZRfvPjz/zSqUPnZU9qcnfEFiLE5j2XW9TZGwhVlACpkrOEtKUse4XhsApKREMVJls3b44f+8ujv3Xwyy+fLEoNobImic3r3K3PszdAcADZojlb+YhNRUabRTmswM1kc2tz/NKjZ778wMef+aoWIiGYR2hdZCcJ8kuN3gDBASxsRuVKRG0bm0V57sULT971vgPv3zOLMWaKvkRO8vBuuRZpH4cVZn8vs2KjsLNHL1bVpaCqr63ACTUiC5K33y1lW3dXqSFBBAewkNTlct5xFZlu25nj3z97za7/Q9glD5G8zc4x51biiIK0JepRUdnd79aUmkyVnzhSlLGVk5y9AYKDlWkdWF4KLYsNrSyI7omIZgku7ImcYlJ0OQVnDffjB/fVTMxcRSTB0Q8XIuQdm5YkegMEByD9nFnpTopSGyKLtkHAXabvp0ojJqJsKywJHRu9U4tKUgcsA4IDWJpWgqV2nFMYqRf+IPHbsVNFZo4iknlUUnrTkvTGAYKDpaycHILsrlzY1dn0nCq7VMHNS3KpHxezJJWzN0BwMCjZrYrkUqQWMhee5BadV9hdm7tjKybpbwMEB8huQSnKENkflkMK85acR9ghYg6ldNzSbYnRG1JEcACcwzkFFxKinCDxZ3JdzuD2tjTkElxf0hZpX7HDvjdAcAA9Cq4tQkutOgzSLUqbVagiLaX7KdIKmQtKvCJLjd4AwQGA+M/gvH1ibRGdRDSNS8e0ZWohSpD+NnnHpCQBEBzAAopMQs2+NK/g6lKLqSnK3JWWudsAPClJb+sAZ28IDgAytAlIxLiqkKlJWqT7mK++BZc6oSVWUsgNEBzIEBairkKKMrQIL0ZwXVOUe9OcdUUmuaefpIq4SVipm7oBwQFAhhRlaInaUgSXI0UpjsKTVLF1FbDnvM0yVEciQwQHABHsTlGGhmguJFRXzqp2DB3O1yRScJJZZt7IrY9zN0BwAEsXGa16kUlwpjB33y6Jq2a8fWQpA5sls9Byy42+N0BwAHNIUdaJK6fgUtKRsYtXU9fzSGLTdhe5kZoEBAfQk+BCQ0FJiCxA8TSOi7OwRGqKTKzlthRZ5ZRaTLSGwADBASyoB64pkmsTXKiZdelNIc4SXBfppURnTbd1nS2J/ADBAUh/RSaeQcvB0SvXt+CkpXVAOsjKEr+eSJ7BycgNEBxAjylKc6YhmwpO5iW4rlLKlYJMrZAkcgMEB7CgIhNrOZOL6Y/regbnGWbsSSN2ic5iojXK/wHBASzpOZx32LKn8CRVcLFCkgxRWI5ozSM3ojdAcABznEeZko5si+JSd6t5CzpSl4lah88Rx0iuLpu7kRsgOIAeozeLSF16msK7jOqSiH1rsZWNXYSWkpJEboDgABZYZBIippZ4zu1ypihziCuHxJAbIDiAgUVxbWILLR+fMlGkTj7BkR6MEVQOmSE3QHAAKyy4NrEF5+dK4hmcNAgwZzQWK7NUuQEgOIAFCM7TBO5pEs8x/9ErOK+kckZpKZWSCBAQHMActx7ERG4p709ZjxNzztZFcjnL/ZEbIDiAJRFcjlSld4N3bIoytlQ/NgrLHaEhN0BwAAMoMunykktwOSQ3T7EhN0BwAAsSnMxJeCmC8zZZdxFf3/vakBsgOIAlPYeTTOJLFVzTtvSuEVdsdMZ2AEBwsNbnWqucnpSOxSLSk+BSI6qcAkNugOBgLcU2hDO4HOnLlAhOnJWSfQnKMj/PiA0QHCC3JbjfsZFaigS9zdkphSVdoi7r4TlGboDgALGtYKFJ0+eJ9FdkkltI1tNzjNwAwQFyWyK5xdwWm45sK2iJFdw8etAQGyA4QHQiogPshRPJO5nEK7SYqk9ZkjMzxAYIDojeVuQMThxRWNP5Xdvt0rLE1OZ49mX8LACCA6DZ25PO9C4vbRNfn2Ix/sgBBAcw7HmDuc7g2oTlEVnuIpO+ngvEBggOBj3xYygXwJgIrW0paUzKMkcEh9QAwQHMqYjEVlzYMSnJmMguJYLz9roZZ62A4AD6vdDZgM/gJCKKE6cQxVl4kitFidAAwQGs2QUx5WytTVoSGcEtw+xOxAYIDhBYxPtWrcjEG4G1vS9lE8C8RYPQAMEBRJ7RrcyFUy158n9sw7Znqgn71wAQHCxxZLc6F9MgQUvZiJCWJ4qLLSrJdb6JxGBwFDwEgPBS7mkIuqHFpfPhxE7saZFl/W3pydg0pnQY14XcAMEB9DjeanXO3yoJxUZRVJeqyf5bDvy2mdguwXmqKlMjuKa9bwCA4GAJ+8bEWfYuy5CWlNKq0bgs77vl4E+dOnRetVCT4Bqi7InUcjwGRGUACA4WPMHE8/ZSXaiD2fbomo3RXe976icP3XH8dFFqsGBdtgh4qyKXoWoSAMEBzGmc13zv1DRsX/OGza3Hbz/69kN3vHxaSw2hMnHOoEyRvCfabXvMiOYAwQEssHikqUR+KS7OYRq2x9ePxo/dfvS/3P+xp/fvRG6xUVpTY7hETicZ2jxPAAQHgz2D61Ii36/cJmF7302b4yPfeeUv9n/o4N2qYqEyEYsasNwmvtTKSCQGgOBgic/gUuYszudOV2Gyed3G+PiT575293sOfORytaR6N3SbMzpten9steSQ1hABCI3esMppy6VNTVoVJhtbG6NzL25/7463fe9dF05OSlUJZpYSnTXNpBTx74MDACK4QUyjH2rPm2ck1UIjOAsWis1yZFXYvveWg7954eSk1FKDWXLU5tkcYJmqUYneAIjgENoSDFz2DheWuY7gUpmY2eTOdz3x5qMPnq6Kqysmu7x4GrbbUptdHhfkBkRwMJe1KjwW/iboeU7hmmzdvDl+6NOHf/XIA69Miw2tQmU5xCYSXz2ZM4XLzx0QwUFvUlPaBLL0dvXa6za+YTT+9qcP//pjtx89UpQawvS1yC1kiODazuL6Gn+G3IAIDobdrLxk7QGeZaBzewynl+zC1t8dj5/4vy/9zkO3HX68KGZGbqHm9RiheTYLeM/aPCleACI4QGxzFFtq6XwvhCpMrrl5c+v5+0997oFPPnOnFqqXiyVniil0kJs4Nwt4+gYBAMHNNQ2nnM+1FpOY87a5XNCtCpPxtaPRiw+/+oU73/n9T0zOV4WohF2N3E1CCxI3ZzJ1uDSSA0BwC7toK1KLLm1fuOBCsGq0rxxdfHVy7L4/OHDr5HxVaPHaAOWQmJLsOr6LYiQA4QyONOYwR3XNRW4WJJQbGi6dnT5/x9sf/9enD18otNBql9y8526pKcvYTQEUjgAguKUUVMxf5Tbwnr/UEvus90glTDav3Rjd/YGDbzn+xFnR1w9QbpJckPjCEs90k9jiEkQHIKQoc16stYf+oyGnpZpSlCmFF13vTbAQJuPrR+P9Hz70b164/9SkKLXaaeQOEVWTXaoovVsDYrcIIDsAIris0zi6LKpct3Rl7GLQkPsOVFPb3nrDePytTz37i4/ffvToLrmZI2IL0v3Mra3wJHcqG+kBERxkrZBsivTa/nLXAU9viTmTyi7/K0tLD3755Y8+8tkXntFSQwhXRW6eVGRM4Yl0aB3wNsMjNwAEN5eUZJu8Zn29dWgRaGvq7l1wV5aWPn3n8Y/d9Z4nb1cRscvjkz1nbrHv97YNSMbNARShACC4XuTWFOW1iW1dikxiBJe1ktLC5b1uZ56/8L17PnDgs6GyQlWuyK1JVsEpudQxXZ5tAxSaAAhncMt4NhdTRDD0IhNznLfNertzr1uxWRZnX7z0yFfe8fivvNbrZrV9bnX3I/UcztsPGNMagNAAiOB6j96sY9SWY7/XqkZwntu6FZlUEoqRipqFO97x2K+++vzFK71uEimz4JRgji0DCAyACG7h1ZIxe7o8F7ShLjuNidr23pZ+sQ8SpLRqNC7Lez948KdOP3tBtbyqkbutUjIk3n9vCtabluxjLxwAERwknbdpgtiGfLHytgRkPYMLZtvjaza27nrvUz9x6KvHX52xtNTT85ajD87zx0vM/xmhARDBLUUzs4h/L9rQqyhjX65EVcntAI/ffvRth+54+bSWr62+CY7oLbQIL0i3ohLP1JKFbFUAIIJb7363unM1dURy2iK6oS5GjbnYd24TCNOwve/60fix24++8/6PPX1P8YNet5QCl+Ac3RUrsNSGbu95LUIEBMdD0LnwpO62NoHNen2okVzoGOX4v9EkbO+7eXN85Nun/nz/hw7eqSq2E7mJM70YOi43TW0TyBm9ITcABBdVMZkSuTW9Pkt+OsAL1N5qyFgJhJi9bpvXbYyPP3nuq3e/58AHRaXY+fuhS6FLyrlbalqyTWo0cgMguOyS8wpQnEJT8U+SX9cUZdTjYVWYbGxtjM69uP3oHW/73tsvnJwUqmJmZh368GIrPr29bzHFRaQgARDc3NOSdTJrEprWRG1DTk/KnmKR2MgntE8psVBsliOrwva9txz8lQsnJ4WWGqwy6VDc0kVuTaJrEmBM9EZ6EgDBzV2Ae4UmDQN16y7wQ0pVxqbu4gQXJKjKxMwmd77riX9+9MHT20WpNmM7gCRGbyEx2stRQEP0BiC0CfS1uDRm/p9nt5lENAAPMYKLeXE9FhbCZOvmzfFDnz78C0ceeOVisaFhTzvA3lYAz/cLzk0CqWnW2MIShAZABLdUxShNZ3DeafqcwTXMo7Rp2B7fMBp/+9OH3/rY7UefKUoNYWoxkXLIeD4Xk6Lsq7AEEQIguCwys4YzOGkoKhFZxBbrxT6OIbKKsvUxmF6yC9f+vfHW47cf/c8P3Xb4oaK4akqJJFY2zkqN5hZbX6O3kBsAgssivFmv7y48mdXjVldsomsWwYWuRSahCpNrbt7cev7+U3/6wCef+aIWKvZaq1tnseXoc5OEghJPahKJASC43gpHJLEPLqY3aqhVlF3GdV3VDjC+djR68eFX/8+d7/z+BybnKxXd2eqWtnstt9w8BSW55Yb4ABBc79NM6qIzlfhhw0NLUXYRxuVXLFQb+8rRxVcnL933Bwd+d3K+kp3VN5pZbLInRSmZ5LYOq5EAENzAUpPaUFyiM2ZM1l0kdeeCWgwwgksd2RVkZxaJlhounZ0evuMd3/+Xpw9fCFqo7ex1C5K+by7HwOSYlKR3EDfRG4DQJrCIvXCec5Qu6bAwwMcxRGwPuOpFxYKYhfF1o/HdHzj408efODvRUsOMvW5tmwLqvo/3fsXufIv5eeHcDYAILqu0tMOet5j2AI0Q3046zoJdZiVlt3P/Q44UZQhSbV63Uey/9dC/eOH+U2dmNHKLMzXoffxzpSE9RSVdZIb8ABBcL2nKWUKblZpqGs81K1IoRMRUtSiKQlR1JaPsoihKVS1UVbvsTwuVhGtuHv2jb/33Z3/m8c8fPThjaek8RSc9yC01/YjcABBcr8OXZ/W4SUNxiTZcLF+Tm4iEEMI0hFAVRVE67qsuW3RcVdVk599pl3U5o2vKcPDLL7/jkT974WEtVEKwLrKJFV0XocXKjdQkQGZ0zf+PWvP2rH/3vt72Usx4vZhx++veNx6P9U1velPdx9V9j7qXuv/brMegrRk5RgYmIra9vW1Hjhwp9hSZuNfmFBu7ppPMbgdIjeCkh4jNMzzZG8URvQEguIULTnbJRlrk1vbv3tebvk7dbXX3TyOfd89F3FNqn7NqsWtE1UV6qXKTDOO5kBuAkKKcd6+bRC43nfXv7tTka7cVRSF7hBl2/at7XpfMcpMO1aFXtQWYmUTsZEsRm3eItUh/UouRW+oGAQBAcHM5h2uTWdOZSt1F0HbLK4RgMyQ4S267X08RnCbcz+hUpeSpWswdYaVIsWs6ssuGbuQHEEEppCjr3m5LV2rN588SSttZmEack3misbqJGU0X9Nht1qGHsVa5yvFjxdY1Uks5a0NuAERwS99Ppy09dlbzdtPFcHfaUvZEaJ6iF8l8BifSvSJxXqX5XW6LkViXKknkBkAEN7eILqbYpC4yk4bILkdUpokNwLGFFWHG66HnqG3RYvPc1pfcaOYGIIJbma0DdeX3TX+1754/ufv1K58365wt5uzNewbXdlFOLbfvMieyr1RiSurRWzwSIzcEBoDglkJkbcUlTbKLGba7t6hkd8qymJG2rBNclyrK1HmbOUSWWvyR4/ysr1RkityQH4CQopSeUpSxvXEx3997P0zi+xW7DoHumors0lCdu6oxl+AkslISuQEQwa3smK6m15siwKbS8VCTggwRE1Sa0pMS0SYQK4muUVlf6cgulY+pk0iQGwCCG8SWb2tIQ8bMr5wlu2LXx+9OUZpDbt4iFo28SOfoL+urfF8ynaOllvt7qiORGwCCW/qIzXtmJ06hSUNEJzOiub3fS2ekND1FJrGVmCLd+sxyjcDqQ2hdUo/IDQDBrVyEFhONaUKk5r1fdZGbtBSYSKYikxyCyx2pxVY1zitSQ24AQpGJrOBkE0/BibeoJPUi54kqYhu0Lcdy0g5ym8cEkS63ITcAIriV3uidmsb0bPT2nM+p4/17U5GzojiLGP2VS56SUWjzqHTsWubvFRnyAkBwSzl+q23YsrWkJdvGdaVuE9eGDeOeHXCeRu9cgptHb9o8xRYzasuYVAKA4Ia2RkczXLysRmTSEL3tLTCxngSXU265Vs/MI0qLidCQG4Cw8HQZ///e3rG2zQApr3vfJ5kKSzQxWvEKaB5l/TkEltK7htwAiOAGW1HpGeGlHVKSMd/PGqK2lPmT3jRlrtL8Pisd51U0klokBABEcEtTUSni2/FW97YnGmv7/Nhdc97nPJfk+ozSYhbL5hQbcgNAcIP5/8emKsWRMvSmGWM+PiY1qdK9FSGH5OYRreWM0KyH9g4AEFKUsuQTTzwpwzqBWubtBtZSZNJ1H1mMZCzDx+WaJLJIsSE3ACK4lUhVelOA3kKU2ChPIiK4mCg1phk5NkU4j3J+yVwskrM5G7kBILiVFFzu1GXqx+beDB5zFtdXEUjf5fwp52ls5AZAcIM+i8sluVThScK2AMk4ASZH+X3Osv5lFBtyA0BwK/M4aORtMcJLidJSZ15qhotzn7JbRPN1brEhNwAEN8hILiXS0o6fFxu5aeJFOWVsVY5G674isz6GICM2AAS3NpHcvCSmPT+/qZLJWek4r3QjURuAsC4HwXWvtkwpFIkRUI6LbhexdJXWPNONlvkxAgAEN4hUZcoElC4pR13AeqEcgusyob+vVCNiAyBFyeOSKZqbx9t9FpnMS3JdIrK+Bx4jNgAiOCQXKaWUj+nzD5kUicTcnnt6CGIDACK4jI9N10bxrmLTnp/jVKn0ffs8Z0EiNgAEh+QyR3ldppLoHM7i+ir8WJZRWYgNAMHxGGWOslKjMl1g4ckynZvZHIQOAAgOyc0h1agL2q4gPVcwLmL2I3IDQHA8XpI/bdmH0HSOF/tFFIHkEhJiA0BwPGYyn+bxPtsA5iWCvlKKtqD/DwAgOB6zngWlS7wUVlZAaogNgIs1LEh0qd9j2SI4hAYACG7NHj8d+PO1TKX5iA2ACzQs8HHUFXsul/kMDKEBAIJb0sdT53xf5ykEW7GvCwAIDnp+XFf1ubIV/doAwIUYluQx1oHJC6kBAILjsV6pFCVCAwAEx2O/tiA1AOAiy/OA0AAAuLDy3CAxAOAiCjx/yAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4Gr+P8oeJNzJUmouAAAAAElFTkSuQmCC";
        const b64bytes = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
        function toB64(ab) {
        const u = new Uint8Array(ab); let s = "";
        for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
        return btoa(s);
        }
        const LOGO_PROMPT = (title) => `1) Is this image NOT suitable as a clean, professional news photo? Answer true if ANY of these is present: watermarks or logos of OTHER media outlets added on top (TV channel bugs, website or news agency watermarks, photo agency marks like Getty Images, AFP, Reuters, Telegram/Instagram channel logos or handles); a video play button or video player controls; it is a video thumbnail, screenshot or promo graphic with large added text, titles, score banners or "match review" captions; a collage or split image; app/website interface elements; very blurry or low quality; an old black-and-white or archive/historical photo (old team portraits, sepia) when the headline is about a current match, result or recent news. Team crests, kit sponsors, stadium advertising boards and trophies that are naturally in the photo do NOT count.
        2) Give a short English search phrase (2-4 words, usually a player or club name) to find a similar photo for this news headline: "${title}".
        Answer ONLY with JSON: {"logos":true or false,"query":"..."}`;
        async function checkLogos(env, im, title, deadline) {
        try {
        const small = await (await env.IMAGES.input(new Blob([im.buf]).stream()).transform({ width: 1024 }).output({ format: "image/jpeg", quality: 80 })).response().arrayBuffer();
        const raw = await callGemini(env, [{ text: LOGO_PROMPT(title || "") }, { inline_data: { mime_type: "image/jpeg", data: toB64(small) } }], 0, Math.min(deadline, Date.now() + 15000), 1024, false, true);
        const j = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
        return { known: true, logos: j.logos === true || j.logos === "true", query: String(j.query || "").slice(0, 60) };
        } catch (e) { return { known: false }; }
        }
        async function loadImg(env, src) {
        try {
        let url = src;
        if (!/^https?:/.test(src)) {
        const f = await tg(env, "getFile", { file_id: src });
        if (!f.ok) return null;
        url = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${f.result.file_path}`;
        }
        const ua = /wikimedia\.org/.test(url) ? "InterFutbolBot/1.0 (https://t.me/Inter_Futbol_TV)" : "Mozilla/5.0";
        const ir = await fetch(url, { headers: { "user-agent": ua, referer: new URL(url).origin + "/" } });
        if (!ir.ok || (!(ir.headers.get("content-type") || "image/").startsWith("image/") && /^https?:/.test(src))) return null;
        const buf = await ir.arrayBuffer();
        const info = await env.IMAGES.info(new Blob([buf]).stream());
        return { buf, W: info.width || 800, H: info.height || 800 };
        } catch (e) { return null; }
        }
        async function brandBuf(env, im) {
        // KATTA SURATDA BELGI KICHRAYIB QOLMASIN (2026-11-17, 317-post: manba surati juda katta edi, WM PNG (440 px) esa kattalashtirilmaydi —
        // belgi enning 12,2% i o'rniga ~5% bo'lib qolgan): surat avval eni 1920 px gacha kichraytiriladi, belgi o'lchami shu enga qarab hisoblanadi
        const W = Math.min(im.W, 1920);
        const gs = Math.max(36, Math.round(W * 132 / 1080)); // belgi eni; PNG atrofida soya uchun har tomondan gs/3 bo'sh joy bor
        const ow = Math.round(gs * 5 / 3), m = Math.max(0, Math.round(W * 44 / 1080 - gs / 3));
        let base = env.IMAGES.input(new Blob([im.buf]).stream()); if (im.W > 1920) base = base.transform({ width: 1920 });
        const out = await base
        .draw(env.IMAGES.input(new Blob([b64bytes(WM)]).stream()).transform({ width: ow }), { top: m, right: m })
        .output({ format: "image/jpeg", quality: 90 });
        const blob = await out.response().blob();
        return blob.size > 1000 ? blob : null;
        }
        async function brandImg(env, src) {
        if (!env.IMAGES || !src) return null;
        try { const im = await loadImg(env, src); return im ? await brandBuf(env, im) : null; } catch (e) { return null; }
        }
        async function commonsImg(q) {
        try {
        const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1280&gsrsearch=" + encodeURIComponent(q + " filetype:bitmap");
        const j = await (await fetch(u, { headers: { "user-agent": "InterFutbolBot/1.0 (https://t.me/Inter_Futbol_TV)" } })).json();
        const pages = Object.values(j?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
        let any = null;
        for (const p of pages) {
        const ii = p.imageinfo?.[0];
        if (!ii || !/jpeg/.test(ii.mime) || ii.width < 600) continue;
        if (ii.width >= ii.height) return ii.thumburl || ii.url;
        any = any || ii.thumburl || ii.url;
        }
        return any;
        } catch (e) {}
        return null;
        }
        async function pickBranded(env, item, deadline) {
        if (!env.IMAGES) return null;
        const cands = [...new Set([item.img, ...(item.alts || [])].filter((u) => u && /^https?:/.test(u)))].slice(0, 3);
        let query = "", unknown = null;
        for (const u of cands) {
        if (Date.now() > deadline - 4000) break;
        const im = await loadImg(env, u);
        if (!im || im.W < 400) continue;
        const r = await checkLogos(env, im, item.title, deadline);
        if (r.query && !query) query = r.query;
        if (r.known && !r.logos) return brandBuf(env, im).catch(() => null);
        if (!r.known && !unknown) unknown = im;
        }
        if (query && Date.now() < deadline - 3000) {
        const c = await commonsImg(query);
        const im = c && (await loadImg(env, c));
        if (im) return brandBuf(env, im).catch(() => null);
        }
        if (unknown) return brandBuf(env, unknown).catch(() => null);
        return null;
        }
        
        async function sendPhotoBlob(env, base, blob) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(naBody(base, base.chat_id !== env.CHANNEL))) fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        fd.append("photo", new Blob([await blob.arrayBuffer()], { type: blob.type || "image/jpeg" }), "photo.jpg");
        return (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd })).json();
        }
        
        async function sendRich(env, chat, text, img, markup) {
    const plainLen = text.replace(/<[^>]+>/g, "").length;
    if (img && plainLen <= 1024) {
    const base = { chat_id: chat, caption: text, parse_mode: "HTML" };
    if (markup) base.reply_markup = markup;
    let r = { ok: false };
    if (img instanceof Blob) { r = await sendPhotoBlob(env, base, img); img = null; }
    else if (/^https?:/.test(img)) { const b = await brandImg(env, img); if (b) r = await sendPhotoBlob(env, base, b); }
    if (!r.ok && img) r = await tg(env, "sendPhoto", { ...base, photo: img });
    if (!r.ok && img && /^https?:/.test(img)) {
    try {
    const ir = await fetch(img, { headers: { "user-agent": "Mozilla/5.0", referer: new URL(img).origin + "/" } });
    const type = ir.headers.get("content-type") || "image/jpeg";
    if (ir.ok && type.startsWith("image/")) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(naBody(base, base.chat_id !== env.CHANNEL))) fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    fd.append("photo", new Blob([await ir.arrayBuffer()], { type }), "photo.jpg");
    r = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd })).json();
    }
    } catch (e) {}
    }
    if (r.ok) {
    const ph = r.result.photo || [];
    return { ...r, usedImg: ph.length ? ph[ph.length - 1].file_id : img };
    }
    }
    const r = await tg(env, "sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: markup });
    return { ...r, usedImg: null };
    }

    function todayUz() {
    const oy = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
    const d = new Date(Date.now() + 5 * 3600e3);
    return `${d.getUTCFullYear()}-yil ${d.getUTCDate()}-${oy[d.getUTCMonth()]}, soat ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    }

    const PROMPT = (item, variant) => `Sen o'zbek tilidagi "Inter Futbol" Telegram kanalining muharririsan.
    Quyidagi yangilik (ingliz yoki rus tilida) asosida o'zbek tilida (lotin yozuvi) qisqa post yoz.
    Hozirgi vaqt: ${todayUz()} (Toshkent vaqti).

    Qoidalar:
    - Faqat manbada yoki Google qidiruvida aniq tasdiqlangan faktlarni yoz, o'zingdan qo'shma, taxmin qilma.
    - Matnni o'z so'zlaring bilan yoz, manbadan so'zma-so'z tarjima qilma.
    - Sana, soat, stadion yoki shahar uchun alohida qator (🗓, 🏟 belgili) YOZMA.
    - "Bugun", "kecha", "ertaga", "shu kuni" kabi nisbiy so'zlarni ishlatma — har doim aniq sanani yili bilan yoz (masalan "2026-yil 4-noyabr"), post keyinroq o'qilsa ham tushunarli bo'lsin.
    - Tuzilishi:
    1-qator: <b>qisqa sarlavha</b> (emoji'siz) — sarlavha to'g'ridan-to'g'ri yangilik mavzusining o'zi bo'lsin (masalan "<b>Djeymi Karrager "Aston Villa"dan uzr so'radi</b>", "<b>Real Madrid Barselonani 2:1 hisobida yengdi</b>"). Sarlavha boshiga BAYONOT, ESLASH, TEZKOR, RASMIY, NATIJA, JAROHAT, YANGILIK, TRANSFER kabi turkum so'zi va "|" belgisini QO'SHMA.
Post matnida (sarlavha va gaplarda) umuman emoji ishlatma: uslub jiddiy, professional nashrdagidek bo'lsin.
O'yin natijasi haqida bo'lsa, hisobni sarlavhaga "2:0 hisobida" ko'rinishida yoz (masalan "<b>Chelsea Manchester Unitedni 2:0 hisobida mag'lub etdi</b>").
    Bo'sh qator.
    2–4 ta qisqa gap — asosiy ma'lumot. Davlat va terma jamoa nomlarini O'ZBEKCHA yoz (O'zbekiston terma jamoasi, Italiya, Saudiya Arabistoni) va ⟦ ⟧ ichiga olma; heshteglari ham o'zbekcha (#OzbekistonTermaJamoasi). Futbol klublari, futbolchilar va murabbiylar nomlarini ORIGINAL holida — rasmiy lotin yozuvidagidek yoz (masalan: Chelsea, Manchester United, Barcelona, Bayern München, Cristiano Ronaldo, Kylian Mbappé, Cole Palmer, Pep Guardiola). Ularni o'zbekchalashtirma, tarjima qilma, harflarini o'zgartirma; rus yoki boshqa yozuvdagi nomlarni rasmiy lotin shakliga o'tkaz. Har bir shunday nomni ⟦ ⟧ ichiga ol: ⟦Chelsea⟧, ⟦Cole Palmer⟧. Heshteglarda nomni qavssiz va bo'sh joysiz yoz: #Chelsea #ManchesterUnited.
    Bo'sh qator.
    2–3 ta heshteg (#transfer #RealMadrid kabi).
    - Faqat <b> tegidan foydalan, boshqa HTML ishlatma. Markdown ishlatma. Manba havolasi yoki izoh yozma — faqat tayyor post matnini qaytar.
    - Post 700 belgidan oshmasin.
    - Faqat FUTBOL yangiligi bo'lsin. Agar yangilikning O'ZI boshqa sport turi haqida bo'lsa (tennis, MMA, boks, basketbol, F1, xokkey va h.k.) yoki yangilikning o'zi stavka/bukmeker yoki chipta sotish reklamasi bo'lsa, faqat SKIP so'zini qaytar. Yangilik AYOLLAR futboli (ayollar jamoasi, Women's Super League, Liga F, UEFA Women's Champions League, ayol futbolchi yoki ayollar terma jamoasi) haqida bo'lsa ham — sarlavhada "Women" so'zi bo'lmasa-da (futbolchi ayol ekani, "her/she", liga nomi orqali bilinadi) — faqat SKIP so'zini qaytar. Sayt sahifasidagi reklama bannerlari, yosh tasdiqlash, cookie va shunga o'xshash xizmat matnlarini e'tiborga olma — ular sababli SKIP QILMA. Futbol o'yini, futbolchi, klub, murabbiy yoki transfer haqidagi yangilik hech qachon SKIP qilinmaydi.
    ${variant ? `- Bu ${variant}-variant: oldingi variantlardan boshqacha uslubda, boshqacha sarlavha va gap tuzilishi bilan yoz.` : ""}
    ${item.style ? `- YANGI POST SHAKLI (sinov): ${item.style} Faktlar FAQAT shu manbadan olinadi, o'ylab topilmaydi. Oxirgi heshteglar qatoriga ${item.tag} ni ham qo'sh.` : ""}
${item.video ? `- Bu VIDEO (rasmiy YouTube kanalidan). Birinchi qatorni qalin sarlavha "<b>...</b>" ko'rinishida yoz ("VIDEO" so'zini va 🎬 belgisini yozma), keyin 1–3 gapda videoda nima ko'rsatilganini qiziqarli qilib ayt (faqat sarlavha va tavsifga asoslan). Matnni to'g'ridan-to'g'ri video mazmunidan boshla: «InterFutbol TV», «Inter Futbol», «kanal», «videorolik», «loyiha» so'zlarini va kanal nomini umuman yozma (heshteglarda ham). Tavsifdagi reklama va havolalarni (Telegram, Instagram va h.k.) e'tiborga olma. Video futbolga oid bo'lsa (gol, lavha, qiziq holat, intervyu, mashg'ulot) SKIP qilma; faqat reklama yoki jonli efir e'loni bo'lsa SKIP.` : ""}

    Manba: ${item.source}
    Sarlavha: ${item.title}
    Qisqacha: ${srcClean(item.desc)}
    ${item.text ? "Maqola matni:\n" + srcClean(item.text) : ""}`;
    function srcClean(t) { return String(t || "").split("\n").filter((l) => !/gambling|betting|bookmaker|verify your age|old enough|cookie|ставк|букмекер|18\+|21\+|24\+/i.test(l)).join("\n"); }

    async function callOR(env, prompt, temperature, maxTokens, deadline = Infinity) { const k = await kvGet(env, "orKey", ""); if (!k) throw new Error("OpenRouter kaliti yo'q"); const q = Array.isArray(prompt) ? prompt.map((p) => p.text || "").join("\n") : String(prompt); let last = ""; for (const model of ["deepseek/deepseek-v4-flash:free", "deepseek/deepseek-v4-flash"]) { const left = deadline - Date.now(); if (left < 5000) break; try { const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { authorization: "Bearer " + k, "content-type": "application/json", "x-title": "Inter Futbol bot" }, body: JSON.stringify({ model, messages: [{ role: "user", content: q }], temperature, max_tokens: maxTokens, reasoning: { enabled: false } }), signal: AbortSignal.timeout(Math.min(left - 1000, 60000)) }); const j = await r.json().catch(() => ({})); const t = j?.choices?.[0]?.message?.content; if (t && String(t).trim()) return String(t).trim(); last = model + ": " + (j?.error?.message || r.status); } catch (e) { last = model + ": " + e.message; } } throw new Error("DeepSeek: " + (last || "javob bermadi")); } async function callGemini(env, prompt, temperature, deadline = Infinity, maxTokens = 4096, search = true, lite = false) {
    const models = (env.GEMINI_MODELS || env.GEMINI_MODEL || "gemini-3.8-flash")
    .split(",").map((m) => m.trim()).filter(Boolean);
    for (const m of ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]) if (!models.includes(m)) models.push(m);
  if (lite) models.sort((a, b) => (/-lite$/.test(a) ? 0 : 1) - (/-lite$/.test(b) ? 0 : 1));
    let lastErr = "", touts = 0, giveUp = false;
    for (const model of models) {
    if (giveUp) break;
    let useSearch = search && (env.GEMINI_SEARCH === "1" || !/^gemini-3/.test(model));
    for (let attempt = 0; attempt < 3; attempt++) {
    const body = {
    contents: [{ parts: Array.isArray(prompt) ? prompt : [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
    };
    if (useSearch) body.tools = [{ google_search: {} }];
    const left = deadline - Date.now();
    if (left < 3000) { const e = new Error("vaqt tugadi"); e.busy = true; throw e; }
    let r, j;
    try {
    r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(Math.min(left - 1000, /-lite$/.test(model) ? (maxTokens > 2048 ? 20000 : 9000) : 30000)) }
    );
    j = await r.json().catch(() => ({}));
    } catch (err) { lastErr = (lastErr + " || " + model + " timeout").slice(-900); touts++;
      // 2026-11-20: Gemini osilib qolganda butun vaqt shu yerda tugab, zaxira modelga (DeepSeek) navbat yetmas edi — endi ikkinchi kutishdan keyin
      // yoki vaqt 20 soniyadan kam qolsa, zaxiraga o'tiladi (zaxira o'chiq bo'lsa — avvalgidek "band")
      if (touts < 2 && deadline - Date.now() > 20000) break;
      giveUp = true; break; }
    const text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (text) return text.replace(/\[\d+(,\s*\d+)*\]/g, "");
    const code = j?.error?.code || r.status;
    lastErr = (lastErr + " || " + `${model}: ${code} ${j?.error?.message || ""}`.slice(0, 120)).slice(-900);
    if (code === 503 || code === 500) { await new Promise((res) => setTimeout(res, 1500)); continue; }
    if (useSearch) { useSearch = false; continue; }
    break;
    }
    }
    try { await env.STATE.put("gerr", new Date().toISOString() + " " + lastErr); } catch (x) {}
if ((await kvGet(env, "orMode", "off")) === "on") { try { return await callOR(env, prompt, temperature, maxTokens, deadline); } catch (x) { lastErr = (lastErr + " || " + x.message).slice(-900); } } const e = new Error("Gemini band yoki javob bermadi. " + lastErr);
    e.busy = true;
    throw e;
    }

    function scoresIn(t) { const s = new Set(); for (const m of String(t || "").matchAll(/(?<![\d.,])(\d{1,2})\s*[:\-–—]\s*(\d{1,2})(?![\d.,])/g)) { s.add(+m[1] + ":" + +m[2]); s.add(+m[2] + ":" + +m[1]); } return s; }
function postScores(t) { const s = new Set(); const x = String(t || "").replace(/<[^>]+>/g, ""); for (const m of x.matchAll(/(?<![\d.,:])(\d{1,2}):(\d{1,2})(?![\d.,:])/g)) { if (/^0\d$/.test(m[2]) || +m[1] > 15 || +m[2] > 15) continue; if (/soat\s*$/i.test(x.slice(Math.max(0, m.index - 8), m.index))) continue; s.add(+m[1] + ":" + +m[2]); } return s; }
const fixBr = (t) => { t = String(t).replace(/[⌊⌈〚【「]/g, "⟦").replace(/[⌋⌉〛】」]/g, "⟧"); let o = "", open = false; for (const ch of t) { if (ch === "⟦") { if (open) continue; open = true; } else if (ch === "⟧") { if (!open) continue; open = false; } else if (ch === "\n" && open) { o = o.replace(/⟦([^⟦]*)$/, "$1"); open = false; } o += ch; } if (open) o = o.replace(/⟦([^⟦]*)$/, "$1"); return o; };
// klub va futbolchi nomlarining rasmiy yozilishi (heshteglarga tegmaydi)
const CANON = [/* 2026-11-18: Norvegiya–Daniya posti "kambek amalga oshirib", "chorakfinal" */ [/(?<![#\p{L}])kambek (?:amalga oshir|qil)(\p{L}*)/gu, "vaziyatni o'zgartir$1"], [/(?<![#\p{L}])(ch|ç|Ch|Ç)orakfinal(?=\p{L}*)/gu, "$1orak final"], [/(?<![#\p{L}])(y|Y)arimfinal(?=\p{L}*)/gu, "$1arim final"], [/(?<![#\p{L}])Sadio Mane(?=(?:ning|ni|ga|dagi|da|dan)?(?![\p{L}]))/gu, "Sadio Mané"] /* 2026-11-18: 335-post */, [/(?<![#\p{L}])Alexandro Balde/gu, "Alejandro Balde"] /* 2026-11-18: 329-post sarlavhasi */, [/(?<![#\p{L}])Eintraçt(?![\p{L}])/gu, "Eintracht"], [/(?<![#\p{L}])Gregoritsç(?![\p{L}])/gu, "Gregoritsch"] /* 2026-11-17: 320-postda qayta chizishda buzilgan nomlar */, [/(?<=(?:^|[^#\p{L}])(?:⟦)?(?:Manchester United|Manchester City|Liverpool|Arsenal|Chelsea)) F\.C\./gu, ""] /* 2026-11-17: Vikipediya sarlavhasidan "Liverpool F.C." (325-post) */, [/(?<![#\p{L}])UEFA Champions League(?![\p{L}])/gu, "UEFA Chempionlar ligasi"], [/(?<![#\p{L}])UEFA Europa League(?![\p{L}])/gu, "UEFA Yevropa ligasi"], [/(?<![#\p{L}])UEFA (?:Europa )?Conference League(?![\p{L}])/gu, "UEFA Konferensiya ligasi"], /* 2026-11-12: 241-postda inglizcha qolgan edi */ [/(?<![#\p{L}])[İI]stanbul(?! Ba[sş]ak[sş]ehir)(?=\s+(?:safarda|öz|o['ʻ’]z|jamoasi|klubi|mehmon|uyida|maydonida|ustidan|bilan|[0-9]))/gu, "İstanbul Başakşehir"], [/(?<![#\p{L}])Al[- ]Nass?r(?: FC)?(?![\p{L}])/gu, "Al-Nassr"], [/(?<![#\p{L}])(?:A Seriya|Seriya A)(?![\p{L}])/gu, "Serie A"], [/(?<![#\p{L}])Atletico( de)? Madrid/gu, "Atlético Madrid"], [/(?<![#\p{L}])Bayern (?:Munich|Munchen|Myunxen|Myunhen)(?![\p{L}])/gu, "Bayern München"], [/(?<![#\p{L}])Kylian Mbappe(?![\p{L}])/gu, "Kylian Mbappé"], [/(?<![#\p{L}])Mbappe(?![\p{L}])/gu, "Mbappé"], [/(?<![#\p{L}])Paris Sen-Jermen/gu, "Paris Saint-Germain"], [/(?<![#\p{L}])Borussiya Dortmund/gu, "Borussia Dortmund"], [/(?<![#\p{L}])Yuventus(?![\p{L}])/gu, "Juventus"], [/(?<![#\p{L}])Barselona(?![\p{L}])/gu, "Barcelona"], [/(?<![#\p{L}])Mat[iíì]as Soul[eéè](?![\p{L}])/gu, "Matías Soulé"], [/(?<![#\p{L}])Soul[eè](?![\p{L}])/gu, "Soulé"], [/(?<![#\p{L}])Abdukodir Khusanov(?![\p{L}])/gu, "Abduqodir Husanov"], [/(?<![#\p{L}])Khusanov(?![\p{L}])/gu, "Husanov"], /* 2026-11-19: 342-post "Abbosbek Fayzullaev" */ [/(?<![#\p{L}])Fayzullaev(?![\p{L}])/gu, "Fayzullayev"], [/(?<![#\p{L}])Igor Serge(?:y?ev|jev)(?![\p{L}])/gu, "Igor Sergeyev"], [/(?<![#\p{L}])(?:FC |FK )?Pakhtakor(?: Tashkent)?(?: FK)?(?![\p{L}])/gu, "Paxtakor"], [/(?<![#\p{L}])Jose Mourinho(?![\p{L}])/gu, "José Mourinho"], [/(?<![#\p{L}])(?:Angliya\s+)?Premyer[- ]liga(?:si)?(?=(?:dagi|da|ga|ning|ni|dan)?(?![\p{L}]))/gu, "Premier League"], [/(?<![#\p{L}])(?:Ispaniya\s+)?La Liga(?:si)?(?=(?:dagi|da|ga|ning|ni|dan)?(?![\p{L}]))/gu, "LaLiga"], [/(?<![#\p{L}])(?:Angliya\s+)?Premer[- ]liga(?:si)?(?=(?:dagi|da|ga|ning|ni|dan)?(?![\p{L}]))/gu, "Premier League"], [/(?<![#\p{L}])Kri[şs]h?tianu Ronaldu(?![\p{L}])/gu, "Cristiano Ronaldo"], [/(?<![#\p{L}])A[çc]h?raf Hakimi(?![\p{L}])/gu, "Achraf Hakimi"], [/(?<![#\p{L}])Jamol Musiala(?![\p{L}])/gu, "Jamal Musiala"], /* 2026-11-21: nazorat — manbadagi buzuq ismlar */ [/(?<![#\p{L}])Sehrou Guirassy(?![\p{L}])/gu, "Serhou Guirassy"], [/(?<![#\p{L}])Nicolo Tresoldi(?![\p{L}])/gu, "Nicolò Tresoldi"], [/(?<![#\p{L}])Ermedin Demirovic(?![\p{L}])/gu, "Ermedin Demirović"], [/(?<![#\p{L}])Joao Pedro(?![\p{L}])/gu, "João Pedro"], [/(?<![#\p{L}])Alvaro Arbeloa(?![\p{L}])/gu, "Álvaro Arbeloa"], [/(?<![#\p{L}])Jo[sš]ko Gvardiol(?![\p{L}])/gu, "Joško Gvardiol"], [/(?<![#\p{L}])Marc Gu[eé]hi(?![\p{L}])/gu, "Marc Guéhi"], [/(?<![#\p{L}])Gy[oö]keres(?![\p{L}])/gu, "Gyökeres"], [/(?<![#\p{L}])Angliya\s+(?=Premier League)/gu, ""], [/(?<![#\p{L}])(o|O)flayd(?=\p{L}*)/gu, "$1fsayd"], [/(?<![#\p{L}])["«“]?Bavariya["»”]?(?=(?:ning|ni|ga|dagi|da|dan)?(?![\p{L}]))/gu, "Bayern München"], [/(?<![#\p{L}])Juli[aá]n Alvarez(?![\p{L}])/gu, "Julián Álvarez"], [/(?<![#\p{L}])Manchester Siti(?![\p{L}])/gu, "Manchester City"], [/(?<![#\p{L}])Manchester Yunayted(?![\p{L}])/gu, "Manchester United"], [/(?<![#\p{L}])KONKAKAF(?![\p{L}])/giu, "CONCACAF"], /* 2026-11-14: Davies posti */ [/(?<![#\p{L}])Marcus Thuram-Ulien(?![\p{L}])/gu, "Marcus Thuram"], /* 2026-11-14: Serie A to'purarlar */ [/(?<![#\p{L}])Vin[ií]cius(?:\s+(?:J[uú]nior|Jr\.?))?(?![\p{L}])/gu, "Vinícius Júnior"], /* 2026-11-14: Yaponiya–Braziliya posti */ [/(?<![#\p{L}])Rafael Le[aã]o(?![\p{L}])/gu, "Rafael Leão"], [/(?<![#\p{L}])Leao(?![\p{L}])/gu, "Leão"], /* 2026-11-16: 299-post "FC ⟦Barcelona⟧" — logotip "FC" va nom orasiga tushgan; 298-post "Inglizlar terma jamoasi" */ [/(?<![#\p{L}])FC Barcelona(?![\p{L}])/gu, "Barcelona"], [/(?<![#\p{L}])[Ii]ngliz(?:lar)? (terma jamoa|milliy terma jamoa)/gu, "Angliya $1"], /* 2026-11-15: 20:06 fakti "Liverpool FC", "Manchester United FC" */ [/(?<![#\p{L}])(Liverpool|Manchester United|Manchester City|Chelsea|Arsenal|Tottenham Hotspur|Everton|Newcastle United) FC(?![\p{L}])/gu, "$1"], /* 2026-11-15: Bruno Fernandes posti "Brunu Fernandesh" bo'lib chiqqan */ [/(?<![#\p{L}])Brunu Fernande(?:sh|ş)(?![\p{L}])/gu, "Bruno Fernandes"], /* 2026-11-15: 284-postda "Rasmus Hojlund", "Pierre-Emile Hojbjerg" (rasmiy: Højlund, Højbjerg) */ [/(?<![#\p{L}])H[oø]jlund(?![\p{L}])/gu, "Højlund"], [/(?<![#\p{L}])H[oø]jbjerg(?![\p{L}])/gu, "Højbjerg"], [/(?<![#\p{L}])Fernande(?:sh|ş)(?![\p{L}])/gu, "Fernandes"], /* 2026-11-16: Declan Rice posti "o'gliga" (to'g'risi o'g'liga) */ [/(?<![#\p{L}])(o|O)['ʻ’]gl(?=i)/gu, "$1'g'l"], [/(?<![#\p{L}])(ö|Ö)gl(?=i)/gu, "$1ğl"], /* 2026-11-16: 19:31 posti sarlavhasida "Ronaldinyo" (matnda Ronaldinho) */ [/(?<![#\p{L}])Ronaldin(?:yo|xo)(?=(?:ning|ni|ga|dagi|da|dan)?(?![\p{L}]))/gu, "Ronaldinho"], [/(?<![#\p{L}])Turkiya Superliga(?:si)?(?=(?:dagi|da|ga|ning|ni|dan)?(?![\p{L}]))/gu, "Süper Lig"]];
// heshteglar: turnir heshteglari inglizcha, rasmiy nomlar (Bahtiyor aka qarori)
const HASHFIX = [[/#(ManchesterUnited|ManchesterCity|Liverpool|Arsenal|Chelsea)FC\b/g, "#$1"], [/#Chempi?onlarLigasi\b/g, "#ChampionsLeague"], [/#JamolMusiala\b/g, "#JamalMusiala"], [/#(?:Abdu[kq]odir(?:Khusanov|Xusanov|Husanov)|Khusanov)\b/g, "#AbduqodirHusanov"], [/#IgorSergeev\b/g, "#IgorSergeyev"], /* 2026-11-20: Fayzullayev fakt posti heshtegi */ [/#(Abbosbek)?Fayzullaev\b/g, "#$1Fayzullayev"], [/#Pakhtakor(?:Tashkent)?\b/g, "#Paxtakor"], [/#Prem[ey]e?r?Liga\b/g, "#PremierLeague"], [/#AlNasr\b/g, "#AlNassr"], [/#O['ʻ’‘ʼ`]zbekiston/g, "#Ozbekiston"], [/#Ö['ʻ’‘ʼ`]?zbekiston/g, "#Ozbekiston"], [/#LaLigasi\b/g, "#LaLiga"], [/#Bavariya\b/g, "#BayernMünchen"], [/#(?:FC)?BayernMunich\b/g, "#BayernMünchen"], [/#FabioKannavaro\b/g, "#FabioCannavaro"], [/#(?:APL|EPL|AngliyaChempionati|AngliyaPrem[ey]?erLigasi)\b/g, "#PremierLeague"], [/#IspaniyaChempionati\b/g, "#LaLiga"], [/#ItaliyaChempionati\b/g, "#SerieA"], [/#GermaniyaChempionati\b/g, "#Bundesliga"], [/#FransiyaChempionati\b/g, "#Ligue1"], [/#(?:UEFA|CONCACAF)?Millatlar?Ligasi\b/g, "#NationsLeague"], [/#(?:UEFA_?|CONCACAF_?)?Nations_League\b/g, "#NationsLeague"], [/#UEFANationsLeague\b/g, "#NationsLeague"], [/#England\b/g, "#Angliya"], [/#Spain\b/g, "#Ispaniya"], [/#Croatia\b/g, "#Xorvatiya"], [/#France\b/g, "#Fransiya"], [/#Germany\b/g, "#Germaniya"], [/#Italy\b/g, "#Italiya"], [/#Portugal\b/g, "#Portugaliya"], [/#Netherlands\b/g, "#Niderlandiya"], [/#Belgium\b/g, "#Belgiya"], [/#Brazil\b/g, "#Braziliya"], [/#Uzbekistan\b/g, "#Ozbekiston"], [/#Decu\b/g, "#Deco"]];
// 2026-11-16: heshteg qatorida bo'shliqli heshteglar ("#Thomas ⟦Tuchel⟧ #Elliot Anderson", 298-post) — so'zlar bitta heshtegga qo'shiladi
const hashGlue = (ln) => (/^\s*#\p{L}/u.test(ln) && (ln.match(/#/g) || []).length >= 2 && ln.length < 400 && !/[.,:;!?()<>]/.test(ln) && !/^\s*(#[\p{L}\p{N}_]+\s*)+$/u.test(ln)) ? ln.replace(/[⟦⟧]/g, "").trim().split(/\s+(?=#)/).map((h) => "#" + h.slice(1).replace(/[^\p{L}\p{N}_]/gu, "")).filter((h) => h.length > 1).join(" ") : ln;
const hashFix = (t) => { const seen = new Set(); return HASHFIX.reduce((a, [re, v]) => a.replace(re, v), String(t || "")).split("\n").map(hashGlue).map((ln) => /^\s*(#[\p{L}\p{N}_]+\s*)+$/u.test(ln) ? ln.trim().split(/\s+/).filter((h) => { const k = h.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).join(" ") : ln).join("\n"); };
// davlat va terma jamoa nomlari o'zbekcha (inglizcha/ruscha emas), ⟦ ⟧ ichiga olinmaydi; qo'shimcha saqlanadi
const COUNTRY = [["Uzbekistan|Özbekiston|O'zbekiston|Ozbekiston|Uzbekiston", "O'zbekiston"], ["Saudi Arabia|Saudiya Arabistoni", "Saudiya Arabistoni"], ["Italy", "Italiya"], ["Spain", "Ispaniya"], ["Germany", "Germaniya"], ["France", "Fransiya"], ["England", "Angliya"], ["Portugal", "Portugaliya"], ["Brazil", "Braziliya"], ["Netherlands|Holland", "Niderlandiya"], ["Belgium", "Belgiya"], ["Croatia", "Xorvatiya"], ["Japan", "Yaponiya"], ["South Korea|Korea Republic", "Janubiy Koreya"], ["Iran", "Eron"], ["Kazakhstan", "Qozog'iston"], ["Tajikistan", "Tojikiston"], ["Kyrgyzstan", "Qirg'iziston"], ["Turkmenistan", "Turkmaniston"], ["Turkey|Türkiye", "Turkiya"], ["Morocco", "Marokash"], ["Egypt", "Misr"], ["Australia", "Avstraliya"], ["United Arab Emirates", "Birlashgan Arab Amirliklari"], ["Jordan", "Iordaniya"], ["Iraq", "Iroq"], ["Colombia", "Kolumbiya"], ["Mexico", "Meksika"], ["Norway", "Norvegiya"], ["Poland", "Polsha"], ["Switzerland", "Shveytsariya"], ["Scotland", "Shotlandiya"], ["Denmark", "Daniya"], ["Sweden", "Shvetsiya"], ["Austria", "Avstriya"], ["Serbia", "Serbiya"], ["Ukraine", "Ukraina"], ["Russia", "Rossiya"], ["DR Congo|Congo DR", "Kongo DR"], ["Ivory Coast|Côte d'Ivoire", "Kot-d'Ivuar"], ["Senegal", "Senegal"], ["Nigeria", "Nigeriya"], ["Canada", "Kanada"]].map(([en, uz]) => [new RegExp("(?<![#\\p{L}'])(?<!de )⟦?(?:" + en + ")(?!\\s+Football)⟧?(?=(?:da|dagi|dan|ga|ning|ni|lik|liklar|cha)?(?![\\p{L}]))", "gu"), uz]);
const BOOKIE_RE = /betboom|бетбум|fonbet|фонбет|winline|винлайн|liga stavok|лига ставок|1xbet|melbet|bet365|betcity|marathonbet|olimpbet|parimatch|leonbets?|bwin|betway/i;
const BOOKIE_PFX = /(?<![#\p{L}])(?:BetBoom|Бетбум|Fonbet|Фонбет|Winline|Винлайн|Olimpbet|Melbet|1xBet|Betcity|Parimatch)\s+(?=\p{L})/giu;
/* 2026-11-17: qo'shtirnoqdagi klub nomi: "Paxtakor" → Paxtakor; shahar nomi bilan bir xil klub ("Rostov"ga) → rasmiy nom (FC Rostov) — qo'shtirnoq klub ekanini bildiradi */
let QCLUB = null;
function quoteClub(t) {
  if (!QCLUB) { QCLUB = new Map(); for (const [, , ns] of CLUB_EMOJI) { for (const n of ns) { const k = n.toLowerCase(); if (!QCLUB.has(k)) QCLUB.set(k, n); const m = k.match(/^(.+) (klubi|jamoasi)$/); if (m && !QCLUB.has(m[1])) QCLUB.set(m[1], ns[0]); } } }
  return String(t).replace(/(=)?["«“„]([\p{L}][\p{L}\p{N} .'’‘ʻ-]{1,30}?)["»”“]/gu, (m, eq, inner) => { if (eq) return m; const v = QCLUB.get(inner.toLowerCase()); return v ? (v.toLowerCase() === inner.toLowerCase() ? inner : v) : m; });
}
const canonFix = (t) => { let x = hashFix(t).replace(/(\d)\.(\d+)(?=\s?(?:foiz|%|milliard|million|mlrd|mln|ming|trillion))/g, "$1,$2") /* o'nli kasr vergul bilan: 64,76 foiz, 1,55 milliard (2026-11-12) */.replace(/⟧ (ga|ni|ning|dan|dagi|day)(?![\p{L}\p{N}])/gu, "⟧$1"); /* "⟦Jonas Urbig⟧ ga" → "⟦Jonas Urbig⟧ga" — qo'shimcha nomdan ajralmaydi */ for (const [re, v] of CANON) x = x.replace(re, v); for (const [re, v] of COUNTRY) x = x.replace(re, v); x = x.replace(BOOKIE_PFX, ""); x = quoteClub(x).replace(/\b([Qq]ur)['’‘ʻ](?=[\s.,;:!?]|$)/g, "$1'a"); /* 2026-11-17: o'zbek manbalarida klub nomi qo'shtirnoqda ("Rostov"ga) — logotip qo'yilmay qolgan edi; "qur' tashlash" imlo xatosi (EURO 2028 posti) */  /* 2026-11-12: 242-postda "BetBoom o'rtoqlik uchrashuvi" — bukmeker nomi kanalda bo'lmaydi */ if (!/To[sş]h?kent vaqti/i.test(x)) x = x.replace(/Moskva vaqti bilan(\s+soat)?\s+(\d{1,2}):(\d{2})(\s*da)?/g, (m, so, h, mi) => "Toshkent vaqti bilan" + (so || "") + " " + String((+h + 2) % 24).padStart(2, "0") + ":" + mi + " da (Moskva vaqti bilan " + h + ":" + mi + " da)"); /* turkcha nuqtasiz ı/İ o'zbek matnida bo'lmaydi — ⟦ ⟧ ichidagi rasmiy nomlardan tashqari */ return x.split(/(⟦[^⟧]*⟧|#[\p{L}\p{N}_]+)/u).map((p, i) => (i % 2 ? p : p.replace(/ı/g, "i").replace(/İ/g, "I"))).join(""); }; // heshteglar ham o'zgarmaydi (#İstanbulBaşakşehir)
const postClean = (text, video) => canonFix(fixBr(noLabel(noEmoji(cleanHtml((video ? text.replace(/🎬\s*/g, "").replace(/\bVIDEO\s*[|:—-]\s*/gi, "") : text).split("\n").filter((l) => !/🗓|🏟/.test(l)).join("\n").replace(/\n{3,}/g, "\n\n"))))));
function badScores(item, text) { const ss = scoresIn([item.title, item.desc, item.text, String(item.link || "").replace(/[-_]/g, " ").replace(/(\d+) (\d+)/g, "$1-$2")].join("\n")); if (!ss.size) return []; return [...postScores(text)].filter((x) => !ss.has(x)); }
// manbadagi xorijiy ismlar (ch/sh harfli) yangi alifboga o'girilib ketmasligi uchun ⟦ ⟧ ichiga olinadi
function protectNames(t, item) {
  const src = [item.title, item.desc, item.text].join(" ");
  const names = [...new Set((src.match(/(?<![\p{L}])[A-Z][a-zà-ÿ]+(?:-[A-Z][a-zà-ÿ]+)?(?![\p{L}])/gu) || []).filter((w) => /ch|sh/i.test(w) && w.length >= 4))].sort((a, b) => b.length - a.length);
  if (!names.length) return t;
  // klub nomi ichidagi so'z ("Manchester" — "Manchester United") alohida ⟦ ⟧ ga olinsa logotip tushib qolardi (2026-11-15: 15:21 va 17:51 postlari sarlavhasi) — butun klub nomi bilan olinadi
  const clubs = [...new Set(CLUB_EMOJI.flatMap(([, , ns]) => ns).filter((n) => / /.test(n) && names.some((w) => n.split(" ").includes(w))))];
  names.push(...clubs); names.sort((a, b) => b.length - a.length);
  // "-" /u rejimida qochirilmaydi ("\-" — Invalid escape, 14-noyabr 10:00 tarixiy fakti shu sabab chiqmadi)
  let re;
  try { re = new RegExp("(?<![\\p{L}])(" + names.map((n) => n.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")).join("|") + ")", "gu"); } catch (e) { return t; }
  return String(t).split(/(<[^>]*>|⟦[^⟧]*⟧|#[\p{L}\p{N}_]+|https?:\/\/\S+)/u).map((p, i) => (i % 2 ? p : p.replace(re, "⟦$1⟧"))).join("");
}
async function factCheck(env, item, text, deadline = Infinity, kind = "post") {
    const src = `Sarlavha: ${item.title}\nQisqacha: ${srcClean(item.desc)}\nHavola: ${item.link}\n${item.text ? "Matn:\n" + srcClean(item.text).slice(0, 7000) : ""}`;
    const bad = badScores(item, text);
    const prompt = `Sen "Inter Futbol" nashrining qat'iy fakt-tekshiruvchi muharririsan (nazoratchi). Hozirgi vaqt: ${todayUz()} (Toshkent vaqti).
Vazifa: quyidagi ${kind === "article" ? "maqola" : "post"}dagi HAR BIR aniq faktni MANBA bilan solishtir: o'yin hisobi, kim yutgani/yutqazgani, gol urganlar, sana va hafta kuni, turnir va tur, raqamlar va statistika, ismlar, klublar, lavozimlar, transfer summalari.
- Manbaga zid fakt bo'lsa — manbaga moslab tuzat. Manbada umuman yo'q va shubhali aniq fakt bo'lsa — o'sha gapni olib tashla yoki umumiyroq qilib yoz.
- Futbolchi, murabbiy va klub nomlari ASL RASMIY lotin yozuvida bo'lishi shart (Hansi Flick, Kylian Mbappé, Bayern München). O'zbekchalashtirilgan yoki buzilgan yozuv bo'lsa (Flik, Mbappe → Mbappé, Diter) — asl rasmiy shaklga tuzat; nom ⟦ ⟧ ichida bo'lmasa — ⟦ ⟧ ichiga ol.
- "Bugun", "kecha", "ertaga" yoki faqat hafta kuni ("chorshanba oqshomi") kabi nisbiy ifodalar bo'lsa — aniq sana yili bilan almashtir (masalan "2026-yil 4-noyabr kuni kechqurun").
- Imlo, grammatika va uslub xatolarini ham tuzat (qo'shimchalar, kelishiklar, tinish belgilari, g'aliz yoki tarjimaga o'xshash jumlalar) — ma'noni o'zgartirmasdan, ravon adabiy o'zbek tilida.
- Yilni hozirgi sanaga nisbatan hisobla: manbada yil yozilmagan bo'lsa ham, sanadan aniq kelib chiqadigan yilni xato dema (masalan noyabrda aytilgan "yanvar" — keyingi yil yanvari; 2026-yil noyabrida bu 2027-yil yanvari).
- HAR BIR SANANI ALOHIDA TEKSHIR (2026-11-08, LaLiga xatosidan keyin): kun, oy va YIL manbadagi bilan aynan bir xil bo'lsin. Manbada aniq sana emas oraliq ("2–4-dekabr", "dekabrning birinchi haftasi") yoki "hali tasdiqlanmagan" deyilgan bo'lsa — matnda ham oraliqni va "aniq sana hali rasman tasdiqlanmagan" degan izohni qoldir, bitta sanani o'ylab topma. "Yil boshi/oxiri" kabi noaniq ifoda o'rniga manbadagi aniq oy yozilsin ("2027-yil fevralidagi"). Manbada "rasman" deyilmagan bo'lsa "rasman e'lon qildi" yozma. Bir voqeaning sanasi bilan boshqasinikini aralashtirma.
- Davlat va terma jamoa nomlari o'zbekcha bo'lishi shart (O'zbekiston, Italiya, Saudiya Arabistoni, Ispaniya); inglizcha yoki ruscha shakli (Uzbekistan, Italy, Saudi Arabia) xato — tuzat va ⟦ ⟧ ichiga olma.
- Ruscha yoki inglizcha so'z va kalkalar bo'lsa (podbor, udar, vratar, trener, sostav, kambek, assist qildi) — o'zbekcha futbol atamasi bilan almashtir (qaytgan to'p, zarba, darvozabon, murabbiy, tarkib, vaziyatni o'zgartirib g'alaba qozondi, gol uzatmasini berdi). Har bir jumla nuqta bilan tugasin; turkcha "ı" harfi ishlatilmasin (faqat rasmiy nomlarda bo'lishi mumkin).
- O'yin hisobi va g'olibni FAQAT manbada aniq yozilgan bo'lsa o'zgartir: «АЕК – Реал» yoki «A – B» kabi yozuv faqat uy egasi va mehmonni bildiradi, g'olibni emas; g'olibni taxmin qilma, manbada aniq bo'lmasa yozilganini o'zgartirma. - Faqat xato joyni tuzat: uslub, tuzilish, <b> teglari, ⟦ ⟧ belgilari, heshteglar, "#" sarlavhalar va bo'sh qatorlar o'zgarmasin.
${bad.length ? "- DIQQAT: matndagi " + bad.join(", ") + " hisobi manbada topilmadi — albatta tekshirib tuzat.\n" : ""}- ASOSIY FAKT MANBADA BO'LISHI SHART (2026-11-10, Shomurodov xatosidan keyin: manba sarlavhasi "Kutilmaganda Shomurodovdan xushxabar" edi, postda esa o'ylab topilgan "Italiya chempionatida gol urdi" chiqqan): sarlavhadagi asosiy voqea (gol, natija, transfer, jarohat, tayinlov, iste'fo, rekord va h.k.) manbada aniq yozilmagan bo'lsa yoki manba faqat qiziqtiruvchi sarlavhadan iborat bo'lib, unda aniq fakt bo'lmasa — matnni tuzatma, faqat "HOLAT: RAD" va "XATOLAR:" qatorida sababini yoz.
Javob formati (boshqa hech narsa yozma):
HOLAT: OK yoki TUZATILDI yoki RAD
XATOLAR: (TUZATILDI bo'lsa — har bir xato juda qisqa, ";" bilan ajrat)
MATN:
(TUZATILDI bo'lsa — tuzatilgan TO'LIQ matn)

MANBA:
${src}

TEKSHIRILADIGAN MATN:
${text}`;
    const raw = await callGemini(env, prompt, 0.1, deadline, kind === "article" ? 4096 : 2048, false, true);
    const st = (raw.match(/HOLAT:\s*\**\s*(OK|TUZATILDI|RAD)/i) || [])[1];
    if (!st) throw new Error("nazoratchi javobi tushunarsiz");
    if (/^rad$/i.test(st)) { const why = ((raw.match(/XATOLAR:\s*([^\n]*)/i) || [])[1] || "asosiy fakt manbada yo'q").trim().slice(0, 200); return { text, fixed: [], bad: ["RAD: " + why], rad: why }; }
    if (/^ok$/i.test(st)) { const tx = protectNames(text, item); return { text: tx, fixed: [], bad: badScores(item, tx) }; }
    const errs = ((raw.match(/XATOLAR:\s*([^\n]*)/i) || [])[1] || "").split(";").map((x) => x.trim()).filter(Boolean).slice(0, 4);
    const m = (raw.split(/MATN:[ \t]*\n?/i)[1] || "").trim();
    if (m.length < text.length * 0.4) throw new Error("nazoratchi matni chala");
    const out = protectNames(kind === "article" ? fixBr(m) : postClean(m, item.video), item);
    return { text: out, fixed: errs.length ? errs : ["kichik tuzatish"], bad: badScores(item, out) };
}
async function checkedPost(env, item, post, deadline = Infinity) {
    try {
    const fc = await factCheck(env, item, post, deadline);
    if (fc.bad.length) return { post: null, note: "" };
    return { post: fc.text, note: fc.fixed.length ? "🛡 Nazoratchi tuzatdi: " + fc.fixed.join("; ").slice(0, 160) : "🛡 Nazoratchi: faktlar manbaga mos ✅" };
    } catch (e) {
    if (badScores(item, post).length) return { post: null, note: "" };
    return { post, note: "🛡 Nazoratchi ulgurmadi — hisob manbaga mos, qolgani tekshirilmadi" };
    }
}
async function writePost(env, item, variant = 0, deadline = Infinity) {
    const text = item.__or ? await callOR(env, PROMPT(item, variant), 0.5, 2048, deadline) : await callGemini(env, PROMPT(item, variant), variant ? 1.0 : 0.5, deadline, 2048, true, true);
    if (/^SKIP\b/.test(text) || /^SKIP$/m.test(text.slice(-10))) return null;
    return postClean(text, item.video);
}


    const LONG_PROMPT = (item, post = "") => `Sen o'zbek tilidagi "Inter Futbol" sport nashrining jurnalistisan.
    Quyidagi yangilik asosida o'zbek tilida (lotin yozuvi) BATAFSIL maqola yoz.
    Hozirgi vaqt: ${todayUz()} (Toshkent vaqti).

    Qoidalar:
    - Faqat manbada yoki Google qidiruvida aniq tasdiqlangan faktlarni yoz. O'ylab topish qat'iyan mumkin emas.
    - Maqola FAQAT shu bitta yangilik haqida bo'lsin: quyidagi qisqa postning batafsil, kengaytirilgan varianti. Boshqa mavzu yoki boshqa yangiliklarga o'tma, sarlavha ham qisqa post sarlavhasi bilan bir xil mazmunda bo'lsin.
    - Hajmi: 4–7 paragraf (taxminan 1200–2500 belgi).
    - Kerakli kontekstni qo'sh: jamoalarning turnir jadvalidagi o'rni, oxirgi natijalar, o'yinchi statistikasi, oldingi uchrashuvlar — faqat aniq bo'lsa.
    - O'yin haqida bo'lsa: sana, Toshkent vaqti bilan soat, stadion va shahar.
    - "Bugun", "kecha", "ertaga" kabi nisbiy so'zlarni ishlatma — har doim aniq sanani yili bilan yoz (masalan "2026-yil 4-noyabr").
    - Davlat va terma jamoa nomlarini O'ZBEKCHA yoz (O'zbekiston terma jamoasi, Italiya, Saudiya Arabistoni) va ⟦ ⟧ ichiga olma; heshteglari ham o'zbekcha (#OzbekistonTermaJamoasi). Futbol klublari, futbolchilar va murabbiylar nomlarini ORIGINAL holida — rasmiy lotin yozuvidagidek yoz (masalan: Chelsea, Manchester United, Barcelona, Bayern München, Cristiano Ronaldo, Kylian Mbappé, Cole Palmer, Pep Guardiola). Ularni o'zbekchalashtirma, tarjima qilma, harflarini o'zgartirma; rus yoki boshqa yozuvdagi nomlarni rasmiy lotin shakliga o'tkaz. Har bir shunday nomni ⟦ ⟧ ichiga ol: ⟦Chelsea⟧, ⟦Cole Palmer⟧. Heshteglarda nomni qavssiz va bo'sh joysiz yoz: #Chelsea #ManchesterUnited.
    - Sof o'zbek adabiy tilida yoz: ruscha so'z va kalkalarni ishlatma (masalan "podbor" emas — "qaytgan to'p", "udar" emas — "zarba", "vratar" emas — "darvozabon", "trener" emas — "murabbiy").
    - Format: birinchi qatorda "# " bilan boshlanadigan sarlavha (emoji'siz). Keyin paragraflar, ular orasida bo'sh qator. Kerak bo'lsa oraliq sarlavha "## " bilan boshlansin. Boshqa belgilash (HTML, **, havola) ishlatma. Izoh yoki manba ro'yxati yozma.

    Manba: ${item.source}
    Sarlavha: ${item.title}
    Qisqacha: ${item.desc}
    ${post ? "Kanaldagi qisqa post:\n" + String(post).replace(/<[^>]+>/g, "") + "\n" : ""}${item.text ? "Maqola matni:\n" + item.text : ""}`;

    async function telegraphToken(env) {
    let t = await kvGet(env, "tgph", null);
    if (t) return t;
    const r = await (await fetch("https://api.telegra.ph/createAccount?" + new URLSearchParams({
    short_name: "InterFutbol", author_name: "Inter Futbol", author_url: "https://t.me/" + String(env.CHANNEL || "").replace("@", ""),
    }))).json();
    if (!r.ok) throw new Error("Telegraph: " + r.error);
    await kvPut(env, "tgph", r.result.access_token);
    return r.result.access_token;
    }

    async function makeArticle(env, p, deadline = Infinity) {
    let raw = await callGemini(env, LONG_PROMPT(p.item, p.post), 0.5, deadline, 4096);
    try { const fc = await factCheck(env, p.item, raw, Math.min(deadline, Date.now() + 25000), "article"); if (fc.rad) throw new Error("asosiy fakt manbada yo'q: " + fc.rad); raw = fc.text; } catch (e) { throw new Error("nazoratchi: " + (e.message || e)); }
    const lines = canonFix(unEnt(raw.replace(/\*\*/g, ""))).split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let title = "";
    if (lines[0] && lines[0].startsWith("# ")) title = lines.shift().slice(2).trim();
    if (!title) title = String(p.post || p.item.title).split("\n")[0].replace(/<[^>]+>/g, "").replace(/^[^\p{L}\p{N}«"]+/u, "").trim();
    const nodes = [];
    let pimg = null;
    if (p.img instanceof Blob) { const ak = "ar_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await env.STATE.put("lgb:" + ak, await p.img.arrayBuffer(), { expirationTtl: 90 * 86400 }); pimg = WURL + "/lg/" + ak; }
    else if (typeof p.img === "string" && p.img) pimg = /^https?:/.test(p.img) ? p.img : WURL + "/ph/" + encodeURIComponent(p.img);
    else if (typeof p.item.img === "string" && /^https?:/.test(p.item.img)) pimg = WURL + "/px?k=" + (await sha("px-" + env.BOT_TOKEN)).slice(0, 16) + "&u=" + encodeURIComponent(p.item.img);
if (pimg && /^https?:/.test(pimg)) nodes.push({ tag: "figure", children: [{ tag: "img", attrs: { src: pimg } }] });
    for (const l of lines) {
    if (l.startsWith("## ")) nodes.push({ tag: "h4", children: [l.slice(3)] });
    else if (!l.startsWith("#")) nodes.push({ tag: "p", children: [l] });
    }
    const ch = String(env.CHANNEL || "").replace("@", "");
    nodes.push({ tag: "p", children: [{ tag: "b", children: ["📲 Eng so'nggi futbol yangiliklari: "] }, { tag: "a", attrs: { href: "https://t.me/" + ch }, children: ["Inter Futbol"] }] });
    const token = await telegraphToken(env);
    const r = await (await fetch("https://api.telegra.ph/createPage", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
    access_token: token, title: newAlpha(title).slice(0, 250), author_name: "Inter Futbol",
    author_url: "https://t.me/" + ch, content: JSON.stringify(naNodes(nodes)), return_content: "false",
    }),
    })).json();
    if (!r.ok) throw new Error("Telegraph: " + r.error);
    return r.result.url;
    }


// TELEGRAPH MAQOLASI RASMI (2026-11-09, Bahtiyor aka: maqolada umumiy iF rasmi bo'lmasin — post rasmi bo'lsin)
async function tgphSetImg(env, url, imgUrl, onlyDefault) {
  const path = decodeURIComponent(String(url).replace(/^https?:\/\/telegra\.ph\//, "").split(/[?#]/)[0]);
  const g = await (await fetch("https://api.telegra.ph/getPage/" + encodeURIComponent(path) + "?return_content=true")).json();
  if (!g.ok) return "topilmadi";
  const C = g.result.content || []; const fi = C.findIndex((n) => n && n.tag === "figure");
  const src = fi >= 0 ? JSON.stringify(C[fi]) : "";
  const def = await kvGet(env, "defImg", null);
  const isDef = fi < 0 || (def && (src.includes(encodeURIComponent(def)) || src.includes(def)));
  if (onlyDefault && !isDef) return "o'z rasmi bor";
  const fig = { tag: "figure", children: [{ tag: "img", attrs: { src: imgUrl } }] };
  if (fi >= 0) C[fi] = fig; else C.unshift(fig);
  const token = await telegraphToken(env); const ch = String(env.CHANNEL || "").replace("@", "");
  const r = await (await fetch("https://api.telegra.ph/editPage/" + encodeURIComponent(path), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ access_token: token, title: g.result.title, author_name: g.result.author_name || "Inter Futbol", author_url: g.result.author_url || "https://t.me/" + ch, content: JSON.stringify(C), return_content: "false" }) })).json();
  return r.ok ? "ok" : "xato: " + r.error;
}
async function tgphCardImg(env, url, png, id) {
  // kartochka JPEG'ga o'tkaziladi (hajm kichik) va 180 kun saqlanadi
  let b = png; try { b = await (await env.IMAGES.input(new Blob([png]).stream()).output({ format: "image/jpeg", quality: 86 })).response().arrayBuffer(); } catch (e) {}
  const ak = "ar_c" + id; await env.STATE.put("lgb:" + ak, b, { expirationTtl: 180 * 86400 });
  return tgphSetImg(env, url, WURL + "/lg/" + ak, false);
}
    const readMore = (url) => (url ? { inline_keyboard: [[{ text: "Batafsil o'qish", url }]] } : undefined);

    export function cleanHtml(t, max = 900) {
    const parts = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split(/(<\/?b>|<blockquote(?: expandable)?>|<\/blockquote>)/g);
    let open = 0, q = 0, out = "";
    for (const p of parts) {
    if (p === "<b>") { if (!open) { out += p; open = 1; } }
    else if (p === "</b>") { if (open) { out += p; open = 0; } }
    else if (p.startsWith("<blockquote")) { if (!q) { if (open) { out += "</b>"; open = 0; } out += p; q = 1; } }
    else if (p === "</blockquote>") { if (q) { if (open) { out += "</b>"; open = 0; } out += p; q = 0; } }
    else out += esc(unEnt(p.replace(/<[^>]*>/g, "")));
    }
    if (open) out += "</b>";
    if (q) out += "</blockquote>";
    return out.trim().slice(0, max);
    }

    export function entitiesToHtml(text, entities = []) {
    const marks = [];
    const tags = { bold: ["<b>", "</b>"], blockquote: ["<blockquote>", "</blockquote>"], expandable_blockquote: ["<blockquote expandable>", "</blockquote>"] };
    for (const e of entities || []) if (tags[e.type]) marks.push([e.offset, tags[e.type][0]], [e.offset + e.length, tags[e.type][1]]);
    marks.sort((a, b) => b[0] - a[0] || (a[1].startsWith("</") ? 1 : -1));
    let out = text;
    for (const [i, tag] of marks) out = out.slice(0, i) + tag + out.slice(i);
    return out;
    }

    function meta(html, names) {
    for (const n of names) {
    const r = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']+)["']`, "i"))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${n}["']`, "i"));
    if (r) return r[1];
    }
    return null;
    }
    function articleText(html) {
    const ps = [];
    for (const m of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
    const t = decodeEntities(m[1]);
    if (t.length > 60) ps.push(t);
    if (ps.join(" ").length > 2500) break;
    }
    return ps.join("\n").slice(0, 2500);
    }
    async function enrich(item) {
    if (item.video) return item;
    try {
    const r = await fetch(item.link, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } });
    const html = (await r.text()).slice(0, 200000);
    if (!item.img) { const i = meta(html, ["og:image", "twitter:image"]); if (i) item.img = unAmp(i); }
    item.alts = [...new Set([...html.matchAll(/<img[^>]+?(?:data-src|src)="(https:\/\/[^"]+?\.(?:jpe?g|webp|png)(?:\?[^"]*)?)"/gi)].map((m) => unAmp(m[1])))].filter((u) => u !== item.img && !/logo|icon|avatar|sprite|banner|counter|pixel/i.test(u)).slice(0, 3);
    if (item.desc.length <= 80) { const d = meta(html, ["og:description", "description", "twitter:description"]); if (d) item.desc = decodeEntities(d).slice(0, 600); }
    item.text = articleText(html);
    } catch (e) {}
    return item;
    }

    async function getAdmins(env) {
    const a = await kvGet(env, "admins", null);
    if (a) return a;
    const one = await kvGet(env, "admin", null);
    return one ? [one] : [];
    }
    const artKey = (p) => "art:" + (p.chat || "") + ":" + p.msg;
    const HELP = "Buyruqlar:\n/natija — futbol natijalari, bugungi o'yinlar, jadval\n/diktor — matnni sizning ovozingizda o'qitish\n/keyingi — navbatdagi yangilikni hozir olish\n/video — navbatdagi videoni hozir olish\n/navbat — navbatda nechta yangilik bor\n/pauza — vaqtincha to'xtatish\n/davom — qayta yoqish\n/test — kanalga sinov xabari\n/adminlar — bot foydalanuvchilari\n/bekor — saqlangan fikrni bekor qilish\n/fikr — shaxsiy fikr posti (ovozli yoki matn)\n\n🎙 Ovozli xabar yuborsangiz — «Shaxsiy fikr» posti tayyorlanadi.\n📌 Boshqa birovning fikriga munosabat: avval o'sha postni uzating (peresilka) yoki havolasini yuboring, keyin ovozli xabar yuboring.";
    const BTN = { "📰 Keyingi yangilik": "/keyingi", "🎬 Keyingi video": "/video", "🗂 Navbat": "/navbat", "⏸ Pauza": "/pauza", "▶️ Davom": "/davom", "👥 Adminlar": "/adminlar", "❓ Yordam": "/yordam", "⚽ Natijalar": "/natija", "🎙 Diktor": "/diktor", "💬 Shaxsiy fikr": "/fikr" };
    const MENU_KB = { keyboard: [[{ text: "📰 Keyingi yangilik" }, { text: "🎬 Keyingi video" }], [{ text: "🗂 Navbat" }, { text: "👥 Adminlar" }], [{ text: "⚽ Natijalar" }, { text: "🎙 Diktor" }, { text: "💬 Shaxsiy fikr" }], [{ text: "⏸ Pauza" }, { text: "▶️ Davom" }, { text: "❓ Yordam" }]], resize_keyboard: true, is_persistent: true };
    const COMMANDS = [
    { command: "keyingi", description: "Navbatdagi yangilikni hozir olish" },
  { command: "natija", description: "Futbol natijalari, o'yinlar, jadval" },
  { command: "logolar", description: "Barcha klub va ligalar ro'yxati" },
  { command: "diktor", description: "Matnni ovozli qilish (diktor)" },
  { command: "talaffuz", description: "Diktor talaffuz lug'ati" },
    { command: "fikr", description: "Shaxsiy fikr posti (ovozli yoki matn)" },
    { command: "video", description: "Navbatdagi videoni hozir olish" },
{ command: "navbat", description: "Navbatda nechta yangilik bor" },
{ command: "pauza", description: "Botni vaqtincha to'xtatish" },
{ command: "davom", description: "Botni qayta yoqish" },
{ command: "adminlar", description: "Bot foydalanuvchilari" },
{ command: "bekor", description: "Saqlangan fikrni bekor qilish" },
{ command: "test", description: "Kanalga sinov xabari" },
{ command: "yordam", description: "Yordam va buyruqlar" },
];
async function showMenu(env, chat, title) {
await tg(env, "setMyCommands", { commands: COMMANDS });
await tg(env, "sendMessage", { chat_id: chat, text: (title ? title + "\n\n" : "") + HELP, reply_markup: MENU_KB });
}

    // YouTube kanalining barcha videolari (uploads pleylisti), RSS faqat oxirgi 15 tasini beradi
async function ytArchive(channelId, source, maxPages = 10) {
  const out = [];
  const walk = (o, acc) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { for (const x of o) walk(x, acc); return; }
    if (o.playlistVideoRenderer?.videoId) {
      const v = o.playlistVideoRenderer;
      acc.v.push({ id: v.videoId, title: (v.title?.runs || []).map((r) => r.text).join("") || v.title?.simpleText || "" });
      return;
    }
    if (o.lockupViewModel?.contentId && /VIDEO/.test(o.lockupViewModel.contentType || "VIDEO")) {
      const l = o.lockupViewModel;
      acc.v.push({ id: l.contentId, title: l.metadata?.lockupMetadataViewModel?.title?.content || "" });
      return;
    }
    if (o.continuationCommand?.token) acc.t = o.continuationCommand.token;
    for (const k in o) walk(o[k], acc);
  };
  try {
    const H = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "accept-language": "en-US,en;q=0.9", cookie: "CONSENT=YES+1; SOCS=CAI" };
    const html = await (await fetch("https://www.youtube.com/playlist?list=UU" + channelId.slice(2) + "&hl=en", { headers: H })).text();
    const m = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!m) return out;
    const ver = (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) || [])[1] || "2.20251020.00.00";
    let acc = { v: [], t: null };
    walk(JSON.parse(m[1]), acc);
    out.push(...acc.v);
    for (let p = 1; p < maxPages && acc.t; p++) {
      const tok = acc.t;
      acc = { v: [], t: null };
      const j = await (await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
        method: "POST", headers: { ...H, "content-type": "application/json" },
        body: JSON.stringify({ context: { client: { clientName: "WEB", clientVersion: ver, hl: "en" } }, continuation: tok }),
      })).json();
      walk(j, acc);
      out.push(...acc.v);
    }
  } catch (e) {}
  return out.map((v) => ({ title: v.title, link: "https://www.youtube.com/watch?v=" + v.id, desc: "", date: 0, source, img: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, video: true }));
}
// video navbati tugasa: kanalning eski videolarini ham navbatga qo'shadi (vaqt chegarasiz, takrorlanmaydi)
async function ytFill(env, st, force = false) {
  const last = await kvGet(env, "ytarch", 0);
  if (Date.now() - last < (force ? 120e3 : 6 * 3600e3)) return;
  await kvPut(env, "ytarch", Date.now());
  const Q = (st.vqueue = st.vqueue || []);
  const vs = (st.vseen = st.vseen || []);
  const seen = new Set(vs);
  for (const f of FEEDS.filter((x) => x.type === "yt")) {
    const id = (f.url.match(/channel_id=([\w-]+)/) || [])[1];
    if (!id) continue;
    for (const it of await ytArchive(id, f.name, 10)) {
      const h = hash(it.link);
      if (seen.has(h)) continue;
      seen.add(h); vs.push(h); Q.push(it);
      if (Q.length >= 500) break;
    }
  }
  st.vseen = vs.slice(-3000);
  await kvPut(env, "st", st);
}
async function collect(env) {
    const st = await kvGet(env, "st", { idx: 0, queue: [], seen: [], titles: [] }); // KV tejash (2026-11-09): navbat tarkibi o'zgarsagina yoki soatda bir marta yoziladi (avval har 10 daqiqada — kuniga ~144 yozuv)
    const sig = (s) => hash((s.queue || []).map((i) => i.link).join("|")) + "|" + (s.queue || []).length + "|" + (s.vqueue || []).length; const sig0 = sig(st); st.idx = (Math.floor(Date.now() / 600e3) * 2) % FEEDS.filter((f) => f.type !== "yt").length;
const NEWS = FEEDS.filter((f) => f.type !== "yt");
const feeds = [NEWS[st.idx % NEWS.length], NEWS[(st.idx + 1) % NEWS.length], NEWS[(st.idx + 2) % NEWS.length], ...FEEDS.filter((f) => f.type === "yt")];
st.idx = (st.idx + 3) % NEWS.length;
let items = [];
for (const feed of feeds) {
try {
const r = await fetch(feed.url, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } });
const xml = (await r.text()).slice(0, feed.type === "sitemap" ? 250000 : 150000);
items.push(...(feed.type === "sitemap" ? parseSitemap(xml, feed.name) : feed.type === "yt" ? parseYt(xml, feed.name) : parseRss(xml, feed.name)));
} catch (e) {}
}
    const seen = new Set(st.seen);
    for (const it of items) {
    if (!it.video && Date.now() - it.date > MAX_AGE_HOURS * 3600e3) continue;
    const h = hash(it.link);
    if (seen.has(h) || (it.video && (st.vseen || []).includes(h))) continue;
    seen.add(h); st.seen.push(h); if (it.video) (st.vseen = st.vseen || []).push(h);
    if (st.titles.some((t) => similar(t, it.title))) continue;
    if (!it.video && !isFocus(it)) continue;
    it.prio = PRIORITY.test(it.title + " " + it.desc) ? 1 : 0;
    (it.video ? (st.vqueue = st.vqueue || []) : st.queue).push(it);
    st.titles.push(it.title);
    }
    // o'zini o'zi rivojlantirish: kanalda ko'p ko'rilgan mavzular navbatda oldinga chiqadi (engStats — kunlik ko'rishlar tahlili)
    const TW = await kvGet(env, "topicW", {}); const tw = (i) => { let x = 0; for (const t of topicsOf(i.title + " " + (i.desc || ""))) x += TW[t] || 0; return Math.max(-0.9, Math.min(0.9, x)); };
    for (const i of st.queue) i.tw = tw(i);
    st.queue = st.queue
    .filter((i) => Date.now() - i.date < MAX_AGE_HOURS * 3600e3 && isFocus(i))
    .sort((a, b) => ((b.prio || 0) + (b.tw || 0)) - ((a.prio || 0) + (a.tw || 0)) || b.date - a.date)
    .slice(0, QUEUE_LIMIT);
    st.vqueue = (st.vqueue || [])
    .filter((i) => i.video)
    .sort((a, b) => (b.prio || 0) - (a.prio || 0) || b.date - a.date)
    .slice(0, 500);
    st.seen = st.seen.slice(-800); st.vseen = (st.vseen || []).slice(-3000);
    st.titles = st.titles.slice(-200);
if ((st.vqueue || []).length < 20) await ytFill(env, st);
    if (sig(st) !== sig0 || Date.now() - (st.sv || 0) > 3600e3) { st.sv = Date.now(); await kvPut(env, "st", st); }
    return st;
    }
    
    async function sendNext(env, opts = {}) {
    const admin = opts.chat || (await getAdmins(env))[0];
    if (!admin) return "noadmin";
    const isV = opts.kind === "v";
    const pk = isV ? "vpending" : "pending";
    if (!opts.force) {
    if (await kvGet(env, "paused", false)) return "paused";
    if (await kvGet(env, pk, null)) return "pending";
    }
    const st = opts.st || (await kvGet(env, "st", null));
    if (!st) return "empty";
    const Q = isV ? (st.vqueue = st.vqueue || []) : st.queue;
if (isV && !Q.length) await ytFill(env, st, true);
    if (!Q.length) return "empty";
    let skipped = 0;
    for (let tries = 0; tries < 6 && Q.length; tries++) {
    const item = Q.shift();
    await kvPut(env, "st", st);
    if (opts.exclude && item.link === opts.exclude) continue;
    if (!item.video && Date.now() - item.date > MAX_AGE_HOURS * 3600e3) continue;
if (item.video && (item.source !== "InterFutbol TV" || !(await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(item.link)).then((r) => r.ok).catch(() => true)))) continue;
    await enrich(item);
    if (!item.video && womenItem(item)) continue;
    let post;
    try { post = await writePost(env, item, 0, opts.deadline || Infinity); }
    catch (e) {
    Q.unshift(item);
    await kvPut(env, "st", st);
    if (opts.manual) return "busy";
    const last = await kvGet(env, "lastWarn", 0);
    if (Date.now() - last > 3600e3) {
    await kvPut(env, "lastWarn", Date.now());
    await tg(env, "sendMessage", { chat_id: admin, text: "⏳ Sun'iy intellekt serverlari hozir band. Bot har 10 daqiqada o'zi qayta urinadi, siz hech narsa qilishingiz shart emas." });
    }
    return "busy";
    }
    let note = "";
    if (post && !item.video) { const cp = await checkedPost(env, item, post, opts.deadline ? Math.min(opts.deadline - 6000, Date.now() + 15000) : Date.now() + 40000); post = cp.post; note = cp.note; }
    if (!post) { skipped++; continue; }
    // qo'lda rejimda ham takror voqea navbatga qo'yilmaydi
    if (!item.video && (await dupNews(env, post).catch(() => false))) { skipped++; continue; }
    const head = `${isV ? "🎬 Video navbatida" : "🗂 Navbatda"}: ${Q.length} ta | <a href="${esc(item.link)}">asl manba</a>${note ? "\n" + esc(note) : ""}\n━━━━━━━━━━━━\n`;
    const pb = item.video ? null : await pickBranded(env, item, opts.deadline ? Math.min(opts.deadline - 5000, Date.now() + 20000) : Date.now() + 60000);
    const img = item.video ? null : pb || (await kvGet(env, "defImg", null));
    const m = item.video ? await sendVideo(env, admin, head + post, item.link, keyboard(false, null, true)) : await sendRich(env, admin, head + post, img, keyboard(!!img));
    if (!m.ok) {
    await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Post formatida xato: " + m.description });
    continue;
    }
    const pend = { item, post, img: m.usedImg, msg: m.result.message_id, chat: admin, variant: 0 };
    await kvPut(env, pk, pend);
    if (item.video) return "sent";
    if (!pb) await cardJob(env, pk, pend).catch(() => {});
    try {
    const url = await makeArticle(env, pend, opts.deadline || Infinity);
    await kvPut(env, artKey(pend), url, { expirationTtl: 2 * 86400 });
    await tg(env, "editMessageReplyMarkup", { chat_id: admin, message_id: pend.msg, reply_markup: keyboard(!!pend.img, url) });
    } catch (e) {}
    return "sent";
    }
    return Q.length ? "skipped" : "empty";
    }
    
    async function nextManual(env, chat, collectFirst, exclude, t0 = Date.now(), kind = "n") {
    try {
    const st = collectFirst ? await collect(env) : null;
    const res = await sendNext(env, { force: true, manual: true, st, exclude, chat, kind, deadline: t0 + 27000 });
    if (kind !== "v" && Date.now() < t0 + 12000) await fillPending(env, t0 + 27000).catch(() => {});
    const why = {
    empty: kind === "v" ? "📭 Hozircha yangi video yo'q. Bot YouTube kanallarini muntazam tekshiradi, yangisi chiqishi bilan yuboradi." : "📭 Hozircha yangi yangilik yo'q. Bot har 10 daqiqada saytlarni tekshiradi, yangisi chiqishi bilan yuboradi.",
    skipped: "🔎 Bir nechta yangilik futbolga oid bo'lmagani uchun o'tkazib yuborildi. Yana /keyingi bosing.",
    busy: "⏳ Sun'iy intellekt serverlari hozir band. Bir-ikki daqiqadan keyin /keyingi bosing yoki kuting — bot o'zi qayta urinadi.",
    }[res];
    if (why) await tg(env, "sendMessage", { chat_id: chat, text: why });
    } catch (e) {
    await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Xatolik: " + String(e.message || e).slice(0, 300) });
    }
    }

    // ---------------- AVTOMATIK REJIM: yangiliklar va o'yin natijalari kanalga o'zi chiqadi ----------------
// 2026-11-20: tejash rejimi faqat o'zi yoqilgan UTC kuni davomida amal qiladi — Cloudflare limiti har kuni UTC 00:00 da (Toshkent 05:00) yangilanadi.
// (19-noyabr kechqurun limit oshgani uchun yoqilgan rejim 20-noyabr kuni bo'yi kanalni 8 ta yangilik bilan cheklab qo'ygan edi.)
const ecoOn = async (env) => { if (!+(await kvGet(env, "ecoMode", 0))) return false; const l = await kvGet(env, "limLast", null); return !l || !l.t || new Date(l.t).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10); };
const AUTO_DAY_LIMIT = 15, AUTO_GAP_MIN = 60, ECO_DAY_LIMIT = 8; // ECO — tejash rejimida (bepul limit 85% dan oshganda) kunlik yangiliklar soni; // 2026-11-08 Bahtiyor aka qarori: kuniga 10 dan 15 taga, orasi 90 dan 60 daqiqaga
const tashHour = () => (new Date().getUTCHours() + 5) % 24;
// ---------------- SANA NAZORATI (2026-11-08) ----------------
// Kecha topilgan xatolar: "2025-yil 25-oktabr" (to'g'risi 2026), "1-noyabr kuni Villa – United" (to'g'risi 8-noyabr).
// 1) Yil: post sanasi o'tgan yilniki, lekin shu kun-oy joriy yilda ±60 kun ichida va manbada o'tgan yil yo'q bo'lsa — joriy yilga tuzatiladi.
// 2) O'yin sanasi: gapda sana va ikki klub bo'lsa, ESPN jamoa jadvalidan shu juftlik o'yini qidiriladi; ±30 kunda yagona o'yin topilib,
//    sanasi postdagidan farq qilsa (±1 kun vaqt mintaqasi uchun ruxsat) — postdagi sana rasmiy sanaga almashtiriladi.
const UZ_MON = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const DATE_RE = /(\d{4})-yil\s+(\d{1,2})-(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)/gi;
const DC_LG = [[/Premier League|Premyer[- ]liga|\bAPL\b/i, "eng.1"], [/LaLiga|La Liga/i, "esp.1"], [/Serie A|Seriya A/i, "ita.1"], [/Bundesliga/i, "ger.1"], [/Ligue 1/i, "fra.1"], [/[CÇ]h?empionlar ligasi|Champions League/i, "uefa.champions"], [/Yevropa ligasi|Europa League/i, "uefa.europa"], [/Konferensiya|Conference League/i, "uefa.europa.conf"], [/S[üu]per Lig/i, "tur.1"], [/Saudiya|Roshn|Saudi Pro/i, "ksa.1"], [/\bMLS\b/i, "usa.1"], [/Eredivisie/i, "ned.1"], [/Primeira|Portugaliya chempionati/i, "por.1"], [/Championship/i, "eng.2"]];
async function dateCheck(env, post, item) {
  let text = String(post); const fixes = [];
  const now = Date.now(), y0 = new Date(now + 5 * 3600e3).getUTCFullYear();
  const src = [item?.title, item?.desc, item?.text].join(" ");
  for (const m of [...text.matchAll(DATE_RE)]) {
    const y = +m[1], d = +m[2], mo = UZ_MON.indexOf(m[3].toLowerCase());
    if (y !== y0 - 1) continue;
    const cur = Date.UTC(y0, mo, d);
    if (Math.abs(cur - now) > 60 * 86400e3 || src.includes(String(y))) continue;
    text = text.split(m[0]).join(y0 + "-yil " + d + "-" + UZ_MON[mo]); fixes.push(m[0] + " → " + y0 + "-yil");
  }
  // 2026-11-14: faqat hafta kuni ("juma oqshomi") — kelasi zamondagi gapda (o'yin bo'ladi, kutilmoqda) aniq sana qo'shiladi.
  // Sana UTC kunidan (Yevropa/Afrika mahalliy kuniga yaqin) 0–6 kun ichidagi shu hafta kuni; o'tgan zamon yoki aniq sana bor gapga tegilmaydi.
  { const WD = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"]; const AP = "['ʻ’‘ʼ`]";
    const FUT = new RegExp("(adigan|ydigan|moqda|kutil|rejalashtir|niyat|bo" + AP + "lib o" + AP + "tadi|o" + AP + "tkaziladi|o" + AP + "ynaydi|uchrashadi|bo" + AP + "ladi)", "iu");
    const PAST = new RegExp("(bo" + AP + "lib o" + AP + "td|o" + AP + "tkazild|o" + AP + "ynad|kechgan|yakunland|g" + AP + "alaba qozond|mag" + AP + "lub bo" + AP + "ld|yutd|yutqazd)", "iu");
    const WRE = /(?<![\p{L}])(dushanba|seshanba|chorshanba|payshanba|juma|shanba|yakshanba)(\s+)(kuni|oqshomi|kechqurun|ertalab|kechasi)(?![\p{L}])/iu;
    const parts = text.split(/(?<=[.!?])(\s+)/);
    for (let i = 0; i < parts.length; i++) { const sn = parts[i]; const m = sn.match(WRE); if (!m) continue;
      const before = sn.slice(0, m.index); if (/\d{1,2}-(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)\S*\s*,?\s*$/i.test(before)) continue;
      if (DATE_RE.test(sn)) { DATE_RE.lastIndex = 0; continue; } DATE_RE.lastIndex = 0;
      if (!FUT.test(sn) || PAST.test(sn)) continue;
      const wd = WD.indexOf(m[1].toLowerCase()); const base = new Date(now); const k = (wd - base.getUTCDay() + 7) % 7; const t = new Date(now + k * 86400e3);
      const ds = t.getUTCFullYear() + "-yil " + t.getUTCDate() + "-" + UZ_MON[t.getUTCMonth()];
      parts[i] = sn.slice(0, m.index) + ds + ", " + m[0].toLowerCase() + sn.slice(m.index + m[0].length); fixes.push(m[0] + " → " + ds + " (hafta kuni)"); }
    text = parts.join(""); }
  // 2026-11-15 (17:51 posti "2026-yil yanvar oyida transferlar uchun mablag' ajratishni rejalashtirmoqda"): noyabrda kelasi zamondagi gapda kunsiz
  // "joriy yil + o'tib ketgan oy" — keyingi yil (qishki transfer oynasi 2027-yil yanvarida). O'tgan zamon yoki manbada shu yil yozilgan bo'lsa tegilmaydi.
  { const AP = "['ʻ’‘ʼ`]"; const mNow = new Date(now + 5 * 3600e3).getUTCMonth();
    const FUT2 = new RegExp("(adigan|ydigan|moqda|kutil|rejalashtir|niyat|tayyor|moqchi|ochiladi|ochilad|bo" + AP + "ladi|ehtimol|mumkin|transfer(?:lar)? oyna)", "iu"); // 2026-11-19: 347-post "...egallasa, 2026-yil yanvar oyidagi transfer oynasi... ehtimoli mavjud"
    const PAST2 = new RegExp("(edi\\b|gan edi|bo" + AP + "ld|qildi|o" + AP + "tkazild|sotib olgan|qo" + AP + "shilgan|imzolagan|dan beri)", "iu");
    const MRE = new RegExp("(?<![\\p{L}\\d-])" + y0 + "-yil (" + UZ_MON.join("|") + ")(?![\\p{L}]*-)", "giu");
    if (mNow >= 9 && !src.includes(String(y0))) { const parts = text.split(/(?<=[.!?])(\s+)/);
      for (let i = 0; i < parts.length; i++) { const sn = parts[i]; if (!FUT2.test(sn) || PAST2.test(sn)) continue;
        parts[i] = sn.replace(MRE, (m, mo) => { const k = UZ_MON.indexOf(mo.toLowerCase()); if (k < 0 || k > 2) return m; fixes.push(m + " → " + (y0 + 1) + "-yil"); return (y0 + 1) + "-yil " + mo; }); }
      text = parts.join(""); } }
  // o'yin sanasi: gaplarga bo'lib, har gapda sana + klublar
  const names = [...new Set(CLUB_EMOJI.flatMap(([, , ns]) => ns))].filter((n) => n.length >= 4).sort((a, b) => b.length - a.length);
  const plain = text.replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "");
  const sl = DC_LG.filter(([re]) => re.test(plain)).map(([, x]) => x); const slugs = [...new Set([...sl, "eng.1", "esp.1", "ita.1", "ger.1", "fra.1", "uefa.champions"])].slice(0, 4);
  let checks = 0;
  for (const sent of plain.split(/(?<=[.!?])\s+|\n+/)) {
    const dm = [...sent.matchAll(DATE_RE)]; if (dm.length !== 1) continue;
    const y = +dm[0][1], d = +dm[0][2], mo = UZ_MON.indexOf(dm[0][3].toLowerCase()); const D = Date.UTC(y, mo, d);
    if (D < now - 14 * 86400e3 || D > now + 45 * 86400e3) continue;
    let rest = sent; const clubs = [];
    for (const n of names) { const re = new RegExp("(^|[^\\p{L}])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}])", "u"); if (re.test(rest)) { clubs.push(n); rest = rest.replace(re, "$1 "); } if (clubs.length > 2) break; }
    if (clubs.length !== 2 || ++checks > 2) continue;
    const ev = await pairMatches(slugs, clubs[0], clubs[1]); if (!ev.length) continue;
    const near = ev.filter((t) => Math.abs(t - D) <= 1.5 * 86400e3); if (near.length) continue;
    const win = ev.filter((t) => Math.abs(t - D) <= 30 * 86400e3); if (win.length !== 1) continue;
    const td = new Date(win[0]); const good = td.getUTCFullYear() + "-yil " + td.getUTCDate() + "-" + UZ_MON[td.getUTCMonth()];
    const re = new RegExp(dm[0][0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    text = text.replace(re, good); fixes.push(dm[0][0] + " → " + good + " (" + clubs.join(" – ") + ", ESPN)");
  }
  // 2026-11-15: terma jamoalar o'yini sanasi (284-post: 2026-yil 14-noyabr 19:45 UTC o'yini "2026-yil 7-noyabr" deb yozilgan) — ESPN umumiy tablosidan (oxirgi 3 kun) tugagan o'yin topilsa, sana Toshkent kuniga tuzatiladi
  try { const pl2 = text.replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, ""); const h0 = pl2.split("\n")[0];
    const nt = natTeams(h0); if (nt.length === 2 && RES_RE.test(natNorm(h0))) {
      let ev = null; for (let k = 0; k <= 3 && !ev; k++) { const dd = new Date(now - k * 86400e3); const ds = dd.toISOString().slice(0, 10).replace(/-/g, ""); let j; try { j = await (await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=" + ds + "&limit=400", { cf: { cacheTtl: 300 } })).json(); } catch (e) { continue; }
        for (const e of j.events || []) { if (!e.status?.type?.completed) continue; const cs = e.competitions?.[0]?.competitors || []; if (cs.length !== 2) continue; if (/u-?\d{2}|wom[ae]n|youth/i.test(String(e.season?.slug || "") + " " + cs.map((c) => c.team?.displayName).join(" "))) continue; const tn = cs.map((c) => natTeams(cnUz(c.team?.displayName || ""))[0]).filter(Boolean); if (tn.length === 2 && nt.every((c) => tn.includes(c))) { ev = e; break; } } }
      if (ev) { const t0 = Date.parse(ev.date); const tk = new Date(t0 + 5 * 3600e3), ut = new Date(t0); const okD = [tk, ut].map((x) => x.getUTCFullYear() + "-yil " + x.getUTCDate() + "-" + UZ_MON[x.getUTCMonth()]); const good = okD[0];
        const MS = /o'yin|uchrash|bahs|hisob|\d+\s*:\s*\d+|g'alaba|mag'lub|durang/; const sents = text.split(/(?<=[.!?\n])/); for (const m of [...text.matchAll(DATE_RE)]) { const D = Date.UTC(+m[1], UZ_MON.indexOf(m[3].toLowerCase()), +m[2]); if (D > now || D < now - 30 * 86400e3) continue; const sn = sents.find((x) => x.includes(m[0])) || ""; if (!MS.test(natNorm(sn))) continue; const cur = m[1] + "-yil " + (+m[2]) + "-" + m[3].toLowerCase(); if (okD.includes(cur)) continue; text = text.split(m[0]).join(good); fixes.push(m[0] + " → " + good + " (" + nt.join(" – ") + ", ESPN)"); } } } } catch (e) {}
  return { text, fixes };
}
// ikki klub o'yinlari sanalari (Toshkent vaqti bo'yicha kun boshi, ms) — ESPN liga jamoalari ro'yxati va jamoa jadvalidan
async function pairMatches(slugs, A, B) {
  const nk = (x) => norm(ESPN_NAME[x] || x);
  for (const sl of slugs) {
    let tl; try { tl = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${sl}/teams`, { cf: { cacheTtl: 86400 } })).json(); } catch (e) { continue; }
    const teams = (tl.sports?.[0]?.leagues?.[0]?.teams || []).map((t) => t.team);
    const hit = (n) => teams.find((t) => [t.displayName, t.shortDisplayName, t.name].some((x) => x && (nk(x) === nk(n) || norm(n) === norm(x))));
    const ta = hit(A), tb = hit(B); if (!ta || !tb) continue;
    const out = [];
    for (const fx of ["?fixture=true", ""]) {
      let j; try { j = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${sl}/teams/${ta.id}/schedule${fx}`, { cf: { cacheTtl: 3600 } })).json(); } catch (e) { continue; }
      for (const e of j.events || []) { const cs = e.competitions?.[0]?.competitors || []; if (cs.some((c) => String(c.team?.id || c.id) === String(tb.id))) { const t = Date.parse(e.date) + 5 * 3600e3; const dd = new Date(t); out.push(Date.UTC(dd.getUTCFullYear(), dd.getUTCMonth(), dd.getUTCDate())); } }
    }
    return [...new Set(out)];
  }
  return [];
}

// ---------------- G'OYALAR DVIGATELI (2026-11-08, Bahtiyor aka: "kanal o'zini o'zi rivojlantirsin, yangi g'oyalar") ----------------
// Har dushanba AI kanal statistikasiga qarab 2 ta yangi post SHAKLI o'ylab topadi (faktlar baribir real yangilikdan olinadi).
// Har kuni 18:00 da bitta navbatdagi yangilik shu shakllardan birida chiqadi (kunlik 15 ta ichida). 7 kun va kamida 5 post
// o'lchangach: o'rtacha ko'rishi yangiliklardan past bo'lmasa — "doimiy", aks holda — "to'xtatildi". Adminga har bir g'oya
// "❌ Kerak emas" tugmasi bilan keladi — bosilsa taqiqlar ro'yxatiga tushadi va boshqa taklif qilinmaydi.
const IDEA_BAN0 = ["so'rovnoma / ovoz berish / bashorat (Bahtiyor aka rad etgan)", "o'yin davomida jonli gol xabarlari (rad etilgan)", "Hafta futbolchisi (hozircha qiziq emas)", "terma jamoa bo'limi (hozircha qiziq emas)", "Rossiya ichki futboli: RPL, Rossiya terma jamoasi, rus ekspertlari fikri", "stavka/bukmeker", "futbolchi reytinglari (baholar)"];
async function ideaGen(env) {
  const ideas = await kvGet(env, "ideas", []); const live = ideas.filter((x) => x.st === "test");
  if (live.length >= 2) return "bor";
  const ban = [...IDEA_BAN0, ...(await kvGet(env, "ideaBan", []))]; const es = (await kvGet(env, "engStats", null)) || {};
  const prompt = `Sen "Inter Futbol" o'zbek Telegram futbol kanalining kontent strategisan. Kanal: yangiliklar (kuniga 15 ta), o'yin natijalari kartochka bilan, chet eldagi o'zbek futbolchilari (asosiy noyob yo'nalish), Ronaldo va Messi, top klublar, tarixiy va qiziqarli faktlar, raqamlar.
Statistika (post turi: o'rtacha ko'rish): ${JSON.stringify(es.typeStats || {})}; mavzular: ${JSON.stringify(es.topicStats || {})}.
Mavjud shakllar: ${ideas.map((x) => x.name + " (" + x.st + ")").join(", ") || "yo'q"}.
TAQIQLANGAN (taklif qilma): ${ban.join("; ")}.
Vazifa: kanalga kirgan odam zerikmasligi va obuna bo'lishi uchun 2 ta YANGI yangilik POST SHAKLI taklif qil. Shakl real yangilik matnini qayta ishlaydi (yangi fakt o'ylab topilmaydi): masalan sarlavha uslubi, "3 ta asosiy narsa" ro'yxati, o'zbek muxlisi uchun ahamiyati, kontekst/tarix bilan bog'lash, savol bilan tugash va h.k. Har biri qisqa, o'zbek lotin yozuvida.
Faqat JSON qaytar: [{"name":"qisqa nom","style":"AI muharrirga 1-2 gaplik aniq ko'rsatma","tag":"#CamelCaseUzbekHeshteg"}]`;
  let arr; try { const t = await callGemini(env, prompt, 0.9, Date.now() + 40000, 1024, false, true); arr = JSON.parse((t.match(/\[[\s\S]*\]/) || ["[]"])[0]); } catch (e) { return "ai xato"; }
  const admin = (await getAdmins(env))[0]; let n = 0;
  for (const x of (arr || []).slice(0, 2 - live.length)) {
    if (!x || !x.name || !x.style || !/^#[A-Za-z][A-Za-z0-9]{3,30}$/.test(String(x.tag || ""))) continue;
    if (ideas.some((y) => y.tag.toLowerCase() === x.tag.toLowerCase() || y.name.toLowerCase() === String(x.name).toLowerCase())) continue;
    const id = "i" + Date.now().toString(36) + n; ideas.push({ id, name: String(x.name).slice(0, 60), style: String(x.style).slice(0, 400), tag: x.tag, st: "test", t0: Date.now(), made: 0 }); n++;
    if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "💡 Yangi g'oya sinovga olindi: «" + x.name + "»\n" + x.style + "\nHeshteg: " + x.tag + "\n\nBir hafta davomida kuniga 1 ta yangilik shu shaklda chiqadi; ko'rishlar yaxshi bo'lsa doimiy qoladi, bo'lmasa o'zi to'xtaydi.", reply_markup: { inline_keyboard: [[{ text: "❌ Kerak emas", callback_data: "idea:ban:" + id }]] } });
  }
  if (n) await kvPut(env, "ideas", ideas.slice(-30));
  return "ok " + n;
}
// kuniga bitta yangilikni sinovdagi/doimiy shaklga o'tkazadi: navbatdagi mos yangilik nusxasi shakl bilan navbat boshiga qo'yiladi
async function ideaApply(env) {
  const ideas = (await kvGet(env, "ideas", [])).filter((x) => x.st === "test" || x.st === "keep"); if (!ideas.length) return "yo'q";
  const st = await kvGet(env, "st", null); if (!st || !st.queue?.length) return "navbat bo'sh";
  const i = st.queue.findIndex((it) => !it.video && !it.style && Date.now() - it.date < 4 * 3600e3 && isFocus(it)); if (i < 0) return "mos yangilik yo'q";
  const idea = ideas.sort((a, b) => (a.st === "test" ? 0 : 1) - (b.st === "test" ? 0 : 1) || (a.made || 0) - (b.made || 0))[0];
  const it = { ...st.queue[i], style: idea.style, tag: idea.tag, idea: idea.id }; st.queue.splice(i, 1); st.queue.unshift(it); await kvPut(env, "st", st);
  const all = await kvGet(env, "ideas", []); const k = all.find((x) => x.id === idea.id); if (k) { k.made = (k.made || 0) + 1; await kvPut(env, "ideas", all); }
  return "ok " + idea.name;
}
// haftalik baho (engCollect'dan keyin): 7+ kun va 5+ o'lchangan post — o'rtacha yangiliklar o'rtachasidan past emasmi
async function ideaEval(env) {
  const ideas = await kvGet(env, "ideas", []); const L = await kvGet(env, "engLog", []); const out = [];
  const news = L.filter((x) => x.k === "news" && Date.now() - x.t < 14 * 86400e3); const nAvg = news.length ? news.reduce((s, x) => s + x.v, 0) / news.length : 0;
  let ch = false;
  for (const x of ideas) {
    if (x.st !== "test" && x.st !== "keep") continue;
    const a = L.filter((e) => e.ig === x.id); const avg = a.length ? a.reduce((s, e) => s + e.v, 0) / a.length : 0;
    if (x.st === "test" && Date.now() - x.t0 > 7 * 86400e3 && a.length >= 5) { x.st = avg >= nAvg * 0.9 ? "keep" : "drop"; ch = true; }
    out.push(`${x.name}: ${a.length} ta post, o'rtacha ${Math.round(avg)} ko'rish (yangiliklar ${Math.round(nAvg)}) — ${x.st === "keep" ? "doimiy" : x.st === "drop" ? "to'xtatildi" : "sinovda"}`);
  }
  if (ch) await kvPut(env, "ideas", ideas);
  return out;
}
async function autoOn(env) { return (await kvGet(env, "auto", 1)) === 1 && !(await kvGet(env, "paused", false)); }
/* 2026-11-15: terma jamoalar nomlari ⟦⟧ siz yoziladi — Daniya–Portugaliya natijasi 282 va 284-postlarda ikki marta chiqdi (takror tekshiruvi faqat ⟦klub⟧ nomlarini ko'rardi). natTeams matndagi davlat (terma jamoa) nomlarini topadi */
const natNorm = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "").toLowerCase().replace(/[’ʻʼ`‘]/g, "'").replace(/ö/g, "o'").replace(/ğ/g, "g'").replace(/ş/g, "sh").replace(/ç/g, "ch");
const natTeams = (s) => { const t = " " + natNorm(s).replace(/[^\p{L}' ]+/gu, " "); return COUNTRY_FLAGS.filter(([, n]) => n.split("|").some((v) => t.includes(" " + natNorm(v)))).map(([, n]) => n); };
const QUOTE_RE = /fikr|izoh|aytdi|gapirdi|ta'kidla|so'zlari|baho|intervyu|munosabat/i;
const newsNames = (p) => [...new Set([...String(p).matchAll(/⟦([^⟧]+)⟧/g)].map((m) => m[1].toLowerCase()))];
const newsHead = (p) => String(p).split("\n")[0].replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "").trim();
/* 2026-11-17: sarlavha butunlay KATTA harflarda chiqdi ("ELDOR SHOMURODOV "ROSTOV"GA QAYTISH...", o'zbek manbasidan) — oddiy yozuvga o'tkaziladi, xos nomlar matndagi yozuvidan tiklanadi */
function capsHead(p) {
  const L = String(p).split("\n"), plain = L[0].replace(/<[^>]+>|[⟦⟧]/g, "");
  const lt = plain.match(/\p{L}/gu) || [], up = plain.match(/\p{Lu}/gu) || [];
  if (lt.length < 12 || up.length / lt.length < 0.8) return p;
  const M = new Map(), WR = /\p{L}[\p{L}'’‘ʻ-]*/gu;
  for (const w of L.slice(1).join(" ").replace(/<[^>]+>|[⟦⟧]/g, "").match(WR) || []) if (/^\p{Lu}/u.test(w) && !M.has(w.toLowerCase())) M.set(w.toLowerCase(), w);
  let first = true;
  L[0] = L[0].replace(/(<[^>]+>)|(\p{L}[\p{L}'’‘ʻ-]*)/gu, (m, tag, w) => {
    if (tag) return m;
    const lw = w.toLowerCase(); let o = M.get(lw);
    if (!o) for (const [k, v] of M) if (k.length >= 4 && lw.startsWith(k) && (!o || v.length > o.length - (lw.length - k.length))) o = v + lw.slice(k.length);
    if (!o) o = lw;
    if (first) { o = o.charAt(0).toUpperCase() + o.slice(1); first = false; }
    return o;
  });
  return L.join("\n");
}
async function rememberNews(env, post) {
  const r = (await kvGet(env, "recentNews", [])).filter((x) => Date.now() - x.t < 48 * 3600e3);
  r.push({ t: Date.now(), n: newsNames(post), h: newsHead(post) });
  await kvPut(env, "recentNews", r.slice(-40), { expirationTtl: 3 * 86400 });
}
async function dupNews(env, post) {
  const names = newsNames(post), head = newsHead(post);
  const recent = (await kvGet(env, "recentNews", [])).filter((x) => Date.now() - x.t < 48 * 3600e3);
  /* 2026-11-17: Shomurodov–Rostov xabari 09:11 va 15:31 da ikki marta chiqdi — ikkinchisida ism bo'lingan ("Eldor ⟦Shomurodov⟧") va klub qo'shtirnoqda edi, umumiy ⟦nom⟧ topilmadi. Endi eski postdagi nomlar yangi post sarlavhasi va boshida ham qidiriladi */
  const lead = " " + norm(String(post).replace(/<[^>]+>/g, "").replace(/[⟦⟧"«»“”]/g, "").slice(0, 400)) + " ";
  for (const x of recent) {
    const shared = (x.n || []).filter((n) => names.includes(n) || names.some((m) => m.length >= 5 && n.length >= 5 && (m.includes(n) || n.includes(m))) || (norm(n).length >= 4 && lead.includes(" " + norm(n))));
    if (!(shared.length >= 2 || (shared.length >= 1 && Math.min(names.length, x.n.length) <= 2))) continue;
    try {
      const a = await callGemini(env, "Quyidagi ikki futbol yangiligi AYNAN BITTA voqea yoki xabar haqidami (bir xil fakt, faqat boshqacha yozilgan)? Bir futbolchining bir klubga o'tishi haqidagi transfer mish-mishi (klub qiziqmoqda, futbolchi o'tishga tayyor, muzokara boshlandi) yangi aniq fakt (rasmiy kelishuv, summa, imzo) bo'lmasa — HA, bu bitta xabar. Bir odamning bitta intervyusi yoki chiqishidagi gaplari (masalan bosh direktorning transferlar haqidagi fikri, tanqidga javobi) boshqacha sarlavha bilan berilsa ham — HA, bu bitta xabar (2026-11-21: Omar Berrada, 374 va 377-postlar). Bir klub yoki futbolchi haqidagi ikki xil voqea bo'lsa — YO'Q. Faqat HA yoki YO'Q deb javob ber.\n1) " + x.h + "\n2) " + head + "\n" + String(post).replace(/<[^>]+>/g, "").slice(0, 600), 0, Date.now() + 15000, 20, false, true);
      if (/^\s*HA\b/i.test(a)) return true;
    } catch (e) { if (shared.length >= 3 || (shared.length >= 2 && Date.now() - x.t < 12 * 3600e3 && norm(String(x.h || "")).split(" ")[0] === norm(String(head || "").replace(/[⟦⟧]/g, "")).split(" ")[0])) return true; }
  }
  return false;
}
const head1 = (p) => { const L = String(p).split("\n").slice(0, 4); return L.find((l) => /\d+\s*[:–-]\s*\d+/.test(l.replace(/<[^>]+>/g, "")) && (l.match(/⟦/g) || []).length >= 2) || L[0] || ""; };
const headSig = (p) => { const h = head1(p); const s = (h.match(/(\d+)\s*[:–-]\s*(\d+)/) || []).slice(1).join(":"); if (!s) return ""; return [...h.matchAll(/⟦([^⟧]+)⟧/g)].map((m) => m[1].toLowerCase()).slice(0, 2).join("|") + "#" + s; }; const RES_RE = /\d+\s*[:–-]\s*\d+|hisobida|g'alaba|ğalaba|yengdi|mag'lub|mağlub|durang/i; const RATING_RE = /индекс[а-яё]* гол|оценк[аи] (игрок|футболист)|рейтинг игроков|player ratings|\bratings\b|marks out of 10/i; async function officialScores(days) { const out = []; for (const d of days) { let j; try { j = await (await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=" + d.replace(/-/g, "") + "&limit=400", { cf: { cacheTtl: 300 } })).json(); } catch (e) { continue; } for (const e of j.events || []) { if (!e.status?.type?.completed) continue; const cs = e.competitions?.[0]?.competitors || []; if (cs.length !== 2) continue; const wm = /wom[ae]n|femen|f[eé]minin|frauen|liga-f\b|nwsl|girls/i.test(String(e.season?.slug || "") + " " + String(e.shortName || "")); out.push(Object.assign(cs.map((x) => ({ names: [x.team?.displayName, x.team?.shortDisplayName, x.team?.name, x.team?.location].filter(Boolean).map(norm), g: Number(x.score) })), { w: wm })); } } return out; } const nameHit = (n, names) => { const a = norm(n); return a.length >= 3 && names.some((b) => b && b.length >= 3 && (b === a || b.includes(a) || a.includes(b))); }; /* 2026-11-14: "Argentina Urugvayga 2:1 hisobida mag'lub bo'ldi" — sarlavhadagi terma jamoa nomlari ⟦⟧ siz bo'lgani uchun hisob tekshirilmagan (rasmiy: Argentina 1:2 Uruguay). ⟦⟧ nomlar 2 tadan kam bo'lsa, hisobdan oldingi bosh harfli so'zlar olinadi (o'zbekcha qo'shimchasiz) va 4 harfli bosh qism bilan ham solishtiriladi (Urugvay ~ Uruguay) */ const headTeams = (h) => { const nm = [...h.matchAll(/⟦([^⟧]+)⟧/g)].map((m) => m[1]); if (nm.length >= 2) return nm; const pre = h.replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "").split(/\d+\s*[:–-]\s*\d+/)[0]; const t = [...pre.matchAll(/(?<![\p{L}'’])\p{Lu}[\p{L}'’.-]+/gu)].map((m) => m[0].replace(/(?:ning|dagi|dan|ga|ni|da|ni)$/u, (x, i, str) => (str.length - x.length >= 4 ? "" : x))); return t.length >= 2 ? t.slice(0, 2) : nm; }; const nameHitF = (n, names) => { if (nameHit(n, names)) return true; const a = norm(n).replace(/\s+/g, ""); return a.length >= 5 && names.some((b) => { const c = String(b || "").replace(/\s+/g, ""); return c.length >= 5 && c.slice(0, 4) === a.slice(0, 4) && Math.abs(c.length - a.length) <= 3; }); }; async function scoreGuard(post) { const h = head1(post); const sm = h.replace(/<[^>]+>/g, "").match(/(\d+)\s*[:–-]\s*(\d+)/); if (!sm) return "ok"; const nm = headTeams(h); if (nm.length < 2) return "ok"; const nameHit = nameHitF; const days = [0, 1, 2].map((k) => new Date(Date.now() - k * 86400e3).toISOString().slice(0, 10)); const ms0 = await officialScores(days); const hit2 = (x) => (nameHit(nm[0], x[0].names) && nameHit(nm[1], x[1].names)) || (nameHit(nm[0], x[1].names) && nameHit(nm[1], x[0].names)); const sc2 = (x) => { const [A, B] = nameHit(nm[0], x[0].names) && nameHit(nm[1], x[1].names) ? [x[0], x[1]] : [x[1], x[0]]; return A.g === Number(sm[1]) && B.g === Number(sm[2]); }; const men = ms0.filter((x) => !x.w && hit2(x)), wom = ms0.filter((x) => x.w && hit2(x)); if (wom.some(sc2) && !men.some(sc2)) return "women"; const ms = men.length ? men : ms0; const m = ms.find((x) => (nameHit(nm[0], x[0].names) && nameHit(nm[1], x[1].names)) || (nameHit(nm[0], x[1].names) && nameHit(nm[1], x[0].names))); if (!m) return "unknown"; const [A, B] = nameHit(nm[0], m[0].names) && nameHit(nm[1], m[1].names) ? [m[0], m[1]] : [m[1], m[0]]; return A.g === Number(sm[1]) && B.g === Number(sm[2]) ? "ok" : "bad"; } const AUDIT_RULES = [[/(?<![\p{L}])(?:A Seriya|Seriya A)(?![\p{L}])/u, "liga nomi «Serie A» bo'lishi kerak"], [/(?<![\p{L}#])(?:Al[- ]Nasr|Al Nassr|Al-Nassr FC)(?![\p{L}])/u, "klub nomi «Al-Nassr» bo'lishi kerak"], [/(?<![\p{L}#])(?:Atletico|Bayern Munich|Barselona|Yuventus|Abdukodir|Khusanov|Uzbekistan)(?![\p{L}])|(?<![\p{L}#])Mbappe(?![\p{L}é])/u, "rasmiy yoki o'zbekcha nom buzilgan"], [/#(?:Chempionlar|ChempionlarLigasi|YevropaLigasi|PremyerLiga|LaLiga[^\s]*Ispaniya)/iu, "turnir heshtegi inglizcha bo'lishi kerak (#ChampionsLeague)"], [/(?<![\p{L}])(?:bugun(?:gi|gacha|dan)?|kecha(?:gi)?|ertaga(?:gi)?|shu kuni)(?![\p{L}])/iu, "nisbiy sana (bugun/kecha/ertaga) — aniq sana yili bilan bo'lishi kerak"], [/(?<!\d{1,2}-\p{L}+,?\s*)(?<![\p{L}])(?:dushanba|seshanba|chorshanba|payshanba|juma|shanba|yakshanba)\s+(?:kuni|oqshomi|kechqurun|ertalab)(?![\p{L}])/iu, "faqat hafta kuni yozilgan (masalan «juma kuni») — aniq sana yili bilan bo'lishi kerak"], [/&amp;|&quot;|&#\d+;/u, "matnda HTML kodi ko'rinib qolgan"], [/ı/u, "turkcha «ı» harfi (rasmiy ism bo'lmasa xato)"]]; const unHtml1 = (t) => String(t || "").replace(/&(amp|lt|gt|quot);/g, (m, e) => ({ amp: "&", lt: "<", gt: ">", quot: "\"" })[e]); function auditPost(x, ms) { const p = unHtml1(x.p); const out = []; for (const [re, why] of AUDIT_RULES) if (re.test(p.replace(/⟦[^⟧]*⟧/g, (m) => (/ı/.test(m) ? m.replace(/ı/g, "i") : m)))) out.push(why); if (x.def) out.push("standart rasm qo'yilgan (kartochka bo'lishi kerak edi)"); const h = head1(p); const sm = h.match(/(\d+)\s*[:–-]\s*(\d+)/); const nm = headTeams(h); const nameHit = nameHitF; if (sm && nm.length >= 2 && ms) { const m = ms.find((y) => (nameHit(nm[0], y[0].names) && nameHit(nm[1], y[1].names)) || (nameHit(nm[0], y[1].names) && nameHit(nm[1], y[0].names))); if (m) { const [A, B] = nameHit(nm[0], m[0].names) && nameHit(nm[1], m[1].names) ? [m[0], m[1]] : [m[1], m[0]]; if (!(A.g === Number(sm[1]) && B.g === Number(sm[2]))) out.push("hisob yoki g'olib rasmiy natijaga mos emas (" + nm[0] + " " + A.g + ":" + B.g + " " + nm[1] + ")"); } } return out; } async function dayLog(env, text, img, bot) { try { const k = "dayPosts:" + tashDate(Date.now()); const L = await kvGet(env, k, []); const p = String(text || "").replace(/<[^>]+>/g, "").slice(0, 1500); if (!p.trim() || L.some((x) => x.p === p)) return; const def = await kvGet(env, "defImg", null); L.push({ t: Date.now(), p, def: !!(img && def && img === def), bot: !!bot }); await kvPut(env, k, L.slice(-60), { expirationTtl: 3 * 86400 }); } catch (e) {} } async function dailyAudit(env, chat) { const d = tashDate(Date.now()); const L = await kvGet(env, "dayPosts:" + d, []); const admin = chat || (await getAdmins(env))[0]; if (!admin) return; const SC = /\d+\s*[:–-]\s*\d+/; const days = [0, 1, 2].map((k) => new Date(Date.now() - k * 86400e3).toISOString().slice(0, 10)); let ms = null; if (L.some((x) => SC.test(head1(x.p)))) ms = await officialScores(days).catch(() => null); const bad = []; L.forEach((x, i) => { const why = auditPost(x, ms); const h = head1(x.p); const nm = [...h.matchAll(/⟦([^⟧]+)⟧/g)].map((m) => m[1].toLowerCase()); if (SC.test(h) && nm.length >= 2 && L.slice(0, i).some((y) => { const hy = head1(y.p); const ny = [...hy.matchAll(/⟦([^⟧]+)⟧/g)].map((m) => m[1].toLowerCase()); return SC.test(hy) && nm.filter((n) => ny.includes(n)).length >= 2; })) why.push("shu o'yin natijasi kanalda ikkinchi marta chiqqan"); if (why.length) bad.push({ h: h.replace(/[⟦⟧]/g, "").slice(0, 90), t: x.t, why }); }); const dl = d.slice(0, 4) + "-yil " + uzDay(d).split(",")[0]; let msg = "🔎 Kunlik tekshiruv — " + dl + "\nTekshirildi: " + L.length + " ta post."; if (!L.length) msg += "\nBu kun uchun qayd etilgan post yo'q."; else if (!bad.length) msg += "\n✅ Hech qanday xato topilmadi."; else msg += "\n⚠️ Shubhali postlar: " + bad.length + " ta\n\n" + bad.slice(0, 15).map((b, k) => (k + 1) + ") " + tashTime(new Date(b.t).toISOString()) + " — «" + b.h + "»\n   • " + b.why.join("\n   • ")).join("\n\n") + "\n\nXato postlar tahrirlab tuzatiladi (o'chirilmaydi)."; msg += await opsReport(env, d).catch(() => ""); await tg(env, "sendMessage", { chat_id: admin, text: msg.slice(0, 4000), disable_web_page_preview: true }); } /* 2026-11-13: 245-post — natija posti "Russia" nomi bilan eslab qolingan, yangilik esa "Rossiya" deb yozilgani uchun takror tutilmagan; davlat nomi o'zbekchaga keltirib solishtiriladi */
const cnUz = (n) => { const s = String(n || ""); return COUNTRY.reduce((x, [re, v]) => x.replace(re, v), s.charAt(0).toUpperCase() + s.slice(1)); };
async function resultDup(env, post) { const first = head1(post); if (!RES_RE.test(first.replace(/<[^>]+>/g, ""))) return false; { const nt = natTeams(first); if (nt.length >= 2 && !QUOTE_RE.test(natNorm(first))) { const rc = (await kvGet(env, "recentNews", [])).filter((x) => Date.now() - x.t < 48 * 3600e3); if (rc.some((x) => RES_RE.test(natNorm(x.h)) && !QUOTE_RE.test(natNorm(x.h)) && nt.filter((c) => natTeams(x.h).includes(c)).length >= 2)) return true; } } const names = newsNames(first); const recent = (await kvGet(env, "recentNews", [])).filter((x) => Date.now() - x.t < 48 * 3600e3); if (names.length >= 2 && recent.some((x) => names.filter((n) => x.n.includes(n)).length >= 2 && RES_RE.test(x.h))) return true; const hn = " " + norm(first.replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "")) + " "; const GEN = new Set(["real", "city", "united", "inter", "sporting", "athletic", "manchester", "borussia", "olympique", "royal", "istanbul", "hotspur", "saint", "germain", "paris"]); const hitN = (n) => { const a = norm(cnUz(n)); if (a.length < 3) return false; if (hn.includes(" " + a + " ") || hn.includes(" " + a)) return true; const t = a.split(" ").filter((w) => w.length >= 4 && !GEN.has(w)); const k = t[0] || ""; return k.length >= 4 && hn.includes(" " + k); }; if (recent.some((x) => RES_RE.test(x.h) && (x.n || []).length >= 2 && (x.n || []).filter(hitN).length >= 2)) return true; /* 14-noyabr: "Uruguvga" imlo xatosi sarlavha tekshiruvini aldab, Argentina–Urugvay natijasi 2-marta chiqdi — endi post matnidagi ⟦nomlar⟧ ham eski natija sarlavhasidagi ikki jamoa bilan solishtiriladi */ const allN = newsNames(post); return recent.some((x) => { if (!RES_RE.test(x.h)) return false; const hh = " " + norm(x.h) + " "; const tm = (x.n || []).filter((n) => { const w = norm(cnUz(n)).split(" ").filter((v) => v.length >= 4 && !GEN.has(v))[0] || ""; return w.length >= 4 && hh.includes(" " + w); }); return tm.length >= 2 && tm.filter((n) => allN.includes(n)).length >= 2; }); } async function autoNews(env, force = false) {
  // ADMIN YUBORGAN HAVOLA (2026-11-20, Bahtiyor aka: "muharrirga tashladim, nega tahlil qilib avtomatik chop etmayapti"): navbat boshidagi
  // "manual" yangilik kunlik limit, oraliq, tun va mavzu filtrlarisiz ishlanadi; tekshiruvlar (fakt, takror, hisob) qoladi, chiqmasa sababi adminga yoziladi
  // yangiliklar yig'uvchisi navbatni mavzu og'irligi bo'yicha qayta tartiblaydi — shuning uchun "manual" yangilik navbatning istalgan joyidan topilib, boshiga qaytariladi
  { const st0 = await kvGet(env, "st", null); const mi = (st0?.queue || []).findIndex((x) => x && x.manual); if (mi >= 0) { force = true; if (mi > 0) { const [it] = st0.queue.splice(mi, 1); st0.queue.unshift(it); await kvPut(env, "st", st0); } } }
  if (!force && !(await autoOn(env))) return "off";
  const h = tashHour(); if (!force && h >= 1 && h < 8) return "night";
  const day = tashDate(Date.now());
  const a = (await kvGet(env, "autoN", null)) || {}; if (a.d !== day) { a.d = day; a.n = 0; }
  if (!force && a.n >= ((await ecoOn(env)) ? ECO_DAY_LIMIT : AUTO_DAY_LIMIT)) return "limit";
  if (!force && Date.now() - (a.last || 0) < AUTO_GAP_MIN * 60e3) return "wait";
  const st = await kvGet(env, "st", null); if (!st || !st.queue?.length) return "empty";
  const admin = (await getAdmins(env))[0];
  const Q = st.queue;
  for (let tries = 0; tries < 4 && Q.length; tries++) {
    const item = Q.shift(); await kvPut(env, "st", st);
    const manSkip = async (why) => { if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Yuborgan havolangiz kanalga chiqmadi: " + why + "\n\n" + (item.title || "") + "\n" + item.link, disable_web_page_preview: true }).catch(() => null); };
    if (!item.manual && (Date.now() - item.date > MAX_AGE_HOURS * 3600e3 || !isFocus(item))) continue; if (!item.manual && RATING_RE.test(String(item.title || ""))) { const lgr = await kvGet(env, "autoLog", []); lgr.push({ t: Date.now(), title: item.title, skip: "reyting yangiligi" }); await kvPut(env, "autoLog", lgr.slice(-40), { expirationTtl: 7 * 86400 }); continue; }
    await enrich(item);
    if (item.manual && womenItem(item)) { await manSkip("ayollar futboli kanal mavzusiga kirmaydi"); return "manual-skip"; }
    if (womenItem(item)) { const lgw0 = await kvGet(env, "autoLog", []); lgw0.push({ t: Date.now(), title: item.title, skip: "ayollar futboli" }); await kvPut(env, "autoLog", lgw0.slice(-40), { expirationTtl: 7 * 86400 }); continue; }
    let post, fc;
    // 2026-11-17: tayyorlangan post (oldingi ishga tushishda yozilib, nazoratdan o'tgan) qayta yozilmaydi
    if (item.pre?.post) { post = item.pre.post; fc = { bad: [], text: item.pre.post, fixed: item.pre.fixed || [] }; delete item.pre; }
    else {
    try { post = await writePost(env, item, 0, Date.now() + 45000); } catch (e) { Q.unshift(item); await kvPut(env, "st", st); return "busy"; }
    if (!post) { if (item.manual) { await manSkip("muharrir modeli bu xabarni kanal mavzusiga mos emas deb topdi yoki sahifa matnini o'qiy olmadi"); return "manual-skip"; } continue; }
    try { fc = await factCheck(env, item, post, Date.now() + 45000); } catch (e) { Q.unshift(item); await kvPut(env, "st", st); return "busy"; }
    }
    if (fc.bad.length && item.manual) { await manSkip("faktlar manbada tasdiqlanmadi — " + fc.bad.map((x) => typeof x === "string" ? x : (x.h || JSON.stringify(x))).join("; ").slice(0, 300)); return "manual-skip"; }
    if (fc.bad.length) { if (fc.rad) { const lgx = await kvGet(env, "autoLog", []); lgx.push({ t: Date.now(), title: item.title, skip: "asosiy fakt manbada yo'q: " + fc.rad }); await kvPut(env, "autoLog", lgx.slice(-40), { expirationTtl: 7 * 86400 }); } continue; }
    if (item.manual) { const hA = headSig(post), hB = headSig(fc.text); if ((hA && hB && hA !== hB) || (await resultDup(env, fc.text))) { await manSkip("bu natija kanalda allaqachon chiqqan yoki hisob manbaga mos kelmadi"); return "manual-skip"; } }
    const hs0 = headSig(post), hs1 = headSig(fc.text); if ((hs0 && hs1 && hs0 !== hs1) || (await resultDup(env, fc.text)) || ["bad", "women"].includes(await scoreGuard(fc.text).catch(() => "unknown"))) { const lgw = await kvGet(env, "autoLog", []); lgw.push({ t: Date.now(), title: item.title, skip: "hisob/g'olib o'zgardi yoki takror natija" }); await kvPut(env, "autoLog", lgw.slice(-40), { expirationTtl: 7 * 86400 }); continue; } post = capsHead(fc.text);
    // sana nazorati (2026-11-08): o'yin sanasi rasmiy jadval (ESPN) bilan solishtiriladi, yil xatosi manbaga qarab tuzatiladi
    try { const dc = await dateCheck(env, post, item); if (dc.fixes.length) { post = dc.text; const L0 = await kvGet(env, "dateFix", []); L0.push({ t: Date.now(), h: newsHead(post).slice(0, 80), f: dc.fixes }); await kvPut(env, "dateFix", L0.slice(-30), { expirationTtl: 30 * 86400 }); } } catch (e) {}
    // takror yangilik (boshqa manbadan kelgan xuddi shu voqea) chiqmasin
    if (await dupNews(env, post)) { if (item.manual) { await manSkip("bu voqea kanalda so'nggi 48 soatda allaqachon chiqqan (takror)"); return "manual-skip"; } const lgd = await kvGet(env, "autoLog", []); lgd.push({ t: Date.now(), title: item.title, dup: 1 }); await kvPut(env, "autoLog", lgd.slice(-40), { expirationTtl: 7 * 86400 }); continue; }
    // 2026-11-17: shu ishga tushishda oldingi yangilik(lar) tashlab yuborilgan bo'lsa, tashqi so'rovlar chegarasi (bepul tarif: 50 ta) tugab qolmasligi uchun
    // tayyor post navbatga qaytariladi va rasm/maqola/chiqarish keyingi ishga tushishda bajariladi (10:31 va 10:42 dagi postlar shu sababli jimgina yo'qolgan edi)
    if (tries > 0) { item.pre = { post, fixed: fc.fixed }; Q.unshift(item); await kvPut(env, "st", st); return "later"; }
    const pb = await pickBranded(env, item, Date.now() + 30000).catch(() => null);
    const img = pb || (await kvGet(env, "defImg", null));
    const p = { item, post, img };
    let url = null;
    try { url = await makeArticle(env, p, Date.now() + 120000); } catch (e) {}
    await rememberNews(env, post);
    if (!pb) {
      if (!force) { a.n++; a.last = Date.now(); await kvPut(env, "autoN", a, { expirationTtl: 3 * 86400 }); } // 2026-11-13: avval hisoblagich — resultJob xato bersa ham 60 daqiqa oraliq saqlansin (19:02 va 19:12 postlari)
      await resultJob(env, post, null, { url, kind: "news" });
      const lg0 = await kvGet(env, "autoLog", []); lg0.push({ t: Date.now(), title: item.title, fixed: fc.fixed, card: 1 }); await kvPut(env, "autoLog", lg0.slice(-40), { expirationTtl: 7 * 86400 });
      if (item.manual && admin) await tg(env, "sendMessage", { chat_id: admin, text: "✅ Yuborgan yangiligingiz tayyor — kartochkasi chizilib, 2–3 daqiqada kanalga chiqadi." }).catch(() => null);
      return "posted-card";
    }
    const ur = await userPublish(env, post, img, url, null, admin).catch(() => null);
    const r = ur || (await publish(env, post, img, readMore(url), null));
    if (!r?.ok) { Q.unshift(item); await kvPut(env, "st", st); if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Avtomatik post kanalga chiqmadi: " + String(r?.description || "").slice(0, 200) }); return "err"; }
    if (!ur && !url && r.result) await addArtJob(env, r, p);
    if (!force) { a.n++; a.last = Date.now(); await kvPut(env, "autoN", a, { expirationTtl: 3 * 86400 }); }
    const lg = await kvGet(env, "autoLog", []); lg.push({ t: Date.now(), title: item.title, fixed: fc.fixed }); await kvPut(env, "autoLog", lg.slice(-40), { expirationTtl: 7 * 86400 });
    if (item.manual && admin) await tg(env, "sendMessage", { chat_id: admin, text: "✅ Yuborgan yangiligingiz kanalga chiqdi." }).catch(() => null);
    return "posted";
  }
  return "skipped";
}
const ESPN_LG = { CL: "uefa.champions", PL: "eng.1", PD: "esp.1", SA: "ita.1", BL1: "ger.1", FL1: "fra.1", DED: "ned.1", PPL: "por.1", ELC: "eng.2", BSA: "bra.1", WC: "fifa.world", EC: "uefa.euro", EL: "uefa.europa", ECL: "uefa.europa.conf" };
// umumiy so'zlar (Real, City, United...) bo'yicha jamoalar adashmasligi uchun ular hisobga olinmaydi
const ESPN_STOP = new Set(["real", "club", "city", "united", "sporting", "athletic", "deportivo", "olympique", "calcio", "football", "town", "rovers", "wanderers"]);
const espnTok = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !ESPN_STOP.has(w));
// ikkinchi manba — ESPN ochiq tablosi: o'yin tugaganini tez ko'rsatadi, hisobni tasdiqlaydi, gol urganlar va daqiqalarni beradi (football-data bepul tarifida yo'q)
async function espnMatch(m, H, A) {
  const lg = ESPN_LG[m.competition?.code] || (ESPN_FIX[m.competition?.code] || [])[0]; if (!lg) return null;
  const t = Date.parse(m.utcDate);
  const days = [...new Set([t - 5 * 3600e3, t].map((x) => new Date(x).toISOString().slice(0, 10).replace(/-/g, "")))];
  const hT = new Set(espnTok([H, m.homeTeam?.name, m.homeTeam?.shortName, espnRev(H)].join(" "))), aT = new Set(espnTok([A, m.awayTeam?.name, m.awayTeam?.shortName, espnRev(A)].join(" ")));
  for (const d of days) {
    let j; try { j = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg}/scoreboard?dates=${d}`, { cf: { cacheTtl: 45 } })).json(); } catch (e) { continue; }
    for (const e of j.events || []) {
      const c = e.competitions?.[0] || {}; const cs = c.competitors || [];
      const h = cs.find((x) => x.homeAway === "home"), a = cs.find((x) => x.homeAway === "away"); if (!h || !a) continue;
      // ikkala jamoa ham mos kelishi va boshlanish vaqti bir xil bo'lishi shart (Dortmund–Betis AEK–Real Madrid bilan adashmasin)
      const ov = (tok, x) => espnTok([x.team?.displayName, x.team?.shortDisplayName, x.team?.name, x.team?.abbreviation].join(" ")).some((w) => [...tok].some((v) => v === w || (v.length >= 5 && w.length >= 5 && (v.startsWith(w) || w.startsWith(v)))));
      if (Math.abs(Date.parse(e.date) - t) > 40 * 60e3 || !ov(hT, h) || !ov(aT, a)) continue;
      const sh = +h.score, sa = +a.score, done = !!e.status?.type?.completed;
      const gl = (c.details || []).filter((x) => x.scoringPlay && !x.shootout && (x.athletesInvolved || []).length);
      const side = (id) => gl.filter((x) => String(x.team?.id) === String(id));
      const hg = side(h.team?.id), ag = side(a.team?.id);
      // bir futbolchining gollari bitta qatorda: "Matheus Cunha 83', 86'"
      const grp = (list) => { const by = new Map(); for (const x of list) { const n = canonFix(x.athletesInvolved[0].displayName); const mn = String(x.clock?.displayValue || "").replace(/'/g, "").trim(); if (!by.has(n)) by.set(n, []); by.get(n).push({ m: mn ? mn + "'" : "", pen: !!x.penaltyKick, og: !!x.ownGoal }); } return [...by].map(([n, ms]) => ({ n, ms })); };
      // qizil kartochkalar (ikkinchi sariqdan bo'lgani ham)
      const reds = (c.details || []).filter((x) => isRedCard(x) && (x.athletesInvolved || []).length && x.athletesInvolved[0].displayName);
      const rd = (id) => reds.filter((x) => String(x.team?.id) === String(id)).map((x) => ({ n: canonFix(x.athletesInvolved[0].displayName), m: String(x.clock?.displayValue || "").replace(/'/g, "").trim() + "'" }));
      const yl = espnYellows(c.details, h.team?.id, a.team?.id);
      return { eid: e.id, lg, done, sh, sa, home: grp(hg), away: grp(ag), hr: rd(h.team?.id), ar: rd(a.team?.id), hy: yl.hy, ay: yl.ay, goalsOk: done && hg.length === sh && ag.length === sa };
    }
  }
  return null;
}
// SARIQ KARTOCHKALAR (kartochka rasmi uchun, Bahtiyor aka tanlovi yB1, 2026-11-08): [ism, daqiqa, bizning futbolchimi]
// bizning futbolchilar (FOCUS_PLAYERS) o'zbekcha ismi bilan va yashil ramkada; ikkinchi sariqdan qizil olgan futbolchi sariqlarda takrorlanmaydi
function focusName(n) { const k = String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); const p = FOCUS_PLAYERS.find((x) => x.k.some((w) => k.includes(w))); return p ? p.n.replace(/[⟦⟧]/g, "") : null; }
// QIZIL KARTOCHKA (2026-11-08 tuzatish): "/red/i" "Penalty - Scored" so'zidagi "scoRED"ga ham mos kelib, penaltidan gol urgan futbolchi qizil kartochka olgan deb chiqardi (Sunderland 1:0 Chelsea)
function isRedCard(x) { return x?.redCard === true || /\bred card\b/i.test(x?.type?.text || ""); }
function espnYellows(details, hid, aid) {
  const D = details || []; const red = new Set(D.filter((x) => isRedCard(x)).map((x) => x.athletesInvolved?.[0]?.displayName));
  const ys = D.filter((x) => /yellow/i.test(x.type?.text || "") && !isRedCard(x) && x.athletesInvolved?.[0]?.displayName && !red.has(x.athletesInvolved[0].displayName));
  const f = (id) => ys.filter((x) => String(x.team?.id) === String(id)).map((x) => { const n = x.athletesInvolved[0].displayName; const fz = focusName(n); return [fz || canonFix(n), String(x.clock?.displayValue || "").replace(/'/g, "").trim() + "'", fz ? 1 : 0]; });
  return { hy: f(hid), ay: f(aid) };
}
// eski post uchun (/kartaqayta): ESPN umumiy tablosidan o'yinni nomlar bo'yicha topib sariq kartochkalarni olish
async function espnCardsFor(H, A, ymd) {
  const tk = (x) => norm(x).split(" ").filter((w) => w.length >= 4);
  const hit = (name, team) => { const a = tk(name), b = tk([team?.displayName, team?.shortDisplayName, team?.name].join(" ")); return a.some((w) => b.some((v) => v === w || v.startsWith(w) || w.startsWith(v))); };
  for (const d of [ymd, addDays(ymd, -1), addDays(ymd, 1)]) {
    let j; try { j = await (await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?limit=900&dates=" + d.replace(/-/g, ""), { cf: { cacheTtl: 600 } })).json(); } catch (e) { continue; }
    for (const e of j.events || []) { const c = e.competitions?.[0] || {}; const cs = c.competitors || []; const h = cs.find((x) => x.homeAway === "home"), a = cs.find((x) => x.homeAway === "away"); if (h && a && hit(H, h.team) && hit(A, a.team)) return { ...espnYellows(c.details, h.team?.id, a.team?.id), hl: h.team?.logo || "", al: a.team?.logo || "" }; }
  }
  return { hy: [], ay: [] };
}
// ⟦ ⟧ — ism yangi alifboga o'girilmaydi (Archie -> Arçie bo'lmasin)
const goalTxt = (g) => "⟦" + g.n + "⟧ " + g.ms.map((x) => x.m + (x.pen ? " (penalti)" : "") + (x.og ? " (o'z darvozasiga)" : "")).join(", ");
function goalsBlock(E, H, A) {
  if (!E || !E.goalsOk || !(E.home.length || E.away.length)) return "";
  return "\n\n<b>Gollar:</b>" + (E.home.length ? `\n⟦${H}⟧: ${E.home.map(goalTxt).join(", ")}` : "") + (E.away.length ? `\n⟦${A}⟧: ${E.away.map(goalTxt).join(", ")}` : "");
}
// kartochka uchun: [[ism, ["58' (pen.)"]], ...] — kartochka yangi alifboda
const cardGoals = (E) => { if (!E || !E.done) return {}; const f = (L) => L.map((g) => [g.n, g.ms.map((x) => x.m + (x.pen ? " (pen.)" : "") + (x.og ? " (öz darv.)" : ""))]); const r = (L) => (L || []).map((x) => [x.n, x.m]); return { ...(E.goalsOk ? { hg: f(E.home), ag: f(E.away) } : {}), hr: r(E.hr), ar: r(E.ar), hy: E.hy || [], ay: E.ay || [] }; };
// qizil kartochka olganlar (matnda, gollardan keyin)
function redBlock(E, H, A) {
  if (!E || !E.done || !((E.hr || []).length || (E.ar || []).length)) return "";
  const t = (L) => L.map((x) => "⟦" + x.n + "⟧ " + x.m).join(", ");
  return "\n\n<b>Qizil kartochka:</b>" + (E.hr.length ? `\n⟦${H}⟧: ${t(E.hr)}` : "") + (E.ar.length ? `\n⟦${A}⟧: ${t(E.ar)}` : "");
}
// liga logotipi qidiriladigan nom (lgidx kalitlari)
const LOGO_COMP = { CL: "Champions League", WC: "FIFA World Cup", EC: "UEFA European Championship" };
const compLogoName = (c) => LOGO_COMP[c] || FD_COMPS[c] || "";
// yangilik kartochkasi uchun liga logotipi: lgidx (nom yoki uning boshqa yozuvlari, musobaqa kodi orqali) -> ESPN/FotMob
async function leagueLogoUrl(env, name, idx) {
  if (!name) return "";
  const al = (CLUB_EMOJI.find(([, , ns]) => ns.includes(name)) || [, , [name]])[2];
  for (const n of al) { const u = await logoUrl(env, n, idx); if (u) return u; }
  const code = Object.keys(FD_COMPS).find((k) => al.includes(FD_COMPS[k]) || al.includes(LOGO_COMP[k] || ""));
  if (code) { const u = await logoUrl(env, compLogoName(code), idx); if (u) return u; }
  return espnLgLogo(name) || "";
}
const tashHM = (utc) => new Date(Date.parse(utc) + 5 * 3600e3).toISOString().slice(11, 16);
// asosiy tarkib tartibi: darvozabon, himoya, yarim himoya, hujum; har qatorda o'ngdan chapga
function lineupOrder(L) {
  const g = (p) => { p = (p || "").toUpperCase(); if (p.startsWith("G")) return 0; if (p.includes("B") || p.startsWith("CD") || (p.startsWith("D") && !p.startsWith("DM"))) return 1; if (p.includes("M")) return 2; return 3; };
  const sd = (p) => { p = (p || "").toUpperCase(); if (p.startsWith("R")) return 0; if (p.endsWith("-R")) return 1; if (p.endsWith("-L")) return 3; if (p.startsWith("L")) return 4; return 2; };
  return L.map((x, i) => [x, i]).sort((a, b) => g(a[0][2]) - g(b[0][2]) || sd(a[0][2]) - sd(b[0][2]) || a[1] - b[1]).map((x) => x[0]);
}
// ---------------- ASOSIY TARKIBLAR: katta o'yinlardan (ikkala jamoa bizning ro'yxatda yoki O'zbekiston) ~1 soat oldin ----------------
async function lineupsAuto(env) {
  if (!(await autoOn(env))) return "off";
  if ((await kvGet(env, "luMode", "on")) === "off") return "off";
  const hr = tashHour(); if (hr >= 1 && hr < 8) return "night";
  const today = tashDate(Date.now());
  const ms = [...(await fdMatchesOn(env, today, null)), ...(await fdMatchesOn(env, addDays(today, 1), null))];
  const done = await kvGet(env, "luDone", []);
  let n = 0;
  for (const m of ms) {
    const left = Date.parse(m.utcDate) - Date.now();
    if (left < 5 * 60e3 || left > 80 * 60e3 || done.includes(m.id) || n >= 2) continue;
    const H = teamName(m.homeTeam), A = teamName(m.awayTeam);
    const uz = /uzbek|o'zbek/i.test(H + " " + A + " " + (m.homeTeam?.name || "") + " " + (m.awayTeam?.name || ""));
    const big = uz || (topTeam(H, m.homeTeam?.name) && topTeam(A, m.awayTeam?.name));
    if (!big) continue;
    const E = await espnMatch(m, H, A).catch(() => null); if (!E?.eid) continue;
    let sm; try { sm = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${E.lg}/summary?event=${E.eid}`, { cf: { cacheTtl: 60 } })).json(); } catch (e) { continue; }
    const RS = sm.rosters || []; const rh = RS.find((r) => r.homeAway === "home"), ra = RS.find((r) => r.homeAway === "away");
    const st = (r) => lineupOrder((r?.roster || []).filter((p) => p.starter).map((p) => [String(p.jersey || ""), canonFix(p.athlete?.displayName || ""), p.position?.abbreviation || ""]));
    const hl = st(rh), al = st(ra);
    if (hl.length !== 11 || al.length !== 11) continue; // tarkib hali e'lon qilinmagan
    done.push(m.id); await kvPut(env, "luDone", done.slice(-200));
    const comp = FD_COMPS[m.competition?.code] || m.competition?.name || "";
    const stage = m.matchday ? m.matchday + "-tur" : "";
    const dt = tashDate(m.utcDate).slice(0, 4) + "-yil " + uzDay(tashDate(m.utcDate)).split(",")[0];
    const tm = tashHM(m.utcDate);
    const hf = rh.formation || "", af = ra.formation || "";
    const tag = (x) => "#" + String(x).replace(/[^\p{L}\p{N}]/gu, "");
    const nm = (L) => L.map((p) => "⟦" + p[1] + "⟧").join(", ");
    const post = `<b>⟦${H}⟧ – ⟦${A}⟧: asosiy tarkiblar</b>\n\n${dt}, ${comp}${stage ? ", " + stage : ""}. Uchrashuv Toshkent vaqti bilan soat ${tm} da boshlanadi.\n\n<b>⟦${H}⟧</b>${hf ? " (" + hf + ")" : ""}: ${nm(hl)}.\n\n<b>⟦${A}⟧</b>${af ? " (" + af + ")" : ""}: ${nm(al)}.\n\n#Tarkib ${tag(H)} ${tag(A)}`;
    await resultJob(env, post, null, { kind: "lu", league: compLogoName(m.competition?.code), goals: { lineup: 1, hl, al, hf, af, time: tm, date: newAlpha(dt) } });
    n++;
  }
  return n;
}
// uchinchi manba — API-Football (bepul: kuniga 100 so'rov). Faqat kerak bo'lganda (ESPN topilmasa yoki manbalar kelishmasa) so'raladi, kunlik sana bo'yicha 10 daqiqa saqlanadi
const AF_LG = { CL: 2, PL: 39, PD: 140, SA: 135, BL1: 78, FL1: 61, DED: 88, PPL: 94, ELC: 40, BSA: 71, WC: 1, EC: 4, EL: 3, ECL: 848, TUR: 203, RUS: 235, BEL: 144, SUI: 207, KSA: 307, MLS: 253, ACL: 17 };
async function afMatch(env, m, H, A) {
  const key = await kvGet(env, "afKey", ""); const lgId = AF_LG[m.competition?.code];
  if (!key || !lgId) return null;
  const t = Date.parse(m.utcDate); const day = new Date(t).toISOString().slice(0, 10);
  let L = await kvGet(env, "afFx:" + day, null);
  if (!L) {
    const uk = "afUse:" + new Date().toISOString().slice(0, 10); const used = await kvGet(env, uk, 0);
    if (used >= 90 || (await kvGet(env, "afCool", 0))) return null; // kunlik me'yor va daqiqalik cheklov (xatodan keyin 1 daqiqa kutiladi)
    await kvPut(env, uk, used + 1, { expirationTtl: 2 * 86400 });
    const j = await (await fetch(`https://v3.football.api-sports.io/fixtures?date=${day}&timezone=UTC`, { headers: { "x-apisports-key": key } })).json();
    if (j.errors && Object.keys(j.errors).length) { await kvPut(env, "afCool", 1, { expirationTtl: 60 }); return null; } // me'yor yoki tarif xatosi — saqlamaymiz
    const ids = new Set(Object.values(AF_LG));
    L = (j.response || []).filter((x) => ids.has(x.league?.id)).map((x) => ({ d: x.fixture?.date, st: x.fixture?.status?.short, h: x.teams?.home?.name, a: x.teams?.away?.name, gh: x.goals?.home, ga: x.goals?.away, ph: x.score?.penalty?.home, r: x.league?.round || "", id: x.fixture?.id || 0 }));
    await kvPut(env, "afFx:" + day, L, { expirationTtl: 600 });
  }
  const hT = new Set(espnTok([H, m.homeTeam?.name, m.homeTeam?.shortName, espnRev(H)].join(" "))), aT = new Set(espnTok([A, m.awayTeam?.name, m.awayTeam?.shortName, espnRev(A)].join(" ")));
  const ov = (tok, n) => espnTok(n).some((w) => [...tok].some((v) => v === w || (v.length >= 5 && w.length >= 5 && (v.startsWith(w) || w.startsWith(v)))));
  const x = L.find((x) => Math.abs(Date.parse(x.d) - t) <= 40 * 60e3 && ov(hT, x.h) && ov(aT, x.a));
  if (!x) return null;
  return { af: 1, fid: x.id || 0, round: x.r || "", done: ["FT", "AET", "PEN"].includes(x.st), sh: x.gh, sa: x.ga };
}
// FUTBOLCHIGA URG'U (Bahtiyor aka talabi, 2026-11-08): chet eldagi o'zbek futbolchilari, Ronaldo va Messi — o'ynadimi, necha daqiqa,
// asosiy/zaxira, gol, kartochka, tarkibda yo'qligi sababi. Legioner klublari va Al-Nassr/Inter Miami natijasida sarlavha futbolchi haqida bo'ladi.
const FOCUS_PLAYERS = [
  // fm — FotMob futbolchi ID'si (klubi va jarohatini kunlik tekshirish uchun; 2026-11-08)
  { n: "⟦Cristiano Ronaldo⟧", k: ["cristiano ronaldo"], club: /al[- ]?nassr/i, star: 1, fm: 30893 },
  { n: "⟦Lionel Messi⟧", k: ["lionel messi"], club: /inter miami/i, star: 1, fm: 30981 },
  { n: "Abduqodir Husanov", k: ["khusanov", "husanov"], club: /manchester city/i, fm: 1362998 },
  { n: "Eldor Shomurodov", k: ["shomurodov"], club: /ba[sş]ak[sş]ehir/i, fm: 619513 },
  { n: "Abbosbek Fayzullayev", k: ["fayzull", "faizull"], club: /ba[sş]ak[sş]ehir/i, fm: 1249993 },
  { n: "Husniddin Aliqulov", k: ["aliqulov", "alikulov"], club: /rizespor/i, fm: 1135987 },
  { n: "Sadriddin Hasanov", k: ["sadriddin"], club: /\bbraga\b/i, fm: 1844951, off: 1 }, // off — klubi hozircha kanal ro'yxatida emas
  { n: "Muhammadali O'rinboyev", k: ["urinboev", "rinboyev"], club: /antwerp/i, fm: 1358007 },
  { n: "Behruz Karimov", k: ["bekhruz karimov", "behruz karimov"], club: /lugano/i, fm: 1898281 },
  { n: "Jahongir O'rozov", k: ["urozov", "rozov"], club: /rubin/i, fm: 1477513 },
  { n: "Mahmud Mahamadjonov", k: ["makhamadzhonov", "mahamadjonov"], club: /makhachkala/i, fm: 1477508 },
  { n: "Jaloliddin Masharipov", k: ["masharipov"], club: /esteghlal(?! khuzestan)/i, fm: 533382 },
  { n: "Rustam Ashurmatov", k: ["ashurmatov"], club: /esteghlal(?! khuzestan)/i, fm: 643624 },
  { n: "Odiljon Hamrobekov", k: ["khamrobekov", "hamrobekov"], club: /tractor|traktor/i, fm: 619697 },
  { n: "Oston O'runov", k: ["urunov"], club: /persepolis/i, fm: 1057486 },
  { n: "Igor Sergeyev", k: ["igor sergeev", "igor sergeyev"], club: /persepolis/i, fm: 251915 },
  { n: "Azizjon G'aniyev", k: ["azizjon ganiev", "ganiyev"], club: /bani ?yas/i, fm: 629823 },
  { n: "Otabek Shukurov", k: ["otabek shukurov"], club: /radnik/i, fm: 624405 },
  { n: "Sherzod Temirov", k: ["sherzod temirov"], club: /zakho/i, fm: 1220854 },
  { n: "Umarali Rahmonaliyev", k: ["rakhmonaliev", "rahmonaliyev"], club: /\bsabah\b/i, fm: 1429286 },
];
// FUTBOLCHILAR KLUBI NAZORATI (FotMob, 2026-11-08): har kuni 07:00 da har bir futbolchining hozirgi klubi va jarohati tekshiriladi.
// Klub o'zgarsa (transfer, ijara) yoki futbolchi asosiy jamoada bo'lmasa (U23, ikkinchi jamoa) — adminga bir marta xabar; ro'yxatni Claude yangilaydi.
async function fmWatch(env, all) {
  const T = await kvGet(env, "pTeam", {}); const seen = await kvGet(env, "ptSeen", []); const msgs = [];
  const due = FOCUS_PLAYERS.filter((p) => p.fm && (all || !T[p.fm] || Date.now() - T[p.fm].t > 20 * 3600e3)).slice(0, all ? 30 : 6);
  await Promise.all(due.map(async (p) => { try { const j = await (await fetch("https://www.fotmob.com/api/data/playerData?id=" + p.fm, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } })).json(); const pt = j.primaryTeam || {}; if (!pt.teamName) return;
    const inj = j.injuryInformation ? String(j.injuryInformation.name || j.injuryInformation.title || "jarohat") : ""; T[p.fm] = { t: Date.now(), team: pt.teamName, loan: !!pt.onLoan, inj };
    const ok = p.club.test(pt.teamName) && !NOT_OURS.test(pt.teamName); const sig = p.fm + "|" + pt.teamName;
    if (ok && p.off && !seen.includes(sig + "|on")) { seen.push(sig + "|on"); msgs.push(`• ${p.n.replace(/[⟦⟧]/g, "")} endi asosiy jamoada: ${pt.teamName} — klubni kanal ro'yxatiga qaytarish kerak`); }
    if (!ok && !seen.includes(sig)) { seen.push(sig); msgs.push(p.club.test(pt.teamName) ? `• ${p.n.replace(/[⟦⟧]/g, "")} asosiy jamoada emas: ${pt.teamName}` : `• ${p.n.replace(/[⟦⟧]/g, "")} — FotMob bo'yicha hozirgi klubi: ${pt.teamName}${pt.onLoan ? " (ijarada)" : ""}`); } } catch (e) {} }));
  if (due.length) await kvPut(env, "pTeam", T);
  if (msgs.length) { await kvPut(env, "ptSeen", seen.slice(-100)); const ad = (await getAdmins(env))[0]; if (ad) await tg(env, "sendMessage", { chat_id: ad, text: "🔁 Futbolchilar nazorati — o'zgarish bor:\n" + msgs.join("\n") + "\n\nTransfer bo'lsa, Claude klublar ro'yxatini yangilaydi; asosiy jamoada bo'lmasa, natija postlarida uning qatori chiqmaydi." }); }
  return { T, msgs };
}
async function playerFocus(env, E, m, H, A, F) {
  const PT = await kvGet(env, "pTeam", {});
  const cand = FOCUS_PLAYERS.filter((p) => (p.club.test(H + " " + (m.homeTeam?.name || "")) || p.club.test(A + " " + (m.awayTeam?.name || ""))) && !(PT[p.fm] && (NOT_OURS.test(PT[p.fm].team) || !p.club.test(PT[p.fm].team))));
  if (!cand.length || !E || !E.eid || !E.lg) return null;
  let j; try { j = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${E.lg}/summary?event=${E.eid}`, { cf: { cacheTtl: 60 } })).json(); } catch (e) { return null; }
  const roster = (j.rosters || []).flatMap((r) => r.roster || []); if (!roster.length) return null;
  const evs = j.keyEvents || []; const per = Number(j.header?.competitions?.[0]?.status?.period || 2); const full = per > 2 ? 120 : 90;
  const minOf = (e) => parseInt(String(e?.clock?.displayValue || "").replace(/'/g, "")) || 0;
  const sub = (id, idx) => evs.find((e) => /substitution/i.test(e.type?.type || e.type?.text || "") && String(e.participants?.[idx]?.athlete?.id) === String(id));
  const out = [];
  for (const p of cand) {
    const r = roster.find((x) => { const nm = String(x.athlete?.displayName || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); return p.k.some((k) => nm.includes(k)); });
    const o = { p, goals: 0, yc: 0, rc: 0, assist: 0 };
    if (!r) { o.st = "absent"; if (PT[p.fm]?.inj) o.why = "jarohat sababli"; }
    else {
      const st = Object.fromEntries((r.stats || []).map((x) => [x.name, Number(x.value) || 0]));
      o.goals = st.totalGoals || 0; o.yc = st.yellowCards || 0; o.rc = st.redCards || 0; o.assist = st.goalAssists || 0;
      if (r.starter) { const so = r.subbedOut ? sub(r.athlete?.id, 1) : null; o.st = r.subbedOut ? "off" : "full"; o.min = r.subbedOut ? minOf(so) || null : full; }
      else if (r.subbedIn) { const si = sub(r.athlete?.id, 0); const mi = minOf(si); o.st = "in"; o.at = mi || null; o.min = mi ? Math.max(1, full - mi) : null; }
      else o.st = "bench";
      if (!o.goals) o.goals = (E.home || []).concat(E.away || []).filter((g) => p.k.some((k) => String(g.n).toLowerCase().includes(k.split(" ").pop()))).reduce((a, g) => a + g.ms.filter((x) => !x.og).length, 0);
    }
    out.push(o);
  }
  // tarkibda yo'qlar uchun sabab: API-Football (jarohat yoki diskvalifikatsiya)
  if (out.some((o) => o.st === "absent")) {
    try {
      const key = await kvGet(env, "afKey", ""); const fid = (F || (await afMatch(env, m, H, A).catch(() => null)) || {}).fid;
      if (key && fid) { const ij = await (await fetch(`https://v3.football.api-sports.io/injuries?fixture=${fid}`, { headers: { "x-apisports-key": key } })).json(); for (const o of out) if (o.st === "absent") { const x = (ij.response || []).find((y) => o.p.k.some((k) => String(y.player?.name || "").toLowerCase().includes(k.split(" ").pop()))); if (x) o.why = /suspend|red card|yellow card/i.test(x.player?.reason || "") ? "diskvalifikatsiya sababli" : "jarohat sababli"; } }
    } catch (e) {}
  }
  const extra = (o) => [o.goals ? (o.goals > 1 ? o.goals + " ta gol urdi" : "gol urdi") : "", o.assist ? "gol uzatmasini berdi" : "", o.rc ? "qizil kartochka oldi" : o.yc ? "sariq kartochka oldi" : ""].filter(Boolean);
  const line = (o) => { const x = extra(o); let t;
    if (o.st === "full") t = "o'yinni to'liq o'tkazdi (" + o.min + " daqiqa)";
    else if (o.st === "off") t = "asosiy tarkibda chiqib, " + (o.min ? o.min + " daqiqa o'ynadi" : "almashtirildi");
    else if (o.st === "in") t = (o.at ? o.at + "-daqiqada" : "ikkinchi bo'limda") + " maydonga tushdi" + (o.min ? " (" + o.min + " daqiqa)" : "");
    else if (o.st === "bench") t = "zaxirada qoldi, maydonga tushmadi";
    else t = "o'yin tarkibiga kiritilmadi" + (o.why ? " (" + o.why + ")" : "");
    return t + (x.length ? ", " + x.join(", ") : ""); };
  const head = (o) => { const x = extra(o);
    if (o.goals) return o.p.n + " " + (o.goals > 1 ? o.goals + " ta gol urdi" : "gol urdi");
    if (o.rc) return o.p.n + " qizil kartochka oldi";
    if (o.st === "full") return o.p.n + " o'yinni to'liq o'tkazdi";
    if (o.st === "off") return o.p.n + (o.min ? " " + o.min + " daqiqa maydonda bo'ldi" : " asosiy tarkibda o'ynadi");
    if (o.st === "in") return o.p.n + (o.at ? " " + o.at + "-daqiqada" : "") + " maydonga tushdi";
    if (o.st === "bench") return o.p.n + " zaxirada qoldi";
    return o.p.n + " o'yinda ishtirok etmadi" + (o.why ? " (" + o.why + ")" : ""); };
  const rank = (o) => (o.goals ? 100 : 0) + (o.rc ? 50 : 0) + ({ full: 40, off: 35, in: 30, bench: 10, absent: 5 }[o.st] || 0) + (o.p.star ? 1 : 0);
  const best = [...out].sort((a, b) => rank(b) - rank(a))[0];
  const uz = out.filter((o) => !o.p.star), st = out.filter((o) => o.p.star);
  const block = (uz.length ? "\n\n<b>O'zbek futbolchilari:</b>\n" + uz.map((o) => o.p.n + " — " + line(o) + ".").join("\n") : "") + st.map((o) => "\n\n<b>" + o.p.n + ":</b> " + line(o) + ".").join("");
  const rows = out.map((o) => ({ n: o.p.n, star: o.p.star ? 1 : 0, club: o.p.club.test(H + " " + (m.homeTeam?.name || "")) ? H : A, line: line(o), st: o.st, min: o.min || 0, g: o.goals || 0 }));
  return { rows, headline: head(best), block, focusHead: !topTeam(H, m.homeTeam?.name) && !topTeam(A, m.awayTeam?.name) || st.length > 0 };
}
// TUR (nechanchi tur) — har bir natija postida bo'lishi shart (Bahtiyor aka talabi, 2026-11-08: Göztepe – Başakşehir postida tur yo'q edi).
// Manbalar: football-data matchday → API-Football round → ESPN turnir jadvali (ikkala jamoaning o'ynagan o'yinlari soni teng bo'lsa).
const afRound = (r) => { r = String(r || ""); let k = r.match(/(?:Regular Season|League Stage|League Phase|Group Stage|Group [A-Z]|Matchday)\s*-\s*(\d+)/i); if (k) return k[1] + "-tur"; if (/Round of 16|8th Finals/i.test(r)) return "1/8 final"; if (/Round of 32|16th Finals/i.test(r)) return "1/16 final"; if (/Quarter/i.test(r)) return "chorak final"; if (/Semi/i.test(r)) return "yarim final"; if (/^Final$/i.test(r.trim())) return "final"; if (/Play-?offs?/i.test(r)) return "pley-off"; k = r.match(/-\s*(\d+)\s*$/); return k ? k[1] + "-tur" : ""; };
async function espnRound(m, H, A) {
  const lg = (ESPN_FIX[m.competition?.code] || [])[0] || ESPN_LG[m.competition?.code]; if (!lg) return "";
  let j; try { j = await (await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${lg}/standings`, { cf: { cacheTtl: 600 } })).json(); } catch (e) { return ""; }
  const rows = []; const walk = (o) => { if (!o || typeof o !== "object") return; if (Array.isArray(o.entries)) for (const e of o.entries) rows.push(e); for (const v of Object.values(o)) if (v && typeof v === "object") walk(v); }; walk(j);
  const hT = new Set(espnTok([H, m.homeTeam?.name].join(" "))), aT = new Set(espnTok([A, m.awayTeam?.name].join(" ")));
  const ov = (tok, n) => espnTok(n).some((w) => [...tok].some((v) => v === w || (v.length >= 5 && w.length >= 5 && (v.startsWith(w) || w.startsWith(v)))));
  const gp = (tok) => { const e = rows.find((e) => ov(tok, (ESPN_NAME[e.team?.displayName] || e.team?.displayName || "") + " " + (e.team?.displayName || ""))); const s = e && (e.stats || []).find((s) => s.name === "gamesPlayed"); return s ? Number(s.value) : 0; };
  const a = gp(hT), b = gp(aT);
  return a && a === b ? a + "-tur" : "";
}
// FOTMOB (2026-11-08): ESPN va football-data'da yo'q ligalardagi o'zbek legionerlari klublari uchun natija va jadval manbasi
// (Eron — Esteghlal, Persepolis, Tractor; BAA — Al Bataeh, Dibba; Iroq — Zakho; Serbiya — Radnik Surdulica; Ozarbayjon — Sabah). Tur: tournamentStage.
const FM_LGLOGO = {};
const FM_LG = { IRN: "Persian Gulf Pro League", ARE: "UAE Pro League", IRQ: "Iraq Stars League", SRB: "Serbian SuperLiga", AZE: "Azerbaijan Premier League" };
async function fotmobMatches(days, want) {
  const out = [];
  for (const d of days) {
    let j; try { j = await (await fetch("https://www.fotmob.com/api/data/matches?date=" + d.replace(/-/g, ""), { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" }, cf: { cacheTtl: 600 } })).json(); } catch (e) { continue; }
    for (const L of j.leagues || []) {
      if (!FM_LG[L.ccode] || /women|u-?\d\d|cup|kubok/i.test(L.name || "")) continue;
      for (const x of L.matches || []) {
        const st = x.status || {}; const fin = !!st.finished && !st.cancelled; const sched = !st.started && !st.cancelled;
        if (want === "done" ? !fin : !sched) continue;
        if (!(uzTeam(x.home?.name) || uzTeam(x.away?.name))) continue;
        const FMI = "https://images.fotmob.com/image_resources/logo/"; if (x.home?.id) ESPN_CREST[x.home.name] = FMI + "teamlogo/" + x.home.id + ".png"; if (x.away?.id) ESPN_CREST[x.away.name] = FMI + "teamlogo/" + x.away.id + ".png"; if (L.primaryId) FM_LGLOGO[FM_LG[L.ccode]] = FMI + "leaguelogo/" + L.primaryId + ".png";
        const md = /^\d+$/.test(String(x.tournamentStage || "")) ? +x.tournamentStage : null;
        const utc = st.utcTime ? new Date(st.utcTime).toISOString().replace(".000Z", "Z") : null; if (!utc) continue;
        out.push({ id: "fm" + x.id, utcDate: utc, status: fin ? "FINISHED" : "TIMED", matchday: md, homeTeam: { name: x.home.name }, awayTeam: { name: x.away.name }, score: fin ? { fullTime: { home: +x.home.score, away: +x.away.score }, duration: "REGULAR" } : undefined, competition: { code: "FM" + L.ccode, name: FM_LG[L.ccode] } });
      }
    }
  }
  return out;
}
async function matchRound(env, m, H, A, F) {
  if (m.matchday) return m.matchday + "-tur";
  const r1 = afRound((F || (await afMatch(env, m, H, A).catch(() => null)) || {}).round); if (r1) return r1;
  return await espnRound(m, H, A).catch(() => "");
}
async function autoResults(env) {
  if (!(await autoOn(env))) return "off";
  let done = await kvGet(env, "resDone", null);
  const first = !done; done = done || []; const n0 = done.length;
  const warned = await kvGet(env, "resWarn", []); const w0 = warned.length;
  const today = tashDate(Date.now());
  const ms = [];
  for (const d of [addDays(today, -1), today]) { try { ms.push(...(await fdMatchesOn(env, d, null))); } catch (e) {} } try { const fk = new Set(ms.map((m) => norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate))); ms.push(...(await espnResults()).filter((m) => !fk.has(norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate)))); } catch (e) {} try { const fk2 = new Set(ms.map((m) => norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate))); ms.push(...(await fotmobMatches([addDays(today, -1), today], "done")).filter((m) => !fk2.has(norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate)))); } catch (e) {}
  let posted = 0;
  for (let m of ms) {
    if (done.includes(m.id)) continue;
    const H = teamName(m.homeTeam), A = teamName(m.awayTeam);
    if (!(ourTeam(H, m.homeTeam?.name) || ourTeam(A, m.awayTeam?.name))) continue;
    const age = Date.now() - Date.parse(m.utcDate);
    if (first || age > 6 * 3600e3) { if (m.status === "FINISHED") done.push(m.id); continue; }
    if (posted >= 4) continue;
    const live = ["IN_PLAY", "PAUSED", "LIVE", "SUSPENDED"].includes(m.status);
    if (m.status !== "FINISHED" && !(live && age > 95 * 60e3)) continue;
    let E = null; try { E = await espnMatch(m, H, A); } catch (e) {}
    let F = null; // API-Football — faqat kerak bo'lganda
    const getF = async () => (F = F || (await afMatch(env, m, H, A).catch(() => null)));
    if (m.status !== "FINISHED") {
      // football-data hali "davom etyapti" deydi, boshqa manba "tugadi" desa — o'yinni alohida so'rab tekshiramiz
      const O = E?.done ? E : (await getF())?.done ? F : null;
      if (!O) continue;
      try { const f = await fd(env, "/matches/" + m.id, 60); if (f?.id === m.id) m = f; } catch (e) {}
      const f0 = m.score?.fullTime || {};
      if (m.status !== "FINISHED" && !(f0.home === O.sh && f0.away === O.sa && age > 115 * 60e3)) continue;
    }
    let ft = m.score?.fullTime || {};
    if (ft.home == null || ft.away == null) continue;
    const pens = m.score?.duration === "PENALTY_SHOOTOUT";
    if (!pens && E && E.done && (E.sh !== ft.home || E.sa !== ft.away)) {
      // ikki manba kelishmadi — uchinchisi (API-Football) hal qiladi: ko'pchilik to'g'ri
      await getF();
      if (F?.done && F.sh === ft.home && F.sa === ft.away) E = null; // football-data + API-Football: hisob shu, gollarsiz
      else if (F?.done && F.sh === E.sh && F.sa === E.sa) ft = { home: E.sh, away: E.sa }; // ESPN + API-Football
      else {
        if (age > 150 * 60e3 && !warned.includes(m.id)) { warned.push(m.id); await tg(env, "sendMessage", { chat_id: (await getAdmins(env))[0], text: `⚠️ Natija chiqarilmadi: manbalar hisobda kelishmadi.\n${H} – ${A}\nfootball-data: ${ft.home}:${ft.away}\nESPN: ${E.sh}:${E.sa}${F ? "\nAPI-Football: " + F.sh + ":" + F.sa : ""}\nTekshirib, kerak bo'lsa qo'lda chiqaring.` }); }
        continue;
      }
    } else if (!pens && !E) {
      // ESPN'da topilmadi — API-Football bilan tasdiqlaymiz (u ham bo'lmasa football-data'ga tayanamiz)
      await getF();
      if (F && F.done && (F.sh !== ft.home || F.sa !== ft.away)) { if (age < 170 * 60e3) continue; if (!warned.includes(m.id)) { warned.push(m.id); await tg(env, "sendMessage", { chat_id: (await getAdmins(env))[0], text: `⚠️ Natija chiqarilmadi: manbalar hisobda kelishmadi.\n${H} – ${A}\nfootball-data: ${ft.home}:${ft.away}\nAPI-Football: ${F.sh}:${F.sa}` }); } continue; }
    }
    if (E && !E.goalsOk && !pens && age < 170 * 60e3) continue; // gollar ma'lumoti hali to'liq emas
    const friendly = m.competition?.code === "FR"; /* 2026-11-12: o'rtoqlik o'yinida tur bo'lmaydi — O'zbekiston–Rossiya natijasi tur kutib 170 daqiqa ushlanib qolgan edi */
    const stage = friendly ? "" : await matchRound(env, m, H, A, F);
    if (!stage && !friendly && age < 170 * 60e3) continue; /* tur hali aniqlanmadi — keyingi aylanishda yana urinamiz */
    if (!stage && !friendly) await tg(env, "sendMessage", { chat_id: (await getAdmins(env))[0], text: "⚠️ Natija posti turisiz chiqdi (tur hech bir manbada topilmadi): " + H + " – " + A + ". /tur XABAR_ID N bilan qo'shing." });
    done.push(m.id);
    const comp = FD_COMPS[m.competition?.code] || m.competition?.name || "";
    let line;
    if (pens && m.score.penalties) { const pw = m.score.penalties.home > m.score.penalties.away ? H : A; line = `Asosiy vaqt durang yakunlandi, penaltilar seriyasida (${m.score.penalties.home}:${m.score.penalties.away}) ⟦${pw}⟧ g'alaba qozondi.`; }
    else line = ft.home > ft.away ? `Uchrashuv ⟦${H}⟧ g'alabasi bilan yakunlandi.` : ft.away > ft.home ? `Uchrashuv ⟦${A}⟧ g'alabasi bilan yakunlandi.` : "Uchrashuv durang bilan yakunlandi.";
    const tag = (n) => "#" + COUNTRY.reduce((x, [re, v]) => x.replace(re, v), String(n)).replace(/[^\p{L}\p{N}]/gu, "").replace(/^Ö/, "O"); /* 2026-11-12: 243-postda #Russia chiqdi — terma jamoa heshtegi o'zbekcha */
    const dt = tashDate(m.utcDate).slice(0, 4) + "-yil " + uzDay(tashDate(m.utcDate)).split(",")[0];
    let PF = null; try { PF = await playerFocus(env, E, m, H, A, F); } catch (e) {}
    // LEGIONER KLUBI NATIJASI FAQAT FUTBOLCHIMIZ O'YNAGANDA (Bahtiyor aka, 2026-11-08: "bu post kimga qiziq" — Antwerp 2:2 Lommel, O'rinboyev tarkibda yo'q edi).
    // Top klub bo'lmagan legioner klubida o'zbek futbolchisi maydonga tushmagan yoki ma'lumot yo'q bo'lsa — natija kanalga chiqmaydi, faqat haftalik legionerlar postiga yoziladi.
    if (!topTeam(H, m.homeTeam?.name) && !topTeam(A, m.awayTeam?.name)) {
      const played = PF && (PF.rows || []).some((r) => !r.star && ["full", "off", "in"].includes(r.st));
      if (!played) { if (PF && PF.rows && PF.rows.some((r) => !r.star)) { try { const L = await kvGet(env, "pfLog", []); for (const r of PF.rows.filter((r) => !r.star)) L.push({ t: Date.now(), d: tashDate(m.utcDate), ...r, H, A, sc: ft.home + ":" + ft.away, comp }); await kvPut(env, "pfLog", L.slice(-120), { expirationTtl: 30 * 86400 }); } catch (e) {} } continue; }
    }
    const scoreLine = `<b>⟦${H}⟧ ${ft.home}:${ft.away} ⟦${A}⟧</b>`;
    const post = `${PF && PF.focusHead ? "<b>" + PF.headline + "</b>\n\n" + scoreLine + "\n" : scoreLine + "\n\n"}${dt}, ${comp}${stage ? ", " + stage : ""}. ${line}${PF ? PF.block : ""}${pens ? "" : goalsBlock(E, H, A)}${redBlock(E, H, A)}\n\n#Natija ${tag(H)} ${tag(A)}`;
    const cg = cardGoals(E); if (pens) { delete cg.hg; delete cg.ag; }
    await resultJob(env, post, null, { goals: cg, league: compLogoName(m.competition?.code) || ESPN_FIX_LOGO[m.competition?.name] || comp, compName: comp, home: H, away: A, score: ft.home + ":" + ft.away });
    // natija ham "so'nggi yangiliklar"ga yoziladi — keyin xuddi shu o'yin haqida natija-yangilik (masalan "PSG Troyesni 1:0 hisobida yengdi") takror chiqmasin (2026-11-08)
    try { const rn = (await kvGet(env, "recentNews", [])).filter((x) => Date.now() - x.t < 48 * 3600e3); rn.push({ t: Date.now(), n: [H, A].map((x) => cnUz(x).toLowerCase()), h: H + " " + ft.home + ":" + ft.away + " " + A + " hisobida" }); await kvPut(env, "recentNews", rn.slice(-40), { expirationTtl: 3 * 86400 }); } catch (e) {}
    posted++;
    if (PF && PF.rows && PF.rows.some((r) => !r.star)) { try { const L = await kvGet(env, "pfLog", []); for (const r of PF.rows.filter((r) => !r.star)) L.push({ t: Date.now(), d: tashDate(m.utcDate), ...r, H, A, sc: ft.home + ":" + ft.away, comp }); await kvPut(env, "pfLog", L.slice(-120), { expirationTtl: 30 * 86400 }); } catch (e) {} }
  }
  if (first || done.length !== n0) await kvPut(env, "resDone", done.slice(-400));
  if (warned.length !== w0) await kvPut(env, "resWarn", warned.slice(-60));
  return posted;
}
async function healthCheck(env) { const now = Date.now(), d = tashDate(now), h = tashHour(); if (h !== 8) return; const hs = await kvGet(env, "healthDay", { d: "" }); const ad = (await getAdmins(env))[0]; if (!ad) return; const say = (t) => tg(env, "sendMessage", { chat_id: ad, text: t }); const stOn = (await kvGet(env, "storyMode", "on")) === "on"; if (hs.d !== d) { await kvPut(env, "healthDay", { d, s: 1, t: now }, { expirationTtl: 2 * 86400 }); const g = await kvGet(env, "ig", null); if (g && g.k && (await kvGet(env, "igMode", "on")) === "on") { let e = ""; try { const r = await (await fetch(g.h + "/" + g.id + "/content_publishing_limit?fields=quota_usage&access_token=" + encodeURIComponent(g.k))).json(); if (r.error) e = String(r.error.message || JSON.stringify(r.error)).slice(0, 200); } catch (x) { e = String(x.message || x).slice(0, 200); } if (e) await say("⚠️ Instagram kaliti ishlamayapti: " + e + "\nBugungi 09:00 istoriyasi Instagramga chiqmaydi. Tuzatish: business.facebook.com > Inter Group > Tizim foydalanuvchilari > InterFutbolBot > yangi kalit (marker) yarating va botga /instagram KALIT yuboring."); } if (stOn) { if (!(await kvGet(env, "usess", null))) await say("⚠️ Telegram hisobingiz botga ulanmagan. Bugungi 09:00 Telegram istoriyasi chiqmaydi. Tuzatish: botga /ulanish yuboring."); else { const id = "hc" + now.toString(36); await kvPut(env, "ujob:" + id, { html: "", check: 1, tries: 0, raw: { text: "", img: null, url: null, video: null } }, { expirationTtl: 86400 }); await ghDispatch(env, "ubpost.yml", { job: id }); } } return; } if (hs.s === 1 && now - hs.t > 25 * 60000) { await kvPut(env, "healthDay", { ...hs, s: 2 }, { expirationTtl: 2 * 86400 }); if (stOn && (await kvGet(env, "usess", null)) && ((await kvGet(env, "healthTg", { t: 0 })).t || 0) < hs.t) await say("⚠️ Telegram hisobingiz tekshiruvi javob bermadi (GitHub ishga tushmagan bo'lishi mumkin). Bugungi Telegram istoriyasi chiqmasligi mumkin."); } } const STORY_BIG = /real madrid|barcelona|atl[eé]tico madrid|manchester city|manchester united|liverpool|arsenal|chelsea|tottenham|bayern|dortmund|juventus|\binter\b(?! miami)|internazionale|ac milan|napoli|paris saint|champions league|chempionlar ligasi|o['ʻ’]?zbekiston|özbekiston|uzbekistan/i; async function storyQuota(env) { const d = tashDate(Date.now()); const q = await kvGet(env, "rsDay", { d: "", n: 0 }); const n = q.d === d ? q.n : 0; if (n >= 8) return 0; await kvPut(env, "rsDay", { d, n: n + 1 }, { expirationTtl: 2 * 86400 }); return 1; } async function resultJob(env, post, to, extra = {}) {
  const id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const idx = await kvGet(env, "lgidx", {});
  // klublar va hisob natija ma'lumotidan olinadi: matndan taxmin qilinsa, logotip to'plamida yo'q klub (masalan Göztepe) tushib qolib, natija o'rniga yangilik kartochkasi chizilardi (2026-11-08)
  const ci = { ...cardInfo(post, idx), ...(extra.home && extra.away ? { home: extra.home, away: extra.away, score: extra.score || "" } : {}) };
  const lgName = extra.league || ci.league;
  let [homeLogo, awayLogo, leagueLogo] = await Promise.all([logoUrl(env, ci.home, idx), logoUrl(env, ci.away, idx), logoUrl(env, lgName, idx)]);
  const crest = (n) => ESPN_CREST[n] || ESPN_CREST[Object.keys(ESPN_CREST).find((k) => norm(k) === norm(n))] || "";
  homeLogo = homeLogo || crest(ci.home) || (await natTeamLogo(env, ci.home)); awayLogo = awayLogo || crest(ci.away) || (await natTeamLogo(env, ci.away));
  const clubLogos = extra.home ? [] : (await Promise.all((ci.clubs || []).map(async (n) => (await logoUrl(env, n, idx)) || crest(n)))).filter(Boolean).slice(0, 4);
  if ((extra.home && extra.away) && (!homeLogo || !awayLogo)) { try { const ad = (await getAdmins(env))[0]; if (ad) await tg(env, "sendMessage", { chat_id: ad, text: "⚠️ Nazorat: natija kartochkasida klub logotipi topilmadi — " + [!homeLogo && ci.home, !awayLogo && ci.away].filter(Boolean).join(", ") + ". Claude logotipni qo'shib, /kartaqayta bilan kartochkani yangilaydi." }); } catch (e) {} } leagueLogo = leagueLogo || espnLgLogo(extra.compName || lgName) || (await leagueLogoUrl(env, lgName, idx)) || "";
  await mergeCemoji(env); if (ci.home && homeLogo) await emojiNeed(env, ci.home, homeLogo); if (ci.away && awayLogo) await emojiNeed(env, ci.away, awayLogo); await natTeamNeeds(env, post);
  const face1 = (extra.kind || "res") === "news" ? await faceUrl(env, post) : ""; const chan1 = face1 ? withCredit(post, await faceCredit(env, face1)) : post;
  await kvPut(env, "cjob:" + id, { ...ci, home: cardNm(ci.home), away: cardNm(ci.away), league: newAlpha(lgName || ""), homeLogo, awayLogo, leagueLogo, leftLogo: (extra.kind || "res") === "news" ? await leftCrest(env, post, ci, idx) : "", clubLogos, stat: (extra.kind || "res") === "news" && /#Raqamlarda/i.test(post) ? statFromPost(post) : null, face: face1, legion: (extra.kind || "res") === "news" && /#Legionerlar\b/i.test(post) ? await legionFromPost(env, post, idx) : null, scorers: (extra.kind || "res") === "news" && /#Topurarlar\b/i.test(post) ? await scorersFromPost(env, post, idx) : null, legend: extra.legend || null, ...(extra.goals || {}), chan: chan1, to: to || null, url: extra.url || null, kind: extra.kind || "res", story: (!to && (extra.kind || "res") === "res" && STORY_BIG.test(ci.home + " " + ci.away + " " + (lgName || ""))) ? await storyQuota(env) : 0 }, { expirationTtl: 7 * 3600 });
  if (to) return ghDispatch(env, "card.yml", { job: id });
  const w = await kvGet(env, "resWait", []); w.push({ id, post, t: Date.now(), url: extra.url || null, kind: extra.kind || "res" }); await kvPut(env, "resWait", w.slice(-20));
  await ghDispatch(env, "card.yml", { job: id }).catch(() => {}); // chizilmasa resFallback qayta urinadi (2026-11-13: subrequest chegarasi xatosi autoNews hisoblagichini buzmasin)
}
// ================= RASMLAR BAZASI (2026-11-09, Bahtiyor aka g'oyasi) =================
// Yopiq kanal "Inter Futbol — Rasmlar": Bahtiyor aka sportchi/murabbiy suratini tashlaydi, izohga ism yozadi
// ("Erling Haaland | Haaland, Holand" — "|" dan keyin qo'shimcha yozilishlar). Bot suratni KV "faces" ga yozib qo'yadi.
// Suratlarni faqat Bahtiyor aka qo'shadi — bot internetdan surat yig'maydi.
const LIB_CHAT = -1004498416461;
const HOOK_UPD = ["message", "callback_query", "channel_post", "edited_channel_post"];
const isFaceName = (x) => { const t = String(x || "").trim(); return t.length >= 3 && t.length <= 40 && !/[0-9@#!?:;"«»“”()]/.test(t) && !/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u.test(t) && t.split(/\s+/).length <= 5; };
const pnorm = (x) => String(x || "").toLowerCase().replace(/ş/g, "sh").replace(/ç/g, "ch").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ʻʼ‘’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
async function libReply(env, m, text) { await tg(env, "sendMessage", { chat_id: LIB_CHAT, text, reply_to_message_id: m.message_id, disable_notification: true }).catch(() => null); }
async function libIndex(env, m, edited) {
  // suratga javob qilib ism yozilsa (uzatilgan postlarning izohini tahrirlab bo'lmaydi) — o'sha surat shu ism bilan bazaga qo'shiladi
  if (!m.photo && !m.document && m.text && m.reply_to_message && (m.reply_to_message.photo || m.reply_to_message.document)) {
    const rm = m.reply_to_message, tx = m.text.trim();
    if (tx === "?") return libIndex(env, { ...rm, caption: rm.caption || "", media_group_id: null, __guess: 1 }, false);
    if (tx === "-") { // suratga javob "-" — surat bazadan olib tashlanadi (bot o'zi qo'ygan tiniq nusxa yoki kanal postidan olingan surat bo'lsa — xabari ham o'chiriladi)
      const F0 = await kvGet(env, "faces", {}); let hit = 0;
      for (const k of Object.keys(F0)) { const n0 = (F0[k].ph || []).length; F0[k].ph = (F0[k].ph || []).filter((p) => p.m !== rm.message_id); hit += n0 - F0[k].ph.length; if (!F0[k].ph.length) delete F0[k]; }
      if (hit) { await kvPut(env, "faces", F0); await libReply(env, m, "🗑 Surat bazadan olib tashlandi."); }
      return;
    }
    if (tx === "+") { const gname = await kvGet(env, "fguess:" + rm.message_id, ""); if (!gname) return; return libIndex(env, { ...rm, caption: gname, media_group_id: null }, true); }
    if (!isFaceName(tx.split("\n")[0].split("|")[0])) return;
    return libIndex(env, { ...rm, caption: m.text, media_group_id: null, message_id: rm.message_id }, true);
  }
  const ph = m.photo ? m.photo[m.photo.length - 1] : (m.document && /^image\//.test(m.document.mime_type || "") ? { file_id: m.document.file_id, file_unique_id: m.document.file_unique_id, width: 0, height: 0 } : null);
  if (!ph) return;
  let cap = String(m.caption || "").trim();
  if (!cap && m.media_group_id) cap = (await kvGet(env, "fgrp:" + m.media_group_id, "")) || "";
  else if (cap && m.media_group_id && !edited) await kvPut(env, "fgrp:" + m.media_group_id, cap, { expirationTtl: 900 });
  // SURAT YILI (2026-11-22, 388-post: 2018-yilgi jahon chempionati haqidagi faktga 2026-yilgi surat tushgan): izohda ismdan keyin yil yozilsa
  // ("Cristiano Ronaldo 2018") — yil suratga yoziladi (y) va ismdan olib tashlanadi; o'tgan yillar voqeasi haqidagi postga faqat o'sha davr surati qo'yiladi
  let capY = 0; { const L0 = cap.split("\n"); const mY = (L0[0] || "").match(/^(.*?)[\s,(]+((?:19|20)\d\d)(?:-?\s?yil)?\)?\s*(\|.*)?$/); if (mY && isFaceName(mY[1].split("|")[0])) { capY = +mY[2]; L0[0] = (mY[1] + (mY[3] ? " " + mY[3] : "")).trim(); cap = L0.join("\n"); } }
  let how = "";
  const needName = !cap || !isFaceName(cap.split("\n")[0].split("|")[0]) || cap.split("\n").length > 2;
  if (needName && edited && !m.__guess) return;
  // SURAT TAHLILI (2026-11-10, Bahtiyor aka: "rasmni ko'rib, odamni ajratadigan robot"): har bir yangi suratda asosiy odam ramkasi (gavda, yuzdan tanimasdan)
  // va haqiqiy o'lcham aniqlanadi; kartada surat shu odam atrofida qirqiladi. Ism tahrirlanganda (edited) qayta tahlil qilinmaydi — eski ramka saqlanadi.
  const g = (!edited || m.__guess) ? await libGuess(env, ph, cap) : {};
  if (g.w && g.h) { ph.width = g.w; ph.height = g.h; }
  // "?" bilan qayta tahlilda ism aniqlanmasa — surat bazada qaysi ismga yozilgan bo'lsa, o'sha ism qoladi (faqat ramka va o'lcham yangilanadi)
  if (m.__guess && !(g.name && isFaceName(g.name))) { const F0 = await kvGet(env, "faces", {}); for (const k of Object.keys(F0)) if ((F0[k].ph || []).some((p) => p.uid === ph.file_unique_id)) { g.name = F0[k].n; g.from = "caption"; } }
  if (needName) {
    // izohda ism yo'q — AI izoh matni va suratdagi yozuvlardan (formadagi familiya/raqam, gerb) aniqlaydi; yuzdan aniqlanmaydi
    if (g.watermark) { await libReply(env, m, "ℹ️ Suratda boshqa kanal/agentlik belgisi bor — namuna sifatida qoldi, bazaga qo'shilmadi."); return; }
    if (g.name && isFaceName(g.name)) { cap = g.name; how = g.from === "shirt" ? " (formadagi yozuvdan aniqlandi)" : " (izohdan aniqlandi)"; if (m.media_group_id) await kvPut(env, "fgrp:" + m.media_group_id, cap, { expirationTtl: 900 }); }
    else {
      const cand = g.club && g.number ? await squadByNumber(g.club, g.number) : "";
      if (cand) { await kvPut(env, "fguess:" + m.message_id, cand, { expirationTtl: 14 * 86400 }); await libReply(env, m, "🤔 Taxmin: " + cand + " (" + g.club + ", " + g.number + "-raqam). To'g'ri bo'lsa — suratga javob qilib «+» yozing; bo'lmasa — to'g'ri ismni yozing."); }
      else if (!m.media_group_id || cap) await libReply(env, m, "❓ Kimligini aniqlay olmadim (izohda ism yo'q, formada familiya ko'rinmaydi). Suratga javob qilib ismini yozing.");
      return;
    }
  }
  if (g.people > 1) how += g.box ? " ⚠️ Suratda " + g.people + " kishi bor — eng yirik va markazdagisi asosiy deb olindi, kartada shu odam atrofida qirqiladi." : " ⚠️ Suratda " + g.people + " kishi bor — kartaga bir kishilik surat yaxshiroq.";
  let [main, rest] = cap.split("\n")[0].split("|");
  // izohga klub nomi ham qo'shilgan bo'lsa ("Oston Urunov  Persepolis") — klub nomi olib tashlanadi, surat odamning o'ziga yoziladi
  { const m0 = main.replace(/\s+/g, " ").trim(); for (const [, , ns] of CLUB_EMOJI) for (const c of ns) if (c.length >= 4 && m0.toLowerCase().endsWith(" " + c.toLowerCase()) && m0.length - c.length >= 5) { main = m0.slice(0, m0.length - c.length).trim(); break; } }
  const name = main.replace(/\s+/g, " ").trim(); const key = pnorm(name);
  if (!key) { if (name === "-" && edited) { const F0 = await kvGet(env, "faces", {}); let hit = 0; for (const k of Object.keys(F0)) { const n0 = F0[k].ph.length; F0[k].ph = F0[k].ph.filter((p) => p.m !== m.message_id); hit += n0 - F0[k].ph.length; if (!F0[k].ph.length) delete F0[k]; } if (hit) { await kvPut(env, "faces", F0); await libReply(env, m, "🗑 Surat bazadan olib tashlandi."); } } return; }
  const al = [name, ...String(rest || "").split(",")].map((x) => x.trim()).filter(Boolean);
  const F = await kvGet(env, "faces", {});
  // shu surat avval yozilgan bo'lsa (ism tuzatilyapti) — o'lchami va odam ramkasi saqlanadi
  let old = null; for (const k of Object.keys(F)) for (const p of F[k].ph || []) if (p.uid === ph.file_unique_id) old = p;
  if (old && !g.w) { ph.width = ph.width || old.w || 0; ph.height = ph.height || old.h || 0; }
  const box = g.box || (old && old.b) || null;
  const small = ph.width && ph.height && Math.min(ph.width, ph.height) < 500;
  for (const k of Object.keys(F)) if (!isFaceName(F[k].n)) delete F[k]; // eski noto'g'ri yozuvlarni tozalash
  // tahrir: shu post boshqa ismga yozilgan bo'lsa — o'sha yerdan olib tashlanadi
  for (const k of Object.keys(F)) { F[k].ph = (F[k].ph || []).filter((p) => p.m !== m.message_id || k === key); if (!F[k].ph.length && k !== key) delete F[k]; }
  const P = (F[key] = F[key] || { n: name, al: [], ph: [], u: 0 });
  const na = (x) => (String(x || "").match(/[^\x00-\x7f]/g) || []).length;
  P.n = P.n && pnorm(P.n) === key && na(P.n) > na(name) ? P.n : name; P.al = [...new Set([...(P.al || []), ...al])].slice(0, 12);
  const rec = { f: ph.file_id, uid: ph.file_unique_id, w: ph.width || 0, h: ph.height || 0, m: m.message_id, low: small ? 1 : 0, t: Date.now(), ...(box ? { b: box } : {}), ...(capY ? { y: capY } : {}) };
  const ix = P.ph.findIndex((p) => p.uid === ph.file_unique_id);
  if (ix < 0) P.ph.push(rec); else P.ph[ix] = { ...P.ph[ix], ...rec, t: P.ph[ix].t || rec.t };
  await kvPut(env, "faces", F);
  // yangi kichik (yoki o'lchami noma'lum) surat — tiniqlashtiruvchi (sharp.yml) ishga tushadi: tiniq nusxa saqlanadi, xira asli o'chiriladi
  let sharpQ = false;
  const smallQ = !rec.w || Math.min(rec.w, rec.h) < 1000;
  if (ix < 0) { try { sharpQ = await ghDispatch(env, "sharp.yml", { only: String(m.message_id), del: "1" }, true); } catch (e) {} }
  if (!m.media_group_id || how || cap === String(m.caption || "").trim()) await libReply(env, m, (small ? "⚠️ Surat kichik (" + ph.width + "×" + ph.height + ") — saqlandi. " : "✅ ") + name + " — bazada " + P.ph.length + " ta surat." + (box ? " ✂️ Asosiy odam topildi." : m.__guess ? " ⚠️ Asosiy odam ramkasi aniqlanmadi" + (g.err ? " (" + g.err + ")" : "") + "." : "") + how + (how ? " Noto'g'ri bo'lsa — suratga javob qilib to'g'ri ismni yozing." : "") + (sharpQ && smallQ ? " ✨ Tiniqlashtirilmoqda — 1–2 daqiqada tiniq nusxasi shu yerga tushadi, xira asli o'chiriladi." : ""));
}
// Surat kimligini aniqlash: FAQAT izoh matni va suratda yozilgan so'zlar (formadagi familiya, ekrandagi yozuv); yuz yoki tashqi ko'rinishdan EMAS
async function libGuess(env, ph, cap) {
  let img = null, iw = 0, ih = 0, err = "";
  try { const f = await tg(env, "getFile", { file_id: ph.file_id }); if (f.ok) { const r = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${f.result.file_path}`); const raw0 = await r.arrayBuffer(); try { const inf = await env.IMAGES.info(new Blob([raw0]).stream()); iw = inf.width || 0; ih = inf.height || 0; } catch (e) {} img = await (await env.IMAGES.input(new Blob([raw0]).stream()).transform({ width: 1024 }).output({ format: "image/jpeg", quality: 80 })).response().arrayBuffer(); } } catch (e) {}
  const prompt = `You catalogue a football (soccer) photo library. NEVER identify a person from their face, body, hair or appearance. Decide who the photo shows ONLY from (1) the caption text below and (2) words printed in the image (a surname printed on a shirt, on-screen captions). If neither clearly names the single main person, leave "name" empty. You may give the club only from a clearly visible crest or printed club name, and a shirt number only if clearly visible.
Caption: """${String(cap || "").slice(0, 1500)}"""
Answer ONLY one JSON object with exactly these keys:
- "name": full name in official Latin spelling, or "" if not clearly named
- "from": "caption" or "shirt" or ""
- "club": club name or ""
- "number": shirt number or ""
- "people": integer - how many prominent people are in sharp focus with their head visible (do NOT count blurred background people, the crowd, or someone cut off by the image edge with only an arm, shoulder, back or part of the head showing)
- "main": array of 4 integers [ymin, xmin, ymax, xmax] on a 0-1000 scale (relative to image height and width) - the bounding box of the visible body of the ONE main person (the largest, sharpest, most central one); use [] if there is no person
- "watermark": true if logos/watermarks of TV channels, websites or news agencies are overlaid on the photo, else false
Example: {"name":"","from":"","club":"","number":"","people":1,"main":[120,300,1000,720],"watermark":false}`;
  for (let k = 0; k < 2; k++) try { // javob buzuq kelsa yoki model javob bermasa — yana bir marta
    const raw = await callGemini(env, img ? [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: toB64(img) } }] : prompt, 0, Date.now() + 22000, 4096, false, true);
    const j = JSON.parse(raw.match(/\{[\s\S]*\}/)[0].replace(/"main"\s*:\s*(?=[,}])/, '"main":[]'));
    return { name: String(j.name || "").trim(), from: j.from || "", club: String(j.club || "").trim(), number: String(j.number || "").replace(/\D/g, ""), people: Number(j.people) || 1, watermark: j.watermark === true || j.watermark === "true", box: mainBox(j.main), w: iw, h: ih, dbg: raw.slice(0, 300) };
  } catch (e) { err = String(e && e.message || e).slice(0, 160); console.log("libGuess", k, err); }
  return { w: iw, h: ih, err: (img ? "" : "surat o'qilmadi; ") + err };
}
// "/rasm ID" ishi: kanal postining rasmini tasdiqlangan dizayndagi kartochkaga almashtirish (matn va tugma saqlanadi); /ub/rasm ham shuni chaqiradi
async function rasmRedo(env, chat, mid, quiet, ov) {
      const fw = await tg(env, "forwardMessage", { chat_id: chat, from_chat_id: env.CHANNEL, message_id: mid, disable_notification: true }); const m = fw && fw.result;
      if (!m) { await tg(env, "sendMessage", { chat_id: chat, text: "Kanalda bu raqamli post topilmadi." }); return false; }
      await tg(env, "deleteMessage", { chat_id: chat, message_id: m.message_id }).catch(() => null);
      const t0 = m.caption != null ? m.caption : m.text; const e0 = m.caption != null ? m.caption_entities : m.entities;
      const html = hashFix(CANON.reduce((a, [re, v]) => a.replace(re, v), entHtmlNoLogo(t0 || "", e0)));
      const idx = await kvGet(env, "lgidx", {}); const ci = cardInfo(html, idx);
      const [leagueLogo0, ...cls] = await Promise.all([leagueLogoUrl(env, ci.league, idx), ...(ci.clubs || []).map((n) => logoUrl(env, n, idx))]);
      const clubLogos = cls.map((u, k) => u || ESPN_CREST[ci.clubs[k]] || "").filter(Boolean).slice(0, 4);
      const own = ov && ov.face ? { face: ov.face, po: 0 } : await ownFace(env, mid, html); // ov — aniq berilgan surat (masalan stadion)
      const face0 = own ? own.face : await faceUrl(env, html, ov && ov.pick);
      // needFace (2026-11-17, 300-post sabog'i): suratli postni qayta chizishda bazada surat topilmasa TEGILMAYDI — aks holda surat gerbli kartochkaga almashib qoladi
      if (ov && ov.needFace && !face0) return false;
      // MUALLIF YOZUVI RASMDA EMAS, POST MATNIDA (Bahtiyor aka, 2026-11-11: "rasmdagi Wikimedia yozuvini ko'rinmaydigan qil"): erkin litsenziya (CC BY / BY-SA)
      // muallifni ko'rsatishni talab qiladi — shuning uchun yozuv butunlay olib tashlanmaydi, heshteglardan oldin kichik kursiv qator bo'lib qo'shiladi
      let html1 = html;
      if (!(ov && ov.credit) && face0) html1 = withCredit(html, await faceCredit(env, face0));
      if (ov && ov.credit && !/Wikimedia Commons|, Flickr[⟧<]/i.test(html)) { const cl = "<i>⟦" + ov.credit + "⟧</i>"; html1 = /\n\s*#[^\n]*\s*$/.test(html) ? html.replace(/\s*\n\s*(#[^\n]*\s*)$/, "\n\n" + cl + "\n\n$1") : html + "\n\n" + cl; }
      const id = "n" + Date.now().toString(36) + "r";
      await kvPut(env, "cjob:" + id, { ...ci, home: "", away: "", score: "", league: newAlpha(ci.league || ""), leagueLogo: leagueLogo0 || espnLgLogo(ci.league) || "", leftLogo: await leftCrest(env, html, ci, idx), clubLogos, stat: /#Raqamlarda/i.test(html) ? statFromPost(html) : null, face: face0, wm: (ov && ov.wm) || "", sr: ov && ov.sr ? 1 : 0, po: own ? own.po : 0, legion: /#Legionerlar\b/i.test(html) ? await legionFromPost(env, html, idx) : null, scorers: /#Topurarlar\b/i.test(html) ? await scorersFromPost(env, html, idx) : null, chan: keepLatin(html1), rep: mid, kind: "news", story: 0 }, { expirationTtl: 7 * 3600 }); await repWatch(env, id, mid);
      await ghDispatch(env, "card.yml", { job: id });
      if (!quiet) await tg(env, "sendMessage", { chat_id: chat, text: "🖼 " + mid + "-post uchun yangi kartochka chizilmoqda (liga: " + (ci.league || "—") + ", klublar: " + (ci.clubs || []).join(", ") + "). 2–3 daqiqada rasm almashtiriladi." });
      return true;
}
// ESKI RASMLAR NAVBATI (2026-11-17, Bahtiyor aka: "kanaldagi barcha rasmlarni shunaqa o'zgartirib chiq" — yangi iF belgisi): KV redoQ {q:[{id,c,nf,wm}],day,n,max,log}.
// c: "r" — /rasm (nf:1 — bazada surat bo'lmasa tegilmaydi), "k" — /kartaqayta. Har 10 daqiqada BITTA post, kuniga max (36) ta — KV yozish limiti (kuniga 1000) va
// Telegram tahrir cheklovi uchun; tejash rejimida va oldingi almashtirish tugamaguncha kutadi. Yuklash: /ub/redoq (redoq.yml). Tugagach adminga hisobot.
async function redoTick(env) {
  const Q = await kvGet(env, "redoQ", null); if (!Q || !Q.q || !Q.q.length) return;
  if (await ecoOn(env)) return;
  // kunlik hisob KV limiti kuni bilan (UTC, Toshkentda 05:00) — Toshkent yarim tunida yangilansa 00:00–05:00 da limit oshib ketadi
  const day = new Date().toISOString().slice(0, 10);
  if (Q.day !== day) { if (!(Q.day > day)) Q.n = 0; Q.day = day; }
  if ((Q.n || 0) >= (Q.max || 36)) return;
  if ((await kvGet(env, "repWait", [])).length >= 2) return;
  const it = Q.q.shift(); Q.n = (Q.n || 0) + 1; const admin = (await getAdmins(env))[0]; let ok = 0;
  try { if (it.c === "k") { await resRedo(env, admin, it.id, true); ok = 1; } else ok = (await rasmRedo(env, admin, it.id, true, { wm: it.wm || "", needFace: it.nf ? 1 : 0 })) ? 1 : 0; } catch (e) { ok = 0; }
  Q.log = [...(Q.log || []), [it.id, ok]].slice(-400);
  await kvPut(env, "redoQ", Q);
  if (!Q.q.length && admin) { const bad = Q.log.filter((x) => !x[1]).map((x) => x[0]); await tg(env, "sendMessage", { chat_id: admin, text: "✅ Eski rasmlar navbati tugadi: " + Q.log.filter((x) => x[1]).length + " ta post yangi iF belgisi bilan qayta chizildi." + (bad.length ? "\nTegilmadi (bazada surat yo'q yoki xato): " + bad.join(", ") : "") }); }
}
// asosiy odam ramkasi: Gemini [ymin,xmin,ymax,xmax] (0–1000) → [x0,y0,x1,y1] (0–1); juda kichik yoki buzuq ramka olinmaydi
function mainBox(a) {
  if (!Array.isArray(a) || a.length !== 4) return null;
  const v = a.map((x) => Math.min(1, Math.max(0, Number(x) / 1000)));
  if (v.some((x) => !isFinite(x))) return null;
  const [y0, x0, y1, x1] = v;
  if (x1 - x0 < 0.08 || y1 - y0 < 0.15) return null;
  return [x0, y0, x1, y1].map((x) => Math.round(x * 1000) / 1000);
}
// klub tarkibidan raqam bo'yicha futbolchi (FotMob) — faqat taxmin, Bahtiyor aka tasdiqlaydi (eski surat bo'lsa raqam boshqa odamniki bo'lishi mumkin)
async function squadByNumber(club, num) {
  try {
    const t = (await fmSuggest(club)).find((x) => x.type === "team"); if (!t) return "";
    const txt = await (await fetch("https://www.fotmob.com/api/data/teams?ccode3=UZB&id=" + t.id, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } })).text();
    const m = txt.match(new RegExp('"name":"([^"]{3,60})","shirtNumber":' + Number(num) + '[,}]'));
    return m ? m[1] : "";
  } catch (e) { return ""; }
}
// kartochka uchun bazadagi surat (Rasmlar bazasi): post kim haqida bo'lsa — o'sha odamning surati (bir nechta bo'lsa — navbat bilan)
// SURAT DAVRI MOS BO'LISHI SHART (2026-11-22, Bahtiyor aka, 388-post: "rasmi mavzuga tushmagan... kelgusida shunday muammo bo'lmasligi kerak" —
// 2018-yilgi jahon chempionati haqidagi faktga 2026-yilgi formadagi surat qo'yilgan): sarlavhada o'tgan yil(lar) voqeasi bo'lsa (joriy yildan kamida 2 yil oldin;
// tug'ilgan/vafot etgan kun postlari bundan mustasno), faqat yili ma'lum va shu davrga (±1 yil) to'g'ri keladigan surat olinadi; bunday surat bo'lmasa
// surat qo'yilmaydi (gerbli karta chiziladi) va adminga qaysi yil surati kerakligi yoziladi. Surat yili: y (izohdagi yil) yoki wt (Commons fayl nomidagi yil).
const photoYear = (p) => +(p && p.y) || +((String((p && p.wt) || "").match(/(?<!\d)((?:19|20)\d\d)(?!\d)/) || [])[1] || 0);
const eventYears = (post) => { const h = String(post || "").replace(/<[^>]+>/g, " ").split("\n").slice(0, 2).join(" "); if (/tavallud|tu[gğ]['ʻ‘’]?il|vafot|olamdan/i.test(h)) return null; const ys = [...h.matchAll(/(?<!\d)((?:19|20)\d\d)(?!\d)/g)].map((m) => +m[1]); const cy = new Date().getUTCFullYear(); if (!ys.length || ys.some((y) => y > cy - 2)) return null; return [Math.min(...ys), Math.max(...ys)]; };
async function faceUrl(env, post, pick) {
  try {
    const F = await kvGet(env, "faces", {}); const k = faceFor(F, post); if (!k) return "";
    const ph = (F[k].ph || []).filter((p) => !p.low); let L = ph.length ? ph : F[k].ph || []; if (!L.length) return "";
    const ev = pick ? null : eventYears(post);
    if (ev) { L = L.filter((p) => { const y = photoYear(p); return y && y >= ev[0] - 1 && y <= ev[1] + 1; }); if (!L.length) { try { const ad = (await getAdmins(env))[0]; const yy = ev[0] === ev[1] ? ev[0] : ev[0] + "–" + ev[1]; if (ad) await tg(env, "sendMessage", { chat_id: ad, text: "📷 " + F[k].n + ": " + yy + "-yilgi surat bazada yo'q — post surati gerbli karta bilan chizildi. Shu davrdagi suratini «" + F[k].n + " " + ev[1] + "» izohi bilan rasmlar kanaliga tashlasangiz, bunday postlarga o'sha qo'yiladi." }); } catch (e) {} return ""; } }
    const p = pick ? L[(pick - 1) % L.length] : L[Math.floor(Date.now() / 3600e3) % L.length];
    return phUrl(p);
  } catch (e) { return ""; }
}
// ERKIN LITSENZIYALI SURAT MUALLIFI (2026-11-17, odamlar roboti — people.py): bazadagi suratda "c" (Foto: muallif, litsenziya) bo'lsa,
// shu surat ishlatilgan post matniga heshteglardan oldin kichik kursiv qator bo'lib qo'shiladi (CC BY / BY-SA talabi; rasmga yozilmaydi)
async function faceCredit(env, furl) {
  try { const f = decodeURIComponent((String(furl || "").match(/\/ph\/([^?]+)/) || [])[1] || ""); if (!f) return "";
    const F = await kvGet(env, "faces", {}); for (const P of Object.values(F)) for (const p of P.ph || []) if (p.f === f) return p.c ? (/, Flickr$/.test(p.c) ? p.c : p.c + ", Wikimedia Commons") : ""; } catch (e) {}
  return "";
}
const withCredit = (html, credit) => { if (!credit || /Wikimedia Commons|, Flickr[⟧<]/i.test(html)) return html; const cl = "<i>⟦" + credit + "⟧</i>"; return /\n\s*#[^\n]*\s*$/.test(html) ? html.replace(/\s*\n\s*(#[^\n]*\s*)$/, "\n\n" + cl + "\n\n$1") : html + "\n\n" + cl; };
const phUrl = (p) => WURL + "/ph/" + encodeURIComponent(p.f) + (p.b ? "?b=" + p.b.join(",") + (p.x && p.x.length ? "&x=" + p.x.map((e) => e.join(",")).join(";") : "") : "");
// POSTNING O'Z SURATI (kanal postidan bazaga o'tkazilgan, src = post raqami): post qayta chizilganda avval shu surat ishlatiladi;
// sarlavhada shu odamning ismi bo'lmasa — sarlavhasiz suratli karta (po), surat ustiga boshqa mavzudagi sarlavha yozilmaydi
async function ownFace(env, mid, html) {
  try {
    const F = await kvGet(env, "faces", {}); let own = null, ok = null;
    for (const [k, P] of Object.entries(F)) for (const p of P.ph || []) if (p.src === mid) { own = p; ok = k; }
    if (!own) return null;
    return { face: phUrl(own), po: faceFor(F, html) === ok ? 0 : 1 };
  } catch (e) { return null; }
}
// post matnidan kim haqida ekanini topadi: sarlavhadagi birinchi tanilgan ism (to'liq ism yoki qo'shimcha yozilishlar)
function faceFor(F, text) {
  const t = " " + pnorm(String(text || "").replace(/<[^>]+>/g, " ").split("\n").slice(0, 2).join(" ")) + " ";
  let best = null;
  for (const [k, P] of Object.entries(F || {})) if (isFaceName(P.n)) for (const a of [P.n, ...(P.al || [])]) { const q = pnorm(a); if (q.length < 3) continue; const mm = new RegExp(" " + q.replace(/ /g, " ") + "(?:ga|ni|ning|niki|dan|da|day|lar|larni)? ").exec(t); const i = mm ? mm.index : -1; if (i >= 0 && (!best || i < best.i || (i === best.i && q.length > best.l))) best = { k, i, l: q.length }; }
  // 2026-11-15 (256-post "Adrien Silva: Dunyo Ronaldoni noto'g'ri tushundi" umumiy iF rasmi bilan chiqqan — bazada Cristiano Ronaldo surati bor edi):
  // sarlavhada faqat FAMILIYA bo'lsa ham surat olinadi, agar post matnida shu odamning TO'LIQ ismi bo'lsa (boshqa "Silva" bilan adashmaslik uchun)
  if (!best) { const full = " " + pnorm(String(text || "").replace(/<[^>]+>/g, " ")) + " "; for (const [k, P] of Object.entries(F || {})) { if (!isFaceName(P.n)) continue; const w = pnorm(P.n).split(" "); if (w.length < 2 || w.length > 3) continue; const sn = w[w.length - 1]; if (sn.length < 5 || !full.includes(" " + w.join(" "))) continue; const mm = new RegExp(" " + sn + "(?:ga|ni|ning|niki|dan|da|day|lar|larni)? ").exec(t); if (mm && (!best || mm.index < best.i)) best = { k, i: mm.index, l: sn.length }; } }
  return best ? best.k : null;
}
// ESKI POST RASMINI ALMASHTIRISH NAZORATI (/rasm, /kartaqayta; 2026-11-09, 126-post holatidan keyin):
// kartochka 6 daqiqada chizilmasa — GitHub orqali qayta, keyin zaxira chizuvchi (Modal); tahrir chiqmasa — yana bir marta; bo'lmasa adminga xabar
async function repWatch(env, id, mid) { const rw = (await kvGet(env, "repWait", [])).filter((x) => Date.now() - x.t0 < 6 * 3600e3); rw.push({ id, mid, st: "card", t: Date.now(), t0: Date.now(), n: 0 }); await kvPut(env, "repWait", rw.slice(-30)); }
async function repSweep(env) {
  const rw = await kvGet(env, "repWait", []); if (!rw.length) return;
  const admin = (await getAdmins(env))[0]; let ch = false; const left = [];
  for (const x of rw) {
    const age = Date.now() - x.t;
    if (x.st === "card") {
      const cj = await kvGet(env, "cjob:" + x.id, null);
      if (!cj) { if (age < 20 * 60e3) left.push(x); else ch = true; continue; } // cardDone bosqichni "edit"ga o'tkazadi
      if (age < 6 * 60e3) { left.push(x); continue; }
      ch = true;
      if (x.n < 1) { await ghDispatch(env, "card.yml", { job: x.id }, true); left.push({ ...x, n: 1, t: Date.now() }); continue; }
      if (x.n < 2) { const bk = await kvGet(env, "cardBackup", ""); if (bk) { try { const r = await fetch(bk, { method: "POST", headers: { "x-key": await ubKey(env), "content-type": "application/json" }, body: JSON.stringify(cj) }); if (r.ok) { const png = await r.arrayBuffer(); if (png.byteLength > 10000) { await cardDone(env, x.id, png); const r2 = await kvGet(env, "repWait", []); const e2 = r2.find((y) => y.id === x.id); if (e2) left.push(e2); continue; } } } catch (e) {} } }
      await env.STATE.delete("cjob:" + x.id);
      if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ " + x.mid + "-post uchun kartochka 3 marta urinib ham chizilmadi. Qayta: /rasm " + x.mid });
      continue;
    }
    if (x.st === "edit") {
      if (age < 15 * 60e3) { left.push(x); continue; }
      ch = true; // tahrir ishi javob bermadi (/ub/done kelmadi)
      // 2026-11-17: /ub/done muvaffaqiyatda ujob ni o'chiradi — ujob yo'q bo'lsa ish bajarilgan, yozuv faqat parallel repWait yozuvlari (wmfix) tufayli qayta tirilgan: soxta ogohlantirish yuborilmaydi
      if (x.uid && !(await kvGet(env, "ujob:" + x.uid, null))) continue;
      if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ " + x.mid + "-post rasmi almashtirilmadi (javob kelmadi). Qayta: " + (/^w/.test(String(x.id)) ? "wmfix.yml posts=" + x.mid + " (/rasm EMAS — manba surati gerbli kartaga almashib qoladi)" : "/rasm " + x.mid) });
      continue;
    }
  }
  if (ch || left.length !== rw.length) await kvPut(env, "repWait", left);
}
// natija FAQAT o'z kartochkasi bilan chiqadi (universal rasm bekor — Bahtiyor aka qarori): chizilmasa qayta-qayta urinamiz
async function resFallback(env) {
  const w = await kvGet(env, "resWait", []); if (!w.length) return;
  const left = [];
  const admin = (await getAdmins(env))[0];
  for (const x of w) {
    if (!(await kvGet(env, "cjob:" + x.id, null))) continue; // kartochka chiqdi
    const n = x.n || 0;
    if (Date.now() - (x.lt || x.t) < (n < 6 ? 6 : 30) * 60e3) { left.push(x); continue; }
    // GitHub 6 daqiqada chizmadi — zaxira chizuvchi (Modal) bilan darhol chizdiramiz
    const bk = await kvGet(env, "cardBackup", "");
    if (bk) {
      try {
        const cj = await kvGet(env, "cjob:" + x.id, null);
        const r = await fetch(bk, { method: "POST", headers: { "x-key": await ubKey(env), "content-type": "application/json" }, body: JSON.stringify(cj) });
        if (r.ok) { const png = await r.arrayBuffer(); if (png.byteLength > 10000) { await cardDone(env, x.id, png); continue; } }
      } catch (e) {}
    }
    if (x.kind === "news") {
      // yangilik kartochkasi chizilmasa — eski tartib: standart rasm bilan
      await env.STATE.delete("cjob:" + x.id);
      const fimg = await kvGet(env, "defImg", null);
      const ur = await userPublish(env, x.post, fimg, x.url || null, null, admin).catch(() => null);
      if (!ur?.ok) await publish(env, x.post, fimg, readMore(x.url), null);
      continue;
    }
    const nm = String(x.post || "").replace(/<[^>]+>|[⟦⟧]/g, "").split("\n")[0];
    if (Date.now() - x.t > 6 * 3600e3) { await env.STATE.delete("cjob:" + x.id); await tg(env, "sendMessage", { chat_id: admin, text: "❌ Natija kartochkasi 6 soat ichida chizilmadi, natija chiqmadi: " + nm }); continue; }
    await ghDispatch(env, "card.yml", { job: x.id }, true);
    if (n + 1 === 6) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Natija kartochkasi 6 marta chizilmadi (GitHub). Har 30 daqiqada qayta urinilmoqda: " + nm });
    left.push({ ...x, n: n + 1, lt: Date.now() });
  }
  await kvPut(env, "resWait", left);
}

// football-data bepul tarifida Yevropa ligasi, Konferensiya ligasi, Saudiya, MLS, AFC va o'rtoqlik o'yinlari yo'q: kunlik jadval uchun ular ESPN ochiq tablosidan olinadi
const ESPN_FIX = { EL: ["uefa.europa", "Yevropa ligasi"], ECL: ["uefa.europa.conf", "Konferensiya ligasi"], ACL: ["afc.champions", "AFC Chempionlar ligasi"], KSA: ["ksa.1", "Saudiya Pro ligasi"], MLS: ["usa.1", "MLS"], FR: ["fifa.friendly", "O'rtoqlik o'yini"], TUR: ["tur.1", "Süper Lig"], BEL: ["bel.1", "Jupiler Pro League"], SUI: ["sui.1", "Swiss Super League"], RUS: ["rus.1", "Russian Premier League"] };
const ESPN_FIX_LOGO = { "Yevropa ligasi": "Europa League", "Konferensiya ligasi": "Conference League", "Saudiya Pro ligasi": "Saudi Pro League", "AFC Chempionlar ligasi": "AFC Champions League Elite" };
/* 2026-11-12: ESPN_NAME teskari — "O'zbekiston" ESPN'da "Uzbekistan" (gollar topilmay qolgan edi) */
function espnRev(n) { return Object.keys(ESPN_NAME).find((k) => ESPN_NAME[k] === n) || ""; }
const ESPN_NAME = { "Ferencvaros": "Ferencváros", "Lech Poznan": "Lech Poznań", "Lillestrom": "Lillestrøm", "Viktoria Plzen": "Viktoria Plzeň", "Besiktas": "Beşiktaş", "Bayern Munich": "Bayern München", "Atletico Madrid": "Atlético Madrid", "Uzbekistan": "O'zbekiston", "Istanbul Basaksehir": "İstanbul Başakşehir", "Caykur Rizespor": "Çaykur Rizespor", "Antwerp": "Royal Antwerp", "Goztepe": "Göztepe", "Genclerbirligi": "Gençlerbirliği", "Fenerbahce": "Fenerbahçe", "Kasimpasa": "Kasımpaşa", "Eyupspor": "Eyüpspor", "Corum FK": "Çorum FK", "Kocaelispor": "Kocaelispor", "Karagumruk": "Fatih Karagümrük", "Krasnodar": "FC Krasnodar", "Rostov": "FC Rostov", "Gazovik Orenburg": "FC Orenburg", "Zenit St Petersburg": "Zenit", "FC Baltika Kaliningrad": "Baltika Kaliningrad", "Union St.-Gilloise": "Union Saint-Gilloise", "RB Salzburg": "Red Bull Salzburg", "FC Cologne": "1. FC Köln", "Le Havre AC": "Le Havre", "LASK Linz": "LASK", "Viking FK": "Viking", "Inter Miami CF": "Inter Miami", "Kairat Almaty": "Kairat", "Standard Liege": "Standard Liège", "Vitória de Guimaraes": "Vitória de Guimarães", "FC Famalicao": "Famalicão", "Maritimo": "Marítimo", "Sint-Truidense": "Sint-Truiden", "Zulte-Waregem": "Zulte Waregem", "C.D. Nacional": "CD Nacional", "Neom SC": "NEOM SC", "Kauno Zalgiris": "Žalgiris", "Lech Poznan": "Lech Poznań", "Lillestrom": "Lillestrøm", "Viktoria Plzen": "Viktoria Plzeň", "Hapoel Be'er": "Hapoel Be'er Sheva", "Jagiellonia Bialystok": "Jagiellonia Białystok" };
async function hookWatch(env) { const w = await tg(env, "getWebhookInfo", {}); const r = (w && w.result) || null; if (!r) return; const want = WURL + "/hook"; const now = Date.now() / 1000; const failing = r.url !== want || (r.last_error_date && now - r.last_error_date < 1200 && (r.pending_update_count || 0) > 0); if (!failing && !(r.allowed_updates || []).includes("channel_post")) { const sc = (await sha("if-" + env.BOT_TOKEN)).slice(0, 32); await tg(env, "setWebhook", { url: want, secret_token: sc, allowed_updates: HOOK_UPD }); return; } const down = await kvGet(env, "hookDown", null); if (!failing) { if (down) { await env.STATE.delete("hookDown"); const admin = (await getAdmins(env))[0]; if (admin && down.warned) await tg(env, "sendMessage", { chat_id: admin, text: "Telegram bilan aloqa tiklandi, buyruqlar yana ishlaydi." }); } return; } const secret = (await sha("if-" + env.BOT_TOKEN)).slice(0, 32); const s = await tg(env, "setWebhook", { url: want, secret_token: secret, allowed_updates: HOOK_UPD }); if (!down) await kvPut(env, "hookDown", { t: Date.now(), warned: 0 }, { expirationTtl: 86400 }); else if (!down.warned && Date.now() - down.t > 30 * 60e3) { const admin = (await getAdmins(env))[0]; if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "Diqqat: Telegram 30 daqiqadan beri botga buyruqlarni yetkaza olmayapti (" + String(r.last_error_message || (s && s.description) || "noma'lum xato").slice(0, 150) + "). Avtomatik postlar davom etmoqda, bot aloqani o'zi tiklashga urinmoqda." }); await kvPut(env, "hookDown", { ...down, warned: 1 }, { expirationTtl: 86400 }); } } const ESPN_CREST = {}; const ESPN_LGLOGO = { TUR: "https://a.espncdn.com/i/leaguelogos/soccer/500-dark/18.png", BEL: "https://a.espncdn.com/i/leaguelogos/soccer/500-dark/6.png", SUI: "https://a.espncdn.com/i/leaguelogos/soccer/500/17.png", RUS: "https://a.espncdn.com/i/leaguelogos/soccer/500-dark/106.png", MLS: "https://a.espncdn.com/i/leaguelogos/soccer/500/19.png", KSA: "https://images.fotmob.com/image_resources/logo/leaguelogo/536.png" }; const espnLgLogo = (name) => { const al = (CLUB_EMOJI.find(([, , ns]) => ns.includes(name)) || [, , [name]])[2]; const c = Object.keys(ESPN_FIX).find((k) => al.some((n) => ESPN_FIX[k][1] === n || newAlpha(ESPN_FIX[k][1]) === n)); return (c && ESPN_LGLOGO[c]) || al.map((n) => FM_LGLOGO[n]).find(Boolean) || ""; }; const ESPN_LID = { "776": "EL", "20296": "ECL", "3902": "ACL", "21231": "KSA", "770": "MLS", "3922": "FR", "3946": "TUR", "3901": "BEL", "3944": "SUI", "3939": "RUS" }; async function espnResults() { const out = []; for (const k of [1, 0]) { const d = new Date(Date.now() - k * 86400e3).toISOString().slice(0, 10).replace(/-/g, ""); let j; try { j = await (await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?limit=500&dates=" + d, { cf: { cacheTtl: 120 } })).json(); } catch (e) { continue; } for (const e of j.events || []) { const code = ESPN_LID[(String(e.uid || "").match(/~l:(\d+)/) || [])[1]]; if (!code || !e.status?.type?.completed) continue; const cs = e.competitions?.[0]?.competitors || []; const h = cs.find((x) => x.homeAway === "home"), a = cs.find((x) => x.homeAway === "away"); if (!h || !a) continue; const nm = (t) => { const n = ESPN_NAME[t.team?.displayName] || t.team?.displayName || "?"; if (t.team?.logo) ESPN_CREST[n] = t.team.logo; return n; }; const pen = h.shootoutScore != null && a.shootoutScore != null; out.push({ id: "espn" + e.id, utcDate: new Date(e.date).toISOString().replace(".000Z", "Z"), status: "FINISHED", homeTeam: { name: nm(h) }, awayTeam: { name: nm(a) }, score: { fullTime: { home: +h.score, away: +a.score }, duration: pen ? "PENALTY_SHOOTOUT" : "REGULAR", penalties: pen ? { home: +h.shootoutScore, away: +a.shootoutScore } : null }, competition: { code, name: ESPN_FIX[code][1] } }); } } return out; } async function espnFixtures(days) {
  // Umumiy tablo: kuniga 1 so'rov (har liga uchun alohida emas) — 50 so'rov chegarasini tejaydi
  const out = [];
  for (const d of days) {
    let j; try { j = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?limit=900&dates=${d.replace(/-/g, "")}`, { cf: { cacheTtl: 300 } })).json(); } catch (e) { continue; }
    for (const e of j.events || []) {
      const code = ESPN_LID[(String(e.uid || "").match(/~l:(\d+)/) || [])[1]]; if (!code) continue;
      if (e.status?.type?.name !== "STATUS_SCHEDULED") continue;
      const cs = e.competitions?.[0]?.competitors || []; const h = cs.find((c) => c.homeAway === "home"), a = cs.find((c) => c.homeAway === "away");
      if (!h || !a || !e.date) continue;
      const nm = (t) => { const n = ESPN_NAME[t.team?.displayName] || t.team?.displayName || "?"; if (t.team?.logo) ESPN_CREST[n] = t.team.logo; return n; };
      out.push({ id: "espn" + e.id, utcDate: new Date(e.date).toISOString().replace(".000Z", "Z"), status: "TIMED", homeTeam: { name: nm(h) }, awayTeam: { name: nm(a) }, competition: { code } });
    }
  }
  return out;
}

// ---------------- KUN O'YINLARI JADVALI (ertalab, faqat bizning klublar o'ynasa) ----------------
async function fixturesRun(env, toAdmin) {
  const today = tashDate(Date.now());
  const now = Date.now();
  let fdm = []; try { fdm = [...(await fdMatchesOn(env, today, null)), ...(await fdMatchesOn(env, addDays(today, 1), null))]; } catch (e) { await kvPut(env, "cronErr", { k: "fix-fd", t: Date.now(), e: String(e && e.message || e) }, { expirationTtl: 3 * 86400 }); }
  const fdKey = new Set(fdm.map((m) => norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate)));
  let esm = []; try { esm = (await espnFixtures([today, addDays(today, 1)])).filter((m) => !fdKey.has(norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate))); } catch (e) {}
  try { const k2 = new Set([...fdm, ...esm].map((m) => norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate))); esm.push(...(await fotmobMatches([today, addDays(today, 1)], "sched")).filter((m) => !k2.has(norm(teamName(m.homeTeam)) + "|" + tashDate(m.utcDate)))); } catch (e) {}
  const ms = [...fdm, ...esm].filter((m) => ["TIMED", "SCHEDULED"].includes(m.status) && Date.parse(m.utcDate) > now && Date.parse(m.utcDate) < now + 22 * 3600e3 && (ourTeam(teamName(m.homeTeam), m.homeTeam?.name) || ourTeam(teamName(m.awayTeam), m.awayTeam?.name)));
  if (!ms.length) return "none";
  const dlab = (d) => d.slice(0, 4) + "-yil " + uzDay(d).split(",")[0];
  const out = ["<b>O'yinlar jadvali</b>", "Barcha o'yinlar Toshkent vaqti bilan."];
  const img = { kind: "matches", title: newAlpha("O'yinlar jadvali"), sub: newAlpha("Toshkent vaqti bilan"), showDay: true, groups: [] };
  const days = [...new Set(ms.map((m) => tashDate(m.utcDate)))].sort();
  for (const d of days) {
    const dm = ms.filter((m) => tashDate(m.utcDate) === d).sort((x, y) => x.utcDate.localeCompare(y.utcDate));
    out.push(`\n<b>${dlab(d)}</b>`);
    for (const m of dm) out.push(`${tashTime(m.utcDate)}  ⟦${teamName(m.homeTeam)}⟧ — ⟦${teamName(m.awayTeam)}⟧`);
    const gm = {}; for (const m of dm) (gm[m.competition?.code || "?"] = gm[m.competition?.code || "?"] || []).push(m);
    for (const c of [...FD_ORDER, ...Object.keys(ESPN_FIX)].filter((c) => gm[c])) img.groups.push({ day: newAlpha(dlab(d)), comp: FD_COMPS[c] || newAlpha(ESPN_FIX[c][1]), items: gm[c].sort((x, y) => x.utcDate.localeCompare(y.utcDate)).map(imgMatch) });
  }
  out.push("\n#ÖyinlarJadvali");
  const cap = out.join("\n");
  if (toAdmin) {
    const admin = (await getAdmins(env))[0];
    await tg(env, "sendMessage", { chat_id: admin, text: "🧪 O'yinlar jadvali namunasi — kanalga chiqmaydi. Kanalda bu matn rasm ostida turadi, rasm 1–2 daqiqada keladi.\n━━━━━━━━━━━━\n" + cap, parse_mode: "HTML" });
    await tableJob(env, admin, img, cap);
  } else if (!(await tableJob(env, env.CHANNEL, { ...img, story: 1 }, "", true))) throw new Error("rasm chizish (GitHub) ishga tushmadi"); // kanalda faqat rasm, matnsiz; shu rasm istoriyaga ham chiqadi
  return "ok " + ms.length;
}

// ---------------- «BUGUN TARIXDA» RUKNI (manba: Vikipediya "On this day") ----------------
const HIST_CLUBS = /Manchester United|Manchester City|Liverpool F|Arsenal F|Chelsea F|Real Madrid|FC Barcelona|Barcelona|Atl[eé]tico Madrid|Inter Milan|Internazionale|AC Milan|Juventus|Bayern Munich|Bayern München|Borussia Dortmund|Paris Saint-Germain|Al[- ]Nassr|Inter Miami|Uzbekistan/gi;
async function wikiJson(us) { for (let i = 0; i < 4; i++) { try { const r = await fetch(us[i % us.length], { headers: { "user-agent": "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)", "api-user-agent": "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)" } }); if (r.ok) { const j = await r.json().catch(() => null); if (j) return j; } } catch (e) {} await new Promise((s) => setTimeout(s, 2000 * (i + 1))); } throw new Error("Vikipediya javob bermadi"); } async function opsReport(env, d) { const L = (await kvGet(env, "cronLog", [])).filter((x) => tashDate(x.t) === d); const a = (await kvGet(env, "autoN", null)) || {}; const NM = { collect: "manbalarni yig'ish", send: "yangiliklar", res: "natijalar", lu: "tarkiblar", hook: "Telegram aloqasi", audit: "tekshiruv", fix: "o'yinlar jadvali", fact: "qiziqarli fakt", hist: "tarixiy fakt", tbl: "turnir jadvallari", resfb: "natija kartochkasi", usweep: "hisob orqali chiqarish", sendv: "video", fill: "maqolalar", watch: "nazorat" }; const s = "\n\n⚙️ Ish holati: avtomatik yangiliklar " + (a.d === d ? a.n : 0) + " ta."; if (!L.length) return s + " Nosozlik qayd etilmadi."; const g = {}; for (const x of L) (g[x.k] = g[x.k] || []).push(x); return s + "\nNosozliklar (bot o'zi qayta urindi):\n" + Object.entries(g).map(([k, v]) => "• " + (NM[k] || k) + ": " + v.length + " marta, oxirgisi " + tashTime(new Date(v[v.length - 1].t).toISOString()) + " — " + String(v[v.length - 1].e).split("\n")[0].slice(0, 90)).join("\n"); } async function newsWatch(env) { if (tashHour() < 13 || !(await autoOn(env))) return; const a = (await kvGet(env, "autoN", null)) || {}; if (Date.now() - (a.last || 0) < 5 * 3600e3) return; if (a.d === tashDate(Date.now()) && a.n >= ((await kvGet(env, "ecoMode", 0)) ? ECO_DAY_LIMIT : AUTO_DAY_LIMIT)) return; /* kunlik limit to'lgan bo'lsa sukunat — xato emas (2026-11-11) */ if (Date.now() - (await kvGet(env, "quietWarn", 0)) < 6 * 3600e3) return; await kvPut(env, "quietWarn", Date.now(), { expirationTtl: 86400 }); const st = await kvGet(env, "st", null); const ge = String((await env.STATE.get("gerr")) || "").slice(0, 200); const admin = (await getAdmins(env))[0]; if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ 5 soatdan beri kanalga avtomatik yangilik chiqmadi.\nNavbatda: " + (st?.queue?.length || 0) + " ta yangilik.\nOxirgi Gemini xatosi: " + (ge || "yo'q") + "\nBot urinishda davom etmoqda." }); } async function histPick(env) {
  const [y, mo, dd] = tashDate(Date.now()).split("-");
  const j = await wikiJson(["https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/" + mo + "/" + dd, "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/" + mo + "/" + dd]);
  const used = await kvGet(env, "histUsed", []);
  let best = null;
  for (const k of ["selected", "events", "births", "deaths"]) for (const e of j[k] || []) {
    const ex = (e.pages || []).map((p) => p.extract || "").join("\n");
    if (!/footballer|soccer|association football|football club|FIFA|UEFA|Ballon/i.test(e.text + " " + ex.slice(0, 600))) continue;
    if (/American football|rugby|cricket|Australian rules|Gaelic|Canadian football/i.test(e.text)) continue;
    const clubs = new Set((ex.match(HIST_CLUBS) || []).map((x) => x.toLowerCase())).size;
    if (!clubs) continue;
    const key = mo + dd + e.year + String(e.text).slice(0, 30);
    if (used.includes(key)) continue;
    const sc = clubs * 10 + (k === "events" || k === "selected" ? 15 : 0) + Math.min(ex.length / 200, 5);
    if (!best || sc > best.sc) best = { sc, k, e, ex, key, page: (e.pages || [])[0] };
  }
  return best;
}
async function histMake(env, deadline) {
  const b = await histPick(env); if (!b) return null;
  const day = uzDay(tashDate(Date.now())).split(",")[0];
  const kind = b.k === "births" ? "tug'ilgan kun" : b.k === "deaths" ? "vafot etgan kun" : "voqea";
  const item = { title: `${b.e.year}: ${b.e.text}`, desc: "", text: b.ex.slice(0, 5000), link: b.page?.content_urls?.desktop?.page || "https://en.wikipedia.org", source: "Wikipedia", img: b.page?.originalimage?.source || b.page?.thumbnail?.source || null, date: Date.now() };
  const prompt = `Sen o'zbek tilidagi "Inter Futbol" Telegram kanalining muharririsan. "Bugun tarixda" rukni uchun qisqa post yoz (o'zbek tili, lotin yozuvi).
Sana: ${day} (shu kunga to'g'ri kelgan voqea). Voqea turi: ${kind}. Yil: ${b.e.year}.
- "Bugun", "kecha", "shu kuni" kabi nisbiy so'zlarni ISHLATMA — post bir necha hafta keyin o'qilsa ham tushunarli bo'lsin: har doim aniq sana yoz (masalan "1972-yil 4-noyabrda").
Qoidalar:
- FAQAT quyidagi manbadagi faktlarni yoz. O'zingdan sana, raqam, klub, sovrin qo'shma. Shubhali narsani yozma.
- Tuzilishi: 1-qator: <b>qisqa sarlavha</b> aniq sana bilan (masalan "<b>4-noyabr, 1972-yil: Luís Figo tavallud topdi</b>"). Bo'sh qator. 2–4 gap: kim/nima, nega futbol tarixida muhim (klublar, eng katta yutuqlar — faqat manbada bo'lsa). Bo'sh qator. 2–3 heshteg: #FutbolTarixi va klub/futbolchi nomi.
- Futbolchi va klub nomlarini ORIGINAL rasmiy lotin yozuvida yoz va har birini ⟦ ⟧ ichiga ol: ⟦Luís Figo⟧, ⟦Real Madrid⟧. Heshteglarda qavssiz.
- Terma jamoa va davlat nomlarini o'zbekcha yoz: "Portugaliya terma jamoasi", "Angliya terma jamoasi" (inglizcha "national team" yozma). Hamma gap tabiiy, ravon o'zbek tilida bo'lsin, inglizcha so'z qoldirma.
- Boshlanishi tabiiy bo'lsin: "Bugun ... tavallud topgan kun" kabi g'aliz iboralar emas, masalan "1972-yil 4-noyabrda Portugaliyada ... dunyoga kelgan".
- Emoji ishlatma. Faqat <b> tegi. 600 belgidan oshmasin.
Manba (Vikipediya):
${item.title}
${item.text}`;
  const raw = await callGemini(env, prompt, 0.4, deadline, 2048, false, true);
  let post = postClean(raw, false); const fc0 = await factCheck(env, item, post, deadline); if (fc0.bad.length) { const u = await kvGet(env, "histUsed", []); u.push(b.key); await kvPut(env, "histUsed", u.slice(-400)); return { bad: 1 }; } return { post: fc0.text, fixed: fc0.fixed, item, key: b.key };
  const fc = await factCheck(env, item, post, deadline);
  if (fc.bad.length) return null;
  return { post: fc.text, fixed: fc.fixed, item, key: b.key };
}
async function histRun(env, toAdmin, test = false) {
  const admin = (await getAdmins(env))[0];
  const h = await histMake(env, Date.now() + 60000); if (!h) return "none"; if (h.bad) return "err nazoratdan otmadi";
  const pb = await pickBranded(env, h.item, Date.now() + 30000).catch(() => null); if (!pb && !toAdmin) { await resultJob(env, h.post, null, { kind: "news" }); if (!test) { const u0 = await kvGet(env, "histUsed", []); u0.push(h.key); await kvPut(env, "histUsed", u0.slice(-400)); } return "ok"; }
  const img = pb || (await kvGet(env, "defImg", null));
  const body = h.post;
  let r;
  if (toAdmin) r = await sendRich(env, admin, "🧪 «Bugun tarixda» namunasi — kanalga chiqmaydi\n🛡 Nazoratchi: " + esc(h.fixed.length ? "tuzatdi — " + h.fixed.join("; ").slice(0, 120) : "manbaga mos ✅") + " | <a href=\"" + esc(h.item.link) + "\">manba</a>\n━━━━━━━━━━━━\n" + body, img, undefined);
  else r = (await userPublish(env, body, img, null, null, admin).catch(() => null)) || (await publish(env, body, img, undefined, null));
  if (r?.ok && !toAdmin && !test) { const u = await kvGet(env, "histUsed", []); u.push(h.key); await kvPut(env, "histUsed", u.slice(-400)); }
  return r?.ok ? "ok" : "err " + (r?.description || "");
}

// ---------------- QIZIQARLI FAKTLAR (manba: Vikipediya maqolalari) ----------------
const FACT_PAGES = ["Manchester United F.C.", "Manchester City F.C.", "Liverpool F.C.", "Arsenal F.C.", "Chelsea F.C.", "Real Madrid CF", "FC Barcelona", "Atlético Madrid", "Inter Milan", "AC Milan", "Juventus FC", "FC Bayern Munich", "Borussia Dortmund", "Paris Saint-Germain FC", "Al Nassr FC", "Inter Miami CF", "UEFA Champions League", "FIFA World Cup", "UEFA European Championship", "Uzbekistan national football team", "Cristiano Ronaldo", "Lionel Messi", "El Clásico", "Derby della Madonnina", "North West Derby", "Der Klassiker", "Ballon d'Or"];
async function factMake(env, deadline, pageHint) {
  const used = await kvGet(env, "factUsed", []);
  const recent = used.slice(-12).map((u) => u.p);
  const pool = FACT_PAGES.filter((p) => !recent.includes(p));
  const page = pageHint || pool[Math.floor(Math.random() * pool.length)];
  const j = await wikiJson(["https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&explaintext=1&piprop=original&format=json&redirects=1&titles=" + encodeURIComponent(page)]);
  const pg = Object.values(j.query?.pages || {})[0] || {};
  const full = String(pg.extract || "");
  const parts = full.split(/\n(?===+ )/).filter((x) => x.length > 600 && !/^== (See also|References|External links|Notes|Further reading|Bibliography|Players|Current squad|Kit|Sponsorship)/i.test(x));
  if (!parts.length) return null;
  const chunk = parts[Math.floor(Math.random() * parts.length)].slice(0, 5000);
  const item = { title: pg.title || page, desc: "", text: chunk, link: "https://en.wikipedia.org/wiki/" + encodeURIComponent(String(pg.title || page).replace(/ /g, "_")), source: "Wikipedia", img: pg.original?.source || null, date: Date.now() };
  const prompt = `Sen o'zbek tilidagi "Inter Futbol" Telegram kanalining muharririsan. Quyidagi Vikipediya parchasidan BITTA eng qiziqarli, ko'pchilik bilmaydigan faktni top va u haqida qisqa post yoz (o'zbek tili, lotin yozuvi).
Qoidalar:
- FAQAT parchadagi faktlarni yoz. O'zingdan raqam, sana, ism qo'shma.
- Tarixda qotib qolgan faktni tanla (bir marta bo'lib o'tgan voqea, rekord, kelib chiqish tarixi). "Hozirgi", "eng ko'p" kabi vaqt o'tib o'zgarishi mumkin bo'lgan faktlardan qoch; agar shunday bo'lsa, qaysi yil holatiga ko'ra ekanini yoz.
- "Bugun", "kecha", "hozir" so'zlarini ishlatma; sana bo'lsa aniq yili bilan yoz.
- Tuzilishi: 1-qator: <b>qiziqtiruvchi qisqa sarlavha</b> (faktning o'zi, masalan "<b>Barcelona logotipi 1910-yilda tanlov orqali tanlangan</b>"). Bo'sh qator. 2–3 gap: tafsilot va nega qiziq. Bo'sh qator. 2–3 heshteg: #QiziqarliFakt va klub/futbolchi nomi.
- Futbolchi va klub nomlarini ORIGINAL rasmiy lotin yozuvida yoz, har birini ⟦ ⟧ ichiga ol. Terma jamoa va davlat nomlari o'zbekcha. Inglizcha so'z qoldirma. Emoji ishlatma. Faqat <b> tegi. 550 belgidan oshmasin.
Manba: ${item.title}
${chunk}`;
  const raw = await callGemini(env, prompt, 0.6, deadline, 2048, false, true);
  const post = postClean(raw, false);
  const fc = await factCheck(env, item, post, deadline);
  if (fc.bad.length) return null;
  let ftx = String(fc.text || ""); if (!/#QiziqarliFakt/i.test(ftx)) ftx = ftx.replace(/\s+$/, "") + "\n\n#QiziqarliFakt"; // 2026-11-12: 241-post heshtegsiz chiqdi (nazoratchi matnni qayta yozganda tushib qolgan)
  return { post: ftx, fixed: fc.fixed, item, page };
}
async function factRun(env, toAdmin, pageHint, test = false) {
  const admin = (await getAdmins(env))[0];
  const f = await factMake(env, Date.now() + 110000, pageHint); if (!f) return "none";
  const pb = await pickBranded(env, f.item, Date.now() + 30000).catch(() => null); if (!pb && !toAdmin) { await resultJob(env, f.post, null, { kind: "news" }); if (!test) { const u0 = await kvGet(env, "factUsed", []); u0.push({ p: f.page, t: Date.now() }); await kvPut(env, "factUsed", u0.slice(-100)); } return "ok-card " + f.page; }
  const img = pb || (await kvGet(env, "defImg", null));
  let r;
  if (toAdmin) r = await sendRich(env, admin, "🧪 Qiziqarli fakt namunasi — kanalga chiqmaydi\n🛡 Nazoratchi: " + esc(f.fixed.length ? "tuzatdi — " + f.fixed.join("; ").slice(0, 120) : "manbaga mos ✅") + " | <a href=\"" + esc(f.item.link) + "\">manba</a>\n━━━━━━━━━━━━\n" + f.post, img, undefined);
  else r = (await userPublish(env, f.post, img, null, null, admin).catch(() => null)) || (await publish(env, f.post, img, undefined, null));
  if (r?.ok && !toAdmin && !test) { const u = await kvGet(env, "factUsed", []); u.push({ p: f.page, t: Date.now() }); await kvPut(env, "factUsed", u.slice(-100)); }
  return r?.ok ? "ok " + f.page : "err " + (r?.description || "");
}

// ---------------- YANGI POST TURLARI VA O'ZINI O'ZI RIVOJLANTIRISH (2026-11-08) ----------------
// Mavzular: yangilik manbasi sarlavhasi (ingliz/rus/o'zbek) va kanal posti (o'zbek) uchun bir xil teglar
const TOPICS = [
  ["uz", /uzbek|o['ʻ‘’`]?zbek|özbek|şomurodov|ş?omurodov|ўзбек|узбек|ozbekiston|husanov|khusanov|хусанов|ҳусанов|shomurodov|шомуродов|fayzull|файзулл|masharipov|aliqulov|alikulov|urunov|o['ʻ]runov/i],
  ["transfer", /transfer|\bsign(s|ed|ing)?\b|contract|\bdeal\b|\bbid\b|\bloan\b|трансфер|контракт|подпис|аренд|s?h?artnoma|şartnoma|ijara|sotib ol|o['ʻ]tish|ötiş/i],
  ["injury", /injur|ruled out|sidelined|травм|jarohat/i],
  ["coach", /manager|head coach|\bsack|appoint|тренер|отставк|murabbiy|iste['ʻ]?fo/i],
  ["rumor", /\breport(s|edly)?\b|gossip|rumou?r|close to|\btarget|interest|слух|интерес|qiziqiş|qiziqish|xohla/i],
  ["result", /\d+\s*[:–-]\s*\d+|\bbeat\b|\bwin\b|\bdraw\b|победил|обыграл|g['ʻ]alaba|ğalaba|mag['ʻ]lub|mağlub|durang/i],
  ["record", /record|milestone|рекорд|rekord/i],
  ["ronaldo", /ronaldo|роналду/i], ["messi", /messi|месси/i], ["mbappe", /mbapp|мбапп/i], ["yamal", /yamal|ямал/i], ["haaland", /haaland|холанд/i], ["salah", /salah|салах/i],
  ["c:mu", /man(chester)?\s*(utd|united)|манчестер юнайтед|«мю»/i], ["c:mc", /man(chester)?\s*city|манчестер сити|ман сити/i], ["c:liv", /liverpool|ливерпул/i], ["c:ars", /arsenal|арсенал/i], ["c:che", /chelsea|челси/i],
  ["c:rma", /real madrid|«реал»|реал мадрид/i], ["c:bar", /barcelona|barça|барселон/i], ["c:atm", /atl[eé]tico|атлетико/i], ["c:int", /\binter\b(?! miami)|internazionale|интер(?! майами)/i], ["c:mil", /\bmilan\b|милан/i],
  ["c:juv", /juventus|ювентус/i], ["c:bay", /bayern|бавари/i], ["c:bvb", /dortmund|боруссия д/i], ["c:psg", /\bpsg\b|paris saint|псж/i], ["c:nas", /al[- ]?nassr|аль-наср/i], ["c:mia", /inter miami|интер майами/i],
];
const topicsOf = (t) => TOPICS.filter(([, re]) => re.test(String(t || ""))).map(([k]) => k);
// post turi (kanal postining matnidan)
const postKind = (t) => { t = String(t || ""); return /#Natija\b/i.test(t) ? "result" : /#OyinOldidan/i.test(t) ? "preview" : /#Topurarlar/i.test(t) ? "scorers" : /#Legionerlar/i.test(t) ? "legion" : /#OzbekFutboli/i.test(t) ? "uzfact" : /#Raqamlarda/i.test(t) ? "stats" : /#FutbolTarixi/i.test(t) ? "hist" : /#QiziqarliFakt/i.test(t) ? "fact" : /yin(lar)? jadvali/i.test(t) ? "fixtures" : /tarkib/i.test(t) && /#/.test(t) && /\d+\./.test(t) ? "lineup" : "news"; };
const viewsNum = (x) => { const m = String(x || "").trim().match(/^([\d.,]+)\s*([KM]?)/i); if (!m) return 0; const n = parseFloat(m[1].replace(",", ".")); return Math.round(n * (/k/i.test(m[2]) ? 1e3 : /m/i.test(m[2]) ? 1e6 : 1)); };
// kanal ochiq sahifasidan (t.me/s) har bir postning ko'rishlar soni — 24–96 soat o'tgan postlar hisobga olinadi
let IDEAS_C = [];
async function engCollect(env) {
  const ch = String(env.CHANNEL || "").replace("@", ""); if (!ch) return 0;
  IDEAS_C = await kvGet(env, "ideas", []);
  const L = await kvGet(env, "engLog", []); const have = new Set(L.map((x) => x.id)); let before = "", added = 0;
  for (let pg = 0; pg < 8; pg++) {
    let h; try { h = await (await fetch(`https://t.me/s/${ch}${before ? "?before=" + before : ""}`, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } })).text(); } catch (e) { break; }
    const parts = h.split('data-post="' + ch + "/").slice(1); if (!parts.length) break;
    let minId = Infinity, oldest = Infinity;
    for (const p of parts) {
      const id = parseInt(p); if (!id) continue; minId = Math.min(minId, id);
      const t = Date.parse((p.match(/<time datetime="([^"]+)"/) || [])[1] || ""); if (!t) continue; oldest = Math.min(oldest, t);
      const v = viewsNum((p.match(/tgme_widget_message_views">([^<]+)</) || [])[1]);
      const txt = ((p.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
      const age = Date.now() - t; if (age < 24 * 3600e3 || age > 96 * 3600e3 || !v || have.has(id)) continue;
      const ig = (IDEAS_C || []).find((x) => txt.includes(x.tag)); have.add(id); added++; L.push({ id, t, v, k: postKind(txt), tp: topicsOf(txt), h: txt.split("\n")[0].slice(0, 80), ...(ig ? { ig: ig.id } : {}) });
    }
    if (!isFinite(minId) || oldest < Date.now() - 96 * 3600e3) break; before = minId;
  }
  const keep = L.filter((x) => Date.now() - x.t < 21 * 86400e3).slice(-500); await kvPut(env, "engLog", keep);
  // tahlil: post turlari va mavzular bo'yicha o'rtacha ko'rish; mavzu og'irliklari navbatni tartiblaydi
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x.v, 0) / a.length : 0);
  const recent = keep.filter((x) => Date.now() - x.t < 14 * 86400e3); const all = mean(recent); const news = recent.filter((x) => x.k === "news"); const nAll = mean(news) || all;
  const types = {}; for (const x of recent) (types[x.k] = types[x.k] || []).push(x);
  const typeStats = Object.fromEntries(Object.entries(types).map(([k, a]) => [k, { n: a.length, avg: Math.round(mean(a)) }]));
  const topicStats = {}, topicW = {};
  for (const [k] of TOPICS) { const a = news.filter((x) => (x.tp || []).includes(k)); if (!a.length || !nAll) continue; const r = mean(a) / nAll; const rs = 1 + (r - 1) * a.length / (a.length + 8); topicStats[k] = { n: a.length, avg: Math.round(mean(a)) }; topicW[k] = Math.round(Math.max(-0.8, Math.min(0.8, Math.log2(Math.max(rs, 0.05)))) * 100) / 100; }
  const typeW = {}; for (const [k, v] of Object.entries(typeStats)) if (all && v.n >= 2) { const rs = 1 + (v.avg / all - 1) * v.n / (v.n + 4); typeW[k] = Math.round(Math.log2(Math.max(rs, 0.05)) * 100) / 100; }
  await kvPut(env, "topicW", topicW); await kvPut(env, "engStats", { t: Date.now(), n: recent.length, avg: Math.round(all), typeStats, topicStats, typeW, topicW });
  return added;
}
const TYPE_UZ = { result: "natijalar", news: "yangiliklar", preview: "o'yin oldidan", scorers: "to'purarlar", legion: "legionerlar", uzfact: "o'zbek futboli fakti", stats: "raqamlarda", hist: "tarixda bugun", fact: "qiziqarli fakt", fixtures: "o'yinlar jadvali", lineup: "tarkiblar" };
const TOPIC_UZ = { uz: "o'zbek futboli", transfer: "transferlar", injury: "jarohatlar", coach: "murabbiylar", rumor: "mish-mishlar", result: "o'yin natijalari", record: "rekordlar", ronaldo: "Ronaldo", messi: "Messi", mbappe: "Mbappé", yamal: "Yamal", haaland: "Haaland", salah: "Salah", "c:mu": "Manchester United", "c:mc": "Manchester City", "c:liv": "Liverpool", "c:ars": "Arsenal", "c:che": "Chelsea", "c:rma": "Real Madrid", "c:bar": "Barcelona", "c:atm": "Atlético Madrid", "c:int": "Inter", "c:mil": "Milan", "c:juv": "Juventus", "c:bay": "Bayern", "c:bvb": "Dortmund", "c:psg": "PSG", "c:nas": "Al-Nassr", "c:mia": "Inter Miami" };
async function engReport(env, chat) {
  const s = await kvGet(env, "engStats", null); const admin = chat || (await getAdmins(env))[0]; if (!s || !admin) return;
  // haftalik sifat ko'rsatkichlari (2026-11-08): to'xtatilgan postlar, nazorat ogohlantirishlari, ish xatolari, tejash rejimi
  const wk = Date.now() - 7 * 86400e3; const held = (await kvGet(env, "qcHeld", [])).filter((x) => x.t > wk).length; const warns = (await kvGet(env, "qcSeen", [])).length; const errs = (await kvGet(env, "cronLog", [])).filter((x) => x.t > wk); const eco = await kvGet(env, "ecoMode", 0); const jf = await kvGet(env, "jobsFail", null);
  const errK = {}; for (const e of errs) errK[e.k] = (errK[e.k] || 0) + 1;
  const ide = await ideaEval(env).catch(() => []); const dfx = (await kvGet(env, "dateFix", [])).filter((x) => x.t > wk).length;
  const qual = `\n\n🛡 Sifat nazorati (7 kun):\n• To'xtatilgan postlar: ${held}\n• Kamchilik ogohlantirishlari (oxirgi 3 kun): ${warns}\n• Ish xatolari: ${errs.length ? Object.entries(errK).map(([k, v]) => k + " — " + v).join(", ") : "yo'q"}\n• Modal ishlamay GitHub'ga o'tilgan holatlar: ${jf ? jf.n : 0}\n• Tejash rejimi: ${eco ? "yoqilgan" : "o'chiq"}\n• Avtomatik tuzatilgan sanalar: ${dfx}` + (ide.length ? "\n\n💡 Yangi shakllar sinovi:\n• " + ide.join("\n• ") : "");
  const ty = Object.entries(s.typeStats).sort((a, b) => b[1].avg - a[1].avg).map(([k, v]) => `${TYPE_UZ[k] || k} — ${v.avg} (${v.n} ta)`).join("\n");
  const tp = Object.entries(s.topicStats).filter(([, v]) => v.n >= 3).sort((a, b) => b[1].avg - a[1].avg); const up = tp.slice(0, 5).map(([k, v]) => `${TOPIC_UZ[k] || k} — ${v.avg}`).join(", "), dn = tp.slice(-3).reverse().map(([k, v]) => `${TOPIC_UZ[k] || k} — ${v.avg}`).join(", ");
  await tg(env, "sendMessage", { chat_id: admin, text: `📊 Kanal tahlili (oxirgi 14 kun, ${s.n} ta post)\nO'rtacha ko'rish: ${s.avg}\n\nPost turlari:\n${ty}\n\nEng ko'p ko'rilgan mavzular: ${up || "—"}\nEng kam: ${dn || "—"}\n\nBot yangiliklar tartibini va qo'shimcha post turlari sonini shu natijalarga qarab o'zi moslashtirdi.` + qual });
}
// O'YIN OLDIDAN: katta o'yinlardan ~3 soat oldin — jadvaldagi o'rinlar, shaxsiy uchrashuvlar, o'zbek futbolchilari (faqat rasmiy ma'lumot, AI'siz)
async function previewAuto(env) {
  const now = Date.now(), d = tashDate(now); const done = await kvGet(env, "pvDone", []); const TW = (await kvGet(env, "engStats", null))?.typeW || {};
  const cap = (TW.preview ?? 0) < -0.4 ? 1 : 2; if (done.filter((x) => x.d === d).length >= cap) return 0;
  let ms = []; try { ms = await fdMatchesOn(env, d, null); } catch (e) { return 0; }
  const big = ms.filter((m) => ["TIMED", "SCHEDULED"].includes(m.status) && !done.some((x) => x.id === m.id) && Date.parse(m.utcDate) - now > 140 * 60e3 && Date.parse(m.utcDate) - now < 200 * 60e3)
    .filter((m) => { const H = teamName(m.homeTeam), A = teamName(m.awayTeam); return (topTeam(H, m.homeTeam?.name) && topTeam(A, m.awayTeam?.name)) || ((topTeam(H, m.homeTeam?.name) || topTeam(A, m.awayTeam?.name)) && m.competition?.code === "CL"); });
  let n = 0;
  for (const m of big.slice(0, 1)) {
    const H = teamName(m.homeTeam), A = teamName(m.awayTeam), comp = FD_COMPS[m.competition?.code] || m.competition?.name || "";
    done.push({ id: m.id, d }); await kvPut(env, "pvDone", done.slice(-60), { expirationTtl: 7 * 86400 });
    let pos = "", h2h = "", form = "";
    try { const j = await fd(env, `/competitions/${m.competition.code}/standings`, 1800); const rows = (j.standings || []).filter((x) => x.type === "TOTAL").flatMap((g) => g.table || []); const f = (id) => rows.find((r) => r.team?.id === id);
      const a = f(m.homeTeam.id), b = f(m.awayTeam.id); if (a && b) { pos = `\n\n<b>Turnir jadvalida:</b>\n⟦${H}⟧ — ${a.position}-o'rin, ${a.points} ochko\n⟦${A}⟧ — ${b.position}-o'rin, ${b.points} ochko`; const fm = (x) => String(x || "").split(",").filter(Boolean).slice(-5).map((c) => ({ W: "G", D: "D", L: "M" })[c] || c).join(" "); if (a.form && b.form) form = `\n\n<b>So'nggi 5 o'yin</b> (G — g'alaba, D — durang, M — mag'lubiyat):\n⟦${H}⟧: ${fm(a.form)}\n⟦${A}⟧: ${fm(b.form)}`; } } catch (e) {}
    try { const j = await fd(env, `/matches/${m.id}/head2head?limit=5`, 6 * 3600); const L = (j.matches || []).filter((x) => x.status === "FINISHED").slice(-5).reverse(); if (L.length) { let w1 = 0, w2 = 0, dr = 0; for (const x of L) { const hg = x.score.fullTime.home, ag = x.score.fullTime.away; const hn = x.homeTeam.id === m.homeTeam.id; if (hg === ag) dr++; else if ((hg > ag) === hn) w1++; else w2++; }
      h2h = `\n\n<b>Oxirgi ${L.length} ta shaxsiy uchrashuv:</b> ⟦${H}⟧ ${w1} g'alaba, ${dr} durang, ⟦${A}⟧ ${w2} g'alaba\n` + L.map((x) => { const dd = tashDate(x.utcDate); return `${dd.slice(0, 4)}-yil ${uzDay(dd).split(",")[0]}: ⟦${teamName(x.homeTeam)}⟧ ${x.score.fullTime.home}:${x.score.fullTime.away} ⟦${teamName(x.awayTeam)}⟧`; }).join("\n"); } } catch (e) {}
    if (!pos && !h2h) continue;
    const uzp = FOCUS_PLAYERS.filter((p) => p.club.test(H + " " + m.homeTeam?.name) || p.club.test(A + " " + m.awayTeam?.name)).map((p) => p.n).join(", ");
    const post = `<b>O'yin oldidan: ⟦${H}⟧ — ⟦${A}⟧</b>\n\n${d.slice(0, 4)}-yil ${uzDay(d).split(",")[0]}, ${comp}${m.matchday ? ", " + m.matchday + "-tur" : ""}. Boshlanishi: ${tashTime(m.utcDate)} (Toshkent vaqti).${pos}${form}${h2h}${uzp ? "\n\n<b>Diqqat markazida:</b> " + uzp : ""}\n\n#OyinOldidan #${String(H).replace(/[^\p{L}\p{N}]/gu, "")} #${String(A).replace(/[^\p{L}\p{N}]/gu, "")}`;
    await resultJob(env, post, null, { kind: "news" }); n++;
  }
  return n;
}
// TO'PURARLAR POYGASI: ligalar navbat bilan; top-5 o'zgarmagan bo'lsa chiqmaydi; post turi kam ko'rilsa — haftada bir marta
const LG_TAG = { PL: "PremierLeague", PD: "LaLiga", SA: "SerieA", BL1: "Bundesliga", FL1: "Ligue1", CL: "ChampionsLeague" };
async function scorersAuto(env, force, to) {
  const d = tashDate(Date.now()), wd = new Date(d + "T00:00:00Z").getUTCDay(); const TW = (await kvGet(env, "engStats", null))?.typeW || {};
  const days = (TW.scorers ?? 0) < -0.4 ? [6] : [2, 4, 6]; if (!force && !days.includes(wd)) return "day";
  const st = await kvGet(env, "scState", { i: 0, sig: {} }); const LG = ["PL", "PD", "SA", "BL1", "FL1", "CL"];
  for (let k = 0; k < LG.length; k++) {
    const c = LG[(st.i + k) % LG.length]; let j; try { j = await fd(env, `/competitions/${c}/scorers?limit=10`, 6 * 3600); } catch (e) { continue; }
    const S = (j.scorers || []).filter((x) => x.goals).slice(0, 7); if (S.length < 5) continue;
    const sig = S.slice(0, 5).map((x) => x.player?.id + ":" + x.goals).join(","); if (st.sig[c] === sig) continue;
    if (!to) { st.sig[c] = sig; st.i = (st.i + k + 1) % LG.length; await kvPut(env, "scState", st); }
    const comp = FD_COMPS[c]; const md = j.season?.currentMatchday;
    const rows = S.map((x, i) => `${i + 1}. ⟦${x.player?.name}⟧ (⟦${teamName(x.team)}⟧) — ${x.goals} gol${x.assists ? ", " + x.assists + " ta gol uzatmasi" : ""}${x.penalties ? " (" + x.penalties + " tasi penaltidan)" : ""}`).join("\n");
    const post = `<b>${comp}: to'purarlar poygasi</b>\n\n${d.slice(0, 4)}-yil ${uzDay(d).split(",")[0]} holatiga.\n\n${rows}\n\n#Topurarlar #${LG_TAG[c]}`;
    await resultJob(env, post, to || null, { kind: "news" }); return "ok " + c;
  }
  return "none";
}
// O'ZBEK LEGIONERLARI: haftalik yakun (dushanba) — natija postlaridagi futbolchi bo'limlaridan yig'iladi
async function legionWeekly(env, force, to) {
  const d = tashDate(Date.now()); if (!force && new Date(d + "T00:00:00Z").getUTCDay() !== 1) return "day";
  const L = (await kvGet(env, "pfLog", [])).filter((x) => Date.now() - x.t < 7 * 86400e3 && x.d >= addDays(d, -7)); if (L.length < 2) return "few";
  const by = new Map(); for (const x of L) { if (!by.has(x.n)) by.set(x.n, []); by.get(x.n).push(x); }
  const order = [...by.entries()].sort((a, b) => b[1].reduce((s, x) => s + x.g * 100 + x.min, 0) - a[1].reduce((s, x) => s + x.g * 100 + x.min, 0));
  const blocks = order.map(([n, a]) => `<b>${n}</b> (⟦${a[0].club}⟧)\n` + a.sort((x, y) => x.d.localeCompare(y.d)).map((x) => `${uzDay(x.d).split(",")[0]}: ⟦${x.H}⟧ ${x.sc} ⟦${x.A}⟧ — ${x.line}.`).join("\n")).join("\n\n");
  const tot = L.reduce((s, x) => s + x.min, 0), goals = L.reduce((s, x) => s + x.g, 0); if (!tot && !force) return "noplay"; // 2026-11-09: hech kim o'ynamagan hafta — "jami 0 daqiqa" posti chiqmaydi
  const post = `<b>O'zbek legionerlari: hafta yakunlari</b>\n\n${uzDay(addDays(d, -7)).split(",")[0]} — ${uzDay(addDays(d, -1)).split(",")[0]}, ${d.slice(0, 4)}-yil.${tot ? ` Legionerlarimiz jami ${tot} daqiqa maydonda bo'ldi${goals ? ", " + goals + " ta gol urdi" : ""}.` : ""}\n\n${blocks}\n\n#Legionerlar #Ozbekiston`;
  await resultJob(env, post, to || null, { kind: "news" }); return "ok";
}

// ---------------- O'ZBEK FUTBOLI FAKTLARI (Bahtiyor aka tanlovi, 2026-11-08): har kuni 15:00 ----------------
// Manbalar ko'p: Vikipediya (ingliz, rus, o'zbek) — terma jamoa, klublar, chempionat, afsonalar, turnirlar; FotMob — legionerlar karyerasi, sovrinlari, mavsum statistikasi.
// Har bir post nazoratchidan (factCheck) o'tadi; rasm — doim brend kartochka (haqiqiy futbolchi surati qo'yilmaydi).
const UZF_WIKI = [
  ["en", "Uzbekistan national football team"], ["en", "Pakhtakor Tashkent FK"], ["en", "FC Bunyodkor"], ["en", "FC Nasaf"], ["en", "Navbahor Namangan"], ["en", "FC AGMK"],
  ["en", "Neftchi Fergana"], ["en", "Uzbekistan Super League"], ["en", "Uzbekistan national under-23 football team"], ["en", "Uzbekistan national under-20 football team"],
  ["en", "Uzbekistan Football Association"], ["en", "Server Djeparov"], ["en", "Mirjalol Qosimov"], ["en", "Maksim Shatskikh"], ["en", "Odil Ahmedov"], ["en", "Timur Kapadze"],
  ["en", "Ignatiy Nesterov"], ["en", "Milliy Stadium"], ["en", "Uzbekistan Cup"], ["en", "2011 AFC Asian Cup"], ["en", "2018 AFC U-23 Championship"], ["en", "2023 AFC U-20 Asian Cup"],
  ["en", "Eldor Shomurodov"], ["en", "Abdukodir Khusanov"], ["en", "Jaloliddin Masharipov"], ["en", "Abbosbek Fayzullaev"],
  ["ru", "Сборная Узбекистана по футболу"], ["ru", "Пахтакор (футбольный клуб)"], ["ru", "Чемпионат Узбекистана по футболу"], ["ru", "Шацких, Максим Александрович"],
  ["ru", "Джепаров, Сервер Ризаевич"], ["ru", "Касымов, Мирджалол Мирзаевич"], ["ru", "Бунёдкор"], ["ru", "Насаф (футбольный клуб)"], ["ru", "Кубок Узбекистана по футболу"],
  ["uz", "Oʻzbekiston milliy futbol terma jamoasi"], ["uz", "Paxtakor (futbol klubi)"],
];
async function uzfSource(env) {
  const used = (await kvGet(env, "uzfUsed", [])).filter((u) => Date.now() - u.t < 20 * 86400e3).map((u) => u.k);
  for (let tries = 0; tries < 4; tries++) {
    if (Math.random() < 0.4) { // FotMob: legioner karyerasi
      const P = FOCUS_PLAYERS.filter((p) => p.fm && !p.star && !used.includes("fm" + p.fm)); if (!P.length) continue; const p = P[Math.floor(Math.random() * P.length)];
      let j; try { j = await (await fetch("https://www.fotmob.com/api/data/playerData?id=" + p.fm, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } })).json(); } catch (e) { continue; }
      const ce = j.careerHistory?.careerItems || {}; const yr = (d) => (d ? String(d).slice(0, 4) : "hozirgacha");
      const row = (x) => `${x.team} (${yr(x.startDate)}–${x.endDate ? yr(x.endDate) : "hozirgacha"}${x.transferType?.text ? ", " + x.transferType.text : ""}): ${x.appearances || "?"} matches, ${x.goals || 0} goals${x.assists ? ", " + x.assists + " assists" : ""}`;
      const senior = (ce.senior?.teamEntries || []).map(row).join("\n"), nat = (ce["national team"]?.teamEntries || []).map(row).join("\n");
      const tro = (j.trophies?.playerTrophies || []).flatMap((t) => (t.tournaments || []).map((x) => `${t.teamName}: ${x.leagueName} — ${(x.seasonsWon || []).join(", ")}`)).join("\n");
      const ml = j.mainLeague ? `${j.mainLeague.leagueName} ${j.mainLeague.season}: ` + (j.mainLeague.stats || []).map((x) => x.title + " " + x.value).join(", ") : "";
      const text = `Player: ${j.name}. Born: ${String(j.birthDate?.utcTime || "").slice(0, 10)}. Position: ${j.positionDescription?.primaryPosition?.label || ""}. Current club: ${j.primaryTeam?.teamName || ""}.\nClub career (senior):\n${senior}\nNational team:\n${nat}\nTrophies:\n${tro}\nCurrent season: ${ml}`;
      if (!senior) continue;
      return { key: "fm" + p.fm, uzName: p.n.replace(/[⟦⟧]/g, ""), item: { title: j.name + " — karyera (FotMob)", desc: "", text, link: "https://www.fotmob.com/players/" + p.fm, source: "FotMob", img: null, date: Date.now() } };
    }
    const W = UZF_WIKI.filter(([l, t]) => !used.includes(l + ":" + t)); if (!W.length) continue; const [lang, title] = W[Math.floor(Math.random() * W.length)];
    let j; try { j = await wikiJson([`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&redirects=1&titles=` + encodeURIComponent(title)]); } catch (e) { continue; }
    const pg = Object.values(j.query?.pages || {})[0] || {}; const full = String(pg.extract || ""); if (full.length < 800) continue;
    const parts = full.split(/\n(?===+ )/).filter((x) => x.length > 500 && !/^== ?(See also|References|External links|Notes|Literature|Ссылки|Примечания|См\. также|Литература|Manbalar|Havolalar|Current squad|Состав)/i.test(x));
    if (!parts.length) continue; const chunk = parts[Math.floor(Math.random() * parts.length)].slice(0, 5000);
    return { key: lang + ":" + title, item: { title: pg.title || title, desc: "", text: chunk, link: `https://${lang}.wikipedia.org/wiki/` + encodeURIComponent(String(pg.title || title).replace(/ /g, "_")), source: "Wikipedia", img: null, date: Date.now() } };
  }
  return null;
}
async function uzFactMake(env, deadline) {
  const s0 = await uzfSource(env); if (!s0) return null; const item = s0.item;
  const prompt = `Sen o'zbek tilidagi "Inter Futbol" Telegram kanalining muharririsan. "O'zbek futboli" rukni uchun quyidagi manbadan BITTA eng qiziqarli, ko'pchilik bilmaydigan faktni top va u haqida qisqa post yoz (o'zbek tili, lotin yozuvi). Manba ingliz, rus yoki o'zbek tilida bo'lishi mumkin.
Qoidalar:
- FAQAT manbadagi faktlarni yoz. O'zingdan raqam, sana, ism, klub, sovrin qo'shma. Shubhali narsani yozma.
- Qiziqarli bo'lsin: rekord, birinchi marta bo'lgan voqea, kutilmagan karyera burilishi, katta g'alaba, sovrin, raqamlar (o'yinlar, gollar). Quruq ma'lumotnoma emas, hikoya kabi.
- "Bugun", "kecha", "hozir" so'zlarini ishlatma; vaqt o'tib o'zgaradigan raqam bo'lsa, qaysi yil yoki mavsum holatiga ko'ra ekanini yoz.
- Tuzilishi: 1-qator: <b>qiziqtiruvchi qisqa sarlavha</b> (faktning o'zi). Bo'sh qator. 2–4 gap: tafsilot va nega qiziq. Bo'sh qator. 2–3 heshteg: #OzbekFutboli #QiziqarliFakt va futbolchi/klub nomi.
- O'zbek futbolchilari va o'zbek klublari nomini o'zbekcha lotin yozuvida yoz (${s0.uzName ? s0.uzName + ", " : ""}Abduqodir Husanov, Eldor Shomurodov, Mirjalol Qosimov, Server Djeparov, Odil Ahmedov, Paxtakor, Bunyodkor, Nasaf). Xorijiy klub va futbolchilar nomini ORIGINAL rasmiy lotin yozuvida yoz va ⟦ ⟧ ichiga ol: ⟦Roma⟧, ⟦Manchester City⟧. Terma jamoa va davlat nomlari o'zbekcha ("O'zbekiston terma jamoasi", "Osiyo kubogi"). Inglizcha yoki ruscha so'z qoldirma.
- Emoji ishlatma. Faqat <b> tegi. 600 belgidan oshmasin.
Manba (${item.source}): ${item.title}
${item.text}`;
  const raw = await callGemini(env, prompt, 0.6, deadline, 2048, false, true);
  const post = postClean(raw, false); const fc = await factCheck(env, item, post, deadline);
  if (fc.bad.length) { const u = await kvGet(env, "uzfUsed", []); u.push({ k: s0.key, t: Date.now() }); await kvPut(env, "uzfUsed", u.slice(-80)); return { bad: 1 }; }
  return { post: fc.text, fixed: fc.fixed, item, key: s0.key };
}
async function uzFactRun(env, to) {
  const f = await uzFactMake(env, Date.now() + 110000); if (!f) return "none"; if (f.bad) return "err nazoratdan o'tmadi";
  await resultJob(env, f.post, to || null, { kind: "news" });
  if (!to) { const u = await kvGet(env, "uzfUsed", []); u.push({ k: f.key, t: Date.now() }); await kvPut(env, "uzfUsed", u.slice(-80)); }
  return "ok " + f.key;
}

// ---------------- INTER DIKTOR — ALOHIDA BOT (2026-11-18, Bahtiyor aka: "diktorni alohida botga o'tkazamiz, bazasi rasmlar bazasiga o'xshasin") ----------------
// Bot: @InterDiktorBot; ovozlar bazasi: yopiq kanal "Inter Diktor — Ovozlar" (DK_CHAT), bot u yerda admin. Kalit kodda emas — KV dkTok da (admin BotFather xabarini
// asosiy botga uzatadi). Hozircha 1-bosqich: ulanish, /start, bazaga tushgan ovoz + matn juftliklarini ro'yxatga olish (KV dkBase). Matnni ovozga aylantirish
// (Modal'da) va o'qitish — keyingi bosqich.
const DK_CHAT = -1004425577117;
const dkSecret = async (tok) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("dk-" + tok)))].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
async function dkTg(tok, method, body) { const r = await fetch(`https://api.telegram.org/bot${tok}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) }); return r.json().catch(() => ({ ok: false })); }
async function dkConnect(env, chat, msg) {
  const tok = (String(msg.text).match(/\d{6,}:[A-Za-z0-9_-]{30,}/) || [])[0];
  await tg(env, "deleteMessage", { chat_id: chat, message_id: msg.message_id }).catch(() => null);
  const me = await dkTg(tok, "getMe");
  if (me.ok && /video/i.test(me.result.username || "")) { await vdConnect(env, chat, tok, me.result); return; }
  if (!me.ok || !/diktor/i.test(me.result.username || "")) { await tg(env, "sendMessage", { chat_id: chat, text: "Bu kalit Inter Diktor botiniki emas yoki ishlamayapti. Xabar o'chirildi." }); return; }
  await kvPut(env, "dkToken", tok);
  const wh = await dkTg(tok, "setWebhook", { url: WURL + "/dkhook", secret_token: await dkSecret(tok), allowed_updates: ["message", "channel_post", "edited_channel_post", "callback_query"] });
  await dkTg(tok, "setMyCommands", { commands: [{ command: "start", description: "Bot haqida" }, { command: "baza", description: "Ovozlar bazasi holati" }] });
  await tg(env, "sendMessage", { chat_id: chat, text: (wh.ok ? "✅ Inter Diktor boti ulandi: @" + me.result.username : "Kalit saqlandi, lekin ulanishda xato: " + (wh.description || "")) + "\nKalitli xabar o'chirildi." });
}
// ---------------- INTER FUTBOL VIDEO ARXIV — ALOHIDA BOT (2026-11-19, Bahtiyor aka: "video arxiv uchun diktorniki kabi alohida bot, shunda chalkash bo'lmaydi";
// nomi @InterFutbolVideoArxivBot — "Futbol" so'zi bilan, chunki Inter MMA ham bor) ----------------
// Video arxiv: yopiq kanal "Inter Futbol — Video Arxiv" (VD_CHAT) — videolardan lavhalar va o'z videolarimiz. Kalit kodda emas — KV vdToken da (admin BotFather
// xabarini asosiy botga uzatadi). 1-bosqich: ulanish va /start. Bot faqat BOSHQARUVCHI: 20 MB dan katta faylni yuklab ololmaydi, 50 MB dan kattasini
// yubora olmaydi — og'ir ish (videoni olish, lavhalarga kesish) hisob seansi va GitHub'da bajariladi. KV'ga har xabarda yozilmaydi (kunlik yozish limiti umumiy).
const VD_CHAT = -1004385358467;
async function vdConnect(env, chat, tok, me) {
  await kvPut(env, "vdToken", tok);
  const wh = await dkTg(tok, "setWebhook", { url: WURL + "/vdhook", secret_token: await dkSecret(tok), allowed_updates: ["message", "channel_post", "callback_query"] });
  await dkTg(tok, "setMyCommands", { commands: [{ command: "start", description: "Bot haqida" }] });
  await tg(env, "sendMessage", { chat_id: chat, text: (wh.ok ? "✅ Inter Futbol Video Arxiv boti ulandi: @" + me.username : "Kalit saqlandi, lekin ulanishda xato: " + (wh.description || "")) + "\nKalitli xabar o'chirildi." });
}
// 2-BOSQICH (2026-11-19, Bahtiyor aka: "ha boshla"): ARXIVGA QABUL. Kanalga tashlangan har bir video O'Z kalitida yoziladi (vda:<xabar>, qisqa ma'lumoti
// metadata'da — ro'yxat bitta "list" so'rovi bilan o'qiladi, har yozuv alohida o'qilmaydi). Videoning o'zi Telegram kanalida turadi — serverda joy olmaydi.
// LIMIT: bitta video = bitta KV yozuvi; nom berish/olib tashlash — yana bitta. Yozish limiti tugagan bo'lsa video yo'qolmaydi (kanalda turadi) — bot aytadi,
// keyin videoga javob "?" bilan ro'yxatga qo'shiladi. Nom: izohning birinchi qatori; izoh bo'lmasa fayl nomi; albomda nomsizlari albomdagi nomlisidan oladi.
// Videoga javob: matn — nom berish; "-" — ro'yxatdan olib tashlash (video kanalda qoladi); "?" — qayta yozish. Shaxsiy chatda (faqat admin): /arxiv.
const vdDur = (x) => { x = Math.round(x || 0); return Math.floor(x / 60) + ":" + String(x % 60).padStart(2, "0"); };
const vdMb = (b) => !b ? "" : b >= 1048576 ? (b / 1048576).toFixed(b >= 10485760 ? 0 : 1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
function vdMedia(m) {
  const v = m.video || m.animation || m.video_note || (m.document && /^video\//.test(m.document.mime_type || "") ? m.document : null);
  return v ? { v, k: m.video ? "video" : m.animation ? "gif" : m.video_note ? "dumaloq" : "fayl" } : null;
}
function vdName(cap, fn) {
  const c = String(cap || "").split("\n").map((x) => x.trim()).filter(Boolean)[0] || "";
  if (c) return c.slice(0, 120);
  const f = String(fn || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").trim();
  return /^(video|vid|img|mov|document|file|telegram|whatsapp|screen|record|\d|-|\s)*$/i.test(f) ? "" : f.slice(0, 120);
}
function vdEntry(m, md) {
  const v = md.v;
  return { m: m.message_id, f: v.file_id, u: v.file_unique_id || "", k: md.k, n: vdName(m.caption, v.file_name), c: String(m.caption || "").slice(0, 1000),
    d: v.duration || 0, w: v.width || v.length || 0, h: v.height || v.length || 0, sz: v.file_size || 0, g: m.media_group_id || "", at: Date.now() };
}
// XOTIRA: D1 bazasi "inter-futbol" (env.DB; 2026-11-19, Bahtiyor aka: "shuni ulaylik") — bepul tarifda kuniga 100 000 qator yozish (KV'da 1000), shuning uchun
// video ro'yxati D1'da turadi va KV limitini yemaydi. D1 javob bermasa yoki ulanmagan bo'lsa — eski yo'l (KV vda:<xabar>) zaxira; ro'yxat ikkalasidan yig'iladi.
let VD_DB_OK = false;
async function vdDb(env) {
  if (!env.DB) return null;
  if (!VD_DB_OK) { await env.DB.prepare("CREATE TABLE IF NOT EXISTS vda (m INTEGER PRIMARY KEY, n TEXT, d INTEGER, k TEXT, g TEXT, sz INTEGER, at INTEGER, j TEXT)").run(); await env.DB.prepare("CREATE TABLE IF NOT EXISTS vsrc (k TEXT PRIMARY KEY, m INTEGER, at INTEGER)").run(); VD_DB_OK = true; }
  return env.DB;
}
async function vdSave(env, e) {
  try { const db = await vdDb(env); if (db) { await db.prepare("INSERT OR REPLACE INTO vda (m, n, d, k, g, sz, at, j) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(e.m, e.n, e.d || 0, e.k, e.g || "", e.sz || 0, e.at || Date.now(), JSON.stringify(e)).run(); return "d1"; } } catch (x) { console.log("vd d1", x && x.message); }
  await env.STATE.put("vda:" + e.m, JSON.stringify(e), { metadata: { n: e.n.slice(0, 80), d: e.d, k: e.k, g: e.g, sz: e.sz } }); return "kv";
}
async function vdGet(env, m) {
  try { const db = await vdDb(env); if (db) { const r = await db.prepare("SELECT j FROM vda WHERE m = ?").bind(m).first(); if (r && r.j) return JSON.parse(r.j); } } catch (x) { console.log("vd d1", x && x.message); }
  return await kvGet(env, "vda:" + m, null);
}
async function vdDel(env, m) {
  let ok = false;
  try { const db = await vdDb(env); if (db) { await db.prepare("DELETE FROM vda WHERE m = ?").bind(m).run(); ok = true; } } catch (x) { console.log("vd d1", x && x.message); }
  if (!ok || (await env.STATE.get("vda:" + m)) !== null) await env.STATE.delete("vda:" + m);
}
const vdLine = (e) => [e.d ? vdDur(e.d) : "", e.w && e.h ? e.w + "x" + e.h : "", vdMb(e.sz)].filter(Boolean).join(" · ");
async function vdList(env) {
  const out = []; let cursor;
  try { const db = await vdDb(env); if (db) { const r = await db.prepare("SELECT m, n, d, k, g, sz FROM vda ORDER BY m DESC LIMIT 5000").all(); for (const x of r.results || []) out.push(x); } } catch (x) { console.log("vd d1", x && x.message); }
  const have = new Set(out.map((x) => x.m));
  for (let i = 0; i < 5; i++) { const r = await env.STATE.list({ prefix: "vda:", cursor }); for (const k of r.keys) { const m = Number(k.name.slice(4)); if (!have.has(m)) out.push({ m, ...(k.metadata || {}) }); } if (r.list_complete || !r.cursor) break; cursor = r.cursor; }
  const gn = {}; for (const x of out) if (x.g && x.n && !gn[x.g]) gn[x.g] = x.n;  // albom: nomsizlari nomlisidan oladi
  for (const x of out) if (!x.n && x.g && gn[x.g]) x.n = gn[x.g];
  return out.sort((a, b) => b.m - a.m);
}
async function vdUpdate(env, up, tok) {
  const cp = up.channel_post;
  if (cp) {
    if (!cp.chat || cp.chat.id !== VD_CHAT) return;
    const say = (text, to) => dkTg(tok, "sendMessage", { chat_id: VD_CHAT, reply_to_message_id: to || cp.message_id, text, disable_notification: true });
    const md = vdMedia(cp);
    if (md) {
      const e = vdEntry(cp, md);
      try { await vdSave(env, e); } catch (x) { await say("⚠️ Video qabul qilindi va kanalda turibdi, lekin ro'yxatga yozilmadi: xotira hozir javob bermadi.\nKeyinroq shu videoga javob qilib «?» yozing — ro'yxatga qo'shaman."); return; }
      if (e.g && !e.n) return;  // albomning izohsiz bo'laklari — javob bitta, izohlisida
      await say("✅ Arxivga yozildi — №" + e.m + (e.g ? " (albom)" : "") + "\n" + (e.n ? "Nomi: " + e.n : "Nomi yo'q — shu videoga javob qilib nom yozing.") + (vdLine(e) ? "\n" + vdLine(e) : ""));
      return;
    }
    const rt = cp.reply_to_message, t = (cp.text || "").trim();
    if (!rt || !t) return;
    const rmd = vdMedia(rt); if (!rmd) return;
    try {
      if (t === "-") { await vdDel(env, rt.message_id); await say("Ro'yxatdan olib tashlandi — №" + rt.message_id + ". Videoning o'zi kanalda qoladi.", rt.message_id); return; }
      const cur = await vdGet(env, rt.message_id);
      const e = cur && cur.f ? cur : vdEntry(rt, rmd);
      if (t === "?") { await vdSave(env, e); await say("✅ Ro'yxatga yozildi — №" + e.m + (e.n ? "\nNomi: " + e.n : "\nNomi yo'q — shu videoga javob qilib nom yozing."), rt.message_id); return; }
      e.n = t.split("\n")[0].trim().slice(0, 120); await vdSave(env, e); await say("Nomi saqlandi — №" + e.m + ": " + e.n, rt.message_id);
    } catch (x) { await say("⚠️ Saqlanmadi: xotira hozir javob bermadi. Keyinroq qayta yozing.", rt.message_id); }
    return;
  }
  const m = up.message; if (!m || !m.chat || m.chat.type !== "private") return;
  const adm = (await getAdmins(env)).includes(m.chat.id);
  const txt = m.text || "";
  if (/^\/start/.test(txt)) {
    if (adm) await dkTg(tok, "setMyCommands", { commands: [{ command: "start", description: "Bot haqida" }, { command: "arxiv", description: "Video arxiv ro'yxati" }] });
    await dkTg(tok, "sendMessage", { chat_id: m.chat.id, text: "Inter Futbol Video Arxiv boti.\n\n" + (adm ? "Videoni «Inter Futbol — Video Arxiv» kanaliga tashlang — izohiga nomini yozing. Bot uni ro'yxatga yozib, javob beradi.\n\nVideoga javob qilib yozilsa:\n• matn — nomini o'zgartiradi\n• «-» — ro'yxatdan olib tashlaydi\n\n/arxiv — ro'yxat" : "Bu bot yopiq arxiv uchun ishlaydi.") });
    return;
  }
  if (!adm) return;
  if (/^\/arxiv/.test(txt)) {
    const L = await vdList(env);
    if (!L.length) { await dkTg(tok, "sendMessage", { chat_id: m.chat.id, text: "Arxiv hozircha bo'sh. Videoni «Inter Futbol — Video Arxiv» kanaliga tashlang." }); return; }
    const sec = L.reduce((a, x) => a + (x.d || 0), 0), sz = L.reduce((a, x) => a + (x.sz || 0), 0), nn = L.filter((x) => !x.n).length;
    const rows = L.slice(0, 25).map((x) => "№" + x.m + " — " + (x.n || "nomsiz") + (x.d ? " (" + vdDur(x.d) + ")" : ""));
    await dkTg(tok, "sendMessage", { chat_id: m.chat.id, text: "Video arxiv: " + L.length + " ta video, jami " + vdDur(sec) + (sz ? ", " + vdMb(sz) : "") + (nn ? "\nNomsiz: " + nn + " ta" : "") + "\nXotira: " + (env.DB ? "D1 bazasi" : "KV (zaxira)") + "\n\nOxirgilari:\n" + rows.join("\n") });
    return;
  }
  if (vdMedia(m)) await dkTg(tok, "sendMessage", { chat_id: m.chat.id, text: "Videoni shu yerga emas, «Inter Futbol — Video Arxiv» kanaliga tashlang — o'sha yerda arxivga yoziladi." });
}
// TO'PLAM (2026-11-19): bitta matn fayli (Word) + shu matn o'qilgan bir nechta ovoz fayli. Ish matn fayli bo'yicha boshlanadi (bitta hodisa — poyga yo'q);
// ovozlar ro'yxatini Modal'dagi ish kanalning o'zidan o'qiydi (matndan keyin, keyingi matn fayligacha tashlanganlari) va ular tashlab bo'linishini kutadi.
// OVOZ NOMI (Bahtiyor aka, 2026-11-19): har bir diktor ovozi o'z nomi bilan yuritiladi — hozirgi ovoz "Kozim Komilov"; yangi ovoz qo'shilsa unga alohida nom beriladi.
// Matn fayli izohiga "ovoz: Ism Familiya" yozilsa — to'plam o'sha ovozga; yozilmasa — joriy ovozga (KV dkVoice; diktor botida "/ovoz Ism Familiya" bilan almashtiriladi).
const DK_VOICE0 = "Kozim Komilov";
async function dkSetStart(env, tok, docM, now, voice) {
  const cur = await kvGet(env, "dkset:" + docM, null); if (cur && cur.st === "moslanmoqda" && Date.now() - (cur.at || 0) < 40 * 60e3) return cur.job;
  const id = "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const v = String(voice || (cur && cur.v) || (await kvGet(env, "dkVoice", DK_VOICE0))).slice(0, 60);
  const oz = cur && (cur.zip || cur.oz) || 0;  // avvalgi to'plam (ZIP) — yangisi tayyor bo'lgach o'chiriladi
  await kvPut(env, "dkset:" + docM, { st: "moslanmoqda", job: id, at: Date.now(), v, oz, last: (cur && cur.last) || 0 });
  if (docM > ((await kvGet(env, "dkLastDoc", 0)) || 0)) await kvPut(env, "dkLastDoc", docM);
  await kvPut(env, "dkj:" + id, { d: docM, now: now ? 1 : 0, v }, { expirationTtl: 3 * 86400 });
  let ok = false; for (let i = 0; i < 3 && !ok; i++) { try { ok = await ghDispatch(env, "dkalign.yml", { job: id }); } catch (x) {} }  // 2026-11-19: moslash GitHub'da (ochiq ombor — bepul, 4 yadro)
  if (!ok) await kvPut(env, "dkset:" + docM, { st: "xato", job: id, at: Date.now(), err: "server javob bermadi" });
  await dkTg(tok, "sendMessage", { chat_id: DK_CHAT, reply_to_message_id: docM, text: ok ? (oz ? "Yangi yozuvlar qo'shildi — to'plam qayta moslanmoqda (ovoz: " + v + ")." : "Matn fayli qabul qilindi (ovoz: " + v + ").") + " Shu matnning ovoz fayllarini ketidan tashlang (bir nechta bo'lsa — tartib bilan). Oxirgi fayldan keyin 2 daqiqa kutib, hammasini o'zim ulayman, matnga moslayman va tayyor to'plamni (ZIP) shu yerga tashlayman." : "⚠️ Moslash ishga tushmadi (server javob bermadi). Birozdan keyin matn faylini qayta tashlang." });
  return id;
}
async function dkUpdate(env, u, tok) {
  const admins = await getAdmins(env);
  const cp = u.channel_post || u.edited_channel_post;
  if (cp) {
    if (!cp.chat || cp.chat.id !== DK_CHAT) return;
    let a = cp.voice || cp.audio || (cp.document && /^audio\//.test(cp.document.mime_type || "") ? cp.document : null);
    if (a && /^(namuna_|asl_ovoz)/i.test(a.file_name || "")) return;  // diktor namunalari — baza yozuvi emas
    if (a && /^\s*#matnsiz/i.test(cp.caption || "")) return;  // matnsiz eski yozuvlar — to'plamga qo'shilmaydi, alohida ishlanadi
    const dn = cp.document && !a ? String(cp.document.file_name || "") : "";
    if (dn) {
      if (u.edited_channel_post) return;
      if (/\.zip$/i.test(dn)) return; // moslash natijasi (to'plam) — o'zimizniki
      if (!/\.(docx|txt)$/i.test(dn)) { if (/\.(doc|rtf|pdf|odt)$/i.test(dn)) await dkTg(tok, "sendMessage", { chat_id: DK_CHAT, reply_to_message_id: cp.message_id, text: "Matn fayli .docx (Word) yoki .txt bo'lishi kerak. Word'da «Saqlash turi: Word hujjati (.docx)» qilib saqlab, qayta tashlang." }); return; }
      const vm = /(?:^|\n)\s*ovoz\s*[:\-—]\s*([^\n]{2,60})/i.exec(cp.caption || ""); await dkSetStart(env, tok, cp.message_id, false, vm ? vm[1].trim() : null); return;
    }
    if (!a) { // matnli xabar: ovozga javob bo'lsa — o'sha yozuvning matni; "-" — yozuvni bazadan olib tashlash; matn fayliga "qayta" — qayta moslash
      const rt = cp.reply_to_message, t = (cp.text || "").trim(); if (!rt || !t) return;
      if (/^qayta$/i.test(t) && rt.document && /\.(docx|txt)$/i.test(rt.document.file_name || "")) { await env.STATE.delete("dkset:" + rt.message_id); await dkSetStart(env, tok, rt.message_id, true); return; }
      const e = await kvGet(env, "dka:" + rt.message_id, null); if (!e) return;
      if (t === "-") { await env.STATE.delete("dka:" + rt.message_id); await dkTg(tok, "sendMessage", { chat_id: DK_CHAT, text: "Bazadan olib tashlandi.", reply_to_message_id: rt.message_id }); }
      else { e.t = t.slice(0, 4000); await env.STATE.put("dka:" + rt.message_id, JSON.stringify(e), { metadata: { d: e.d || 0, t: 1 } }); await dkTg(tok, "sendMessage", { chat_id: DK_CHAT, text: "Matn saqlandi (" + e.t.length + " belgi).", reply_to_message_id: rt.message_id }); }
      return;
    }
    // OVOZ: har yozuv O'Z kalitida saqlanadi (dka:<xabar>) — bir vaqtda 20–30 fayl tashlanganda umumiy ro'yxat ustiga yozilib, yozuvlar yo'qolmasligi uchun.
    // Har faylga javob yozilmaydi (27 ta fayl — 27 ta xabar bo'lib ketgan edi); faqat ovozli xabar yoki 20 MB dan katta faylda ogohlantiriladi.
    const cap = (cp.caption || "").trim();
    const e = { m: cp.message_id, f: a.file_id, k: cp.voice ? "voice" : "file", d: a.duration || 0, sz: a.file_size || 0, t: cap.slice(0, 4000), at: Date.now() };
    await env.STATE.put("dka:" + cp.message_id, JSON.stringify(e), { metadata: { d: e.d, t: cap ? 1 : 0 } });
    // to'plam tayyor bo'lgandan KEYIN shu matnning yana ovozlari kelsa (bo'lib-bo'lib tashlangan) — to'plam o'zi qayta moslanadi
    if (!u.edited_channel_post) { const ld = await kvGet(env, "dkLastDoc", 0); if (ld && cp.message_id > ld) { const st = await kvGet(env, "dkset:" + ld, null); if (st && (st.st === "tayyor" || st.st === "xato") && cp.message_id > (st.last || 0)) await dkSetStart(env, tok, ld, false); } }
    if (!u.edited_channel_post && (cp.voice || a.file_size > 20 * 1024 * 1024)) await dkTg(tok, "sendMessage", { chat_id: DK_CHAT, reply_to_message_id: cp.message_id, text: cp.voice ? "Ovozli xabar qabul qilindi, lekin sifat uchun yozuvni FAYL qilib yuborgan ma'qul." : "Katta fayl qabul qilindi (hisob orqali yuklab olinadi)." });
    return;
  }
  const msg = u.message; if (!msg) return; const chat = msg.chat.id, text = msg.text || "";
  if (!admins.includes(chat)) { await dkTg(tok, "sendMessage", { chat_id: chat, text: "Bu bot yopiq." }); return; }
  if (text === "/baza") {
    let n = 0, sec = 0, wt = 0, cur; do { const L = await env.STATE.list({ prefix: "dka:", cursor: cur }); for (const k of L.keys) { n++; sec += (k.metadata && k.metadata.d) || 0; if (k.metadata && k.metadata.t) wt++; } cur = L.list_complete ? null : L.cursor; } while (cur);
    let sets = 0, segs = 0, ssec = 0; const byV = {}; cur = undefined; do { const L = await env.STATE.list({ prefix: "dkset:", cursor: cur }); for (const k of L.keys) { const v = await kvGet(env, k.name, null); if (v && v.st === "tayyor") { sets++; segs += v.n || 0; ssec += v.sec || 0; const nm = v.v || DK_VOICE0; byV[nm] = byV[nm] || { n: 0, sec: 0 }; byV[nm].n += v.n || 0; byV[nm].sec += v.sec || 0; } } cur = L.list_complete ? null : L.cursor; } while (cur);
    await dkTg(tok, "sendMessage", { chat_id: chat, text: "Ovozlar bazasi: " + n + " ta yozuv, jami " + Math.floor(sec / 60) + " daqiqa " + (sec % 60) + " soniya.\nMatnga moslangan to'plamlar: " + sets + " ta — " + segs + " ta bo'lak, " + Math.floor(ssec / 60) + " daqiqa " + (ssec % 60) + " soniya.\nQisqa matni (izohi) bor yozuvlar: " + wt + " ta.\n\nOvozlar bo'yicha:\n" + (Object.keys(byV).map((nm) => "• " + nm + " — " + byV[nm].n + " ta bo'lak, " + Math.floor(byV[nm].sec / 60) + " daqiqa " + (byV[nm].sec % 60) + " soniya").join("\n") || "hali yo'q") + "\nJoriy ovoz: " + (await kvGet(env, "dkVoice", DK_VOICE0)) }); return; }
  if (/^\/ovoz(\s|$)/.test(text)) { const nm = text.replace(/^\/ovoz\s*/, "").trim().slice(0, 60); if (nm) await kvPut(env, "dkVoice", nm); await dkTg(tok, "sendMessage", { chat_id: chat, text: nm ? "Joriy ovoz: " + nm + ". Endi tashlanadigan matn va yozuvlar shu ovozga yoziladi." : "Joriy ovoz: " + (await kvGet(env, "dkVoice", DK_VOICE0)) + ".\nAlmashtirish: /ovoz Ism Familiya\nBitta to'plam uchun: Word fayli izohiga «ovoz: Ism Familiya» deb yozing." }); return; }
  // MATNNI OVOZGA AYLANTIRISH (Bahtiyor aka, 2026-11-19): diktor botida har bir ovozning o'z bo'limi (tugmasi) bor — hozircha "Kozim Komilov".
  // Bo'lim tanlanadi, keyin yozilgan har qanday matn shu ovozning eng so'nggi o'qitilgan modeli bilan o'qilib, audio qilib qaytariladi.
  // Matn GitHub jurnaliga chiqmasligi uchun KV'da (dkt:<id>, 2 soat) saqlanadi — ishga faqat id beriladi. Talaffuz lug'ati va sonlar qoidalari qo'llanadi.
  const voices = (await kvGet(env, "dkVoices", null)) || [DK_VOICE0];
  const kb = { keyboard: [voices.map((v) => ({ text: "🎙 " + v }))], resize_keyboard: true, is_persistent: true };
  const pick = /^🎙\s*(.+)$/.exec(text.trim());
  if (pick && voices.includes(pick[1].trim())) { await kvPut(env, "dkTtsV:" + chat, pick[1].trim()); await dkTg(tok, "sendMessage", { chat_id: chat, reply_markup: kb, text: "«" + pick[1].trim() + "» bo'limi. Matn yozing — shu ovozda o'qib, audio qilib yuboraman (qisqa matn — 10 daqiqacha, uzuni — ko'proq). Sonlar va talaffuz lug'ati qoidalari qo'llanadi." }); return; }
  // WORD FAYL (2026-11-19): bo'lim tanlangach Word (.docx) yoki .txt tashlansa — ichidagi mavzular (sarlavhalar) bo'yicha alohida audiolar tayyorlanadi
  // (Kaggle'ning bepul videokartasida; sarlavha va yorliq qatorlari o'qilmaydi, abzatslar orasida pauza).
  const wd = msg.document && /\.(docx|txt)$/i.test(msg.document.file_name || "") ? msg.document : null;
  if (msg.document && !wd) { await dkTg(tok, "sendMessage", { chat_id: chat, reply_to_message_id: msg.message_id, reply_markup: kb, text: "Matn fayli .docx (Word) yoki .txt bo'lishi kerak." }); return; }
  if (wd) {
    const v = (await kvGet(env, "dkTtsV:" + chat, null)) || voices[0];
    const id = "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await kvPut(env, "dkt:" + id, { f: wd.file_id, name: String(wd.file_name || "matn.docx").slice(0, 120), v, chat, m: msg.message_id }, { expirationTtl: 6 * 3600 });
    let ok = false; for (let i = 0; i < 3 && !ok; i++) { try { ok = await ghDispatch(env, "kgrun.yml", { script: "say", ref: id }); } catch (x) {} }
    await dkTg(tok, "sendMessage", { chat_id: chat, reply_to_message_id: msg.message_id, reply_markup: kb, text: ok ? "🎙 " + v + ": Word fayl navbatga qo'yildi. Bir necha daqiqada o'qish boshlanadi — har mavzu alohida audio bo'lib shu yerga keladi." : "⚠️ Ishga tushmadi (server javob bermadi). Faylni qayta tashlang." });
    return;
  }
  if (text.trim() && !text.startsWith("/")) {
    const v = (await kvGet(env, "dkTtsV:" + chat, null)) || voices[0];
    const t = text.trim().slice(0, 2500); const id = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await kvPut(env, "dkt:" + id, { t, v, chat, m: msg.message_id }, { expirationTtl: 2 * 3600 });
    let ok = false; for (let i = 0; i < 3 && !ok; i++) { try { ok = await ghDispatch(env, "dksay.yml", { tid: id }); } catch (x) {} }
    await dkTg(tok, "sendMessage", { chat_id: chat, reply_to_message_id: msg.message_id, reply_markup: kb, text: ok ? "🎙 " + v + " o'qiyapti (" + t.length + " belgi" + (text.trim().length > 2500 ? ", 2500 dan ortig'i kesildi" : "") + "). Tayyor bo'lgach audio shu yerga keladi." : "⚠️ O'qish ishga tushmadi (server javob bermadi). Matnni qayta yuboring." });
    return;
  }
  await dkTg(tok, "sendMessage", { chat_id: chat, reply_markup: kb, text: "Inter Diktor boti.\n\n🎙 Matnni ovozga aylantirish: pastdagi ovoz tugmasini bosing va matn yozing — shu ovozda o'qib beraman. Word fayl (.docx) tashlasangiz — ichidagi mavzular bo'yicha alohida audiolar tayyorlayman.\n\nOvozlar bazasi — «Inter Diktor — Ovozlar» kanali: u yerga ovoz yozuvini va uning matnini (Word .docx fayli) tashlang — bot ikkalasini moslab, yozuvni gaplarga bo'ladi va har bo'lakka o'z matnini qo'yadi. Qisqa yozuvda matnni izohga yozsa ham bo'ladi. Yozuvga «-» deb javob bersangiz, bazadan olinadi.\n/baza — bazada nechta yozuv borligi.\n/ovoz — bazaga yozilayotgan joriy ovoz." });
}

// ---------------- AFSONALAR TURKUMI (Bahtiyor aka tasdiqlagan, 2026-11-18 — Steven Gerrard namunasi; g'oya Goal.com "Icons" turkumidan) ----------------
// Har kuni 12:00 da bitta afsona haqida qisqa hikoya + yorqin afisha (card.py render_afsona_v): butun kadr surat, klub rangida gradient, yirik ism,
// "Klub · yillar" va 3 tagacha raqam. Faqat RASMLAR BAZASIDA surati bor afsonalar (people.py qo'shgan); matn Vikipediyadan, nazoratchidan o'tadi;
// afishadagi har bir raqam va yil manba matnida AYNAN bo'lishi shart (bo'lmasa tushirib qoldiriladi). Rukn nomi yozilmaydi. Bir afsona 90 kunda bir marta.
const LEGEND_NAMES = ["Diego Maradona", "Ronaldinho", "Ronaldo Nazário", "David Beckham", "Thierry Henry", "Andrés Iniesta", "Gianluigi Buffon", "Paolo Maldini", "Francesco Totti", "Andrea Pirlo", "Kaká", "Wayne Rooney", "Steven Gerrard", "Frank Lampard", "Carles Puyol", "Iker Casillas", "Bastian Schweinsteiger", "Arjen Robben", "Franck Ribéry", "Robin van Persie", "Dennis Bergkamp", "Eric Cantona", "Ryan Giggs", "Paul Scholes", "Alex Ferguson", "Arsène Wenger", "Roberto Baggio", "Alessandro Del Piero", "Javier Zanetti", "Raúl González", "Luís Figo", "Roberto Carlos", "Cafu", "Rivaldo", "Samuel Eto'o", "Didier Drogba", "Fernando Torres", "David Villa", "Xabi Alonso", "Philipp Lahm", "Miroslav Klose", "Oliver Kahn", "Michael Ballack", "Andriy Shevchenko", "Pavel Nedvěd", "Clarence Seedorf", "Patrick Vieira", "Petr Čech", "John Terry", "Rio Ferdinand", "Michael Owen", "Alan Shearer", "Gary Lineker", "Fabio Capello", "Marcello Lippi", "Vicente del Bosque", "Louis van Gaal", "Guus Hiddink", "Rafael Benítez", "Claudio Ranieri", "Zinedine Zidane"];
const LEGEND_WIKI = { "Ronaldo Nazário": "Ronaldo (Brazilian footballer)", "Raúl González": "Raúl (footballer)", "Xavi Hernández": "Xavi" };
async function legSource(env, pick) {
  const F = await kvGet(env, "faces", {}); const used = (await kvGet(env, "legUsed", [])).filter((u) => Date.now() - u.t < 90 * 86400e3).map((u) => u.k);
  let C = LEGEND_NAMES.filter((n) => { const P = F[pnorm(n)]; return P && (P.ph || []).some((p) => !p.low); });
  if (pick) C = C.filter((n) => pnorm(n).includes(pnorm(pick))); else C = C.filter((n) => !used.includes(n));
  for (let tries = 0; tries < 3 && C.length; tries++) {
    const name = C.splice(Math.floor(Math.random() * C.length), 1)[0]; const title = LEGEND_WIKI[name] || name;
    let j; try { j = await wikiJson(["https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&redirects=1&titles=" + encodeURIComponent(title)]); } catch (e) { continue; }
    const pg = Object.values(j.query?.pages || {})[0] || {}; const full = String(pg.extract || ""); if (full.length < 3000 || !/football/i.test(full.slice(0, 600))) continue;
    const cut = full.search(/\n== /); const lead = cut > 0 ? full.slice(0, cut) : full.slice(0, 3000); const rest = cut > 0 ? full.slice(cut) : "";
    return { name, item: { title: pg.title || title, desc: "", text: (lead + "\n" + rest.slice(0, 7000)).slice(0, 10500), link: "https://en.wikipedia.org/wiki/" + encodeURIComponent(String(pg.title || title).replace(/ /g, "_")), source: "Wikipedia", img: null, date: Date.now() } };
  }
  return null;
}
async function afsonaMake(env, deadline, pick) {
  const s0 = await legSource(env, pick); if (!s0) return null; const item = s0.item;
  const prompt = `Sen o'zbek tilidagi "Inter Futbol" Telegram kanalining muharririsan. Futbol afsonasi ${s0.name} haqida quyidagi manbadan qisqa, qiziqarli hikoya-post yoz (o'zbek tili, lotin yozuvi).
Qoidalar:
- FAQAT manbadagi faktlarni yoz. O'zingdan raqam, sana, ism, klub, sovrin, hisob qo'shma. Shubhali narsani yozma.
- Quruq tarjimai hol emas: uni afsonaga aylantirgan 1–2 ta ANIQ voqeani (final, rekord, burilish nuqtasi) yili va raqamlari bilan hikoya qilib ber. Har bir sana yili bilan.
- "Bugun", "kecha", "hozir" so'zlarini ishlatma. Maqtov so'zlarini (buyuk, betakror, afsonaviy) kamaytir — faktlar gapirsin.
- Tuzilishi: 1-qator: <b>${s0.name}: qisqa qiziqtiruvchi sarlavha</b>. Bo'sh qator. 3 ta qisqa xatboshi (har biri 1–3 gap), orasida bo'sh qator. Bo'sh qator. Heshteglar: futbolchi nomi, asosiy klubi va #FutbolTarixi.
- Xorijiy klub, futbolchi va murabbiy nomlarini ORIGINAL rasmiy lotin yozuvida yoz va ⟦ ⟧ ichiga ol: ⟦${s0.name}⟧, ⟦AC Milan⟧. Terma jamoa va davlat nomlari o'zbekcha ("Angliya terma jamoasi"). Turnirlar: "UEFA Chempionlar ligasi", "Angliya kubogi", "Jahon chempionati". Inglizcha yoki ruscha so'z qoldirma.
- Emoji ishlatma. Faqat <b> tegi. Post 900 belgidan oshmasin.
- Postdan KEYIN alohida ikki qator qo'sh (ular postga kirmaydi, afisha uchun):
DAVR: Asosiy klubi · yillar (masalan: Liverpool · 1998–2015) — klub nomi rasmiy yozuvda, yillar manbadagidek
RAQAMLAR: ko'pi bilan 3 ta, nuqtali vergul bilan (masalan: 710 öyin; 186 gol; 17 mavsum) — faqat manbada AYNAN shu raqam bilan yozilganlari; aniq bo'lmasa kamroq yoz
Manba (${item.source}): ${item.title}
${item.text}`;
  const raw = await callGemini(env, prompt, 0.6, deadline, 3072, false, true);
  const sub = ((raw.match(/^\s*DAVR:\s*(.+)$/m) || [])[1] || "").replace(/[⟦⟧*<>]/g, "").trim().slice(0, 60);
  const nums = ((raw.match(/^\s*RAQAMLAR:\s*(.+)$/m) || [])[1] || "").replace(/[⟦⟧*<>]/g, "");
  const src = item.text.replace(/[,\u00a0\u202f ](?=\d{3}\b)/g, "");
  const tiles = nums.split(/[;|]/).map((x) => x.trim().match(/^(\d[\d ]{0,6})\s+(.{2,16})$/)).filter(Boolean).map((m) => [m[1].replace(/ /g, ""), newAlpha(m[2].trim().toLowerCase())])
    .filter(([n]) => new RegExp("(^|\\D)" + n + "(\\D|$)").test(src)).slice(0, 3);
  const yrs = (sub.match(/\d{4}/g) || []); const subOk = sub && yrs.length && yrs.every((y) => item.text.includes(y));
  const post = postClean(raw.replace(/^\s*(DAVR|RAQAMLAR):.*$/gm, "").trim(), false);
  if (!new RegExp(pnorm(s0.name).split(" ").pop()).test(pnorm(post.split("\n")[0]))) return { bad: 1, why: "sarlavhada ism yo'q" };
  const fc = await factCheck(env, item, post, deadline);
  if (fc.bad.length) return { bad: 1, why: "nazoratdan o'tmadi" };
  return { post: fc.text, name: s0.name, legend: { name: s0.name, sub: subOk ? sub : "", tiles } };
}
async function afsonaRun(env, to, pick) {
  const f = await afsonaMake(env, Date.now() + 110000, pick); if (!f) return "none (bazada surati bor, ishlatilmagan afsona qolmadi yoki Vikipediya javob bermadi)"; if (f.bad) return "err " + f.why;
  await resultJob(env, f.post, to || null, { kind: "news", legend: f.legend });
  if (!to) { const u = await kvGet(env, "legUsed", []); u.push({ k: f.name, t: Date.now() }); await kvPut(env, "legUsed", u.slice(-120)); }
  return "ok " + f.name;
}

// ---------------- RAQAMLARDA (Bahtiyor aka tanlovi, 2026-11-08): haftada 2 marta (payshanba, yakshanba 13:00) ----------------
// Faqat aniq raqamlar, AI'siz. Gol va gol uzatmalari kamida IKKI manbada bir xil bo'lsagina chiqadi: FotMob, ESPN, football-data.
const STAT_PLAYERS = [
  { n: "Erling Haaland", fm: 737066 }, { n: "Kylian Mbappé", fm: 701154 }, { n: "Lamine Yamal", fm: 1467236 }, { n: "Harry Kane", fm: 194165 },
  { n: "Vinícius Júnior", fm: 846033 }, { n: "Jude Bellingham", fm: 1077894 }, { n: "Cole Palmer", fm: 1096353 }, { n: "Bukayo Saka", fm: 961995 },
  { n: "Raphinha", fm: 696679 }, { n: "Julián Álvarez", fm: 974753 }, { n: "Cristiano Ronaldo", fm: 30893 }, { n: "Lionel Messi", fm: 30981 },
  { n: "Eldor Shomurodov", fm: 619513, uz: 1 },
];
const LG_SLUG = { "Premier League": ["eng.1", "PL"], "LaLiga": ["esp.1", "PD"], "Serie A": ["ita.1", "SA"], "Bundesliga": ["ger.1", "BL1"], "Ligue 1": ["fra.1", "FL1"], "Super Lig": ["tur.1"], "Süper Lig": ["tur.1"], "Saudi Pro League": ["ksa.1"], "Major League Soccer": ["usa.1"], "MLS": ["usa.1"] };
const findStat = (o, name) => { if (!o || typeof o !== "object") return null; if (o.name === name && o.value != null) return Number(o.value); for (const v of Object.values(o)) { const r = findStat(v, name); if (r != null) return r; } return null; };
async function statPlayer(env, p) {
  const nk = (x) => norm(x).replace(/ /g, "");
  let fm; try { fm = await (await fetch("https://www.fotmob.com/api/data/playerData?id=" + p.fm, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } })).json(); } catch (e) { return null; }
  const ml = fm.mainLeague; if (!ml) return null; const st = Object.fromEntries((ml.stats || []).map((x) => [x.title, Number(x.value)]));
  const lgName = ml.leagueName; const [slug, fdc] = LG_SLUG[lgName] || [];
  const src = { fm: { g: st.Goals, a: st.Assists } };
  if (slug) { try { const ids = await kvGet(env, "espnIds", {}); let id = ids[p.fm]; if (!id) { const sj = await (await fetch("https://site.web.api.espn.com/apis/search/v2?limit=3&query=" + encodeURIComponent(fm.name || p.n), { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36", accept: "application/json" } })).json(); const c = (sj.results || []).find((r) => r.type === "player")?.contents?.[0]; id = c && String(c.uid || "").split("~a:")[1]; if (id) { ids[p.fm] = id; await kvPut(env, "espnIds", ids); } }
    if (id) { const ej = await (await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/${slug}/athletes/${id}`, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36", accept: "application/json" } })).json(); const g = findStat(ej.athlete?.statsSummary || ej, "totalGoals"), a = findStat(ej.athlete?.statsSummary || ej, "goalAssists"), sh = findStat(ej.athlete?.statsSummary || ej, "totalShots"); if (g != null) src.espn = { g, a, sh }; else src.espnErr = "statistika yo'q"; } else src.espnErr = "ID topilmadi"; } catch (e) { src.espnErr = String(e.message || e).slice(0, 60); } }
  if (fdc) { try { const j = await fd(env, `/competitions/${fdc}/scorers?limit=60`, 6 * 3600); const r = (j.scorers || []).find((x) => nk(x.player?.name) === nk(fm.name || p.n)); src.fd = r ? { g: r.goals, a: r.assists ?? null } : null; } catch (e) {} }
  const agree = (k) => { const v = Object.values(src).filter(Boolean).map((x) => x[k]).filter((x) => x != null); for (const x of v) if (v.filter((y) => y === x).length >= 2) return x; return null; };
  const g = agree("g"), a = agree("a"); if (g == null) return { fail: JSON.stringify(src).slice(0, 300) };
  return { p, name: fm.name || p.n, club: fm.primaryTeam?.teamName || "", lg: lgName, season: ml.season, g, a, mp: st.Matches, min: st["Minutes played"], rating: st.Rating, sh: src.espn?.sh, n: Object.values(src).filter(Boolean).length, srcs: Object.keys(src).filter((k) => src[k]).join("+") + (src.espnErr ? " (ESPN: " + src.espnErr + ")" : "") };
}
// robot qo'shgan logotiplar (KV cemoji) — postlarda ishlatish uchun CLUB_EMOJI'ga qo'shiladi (avval faqat buyruqlarda edi; endi cron'da ham)
async function mergeCemoji(env) { try { const cm = await kvGet(env, "cemoji", {}); let add = false; for (const [n, id] of Object.entries(cm)) if (!CLUB_EMOJI.some((c) => c[0] === id)) { const ns = [n]; const tm = n.match(/^(.+) terma jamoasi$/); if (tm) ns.unshift(tm[1] + " milliy futbol terma jamoasi", tm[1] + " milliy terma jamoasi", tm[1] + " futbol terma jamoasi"); CLUB_EMOJI.push([id, "⚽", ns]); add = true; } if (add) CLUB_RE = null; } catch (e) {} }
// LOGO ROBOTI (2026-11-09, Bahtiyor aka: "internetdagi manbalardan olib joylaydigan robot"): logotip to'plamida yo'q klub/terma jamoa navbatga
// yoziladi (nom + gerb manzili); emojiadd.yml (har kuni yoki navbat to'lsa) gerbni "Inter Futbol klublar" to'plamiga qo'shadi va /ub/emap bilan bog'laydi.
async function emojiNeed(env, name, logo) {
  try {
    if (!name || !logo) return;
    const has = (x) => CLUB_EMOJI.some((c) => c[2].some((y) => norm(y) === norm(x)));
    if (has(name)) return;
    const cm = await kvGet(env, "cemoji", {}); if (cm[name]) return;
    const q = await kvGet(env, "emojiNeed", []); if (q.some((x) => x.n === name)) return;
    q.push({ n: name, u: logo, t: Date.now() }); await kvPut(env, "emojiNeed", q.slice(-60));
  } catch (e) {}
}
const EN_COUNTRY = (cc) => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(cc); } catch (e) { return ""; } };
async function natTeamNeeds(env, post) {
  // postdagi "X terma jamoasi" — logotipi bo'lmasa navbatga (O'zbekiston — UFA gerbi; boshqalar — federatsiya gerbi Vikipediyadan)
  const t = String(post || "").replace(/<[^>]+>|[⟦⟧]/g, "");
  for (const [cc, names] of COUNTRY_FLAGS) {
    if (cc.length !== 2) continue;
    const nm = names.split("|")[0];
    const re = new RegExp("(" + [...new Set(names.split("|").flatMap((n) => [n, newAlpha(n)]))].map((x) => x.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&").replace(/'/g, "['‘’ʻʼ`]?")).join("|") + ")\\s+(?:milliy\\s+)?(?:futbol\\s+)?terma\\s+jamoa", "iu");
    if (!re.test(t)) continue;
    const key = nm + " terma jamoasi";
    const logo = cc === "UZ" ? await ufaCrest(env) : await wikiCrest(EN_COUNTRY(cc) + " national football team").catch(() => "");
    await emojiNeed(env, key, logo);
  }
}
// KLUB GERBINI QIDIRISH — bir nechta manba (2026-11-09, Bahtiyor aka: "logo topa olmasang qidir, bir nechta manbadan ol"):
// 1) o'z bazamiz (lgidx) 2) ESPN ro'yxati 3) FotMob qidiruvi (asl nom, lotincha, qisqa nom) 4) Wikipedia (klub maqolasining rasmi)
async function findCrest(env, name, idx) {
  if (!name) return "";
  const lat = name.replace(/ç/g, "ch").replace(/Ç/g, "Ch").replace(/ş/g, "sh").replace(/Ş/g, "Sh");
  const tries = [() => logoUrl(env, name, idx || {}), () => (lat !== name ? logoUrl(env, lat, idx || {}) : ""), () => ESPN_CREST[name] || ESPN_CREST[lat] || "",
    () => fmTeamLogo(name), () => (lat !== name ? fmTeamLogo(lat) : ""), () => (name.split(" ").length > 1 ? fmTeamLogo(name.split(" ").slice(-1)[0]) : ""), () => wikiCrest(name)];
  for (const f of tries) { try { const u = await f(); if (u) return u; } catch (e) {} }
  return "";
}
async function wikiCrest(name) {
  const h = { "user-agent": "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)" };
  const q = await (await fetch("https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=" + encodeURIComponent(name + " football club"), { headers: h })).json();
  for (const r of (q.query && q.query.search) || []) {
    if (!/f\.?c\.?|football|club|spor|united|city|athletic|\bsk\b|\bfk\b/i.test(r.title + " " + (r.snippet || ""))) continue;
    const sm = await (await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(r.title.replace(/ /g, "_")), { headers: h })).json();
    const u = (sm.thumbnail && sm.thumbnail.source) || (sm.originalimage && sm.originalimage.source) || "";
    if (u && /\.(svg|png)/i.test(u) && !/Flag_of/i.test(u)) return u.replace(/\/\d+px-/, "/330px-"); // Vikipediya faqat standart o'lchamlarni beradi; bayroq gerb emas
  }
  return "";
}
// LEGIONERLAR HAFTALIGI kartochkasi uchun (2026-11-09): post matnidan har bir futbolchi, klubi (gerbi bilan) va o'yinlari
async function legionFromPost(env, html, idx) {
  const t = String(html || "").replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "").replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}️‍\u{E0000}-\u{E007F}]/gu, "").replace(/[ \t]{2,}/g, " ");
  const B = t.split(/\n\s*\n/).map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean)).filter((b) => b.length);
  const rows = []; let period = "";
  for (const b of B) {
    const m = b[0].match(/^(.{3,40}?)\s*\(\s*([^)]{2,40})\s*\)$/);
    if (m) { const club = m[2].trim(); let crest = ""; try { crest = await findCrest(env, club, idx); } catch (e) {} rows.push({ name: m[1].trim(), club, crest, lines: b.slice(1, 4) }); }
    else if (!period) { const p = b.join(" ").match(/(\d{1,2}-[\p{L}']+\s*[—–-]\s*\d{1,2}-[\p{L}']+)/u); if (p) period = p[1]; }
  }
  return rows.length ? { period, rows: rows.slice(0, 6) } : null;
}
// TO'PURARLAR POYGASI posti matnidan jadval kartochkasi (2026-11-10, Bahtiyor aka tasdiqlagan dizayn): o'rin, ism, klub (gerbi bilan), gol, gol uzatmasi
async function scorersFromPost(env, html, idx) {
  const t = String(html || "").replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "").replace(/&amp;/g, "&").replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}️‍\u{E0000}-\u{E007F}]/gu, "").replace(/[ \t]{2,}/g, " ");
  const rows = [];
  for (const l of t.split("\n")) {
    const m = l.trim().match(/^\d{1,2}\.\s+(.{2,50}?)\s*\(\s*([^)]{2,40}?)\s*\)\s*[—–-]\s*(\d{1,3})\s+gol(?:\s*,\s*(\d{1,3})\s+ta\s+gol\s+uzatmasi)?/i);
    if (!m) continue;
    const club = m[2].trim(); let crest = ""; try { crest = (await logoUrl(env, club, idx || {})) || ESPN_CREST[club] || (await findCrest(env, club, idx)); } catch (e) {}
    rows.push({ name: m[1].trim(), club, crest: crest || "", g: +m[3], a: +(m[4] || 0) });
  }
  const dt = (t.match(/(\d{4}-yil\s+\d{1,2}-[\p{L}'‘’ʻ]+\s+holatiga)/u) || [])[1] || "";
  return rows.length >= 3 ? { date: dt, rows: rows.slice(0, 10) } : null;
}
// "Raqamlarda" posti matnidan kartochka plitkalari (C1 dizayni, 2026-11-08): ism, liga · mavsum · sana, raqamlar
function statFromPost(html, src) {
  const t = String(html || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const nm = (t.match(/Raqamlarda:\s*([^\n]+)/i) || [])[1]; if (!nm) return null;
  const hd = t.match(/^\s*([^\n,]+),\s*([^\n,]+),\s*([\d/]+)-mavsum\s*[—–-]\s*\d{4}-yil\s+([^\n]+?)\s+holatiga/m);
  const O = "(?:o['‘’ʻʼ`]|ö)", tiles = [];
  for (const raw of t.split("\n")) { const l = raw.replace(/^\s*[•·\-]\s*/, "").replace(/[⟦⟧]/g, "").trim(); if (!/^\s*[•·]/.test(raw)) continue; let m;
    if ((m = l.match(/^(\d+) gol(?:,\s*(\d+) ta gol uzatmasi)?/i))) { tiles.push([m[1], "gol"]); if (m[2] != null) tiles.push([m[2], "gol uzatmasi"]); }
    else if ((m = l.match(new RegExp("^(\\d+) " + O + "yin(?:,\\s*(\\d+) daqiqa)?", "i")))) tiles.push([m[1], "o'yin" + (m[2] ? " · " + m[2] + " daq." : "")]);
    else if ((m = l.match(/^har (\d+) daqiqada bitta gol/i))) tiles.push([m[1] + "'", "har golga"]);
    else if ((m = l.match(/^(\d+) ta zarba/i))) tiles.push([m[1], "zarba"]);
    else if ((m = l.match(/baho:\s*([\d.,]+)/i))) tiles.push([m[1].replace(".", ","), "o'rtacha baho"]); }
  if (tiles.length < 2) return null;
  return { name: newAlpha(nm.replace(/[⟦⟧]/g, "").trim()), sub: hd ? newAlpha(`⟦${hd[2].replace(/^[^\p{L}\p{N}]+/u, "").trim()}⟧ · ${hd[3]} · ${hd[4].trim()} holatiga`) : "", tiles: tiles.slice(0, 6).map(([v, l]) => [v, newAlpha(l)]), src: src || "FotMob, ESPN" };
}
async function statsPost(env, to, pick) {
  const used = await kvGet(env, "statUsed", {}); const now = Date.now();
  const order = pick ? STAT_PLAYERS.filter((p) => norm(p.n).includes(norm(pick))) : [...STAT_PLAYERS].sort((x, y) => (used[x.fm] || 0) - (used[y.fm] || 0));
  for (const p of order.slice(0, 4)) {
    const r = await statPlayer(env, p); if (r && r.fail) { if (pick) return "manbalar mos kelmadi: " + r.fail; continue; } if (!r || (!r.g && !r.a)) continue;
    const d = tashDate(now); const per = r.g && r.min ? Math.round(r.min / r.g) : 0;
    const L = [`• ${r.g} gol${r.a != null ? ", " + r.a + " ta gol uzatmasi" : ""}`];
    if (r.mp) L.push(`• ${r.mp} o'yin${r.min ? ", " + r.min + " daqiqa" : ""}`);
    if (per) L.push(`• har ${per} daqiqada bitta gol`);
    if (r.sh) L.push(`• ${r.sh} ta zarba`);
    if (r.rating) L.push(`• o'rtacha baho: ${String(r.rating).replace(".", ",")} (FotMob)`);
    const nm = p.uz ? "Eldor Shomurodov" : "⟦" + r.name + "⟧";
    const post = `<b>Raqamlarda: ${nm}</b>\n\n⟦${r.club}⟧, ${r.lg}, ${String(r.season || "").replace("/", "/")}-mavsum — ${d.slice(0, 4)}-yil ${uzDay(d).split(",")[0]} holatiga:\n${L.join("\n")}\n\n#Raqamlarda #${String(r.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]/gu, "")}`;
    await resultJob(env, post, to || null, { kind: "news" });
    if (!to) { used[p.fm] = now; await kvPut(env, "statUsed", used); }
    return "ok " + r.name + " (" + r.n + " manba: " + r.srcs + ")";
  }
  return "none";
}

// hisob orqali chiqarish ishlari javob bermay qolsa: qayta urinish, oxirida bot orqali
async function ujobSweep(env) {
  const ls = await env.STATE.list({ prefix: "ujob:" });
  for (const k of ls.keys) {
    const j = await kvGet(env, k.name, null);
    if (!j || !j.t || j.edit || j.check) continue; if (j.story && Date.now() - j.t > 12 * 60e3 && (j.tries || 0) >= 2) { await env.STATE.delete(k.name); const ad = (await getAdmins(env))[0]; if (ad) await tg(env, "sendMessage", { chat_id: ad, text: "⚠️ Telegram istoriyasi 3 marta urinib ham chiqmadi (GitHub javob bermadi)." }); continue; }
    const age = Date.now() - j.t;
    if (age > 12 * 60e3 && (j.tries || 0) < 2) { await kvPut(env, k.name, { ...j, tries: (j.tries || 0) + 1, t: Date.now() }, { expirationTtl: 86400 }); await ghDispatch(env, "ubpost.yml", { job: k.name.slice(5) }, true); continue; }
    if (age > 12 * 60e3) {
      await env.STATE.delete(k.name);
      const r = await publish(env, j.raw.text, j.raw.img, readMore(j.raw.url), j.raw.video);
      const admin = (await getAdmins(env))[0];
      if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Hisobingiz orqali 3 marta urinib ham chiqmadi. Post bot orqali, logotiplarsiz chiqarildi" + (r.ok ? "." : ": " + r.description) });
    }
  }
}

async function fillPending(env, deadline = Infinity, force = false) {
    const pending = await kvGet(env, "pending", null);
    if (!pending || !pending.msg || pending.awaitEdit || pending.item?.video) return "skip";
    const chatId = pending.chat || (await getAdmins(env))[0];
    const have = pending.article || (await kvGet(env, artKey(pending), null));
    if (have) { if (force) await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: pending.msg, reply_markup: keyboard(!!pending.img, have) }); return "has"; }
    const lk = "artlock:" + pending.msg;
    if (!force && (await kvGet(env, lk, null))) return "busy";
    await kvPut(env, lk, 1, { expirationTtl: 90 });
    try {
    const url = await makeArticle(env, pending, deadline);
    await kvPut(env, artKey(pending), url, { expirationTtl: 2 * 86400 });
    const cur = await kvGet(env, "pending", null);
    if (cur && cur.msg === pending.msg) await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: pending.msg, reply_markup: keyboard(!!(cur.img || pending.img), url) });
    return url;
    } catch (e) {
    try { await env.STATE.delete(lk); } catch (x) {}
    try { await kvPut(env, "artErr", { t: Date.now(), msg: pending.msg, e: String((e && (e.stack || e.message)) || e).slice(0, 600) }, { expirationTtl: 3 * 86400 }); } catch (x) {}
    throw e;
    }
    }

    async function fillArticles(env) {
    const admin = (await getAdmins(env))[0];
    const opJob = await kvGet(env, "opJob", null);
    if (opJob) { await env.STATE.delete("opJob"); await processVoice(env, opJob.chat, opJob); }
        const jobs = await kvGet(env, "artJobs", []);
    if (!jobs.length) return;
    const left = [];
let n = 0;
    for (const j of jobs) {
    if (Date.now() - j.t > 24 * 3600e3) continue;
    if (n++ >= 3) { left.push(j); continue; }    
    try {
    const url = await makeArticle(env, j);
    await tg(env, "editMessageReplyMarkup", { chat_id: env.CHANNEL, message_id: j.cmsg, reply_markup: readMore(url) });
    } catch (e) { left.push(j); }
    }
    await kvPut(env, "artJobs", left);
    }
    async function addArtJob(env, r, p) {
    if (!r?.ok) return;
    const jobs = await kvGet(env, "artJobs", []);
    jobs.push({ cmsg: r.result.message_id, item: p.item, post: p.post, img: (r.result.photo || []).slice(-1)[0]?.file_id || p.img, t: Date.now() });
    await kvPut(env, "artJobs", jobs.slice(-30));
    }

const OP_PROMPT = `Bu audio — o'zbek futbol kanali "Inter Futbol" uchun yozilgan shaxsiy fikr (ovozli xabar).
Vazifa:
1) Audioni so'zma-so'z matnga o'gir.
2) Shu matn asosida Telegram kanal uchun professional tahrirlangan post tayyorla:
- imlo va tinish belgilarini to'g'rila, "ee", "xullas", "endi" kabi parazit so'zlar va keraksiz takrorlarni olib tashla;
- mantiqiy paragraflarga ajrat;
- fikrning mazmuni, ohangi va birinchi shaxs uslubi saqlansin; o'zingdan fakt yoki fikr QO'SHMA;
- Davlat va terma jamoa nomlarini O'ZBEKCHA yoz (O'zbekiston terma jamoasi, Italiya, Saudiya Arabistoni) va ⟦ ⟧ ichiga olma; heshteglari ham o'zbekcha (#OzbekistonTermaJamoasi). Futbol klublari, futbolchilar va murabbiylar nomlarini ORIGINAL holida — rasmiy lotin yozuvidagidek yoz (masalan: Chelsea, Manchester United, Barcelona, Bayern München, Cristiano Ronaldo, Kylian Mbappé, Cole Palmer, Pep Guardiola). Ularni o'zbekchalashtirma, tarjima qilma, harflarini o'zgartirma; rus yoki boshqa yozuvdagi nomlarni rasmiy lotin shakliga o'tkaz. Har bir shunday nomni ⟦ ⟧ ichiga ol: ⟦Chelsea⟧, ⟦Cole Palmer⟧. Heshteglarda nomni qavssiz va bo'sh joysiz yoz: #Chelsea #ManchesterUnited.
- post o'zbek tilida, lotin yozuvida bo'lsin (gap ruscha aralash bo'lsa ham).
- Birinchi qatorga fikr mazmunini aks ettiruvchi 3–7 so'zli sarlavhani <b></b> ichida yoz, keyin bo'sh qator, keyin matn.
- Faqat <b> tegidan foydalan, boshqa belgilash ishlatma.
Javob formati qat'iy shunday bo'lsin:
===XOM===
(so'zma-so'z matn)
===POST===
(tahrirlangan post)`;

const REF_PART = (ref) => ref ? `

MUHIM: bu shaxsiy fikr quyidagi fikrga MUNOSABAT sifatida aytilgan:
Muallif: ${ref.author || "noma'lum"}
Uning fikri: ${ref.text}

Muallifning fikri postga alohida iqtibos (ramka) sifatida avtomatik qo'shiladi — uni postda QAYTA YOZMA va bayon qilma. Sen faqat sarlavha va shaxsiy munosabat matnini yoz; munosabat shu fikrga javob ekanini hisobga ol, muallif fikrini buzib ko'rsatma.` : "";

const OP_RE_PROMPT = (raw, v, ref) => `Quyidagi so'zma-so'z matn — "Inter Futbol" kanali uchun shaxsiy fikr. Undan Telegram kanal uchun professional tahrirlangan post tayyorla.
Qoidalar: imlo va tinish belgilarini to'g'rila, parazit so'zlar va takrorlarni olib tashla, paragraflarga ajrat, mazmun, ohang va birinchi shaxs uslubini saqla, o'zingdan hech narsa qo'shma. O'zbek tilida, lotin yozuvida. Birinchi qatorda 3–7 so'zli sarlavha <b></b> ichida, keyin bo'sh qator va matn. Faqat <b> tegidan foydalan. Bu ${v}-variant: oldingisidan boshqacharoq sarlavha va jumla tuzilishi bilan yoz. Faqat tayyor postni qaytar.

Matn:
${raw}${REF_PART(ref)}`;

function refQuote(ref) {
    const t = ref.text.length > 1500 ? ref.text.slice(0, 1500) + "…" : ref.text;
    const inner = `💬 <b>${esc(ref.author || "Muallif")}:</b>\n«${esc(t)}»`;
    return `<blockquote${ref.text.length > 400 ? " expandable" : ""}>${ref.link ? `<a href="${esc(ref.link)}">${inner}</a>` : inner}</blockquote>`;
    }
    function opWrap(body, ref) {
    let main = body;
    if (ref?.text && !body.includes("<blockquote")) {
    const nl = body.indexOf("\n");
    const first = nl > 0 ? body.slice(0, nl) : "";
    main = /^<b>/.test(first) ? first + "\n\n" + refQuote(ref) + "\n\n<b>🗣 Bizning fikrimiz:</b>\n" + body.slice(nl + 1).trim() : refQuote(ref) + "\n\n<b>🗣 Bizning fikrimiz:</b>\n" + body;
    }
    return `🎙 <b>SHAXSIY FIKR</b>\n\n${main}\n\n#ShaxsiyFikr`;
    }

async function newsFromLink(env, chat, url) {
  let title = "", desc = "", img = "";
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } });
    const html = (await r.text()).slice(0, 200000);
    title = decodeEntities(meta(html, ["og:title", "twitter:title"]) || (html.match(/<title[^>]*>([^<]{5,200})/i) || [])[1] || "").trim();
    desc = decodeEntities(meta(html, ["og:description", "description", "twitter:description"]) || "").slice(0, 600);
    img = unAmp(meta(html, ["og:image", "twitter:image"]) || "");
  } catch (e) {}
  if (!title) { await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Havoladagi sahifani o'qib bo'lmadi (sayt botni to'sgan bo'lishi mumkin). Yangilik matnini nusxalab yuboring yoki boshqa manba havolasini tashlang." }); return; }
  const st = (await kvGet(env, "st", null)) || { idx: 0, queue: [], seen: [], titles: [] }; st.queue = st.queue || [];
  if (st.queue.some((x) => x.link === url)) { await tg(env, "sendMessage", { chat_id: chat, text: "ℹ️ Bu havola allaqachon navbatda turibdi." }); return; }
  let host = ""; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch (e) {}
  st.queue.unshift({ title, desc, link: url, source: host, date: Date.now(), ...(img ? { img } : {}), manual: 1 });
  await kvPut(env, "st", st);
  await env.STATE.delete("ref:" + chat).catch(() => null); // shu havola avval "Fikr" bo'lib qabul qilingan bo'lsa — bekor
  await tg(env, "sendMessage", { chat_id: chat, text: "📰 Yangilik qabul qilindi:\n«" + title.slice(0, 200) + "»\n\nTahlil qilinib, tekshiruvdan o'tgach 10 daqiqa ichida kanalga chiqadi. Chiqmasa — sababini shu yerga yozaman.", disable_web_page_preview: true });
}
async function refFromLink(url) {
const tme = url.match(/^https?:\/\/t\.me\/(?:s\/)?([A-Za-z0-9_]+)\/(\d+)/);
const r = await fetch(tme ? `https://t.me/${tme[1]}/${tme[2]}?embed=1&mode=tme` : url, { headers: { "user-agent": "Mozilla/5.0" } });
const html = (await r.text()).slice(0, 300000);
if (tme) {
const t = html.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
const a = html.match(/class="tgme_widget_message_owner_name"[^>]*>(?:<span[^>]*>)?([\s\S]*?)<\/span>/);
return { author: a ? decodeEntities(a[1]) : tme[1], text: t ? decodeEntities(t[1].replace(/<br\s*\/?>/g, "\n")).slice(0, 3000) : "", link: url };
}
const title = meta(html, ["og:title"]) || "";
const site = meta(html, ["og:site_name"]) || new URL(url).hostname;
return { author: site, text: (decodeEntities(title) + "\n" + articleText(html)).slice(0, 3000), link: url };
}
function refFromForward(msg) {
const o = msg.forward_origin;
let author = "", link = "";
if (o?.type === "channel") { author = o.chat?.title || ""; if (o.chat?.username) link = `https://t.me/${o.chat.username}/${o.message_id}`; }
else if (o?.type === "user") author = [o.sender_user?.first_name, o.sender_user?.last_name].filter(Boolean).join(" ");
else if (o?.type === "hidden_user") author = o.sender_user_name || "";
else if (o?.type === "chat") author = o.sender_chat?.title || "";
else if (msg.forward_from_chat) { author = msg.forward_from_chat.title || ""; if (msg.forward_from_chat.username && msg.forward_from_message_id) link = `https://t.me/${msg.forward_from_chat.username}/${msg.forward_from_message_id}`; }
else if (msg.forward_from) author = [msg.forward_from.first_name, msg.forward_from.last_name].filter(Boolean).join(" ");
return { author, text: (msg.text || msg.caption || "").slice(0, 3000), link };
}
const opKeyboard = () => ({
inline_keyboard: [
[{ text: "✅ Chop etish", callback_data: "opub" }, { text: "🔄 Qayta yozish", callback_data: "ore" }],
[{ text: "✏️ Tahrirlash", callback_data: "oedit" }, { text: "❌ Bekor qilish", callback_data: "oskip" }],
],
});

function toBase64(buf) {
const bytes = new Uint8Array(buf);
let bin = "";
for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
return btoa(bin);
}

async function processVoice(env, chat, job, deadline = Infinity) {
try {
let raw;
if (job.text) {
raw = await callGemini(env, [
{ text: OP_PROMPT + REF_PART(job.ref) + "\n\nDIQQAT: bu safar audio emas, quyida YOZMA matn berilgan. Uni so'zma-so'z matn deb hisobla (===XOM=== qismiga o'zini qo'y) va shu asosda post tayyorla:\n\n" + job.text },
], 0.3, deadline, 8192, false);
} else {
const f = await tg(env, "getFile", { file_id: job.file_id });
if (!f.ok) throw new Error("Faylni olib bo'lmadi: " + f.description);
const audio = await (await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${f.result.file_path}`)).arrayBuffer();
raw = await callGemini(env, [
{ text: OP_PROMPT + REF_PART(job.ref) },
{ inline_data: { mime_type: job.mime || "audio/ogg", data: toBase64(audio) } },
], 0.3, deadline, 8192, false);
}
const parts = raw.split(/===POST===/);
const transcript = (parts[0] || "").replace(/===XOM===/, "").trim();
const body = cleanHtml((parts[1] || raw).trim(), 3300);
await sendOpinion(env, chat, transcript, body, 0, job.ref);
if (job.ref) await env.STATE.delete("ref:" + chat);
} catch (e) {
if (e.busy && deadline !== Infinity) {
await kvPut(env, "opJob", { ...job, chat });
await tg(env, "sendMessage", { chat_id: chat, text: "⏳ Ovozli xabar uzunroq ekan yoki server band. Bot uni 10 daqiqa ichida o'zi tayyorlab yuboradi." });
} else {
await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Ovozli xabarni matnga o'girib bo'lmadi: " + String(e.message || e).slice(0, 200) });
}
}
}

async function sendOpinion(env, chat, transcript, body, variant, ref) {
if (transcript) await tg(env, "sendMessage", { chat_id: chat, text: "📝 Xom matn (solishtirish uchun):\n\n" + transcript.slice(0, 3800) });
const head = `🎙 Shaxsiy fikr — ${variant ? variant + 1 + "-variant" : "qoralama"}\n━━━━━━━━━━━━\n`;
const old = await kvGet(env, "op:" + chat, null);
if (!ref && variant) ref = old?.ref;
const m = await tg(env, "sendMessage", { chat_id: chat, text: head + opWrap(body, ref), parse_mode: "HTML", disable_web_page_preview: true, reply_markup: opKeyboard() });
if (!m.ok) { await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Post formatida xato: " + m.description }); return; }
await kvPut(env, "op:" + chat, { transcript: transcript || old?.transcript || "", body, ref: ref || null, msg: m.result.message_id, variant }, { expirationTtl: 7 * 86400 });
}

const noEmoji = (t) => String(t || "").split(/(<[^>]*>|#[\p{L}\p{N}_]+)/u).map((p, i) => (i % 2 ? p : p.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\u20E3]/gu, ""))).join("").replace(/[ \t]{2,}/g, " ").replace(/[ \t]+(\n|$)/g, "$1").replace(/(^|\n)[ \t]+/g, "$1");
const noLabel = (t) => String(t || "").replace(/^[\s\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]+(?=<b>|⟦)/u, "").replace(/^([^\p{L}\n]*<b>)\s*[\p{Lu}'‘’ʻʼ`]{3,}(?:\s+[\p{Lu}'‘’ʻʼ`]{2,})?\s*[|:—–]\s*/u, "$1");
// ---------------- KANAL NAZORATCHISI: har bir post chiqishidan oldin tekshiriladi (Bahtiyor aka talabi, 2026-11-08) ----------------
// Jiddiy xato (undefined/NaN, buzilgan HTML, kirill yoki inglizcha qolgan matn, bo'sh post) — post to'xtatiladi, adminga tugmalar bilan yuboriladi.
// Kichik kamchilik (logotipsiz klub, turisiz natija, nom/heshteg qoidalari) — post chiqadi, adminga ogohlantirish; Claude 4 soatlik nazoratda tuzatadi.
const QC_STOP = /^(united|city|union|athletic|sporting|real|inter|rovers|town|wanderers|albion|county|club|national|nacional|olympic|dynamo|dinamo|spartak|lokomotiv|racing|universidad|independiente|deportivo|atletico|america|santos|rangers|celtic|young boys|basel|forest|palace|villa|hotspur|ham|wolves|nice|lens|metz|brest|angers|lorient|paris|roma|como|genoa|parma|lecce|pisa|elche|getafe|girona|levante|mallorca|oviedo|alaves)$/i;
const QC_SLUGS = ["eng.1", "eng.2", "esp.1", "esp.2", "ita.1", "ger.1", "ger.2", "fra.1", "por.1", "ned.1", "tur.1", "bel.1", "sui.1", "rus.1", "ksa.1", "usa.1", "sco.1", "uefa.champions", "uefa.europa", "uefa.europa.conf"];
const qcNorm = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").toLowerCase();
let QC_ALIAS = null;
async function qcTeams(env) {
  const c = (await kvGet(env, "qcTeams", null)) || { t: {}, n: {} };
  const old = QC_SLUGS.filter((sl) => !c.t[sl] || Date.now() - c.t[sl] > 7 * 86400e3).slice(0, 3); // bir chaqiriqda ko'pi bilan 3 ta liga yangilanadi
  if (old.length) {
    await Promise.all(old.map(async (sl) => { try { const j = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${sl}/teams`, { cf: { cacheTtl: 86400 } })).json(); const L = new Set(); for (const t of j.sports?.[0]?.leagues?.[0]?.teams || []) for (const x of [t.team?.displayName, t.team?.shortDisplayName, ESPN_NAME[t.team?.displayName]]) if (x && x.length >= 4 && !QC_STOP.test(x) && !NOT_OURS.test(x)) L.add(x); if (L.size) { c.n[sl] = [...L]; c.t[sl] = Date.now(); } else c.t[sl] = Date.now() - 6 * 86400e3; } catch (e) { c.t[sl] = Date.now() - 6 * 86400e3; } }));
    await kvPut(env, "qcTeams", c);
  }
  return [...new Set(Object.values(c.n).flat())];
}
async function qcCheck(env, text, media) {
  const raw = String(text || ""), fatal = [], warn = [];
  const plain = unHtml1(raw.replace(/<[^>]+>/g, " ")).replace(/https?:\/\/\S+/g, " ");
  const own = plain.replace(/⟦[^⟧]*⟧/g, " ").replace(/#[\p{L}\p{N}_]+/gu, " ");
  if (/\b(undefined|NaN)\b|\[object Object\]|\$\{|\{\{|\bnull\b/.test(plain)) fatal.push("matnda dastur qoldig'i bor (undefined/NaN/null)");
  if (!media && (plain.match(/\p{L}/gu) || []).length < 15) fatal.push("post deyarli bo'sh");
  for (const t of ["b", "i", "a", "u", "s", "code", "blockquote"]) { const o = (raw.match(new RegExp("<" + t + "(\\s[^>]*)?>", "g")) || []).length, cl = (raw.match(new RegExp("</" + t + ">", "g")) || []).length; if (o !== cl) fatal.push("HTML teg buzilgan (<" + t + ">)"); }
  const lt = (own.match(/\p{L}/gu) || []).length, cy = (own.match(/[\u0400-\u04FF]/g) || []).length;
  if (lt > 40 && cy / lt > 0.15) fatal.push("matnda kirill (ruscha) qismi qolgan");
  else { const cw = own.match(/[\p{L}]*[\u0400-\u04FF][\p{L}]*/gu) || []; const cwl = cw.filter((w) => w.length >= 3 && !((w.match(/[A-Za-zÀ-ɏ]/g) || []).length >= (w.match(/[\u0400-\u04FF]/g) || []).length)); if (cwl.length && !/[ўқғҳЎҚҒҲ]/.test(own)) fatal.push("matnda kirill harfli so'z qolgan: " + cwl.slice(0, 3).join(", ")); } // 2026-11-19: o'zbekcha kirill so'zlar (ў/қ/ғ/ҳ bor — "чуқурлаштирилган, тиббий" Fayzullayev posti to'xtagan edi) post to'xtatmaydi — pastda cyrFix bilan yangi alifboga o'giriladi // 2026-11-13: lotin harflari ko'p aralash so'z ("o'ртоqlik" — 10:21 da to'xtatilgan Shomurodov posti) to'xtatilmaydi, cyrFix bilan lotinga o'giriladi; 2026-11-12: 226-postda bitta "Mюнхенликлар" so'zi 15% chegaradan o'tib ketgan edi
  const en = (own.match(/\b(the|and|with|has|have|been|will|from|after|their|this|that|was|were|for)\b/gi) || []).length;
  if (en >= 5) fatal.push("matnda tarjima qilinmagan inglizcha qism bor");
  if (BOOKIE_RE.test(plain)) fatal.push("matnda bukmeker nomi bor (bukmeker reklamasi kanalda taqiqlangan)");
  if (/(?:Moskva|Ispaniya|Angliya|London|Madrid|Yevropa|Markaziy Yevropa) vaqti bilan/i.test(plain) && !/To[sş]h?kent vaqti/i.test(plain)) warn.push("vaqt Toshkent vaqtida berilmagan");
  if (/\*\*|__/.test(own)) warn.push("markdown belgilari (** yoki __) qolgan");
  // sana tekshiruvi: kun-oy-yil 300 kundan uzoq kelajakda bo'lsa (shartnoma "…gacha"/"…qadar" bundan mustasno) — yil xato bo'lishi mumkin
  { const MON = { yanvar: 0, fevral: 1, mart: 2, aprel: 3, may: 4, iyun: 5, iyul: 6, avgust: 7, sentabr: 8, sentyabr: 8, oktabr: 9, noyabr: 10, dekabr: 11 };
    for (const mm of plain.matchAll(/(\d{4})-yil(?:ning)?\s+(\d{1,2})(?:[–-]\d{1,2})?-(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|sentyabr|oktabr|noyabr|dekabr)(\S*)/gi)) {
      if (/gacha|qadar/i.test(mm[4] + " " + plain.slice(mm.index + mm[0].length, mm.index + mm[0].length + 30).split(/[.!?\n]/)[0])) continue; /* 2026-11-19: "2032-yil 30-iyun kuniga qadar" (Tchouaméni shartnomasi) — "qadar" ham shartnoma muddati, post bekorga to'xtagan edi */ const t = Date.UTC(+mm[1], MON[mm[3].toLowerCase()], +mm[2]); if (t - Date.now() > 300 * 86400e3) fatal.push("sana juda uzoq kelajakda: " + mm[0].replace(/\S*$/, "") + " — yil xato bo'lishi mumkin"); } }
  // FUTBOLCHI VA LIGA MOSLIGI (2026-11-11: "Eldor Shomurodov Italiya chempionatida gol urdi" chiqib ketgan — u İstanbul Başakşehir'da, Süper Lig'da o'ynaydi):
  // gapda bizning futbolchi, o'yin/gol so'zi va uning klubi ligasi bo'lmagan boshqa liga bo'lsa (o'tmish haqida bo'lmasa) — post to'xtatiladi.
  try {
    const LGS = [["Serie A", /Serie A\b|Italiya [cç]h?empionat/i], ["Premier League", /Premier League|Angliya [cç]h?empionat|Prem[ye]+r-?liga/i], ["LaLiga", /La ?Liga|Ispaniya [cç]h?empionat/i], ["Bundesliga", /Bundesliga|Germaniya [cç]h?empionat/i], ["Ligue 1", /Ligue 1|Fransiya [cç]h?empionat/i], ["Süper Lig", /S[uü]per Lig|Turkiya [cç]h?empionat/i], ["Saudiya Pro ligasi", /Saudi(?:ya)? Pro|Saudiya Arabistoni [cç]h?empionat|Roshn/i], ["MLS", /\bMLS\b/]];
    const OWN = [["Başakşehir", "Süper Lig"], ["Rizespor", "Süper Lig"], ["Manchester City", "Premier League"], ["Al-Nassr", "Saudiya Pro ligasi"], ["Inter Miami", "MLS"]];
    for (const fp of FOCUS_PLAYERS) {
      const own1 = (OWN.find(([cn]) => fp.club.test(cn)) || [])[1] || null;
      const nm = fp.n.replace(/[⟦⟧]/g, ""), fam = nm.split(" ").pop();
      for (const sen of plain.replace(/[⟦⟧]/g, "").split(/(?<=[.!?])\s+|\n+/)) {
        if (!sen.includes(fam) && !fp.k.some((k) => sen.toLowerCase().includes(k))) continue;
        if (!/gol|o['ʻ‘’]?yin|öyin|maydon|uçrashuv|uchrashuv|darvoza|tarkib/i.test(sen) || /avval|ilgari|sobiq|o['ʻ‘’]?ynagan|öynagan|urgan|kiritgan|davrida|tarixida|rekord|faoliyat|\d{4}[–-]\d{2,4}|ijara/i.test(sen)) continue;
        for (const [ln, re] of LGS) if (re.test(sen) && ln !== own1) fatal.push(nm + " " + (own1 ? own1 + "da" : "boshqa ligada") + " o'ynaydi, matnda esa " + ln + " — fakt xato bo'lishi mumkin");
      }
    }
  } catch (e) {}
  if (/#Natija\b/.test(raw) && !/\d+-tur|[oö]['ʻ‘’]?rtoqlik|final|guruh|pley-?off|saralash|1\/\d+|bosqich|raund/i.test(plain)) warn.push("natija postida tur ko'rsatilmagan");
  for (const [re, why] of AUDIT_RULES) if (re.test(plain.replace(/⟦[^⟧]*⟧/g, (m) => m.replace(/ı/g, "i")))) warn.push(why);
  // logotipsiz klub: ESPN ro'yxatidagi klub matnda bor, lekin logotip to'plamida (CLUB_EMOJI) yo'q
  try {
    if (!QC_ALIAS) QC_ALIAS = CLUB_EMOJI.flatMap(([, , ns]) => ns.map(qcNorm));
    const nt = " " + qcNorm(plain).replace(/[^\p{L}\p{N}'.&/-]+/gu, " ") + " ";
    const miss = new Set();
    for (const n of await qcTeams(env)) { const k = qcNorm(n); if (k.length < 4) continue; let at = nt.indexOf(" " + k), hit = false; while (at >= 0 && !hit) { hit = /^(?:'?(?:ning|ni|ga|ka|qa|dagi|dan|da|tan|ta|lik|chilar|chi|lar))? /.test(nt.slice(at + 1 + k.length)); at = nt.indexOf(" " + k, at + 1); } if (!hit) continue; if (!/\s/.test(n.trim())) { const pl0 = plain.replace(/#[\p{L}\p{N}_]+/gu, " "); const occ = [...pl0.matchAll(new RegExp("(^|[^\\p{L}])" + n.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=(?:'?(?:ning|ni|ga|ka|qa|dagi|dan|da|tan|ta|lik|chilar|chi|lar))?(?![\\p{L}]))", "giu"))]; if (occ.length && occ.every((m) => /⟦\p{Lu}[\p{Ll}'’-]+⟧\s+$/u.test(pl0.slice(Math.max(0, m.index - 40), m.index + m[1].length)))) continue; } /* 2026-11-16: "Charlie Austin" — futbolchi familiyasi klub (Austin FC) deb olinmasin, LOGO ROBOTI navbatiga tushmasin */ if (QC_ALIAS.some((a) => a === k || (a.length > k.length && a.includes(k) && nt.includes(" " + a)) || (a.length >= 5 && k.includes(a) && nt.includes(" " + a)))) continue; miss.add(n); }
    if (miss.size) warn.push("logotipsiz klub: " + [...miss].slice(0, 6).join(", "));
    // 2026-11-12: logotipsiz klub LOGO ROBOTI navbatiga ham tushadi (04:00 da emojiadd.yml to'plamga qo'shadi) — postda 1 ta, so'rovlarni tejash uchun
    const mlist = [...miss].filter((n) => ![...miss].some((o) => o !== n && o.length > n.length && qcNorm(o).includes(qcNorm(n))));
    if (mlist.length) { const q0 = await kvGet(env, "emojiNeed", []); const nm = mlist.find((n) => !q0.some((x) => norm(x.n) === norm(n))); if (nm) { const lg = await findCrest(env, nm, {}).catch(() => ""); if (lg) await emojiNeed(env, nm, lg); } }
  } catch (e) {}
  // 2026-11-11: "Mюнхенликлар" (lotin+kirill aralash so'z) chiqib ketdi — kirill 15% dan kam bo'lsa to'xtatilmas edi.
  // Endi o'z matndagi (⟦ ⟧, heshteg, teg, havoladan tashqari) har qanday kirill harf yangi alifboga o'giriladi va adminga ogohlantirish.
  let fixed = canonFix(raw);
  if (cy && !fatal.some((f) => /kirill/.test(f))) { const c = cyrFix(fixed); if (c !== fixed) { fixed = c; warn.push("kirill harflar lotinga o'girildi — matnni ko'zdan kechiring"); } }
  return { text: fixed, fatal: [...new Set(fatal)], warn: [...new Set(warn)] };
}
const CYR_MAP = { а: "a", б: "b", в: "v", г: "g", д: "d", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ç", ш: "ş", щ: "şç", ъ: "'", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ё: "yo", ў: "ö", қ: "q", ғ: "ğ", ҳ: "h", і: "i", ї: "yi", є: "ye", ґ: "g" };
const cyrWord = (w) => w.replace(/[\u0400-\u04FF]/g, (ch, i) => { const lo = ch.toLowerCase(); let v = lo === "е" ? (i === 0 || /[aeiouаеёиоуэюяў'ʼ]/i.test(w[i - 1] || "") ? "ye" : "e") : (CYR_MAP[lo] ?? ""); if (ch !== lo && v) v = v[0].toUpperCase() + v.slice(1); return v; });
const cyrFix = (t) => String(t || "").split(/(<[^>]*>|⟦[^⟧]*⟧|#[\p{L}\p{N}_]+|https?:\/\/\S+)/u).map((p, i) => (i % 2 ? p : p.replace(/[\p{L}'ʼ]*[\u0400-\u04FF][\p{L}'ʼ]*/gu, cyrWord))).join("");
// null — post chiqaversin (matn tuzatilgan bo'lishi mumkin: r.text); obyekt — post to'xtatildi
async function qcGate(env, text, img, url, video) {
  let r; try { r = await qcCheck(env, text, !!(img || video)); } catch (e) { return { text }; }
  const admin = (await getAdmins(env))[0];
  const head = String(text).replace(/<[^>]+>|[⟦⟧]/g, "").split("\n").find((l) => l.trim()) || "";
  if (r.warn.length && admin) {
    const seen = await kvGet(env, "qcSeen", []); const sig = (head.slice(0, 60) + "|" + r.warn.join(";")).slice(0, 200);
    if (!seen.includes(sig)) { seen.push(sig); await kvPut(env, "qcSeen", seen.slice(-80), { expirationTtl: 3 * 86400 }); await tg(env, "sendMessage", { chat_id: admin, text: "🔎 Nazorat: post chiqdi, lekin kamchilik bor — «" + head.slice(0, 90) + "»\n• " + r.warn.join("\n• ") + "\n\nClaude navbatdagi tekshiruvda tuzatadi.", disable_web_page_preview: true }); }
  }
  if (!r.fatal.length) return { text: r.text };
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  if (img instanceof Blob) { await env.STATE.put("lgb:qc_" + id, await img.arrayBuffer(), { expirationTtl: 3 * 86400 }); img = WURL + "/lg/qc_" + id; }
  await kvPut(env, "qch:" + id, { text: r.text, img: typeof img === "string" ? img : null, url: url || null, video: video || null }, { expirationTtl: 3 * 86400 });
  const L = await kvGet(env, "qcHeld", []); L.push({ t: Date.now(), h: head.slice(0, 90), why: r.fatal }); await kvPut(env, "qcHeld", L.slice(-30), { expirationTtl: 14 * 86400 });
  if (admin) await tg(env, "sendMessage", { chat_id: admin, text: ("🛑 Post to'xtatildi (nazorat): «" + head.slice(0, 90) + "»\n• " + r.fatal.join("\n• ") + (r.warn.length ? "\n• " + r.warn.join("\n• ") : "") + "\n\n" + String(r.text).replace(/<[^>]+>/g, "")).slice(0, 3900), disable_web_page_preview: true, reply_markup: { inline_keyboard: [[{ text: "✅ Baribir chiqarish", callback_data: "qcpub:" + id }, { text: "🗑 Bekor qilish", callback_data: "qcskip:" + id }]] } });
  return { held: { ok: true, queued: true, held: true } };
}
async function publish(env, text, img, markup, video, noQc) {
if (!noQc) { const g = await qcGate(env, text, img, null, video); if (g.held) return g.held; text = g.text; }
await dayLog(env, text, img, true);
text = noLabel(text);
return video ? sendVideo(env, env.CHANNEL, text, video, markup) : sendRich(env, env.CHANNEL, text, img, markup);
}

// ---------------- admin hisobi orqali chiqarish (klub logotiplari bilan; GitHub Actions + Telethon) ----------------
const WURL = "https://inter-futbol-bot.gcw808.workers.dev";
const ubKey = async (env) => (await sha("ub-" + env.BOT_TOKEN)).slice(0, 40);
// 2026-11-08: kartochka (card.yml) va hisob orqali post (ubpost.yml) ishlari AVVAL Modal'da bajariladi — GitHub bepul
// daqiqalari (oyiga 2000) tejaladi; Modal javob bermasa yoki viaGh=true (qayta urinish) bo'lsa — GitHub (zaxira).
// KV jobsMode = "gh" qilinsa hamma ish yana GitHub'da.
async function ghDispatch(env, wf, inputs, viaGh) {
  if (!viaGh && (wf === "card.yml" || wf === "ubpost.yml") && inputs && inputs.job && (await kvGet(env, "jobsMode", "gh")) !== "gh"  /* 2026-11-19: ombor ochiq — GitHub daqiqalari cheksiz va bepul, endi asosiy; Modal faqat jobsMode="modal" qilinsa */) {
    const ju = await kvGet(env, "jobsUrl", "https://gcw808-svg--inter-jobs-dispatch.modal.run");
    if (ju) {
      try { const r = await fetch(ju, { method: "POST", headers: { "x-key": await ubKey(env), "content-type": "application/json" }, body: JSON.stringify({ wf, job: inputs.job }), signal: AbortSignal.timeout(25000) }); if (r.ok) return true; } catch (e) {}
      try { const f = await kvGet(env, "jobsFail", { n: 0 }); await kvPut(env, "jobsFail", { n: (f.n || 0) + 1, t: Date.now(), wf }, { expirationTtl: 3 * 86400 }); } catch (e) {}
    }
  }
  if (!env.GH_TOKEN) return false;
  const r = await fetch(`https://api.github.com/repos/${env.GH_REPO || "gcw808-svg/interfutbol-video"}/actions/workflows/${wf}/dispatches`, { method: "POST", headers: { authorization: "Bearer " + env.GH_TOKEN, accept: "application/vnd.github+json", "user-agent": "InterFutbolBot", "content-type": "application/json" }, body: JSON.stringify({ ref: "main", inputs }) });
  return r.ok;  // GitHub endi 204 o'rniga 200 (ish raqami bilan) qaytarishi mumkin — faqat 204 ni kutish ishni 3 marta ishga tushirib yuborgan edi (2026-11-19)
}
// null qaytsa — oddiy (bot) usulida chiqariladi
async function userPublish(env, text, img, url, video, chat, noQc) {
  if (!(await kvGet(env, "usess", null))) return null;
  if (!noQc) { const g = await qcGate(env, text, img, url, video); if (g.held) return g.held; text = g.text; }
  await dayLog(env, text, img, false);
  if (img instanceof Blob) { const bk = "ub_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await env.STATE.put("lgb:" + bk, await img.arrayBuffer(), { expirationTtl: 86400 }); img = WURL + "/lg/" + bk; }
  if (img && typeof img !== "string") return null;
  const pxk = (await sha("px-" + env.BOT_TOKEN)).slice(0, 16);
  const photo = !img ? null : /^https?:/.test(img) ? (img.startsWith(WURL) ? img : WURL + "/px?k=" + pxk + "&u=" + encodeURIComponent(img)) : WURL + "/ph/" + encodeURIComponent(img);
  if (img && !photo) return null;
  let html = noLabel(text);
  if (video) html += `\n\n▶️ <a href="${esc(video)}">Videoni ko'rish</a>`;
    const html2 = newAlpha(addLogos(html + (url ? `\n\n<a href="${esc(url)}">Batafsil o'qish →</a>` : "")));
  html = newAlpha(addLogos(html));
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await kvPut(env, "ujob:" + id, { html, html2, photo, video, chat, raw: { text, img, url, video }, t: Date.now(), tries: 0 }, { expirationTtl: 86400 });
  return (await ghDispatch(env, "ubpost.yml", { job: id })) ? { ok: true, queued: true } : null;
}
// rasm topilmasa — mavzuga mos "Inter Futbol" kartochkasi (GitHub Actions'da chiziladi)
// O'ZBEKISTON TERMA JAMOASI haqidagi post — yangilik kartochkasi chapida UFA gerbi (Bahtiyor aka tasdiqlagan, 2026-11-08: "U1 ufa fon", gerb kattalashtirilgan)
const NAT_RE = /(O['ʻ‘’`]?zbekiston|Özbekiston|Uzbekistan)(\s+milliy)?(\s+futbol)?\s+terma\s+jamoa|#O[z]bekistonTermaJamoasi|Uzbekistan national (football )?team|\bUFA\b|O['ʻ‘’`]?zbekiston Futbol Assotsiatsiyasi|Özbekiston Futbol Assotsiatsiyasi/i;
async function ufaCrest(env) {
  // gerb bir marta Vikipediyadan olinib KV'da saqlanadi (lgb:ufa), keyin WURL/lg/ufa orqali beriladi
  if (!(await env.STATE.get("lgb:ufa", { type: "arrayBuffer" }))) {
    try { const r = await fetch("https://thumb.wikimedia.org/wikipedia/en/thumb/3/3d/Uzbekistan_Football_Association.svg/960px-Uzbekistan_Football_Association.svg.png", { headers: { "user-agent": "InterFutbolBot/1.1 (https://t.me/Inter_Futbol_TV)" } }); if (!r.ok) return ""; await env.STATE.put("lgb:ufa", await r.arrayBuffer()); } catch (e) { return ""; }
  }
  return WURL + "/lg/ufa";
}
// FotMob qidiruvi (2026-11-09): logo bazada topilmasa — klub nomi bo'yicha; sarlavhada klub bo'lmasa — odamning hozirgi klubi
const FM_LOGO = (id) => "https://images.fotmob.com/image_resources/logo/teamlogo/" + id + ".png";
async function fmSuggest(term) { try { const j = await (await fetch("https://www.fotmob.com/api/data/search/suggest?lang=en&term=" + encodeURIComponent(term), { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } })).json(); return (Array.isArray(j) ? j : []).flatMap((g) => g.suggestions || []); } catch (e) { return []; } }
async function fmTeamLogo(name) { const ok = (x) => pnorm(x).replace(/\b(fc|cf|sc|ac|club)\b/g, "").trim(); const s = (await fmSuggest(name)).find((x) => x.type === "team" && (ok(x.name) === ok(name) || ok(x.name).includes(ok(name)) || ok(name).includes(ok(x.name)))); return s ? FM_LOGO(s.id) : ""; }
async function personCrest(post) {
  // sarlavhadagi ismlar ketma-ketligi ("Zinedine Zidane Kylian Mbappé ...") — juft-juft so'rab, klubi bor birinchi odam
  const t = String(post || "").replace(/<[^>]+>|[⟦⟧]/g, "").split("\n").find((l) => l.trim()) || "";
  const W = []; for (const m of t.matchAll(/[\p{Lu}][\p{L}'’.-]+/gu)) W.push({ w: m[0].replace(/(ning|niki|ga|ni|dan|da|lar)$/u, ""), i: m.index });
  const runs = []; let cur = []; for (const x of W) { if (cur.length && x.i - (cur[cur.length - 1].i + cur[cur.length - 1].w.length) > 6) { runs.push(cur); cur = []; } cur.push(x); } if (cur.length) runs.push(cur);
  let q = 0;
  for (const r of runs) for (let k = 0; k + 1 < r.length && q < 4; k += 2) {
    const nm = r[k].w + " " + r[k + 1].w; q++;
    const s = (await fmSuggest(nm)).find((x) => x.type === "player" && x.teamId && pnorm(x.name).includes(pnorm(r[k + 1].w)));
    if (s) return FM_LOGO(s.teamId);
  }
  return "";
}
// matnda eng birinchi tilga olingan (O'zbekistondan boshqa) terma jamoa gerbi — federatsiya gerbi Vikipediyadan
// TERMA JAMOA NATIJASI KARTOCHKASI (2026-11-17, Rossiya|Özbekiston kartasida gerb o'rniga bosh harfli belgi chiqqan edi): jamoa nomi davlat nomi bo'lsa — federatsiya gerbi
async function natTeamLogo(env, n) {
  const k = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  const q = k(String(n || "").replace(/\s+(?:milliy\s+)?(?:futbol\s+)?terma\s+jamoasi$/i, ""));
  if (!q) return "";
  for (const [cc, names] of COUNTRY_FLAGS) {
    if (cc.length !== 2) continue;
    if (!names.split("|").some((x) => k(x) === q || k(newAlpha(x)) === q)) continue;
    try { return cc === "UZ" ? await ufaCrest(env) : await wikiCrest(EN_COUNTRY(cc) + " national football team"); } catch (e) { return ""; }
  }
  return "";
}
async function natCrest(plain) {
  let best = null;
  for (const [cc, names] of COUNTRY_FLAGS) {
    if (cc.length !== 2 || cc === "UZ") continue;
    const re = new RegExp("(" + [...new Set(names.split("|").flatMap((n) => [n, newAlpha(n)]))].map((x) => x.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&").replace(/'/g, "['‘’ʻʼ`]?")).join("|") + ")\\s+(?:milliy\\s+)?(?:futbol\\s+)?terma\\s+jamoa", "iu");
    const m = re.exec(plain); if (m && (!best || m.index < best.i)) best = { i: m.index, cc };
  }
  return best ? await wikiCrest(EN_COUNTRY(best.cc) + " national football team") : "";
}
const leftCrest = async (env, post, ci, idx) => {
  const plain = String(post || "").replace(/<[^>]+>/g, "");
  if (NAT_RE.test(plain) || /#Legionerlar\b|(O['‘’ʻ]|Ö)zbek legionerlari/i.test(plain)) return await ufaCrest(env); // legionerlar ham — o'zbek futboli
  // BOSHQA TERMA JAMOA (2026-11-10, 207-post: Meksika futbolchisi kartasida UEFA Millatlar ligasi logotipi chiqqan edi): sarlavhada klub ham,
  // liga ham bo'lmasa va matnda "X terma jamoasi" bo'lsa — chapda o'sha terma jamoa gerbi (qaysi jamoa haqida gap ketsa — o'shaniki)
  if (!(ci && ci.subj && ci.subj.t === "club")) {
    const tl = plain.split("\n").find((l) => l.trim()) || "";
    if (!/\blig|league|kubog|[cç]empionat|chempionat|\bcup\b/i.test(tl)) { const nc = await natCrest(plain).catch(() => ""); if (nc) return nc; }
  }
  if (ci && ci.subj && ci.subj.t === "club") { const n = ci.subj.n; return (await logoUrl(env, n, idx || {})) || ESPN_CREST[n] || ESPN_CREST[Object.keys(ESPN_CREST).find((k) => norm(k) === norm(n))] || (await findCrest(env, n, idx)); }
  if (ci && ci.subj) return ""; // mavzu liga bo'lsa — chapda liga logotipi (avvalgidek)
  return await personCrest(post); // mavzu topilmadi — sarlavhadagi odamning klubi
};
function cardInfo(post, extra = {}) {
  const plain = String(post || "").replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "");
  const title = plain.split("\n").find((l) => l.trim()) || "";
  const rx = (n) => new RegExp("(^|[^\\p{L}])" + n.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") + "(?![\\p{Lu}])", "u");
  const LEAGUES = new Set(CLUB_EMOJI.slice(0, 8).map((c) => c[0]));
  const found = [];
  const NA2 = (ns) => [...new Set([...ns, ...ns.map((x) => newAlpha(x))])]; // kanal matni yangi alifboda ("Çempionlar ligasi") — ikkala shakl ham tekshiriladi
  for (const [id, em, names] of CLUB_EMOJI) for (const n of NA2(names)) {
    const mm = title.match(rx(n));
    if (mm) { const i = mm.index + mm[1].length; found.push({ i, len: n.length, n: names[0], lg: LEAGUES.has(id) }); break; }
  }
  const have = new Set(found.map((f) => f.n.toLowerCase()));
  const ex = Object.entries(extra).flatMap(([c, v]) => [c, ...(v.a || [])].map((a) => [a, c, v.t === "league"])).sort((a, b) => b[0].length - a[0].length);
  for (const [a, c, lg] of ex) {
    if (have.has(c.toLowerCase())) continue;
    const i = title.search(rx(a));
    if (i >= 0) { found.push({ i, n: c, lg }); have.add(c.toLowerCase()); }
  }
  const inside = (f) => found.some((g) => g !== f && (g.len || 0) > (f.len || 0) && f.i >= g.i && f.i < g.i + (g.len || 0));
  const clubs = found.filter((f) => !f.lg && !inside(f)).sort((a, b) => a.i - b.i);
  let league = (found.find((f) => f.lg) || {}).n || "";
  if (!league) for (const [a, c, lg] of ex) if (lg && rx(a).test(plain)) { league = c; break; }
  if (!league) league = (CLUB_EMOJI.slice(0, 8).map(([id, em, names]) => ({ n: names[0], ok: NA2(names).some((x) => rx(x).test(plain)) })).find((x) => x.ok) || {}).n || "";
  const sc = title.match(/(\d{1,2}):(\d{1,2})/);
  const tline = (String(post || "").replace(/<[^>]+>/g, "").split("\n").find((l) => l.trim()) || "").trim();
  // yangilik kartochkasi uchun (2026-11-08 dizayni): butun matnda tilga olingan klublar (4 tagacha) va liga — fonda klublar, chapda liga
  const isLg = (ns) => ns.some((x) => /league|liga\b|ligasi|\blig\b|bundesliga|serie a|ligue|\bmls\b|eredivisie|\bcup\b|kubog|chempionat|primeira|pro league|s[uü]per lig|conference/i.test(x));
  const all = [];
  // liga: sarlavhada bo'lsa o'sha, aks holda matnda ENG BIRINCHI tilga olingan liga (Saka postida Chempionlar ligasi, Millatlar ligasi emas)
  if (!(found.find((f) => f.lg))) { let li = -1, ln = ""; for (const [id, em, names] of CLUB_EMOJI) { if (!(LEAGUES.has(id) || isLg(names))) continue; for (const x of NA2(names)) { const mm = plain.match(rx(x)); if (mm && (li < 0 || mm.index < li)) { li = mm.index; ln = names[0]; } } } if (ln) league = ln; }
  if (/UEFA Nations League/i.test(league) && !/UEFA|Yevropa|Evropa/i.test(plain) && /CONCACAF|KONKAKAF|Meksika|Yamayka|AQSh|AQŞ|Kanada|Kosta-Rika|Panama|Gonduras|Salvador|Gaiti|Trinidad|Gvatemala|Kyurasao/i.test(plain)) league = "CONCACAF Nations League"; // har turnirga faqat O'Z logotipi
  for (const [id, em, names] of CLUB_EMOJI) { if (LEAGUES.has(id) || isLg(names)) continue; let best = -1; for (const x of NA2(names)) { const mm = plain.match(rx(x)); if (mm && (best < 0 || mm.index < best)) best = mm.index; } if (best >= 0 && !all.some((a) => a.n === names[0])) all.push({ i: best, n: names[0] }); }
  const cl = [...clubs.map((c) => c.n), ...all.sort((a, b) => a.i - b.i).map((a) => a.n)].filter((n, k, arr) => arr.indexOf(n) === k).slice(0, 4);
  // ASOSIY MAVZU (Bahtiyor aka qoidasi, 2026-11-08: "qaysi klub yoki liga haqida gapirilsa o'shani qo'yasan"):
  // sarlavhada birinchi tilga olingan klub yoki liga; sarlavhada yo'q bo'lsa — matnda birinchi tilga olingani
  const tLg = found.filter((f) => f.lg).sort((a, b) => a.i - b.i)[0];
  let subj = null;
  if (clubs[0] && (!tLg || clubs[0].i <= tLg.i)) subj = { t: "club", n: clubs[0].n };
  else if (tLg) subj = { t: "league", n: tLg.n };
  else {
    // sarlavhada yo'q — avval heshteglar tartibi (muharrir asosiy mavzuni birinchi qo'yadi: "#BradleyBarcola #Liverpool #ParisSaintGermain" → Liverpool)
    const cmp = (x) => String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
    for (const h of (plain.match(/#[\p{L}\p{N}_]+/gu) || [])) {
      const hc = cmp(h); let hit = null;
      for (const [id, , names] of CLUB_EMOJI) if (names.some((x) => cmp(x) === hc)) { hit = { t: LEAGUES.has(id) || isLg(names) ? "league" : "club", n: names[0] }; break; }
      if (hit) { subj = hit; break; }
    }
  }
  if (!subj) {
    const fc = all.sort((a, b) => a.i - b.i)[0];
    let li = -1; if (league) for (const [, , names] of CLUB_EMOJI) if (names[0] === league) for (const x of NA2(names)) { const mm = plain.match(rx(x)); if (mm && (li < 0 || mm.index < li)) li = mm.index; }
    if (fc && (li < 0 || fc.i <= li)) subj = { t: "club", n: fc.n }; else if (league) subj = { t: "league", n: league };
  }
  return { title: newAlpha(canonFix(tline || title.trim())), home: clubs[0]?.n || "", away: clubs[1]?.n || "", score: sc ? sc[1] + ":" + sc[2] : "", league, clubs: cl, subj };
}
// klub yoki liga nomini yagona (asosiy) shaklga keltiradi: "Barselona" → "Barcelona"
function canonName(n) {
  const low = n.toLowerCase();
  for (const [id, em, names] of CLUB_EMOJI) if (names.some((x) => x.toLowerCase() === low)) return names[0];
  return n;
}
async function logoUrl(env, n, idx = {}) {
  if (!n) return "";
  const k = Object.keys(idx).find((c) => c.toLowerCase() === n.toLowerCase());
  if (k) return WURL + "/lg/" + encodeURIComponent(k.toLowerCase());
  const fid = await kvGet(env, "clogo:" + n.toLowerCase(), null);
  return fid ? WURL + "/ph/" + encodeURIComponent(fid) : "";
}
async function cardJob(env, pk, pend) {
  const id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const idx = await kvGet(env, "lgidx", {});
  const ci = cardInfo(pend.post, idx);
  const [homeLogo, awayLogo, leagueLogo0] = await Promise.all([logoUrl(env, ci.home, idx), logoUrl(env, ci.away, idx), logoUrl(env, ci.league, idx)]);
  const leagueLogo = leagueLogo0 || (await leagueLogoUrl(env, ci.league, idx)) || "";
  const clubLogos = (await Promise.all((ci.clubs || []).map(async (n) => (await logoUrl(env, n, idx)) || ESPN_CREST[n] || ""))).filter(Boolean).slice(0, 4);
  await kvPut(env, "cjob:" + id, { ...ci, home: cardNm(ci.home), away: cardNm(ci.away), league: newAlpha(ci.league), homeLogo, awayLogo, leagueLogo, leftLogo: await leftCrest(env, pend.post, ci, idx), clubLogos, pk, chat: pend.chat, msg: pend.msg }, { expirationTtl: 3600 });
  return ghDispatch(env, "card.yml", { job: id });
}
// /logotip ID1 ID2 ...: kanaldagi postlarning matniga klub/liga logotiplarini (custom emoji) qayta qo'yadi — matn, qalin yozuv va havolalar saqlanadi
function entHtmlNoLogo(text, ents) {
  const esc = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const TAG = { bold: ["<b>", "</b>"], italic: ["<i>", "</i>"], underline: ["<u>", "</u>"], strikethrough: ["<s>", "</s>"], spoiler: ["<tg-spoiler>", "</tg-spoiler>"], code: ["<code>", "</code>"], pre: ["<pre>", "</pre>"], blockquote: ["<blockquote>", "</blockquote>"] };
  const skip = new Set(); // logotip (custom emoji) belgilari va ulardan keyingi bitta bo'sh joy olib tashlanadi
  for (const e of ents || []) if (e.type === "custom_emoji") { for (let k = e.offset; k < e.offset + e.length; k++) skip.add(k); if (text[e.offset + e.length] === " ") skip.add(e.offset + e.length); }
  const tagged = (ents || []).filter((e) => TAG[e.type] || e.type === "text_link");
  const open = (e) => (e.type === "text_link" ? '<a href="' + String(e.url).replace(/"/g, "&quot;") + '">' : TAG[e.type][0]), close = (e) => (e.type === "text_link" ? "</a>" : TAG[e.type][1]);
  let out = "";
  for (let k = 0; k <= text.length; k++) {
    for (const e of tagged.filter((e) => e.offset + e.length === k).sort((a, b) => a.length - b.length)) out += close(e);
    for (const e of tagged.filter((e) => e.offset === k).sort((a, b) => b.length - a.length)) out += open(e);
    if (k < text.length && !skip.has(k)) out += esc(text[k]);
  }
  return out;
}
async function logoFix(env, chat, ids, opt = {}) {
  CLUB_RE = null; await mergeCemoji(env);
  const edits = [], bad = [];
  for (const mid of ids) {
    const fw = await tg(env, "forwardMessage", { chat_id: chat, from_chat_id: env.CHANNEL, message_id: mid, disable_notification: true });
    const m = fw && fw.result; if (!m) { bad.push(mid + " (topilmadi)"); continue; }
    await tg(env, "deleteMessage", { chat_id: chat, message_id: m.message_id }).catch(() => null);
    const text = m.caption != null ? m.caption : m.text; const ents = m.caption != null ? m.caption_entities : m.entities;
    if (!text) { bad.push(mid + " (matnsiz)"); continue; }
    await natTeamNeeds(env, text); // logo roboti navbatiga (terma jamoa logotipi yo'q bo'lsa)
    const FLAGS_RX = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]+\u{E007F})\s?/gu;
    let html = addLogos(keepLatin(hashFix(CANON.reduce((a, [re, v]) => a.replace(re, v), entHtmlNoLogo(text, ents).replace(FLAGS_RX, "")))));
    if (opt.tur) { const h2 = html.replace(/(\d{4}-yil [^,\n]+, [^\n]*?)(?:, \d+-tur)?\. (U[çc]h?ra[şs]h?uv)/, "$1, " + opt.tur + "-tur. $2"); if (h2 === html) { bad.push(mid + " (tur joyi topilmadi)"); continue; } html = h2; }
    edits.push({ id: mid, html });
  }
  if (!edits.length) { await tg(env, "sendMessage", { chat_id: chat, text: "Tahrirlanadigan post topilmadi. " + bad.join(", ") }); return; }
  const uid = "L" + Date.now().toString(36);
  await kvPut(env, "ujob:" + uid, { html: "batch", html2: "batch", edit: "batch", edits, chat, photo: null, video: null, raw: { text: "", img: null, url: null, video: null } }, { expirationTtl: 86400 });
  await ghDispatch(env, "ubpost.yml", { job: uid });
  await tg(env, "sendMessage", { chat_id: chat, text: "✅ " + edits.length + " ta post tayyorlandi, hisobingiz orqali tahrirlanmoqda (2–3 daqiqa)." + (bad.length ? "\nO'tkazib yuborildi: " + bad.join(", ") : "") });
}
// /kartaqayta XABAR_ID: kanaldagi natija posti noto'g'ri rasm bilan chiqqan bo'lsa, rasmini natija kartochkasiga almashtiradi (matn va logotiplar saqlanadi, klub nomlari rasmiy shaklga keltiriladi)
async function resRedo(env, chat, mid, quiet) {
  const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fw = await tg(env, "forwardMessage", { chat_id: chat, from_chat_id: env.CHANNEL, message_id: mid, disable_notification: true });
  const m = fw && fw.result; if (!m) throw new Error("kanalda bu raqamli xabar topilmadi");
  await tg(env, "deleteMessage", { chat_id: chat, message_id: m.message_id }).catch(() => null);
  // logotiplar (custom emoji) matnda oddiy emoji bo'lib keladi — olib tashlanadi, addLogos ularni qayta qo'yadi
  let cap = String(m.caption || m.text || "").replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u{E0000}-\u{E007F}]/gu, "").replace(/[ \t]{2,}/g, " ").split("\n").map((l) => l.trim()).join("\n");
  for (const [a, b] of Object.entries(ESPN_NAME)) if (a !== b && !cap.includes(b)) cap = cap.replace(new RegExp("(^|[^\\p{L}])" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}])", "gu"), "$1" + b);
  let L = cap.split("\n"); let t0 = (L.slice(0, 3).find((l) => /^.+?\s+\d{1,2}:\d{1,2}\s+.+$/.test(l.trim())) || L[0] || "").trim();
  // qisqartirilgan klub nomi logotip to'plamida bo'lmasa — rasmiy to'liq nomga ("Charlotte" -> "Charlotte FC")
  { const s0 = t0.match(/^(.+?)\s+\d{1,2}:\d{1,2}\s+(.+)$/); if (s0) { if (!ALIAS_LC) teamName({ name: "x" }); for (const n of [s0[1].trim(), s0[2].trim()]) { if (ALIAS_LC.has(n.toLowerCase())) continue; const full = CLUB_EMOJI.flatMap(([, , ns]) => ns).find((x) => x !== n && teamName0({ name: x }) === n); if (full) cap = cap.replace(new RegExp("(^|[^\\p{L}#])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}]| FC| SK| SC)", "gu"), "$1" + full); } L = cap.split("\n"); t0 = (L.find((l) => /^.+?\s+\d{1,2}:\d{1,2}\s+.+$/.test(l.trim())) || L[0] || "").trim(); } }
  const sm = t0.match(/^(.+?)\s+(\d{1,2}):(\d{1,2})\s+(.+)$/); if (!sm) throw new Error("birinchi qatorda hisob topilmadi — bu natija posti emas");
  const H = sm[1].trim(), A = sm[4].trim();
  // himoya (2026-11-09, 173-post): matndagi gap klub nomi deb olinmasin — ikkala tomon ham qisqa nom bo'lishi shart
  const okName = (x) => x.length <= 40 && x.split(/\s+/).length <= 4 && /^[\p{Lu}0-9]/u.test(x) && !/[.,;!?]/.test(x);
  if (!okName(H) || !okName(A)) throw new Error("natija qatori topilmadi: birinchi qator «Uy 2:1 Mehmon» ko'rinishida emas. Avval /tahrir bilan sarlavhani shu ko'rinishga keltiring.");
  const side = (l) => (l.startsWith(H + ":") ? "h" : l.startsWith(A + ":") ? "a" : "");
  const goals = { hg: [], ag: [], hr: [], ar: [] }; let sec = "";
  for (const l0 of L.slice(1)) { const l = l0.trim(); if (/^Gollar:$/i.test(l)) { sec = "g"; continue; } if (/^Qizil karto[cç]h?ka:$/i.test(l)) { sec = "r"; continue; } if (!l || l.startsWith("#")) { if (!l) sec = sec; continue; } const sd = side(l); if (!sec || !sd) continue;
    const body = l.slice((sd === "h" ? H : A).length + 1).trim(); const out = [];
    for (const tk of body.split(/,\s*/)) { const mm = tk.match(/^(.*?)\s+(\d+(?:\+\d+)?'.*)$/); if (mm) out.push([mm[1].trim(), [mm[2].trim()]]); else if (/^\d+(?:\+\d+)?'/.test(tk) && out.length) out[out.length - 1][1].push(tk.trim()); }
    if (sec === "g") goals[sd + "g"].push(...out); else goals[sd + "r"].push(...out.map(([n, ms]) => [n, ms[0]])); }
  if (!goals.hg.length && !goals.ag.length) { delete goals.hg; delete goals.ag; }
  // qalin: sarlavha (1-qator), hisob qatori, bo'lim nomlari; yulduz futbolchi qatorida faqat ism ("Lionel Messi:")
  // klub va futbolchi nomlari ⟦ ⟧ ichida — yangi alifboga o'girilmasin ("Charlotte" "Çarlotte" bo'lib qolmasin, 2026-11-08)
  const rxq = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wrapN = (x) => { if (x.trim().startsWith("#")) return x; for (const n of [H, A].sort((a, b) => b.length - a.length)) x = x.replace(new RegExp("(^|[^\\p{L}⟦#])" + rxq(esc(n)) + "(?![\\p{L}])", "gu"), "$1⟦" + esc(n) + "⟧"); const g = x.match(/^(\s*⟦[^⟧]+⟧:\s*)(.+)$/); if (g) x = g[1] + g[2].split(/,\s*/).map((tk) => { const mm = tk.match(/^(.*?\S)\s+(\d+(?:\+\d+)?'.*)$/); return mm ? "⟦" + mm[1] + "⟧ " + mm[2] : tk; }).join(", "); return x; };
  const html = L.map((l, i) => { const t = l.trim(); if (i === 0 || t === t0 || /^(Gollar|Qizil karto[cç]h?ka|[OÖ]['ʻ‘’`]?zbek futbol[cç]h?ilari):$/i.test(t)) return "<b>" + wrapN(esc(l)) + "</b>"; const st = t.match(/^(Cristiano Ronaldo|Lionel Messi):\s(.+)$/); return st ? "<b>⟦" + st[1] + "⟧:</b> " + wrapN(esc(st[2])) : wrapN(esc(l)); }).join("\n");
  const names = [...Object.values(FD_COMPS), ...Object.values(ESPN_FIX).map((x) => x[1])];
  const lg = names.find((x) => cap.includes(x) || cap.includes(newAlpha(x))) || "";
  const idx = await kvGet(env, "lgidx", {});
  try { await espnResults(); } catch (e) {}
  const lgLogoName = ESPN_FIX_LOGO[lg] || compLogoName(Object.keys(FD_COMPS).find((k) => FD_COMPS[k] === lg) || "") || lg;
  const [hl, al, ll] = await Promise.all([logoUrl(env, H, idx), logoUrl(env, A, idx), logoUrl(env, lgLogoName, idx)]);
  const id = "r" + Date.now().toString(36) + "k";
  // sariq kartochkalar (ESPN): post sanasi matndan ("2026-yil 5-noyabr")
  let ymd = tashDate(Date.now()); { const MON = { yanvar: 1, fevral: 2, mart: 3, aprel: 4, may: 5, iyun: 6, iyul: 7, avgust: 8, sentabr: 9, oktabr: 10, noyabr: 11, dekabr: 12 }; const dm = cap.match(/(\d{4})-yil (\d{1,2})-(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)/i); if (dm) ymd = dm[1] + "-" + String(MON[dm[3].toLowerCase()]).padStart(2, "0") + "-" + dm[2].padStart(2, "0"); }
  const ycs = await espnCardsFor(H, A, ymd).catch(() => ({ hy: [], ay: [] }));
  await kvPut(env, "cjob:" + id, { title: newAlpha(t0), home: cardNm(H), away: cardNm(A), hy: ycs.hy, ay: ycs.ay, score: sm[2] + ":" + sm[3], league: newAlpha(lgLogoName), homeLogo: hl || ycs.hl || ESPN_CREST[H] || ESPN_CREST[Object.keys(ESPN_CREST).find((k) => norm(k) === norm(H))] ||(await natTeamLogo(env, H)) || "", awayLogo: al || ycs.al || ESPN_CREST[A] || ESPN_CREST[Object.keys(ESPN_CREST).find((k) => norm(k) === norm(A))] ||(await natTeamLogo(env, A)) || "", leagueLogo: ll || espnLgLogo(lg) || "", ...goals, chan: html, rep: mid, kind: "res", story: 0 }, { expirationTtl: 7 * 3600 }); await repWatch(env, id, mid);
  await ghDispatch(env, "card.yml", { job: id });
  if (!quiet) await tg(env, "sendMessage", { chat_id: chat, text: "✅ ⟦" + H + "⟧ – ⟦" + A + "⟧" + ": kartochka chizilmoqda. 2–3 daqiqada kanaldagi post rasmi natija kartochkasiga almashtiriladi." });
}
async function cardDone(env, id, png) {
  const j = await kvGet(env, "cjob:" + id, null);
  if (!j) return;
  await env.STATE.delete("cjob:" + id);
  if (j.rep) {
    // kanaldagi eski natija postining rasmini yangi kartochkaga almashtirish (matn ham yangilanadi, logotiplar saqlanadi)
    await env.STATE.put("lgb:rc_" + id, png, { expirationTtl: 90 * 86400 });
    const html2 = newAlpha(addLogos(j.chan));
    const uid = "e" + Date.now().toString(36) + j.rep;
    await kvPut(env, "ujob:" + uid, { html: html2, html2, edit: j.rep, editPhoto: WURL + "/lg/rc_" + id, photo: null, video: null, chat: null, raw: { text: j.chan, img: null, url: null, video: null }, t: Date.now(), tries: 0, repId: id }, { expirationTtl: 86400 });
    const rw = await kvGet(env, "repWait", []); const e0 = rw.find((x) => x.id === id); if (e0) { Object.assign(e0, { st: "edit", uid, t: Date.now(), n: 0 }); await kvPut(env, "repWait", rw); }
    await ghDispatch(env, "ubpost.yml", { job: uid });
    return;
  }
  if (j.chan) {
    if (!j.to && j.url && /telegra\.ph\//.test(j.url)) { try { await tgphCardImg(env, j.url, png, id); } catch (e) {} } // "Batafsil o'qish" maqolasida ham shu karta (2026-11-09)
    if (!j.to) { await env.STATE.put("lgb:rc_" + id, png, { expirationTtl: 86400 }); const ur = await userPublish(env, j.chan, WURL + "/lg/rc_" + id, j.url || null, null, (await getAdmins(env))[0]).catch(() => null); if (ur?.ok) { const w0 = (await kvGet(env, "resWait", [])).filter((x) => x.id !== id); await kvPut(env, "resWait", w0); return; } }
    const fd = new FormData();
    fd.append("chat_id", String(j.to || env.CHANNEL)); fd.append("caption", newAlpha(noLogos(noLabel(j.chan)))); fd.append("parse_mode", "HTML"); if (j.url) fd.append("reply_markup", JSON.stringify(readMore(j.url)));
    fd.append("photo", new Blob([png], { type: "image/png" }), "card.png");
    const r = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd })).json();
    const w = (await kvGet(env, "resWait", [])).filter((x) => x.id !== id); await kvPut(env, "resWait", w);
    // bot orqali ham chiqmasa — yana o'sha kartochka bilan (universal rasm emas)
    if (!r.ok && !j.to) { await env.STATE.put("lgb:rc_" + id, png, { expirationTtl: 86400 }); await publish(env, j.chan, WURL + "/lg/rc_" + id, readMore(j.url), null); }
    return;
  }
  const pend = await kvGet(env, j.pk, null);
  if (!pend || pend.msg !== j.msg) return;
  const head = `🗂 Navbatda | <a href="${esc(pend.item.link)}">asl manba</a>\n━━━━━━━━━━━━\n`;
  const art = await kvGet(env, artKey(pend), null);
  const fd = new FormData();
  const body = naBody({ chat_id: j.chat, message_id: j.msg, media: { type: "photo", media: "attach://p", caption: head + pend.post, parse_mode: "HTML" }, reply_markup: keyboard(true, art) }, true);
  body.media.caption = newAlpha(addLogos(body.media.caption));
  for (const [k, v] of Object.entries(body)) fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  fd.append("p", new Blob([png], { type: "image/png" }), "card.png");
  const r = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/editMessageMedia`, { method: "POST", body: fd })).json();
  const ph = r.result?.photo || [];
  if (r.ok && ph.length) await kvPut(env, j.pk, { ...pend, img: ph[ph.length - 1].file_id });
}
// BEPUL LIMITLAR NAZORATCHISI (2026-11-08, Bahtiyor aka talabi): limits.yml har kuni 22:50 da GitHub va Cloudflare
// sarfini yuboradi; bu yerda API-Football holati qo'shiladi. 70%+ — ogohlantirish; 85%+ (Cloudflare yoki API-Football) —
// tejash rejimi (ecoMode: kuniga 8 ta yangilik); hammasi 60% dan pastga tushsa rejim o'chadi. Dushanba kuni to'liq hisobot.
async function limitsReport(env, b, admin) {
  const rows = [];
  // "bugun" ko'rsatkichlari UTC kun boshidan — kun oxirigacha taxmin (pp) ham hisoblanadi va qaror shunga qarab qilinadi
  const hrs = Math.max(1, +b.hrs || 24);
  const add = (name, u, l, note) => { if (u == null || !l) return; const day = /bugun/.test(name); const pp = day && hrs >= 12 ? Math.round((100 * u * 24) / hrs / l) : Math.round((100 * u) / l); /* kun yarmidan oldin taxmin ishonchsiz — faqat haqiqiy sarf */ rows.push({ name, u, l, p: Math.max(Math.round((100 * u) / l), Math.min(pp, 999)), note: (note || "") + (day && hrs < 23 ? (note ? "; " : "") + "kun oxirigacha taxmin: " + Math.round((u * 24) / hrs) : "") }); };
  /* 2026-11-20: ombor ochiq — GitHub daqiqalari cheksiz va bepul; 2000 lik chegara bilan solishtirilmaydi (19-noyabr hisobotida soxta "1401%" chiqdi) */
  const ghInfo = b.gh && b.gh.minutes != null ? "ℹ️ GitHub daqiqalari (oy boshidan): " + b.gh.minutes + " — ombor ochiq, cheklov yo'q." : "";
  const cf = b.cf || {};
  add("Bot so'rovlari (bugun)", cf.requests, 100000);
  add("Xotiraga yozish (bugun)", cf.kvWrite, 1000, b.cfY && b.cfY.kvWrite != null ? "kecha butun kun: " + b.cfY.kvWrite : "");
  add("Xotiradan o'chirish (bugun)", cf.kvDelete, 1000, b.cfY && b.cfY.kvDelete != null ? "kecha butun kun: " + b.cfY.kvDelete : "");
  add("Xotiradan o'qish (bugun)", cf.kvRead, 100000);
  add("Xotira ro'yxati (bugun)", cf.kvList, 1000);
  try { const k = await kvGet(env, "afKey", ""); if (k) { const j = await (await fetch("https://v3.football.api-sports.io/status", { headers: { "x-apisports-key": k } })).json(); const q = j?.response?.requests; if (q && q.limit_day) add("API-Football (bugun)", q.current, q.limit_day); } } catch (e) {}
  const crit = rows.filter((r) => !/^GitHub/.test(r.name));
  const max = Math.max(0, ...rows.map((r) => r.p)), cmax = Math.max(0, ...crit.map((r) => r.p));
  const ghWarn = false;
  const was = await kvGet(env, "ecoMode", 0);
  const eco = cmax >= 85 ? 1 : cmax < 60 ? 0 : was;
  if (eco !== was) await kvPut(env, "ecoMode", eco);
  await kvPut(env, "limLast", { t: Date.now(), rows, eco, cfErr: cf.err || null }, { expirationTtl: 14 * 86400 });
  const monday = new Date(Date.now() + 5 * 3600e3).getUTCDay() === 1;
  if (!(b.force || max >= 70 || ghWarn || eco !== was || monday || cf.err) || !admin) return { ok: true, sent: false, max };
  const bar = (p) => "▰".repeat(Math.min(10, Math.round(p / 10))) + "▱".repeat(Math.max(0, 10 - Math.round(p / 10)));
  const ic = (p) => (p >= 85 ? "🔴" : p >= 70 ? "🟡" : "🟢");
  let t = "📊 Bepul limitlar hisoboti\n\n" + rows.map((r) => ic(r.p) + " " + r.name + ": " + r.u + " / " + r.l + " (" + r.p + "%)\n" + bar(r.p) + (r.note ? "\n   " + r.note : "")).join("\n\n");
  if (ghInfo) t += "\n\n" + ghInfo;
  if (cf.err) t += "\n\n⚠️ Cloudflare statistikasi olinmadi: " + String(cf.err).slice(0, 120);
  if (ghWarn) t += "\n\n⚠️ GitHub daqiqalari oy oxirigacha yetmasligi mumkin — kartochka va postlar Modal'da ishlayapti, GitHub faqat zaxira.";
  if (eco !== was) t += eco ? "\n\n🟠 Tejash rejimi YOQILDI: limit 85% dan oshdi — kuniga " + ECO_DAY_LIMIT + " ta yangilik (natijalar to'liq chiqadi)." : "\n\n🟢 Tejash rejimi o'chirildi — hammasi me'yorda.";
  else if (eco) t += "\n\n🟠 Tejash rejimi davom etmoqda.";
  await tg(env, "sendMessage", { chat_id: admin, text: t });
  return { ok: true, sent: true, max };
}
async function ubRoute(env, req, url) {
  if (req.headers.get("x-key") !== (await ubKey(env))) return new Response("forbidden", { status: 403 });
  const J = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json; charset=utf-8" } });
  const admin = (await getAdmins(env))[0];
  // Cloudflare Workers AI (bepul, kuniga ~10 ming "neuron") — kartochka uchun AI fon rasmi (FLUX schnell), 2026-11-08
  if (url.pathname === "/ub/aiimg" && req.method === "POST") { const b = await req.json().catch(() => ({})); if (!env.AI || !b.prompt) return new Response("no", { status: 400 }); try { const r = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: String(b.prompt).slice(0, 2000), steps: Math.min(8, +b.steps || 8) }); const bin = Uint8Array.from(atob(r.image), (c) => c.charCodeAt(0)); return new Response(bin, { headers: { "content-type": "image/jpeg" } }); } catch (e) { return new Response("ai xato: " + String(e.message || e).slice(0, 300), { status: 502 }); } }
  if (url.pathname === "/ub/limits" && req.method === "POST") { const b = await req.json().catch(() => ({})); return J(await limitsReport(env, b, admin)); }
  if (url.pathname === "/ub/job") {
    const j = await kvGet(env, "ujob:" + url.searchParams.get("id"), null);
        return J(j ? { html: j.edit ? j.html2 : j.html, edit: j.edit || 0, story: j.story || null, check: j.check || 0, photo: j.photo, editPhoto: j.editPhoto || null, keep: j.keep || 0, edits: j.edits || null, video: j.video, channel: env.CHANNEL, session: await kvGet(env, "usess", null) } : {});
  }
  if (url.pathname === "/ub/lgput" && req.method === "POST") { const nm = (url.searchParams.get("name") || "").trim(); if (!nm) return J({ ok: false }); await env.STATE.put("lgb:" + nm.toLowerCase(), await req.arrayBuffer()); const idx = await kvGet(env, "lgidx", {}); const k = Object.keys(idx).find((x) => x.toLowerCase() === nm.toLowerCase()) || nm; idx[k] = { t: url.searchParams.get("t") || "club", a: (idx[k] && idx[k].a) || [] }; await kvPut(env, "lgidx", idx); const cm = await kvGet(env, "cemoji", {}); const lc = nm.toLowerCase(); const emoji = CLUB_EMOJI.some((c) => c[2].some((x) => x.toLowerCase() === lc)) || Object.keys(cm).some((x) => x.toLowerCase() === lc); return J({ ok: true, emoji }); }
  if (url.pathname === "/ub/emojineed") return J(await kvGet(env, "emojiNeed", []));
  // STADIONLAR BAZASI (2026-11-10): robot (stadium.yml) Wikimedia Commons'dan erkin litsenziyali stadion suratini rasmlar kanaliga tashlab, shu yerga yozadi
  // RASMLAR BAZASI TINIQLASHTIRUVCHISI (sharp.py, 2026-11-10): /ub/faces — baza; /ub/facesharp — tiniq nusxa eski surat o'rniga yoziladi
  if (url.pathname === "/ub/faces") return J(await kvGet(env, "faces", {}));
  // KANAL POSTLARIDAGI SURATLARNI BAZAGA O'TKAZISH (chanlib.py, 2026-11-10): /ub/faceprobe — post surati va undagi odam (ism post matnidan, yuzdan emas);
  // /ub/faceadd — tozalangan surat bazaga yoziladi; /ub/rasm — post rasmi bazadagi surat bilan qayta chiziladi
  if (url.pathname === "/ub/faceprobe" && req.method === "POST") {
    const b0 = await req.json().catch(() => ({})); const fw = await tg(env, "forwardMessage", { chat_id: admin, from_chat_id: env.CHANNEL, message_id: +b0.post, disable_notification: true }); const m = fw && fw.result;
    if (!m) return J({ ok: false, why: "post topilmadi" });
    await tg(env, "deleteMessage", { chat_id: admin, message_id: m.message_id }).catch(() => null);
    if (!m.photo) return J({ ok: false, why: "postda surat yo'q" });
    const ph = m.photo[m.photo.length - 1]; const text = String(m.caption || "");
    const g = await libGuess(env, { file_id: ph.file_id }, text.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n"));
    return J({ ok: true, f: ph.file_id, w: ph.width, h: ph.height, title: (text.split("\n").find((l) => l.trim()) || "").slice(0, 200), tags: (text.match(/#[\p{L}\p{N}_]+/gu) || []).join(" "), name: g.name || "", from: g.from || "", people: g.people || 0, box: g.box || null, err: g.err || "", dbg: g.dbg || "" });
  }
  if (url.pathname === "/ub/faceadd" && req.method === "POST") {
    const b0 = await req.json().catch(() => ({})); const name = String(b0.name || "").replace(/\s+/g, " ").trim(); const key = pnorm(name);
    if (!key || !isFaceName(name) || !b0.f || !b0.uid) return J({ ok: false });
    const F = await kvGet(env, "faces", {}); const P = (F[key] = F[key] || { n: name, al: [], ph: [], u: 0 });
    P.al = [...new Set([...(P.al || []), name])].slice(0, 12);
    if (!P.ph.some((p) => p.uid === b0.uid || (b0.src && p.src === b0.src))) P.ph.push({ f: b0.f, uid: b0.uid, w: b0.w || 0, h: b0.h || 0, m: b0.m, low: b0.w && Math.min(b0.w, b0.h) < 500 ? 1 : 0, t: Date.now(), sr: 1, ...(b0.b ? { b: b0.b, x: b0.x || [], d: 1 } : {}), ...(b0.src ? { src: b0.src } : {}), ...(b0.c ? { c: String(b0.c).slice(0, 160) } : {}) });
    if (Array.isArray(b0.al)) P.al = [...new Set([...P.al, ...b0.al.map((x) => String(x).trim()).filter(isFaceName)])].slice(0, 12);
    await kvPut(env, "faces", F); return J({ ok: true, n: P.ph.length });
  }
  // bir nechta suratni BITTA KV yozuvi bilan qo'shish (people.py — odamlar roboti): {items: [{name, al, f, uid, w, h, m, b, x, c}]}
  if (url.pathname === "/ub/faceaddm" && req.method === "POST") {
    const b1 = await req.json().catch(() => ({})); const F = await kvGet(env, "faces", {}); let n = 0;
    for (const b0 of Array.isArray(b1.items) ? b1.items.slice(0, 200) : []) {
      const name = String(b0.name || "").replace(/\s+/g, " ").trim(); const key = pnorm(name); if (!key || !isFaceName(name) || !b0.f || !b0.uid) continue;
      const P = (F[key] = F[key] || { n: name, al: [], ph: [], u: 0 });
      P.al = [...new Set([...(P.al || []), name, ...(Array.isArray(b0.al) ? b0.al.map((x) => String(x).trim()).filter(isFaceName) : [])])].slice(0, 12);
      if (P.ph.some((p) => p.uid === b0.uid)) continue;
      P.ph.push({ f: b0.f, uid: b0.uid, w: b0.w || 0, h: b0.h || 0, m: b0.m, low: 0, t: Date.now(), sr: 1, ...(b0.b ? { b: b0.b, x: b0.x || [], d: 1 } : {}), ...(b0.c ? { c: String(b0.c).slice(0, 160) } : {}), ...(b0.wt ? { wt: String(b0.wt).slice(0, 200) } : {}), wc: 1 }); n++;
    }
    if (n) await kvPut(env, "faces", F); return J({ ok: true, n });
  }
  // bazadan bitta suratni olib tashlash (people.py tekshiruvidan o'tmagan surat): {name, uid}
  if (url.pathname === "/ub/facedel" && req.method === "POST") {
    const b0 = await req.json().catch(() => ({})); const F = await kvGet(env, "faces", {}); const key = pnorm(String(b0.name || "")); const P = F[key]; if (!P) return J({ ok: false });
    const n0 = P.ph.length; P.ph = P.ph.filter((p) => p.uid !== b0.uid); if (!P.ph.length) delete F[key];
    if (P.ph.length !== n0) await kvPut(env, "faces", F); return J({ ok: P.ph.length !== n0 });
  }
  // ESKI iF BELGISINI ALMASHTIRISH (wmfix.py, 2026-11-17): /ub/postimg — postning hozirgi rasmi (file_id); /ub/repimg — tayyor rasm bilan post rasmini almashtirish (matn, logotiplar va tugma saqlanadi)
  if (url.pathname === "/ub/postimg") {
    const mid = +url.searchParams.get("id"); const fw = await tg(env, "forwardMessage", { chat_id: admin, from_chat_id: env.CHANNEL, message_id: mid, disable_notification: true }); const m = fw && fw.result;
    if (!m) return J({ ok: false, why: "post topilmadi" });
    await tg(env, "deleteMessage", { chat_id: admin, message_id: m.message_id }).catch(() => null);
    if (!m.photo || m.media_group_id) return J({ ok: false, why: m.media_group_id ? "albom" : "postda surat yo'q" });
    const ph = m.photo[m.photo.length - 1];
    if (url.searchParams.get("raw")) return J({ ok: true, f: ph.file_id, w: ph.width, h: ph.height }); // matnsiz (wmfix keep rejimi) — og'ir matn ishlovi yo'q
    // html shu yerda tayyorlanadi va /ub/repimg ga qaytarib beriladi — post ikki marta uzatilmaydi (Telegram cheklovi) va bitta so'rovga yuk kamroq tushadi (2026-11-17)
    return J({ ok: true, f: ph.file_id, w: ph.width, h: ph.height, html: hashFix(CANON.reduce((a, [re, v]) => a.replace(re, v), entHtmlNoLogo(m.caption || "", m.caption_entities))) });
  }
  if (url.pathname === "/ub/html2" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); return J({ ok: true, html2: newAlpha(addLogos(String(b0.html || ""))) }); }
  if (url.pathname === "/ub/repimg" && req.method === "POST") {
    const mid = +url.searchParams.get("id"); const buf = await req.arrayBuffer(); if (!mid || buf.byteLength < 5000) return J({ ok: false, why: "rasm yo'q" });
    // x-html2 — tayyor (logotipli, yangi alifbodagi) matn: og'ir ishlov alohida so'rovda (/ub/html2) bajariladi, shunda bu so'rov CPU chegarasidan oshmaydi (503 xatolari, 2026-11-17)
    const b64 = (v) => { try { return new TextDecoder().decode(Uint8Array.from(atob(v), (c) => c.charCodeAt(0))); } catch (e) { return ""; } };
    // x-keep: 1 — FAQAT RASM almashtiriladi, post matni umuman o'zgarmaydi (ub.py matnsiz edit_message; 2026-11-17: uzun matnli postlarda matn ishlovi 503 berardi)
    const keep = req.headers.get("x-keep") === "1";
    const hx2 = req.headers.get("x-html2"); const ready = keep ? " " : hx2 ? b64(hx2) : "";
    let html = ready; const hx = ready ? "" : req.headers.get("x-html");
    if (hx) html = b64(hx);
    if (!html) {
      const fw = await tg(env, "forwardMessage", { chat_id: admin, from_chat_id: env.CHANNEL, message_id: mid, disable_notification: true }); const m = fw && fw.result;
      if (!m) return J({ ok: false, why: "post topilmadi" });
      await tg(env, "deleteMessage", { chat_id: admin, message_id: m.message_id }).catch(() => null);
      if (!m.photo || m.media_group_id) return J({ ok: false, why: "postda bitta surat emas" });
      html = hashFix(CANON.reduce((a, [re, v]) => a.replace(re, v), entHtmlNoLogo(m.caption || "", m.caption_entities)));
    }
    const id = "w" + Date.now().toString(36) + mid; await env.STATE.put("lgb:rc_" + id, buf, { expirationTtl: 3 * 86400 });
    const html2 = ready || newAlpha(addLogos(keepLatin(html))); const uid = "e" + Date.now().toString(36) + mid;
    await kvPut(env, "ujob:" + uid, { html: html2, html2, edit: mid, editPhoto: WURL + "/lg/rc_" + id, photo: null, video: null, chat: null, raw: { text: html, img: null, url: null, video: null }, t: Date.now(), tries: 0, repId: id, ...(keep ? { keep: 1 } : {}) }, { expirationTtl: 86400 });
    // keep rejimida repWait ga yozilmaydi: ketma-ket almashtirishlarda KV kechikib yangilangani uchun tugagan yozuvlar qaytib qolib, adminga soxta "almashtirilmadi" ogohlantirishi ketardi (2026-11-17); natija wmfix dan keyin kanaldan ko'rib tekshiriladi
    if (!keep) { const rw = (await kvGet(env, "repWait", [])).filter((x) => Date.now() - x.t0 < 6 * 3600e3); rw.push({ id, mid, st: "edit", uid, t: Date.now(), t0: Date.now(), n: 0 }); await kvPut(env, "repWait", rw.slice(-30)); }
    await ghDispatch(env, "ubpost.yml", { job: uid });
    return J({ ok: true });
  }
  // wmQ — eski belgini almashtirish navbati (wmfix.yml kuniga ikki marta ?take=N bilan oladi): POST {items:[id..], clear} — yuklash
  if (url.pathname === "/ub/wmq") {
    let q = await kvGet(env, "wmQ", []);
    if (req.method === "POST") { const b0 = await req.json().catch(() => ({})); if (b0.clear) q = [];
      { const rw0 = await kvGet(env, "repWait", []); const rw1 = rw0.filter((x) => !/^w/.test(String(x.id))); if (rw1.length !== rw0.length) await kvPut(env, "repWait", rw1); } /* wmfix qoldiqlarini tozalash */ for (const x of b0.items || []) if (+x > 0 && !q.includes(+x)) q.push(+x); await kvPut(env, "wmQ", q); return J({ ok: true, left: q.length }); }
    const n = Math.min(60, Math.max(0, +url.searchParams.get("take") || 0)); const out = q.slice(0, n);
    if (out.length) { await kvPut(env, "wmQ", q.slice(n)); if (q.length <= n && admin) await tg(env, "sendMessage", { chat_id: admin, text: "✅ Eski iF belgisini almashtirish navbatining oxirgi qismi ishga tushdi (" + out.length + " ta post)." }); }
    return J({ ok: true, posts: out, left: Math.max(0, q.length - n) });
  }
  if (url.pathname === "/ub/redoq" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); const Q = (await kvGet(env, "redoQ", null)) || { q: [], n: 0, day: "", log: [] }; if (b0.clear) Q.q = []; const have = new Set(Q.q.map((x) => x.id)); for (const x of b0.items || []) if (+x.id > 0 && !have.has(+x.id)) Q.q.push({ id: +x.id, c: x.c === "k" ? "k" : "r", ...(x.nf ? { nf: 1 } : {}), ...(x.wm === "tr" ? { wm: "tr" } : {}) }); if (b0.max) Q.max = Math.min(60, Math.max(1, +b0.max)); await kvPut(env, "redoQ", Q); return J({ ok: true, left: Q.q.length, done: (Q.log || []).length }); }
  // ODAMLAR ROBOTI MODAL'DA (2026-11-18): hisobot (jurnal + qo'shilgan suratlar) va ko'rilgan fayllar ro'yxati KV'da — GitHub jurnali o'rniga
  // ADMINGA XABAR (2026-11-19): robotlar (genscout va h.k.) muhim yangilikni adminga yozadi — faqat oddiy matn, 1500 belgigacha
  // D1 zaxira sinovi: bazaga ulanganmi, zaxirada nechta qiymat; test=1 — sinov kalitini D1 orqali yozib, o'qib, o'chirib ko'radi (KV'ga tegmaydi)
  if (url.pathname === "/ub/d1test") { if (!env.DB || !env.__ov) return J({ db: false }); const o = { db: true };
    try { o.rows = ((await env.DB.prepare("SELECT count(*) AS n FROM kvo").first()) || {}).n; } catch (e) { o.err = String(e && e.message).slice(0, 120); await env.__ov.load(); }
    if (url.searchParams.get("test") === "1") { try { const v = JSON.stringify({ t: Date.now() }); await env.__ov.put("ovTest", v, { expirationTtl: 600 }, false); o.read = (await env.STATE.get("ovTest")) === v; await env.DB.prepare("DELETE FROM kvo WHERE k='ovTest'").run(); o.clean = true; } catch (e) { o.terr = String(e && e.message).slice(0, 160); } }
    return J(o); }
  if (url.pathname === "/ub/note" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); const t = String(b0.text || "").slice(0, 1500); if (!t || !admin) return J({ ok: false }); const r = await tg(env, "sendMessage", { chat_id: admin, text: t, disable_web_page_preview: true }); return J({ ok: !!(r && r.ok) }); }
  if (url.pathname === "/ub/plog" && req.method === "POST") { await env.STATE.put("peopleLog", (await req.text()).slice(0, 900000), { expirationTtl: 14 * 86400 }); return J({ ok: true }); }
  if (url.pathname === "/ub/pseen") { if (req.method === "POST") { const b0 = await req.json().catch(() => ({})); const cur = await kvGet(env, "peopleSeen", []); const all = [...new Set([...cur, ...(Array.isArray(b0.add) ? b0.add.map(String) : [])])].slice(-150000); await kvPut(env, "peopleSeen", all); return J({ ok: true, n: all.length }); } return J(await kvGet(env, "peopleSeen", [])); }
  // sinov: ovoz + matn faylini diktor boti nomidan kanalga tashlab, moslashni ishga tushiradi (dktest.yml) — butun zanjirni tekshirish uchun
  if (url.pathname === "/ub/dktest" && req.method === "POST") {
    const b0 = await req.json().catch(() => ({})); const tok = await kvGet(env, "dkToken", ""); if (!tok || !b0.audio || !b0.doc) return J({ ok: false, why: "kalit yoki fayl yo'q" });
    const bin = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const send = async (bytes, name, mime, cap) => { const fd = new FormData(); fd.append("chat_id", String(DK_CHAT)); fd.append("caption", cap); fd.append("disable_notification", "true"); fd.append("document", new Blob([bytes], { type: mime }), name); return (await fetch(`https://api.telegram.org/bot${tok}/sendDocument`, { method: "POST", body: fd })).json(); };
    const ra = await send(bin(b0.audio), b0.an || "sinov.mp3", "audio/mpeg", "SINOV — tizimni tekshirish uchun (o'chirib tashlasa bo'ladi)"); const rd = await send(bin(b0.doc), b0.dn || "sinov.txt", "text/plain", "SINOV matni");
    if (!ra.ok || !rd.ok) return J({ ok: false, why: (ra.description || "") + " " + (rd.description || "") });
    const a = ra.result.audio || ra.result.document || {}; await env.STATE.put("dka:" + ra.result.message_id, JSON.stringify({ m: ra.result.message_id, f: a.file_id, k: "file", d: a.duration || 0, sz: a.file_size || 0, t: "", at: Date.now(), test: 1 }), { metadata: { d: a.duration || 0, t: 0 } });
    await env.STATE.delete("dkset:" + rd.result.message_id); const job = await dkSetStart(env, tok, rd.result.message_id, true); return J({ ok: true, a: ra.result.message_id, d: rd.result.message_id, job });
  }
  if (url.pathname === "/ub/dkdel" && req.method === "POST") { // sinov va eski xabarlarni ovozlar kanalidan tozalash (Bahtiyor aka ruxsati bilan; ovoz va matn fayllariga tegilmaydi — ro'yxatni chaqiruvchi beradi)
    const b0 = await req.json().catch(() => ({})); const tok = await kvGet(env, "dkToken", ""); const ids = (b0.ids || []).map(Number).filter((x) => x > 0).slice(0, 100); if (!tok || !ids.length) return J({ ok: false });
    if (b0.lastdoc) await kvPut(env, "dkLastDoc", Number(b0.lastdoc));
    const r = await dkTg(tok, "deleteMessages", { chat_id: DK_CHAT, message_ids: ids }); for (const m of ids) { try { await env.STATE.delete("dka:" + m); } catch (x) {} } if (b0.old) { try { await env.STATE.delete("dkBase"); await env.STATE.delete("dkDoc"); } catch (x) {} }
    return J({ ok: !!r.ok, n: ids.length, why: r.description || "" });
  }
  if (url.pathname === "/ub/dkkey" && req.method === "POST") { // tashqi hisoblash (Kaggle) uchun VAQTINCHALIK kalit: faqat ovozlar kanalidan fayl o'qish va natija yuborishga yaraydi, 6 soatda o'chadi
    const k = [...crypto.getRandomValues(new Uint8Array(24))].map((x) => x.toString(16).padStart(2, "0")).join(""); await kvPut(env, "dkk:" + k, { at: Date.now() }, { expirationTtl: 6 * 3600 });
    const sets = []; let cur; do { const L = await env.STATE.list({ prefix: "dkset:", cursor: cur }); for (const q of L.keys) { const v = await kvGet(env, q.name, null); if (v && v.st === "tayyor") sets.push({ doc: Number(q.name.slice(6)), zip: v.zip, v: v.v || DK_VOICE0, first: v.first, last: v.last, n: v.n, sec: v.sec }); } cur = L.list_complete ? null : L.cursor; } while (cur);
    return J({ k, sets });
  }
  if (url.pathname === "/ub/dksweep") { // nazoratchi uchun: barcha to'plamlar holati + kanalni o'qish uchun seans
    const sets = {}; let cur; do { const L = await env.STATE.list({ prefix: "dkset:", cursor: cur }); for (const q of L.keys) { const v = await kvGet(env, q.name, null); if (v) sets[q.name.slice(6)] = { st: v.st, at: v.at, files: v.files || 0, last: v.last || 0 }; } cur = L.list_complete ? null : L.cursor; } while (cur);
    return J({ chat: DK_CHAT, session: (await kvGet(env, "usessDk", null)) || (await kvGet(env, "usess", null)), sets });
  }
  if (url.pathname === "/ub/dkfw" && req.method === "POST") { // namunani adminning bot chatidan ovozlar kanaliga ko'chirish (namuna_ nomli audio bazaga qo'shilmaydi)
    const b0 = await req.json().catch(() => ({})); const tok = await kvGet(env, "dkToken", ""); const adm = (await getAdmins(env))[0];
    const r = await dkTg(tok, "copyMessage", { chat_id: DK_CHAT, from_chat_id: adm, message_id: Number(b0.m) }); const me = await dkTg(tok, "getChat", { chat_id: adm });
    return J({ ok: !!r.ok, why: r.description || "", m: r.ok ? r.result.message_id : 0, admins: (await getAdmins(env)).length, adminType: me.ok ? me.result.type : "", adminHasUser: me.ok ? !!me.result.username : false });
  }
  if (url.pathname === "/ub/dkping") { const ju = await kvGet(env, "jobsUrl", "https://gcw808-svg--inter-jobs-dispatch.modal.run"); const t0 = Date.now(); try { const r = await fetch(ju, { method: "POST", headers: { "x-key": await ubKey(env), "content-type": "application/json" }, body: JSON.stringify({ wf: "x", job: "y" }), signal: AbortSignal.timeout(20000) }); return J({ ju, st: r.status, ms: Date.now() - t0, body: (await r.text()).slice(0, 200) }); } catch (e) { return J({ ju, err: String(e && e.message), ms: Date.now() - t0 }); } }
  if (url.pathname === "/ub/dkredo" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); const tok = await kvGet(env, "dkToken", ""); if (!tok || !b0.doc) return J({ ok: false }); await env.STATE.delete("dkset:" + b0.doc); return J({ ok: true, job: await dkSetStart(env, tok, Number(b0.doc), true) }); }
  if (url.pathname === "/ub/dkjob") { const j = await kvGet(env, "dkj:" + url.searchParams.get("id"), null); const ds = j ? await kvGet(env, "dkset:" + j.d, null) : null; return J(j ? { ...j, live: !ds || ds.job === url.searchParams.get("id") ? 1 : 0, chat: DK_CHAT, session: (await kvGet(env, "usessDk", null)) || (await kvGet(env, "usess", null)) } : {}); }
  if (url.pathname === "/ub/dkres" && req.method === "POST") {
    const b0 = await req.json().catch(() => ({})); const jb = await kvGet(env, "dkj:" + b0.id, null); const tok = await kvGet(env, "dkToken", ""); if (!jb) return J({ ok: false });
    const prev = await kvGet(env, "dkset:" + jb.d, null); if (prev && prev.job && prev.job !== b0.id) return J({ ok: false, why: "eskirgan ish" });
    if (b0.ok && prev && prev.oz && tok) { try { await dkTg(tok, "deleteMessage", { chat_id: DK_CHAT, message_id: prev.oz }); } catch (x) {} }
    await kvPut(env, "dkset:" + jb.d, b0.ok ? { st: "tayyor", v: jb.v || DK_VOICE0, job: b0.id, at: Date.now(), zip: b0.zip, n: b0.n, sec: b0.sec, lown: b0.lown || 0, lost: b0.lost || 0, files: b0.files, first: b0.first, last: b0.last } : { st: "xato", job: b0.id, at: Date.now(), err: String(b0.err || "").slice(0, 200) });
    const dead = /authorization key|AuthKey|session file|not authorized|disconnected/i.test(String(b0.err || ""));
    if (!b0.ok && tok && dead) { if (!(await kvGet(env, "dkDeadSaid", 0))) { await kvPut(env, "dkDeadSaid", 1, { expirationTtl: 6 * 3600 }); await dkTg(tok, "sendMessage", { chat_id: DK_CHAT, text: "⚠️ Telegram hisobiga ulanish uzilgan — moslash vaqtincha to'xtadi. Tashlangan fayllar yo'qolmaydi: ulanish tiklangach hammasi o'zi navbat bilan moslanadi (qayta tashlash shart emas)." }); } }
    else if (!b0.ok && tok) await dkTg(tok, "sendMessage", { chat_id: DK_CHAT, reply_to_message_id: jb.d, text: "⚠️ Moslash bajarilmadi: " + String(b0.err || "noma'lum xato").slice(0, 300) + "\nO'zim qayta urinaman; bo'lmasa matn fayliga javob qilib «qayta» deb yozing." });
    return J({ ok: true });
  }
  if (url.pathname === "/ub/afsona" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); let r; try { r = await afsonaRun(env, b0.chan ? null : admin, b0.name || ""); } catch (e) { r = "xato: " + e.message; } return J({ r: String(r) }); }
  if (url.pathname === "/ub/rasm" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); return J({ ok: await rasmRedo(env, admin, +b0.id, true, b0.face || b0.credit || b0.wm || b0.sr ? { face: b0.face ? String(b0.face) : "", credit: String(b0.credit || "").slice(0, 90), wm: b0.wm === "tr" ? "tr" : "", sr: b0.sr ? 1 : 0 } : null) }); }
  if (url.pathname === "/ub/facesharp" && req.method === "POST") {
    const b0 = await req.json().catch(() => ({})); const F = await kvGet(env, "faces", {}); let hit = 0;
    for (const P of Object.values(F)) for (const p of P.ph || []) {
      if (b0.om && b0.f && p.m === b0.om) { if (b0.b) { p.b = b0.b; p.x = b0.x || []; p.d = 1; p.pn = b0.pn || 1; } p.f = b0.f; p.uid = b0.uid; p.w = b0.w || 0; p.h = b0.h || 0; p.m = b0.m; p.low = p.w && Math.min(p.w, p.h) < 500 ? 1 : 0; p.sr = 1; if (b0.del) delete p.om; else p.om = b0.om; hit++; }
      else if (b0.dims && p.m === b0.dims) { p.w = b0.w || 0; p.h = b0.h || 0; p.low = p.w && Math.min(p.w, p.h) < 500 ? 1 : 0; if (b0.b) { p.b = b0.b; p.x = b0.x || []; p.d = 1; p.pn = b0.pn || 1; } hit++; }
      else if (b0.keep && p.m === b0.keep) { p.om = b0.om; hit++; }
      else if (b0.purged && p.om === b0.purged) { delete p.om; hit++; }
    }
    if (hit) await kvPut(env, "faces", F);
    return J({ ok: hit > 0 });
  }
  // VIDEO ROBOTI (vidscout.py, 2026-11-19, Bahtiyor aka: "video arxivga video avtomatik yig'adigan qil"): faqat ERKIN LITSENZIYALI videolar (CC0, PD, CC BY, CC BY-SA).
  // /ub/vdseen — ko'rilgan manbalar ro'yxati (takror yuklanmasin; rad etilganlari ham). /ub/vdsend — tayyor multipart so'rov Telegram'ga O'ZGARTIRILMAY uzatiladi
  // (bot kaliti GitHub'ga chiqmaydi, fayl serverda saqlanmaydi), kanal manzilini server o'zi qo'yadi; javobdan yozuv D1 bazasiga tushadi.
  if (url.pathname === "/ub/vdseen") {
    const db = await vdDb(env); if (!db) return J({ ok: false, err: "D1 ulanmagan" });
    await db.prepare("CREATE TABLE IF NOT EXISTS vsrc (k TEXT PRIMARY KEY, m INTEGER, at INTEGER)").run();
    if (req.method === "POST") { const b0 = await req.json().catch(() => ({})); const ks = (b0.keys || []).slice(0, 300).map((k) => String(k).slice(0, 300)); if (ks.length) await db.batch(ks.map((k) => db.prepare("INSERT OR IGNORE INTO vsrc (k, m, at) VALUES (?, 0, ?)").bind(k, Date.now()))); return J({ ok: true, n: ks.length }); }
    const r = await db.prepare("SELECT k FROM vsrc").all(); const c = await db.prepare("SELECT COUNT(*) AS n FROM vda").first();
    return J({ ok: true, keys: (r.results || []).map((x) => x.k), total: (c && c.n) || 0 });
  }
  // O'Z INSTAGRAM VIDEOLARIMIZ (ownvids.py, 2026-11-19, Bahtiyor aka: "ha" — o'z videolarimizni arxivga ko'chirish): rasmiy Instagram API orqali FAQAT o'z hisobimiz
  // (@interfutbol_tv) postlari ro'yxati; kalit serverda qoladi, ishga faqat vaqtinchalik fayl manzillari beriladi.
  if (url.pathname === "/ub/igmedia") {
    const g = await kvGet(env, "ig", null); if (!g || !g.k) return J({ ok: false, err: "Instagram ulanmagan" });
    const q = new URLSearchParams({ fields: "id,media_type,media_product_type,media_url,caption,permalink,timestamp", limit: String(Math.min(50, Number(url.searchParams.get("limit")) || 25)), access_token: g.k });
    const af = url.searchParams.get("after"); if (af) q.set("after", af);
    const j = await (await fetch(g.h + "/" + g.id + "/media?" + q)).json().catch(() => ({}));
    if (!j.data) return J({ ok: false, err: String((j.error && j.error.message) || "javob yo'q").slice(0, 300) });
    return J({ ok: true, data: j.data, next: (j.paging && j.paging.next && j.paging.cursors && j.paging.cursors.after) || "" });
  }
  if (url.pathname === "/ub/vdlist") { // robot qo'shgan (auto) yozuvlar — robot ularni joriy qoidalar bilan qayta tekshiradi
    const db = await vdDb(env); if (!db) return J({ ok: false, err: "D1 ulanmagan" });
    const r = await db.prepare("SELECT m, n, j FROM vda ORDER BY m DESC LIMIT 5000").all();
    return J({ ok: true, items: (r.results || []).map((x) => { let e = {}; try { e = JSON.parse(x.j || "{}"); } catch (y) {} return { m: x.m, n: x.n, auto: e.auto ? 1 : 0, src: e.src || "" }; }) });
  }
  if (url.pathname === "/ub/vddel" && req.method === "POST") { // FAQAT robot qo'shgan (auto) videoni kanaldan va ro'yxatdan olib tashlash; qo'lda tashlanganiga tegilmaydi
    const tok = await kvGet(env, "vdToken", ""); const b0 = await req.json().catch(() => ({})); const out = [];
    for (const m of (b0.m || []).slice(0, 30)) { const e = await vdGet(env, Number(m)); if (!e || !e.auto) { out.push([m, "auto emas"]); continue; } const r = await dkTg(tok, "deleteMessage", { chat_id: VD_CHAT, message_id: Number(m) }); await vdDel(env, Number(m)); out.push([m, r && r.ok ? "o'chdi" : "ro'yxatdan olindi"]); }
    return J({ ok: true, out });
  }
  if (url.pathname === "/ub/vdsend" && req.method === "POST") {
    const tok = await kvGet(env, "vdToken", ""); if (!tok) return J({ ok: false, err: "video bot kaliti yo'q" });
    let meta = {}; try { meta = JSON.parse(url.searchParams.get("meta") || "{}"); } catch (x) {}
    const r = await fetch(`https://api.telegram.org/bot${tok}/sendVideo?chat_id=${VD_CHAT}&disable_notification=true&supports_streaming=true`, { method: "POST", headers: { "content-type": req.headers.get("content-type") || "" }, body: req.body });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) return J({ ok: false, err: String(j.description || ("http " + r.status)).slice(0, 300) });
    const m = j.result, md = vdMedia(m); if (!md) return J({ ok: false, err: "video emas" });
    const e = vdEntry(m, md); e.n = String(meta.n || e.n || "").slice(0, 120); e.src = String(meta.src || "").slice(0, 300); e.cr = String(meta.cr || "").slice(0, 300); if (meta.own) e.own = 1; else e.auto = 1;  // o'z videolarimiz (own) — robot tozalashi (vddel) ularga tegmaydi
    const how = await vdSave(env, e);
    if (e.src) { try { const db = await vdDb(env); if (db) await db.prepare("INSERT OR REPLACE INTO vsrc (k, m, at) VALUES (?, ?, ?)").bind(e.src, e.m, Date.now()).run(); } catch (x) {} }
    return J({ ok: true, m: e.m, how });
  }
  if (url.pathname === "/ub/stadiums") return J(await kvGet(env, "stadiums", {}));
  if (url.pathname === "/ub/stadium" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); if (!b0.club || !b0.f) return J({ ok: false }); const S = await kvGet(env, "stadiums", {}); S[b0.club] = { s: b0.s || "", f: b0.f, c: b0.c || "", t: Date.now() }; await kvPut(env, "stadiums", S); return J({ ok: true, n: Object.keys(S).length }); }
  if (url.pathname === "/ub/emojidone" && req.method === "POST") { const b0 = await req.json().catch(() => ({})); const q = (await kvGet(env, "emojiNeed", [])).filter((x) => !(b0.names || []).includes(x.n)); await kvPut(env, "emojiNeed", q); return J({ ok: true, left: q.length }); }
  if (url.pathname === "/ub/emap" && req.method === "POST") { const m = await req.json(); const cur = await kvGet(env, "cemoji", {}); Object.assign(cur, m); await kvPut(env, "cemoji", cur); return J({ ok: true, n: Object.keys(cur).length }); }
  if (url.pathname === "/ub/dktext" && req.method === "POST") { const b = await req.json().catch(() => ({})); if (b.doc) { const tk = await kvGet(env, "dkToken", ""); const fw = await dkTg(tk, "forwardMessage", { chat_id: DK_CHAT, from_chat_id: DK_CHAT, message_id: Number(b.doc), disable_notification: true }); const d0 = fw.ok && fw.result.document; if (fw.ok) await dkTg(tk, "deleteMessage", { chat_id: DK_CHAT, message_id: fw.result.message_id }); if (!d0) return J({ ok: false, why: "hujjat emas" }); const wid = "w" + Date.now().toString(36); await kvPut(env, "dkt:" + wid, { f: d0.file_id, name: d0.file_name || "matn.docx", v: DK_VOICE0, chat: DK_CHAT, m: Number(b.doc), only: Number(b.only) || 0, find: String(b.find || "").slice(0, 80) }, { expirationTtl: 6 * 3600 }); return J({ id: wid, ok: await ghDispatch(env, "kgrun.yml", { script: "say", ref: wid }) }); } const id = "t" + Date.now().toString(36); await kvPut(env, "dkt:" + id, { t: String(b.t || "").slice(0, 2500), v: DK_VOICE0 }, { expirationTtl: 7200 }); return J({ id, ok: await ghDispatch(env, "dksay.yml", { tid: id, label: "sinov" }) }); }  // sinov: natija kanalga "namuna_sinov" bo'lib tushadi
  if (url.pathname === "/ub/dktext") return J((await kvGet(env, "dkt:" + (url.searchParams.get("id") || ""), null)) || {});
  if (url.pathname === "/ub/ttslex") return J((await kvGet(env, "ttslex", null)) || {});
  if (url.pathname === "/ub/ttsjob") return J((await kvGet(env, "ttsj:" + url.searchParams.get("id"), null)) || {});
  if (url.pathname === "/ub/ttsref") { const b = await env.STATE.get("ttsref:" + url.searchParams.get("m"), "arrayBuffer"); return b ? new Response(b, { headers: { "content-type": "audio/wav" } }) : new Response("", { status: 404 }); }
  if (url.pathname === "/ub/tjob") return J((await kvGet(env, "tjob:" + url.searchParams.get("id"), null)) || {});
  if (url.pathname === "/ub/simg" && req.method === "POST") { const sid = url.searchParams.get("id") || "", sn = url.searchParams.get("n") || "0", isT = sid.startsWith("t"), skey = (isT ? "tjob:" : "cjob:") + sid; const sj = await kvGet(env, skey, null); if (!sj || !sj.story || sj["vs" + sn]) return J({ ok: false }); await kvPut(env, skey, { ...sj, ["vs" + sn]: 1, storySent: 1 }, { expirationTtl: isT ? 3600 : 7 * 3600 }); const sk = "vs_" + sid + "_" + sn; await env.STATE.put("lgb:" + sk, await req.arrayBuffer(), { expirationTtl: 2 * 86400 }); const su = WURL + "/lg/" + sk; let ig = null; try { try { ig = await igStory(env, su); } catch (e1) { await new Promise((s) => setTimeout(s, 6000)); ig = await igStory(env, su); } } catch (e) { ig = String(e.message || e); if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "Instagram istoriyasi chiqmadi: " + ig.slice(0, 300) }); } let ts = false; try { ts = await storyPublish(env, su); } catch (e) {} return J({ ok: true, ig, ts }); } if (url.pathname === "/ub/timg" && req.method === "POST") { const tid = url.searchParams.get("id"); const tj = await kvGet(env, "tjob:" + tid, null);
    if (tj && tj.album) {
      // liga jadvallari albomi: rasmlar yig'iladi, oxirgisi kelganda bitta albom bo'lib chiqadi
      const n = tj.cnt || 0;
      await env.STATE.put("lgb:al_" + tid + "_" + n, await req.arrayBuffer(), { expirationTtl: 86400 });
      await kvPut(env, "tjob:" + tid, { ...tj, cnt: n + 1 }, { expirationTtl: 3600 });
      if (url.searchParams.get("last") === "1") {
        let ar;
        if (Array.isArray(tj.replace) && tj.replace.length) {
          // kanaldagi mavjud albom rasmlarini yangilash (xabarlar o'z joyida qoladi)
          ar = { ok: true };
          for (let i = 0; i <= n && i < tj.replace.length; i++) { const b = await env.STATE.get("lgb:al_" + tid + "_" + i, { type: "arrayBuffer" }); if (!b) continue; const fe = new FormData(); fe.append("chat_id", String(tj.chat)); fe.append("message_id", String(tj.replace[i])); fe.append("p", new Blob([b], { type: "image/png" }), "jadval" + i + ".png"); fe.append("media", JSON.stringify({ type: "photo", media: "attach://p", ...(i === 0 && tj.cap ? { caption: tj.cap } : {}) })); const er = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/editMessageMedia`, { method: "POST", body: fe })).json(); if (!er.ok) ar = er; }
        } else {
          const fdm = new FormData(); fdm.append("chat_id", String(tj.chat));
          const media = [];
          for (let i = 0; i <= n && i < 10; i++) { const b = await env.STATE.get("lgb:al_" + tid + "_" + i, { type: "arrayBuffer" }); if (!b) continue; fdm.append("p" + i, new Blob([b], { type: "image/png" }), "jadval" + i + ".png"); media.push({ type: "photo", media: "attach://p" + i, ...(media.length === 0 && tj.cap ? { caption: tj.cap } : {}) }); }
          fdm.append("media", JSON.stringify(media));
          ar = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMediaGroup`, { method: "POST", body: fdm })).json();
        }
        if (!ar.ok) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Jadvallar albomi chiqmadi: " + (ar.description || "xato") });
        else if (tj.fps) { const cur = await kvGet(env, "tblFp", {}); await kvPut(env, "tblFp", { ...cur, ...tj.fps }); }
        await env.STATE.delete("tjob:" + tid);
      }
      return J({ ok: true });
    }
    if (tj) { const pid = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); const tf = new FormData(); tf.append("chat_id", String(tj.chat)); if (tj.chan) { if (!tj.capSent && tj.cap) { tf.append("caption", newAlpha(noLogos(tj.cap))); tf.append("parse_mode", "HTML"); await kvPut(env, "tjob:" + tid, { ...tj, capSent: 1 }, { expirationTtl: 3600 }); } } else tf.append("reply_markup", JSON.stringify(spKb(pid))); tf.append("photo", new Blob([await req.arrayBuffer()], { type: "image/png" }), "jadval.png"); const pr = await (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: tf })).json(); if (pr.ok && tj.chan && tj.story && !tj.storySent) { await kvPut(env, "tjob:" + tid, { ...(await kvGet(env, "tjob:" + tid, tj)), storySent: 1 }, { expirationTtl: 3600 }); { const ad0 = (await getAdmins(env))[0]; if (ad0) await tg(env, "sendMessage", { chat_id: ad0, text: "Tik istoriya (jadval) chizilmadi yoki yuborilmadi. Eski yotiq rasm istoriyaga qo'yilmadi." }); } }
    if (pr.ok) await kvPut(env, "sp:" + pid, { kind: "photo", file: pr.result.photo[pr.result.photo.length - 1].file_id, cap: tj.cap || "", msgs: [pr.result.message_id], chat: tj.chat }, { expirationTtl: 3 * 86400 }); if (url.searchParams.get("last") === "1") await env.STATE.delete("tjob:" + tid); } return J({ ok: true }); }
  if (url.pathname === "/ub/cjob") return J((await kvGet(env, "cjob:" + url.searchParams.get("id"), null)) || {});
  if (url.pathname === "/ub/card" && req.method === "POST") { await cardDone(env, url.searchParams.get("id"), await req.arrayBuffer()); const miss = url.searchParams.get("miss"); if (miss) { try { const ad = (await getAdmins(env))[0]; if (ad) await tg(env, "sendMessage", { chat_id: ad, text: "⚠️ Nazorat: kartochkada logotip yuklanmadi — " + miss + ". Bo'sh joy qolmasligi uchun bosh harfli zaxira belgi qo'yildi. Claude logotipni tuzatib, /kartaqayta bilan rasmni yangilaydi." }); } catch (e) {} } return J({ ok: true }); }
  if (url.pathname === "/ub/pw") {
    const pw = await kvGet(env, "upw", null);
    if (pw) { await env.STATE.delete("upw"); return J({ pw }); }
    await kvPut(env, "upwait", 1, { expirationTtl: 240 });
    return J({});
  }
  const b = await req.json().catch(() => ({}));
  if (url.pathname === "/ub/session" && b.session) {
    await kvPut(env, "usess", b.session);
    await tg(env, "sendMessage", { chat_id: admin, text: "✅ Hisobingiz ulandi" + (b.name ? " (" + b.name + ")" : "") + ". Endi «Chop etish» bosilganda postlar kanalga klub logotiplari bilan chiqadi.\nO'chirish: /uzish" });
    return J({ ok: true });
  }
  if (url.pathname === "/ub/done" && b.id) {
        const j = await kvGet(env, "ujob:" + b.id, null);
    await env.STATE.delete("ujob:" + b.id);
    if (j && j.repId) { const rw = await kvGet(env, "repWait", []); const e0 = rw.find((x) => x.id === j.repId);
      if (b.ok || !e0 || /not modified/i.test(String(b.err || ""))) { if (e0) await kvPut(env, "repWait", rw.filter((x) => x !== e0)); } // rasm o'zgarmagan bo'lsa ham — muvaffaqiyat
      else if ((e0.n || 0) < 1) { e0.n = 1; e0.t = Date.now(); await kvPut(env, "repWait", rw); await kvPut(env, "ujob:" + b.id, { ...j, t: Date.now() }, { expirationTtl: 86400 }); await ghDispatch(env, "ubpost.yml", { job: b.id }, true); return J({ ok: true }); }
      else { await kvPut(env, "repWait", rw.filter((x) => x !== e0)); if (admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ " + e0.mid + "-post rasmi 2 marta urinib ham almashmadi: " + String(b.err || "xato").slice(0, 150) + ". Qayta: " + (/^w/.test(String(e0.id)) ? "wmfix.yml posts=" + e0.mid : "/rasm " + e0.mid) }); } }
    if (j && j.edits) { if (admin || j.chat) await tg(env, "sendMessage", { chat_id: j.chat || admin, text: b.ok ? "✅ Logotiplar qo'yildi: " + (b.edited || 0) + " ta post tahrirlandi." + (b.failed && b.failed.length ? "\nTahrirlanmadi: " + b.failed.join(", ") : "") : "⚠️ Logotiplarni qo'yib bo'lmadi: " + (b.err || "xato") }); return J({ ok: true }); }
    if (j && j.check) { await kvPut(env, "healthTg", { t: Date.now(), ok: b.ok ? 1 : 0 }, { expirationTtl: 7 * 86400 }); if (!b.ok && admin) await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Telegram hisobingiz botdan uzilgan: " + (b.err || "xato") + ". Bugungi 09:00 Telegram istoriyasi chiqmaydi. Tuzatish: botga /ulanish yuboring." }); return J({ ok: true }); } if (j && j.story) { if (!b.ok) { if ((j.tries || 0) < 1 && !/auth|session|unauthori/i.test(String(b.err || ""))) { await kvPut(env, "ujob:" + b.id, { ...j, tries: (j.tries || 0) + 1 }, { expirationTtl: 86400 }); await ghDispatch(env, "ubpost.yml", { job: b.id }); } else await tg(env, "sendMessage", { chat_id: admin, text: "⚠️ Istoriya chiqmadi: " + (b.err || "xato") }); } else await kvPut(env, "storyLast", { t: Date.now(), id: b.story || 0 }); return J({ ok: true }); }
    // "Batafsil o'qish" tugmasini bot qo'shadi; bo'lmasa — hisob orqali matn ichiga havola qo'shiladi
    if (j && b.ok && !j.edit && !b.dup && j.raw.url && b.msg_id) { // 2026-11-17: takror deb topilgan ESKI postga yangi maqola tugmasi qo'yilmaydi (302-post tugmasi boshqa maqolaga almashib qolgan edi)
      const r2 = await tg(env, "editMessageReplyMarkup", { chat_id: env.CHANNEL, message_id: b.msg_id, reply_markup: readMore(j.raw.url) });
      if (!r2.ok) {
        await kvPut(env, "ujob:" + b.id, { ...j, edit: b.msg_id }, { expirationTtl: 86400 });
        await ghDispatch(env, "ubpost.yml", { job: b.id });
      }
      if (j.test) await tg(env, "sendMessage", { chat_id: admin, text: "🧪 Tugma sinovi: " + (r2.ok ? "✅ bot tugmani qo'sha oldi" : "❌ " + r2.description) });
    }
    if (j && !b.ok && !j.edit && j.t && (j.tries || 0) < 2 && !/auth|session|unauthori|deactivat|banned/i.test(String(b.err || ""))) {
      await kvPut(env, "ujob:" + b.id, { ...j, tries: (j.tries || 0) + 1, t: Date.now() }, { expirationTtl: 86400 });
      await ghDispatch(env, "ubpost.yml", { job: b.id }, true);
      return J({ ok: true, retry: true });
    }
    if (j && !b.ok && !j.edit) {
      const r = await publish(env, j.raw.text, j.raw.img, readMore(j.raw.url), j.raw.video);
      await tg(env, "sendMessage", { chat_id: j.chat || admin, text: "⚠️ Hisobingiz orqali chiqmadi (" + (b.err || "xato") + "). Post bot orqali, logotiplarsiz chiqarildi" + (r.ok ? "." : ": " + r.description) });
    }
    return J({ ok: true });
  }
  return new Response("nf", { status: 404 });
}

const UKB = { inline_keyboard: [[{ text: "✅ Chop etish", callback_data: "ucpub" }], [{ text: "✏️ Tahrirlash", callback_data: "ucedit" }, { text: "❌ Bekor qilish", callback_data: "ucskip" }]] };
async function onUpdate(env, u, ctx) {
    const cp = u.channel_post || u.edited_channel_post;
    if (cp) { if (cp.chat && cp.chat.id === LIB_CHAT) await libIndex(env, cp, !!u.edited_channel_post); return; } // asosiy kanal postlari e'tiborsiz
    const admins = await getAdmins(env);
  await mergeCemoji(env);

    if (u.message) {
    const msg = u.message, chat = msg.chat.id, text = BTN[msg.text] || msg.text || "";
    // INTER DIKTOR BOTI KALITI (2026-11-18): admin BotFather'ning kalitli xabarini shu botga UZATADI — kalit KV'ga yoziladi, xabar o'chiriladi, diktor boti ulanadi
    if (admins.includes(chat) && /Use this token to access the HTTP API/i.test(msg.text || "") && /\d{6,}:[A-Za-z0-9_-]{30,}/.test(msg.text || "")) { await dkConnect(env, chat, msg); return; }
    if (text.startsWith("/start")) {
    if (!admins.length) {
    await kvPut(env, "admins", [chat]);
    await showMenu(env, chat, "✅ Siz bot administratori sifatida belgilandingiz.");
    ctx.waitUntil(nextManual(env, chat, true));
    } else if (!admins.includes(chat)) {
    if (!(await kvGet(env, "req:" + chat, null))) {
    await kvPut(env, "req:" + chat, 1, { expirationTtl: 86400 });
    const f = msg.from || {};
    const who = [f.first_name, f.last_name].filter(Boolean).join(" ") + (f.username ? " (@" + f.username + ")" : "");
    await tg(env, "sendMessage", { chat_id: admins[0], text: "🔑 " + who + " botdan foydalanishga ruxsat so'ramoqda.", reply_markup: { inline_keyboard: [[{ text: "✅ Ruxsat berish", callback_data: "acc:" + chat }, { text: "❌ Rad etish", callback_data: "rej:" + chat }]] } });
    }
    await tg(env, "sendMessage", { chat_id: chat, text: "⏳ So'rovingiz administratorga yuborildi. Ruxsat berilgach, sizga xabar keladi." });
    } else {
    await showMenu(env, chat, "Bot ishlayapti ✅");
    }
    return;
    }
        if (!admins.includes(chat)) return;

    if (text && /^\/instagram\s+\S+/.test(text)) { const k = text.split(/\s+/)[1]; try { await tg(env, "deleteMessage", { chat_id: chat, message_id: msg.message_id }); } catch (e) {} let g = null; try { const a = await (await fetch("https://graph.instagram.com/v23.0/me?fields=user_id,username&access_token=" + encodeURIComponent(k))).json(); if (a.username) g = { k, h: "https://graph.instagram.com/v23.0", id: String(a.user_id || a.id), u: a.username }; } catch (e) {} if (!g) { try { const b = await (await fetch("https://graph.facebook.com/v23.0/17841454002029515?fields=id,username&access_token=" + encodeURIComponent(k))).json(); if (b.username) g = { k, h: "https://graph.facebook.com/v23.0", id: String(b.id), u: b.username }; } catch (e) {} } if (g) await kvPut(env, "ig", g); await tg(env, "sendMessage", { chat_id: chat, text: g ? "✅ Instagram kaliti saqlandi: @" + g.u + ". Kalitli xabaringiz o'chirildi. Endi 09:00 dagi o'yinlar jadvali Instagram istoriyasiga ham chiqadi. Tekshirish: /igtest" : "❌ Kalit ishlamadi. Meta sahifasidagi kalitni qayta nusxalab yuboring." }); return; } if (text && /^\/igtest\b/.test(text)) { const g = await kvGet(env, "ig", null); let r = "❌ Instagram kaliti yo'q."; if (g) { try { const j = await (await fetch(g.h + "/" + g.id + "/content_publishing_limit?fields=quota_usage,config&access_token=" + encodeURIComponent(g.k))).json(); r = j.data ? "✅ Instagram ulanishi ishlayapti: @" + g.u + ". Bugun joylangan: " + (j.data[0]?.quota_usage ?? 0) + " / " + (j.data[0]?.config?.quota_total ?? "?") + ". Istoriya rejimi: " + (await kvGet(env, "igMode", "on")) : "❌ Instagram xatosi: " + JSON.stringify(j.error || j).slice(0, 300); } catch (e) { r = "❌ " + e.message; } } await tg(env, "sendMessage", { chat_id: chat, text: r }); return; } if (text && /^\/igstory\s+(on|off)$/.test(text)) { const v = text.split(/\s+/)[1]; await kvPut(env, "igMode", v); await tg(env, "sendMessage", { chat_id: chat, text: v === "on" ? "✅ Instagram istoriyasi yoqildi." : "Instagram istoriyasi o'chirildi." }); return; } if (text && /^\/openrouter\s+\S+/.test(text)) { const k = text.split(/\s+/)[1]; try { await tg(env, "deleteMessage", { chat_id: chat, message_id: msg.message_id }); } catch (e) {} let j = null; try { j = await (await fetch("https://openrouter.ai/api/v1/key", { headers: { authorization: "Bearer " + k } })).json(); } catch (e) {} const ok = !!(j && j.data); if (ok) await kvPut(env, "orKey", k); await tg(env, "sendMessage", { chat_id: chat, text: ok ? "✅ OpenRouter kaliti saqlandi. Kalitli xabaringiz o'chirildi. Sinash uchun: /ortest" : "❌ Kalit ishlamadi. OpenRouter'dagi kalitni qayta nusxalab yuboring." }); return; } if (text && /^\/ortest\b/.test(text)) { ctx.waitUntil((async () => { const st = await kvGet(env, "st", null); const Q = (st && st.queue) || []; let out = "❌ Navbatda sinash uchun yangilik yo'q."; for (const item of Q.slice(0, 3)) { try { await enrich(item); } catch (e) {} let g = "", d = ""; try { g = (await writePost(env, item, 0, Date.now() + 60000)) || "(SKIP)"; } catch (e) { g = "Gemini xato: " + e.message; } try { d = (await writePost(env, { ...item, __or: 1 }, 0, Date.now() + 90000)) || "(SKIP)"; } catch (e) { d = "DeepSeek xato: " + e.message; } if (g === "(SKIP)" && d === "(SKIP)") continue; out = "🧪 Bir xil yangilik, ikki model (kanalga chiqmaydi)\nManba: " + item.title + "\n\n━━ GEMINI ━━\n" + String(g).replace(/<[^>]+>/g, "") + "\n\n━━ DEEPSEEK ━━\n" + String(d).replace(/<[^>]+>/g, ""); break; } await tg(env, "sendMessage", { chat_id: chat, text: out.slice(0, 4000), disable_web_page_preview: true }); })()); await tg(env, "sendMessage", { chat_id: chat, text: "⏳ Sinov boshlandi, 1–2 daqiqada natija keladi." }); return; } if (text && /^\/zaxira\s+(on|off)$/.test(text)) { const v = text.split(/\s+/)[1]; await kvPut(env, "orMode", v); await tg(env, "sendMessage", { chat_id: chat, text: v === "on" ? "✅ Zaxira model (DeepSeek) yoqildi: Gemini javob bermasa, matnni DeepSeek yozadi." : "Zaxira model o'chirildi." }); return; } if (text && /^\/apifootball\s+\S+/.test(text)) {
      const k = text.split(/\s+/)[1];
      try { await tg(env, "deleteMessage", { chat_id: chat, message_id: msg.message_id }); } catch (e) {}
      let st = null; try { st = await (await fetch("https://v3.football.api-sports.io/status", { headers: { "x-apisports-key": k } })).json(); } catch (e) {}
      const ok = st && st.response && !Array.isArray(st.response) && st.response.subscription;
      if (ok) await kvPut(env, "afKey", k);
      await tg(env, "sendMessage", { chat_id: chat, text: ok ? "✅ API-Football kaliti saqlandi (" + (st.response.subscription.plan || "") + ", kunlik me'yor: " + (st.response.requests?.limit_day ?? "?") + "). Kalitli xabaringiz o'chirildi." : "❌ Kalit ishlamadi. Kabinetdagi kalitni qayta nusxalab yuboring." });
      return;
    }
    if (text && !text.startsWith("/") && (await kvGet(env, "upwait", null))) {
      await env.STATE.delete("upwait");
      await kvPut(env, "upw", text, { expirationTtl: 180 });
      await tg(env, "sendMessage", { chat_id: chat, text: "✅ Parol qabul qilindi. Iltimos, parolli xabaringizni o'chirib qo'ying." });
      return;
    }
    // litsenziyali logotiplar: admin rasm/fayl yuboradi, izohida "logo: Barcelona"
    // litsenziyali logotiplar arxivi (ZIP): fayl nomi = klub nomi
    if (msg.document && /\.zip$/i.test(msg.document.file_name || "")) {
      if ((msg.document.file_size || 0) > 20e6) { await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Arxiv 20 MB dan katta. Ikki qismga bo'lib yuboring." }); return; }
      const ok = await ghDispatch(env, "logozip.yml", { file_id: msg.document.file_id, chat_id: String(chat) });
      await tg(env, "sendMessage", { chat_id: chat, text: ok ? "📦 Logotiplar arxivi qabul qilindi. Ular botga va stikerlar to'plamiga qo'shilmoqda — 2–4 daqiqada natija keladi." : "⚠️ Arxivni ishlovga yuborib bo'lmadi." });
      return;
    }
    if ((msg.document || msg.photo) && /^\/?logo[:\s]/i.test(msg.caption || "")) {
      const nm = canonName((msg.caption || "").replace(/^\/?logo[:\s]+/i, "").trim());
      const fid = msg.document ? msg.document.file_id : msg.photo[msg.photo.length - 1].file_id;
      if (nm) { await kvPut(env, "clogo:" + nm.toLowerCase(), fid); }
      await tg(env, "sendMessage", { chat_id: chat, text: nm ? "✅ «" + nm + "» logotipi saqlandi. Kartochkalarda ishlatiladi." : "⚠️ Izohda klub yoki liga nomini yozing, masalan: logo: Barcelona" });
      return;
    }
    if (text === "/logolar") {
      ctx.waitUntil(sendCatalog(env, chat));
      return;
    }
    if (text === "/ulanish") {
      const ok = await ghDispatch(env, "ublogin.yml", { chat_id: String(chat) });
      await tg(env, "sendMessage", { chat_id: chat, text: ok ? "⏳ Bir daqiqada QR-kod yuboriladi. Uni telefoningizdagi Telegram orqali skanerlang." : "⚠️ Ulanishni boshlab bo'lmadi (GitHub)." });
      return;
    }
    if (text === "/uzish") {
      await env.STATE.delete("usess");
      await tg(env, "sendMessage", { chat_id: chat, text: "✅ Hisob uzildi. Postlar yana bot orqali (logotiplarsiz) chiqadi. To'liq xavfsizlik uchun telefoningizda Sozlamalar → Qurilmalar bo'limidan bu seansni ham yakunlang." });
      return;
    }

    if (text === "/yordam" || text === "/menu") {
    await showMenu(env, chat, "");
    return;
    }
    if (text === "/adminlar") {
    const rows = admins.filter((a) => a !== chat).map((a) => [{ text: "❌ " + a + " — huquqni olib tashlash", callback_data: "rm:" + a }]);
    await tg(env, "sendMessage", { chat_id: chat, text: "👥 Botdan foydalanuvchilar soni: " + admins.length + "\n(siz ham shu ro'yxatdasiz)", reply_markup: rows.length ? { inline_keyboard: rows } : undefined });
    return;
    }

    if (msg.photo && /^\/rasm/.test(msg.caption || "")) {
    await kvPut(env, "defImg", msg.photo[msg.photo.length - 1].file_id);
    await tg(env, "sendMessage", { chat_id: chat, text: "✅ Standart rasm saqlandi. Rasmi topilmagan yangiliklar shu rasm bilan chiqadi." });
    return;
    }
    const voice = msg.voice || msg.audio;
    if (voice) {
    await env.STATE.delete("fikrw:" + chat);
    await tg(env, "sendMessage", { chat_id: chat, text: "🎙 Ovozli xabar qabul qilindi. Matnga o'girilib, tahrirlanmoqda..." });
    const ref = await kvGet(env, "ref:" + chat, null);
    ctx.waitUntil(processVoice(env, chat, { file_id: voice.file_id, mime: voice.mime_type || "audio/ogg", ref }, Date.now() + 27000));
    return;
    }
const vid = msg.video || (msg.document && /^video\//.test(msg.document.mime_type || "") ? msg.document : null);
if (vid) {
if ((vid.file_size || 0) > 2000e6) { await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Video 2 GB dan katta. Qisqartirib qayta yuboring." }); return; }
const r = await fetch(`https://api.github.com/repos/${env.GH_REPO || "gcw808-svg/interfutbol-video"}/actions/workflows/logo.yml/dispatches`, { method: "POST", headers: { authorization: "Bearer " + env.GH_TOKEN, accept: "application/vnd.github+json", "user-agent": "InterFutbolBot", "content-type": "application/json" }, body: JSON.stringify({ ref: "main", inputs: { file_id: vid.file_id, chat_id: String(chat), msg_id: String(msg.message_id), note: (msg.caption || "").slice(0, 1000) } }) });
await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? "🎬 Video qabul qilindi. Sharh yozilmoqda va logotip qo'yilmoqda — 1–3 daqiqada tayyor video sizga keladi." : "⚠️ Videoni ishlovga yuborib bo'lmadi (" + r.status + ")." });
return;
}
if (text && (text === "/talaffuz" || text.startsWith("/talaffuz ") || (!text.startsWith("/") && (await kvGet(env, "lexw:" + chat, null))))) {
      const lex = (await kvGet(env, "ttslex", null)) || {};
      const body = text.startsWith("/talaffuz") ? text.slice(9).trim() : text;
      if (!body) {
        await kvPut(env, "lexw:" + chat, 1, { expirationTtl: 1800 });
        const list = Object.entries(lex).map(([k, v]) => "• " + k + " → " + v).join("\n") || "(hozircha bo'sh)";
        await tg(env, "sendMessage", { chat_id: chat, text: "🗣 Diktor talaffuz lug'ati:\n" + list + "\n\nYangi so'z qo'shish uchun shunday yozing (har qatorga bittadan):\nNapoli = Napli\n\nO'chirish uchun: Napoli =" });
        return;
      }
      await env.STATE.delete("lexw:" + chat);
      const done = [];
      for (const line of body.split("\n")) {
        const m = line.match(/^\s*(.+?)\s*=\s*(.*?)\s*$/);
        if (!m) continue;
        if (m[2]) { lex[m[1]] = m[2]; done.push("✅ " + m[1] + " → " + m[2]); } else { delete lex[m[1]]; done.push("🗑 " + m[1] + " o'chirildi"); }
      }
      await kvPut(env, "ttslex", lex);
      await tg(env, "sendMessage", { chat_id: chat, text: done.length ? done.join("\n") + "\n\nDiktor keyingi matndan boshlab shunday o'qiydi." : "⚠️ Format: Napoli = Napli" });
      return;
    }
if (text === "/fikr") {
      await env.STATE.delete("ttsw:" + chat);
      await kvPut(env, "fikrw:" + chat, 1, { expirationTtl: 3600 });
      await tg(env, "sendMessage", { chat_id: chat, text: "💬 Shaxsiy fikr\n\nFikringizni ovozli xabar yoki oddiy matn ko'rinishida yuboring — bot uni tahrirlangan postga aylantiradi.\n\n📌 Boshqa birovning fikriga munosabat bo'lsa: avval o'sha postni uzating (peresilka) yoki havolasini yuboring, keyin fikringizni yuboring." });
      return;
    }
    if (text && !text.startsWith("/") && !(msg.forward_origin || msg.forward_from_chat || msg.forward_from) && !/^\s*https?:\/\/\S+\s*$/.test(text) && (await kvGet(env, "fikrw:" + chat, null))) {
      await env.STATE.delete("fikrw:" + chat);
      await tg(env, "sendMessage", { chat_id: chat, text: "💬 Matn qabul qilindi. Post tayyorlanmoqda..." });
      const ref = await kvGet(env, "ref:" + chat, null);
      ctx.waitUntil(processVoice(env, chat, { text: text.slice(0, 6000), ref }, Date.now() + 27000));
      return;
    }
    if (text === "/diktor") {
      await env.STATE.delete("fikrw:" + chat);
      await kvPut(env, "ttsw:" + chat, 1, { expirationTtl: 3600 });
      await tg(env, "sendMessage", { chat_id: chat, text: "🎙 O'qitiladigan matnni yuboring (1000 belgigacha). Keyin kayfiyatni tanlaysiz.\n\n⏱ Tayyorlanish vaqti: qisqa gap — taxminan 5–6 daqiqa, uzun matn — 15–20 daqiqagacha. (Ovoz oddiy serverda tayyorlanadi; videokarta ulansa 1–2 daqiqaga tushadi.)" });
      return;
    }
    if (text && !text.startsWith("/") && (await kvGet(env, "ttsw:" + chat, null))) {
      await env.STATE.delete("ttsw:" + chat);
      if (text.length > 1000) { await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Matn " + text.length + " belgi. Hozircha 1000 belgigacha qabul qilinadi — qisqartirib, /diktor bilan qayta yuboring." }); return; }
      const tid = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await kvPut(env, "ttsj:" + tid, { text, chat }, { expirationTtl: 2 * 86400 });
      await tg(env, "sendMessage", { chat_id: chat, text: "Qaysi kayfiyatda o'qilsin?", reply_markup: { inline_keyboard: [[{ text: "🙂 Oddiy", callback_data: "tts:o:" + tid }, { text: "😔 Xafa", callback_data: "tts:x:" + tid }, { text: "🔥 Hayajonli", callback_data: "tts:h:" + tid }]] } });
      return;
    }
    const spe = text && !text.startsWith("/") ? await kvGet(env, "spedit:" + chat, null) : null;
    if (spe) {
      await env.STATE.delete("spedit:" + chat);
      const sp = await kvGet(env, "sp:" + spe, null);
      if (sp) {
        const html = "⟦" + cleanHtml(entitiesToHtml(msg.text, msg.entities), 4000) + "⟧";
        if (sp.kind === "photo") { sp.cap = html; await tgRaw(env, "editMessageCaption", { chat_id: chat, message_id: sp.msgs[0], caption: newAlpha(html), parse_mode: "HTML", reply_markup: spKb(spe) }); }
        else { for (const m of sp.msgs.slice(0, -1)) await tg(env, "deleteMessage", { chat_id: chat, message_id: m }); sp.msgs = sp.msgs.slice(-1); sp.parts = [html]; await tgRaw(env, "editMessageText", { chat_id: chat, message_id: sp.msgs[0], text: newAlpha(html), parse_mode: "HTML", disable_web_page_preview: true, reply_markup: spKb(spe) }); }
        await kvPut(env, "sp:" + spe, sp, { expirationTtl: 3 * 86400 });
        await tg(env, "sendMessage", { chat_id: chat, text: "✏️ Yangilandi. Endi «✅ Chop etish» tugmasini bosing." });
      }
      return;
    }
    if (text && (/^\/natija\b/.test(text) || /^\?/.test(text))) {
      const qq = text.replace(/^\/natija(@\w+)?\s*|^\?\s*/, "").trim();
      if (!qq) { await tg(env, "sendMessage", { chat_id: chat, text: "Nima haqida bilmoqchisiz? Tugmani tanlang yoki savolingizni yozing, masalan: «Interning keyingi o'yini qachon», «APL jadvali».", reply_markup: SPORT_KB }); return; }
      await tg(env, "sendChatAction", { chat_id: chat, action: "typing" });
      ctx.waitUntil(sportAnswer(env, chat, qq));
      return;
    }
    const ue = await kvGet(env, "uedit:" + chat, null);
if (ue && text && !text.startsWith("/")) {
await env.STATE.delete("uedit:" + chat);
const r = await tg(env, "editMessageCaption", { chat_id: chat, message_id: ue, caption: "⟦" + cleanHtml(entitiesToHtml(msg.text, msg.entities), 1024) + "⟧", parse_mode: "HTML", reply_markup: UKB });
await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? "✏️ Matn yangilandi. Endi videoning ostidagi «✅ Chop etish» tugmasini bosing." : "⚠️ Xato: " + r.description });
return;
}
    const op = await kvGet(env, "op:" + chat, null);
    if (op?.awaitEdit && text && !text.startsWith("/")) {
    const r = await publish(env, "⟦" + cleanHtml(entitiesToHtml(msg.text, msg.entities), 4000) + "⟧");
    await env.STATE.delete("op:" + chat);
    await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? "✅ Shaxsiy fikr kanalga chiqdi." : "⚠️ Xato: " + r.description });
    return;
    }
    if (msg.photo && !/^\/rasm/.test(msg.caption || "")) { const pi = await kvGet(env, "pending", null); if (pi?.awaitImg && !pi.awaitEdit && (pi.chat || chat) === chat) { const fid = msg.photo[msg.photo.length - 1].file_id; pi.article = pi.article || (await kvGet(env, artKey(pi), null)); await tg(env, "editMessageReplyMarkup", { chat_id: chat, message_id: pi.msg, reply_markup: { inline_keyboard: [[{ text: "🔁 Yangi rasm pastda", callback_data: "x" }]] } }); const head = `🔁 Rasm almashtirildi | <a href="${esc(pi.item?.link || "")}">asl manba</a>\n━━━━━━━━━━━━\n`; const photo = (await brandImg(env, fid)) || fid; const m = await sendRich(env, chat, head + pi.post, photo, keyboard(true, pi.article)); if (m.ok) { await kvPut(env, "pending", { ...pi, awaitImg: false, img: m.usedImg || fid, msg: m.result.message_id }); if (!m.usedImg) await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Post matni juda uzun (1024 belgidan ko'p), shuning uchun rasm bilan birga sig'madi. Rasm bilan chiqishi uchun «✏️ Tahrirlash» orqali matnni qisqartiring." }); } else await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Rasmni qo'yib bo'lmadi: " + m.description }); return; } } let pk = "pending", pending = await kvGet(env, "vpending", null);
    if (pending?.awaitEdit && (pending.chat || chat) === chat) pk = "vpending";
    else pending = await kvGet(env, "pending", null);
    const kind = pk === "vpending" ? "v" : "n";
    if (pending?.awaitEdit && (pending.chat || chat) === chat && !text.startsWith("/")) {
    pending.article = pending.article || (await kvGet(env, artKey(pending), null));
    let r;
    if (msg.photo) {
    const fid = msg.photo[msg.photo.length - 1].file_id;
    const photo = (await brandImg(env, fid)) || fid;
    r = await publish(env, "⟦" + cleanHtml(entitiesToHtml(msg.caption || "", msg.caption_entities)) + "⟧", photo, readMore(pending.article));
    } else {
            const et = "⟦" + cleanHtml(entitiesToHtml(msg.text || "", msg.entities)) + "⟧", ev = pending.item?.video ? pending.item.link : null;
        r = (await userPublish(env, et, pending.img, pending.article, ev, chat)) || (await publish(env, et, pending.img, readMore(pending.article), ev));
    }
          await env.STATE.delete(pk);
      if (!r.queued && !pending.article && !pending.item?.video) await addArtJob(env, r, pending);
    await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? "✅ Tahrirlangan post kanalga chiqdi." : "⚠️ Xato: " + r.description });
    ctx.waitUntil(nextManual(env, chat, false, pending.item?.link, Date.now(), kind));
    return;
    }
    const isFwd = msg.forward_origin || msg.forward_from_chat || msg.forward_from;
    // YANGILIK HAVOLASI (2026-11-20): botga faqat sayt havolasi yuborilsa (o'zi yozilgan yoki uzatilgan) — bu "Fikr" emas, YANGILIK: navbat boshiga qo'yiladi va
    // tahlil qilinib avtomatik chiqadi. "Fikr" (ovozli munosabat) — uzatilgan matnli xabar yoki t.me post havolasi uchun qoladi.
    { const nurl = (text.match(/^\s*(https?:\/\/\S+)\s*$/) || [])[1]; if (nurl && !/^https?:\/\/(www\.)?(t\.me|telegram\.me|youtu\.be|(m\.)?youtube\.com)\//i.test(nurl)) { await newsFromLink(env, chat, nurl); return; } }
    const link = !isFwd && (text.match(/^\s*(https?:\/\/\S+)\s*$/) || [])[1];
    if (isFwd || link) {
    let ref;
    try { ref = isFwd ? refFromForward(msg) : await refFromLink(link); } catch (e) { ref = null; }
    if (!ref || !ref.text) {
    await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Bu xabar yoki havoladan matnni o'qib bo'lmadi. Fikr matnini uzatib (peresilka) yuboring." });
    return;
    }
    await kvPut(env, "ref:" + chat, ref, { expirationTtl: 3 * 3600 });
    await tg(env, "sendMessage", { chat_id: chat, text: "📌 Fikr qabul qilindi" + (ref.author ? " (" + ref.author + ")" : "") + ":\n«" + ref.text.slice(0, 300) + (ref.text.length > 300 ? "…" : "") + "»\n\nEndi unga o'z munosabatingizni ovozli xabar qilib yuboring (3 soat ichida). Bekor qilish: /bekor" });
    return;
    }
    // boshqa holatlarda oddiy matn — futbol savoli
    if (text && !text.startsWith("/") && !msg.photo && !msg.document && !msg.video) {
      await tg(env, "sendChatAction", { chat_id: chat, action: "typing" });
      ctx.waitUntil(sportAnswer(env, chat, text));
      return;
    }
    if (text === "/bekor") {
    await env.STATE.delete("ref:" + chat);
    await tg(env, "sendMessage", { chat_id: chat, text: "✅ Saqlangan fikr bekor qilindi." });
    return;
    }
    if (text === "/navbat") {
    const st = await kvGet(env, "st", { queue: [] });
    await tg(env, "sendMessage", { chat_id: chat, text: `🗂 Navbatda ${st.queue.length} ta yangilik va ${(st.vqueue || []).length} ta video bor.` });
    } else if (text === "/video") {
    const old = await kvGet(env, "vpending", null);
    await env.STATE.delete("vpending");
    await tg(env, "sendMessage", { chat_id: chat, text: "⏳ Keyingi video tayyorlanmoqda..." });
    ctx.waitUntil(nextManual(env, chat, true, old?.item?.link, Date.now(), "v"));
    } else if (text === "/keyingi") {
    const old = await kvGet(env, "pending", null);
    await env.STATE.delete("pending");
    await tg(env, "sendMessage", { chat_id: chat, text: "⏳ Keyingi yangilik tayyorlanmoqda..." });
    ctx.waitUntil(nextManual(env, chat, true, old?.item?.link));
    } else if (/^\/tur\s+\d+\s+\d+$/.test(text)) { const [, id, n] = text.split(/\s+/).map(Number); await tg(env, "sendMessage", { chat_id: chat, text: "Postga " + n + "-tur qo'shilmoqda..." }); ctx.waitUntil(logoFix(env, chat, [id], { tur: n }).catch((e) => tg(env, "sendMessage", { chat_id: chat, text: "Xato: " + String((e && e.message) || e).slice(0, 200) })));
    } else if (/^\/logotip(\s+\d+)+$/.test(text)) { const ids = text.split(/\s+/).slice(1).map(Number).slice(0, 40); await tg(env, "sendMessage", { chat_id: chat, text: "Logotiplar qo'yilmoqda: " + ids.length + " ta post..." }); ctx.waitUntil(logoFix(env, chat, ids).catch((e) => tg(env, "sendMessage", { chat_id: chat, text: "Logotip qo'yishda xato: " + String((e && e.message) || e).slice(0, 200) })));
    } else if (/^\/kartaqayta\s+\d+$/.test(text)) { const mid = Number(text.split(/\s+/)[1]); await tg(env, "sendMessage", { chat_id: chat, text: "Natija kartochkasi qayta chizilmoqda..." }); ctx.waitUntil(resRedo(env, chat, mid).catch((e) => tg(env, "sendMessage", { chat_id: chat, text: "Kartochkani qayta chizishda xato: " + String((e && e.message) || e).slice(0, 200) })));
    } else if (text === "/tekshir") { await tg(env, "sendMessage", { chat_id: chat, text: "Bugungi postlar tekshirilmoqda..." }); ctx.waitUntil(dailyAudit(env, chat).catch((e) => tg(env, "sendMessage", { chat_id: chat, text: "Tekshiruvda xato: " + String((e && e.message) || e).slice(0, 200) }))); } else if (text === "/jadval" || text === "/jadval test") { const test = text === "/jadval test"; await tg(env, "sendMessage", { chat_id: chat, text: "O'yinlar jadvali tayyorlanmoqda..." }); ctx.waitUntil((async () => { let r; try { r = await fixturesRun(env, test); } catch (e) { r = "xato: " + String((e && e.message) || e).slice(0, 200); } if (!test && String(r).startsWith("ok")) await kvPut(env, "fixDay", tashDate(Date.now()), { expirationTtl: 3 * 86400 }); await tg(env, "sendMessage", { chat_id: chat, text: r === "none" ? "Keyingi 22 soatda bizning klublar o'yini yo'q, jadval chiqmadi." : String(r).startsWith("ok") ? (test ? "Namuna sizga yuborildi, rasm 1-2 daqiqada keladi." : "Jadval kanalga yuborildi (" + String(r).slice(3) + " ta o'yin), rasm 1-2 daqiqada chiqadi.") : "Jadval chiqmadi: " + r }); })()); } else if (text === "/pauza") {
    await kvPut(env, "paused", true);
    await tg(env, "sendMessage", { chat_id: chat, text: "⏸ Bot to'xtatildi. Qayta yoqish: /davom" });
    } else if (text === "/davom") {
    await kvPut(env, "paused", false);
    await tg(env, "sendMessage", { chat_id: chat, text: "▶️ Bot qayta ishga tushdi." });
    ctx.waitUntil(nextManual(env, chat, false));
    } else if (/^\/nazorat\s/.test(text)) { const r = await qcCheck(env, text.replace(/^\/nazorat\s+/, ""), false).catch((e) => ({ fatal: ["tekshiruv xatosi: " + e.message], warn: [] })); await tg(env, "sendMessage", { chat_id: chat, text: "🔎 Nazoratchi (sinov, kanalga chiqmaydi):\n" + (r.fatal.length ? "🛑 To'xtatiladi:\n• " + r.fatal.join("\n• ") + "\n" : "✅ Jiddiy xato yo'q\n") + (r.warn.length ? "⚠️ Kamchilik:\n• " + r.warn.join("\n• ") : "Kamchilik yo'q") });
    } else if (/^\/raqam\b/.test(text)) { const nm = text.replace(/^\/raqam\s*/, ""); ctx.waitUntil((async () => { let r; try { r = await statsPost(env, chat, nm || null); } catch (e) { r = "xato: " + e.message; } await tg(env, "sendMessage", { chat_id: chat, text: "🧪 Raqamlarda namunasi (kanalga chiqmaydi): " + r + (/^ok/.test(r) ? " — kartochka 1–3 daqiqada keladi." : "") }); })());
    } else if (text === "/afsona" || text.startsWith("/afsona ")) { const a = text.slice(8).trim(); if (a === "on" || a === "off") { await kvPut(env, "legMode", a); await tg(env, "sendMessage", { chat_id: chat, text: "Afsonalar turkumi: " + (a === "on" ? "yoqildi (har kuni 12:00)" : "o'chirildi") }); } else { await tg(env, "sendMessage", { chat_id: chat, text: "🧪 Afsona posti tayyorlanmoqda (1–3 daqiqa). Kanalga chiqmaydi." }); ctx.waitUntil((async () => { let r; try { r = await afsonaRun(env, chat, a); } catch (e) { r = "xato: " + e.message; } if (!/^ok/.test(String(r))) await tg(env, "sendMessage", { chat_id: chat, text: "Natija: " + r }); })()); }
    } else if (text === "/ozfakt") { await tg(env, "sendMessage", { chat_id: chat, text: "🧪 O'zbek futboli fakti tayyorlanmoqda (manba tanlanadi, nazoratchidan o'tadi, kartochka chiziladi — 1–3 daqiqa). Kanalga chiqmaydi." }); ctx.waitUntil((async () => { let r; try { r = await uzFactRun(env, chat); } catch (e) { r = "xato: " + e.message; } if (!/^ok/.test(String(r))) await tg(env, "sendMessage", { chat_id: chat, text: "Natija: " + r + " — qayta /ozfakt yozing." }); })());
    } else if (/^\/tahrir\s+\d+\s*\n/.test(text)) {
      // kanal postini to'liq yangi matn bilan tahrirlash (logotiplar, rasmiy nomlar, yangi alifbo avtomatik; tugma va rasm saqlanadi)
      const mid = +text.match(/^\/tahrir\s+(\d+)/)[1]; const body = text.replace(/^\/tahrir\s+\d+\s*\n/, "").trim();
      const q = await qcCheck(env, body, true).catch(() => ({ fatal: [], warn: [] }));
      if (q.fatal.length) { await tg(env, "sendMessage", { chat_id: chat, text: "🛑 Tahrir to'xtatildi: " + q.fatal.join("; ") }); return; }
      CLUB_RE = null; const html = newAlpha(addLogos(hashFix(canonFix(body))));
      const uid = "T" + Date.now().toString(36);
      await kvPut(env, "ujob:" + uid, { html: "batch", html2: "batch", edit: "batch", edits: [{ id: mid, html }], chat, photo: null, video: null, raw: { text: "", img: null, url: null, video: null } }, { expirationTtl: 86400 });
      await ghDispatch(env, "ubpost.yml", { job: uid });
      await tg(env, "sendMessage", { chat_id: chat, text: "✏️ " + mid + "-post yangi matn bilan tahrirlanmoqda (2–3 daqiqa)." + (q.warn.length ? "\nEslatma: " + q.warn.join("; ") : "") });
    } else if (/^\/tugma\s+\d+\s+\S+$/.test(text)) {
      // "Batafsil o'qish" tugmasini almashtirish yoki olib tashlash: /tugma ID https://telegra.ph/... | /tugma ID olib
      const [, id, arg] = text.split(/\s+/); const rm = /^(olib|yo'q|-)$/i.test(arg);
      if (!rm && !/^https:\/\/telegra\.ph\//.test(arg)) { await tg(env, "sendMessage", { chat_id: chat, text: "Havola telegra.ph maqolasi bo'lishi kerak yoki «olib»." }); return; }
      const r = await tg(env, "editMessageReplyMarkup", { chat_id: env.CHANNEL, message_id: +id, reply_markup: rm ? { inline_keyboard: [] } : readMore(arg) });
      await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? (rm ? "✅ " + id + "-postdan tugma olib tashlandi." : "✅ " + id + "-post tugmasi yangilandi.") : "⚠️ " + (r.description || "o'zgarmadi") });
    } else if (/^\/rasm\s+\d+(?:\s+(?:tepa|tiniq|\d))*$/i.test(text)) {
      { // 2026-11-15: "/rasm ID tepa" — iF belgisi tepa o'ng burchakda; "/rasm ID 2" — bazadagi 2-surat (bir odamning bir nechta surati bo'lsa)
        const ra = text.split(/\s+/).slice(2); const wm = ra.some((x) => /^tepa$/i.test(x)) ? "tr" : ""; const pick = +(ra.find((x) => /^\d$/.test(x)) || 0); const sr = ra.some((x) => /^tiniq$/i.test(x)) ? 1 : 0; // 2026-11-16: "/rasm ID tiniq" — xira surat majburiy tiniqlashtiriladi
        await rasmRedo(env, chat, +text.split(/\s+/)[1], false, wm || pick || sr ? { wm, pick, sr } : null); }
    } else if (/^\/maqola\s+\S+\s*\n/.test(text)) {
      // Telegraph maqolasini tuzatish: rasm va oxirgi havola saqlanadi, matn yangilanadi ("# " bilan boshlangan qator — sarlavha)
      const path = decodeURIComponent(text.match(/^\/maqola\s+(\S+)/)[1].replace(/^https?:\/\/telegra\.ph\//, "")); const lines = text.split("\n").slice(1).map((l) => l.trim()).filter(Boolean);
      let title = ""; if (lines[0] && lines[0].startsWith("# ")) title = lines.shift().slice(2).trim();
      const g = await (await fetch("https://api.telegra.ph/getPage/" + encodeURIComponent(path) + "?return_content=true")).json();
      if (!g.ok) { await tg(env, "sendMessage", { chat_id: chat, text: "Maqola topilmadi: " + g.error }); return; }
      const old = g.result.content || []; const head = old.filter((n) => n && n.tag === "figure").slice(0, 1); const foot = old.filter((n) => JSON.stringify(n).includes("📲")).slice(-1);
      const nodes = [...head, ...lines.map((l) => (l.startsWith("## ") ? { tag: "h4", children: [canonFix(l.slice(3))] } : { tag: "p", children: [canonFix(l)] })), ...foot];
      const token = await telegraphToken(env);
      const r = await (await fetch("https://api.telegra.ph/editPage/" + encodeURIComponent(path), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ access_token: token, title: newAlpha(canonFix(title || g.result.title)).slice(0, 250), author_name: "Inter Futbol", author_url: g.result.author_url || "", content: JSON.stringify(naNodes(nodes)), return_content: "false" }) })).json();
      await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? "✅ Maqola tuzatildi: " + r.result.url : "⚠️ Maqola tuzatilmadi: " + r.error });
    } else if (text === "/goyalar") { const r = await ideaGen(env).catch((e) => "xato: " + e.message); const all = await kvGet(env, "ideas", []); const UZ = { test: "sinovda", keep: "doimiy", drop: "to'xtatildi", ban: "rad etilgan" }; await tg(env, "sendMessage", { chat_id: chat, text: "💡 Post shakllari (g'oyalar dvigateli):\n" + (all.map((x) => "• " + x.name + " " + x.tag + " — " + (UZ[x.st] || x.st) + ", " + (x.made || 0) + " marta").join("\n") || "hali yo'q") + "\n\nYangi g'oya: " + r });
    } else if (/^\/maqolarasm\b/.test(text)) {
      const rows = text.split("\n").slice(1).map((l) => l.trim().split(/\s+/)).filter((x) => /^\d+$/.test(x[0]) && /telegra\.ph/.test(x[1] || ""));
      const out = [];
      for (const [mid, url] of rows) {
        try {
          const fw = await tg(env, "forwardMessage", { chat_id: chat, from_chat_id: env.CHANNEL, message_id: +mid, disable_notification: true });
          const m = fw && fw.result; if (m) await tg(env, "deleteMessage", { chat_id: chat, message_id: m.message_id }).catch(() => null);
          const ph = m && m.photo ? m.photo[m.photo.length - 1] : null;
          if (!ph) { out.push(mid + ": rasm yo'q"); continue; }
          out.push(mid + ": " + (await tgphSetImg(env, url, WURL + "/ph/" + encodeURIComponent(ph.file_id), !/^\/maqolarasm!/.test(text)))); // "/maqolarasm!" — o'z rasmi bo'lsa ham almashtiriladi
        } catch (e) { out.push(mid + ": xato " + String(e.message || e).slice(0, 60)); }
      }
      await tg(env, "sendMessage", { chat_id: chat, text: "🖼 Maqola rasmlari:\n" + (out.join("\n") || "ro'yxat bo'sh") });
    } else if (text === "/xatolar") { const L = (await kvGet(env, "cronLog", [])).slice(-15).reverse(); const fmt = (t) => new Date(t + 5 * 3600e3).toISOString().slice(5, 16).replace("T", " "); await tg(env, "sendMessage", { chat_id: chat, text: L.length ? "🧰 Oxirgi xatolar (Toshkent vaqti):\n\n" + L.map((x) => fmt(x.t) + " · " + x.k + ": " + String(x.e || "").split("\n")[0].slice(0, 160)).join("\n") : "✅ Xatolar jurnali bo'sh." });
    } else if (text === "/limitlar") { const ok = await ghDispatch(env, "limits.yml", { force: "1" }); await tg(env, "sendMessage", { chat_id: chat, text: ok ? "📊 Limitlar hisoboti tayyorlanmoqda (1–2 daqiqa)." : "Hisobotni ishga tushirib bo'lmadi." });
    } else if (text === "/futbolchilar") { const r = await fmWatch(env, true).catch((e) => ({ err: e.message })); if (r.err) await tg(env, "sendMessage", { chat_id: chat, text: "Xato: " + r.err }); else await tg(env, "sendMessage", { chat_id: chat, text: "👟 Futbolchilar (FotMob, hozirgi klubi):\n" + FOCUS_PLAYERS.map((p) => { const x = r.T[p.fm]; const ok = x && p.club.test(x.team) && !NOT_OURS.test(x.team); return (x ? (ok ? "✅ " : "⚠️ ") : "❔ ") + p.n.replace(/[⟦⟧]/g, "") + " — " + (x ? x.team + (x.loan ? " (ijarada)" : "") + (x.inj ? ", jarohat: " + x.inj : "") : "ma'lumot yo'q"); }).join("\n") });
    } else if (text === "/tahlil") { await tg(env, "sendMessage", { chat_id: chat, text: "📊 Kanal postlari ko'rishlari yig'ilmoqda…" }); const n = await engCollect(env).catch((e) => "xato: " + e.message); await tg(env, "sendMessage", { chat_id: chat, text: "Yangi yozuvlar: " + n }); await engReport(env, chat);
    } else if (text === "/topurar") { const r = await scorersAuto(env, true, chat).catch((e) => "xato: " + e.message); if (!/^ok/.test(r)) await tg(env, "sendMessage", { chat_id: chat, text: "To'purarlar namunasi: " + r });
    } else if (text === "/legioner") { const r = await legionWeekly(env, true, chat).catch((e) => "xato: " + e.message); if (r !== "ok") await tg(env, "sendMessage", { chat_id: chat, text: "Legionerlar namunasi: " + (r === "few" ? "hafta davomida yozuv kam (natija postlaridan yig'iladi)" : r) });
    } else if (text === "/test") {
    const r = await publish(env, "🟢 <b>Inter Futbol</b> — avtomatik tizim ulandi.");
    await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? "✅ Kanalga sinov xabari yuborildi." : "⚠️ Kanalga yozib bo'lmadi: " + r.description + "\nBot kanalda admin ekanini tekshiring." });
    }
    return;
    }

    if (u.callback_query) {
    const q = u.callback_query, chat = q.message.chat.id;
    if (!admins.includes(chat)) return;
    if (q.data === "art") {
      const p0 = await kvGet(env, "pending", null);
      if (!p0 || p0.msg !== q.message.message_id) { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bu yangilik endi faol emas." }); return; }
      await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "📝 Maqola yozilmoqda — 20–30 soniyada tugma «👁 Batafsil maqolani ko'rish»ga aylanadi." });
      ctx.waitUntil(fillPending(env, Date.now() + 27000, true).catch(() => {}));
      return;
    }
    if (/^fd:/.test(q.data || "")) {
      await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
      const td = tashDate(Date.now()), k = q.data.slice(3);
      if (k === "tbl") { await tg(env, "sendMessage", { chat_id: chat, text: "Qaysi liga jadvali?", reply_markup: TBL_KB }); return; }
      if (k === "t:ALL") { ctx.waitUntil((async () => { for (const c of ["PL", "PD", "SA", "BL1", "FL1", "CL"]) { try { await sportAnswer(env, chat, "", { type: "standings", comp: c }); } catch (e) {} } })()); return; }
      const preset = k === "today" ? { type: "matches", date: td } : k === "yday" ? { type: "matches", date: addDays(td, -1) } : k === "tmr" ? { type: "matches", date: addDays(td, 1) } : k.startsWith("t:") ? { type: "standings", comp: k.slice(2) } : null;
      if (preset) ctx.waitUntil(sportAnswer(env, chat, "", preset));
      return;
    }
    if (/^tts:[oxh]:/.test(q.data || "")) {
      const [, md, tid] = q.data.split(":");
      const tj = await kvGet(env, "ttsj:" + tid, null);
      await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: tj ? "" : "Muddati o'tgan" });
      if (!tj) return;
      const ok = await ghDispatch(env, "tts.yml", { job: tid, mood: { o: "oddiy", x: "xafa", h: "hayajon" }[md] });
      await tg(env, "editMessageText", { chat_id: chat, message_id: q.message.message_id, text: ok ? "⏳ Ovoz tayyorlanmoqda (" + { o: "oddiy", x: "xafa", h: "hayajonli" }[md] + " kayfiyatda). Tayyor bo'lgach shu yerga keladi." : "⚠️ Ishga tushirib bo'lmadi (GitHub)." });
      return;
    }
    if (/^sp:[ped]:/.test(q.data || "")) {
      const [, act, sid] = q.data.split(":");
      const sp = await kvGet(env, "sp:" + sid, null);
      await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: sp ? "" : "Bu javobning muddati o'tgan" });
      if (!sp) return;
      if (act === "d") { for (const m of sp.msgs) await tg(env, "deleteMessage", { chat_id: chat, message_id: m }); await env.STATE.delete("sp:" + sid); return; }
      if (act === "e") { await kvPut(env, "spedit:" + chat, sid, { expirationTtl: 3600 }); await tg(env, "sendMessage", { chat_id: chat, text: sp.kind === "photo" ? "Rasm ostiga yoziladigan izohni yuboring." : "Yangi matnni yuboring — kanalga aynan shu ko'rinishda chiqadi." }); return; }
      if (act === "p") {
        const r = await spPublish(env, sp, chat);
        await tg(env, "editMessageReplyMarkup", { chat_id: chat, message_id: sp.msgs[sp.msgs.length - 1], reply_markup: { inline_keyboard: [] } });
        await env.STATE.delete("sp:" + sid);
        await tg(env, "sendMessage", { chat_id: chat, text: r.ok ? "✅ Kanalga yuborildi." : "⚠️ Xato: " + r.description });
        return;
      }
    }
    const acc = q.data.match(/^(acc|rej|rm):(-?\d+)$/);
    if (acc) {
    const id = +acc[2];
    const close = (t) => tg(env, "editMessageText", { chat_id: chat, message_id: q.message.message_id, text: t });
    if (acc[1] === "acc") {
    if (!admins.includes(id)) { admins.push(id); await kvPut(env, "admins", admins); }
    await close("✅ Ruxsat berildi. Endi u botdan to'liq foydalana oladi.");
    await showMenu(env, id, "✅ Sizga Inter Futbol botidan to'liq foydalanish huquqi berildi.");
    } else if (acc[1] === "rej") {
    await close("❌ So'rov rad etildi.");
    } else if (id !== chat) {
    await kvPut(env, "admins", admins.filter((a) => a !== id));
    await close("🗑 Foydalanuvchining huquqi olib tashlandi.");
    }
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    return;
    }
    if (/^o(pub|re|edit|skip)$/.test(q.data)) {
    const op = await kvGet(env, "op:" + chat, null);
    if (!op || op.msg !== q.message.message_id) {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bu post allaqachon ko'rib chiqilgan." });
    return;
    }
    const odone = (label) => tg(env, "editMessageReplyMarkup", { chat_id: chat, message_id: op.msg, reply_markup: { inline_keyboard: [[{ text: label, callback_data: "x" }]] } });
    if (q.data === "opub") {
    const r = await publish(env, opWrap(op.body, op.ref));
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: r.ok ? "Kanalga chiqdi ✅" : "Xato: " + r.description, show_alert: !r.ok });
    if (r.ok) { await odone("✅ Chop etildi"); await env.STATE.delete("op:" + chat); }
    } else if (q.data === "oskip") {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bekor qilindi" });
    await odone("❌ Bekor qilindi");
    await env.STATE.delete("op:" + chat);
    } else if (q.data === "ore") {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Yangi variant yozilmoqda…" });
    ctx.waitUntil((async () => {
    try {
    const v = (op.variant || 0) + 1;
    const body = cleanHtml(await callGemini(env, OP_RE_PROMPT(op.transcript, v, op.ref), 0.9, Date.now() + 25000, 4096, false), 3300);
    await odone("🔄 Yangi variant pastda");
    await sendOpinion(env, chat, "", body, v);
    } catch (e) {
    await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Yangi variant yozib bo'lmadi, birozdan keyin qayta urinib ko'ring." });
    }
    })());
    } else if (q.data === "oedit") {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    await kvPut(env, "op:" + chat, { ...op, awaitEdit: true }, { expirationTtl: 7 * 86400 });
    await odone("✏️ Tahrirlanmoqda");
    await tg(env, "sendMessage", { chat_id: chat, text: "✏️ To'g'rilangan matnni yuboring, u kanalga chiqadi. Quyidagini nusxalab o'zgartirishingiz mumkin:" });
    await tg(env, "sendMessage", { chat_id: chat, text: opWrap(op.body, op.ref), parse_mode: "HTML", disable_web_page_preview: true });
    }
    return;
    }
    if (/^idea:ban:/.test(q.data || "")) { const id = q.data.slice(9); const all = await kvGet(env, "ideas", []); const x = all.find((y) => y.id === id); if (x) { x.st = "ban"; await kvPut(env, "ideas", all); const b = await kvGet(env, "ideaBan", []); b.push(x.name + " (" + x.style.slice(0, 80) + ")"); await kvPut(env, "ideaBan", b.slice(-40)); } await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: x ? "❌ To'xtatildi — boshqa taklif qilinmaydi" : "Topilmadi" }); try { await tg(env, "editMessageReplyMarkup", { chat_id: chat, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } }); } catch (e) {} return; }
    if (/^qc(pub|skip):/.test(q.data || "")) {
      const [cd, qid] = q.data.split(":"); const h = await kvGet(env, "qch:" + qid, null);
      if (!h) { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bu post endi faol emas." }); return; }
      await env.STATE.delete("qch:" + qid);
      await tg(env, "editMessageReplyMarkup", { chat_id: chat, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } });
      if (cd === "qcskip") { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bekor qilindi" }); return; }
      if (/[ўқғҳЎҚҒҲ]/.test(h.text)) h.text = cyrFix(h.text); // 2026-11-19: o'zbekcha kirill qolgan to'xtatilgan post — chiqarishda yangi alifboga o'giriladi
      const r = (await userPublish(env, h.text, h.img, h.url, h.video, chat, true).catch(() => null)) || (await publish(env, h.text, h.img, h.url ? readMore(h.url) : undefined, h.video, true));
      await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: r?.ok ? "✅ Kanalga yuborildi" : "⚠️ " + (r?.description || "chiqmadi") });
      return;
    }
    if (/^uc(pub|edit|skip)$/.test(q.data)) {
    const mid = q.message.message_id;
    if (q.data === "ucpub") {
    const r = await tg(env, "copyMessage", { chat_id: env.CHANNEL, from_chat_id: chat, message_id: mid, ...(q.message.caption ? { caption: "⟦" + noLabel(noEmoji(entHtml(q.message.caption, q.message.caption_entities))) + "⟧", parse_mode: "HTML" } : {}) });
    if (r.ok) await tg(env, "editMessageReplyMarkup", { chat_id: chat, message_id: mid, reply_markup: { inline_keyboard: [] } });
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: r.ok ? "✅ Kanalga chiqdi" : "⚠️ " + r.description });
    } else if (q.data === "ucskip") {
    await tg(env, "deleteMessage", { chat_id: chat, message_id: mid });
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bekor qilindi" });
    } else {
    await kvPut(env, "uedit:" + chat, mid, { expirationTtl: 3600 });
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    await tg(env, "sendMessage", { chat_id: chat, text: "✏️ Video uchun yangi matnni yuboring." });
    }
    return;
    }
    let cd = q.data, pk = "pending", kind = "n";
    if (/^v(pub|re|edit|skip)$/.test(cd)) { cd = cd.slice(1); pk = "vpending"; kind = "v"; }
    const pending = await kvGet(env, pk, null);
    if (!pending || pending.msg !== q.message.message_id || (pending.chat && pending.chat !== chat)) {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bu post allaqachon ko'rib chiqilgan." });
    return;
    }
    const done = (label) => tg(env, "editMessageReplyMarkup", {
    chat_id: chat, message_id: pending.msg,
    reply_markup: { inline_keyboard: [[{ text: label, callback_data: "x" }]] },
    });

    if (cd === "pub" || cd === "pubnp") {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Kanalga chiqarilmoqda…" });
    await done("⏳ Chiqarilmoqda…");
    await env.STATE.delete(pk);
    ctx.waitUntil((async () => {
    const t0 = Date.now();
    let url = pending.article || (await kvGet(env, artKey(pending), null));
    const vid = pending.item?.video ? pending.item.link : null;
    if (!url && !vid) { try { url = await makeArticle(env, pending, t0 + 20000); } catch (e) {} }
        const ur = await userPublish(env, pending.post, cd === "pub" ? pending.img : null, url, vid, chat);
        const r = ur || (await publish(env, pending.post, cd === "pub" ? pending.img : null, readMore(url), vid));
        if (r.ok && !ur && !url && !vid) await addArtJob(env, r, pending);
    if (!r.ok) {
    await kvPut(env, pk, pending);
    await done("⚠️ Xato");
    await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Kanalga chiqmadi: " + r.description });
    return;
    }
    await done(cd === "pub" ? "✅ Chop etildi" : "✅ Rasmsiz chop etildi");
    if (!vid) await rememberNews(env, pending.post).catch(() => {});
    await nextManual(env, chat, false, pending.item?.link, t0, kind);
    })());
    } else if (cd === "skip") {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Bekor qilindi" });
    await done("❌ Bekor qilindi");
    await env.STATE.delete(pk);
    ctx.waitUntil(nextManual(env, chat, false, pending.item?.link, Date.now(), kind));
    } else if (cd === "re") {
    pending.article = pending.article || (await kvGet(env, artKey(pending), null));
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Yangi variant yozilmoqda…" });
    const v = (pending.variant || 0) + 1;
    let post;
    let note = "";
    try { post = await writePost(env, pending.item, v, Date.now() + 15000); if (post && !pending.item?.video) { const cp = await checkedPost(env, pending.item, post, Date.now() + 15000); post = cp.post; note = cp.note; } } catch (e) { post = null; }
    if (!post) {
    await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Yangi variant yozib bo'lmadi, birozdan keyin qayta urinib ko'ring." });
    return;
    }
    await done("🔄 Yangi variant pastda");
    const head = `🔄 ${v + 1}-variant | <a href="${esc(pending.item.link)}">asl manba</a>${note ? "\n" + esc(note) : ""}\n━━━━━━━━━━━━\n`;
    const m = pending.item?.video ? await sendVideo(env, chat, head + post, pending.item.link, keyboard(false, null, true)) : await sendRich(env, chat, head + post, pending.img, keyboard(!!pending.img, pending.article));
    if (m.ok) await kvPut(env, pk, { ...pending, post, img: m.usedImg, msg: m.result.message_id, variant: v });
    } else if (cd === "img") { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "🔁 Boshqa rasm qidirilmoqda…" }); ctx.waitUntil((async () => { try { const tried = [...(pending.imgTried || [])]; if (pending.img && /^https?:/.test(pending.img) && !tried.includes(pending.img)) tried.push(pending.img); const cands = [...new Set([pending.item?.img, ...(pending.item?.alts || [])].filter((u) => u && /^https?:/.test(u) && !tried.includes(u)))]; let src = null; for (const u of cands) { tried.push(u); const im = await loadImg(env, u); if (im && im.W >= 400) { src = u; break; } } if (!src && !pending.commonsQ) { let qq = ""; try { qq = String(await callGemini(env, "Quyidagi futbol yangiligining asosiy qahramoni (futbolchi, murabbiy yoki klub) nomini Wikimedia Commons'da rasm qidirish uchun ingliz tilida 2-4 so'zli so'rov qilib yoz. Faqat so'rovning o'zini yoz, boshqa hech narsa yozma.\n\n" + String(pending.post || "").replace(/<[^>]+>/g, "").slice(0, 1500), 0, Date.now() + 15000, 64, false, true)).trim().split("\n")[0].replace(/[\"*`]/g, "").slice(0, 80); } catch (e) {} pending.commonsQ = qq || "-"; if (qq) { const c = await commonsImg(qq); if (c && !tried.includes(c)) { tried.push(c); src = c; } } } const art = pending.article || (await kvGet(env, artKey(pending), null)); if (src) { const photo = (await brandImg(env, src)) || src; await tg(env, "editMessageReplyMarkup", { chat_id: chat, message_id: pending.msg, reply_markup: { inline_keyboard: [[{ text: "🔁 Yangi rasm pastda", callback_data: "x" }]] } }); const head = `🔁 Rasm almashtirildi | <a href="${esc(pending.item?.link || "")}">asl manba</a>\n━━━━━━━━━━━━\n`; const m = await sendRich(env, chat, head + pending.post, photo, keyboard(true, art)); if (m.ok) { await kvPut(env, pk, { ...pending, article: art, imgTried: tried, awaitImg: true, img: m.usedImg || src, msg: m.result.message_id }); if (!m.usedImg) await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Post matni juda uzun (1024 belgidan ko'p), shuning uchun rasm bilan birga sig'madi. Rasm bilan chiqishi uchun «✏️ Tahrirlash» orqali matnni qisqartiring." }); } else await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Rasmni qo'yib bo'lmadi: " + m.description }); } else { const np = { ...pending, article: art, imgTried: tried, awaitImg: true }; await kvPut(env, pk, np); await tg(env, "sendMessage", { chat_id: chat, text: "🎨 Boshqa mos rasm topilmadi — Inter Futbol kartochkasi tayyorlanmoqda (1–2 daqiqa), u shu postning rasmini almashtiradi. Xohlasangiz, o'z rasmingizni ham yuborishingiz mumkin." }); await cardJob(env, pk, np); } } catch (e) { await tg(env, "sendMessage", { chat_id: chat, text: "⚠️ Rasm almashtirishda xato: " + String(e.message || e).slice(0, 200) }); } })()); } else if (cd === "edit") {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    await kvPut(env, pk, { ...pending, awaitEdit: true });
    await done("✏️ Tahrirlanmoqda");
    await tg(env, "sendMessage", { chat_id: chat, text: "✏️ Postning to'g'rilangan matnini yuboring, u kanalga chiqadi.\n\nRasmni almashtirmoqchi bo'lsangiz, o'z rasmingizni yuboring va matnni rasm izohiga (podpis) yozing.\n\nQuyidagi matnni nusxalab, kerakli joyini o'zgartirishingiz mumkin:" });
    await tg(env, "sendMessage", { chat_id: chat, text: pending.post, parse_mode: "HTML", disable_web_page_preview: true });
    } else {
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    }
    }
    }

    // ---------------- Futbol savollari (football-data.org) ----------------
// Faqat ruxsatli foydalanuvchilar uchun: natijalar, bugungi/ertangi o'yinlar, jamoaning keyingi/oxirgi o'yinlari, jadval, to'purarlar
const FD_COMPS = { CL: "Chempionlar ligasi", PL: "Premier League", PD: "LaLiga", BL1: "Bundesliga", SA: "Serie A", FL1: "Ligue 1", DED: "Eredivisie", PPL: "Liga Portugal", ELC: "Championship", BSA: "Braziliya Seriya A", WC: "Jahon chempionati", EC: "Yevropa chempionati" };
const FD_NAME = {"FC Porto":"FC Porto","Paris FC":"Paris FC","TSG 1899 Hoffenheim":"Hoffenheim","Bayer 04 Leverkusen":"Bayer Leverkusen","FC Bayern München":"Bayern München","FC Schalke 04":"Schalke 04","SV Werder Bremen":"Werder Bremen","1. FSV Mainz 05":"Mainz","FC Augsburg":"Augsburg","SC Freiburg":"Freiburg","1. FC Union Berlin":"Union Berlin","SC Paderborn 07":"Paderborn","SV 07 Elversberg":"Elversberg","Fluminense FC":"Fluminense","CA Mineiro":"Atlético Mineiro","Grêmio FBPA":"Grêmio","CA Paranaense":"Athletico Paranaense","SE Palmeiras":"Palmeiras","Botafogo FR":"Botafogo","Cruzeiro EC":"Cruzeiro","Chapecoense AF":"Chapecoense","São Paulo FC":"São Paulo","EC Bahia":"Bahia","SC Corinthians Paulista":"Corinthians","CR Vasco da Gama":"Vasco da Gama","EC Vitória":"Vitória","CR Flamengo":"Flamengo","Coritiba FBC":"Coritiba","Mirassol FC":"Mirassol","SC Internacional":"Internacional","Santos FC":"Santos","Arsenal FC":"Arsenal","Aston Villa FC":"Aston Villa","Liverpool FC":"Liverpool","Manchester City FC":"Manchester City","Manchester United FC":"Manchester United","Club Atlético de Madrid":"Atlético Madrid","FC Barcelona":"Barcelona","Real Madrid CF":"Real Madrid","Real Betis Balompié":"Real Betis","Villarreal CF":"Villarreal","FC Internazionale Milano":"Inter Milan","SSC Napoli":"Napoli","Sporting Clube de Portugal":"Sporting CP","Lille OSC":"Lille","Paris Saint-Germain FC":"Paris Saint-Germain","Racing Club de Lens":"Lens","Galatasaray SK":"Galatasaray","Fenerbahçe SK":"Fenerbahçe","PSV":"PSV Eindhoven","Feyenoord Rotterdam":"Feyenoord","Club Brugge KV":"Club Brugge","SK Slavia Praha":"Slavia Praha","FK Shakhtar Donetsk":"Shakhtar Donetsk","PAE AEK":"AEK Athens","LASK Linz":"LASK","Viking FK":"Viking","FK Bodø/Glimt":"Bodø/Glimt","Como 1907":"Como","ŠK Slovan Bratislava":"Slovan Bratislava","Sabah FK":"Sabah","FC Twente '65":"Twente","SBV Excelsior":"Excelsior","Willem II Tilburg":"Willem II","SC Heerenveen":"Heerenveen","FC Utrecht":"Utrecht","FC Groningen":"Groningen","AFC Ajax":"Ajax","AZ":"AZ Alkmaar","SC Cambuur-Leeuwarden":"Cambuur","Telstar 1963":"Telstar","NEC":"NEC Nijmegen","Blackburn Rovers FC":"Blackburn Rovers","Bolton Wanderers FC":"Bolton Wanderers","Norwich City FC":"Norwich City","Queens Park Rangers FC":"Queens Park Rangers","Stoke City FC":"Stoke City","Swansea City AFC":"Swansea City","West Bromwich Albion FC":"West Bromwich Albion","Wolverhampton Wanderers FC":"Wolverhampton Wanderers","Portsmouth FC":"Portsmouth","Burnley FC":"Burnley","Birmingham City FC":"Birmingham City","Southampton FC":"Southampton","Derby County FC":"Derby County","Middlesbrough FC":"Middlesbrough","Watford FC":"Watford","Charlton Athletic FC":"Charlton Athletic","Sheffield United FC":"Sheffield United","Millwall FC":"Millwall","Bristol City FC":"Bristol City","Wrexham AFC":"Wrexham","West Ham United FC":"West Ham United","Cardiff City FC":"Cardiff City","Preston North End FC":"Preston North End","Lincoln City FC":"Lincoln City","Toulouse FC":"Toulouse","Stade Brestois 29":"Brest","AJ Auxerre":"Auxerre","OGC Nice":"Nice","FC Lorient":"Lorient","Stade Rennais FC 1901":"Stade Rennais","ES Troyes AC":"Troyes","Angers SCO":"Angers","Le Havre AC":"Le Havre","Le Mans FC":"Le Mans","AS Monaco FC":"Monaco","RC Strasbourg Alsace":"Strasbourg","Athletic Club":"Athletic Bilbao","CA Osasuna":"Osasuna","RCD Espanyol de Barcelona":"Espanyol","Getafe CF":"Getafe","Málaga CF":"Málaga","Rayo Vallecano de Madrid":"Rayo Vallecano","Levante UD":"Levante","Real Sociedad de Fútbol":"Real Sociedad","Valencia CF":"Valencia","Deportivo Alavés":"Alavés","Elche CF":"Elche","RC Celta de Vigo":"Celta Vigo","Sevilla FC":"Sevilla","RC Deportivo La Coruña":"Deportivo La Coruña","Real Racing Club de Santander":"Racing Santander","Chelsea FC":"Chelsea","Everton FC":"Everton","Fulham FC":"Fulham","Newcastle United FC":"Newcastle United","Sunderland AFC":"Sunderland","Tottenham Hotspur FC":"Tottenham Hotspur","Hull City AFC":"Hull City","Leeds United FC":"Leeds United","Ipswich Town FC":"Ipswich Town","Nottingham Forest FC":"Nottingham Forest","Crystal Palace FC":"Crystal Palace","Brighton & Hove Albion FC":"Brighton","Brentford FC":"Brentford","AFC Bournemouth":"Bournemouth","Coventry City FC":"Coventry City","Rio Ave FC":"Rio Ave","GD Estoril Praia":"Estoril Praia","Moreirense FC":"Moreirense","FC Arouca":"Arouca","Sport Lisboa e Benfica":"Benfica","Académico de Viseu FC":"Académico de Viseu","CD Nacional":"Nacional","CD Santa Clara":"Santa Clara","FC Famalicão":"Famalicão","Gil Vicente FC":"Gil Vicente","Vitória SC":"Vitória Guimarães","CS Marítimo":"Marítimo","Sporting Clube de Braga":"Braga","Casa Pia AC":"Casa Pia","FC Alverca":"Alverca","CF Estrela da Amadora":"Estrela da Amadora","ACF Fiorentina":"Fiorentina","Atalanta BC":"Atalanta","Bologna FC 1909":"Bologna","Cagliari Calcio":"Cagliari","Genoa CFC":"Genoa","Juventus FC":"Juventus","SS Lazio":"Lazio","Parma Calcio 1913":"Parma","Udinese Calcio":"Udinese","Venezia FC":"Venezia","Frosinone Calcio":"Frosinone","US Sassuolo Calcio":"Sassuolo","Torino FC":"Torino","US Lecce":"Lecce","AC Monza":"Monza"};
const FD_ORDER = ["CL", "PL", "PD", "BL1", "SA", "FL1", "PPL", "DED", "ELC", "BSA", "WC", "EC"];
const UZ_MONTH = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const UZ_WDAY = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const TZ_MS = 5 * 3600 * 1000; // Toshkent UTC+5

const tashDate = (d) => new Date(new Date(d).getTime() + TZ_MS).toISOString().slice(0, 10);
const tashTime = (d) => new Date(new Date(d).getTime() + TZ_MS).toISOString().slice(11, 16);
const addDays = (ymd, n) => new Date(Date.parse(ymd + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
function uzDay(ymd) {
  const d = new Date(ymd + "T00:00:00Z");
  return `${d.getUTCDate()}-${UZ_MONTH[d.getUTCMonth()]}, ${UZ_WDAY[d.getUTCDay()]}`;
}
const keep = (s) => "⟦" + esc(s) + "⟧";
const UZ_COMP = new Set([FD_COMPS.CL, FD_COMPS.WC, FD_COMPS.EC]); // o'zbekcha nomlar yangi alifboga o'tadi, qolganlari asl holicha
const lcx = (x) => String(x).toLowerCase();
// har bir klub/liga nomi oldiga o'z logotipi (har safar, aniq nom bo'yicha)
function emo(n) { const e = CLUB_EMOJI.find((c) => c[2].some((x) => lcx(x) === lcx(n))); return e ? `<tg-emoji emoji-id="${e[0]}">${e[1]}</tg-emoji> ` : ""; }
const club = (n) => emo(n) + keep(n);
const rp = (v, w) => esc(String(v ?? "").padStart(w, " "));
const compLabel = (n) => emo(n) + (UZ_COMP.has(n) ? esc(n) : keep(n)); // klub nomlari asl holicha
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(fc|cf|afc|sc|ac|ssc|as|club|de|futbol)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// football-data javoblari keshi (2026-11-08, bepul KV limitini tejash): avval xotira (isolate ichida), qisqa muddatli
// (10 daqiqadan kam) javoblar KV'ga YOZILMAYDI — kuzatuvda KV yozuvlarining ~1/3 qismi shu edi
const FDM = new Map();
async function fd(env, path, ttl) {
  const ck = "fd:" + path;
  const mm = FDM.get(ck); if (mm && mm.exp > Date.now()) return structuredClone(mm.j); // nusxa — chaqiruvchi o'zgartirsa kesh buzilmasin
  const useKv = ttl >= 600;
  const c = useKv ? await env.STATE.get(ck) : null;
  if (c) { const jc = JSON.parse(c); FDM.set(ck, { j: structuredClone(jc), exp: Date.now() + Math.min(ttl, 600) * 1000 }); return jc; }
  if (!env.FD_KEY) { const e = new Error("nokey"); e.nokey = true; throw e; }
  const r = await fetch("https://api.football-data.org/v4" + path, { headers: { "X-Auth-Token": env.FD_KEY } });
  if (r.status === 429) { const e = new Error("limit"); e.limit = true; throw e; }
  if (r.status === 403) { const e = new Error("403"); e.denied = true; throw e; }
  if (!r.ok) throw new Error("football-data " + r.status);
  const j = await r.json();
  FDM.set(ck, { j: structuredClone(j), exp: Date.now() + ttl * 1000 }); if (FDM.size > 200) FDM.delete(FDM.keys().next().value);
  if (useKv) await env.STATE.put(ck, JSON.stringify(j), { expirationTtl: Math.max(60, ttl) });
  return j;
}

let ALIAS_LC = null;
// kartochkadagi klub nomi: chet el klubi asl yozuvda ("Charlotte", "Çarlotte" emas); faqat o'zbekcha nom yangi alifboga o'tadi
const cardNm = (n) => (/[oOgG]['ʻ‘’`]|o'zbekiston|uzbekistan/i.test(String(n || "")) ? newAlpha(String(n || "")) : String(n || ""));
function teamName(t) {
  if (!t) return "?";
  if (FD_NAME[t.name]) return FD_NAME[t.name];
  // rasmiy nom: qisqartirilgan nom logotip to'plamida bo'lmasa, to'liq nom ("Charlotte FC", "Lommel SK") qoladi (2026-11-08)
  if (!ALIAS_LC) ALIAS_LC = new Set(CLUB_EMOJI.flatMap(([, , ns]) => ns.map((x) => x.toLowerCase())));
  const sh = teamName0(t); if (t.name && sh !== t.name && !ALIAS_LC.has(sh.toLowerCase()) && ALIAS_LC.has(String(t.name).toLowerCase())) return t.name;
  return sh;
}
function teamName0(t) {
  return String(t.name || t.shortName || "?").replace(/^(FC|AFC|SC|CD|CA|SE|EC|CR|SK|FK|GD|CS|RCD|RC|US|SS|SSC|ACF)\s+/, "").replace(/\s+(FC|AFC|CF|SC|FBC|AF|AC|EC|KV|SK|FK)$/, "");
}

function matchLine(m, withDate) {
  const h = club(teamName(m.homeTeam)), a = club(teamName(m.awayTeam));
  const ft = m.score?.fullTime || {};
  const pre = withDate ? uzDay(tashDate(m.utcDate)).split(",")[0] + " " : "";
  if (m.status === "FINISHED") {
    let x = `${h} <b>${ft.home}:${ft.away}</b> ${a}`;
    if (m.score?.duration === "PENALTY_SHOOTOUT" && m.score.penalties) x += ` (penaltilar ${m.score.penalties.home}:${m.score.penalties.away})`;
    return pre + x;
  }
  if (m.status === "IN_PLAY" || m.status === "PAUSED") return `${pre}${h} <b>${ft.home ?? 0}:${ft.away ?? 0}</b> ${a} — davom etmoqda`;
  if (m.status === "POSTPONED") return `${pre}${h} — ${a} (qoldirildi)`;
  if (m.status === "CANCELLED" || m.status === "SUSPENDED") return `${pre}${h} — ${a} (bekor qilindi)`;
  return `${pre}${tashTime(m.utcDate)}  ${h} — ${a}`;
}

function groupByComp(matches) {
  const g = {};
  for (const m of matches) (g[m.competition?.code || "?"] = g[m.competition?.code || "?"] || []).push(m);
  return FD_ORDER.filter((c) => g[c]).map((c) => [c, g[c].sort((x, y) => x.utcDate.localeCompare(y.utcDate))]);
}

async function fdMatchesOn(env, ymd, comp) {
  const ttl = ymd < tashDate(Date.now()) ? 3600 : 120;
  const j = await fd(env, `/matches?dateFrom=${addDays(ymd, -1)}&dateTo=${addDays(ymd, 1)}${comp ? "&competitions=" + comp : ""}`, ttl);
  let ms = j.matches || [];
  // football-data umumiy ro'yxati ba'zan eskirgan holatda keladi (tugagan o'yin "TIMED"); shunda musobaqa bo'yicha qayta so'raymiz
  // umumiy ro'yxat jonli o'yinni ham kech yangilaydi (tugagan o'yin hali "IN_PLAY"): 105 daqiqadan oshgan jonli o'yinlarni ham musobaqa bo'yicha tekshiramiz
  const stale = [...new Set(ms.filter((m) => ((["TIMED", "SCHEDULED"].includes(m.status) && Date.parse(m.utcDate) < Date.now() - 150 * 60e3) || (["IN_PLAY", "PAUSED", "LIVE", "SUSPENDED"].includes(m.status) && Date.parse(m.utcDate) < Date.now() - 105 * 60e3))).map((m) => m.competition?.code).filter(Boolean))];
  for (const c of stale.slice(0, 4)) {
    try { const jc = await fd(env, `/competitions/${c}/matches?dateFrom=${addDays(ymd, -1)}&dateTo=${addDays(ymd, 1)}`, 120); const by = new Map((jc.matches || []).map((m) => [m.id, m])); ms = ms.map((m) => by.get(m.id) || m); } catch (e) {}
  }
  return ms.filter((m) => tashDate(m.utcDate) === ymd);
}

async function answerMatches(env, q) {
  const today = tashDate(Date.now());
  const start = /^\d{4}-\d{2}-\d{2}$/.test(q.date || "") ? q.date : today;
  const days = Math.min(Math.max(parseInt(q.days) || 1, 1), 7);
  const comp = FD_COMPS[q.comp] ? q.comp : null;
  const out = [];
  const img = { kind: "matches", title: newAlpha(days > 1 ? uzDay(start) + " — " + uzDay(addDays(start, days - 1)) : uzDay(start)), groups: [] };
  q._img = img;
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    let ms = await fdMatchesOn(env, d, comp);
    if (q.only === "finished") ms = ms.filter((m) => m.status === "FINISHED");
    if (q.only === "scheduled") ms = ms.filter((m) => m.status !== "FINISHED");
    if (!ms.length) continue;
    out.push(`<b>${uzDay(d)}</b>`);
    for (const [c, list] of groupByComp(ms)) {
      out.push(`\n<b>${FD_COMPS[c] ? compLabel(FD_COMPS[c]) : c}</b>`);
      for (const m of list) out.push(matchLine(m));
      img.groups.push({ day: newAlpha(uzDay(d)), comp: FD_COMPS[c] || c, items: list.map(imgMatch) });
    }
    out.push("");
  }
  if (!out.length) return `${days > 1 ? uzDay(start) + " dan boshlab " + days + " kun ichida" : uzDay(start) + " kuni"} ${comp ? compLabel(FD_COMPS[comp]) + " bo'yicha " : "asosiy musobaqalarda "}o'yinlar yo'q.`;
  return out.join("\n").trim();
}

async function fdTeamIndex(env, prefer) {
  const idx = (await kvGet(env, "fdteams", null)) || { comps: {}, t: [] };
  const want = [prefer, ...FD_ORDER].filter((c, i, a) => c && FD_COMPS[c] && a.indexOf(c) === i && !["WC", "EC"].includes(c));
  let fetched = 0, changed = false;
  for (const c of want) {
    if (idx.comps[c] && Date.now() - idx.comps[c] < 7 * 86400000) continue;
    if (fetched >= 6) break;
    try {
      const j = await fd(env, `/competitions/${c}/teams`, 7 * 86400);
      fetched++;
      idx.t = idx.t.filter((x) => x.c !== c);
      for (const t of j.teams || []) idx.t.push({ id: t.id, c, s: teamName(t), n: [t.name, t.shortName, t.tla, teamName(t)].filter(Boolean).map(norm) });
      idx.comps[c] = Date.now();
      changed = true;
    } catch (e) { if (e.limit) break; }
  }
  if (changed) await kvPut(env, "fdteams", idx);
  return idx;
}

async function findTeam(env, name, prefer) {
  const n = norm(name);
  if (!n) return null;
  const pick = (idx) => idx.t.find((t) => t.n.includes(n)) || idx.t.find((t) => t.n.some((x) => x && (x.startsWith(n + " ") || x.endsWith(" " + n)))) || idx.t.find((t) => t.n.some((x) => x && x.length > 3 && (x.includes(n) || n.includes(x))));
  let idx = (await kvGet(env, "fdteams", null)) || { comps: {}, t: [] };
  return pick(idx) || pick(await fdTeamIndex(env, prefer));
}

async function answerTeam(env, q, next) {
  const t = await findTeam(env, q.team, q.comp);
  if (!t) return `«${esc(q.team || "")}» jamoasini topa olmadim. Hozircha faqat ${Object.values(FD_COMPS).slice(0, 10).map(compLabel).join(", ")} jamoalari bo'yicha ma'lumot bor.`;
  const n = Math.min(Math.max(parseInt(q.n) || 1, 1), 10);
  const today = tashDate(Date.now());
  const path = next
    ? `/teams/${t.id}/matches?status=SCHEDULED,TIMED,IN_PLAY,PAUSED&dateFrom=${addDays(today, -1)}&dateTo=${addDays(today, 60)}`
    : `/teams/${t.id}/matches?status=FINISHED&dateFrom=${addDays(today, -90)}&dateTo=${today}`;
  const j = await fd(env, path, next ? 600 : 1800);
  let ms = (j.matches || []).sort((x, y) => x.utcDate.localeCompare(y.utcDate));
  ms = next ? ms.slice(0, n) : ms.slice(-n).reverse();
  if (!ms.length) return `${club(t.s)}: ${next ? "yaqin 60 kun ichida o'yin topilmadi" : "oxirgi 90 kunda o'yin topilmadi"}.`;
  q._img = { kind: "matches", showDay: true, league: t.s, title: t.s + " — " + newAlpha(next ? "keyingi o'yin" + (ms.length > 1 ? "lar" : "") : "oxirgi o'yin" + (ms.length > 1 ? "lar" : "")), groups: ms.map((m) => ({ day: newAlpha(uzDay(tashDate(m.utcDate))), comp: FD_COMPS[m.competition?.code] || m.competition?.name || "", items: [imgMatch(m)] })) };
  const head = next ? `<b>${club(t.s)} — keyingi o'yin${ms.length > 1 ? "lar" : ""}</b>` : `<b>${club(t.s)} — oxirgi o'yin${ms.length > 1 ? "lar" : ""}</b>`;
  return head + "\n\n" + ms.map((m) => `${uzDay(tashDate(m.utcDate))} · ${FD_COMPS[m.competition?.code] ? compLabel(FD_COMPS[m.competition.code]) : esc(m.competition?.name || "")}\n${matchLine(m)}`).join("\n\n");
}

async function answerStandings(env, q) {
  const c = FD_COMPS[q.comp] ? q.comp : "PL";
  const j = await fd(env, `/competitions/${c}/standings`, 1800);
  const groups = (j.standings || []).filter((s) => s.type === "TOTAL");
  if (!groups.length) return `${compLabel(FD_COMPS[c])} jadvali hozircha mavjud emas.`;
  const out = [`<b>${compLabel(FD_COMPS[c])} — turnir jadvali</b>`, "<i>O' — o'yin, G' — g'alaba, D — durang, M — mag'lubiyat, +/- — gollar farqi</i>"];
  for (const g of groups.slice(0, 8)) {
    if (groups.length > 1 && g.group) out.push(`\n<b>${esc(g.group.replace(/_/g, " "))}</b>`);
    else out.push("");
    q._img = q._img || { kind: "standings", title: FD_COMPS[c], league: FD_COMPS[c], groups: [] };
    q._img.groups.push({ name: groups.length > 1 && g.group ? g.group.replace(/_/g, " ") : "", rows: g.table.slice(0, 36).map((r) => ({ p: r.position, n: teamName(r.team), g: r.playedGames, w: r.won, d: r.draw, l: r.lost, gd: r.goalDifference, pts: r.points })) });
    out.push(`<code>${rp("#", 2)} ${rp("Ö", 2)} ${rp("Ğ", 2)} ${rp("D", 2)} ${rp("M", 2)} ${rp("+/-", 3)} ${rp("Oçko", 5)}</code>`);
    for (const r of g.table.slice(0, 36)) out.push(`<code>${rp(r.position, 2)} ${rp(r.playedGames, 2)} ${rp(r.won, 2)} ${rp(r.draw, 2)} ${rp(r.lost, 2)} ${rp((r.goalDifference > 0 ? "+" : "") + r.goalDifference, 3)} ${rp(r.points, 5)}</code> ${club(teamName(r.team))}`);
  }
  return out.join("\n");
}

async function answerScorers(env, q) {
  const c = FD_COMPS[q.comp] ? q.comp : "PL";
  const j = await fd(env, `/competitions/${c}/scorers?limit=10`, 3600);
  const s = j.scorers || [];
  if (!s.length) return `${compLabel(FD_COMPS[c])} bo'yicha to'purarlar ro'yxati hozircha yo'q.`;
  q._img = { kind: "scorers", title: FD_COMPS[c], league: FD_COMPS[c], rows: s.map((x, i) => ({ p: i + 1, n: x.player?.name || "?", t: teamName(x.team), goals: x.goals, a: x.assists || 0 })) };
  return `<b>${compLabel(FD_COMPS[c])} — to'purarlar</b>\n\n<code>${rp("#", 2)} ${rp("Gol", 3)} ${rp("As", 2)}</code> O'yinchi\n` + s.map((x, i) => `<code>${rp(i + 1, 2)} ${rp(x.goals, 3)} ${rp(x.assists || 0, 2)}</code> ${keep(x.player?.name || "?")} · ${club(teamName(x.team))}`).join("\n");
}

function imgMatch(m) {
  const ft = m.score?.fullTime || {};
  const live = m.status === "IN_PLAY" || m.status === "PAUSED";
  return { h: teamName(m.homeTeam), a: teamName(m.awayTeam), s: m.status === "FINISHED" || live ? `${ft.home ?? 0}:${ft.away ?? 0}` : "", t: tashTime(m.utcDate), st: m.status === "FINISHED" ? "" : live ? newAlpha("davom etmoqda") : m.status === "POSTPONED" ? newAlpha("qoldirildi") : m.status === "CANCELLED" ? newAlpha("bekor qilindi") : "" };
}

// natija/jadval rasmini GitHub orqali chizdirish: matn darhol, rasm 30–60 soniyadan keyin
// kanal istoriyasi: Bahtiyor akaning hisobi orqali (ub.py story rejimi), rasm 9:16 fonga joylanadi
async function storyPublish(env, imgUrl) {
  if ((await kvGet(env, "storyMode", "on")) !== "on") return false;
  if (!(await kvGet(env, "usess", null))) return false;
  const id = "st" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await kvPut(env, "ujob:" + id, { html: "", story: imgUrl, chat: env.CHANNEL, t: Date.now(), tries: 0, raw: { text: "", img: null, url: null, video: null } }, { expirationTtl: 86400 });
  return ghDispatch(env, "ubpost.yml", { job: id });
}
async function igStory(env, imgUrl) { const g = await kvGet(env, "ig", null); if (!g || !g.k || (await kvGet(env, "igMode", "on")) !== "on") return "off"; const q = (p) => new URLSearchParams({ ...p, access_token: g.k }); const j = await (await fetch(g.h + "/" + g.id + "/media", { method: "POST", body: q({ media_type: "STORIES", image_url: imgUrl }) })).json(); if (!j.id) throw new Error("media: " + JSON.stringify(j.error || j).slice(0, 200)); for (let i = 0; i < 8; i++) { await new Promise((s) => setTimeout(s, 3000)); const s = await (await fetch(g.h + "/" + j.id + "?fields=status_code&access_token=" + encodeURIComponent(g.k))).json(); if (s.status_code === "FINISHED") break; if (s.status_code === "ERROR") throw new Error("status ERROR"); } const p = await (await fetch(g.h + "/" + g.id + "/media_publish", { method: "POST", body: q({ creation_id: j.id }) })).json(); if (!p.id) throw new Error("publish: " + JSON.stringify(p.error || p).slice(0, 200)); await kvPut(env, "igLast", { t: Date.now(), id: p.id }, { expirationTtl: 30 * 86400 }); return p.id; } async function storyFromFile(env, fileId) {
  const f = await tg(env, "getFile", { file_id: fileId });
  if (!f.ok) return false;
  const b = await (await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${f.result.file_path}`)).arrayBuffer();
  const k = "st_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await env.STATE.put("lgb:" + k, b, { expirationTtl: 2 * 86400 });
  try { await igStory(env, WURL + "/lg/" + k); } catch (e) { const ad = (await getAdmins(env))[0]; if (ad) await tg(env, "sendMessage", { chat_id: ad, text: "⚠️ Instagram istoriyasi chiqmadi: " + String(e.message || e).slice(0, 300) }); } return storyPublish(env, WURL + "/lg/" + k);
}
// ---- liga jadvallari: tur tugagach ertasi kuni 11:00 da albom (istoriyaga qo'yilmaydi) ----
const TBL_COMPS = ["PL", "PD", "SA", "BL1", "FL1", "CL"];
const tblDateStr = () => { const d = tashDate(Date.now()); return d.slice(0, 4) + "-yil " + uzDay(d).split(",")[0]; };
async function standingsImg(env, c) {
  const j = await fd(env, `/competitions/${c}/standings`, 600);
  const g = (j.standings || []).find((s) => s.type === "TOTAL");
  if (!g || !g.table?.length) return null;
  const rows = g.table.map((r) => { const n = teamName(r.team); return { p: r.position, n, g: r.playedGames, w: r.won, d: r.draw, l: r.lost, gd: r.goalDifference, pts: r.points, hl: topTeam(n, r.team?.name) }; });
  const name = FD_COMPS[c];
  const md = Math.max(...rows.map((r) => r.g));
  return { fp: rows.reduce((a, r) => a + r.g, 0), img: { kind: "standings", title: UZ_COMP.has(name) ? newAlpha(name) : name, league: name, sub: newAlpha(md + "-turdan so'ng · " + tblDateStr()), groups: [{ name: "", rows }] } };
}
// comps: qaysi ligalar; onlyChanged: faqat oxirgi albomdan keyin o'zgarganlari
async function tablesPost(env, comps, chat, onlyChanged, replace) {
  const last = await kvGet(env, "tblFp", {});
  const subs = [], fps = {};
  for (const c of comps) { try { const x = await standingsImg(env, c); if (!x) continue; if (onlyChanged && last[c] && x.fp <= last[c]) continue; if (onlyChanged && !last[c]) { fps[c] = x.fp; continue; } subs.push(x.img); fps[c] = x.fp; } catch (e) {} }
  if (!subs.length) { if (Object.keys(fps).length) await kvPut(env, "tblFp", { ...last, ...fps }); return 0; }
  const cap = newAlpha((subs.length > 1 ? "Turnir jadvallari" : "Turnir jadvali") + " — " + tblDateStr() + " holatiga\n\n#TurnirJadvali");
  await tableJob(env, chat, { kind: "multi", multi: subs, fps, replace: replace || null, groups: subs.map((x) => ({ comp: x.league, rows: x.groups[0].rows })) }, cap, true);
  return subs.length;
}
async function tablesAuto(env) {
  const today = tashDate(Date.now()), now = Date.now(), cs = TBL_COMPS.join(",");
  const ms = [...(await fdMatchesOn(env, today, cs)), ...(await fdMatchesOn(env, addDays(today, 1), cs))];
  // tur hali davom etayotgan liga (hozir o'yin bor yoki 24 soat ichida o'yin bor) kutiladi
  const busy = new Set(ms.filter((m) => ["IN_PLAY", "PAUSED"].includes(m.status) || (["TIMED", "SCHEDULED"].includes(m.status) && Date.parse(m.utcDate) > now - 3 * 3600e3 && Date.parse(m.utcDate) < now + 24 * 3600e3)).map((m) => m.competition?.code));
  return tablesPost(env, TBL_COMPS.filter((c) => !busy.has(c)), env.CHANNEL, true);
}
async function tableJob(env, chat, img, cap, chan) {
  const idx = await kvGet(env, "lgidx", {});
  const names = new Set();
  if (img.league) names.add(img.league);
  for (const g of img.groups || []) { if (g.comp) names.add(g.comp); for (const m of g.items || []) { if (typeof m === "string") names.add(m); else { names.add(m.h); names.add(m.a); } } for (const r of g.rows || []) names.add(r.n); }
  for (const r of img.rows || []) names.add(r.t);
  const logos = {};
  await Promise.all([...names].map(async (n) => { const lc = (x) => String(x).toLowerCase(); const keys = Object.keys(idx); let cn = keys.find((k) => lc(k) === lc(n)); if (!cn) { const e = CLUB_EMOJI.find((c) => c[2].some((x) => lc(x) === lc(n))); if (e) cn = e[2].find((x) => keys.some((k) => lc(k) === lc(x))); } if (!cn && ESPN_FIX_LOGO[n]) cn = Object.keys(idx).find((k) => lc(k) === lc(ESPN_FIX_LOGO[n])); const u = await logoUrl(env, cn || n, idx); if (u) logos[n] = u; else if (ESPN_CREST[n]) logos[n] = ESPN_CREST[n]; }));
  const L = { pl: newAlpha("O'yin"), w: "Ğ", d: "D", l: "M", gd: "+/-", pts: newAlpha("Ochko"), goals: "Gol", player: newAlpha("O'yinchi") };
  const disp = (n) => { if (!UZ_COMP.has(n)) return n; const d = newAlpha(n); if (logos[n]) logos[d] = logos[n]; return d; };
  for (const g of img.groups || []) if (g.comp) g.comp = disp(g.comp);
  if (img.league) { img.title = disp(img.title); img.league = disp(img.league); }
  const id = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await kvPut(env, "tjob:" + id, { ...img, logos, L, chat, cap: cap || "", chan: !!chan, story: !!(chan && img.story), album: !!img.multi }, { expirationTtl: 3600 });
  return ghDispatch(env, "table.yml", { job: id });
}

async function parseSportQ(env, text) {
  const today = tashDate(Date.now());
  const prompt = `Sen futbol bo'yicha savollarni tahlil qiluvchi yordamchisan. Bugun ${today} (${UZ_WDAY[new Date(today + "T00:00:00Z").getUTCDay()]}), Toshkent vaqti.
Savol: """${text.slice(0, 500)}"""
Faqat bitta JSON obyekt qaytar, boshqa hech narsa yozma:
{"type":"matches|team_next|team_last|standings|scorers|other","date":"YYYY-MM-DD yoki null","days":1,"comp":"CL|PL|PD|BL1|SA|FL1|DED|PPL|ELC|BSA|WC|EC yoki null","team":"jamoaning inglizcha rasmiy nomi yoki null","n":1,"only":"finished|scheduled|null","unsupported":false}
Qoidalar:
- matches: ma'lum kun(lar)dagi o'yinlar yoki natijalar. "bugun" = ${today}, "kecha" = ${addDays(today, -1)}, "ertaga" = ${addDays(today, 1)}. "Oxirgi natijalar" (jamoasiz) = date ${addDays(today, -1)}, days 2, only finished. "Shu hafta oxiri" kabi oraliqlar uchun days (maks 7).
- team_next: jamoaning keyingi/eng yaqin o'yini ("qachon o'ynaydi"). team_last: jamoaning oxirgi o'yini/natijasi. n = so'ralgan o'yinlar soni (aytilmasa 1).
- standings: turnir jadvali. scorers: to'purarlar.
- Musobaqa kodlari: CL Chempionlar ligasi, PL Angliya Premyer-ligasi (APL), PD Ispaniya LaLiga, BL1 Bundesliga, SA Italiya Seriya A, FL1 Fransiya Ligue 1, DED Niderlandiya, PPL Portugaliya, ELC Angliya Championship, BSA Braziliya, WC Jahon chempionati, EC Yevropa chempionati.
- Jamoa nomini o'zbekcha yozilgan bo'lsa ham inglizcha rasmiy nomiga aylantir (Chelsi → Chelsea, Bavariya → Bayern München, Inter → Inter).
- Agar savol Yevropa ligasi, Konferensiya ligasi, O'zbekiston, Saudiya, MLS kabi ro'yxatda yo'q musobaqa haqida bo'lsa, "unsupported": true.
- Futbolga aloqasi bo'lmasa type "other".`;
  const raw = await callGemini(env, prompt, 0, Date.now() + 25000, 400, false, true);
  const m = raw.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : { type: "other" };
}

const spKb = (id) => ({ inline_keyboard: [[{ text: "✅ Chop etish", callback_data: "sp:p:" + id }], [{ text: "✏️ Tahrirlash", callback_data: "sp:e:" + id }, { text: "❌ Bekor qilish", callback_data: "sp:d:" + id }]] });
const tgRaw = async (env, method, body) => (await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
const visLen = (x) => x.replace(/<[^>]+>/g, "").replace(/[⟦⟧]/g, "").replace(/&[a-z]+;/g, "x").length;
// uzun javob: iloji bo'lsa bitta xabar, sig'masa teng qismlarga
// Telegram cheklovlari: bitta xabarda ~4096 belgi va ko'pi bilan 100 ta maxsus emoji (logotip).
// Iloji bo'lsa bitta xabar, sig'masa teng qismlarga (belgilar va logotiplar soni bo'yicha)
function splitParts(out, max = 3900, maxEmoji = 90) {
  const lines = out.split("\n"), em = (x) => (x.match(/<tg-emoji /g) || []).length;
  const total = visLen(out), E = em(out);
  const byE = E / maxEmoji > total / max; // qaysi cheklov hal qiluvchi bo'lsa, shu bo'yicha teng bo'linadi
  const k = Math.max(1, Math.ceil(total / max), Math.ceil(E / maxEmoji)), tL = total / k, tE = E / k;
  const parts = []; let cur = [], cl = 0, ce = 0;
  for (const line of lines) {
    const l = visLen(line) + 1, e = em(line);
    const over = cl + l > 4000 || ce + e > 99;
    const due = parts.length < k - 1 && (byE ? ce + e / 2 > tE : cl + l / 2 > tL);
    if (cur.length && (over || due) && line.trim() && !/^<code>\s*#/.test(line)) { parts.push(cur.join("\n").trim()); cur = []; cl = 0; ce = 0; }
    cur.push(line); cl += l; ce += e;
  }
  if (cur.length) parts.push(cur.join("\n").trim());
  return parts.filter(Boolean);
}
// kanalga chiqarish: hisob orqali (logotiplar bilan), bo'lmasa bot orqali
async function spPublish(env, sp, chat) {
  const items = sp.kind === "photo" ? [sp.cap || ""] : sp.parts;
  for (const html of items) {
    const photo = sp.kind === "photo" ? sp.file : null;
    let queued = false;
    if (await kvGet(env, "usess", null)) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await kvPut(env, "ujob:" + id, { html: newAlpha(html), html2: newAlpha(html), photo: photo ? WURL + "/ph/" + encodeURIComponent(photo) : null, chat, raw: { text: html, img: photo, url: null, video: null } }, { expirationTtl: 86400 });
      queued = await ghDispatch(env, "ubpost.yml", { job: id });
    }
    if (!queued) { const r = photo ? await sendRich(env, env.CHANNEL, html, photo) : await publish(env, html); if (!r.ok) return r; }
  }
  return { ok: true };
}

// barcha klub va ligalar ro'yxati: matn (logotiplar bilan) + rasm
async function sendCatalog(env, chat) {
  const idx = await kvGet(env, "lgidx", {}), cat = await kvGet(env, "catalog", []);
  const seen = new Set(cat.flatMap((g) => g.items));
  const groups = cat.map((g) => ({ title: g.title, items: g.items.filter((n) => n in idx) })).filter((g) => g.items.length);
  const rest = Object.keys(idx).filter((n) => !seen.has(n)).sort();
  if (rest.length) groups.push({ title: "Yangi qo'shilganlar", items: rest });
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const lines = [`<b>Barcha klublar va ligalar — ${total} ta</b>`];
  for (const g of groups) { lines.push("", `<b>${esc(g.title)} (${g.items.length})</b>`); g.items.forEach((n, i) => lines.push(`${i + 1}. ${emo(n)}${keep(n)}`)); }
  for (const p of splitParts(lines.join("\n"))) await tgRaw(env, "sendMessage", { chat_id: chat, text: newAlpha(p), parse_mode: "HTML", disable_web_page_preview: true });
  await tableJob(env, chat, { kind: "catalog", title: newAlpha(`Barcha klublar va ligalar — ${total} ta`), groups: groups.map((g) => ({ title: newAlpha(g.title), items: g.items })) }, "");
}

async function sportAnswer(env, chat, text, preset) {
  let out, lastQ = null, good = false;
  try {
    const q = preset || (await parseSportQ(env, text));
    lastQ = q;
    if (q.unsupported) out = "Bu musobaqa bo'yicha ma'lumot manbasi hozircha ulanmagan. Hozir quyidagilar bo'yicha javob bera olaman: " + Object.values(FD_COMPS).map(compLabel).join(", ") + ".";
    else if (q.type === "matches") { out = await answerMatches(env, q); good = true; }
    else if (q.type === "team_next") { out = await answerTeam(env, q, true); good = true; }
    else if (q.type === "team_last") { out = await answerTeam(env, q, false); good = true; }
    else if (q.type === "standings") { out = await answerStandings(env, q); good = true; }
    else if (q.type === "scorers") { out = await answerScorers(env, q); good = true; }
    else out = "Savolni tushunmadim. Masalan: «bugun qanday o'yinlar bor», «kechagi natijalar», «Interning keyingi o'yini qachon», «APL jadvali», «LaLiga to'purarlari».";
  } catch (e) {
    out = e.nokey ? "Natijalar manbasi kaliti (FD_KEY) hali qo'yilmagan."
      : e.limit ? "Ma'lumot manbasiga so'rovlar ko'payib ketdi. Bir daqiqadan keyin qayta so'rang."
      : e.denied ? "Bu ma'lumot bepul tarifda mavjud emas."
      : e.busy ? "Savolni tahlil qilib bo'lmadi (sun'iy intellekt band). Bir ozdan keyin qayta so'rang yoki /natija tugmalaridan foydalaning."
      : "Xato: " + esc(String(e.message || e).slice(0, 200));
  }
  const parts = splitParts(out);
  const sid = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), msgs = [];
  for (let i = 0; i < parts.length; i++) {
    const body = { chat_id: chat, text: newAlpha(parts[i]), parse_mode: "HTML", disable_web_page_preview: true };
    if (good && i === parts.length - 1) body.reply_markup = spKb(sid);
    const r = await tgRaw(env, "sendMessage", body);
    if (r.ok) msgs.push(r.result.message_id);
  }
  if (good) await kvPut(env, "sp:" + sid, { kind: "text", parts, msgs, chat }, { expirationTtl: 3 * 86400 });
  const qi = preset || lastQ;
  if (good && qi && qi._img && ((qi._img.groups || []).some((g) => (g.items || g.rows || []).length) || (qi._img.rows || []).length)) { try { await tableJob(env, chat, qi._img, parts[0].split("\n")[0]); } catch (e) {} }
}

const SPORT_KB = { inline_keyboard: [
  [{ text: "Bugungi o'yinlar", callback_data: "fd:today" }, { text: "Kechagi natijalar", callback_data: "fd:yday" }],
  [{ text: "Ertangi o'yinlar", callback_data: "fd:tmr" }, { text: "Jadvallar", callback_data: "fd:tbl" }],
] };
const TBL_KB = { inline_keyboard: [
  [{ text: "APL", callback_data: "fd:t:PL" }, { text: "LaLiga", callback_data: "fd:t:PD" }, { text: "Seriya A", callback_data: "fd:t:SA" }],
  [{ text: "Bundesliga", callback_data: "fd:t:BL1" }, { text: "Ligue 1", callback_data: "fd:t:FL1" }, { text: "Chempionlar ligasi", callback_data: "fd:t:CL" }],
  [{ text: "📋 Barchasi", callback_data: "fd:t:ALL" }],
] };

// KV yozuvlarini kuzatish (2026-11-08): har yozish/o'chirish jurnalga (console) kalit turi bilan yoziladi —
// wrangler tail orqali qaysi kalit eng ko'p yozilishini aniqlash uchun (bepul limit: kuniga 1000 yozish)
// D1 ZAXIRA (2026-11-19, Bahtiyor aka: "D1 zaxira sifatida ulash kerak, limit tugab qolmasligi uchun"): KV bepul tarifida kuniga 1000 ta yozish bor
// (17-noyabrda 1151 ga chiqib, yozuvlar yo'qolgan). Endi KV yozish/o'chirish XATO bersa (limit tugasa) — qiymat Cloudflare D1 bazasiga (env.DB, jadval kvo)
// yoziladi (D1 bepul: kuniga 100 ming yozuv). O'qishda: kalit D1 zaxirasida bo'lsa — eng yangi qiymat o'sha yerdan. Limit yangilangach (05:00 Toshkent) ovSync
// zaxiradagi qiymatlarni KV'ga qaytarib, D1 dan o'chiradi. env.DB ulanmagan bo'lsa yoki D1 ishlamasa — hammasi avvalgidek (faqat KV). Faqat matnli qiymatlar
// (1,9 MB gacha); rasm kabi ikkilik qiymatlar zaxiraga tushmaydi. Har chaqiruvda D1 ga 1 ta qisqa so'rov (zaxiradagi kalitlar ro'yxati).
function kvSpy(env) {
  if (!env || !env.STATE || env.__spy) return env;
  const S = env.STATE, DB = env.DB;
  const tag = (k) => String(k).split(/[:_]/)[0].slice(0, 24);
  let ov = null;
  const ovLoad = async () => {
    if (ov) return ov; ov = new Set(); if (!DB) return ov;
    try { const r = await DB.prepare("SELECT k FROM kvo").all(); for (const x of r.results || []) ov.add(x.k); }
    catch (e) { if (/no such table/i.test(String(e && e.message))) { try { await DB.prepare("CREATE TABLE IF NOT EXISTS kvo (k TEXT PRIMARY KEY, v TEXT, exp INTEGER, del INTEGER DEFAULT 0, t INTEGER)").run(); } catch (e2) {} } }
    return ov;
  };
  const ovPut = async (k, v, o, del) => {
    const exp = o && o.expirationTtl ? Date.now() + o.expirationTtl * 1000 : o && o.expiration ? o.expiration * 1000 : null;
    await DB.prepare("INSERT INTO kvo (k,v,exp,del,t) VALUES (?1,?2,?3,?4,?5) ON CONFLICT(k) DO UPDATE SET v=?2, exp=?3, del=?4, t=?5").bind(String(k), del ? null : v, exp, del ? 1 : 0, Date.now()).run();
    (await ovLoad()).add(String(k)); console.log("D1W " + tag(k));
  };
  const okVal = (v) => typeof v === "string" && v.length < 1900000;
  const put = async (k, v, o) => {
    console.log("KVW " + tag(k));
    if (DB && okVal(v) && (await ovLoad()).has(String(k))) { try { await ovPut(k, v, o, false); return; } catch (e) {} }  // kalit allaqachon zaxirada — eng yangi qiymat bir joyda tursin
    try { return await S.put(k, v, o); } catch (e) { if (!DB || !okVal(v)) throw e; try { await ovPut(k, v, o, false); } catch (e2) { throw e; } }
  };
  const del = async (k) => {
    console.log("KVD " + tag(k));
    try { await S.delete(k); if (DB && ov && ov.has(String(k))) { try { await DB.prepare("DELETE FROM kvo WHERE k=?1").bind(String(k)).run(); ov.delete(String(k)); } catch (e2) {} } }
    catch (e) { if (!DB) throw e; try { await ovPut(k, null, null, true); } catch (e2) { throw e; } }
  };
  const get = async (k, ...a) => {
    if (DB && (await ovLoad()).has(String(k))) {
      try { const r = await DB.prepare("SELECT v,exp,del FROM kvo WHERE k=?1").bind(String(k)).first();
        if (r) { const t = a[0] && (a[0].type || a[0]); if (r.del || (r.exp && r.exp < Date.now())) return null; if (t === "json") { try { return JSON.parse(r.v); } catch (e) { return null; } } if (!t || t === "text") return r.v; } } catch (e) {}
    }
    return S.get(k, ...a);
  };
  const st = { put, delete: del, get, list: (...a) => S.list(...a), getWithMetadata: (...a) => S.getWithMetadata(...a) };
  const e = Object.create(env); Object.defineProperty(e, "STATE", { value: st }); Object.defineProperty(e, "__spy", { value: 1 }); Object.defineProperty(e, "__ov", { value: { raw: S, put: ovPut, load: ovLoad } }); return e;
}
// zaxiradagi qiymatlarni KV'ga qaytarish (har cron ishida 15 tagacha; KV hali yozdirmasa — birinchi xatoda to'xtaydi). Kuniga bir marta adminga xabar.
async function ovSync(env) {
  const DB = env.DB; if (!DB || !env.__ov) return;
  try {
    const rows = (await DB.prepare("SELECT k,v,exp,del,t FROM kvo ORDER BY t LIMIT 15").all()).results || []; if (!rows.length) return;
    const RAW = env.__ov.raw; let n = 0;
    for (const x of rows) {
      try { if (x.del) await RAW.delete(x.k); else if (!(x.exp && x.exp < Date.now() + 60000)) await RAW.put(x.k, x.v, x.exp ? { expirationTtl: Math.max(60, Math.round((x.exp - Date.now()) / 1000)) } : undefined);
        await DB.prepare("DELETE FROM kvo WHERE k=?1 AND t=?2").bind(x.k, x.t).run(); n++; } catch (e) { break; }
    }
    console.log("D1 sync " + n + "/" + rows.length);
    if (!n) { const d = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10); if ((await kvGet(env, "ovDay", "")) !== d) { await kvPut(env, "ovDay", d); const adm = (await getAdmins(env))[0]; if (adm) await tg(env, "sendMessage", { chat_id: adm, text: "ℹ️ Xotiraga yozish kunlik limiti (1000) tugadi — bot zaxira bazaga (D1) o'tdi va to'xtamasdan ishlayapti. Limit 05:00 da yangilangach ma'lumotlar o'zi qaytariladi." }); } }
  } catch (e) { console.log("ovSync", e && e.message); }
}
export default {
    async fetch(req, env, ctx) {
    env = kvSpy(env);
    const url = new URL(req.url);
    const secret = (await sha("if-" + env.BOT_TOKEN)).slice(0, 32);

    // /setup — faqat maxfiy kalit bilan (2026-11-08): kalit = sha("setup-" + BOT_TOKEN) boshidagi 16 belgi
    if (url.pathname === "/setup") {
    if (url.searchParams.get("k") !== (await sha("setup-" + env.BOT_TOKEN)).slice(0, 16)) return new Response("forbidden", { status: 403 });
    const r = await tg(env, "setWebhook", {
    url: `${url.origin}/hook`, secret_token: secret,
    allowed_updates: ["message", "callback_query", "channel_post", "edited_channel_post"], drop_pending_updates: true,
    });
    const me = await tg(env, "getMe", {});
    for (const a of await getAdmins(env)) await showMenu(env, a, "🔄 Menyu yangilandi.");
    return new Response(
    r.ok ? `✅ Tayyor! Endi Telegram'da @${me.result?.username} botiga /start yuboring.` : "Xato: " + JSON.stringify(r),
    { headers: { "content-type": "text/plain; charset=utf-8" } }
    );
    }
        if (url.pathname === "/px" && url.searchParams.get("k") === (await sha("px-" + env.BOT_TOKEN)).slice(0, 16)) {
      const u = url.searchParams.get("u") || "";
      if (!/^https:\/\//.test(u)) return new Response("bad", { status: 400 });
      const ir = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 InterFutbolBot" } });
      const ct = ir.headers.get("content-type") || "image/jpeg";
      if (!ir.ok || !/^image\//.test(ct)) return new Response("nf", { status: 404 });
      return new Response(ir.body, { headers: { "content-type": ct, "cache-control": "public, max-age=86400" } });
    }
        if (url.pathname.startsWith("/lg/")) {
      const b = await env.STATE.get("lgb:" + decodeURIComponent(url.pathname.slice(4)), { type: "arrayBuffer" });
      const u8 = b ? new Uint8Array(b, 0, 4) : null;
      const ct = !u8 ? "image/png" : u8[0] === 0xff && u8[1] === 0xd8 ? "image/jpeg" : u8[0] === 0x52 && u8[1] === 0x49 ? "image/webp" : "image/png";
      return b ? new Response(b, { headers: { "content-type": ct, "cache-control": "public, max-age=86400" } }) : new Response("nf", { status: 404 });
    }
    // diktor/montaj fayl almashinuvi: kalit kodda yozilmaydi — sha("ds-" + BOT_TOKEN) boshidagi 24 belgi (2026-11-08)
    const dsKey = (await sha("ds-" + env.BOT_TOKEN)).slice(0, 24);
    if (url.pathname === "/dsup" && url.searchParams.get("k") === dsKey && req.method === "POST") { await env.STATE.put("dsp:" + url.searchParams.get("n"), await req.arrayBuffer(), { expirationTtl: 3 * 86400 }); return new Response("ok"); }
    if (url.pathname === "/dsget" && url.searchParams.get("k") === dsKey) { const b = await env.STATE.get("dsp:" + url.searchParams.get("n"), "arrayBuffer"); return b ? new Response(b) : new Response("", { status: 404 }); }
    if (url.pathname === "/ftres" && url.searchParams.get("k") === dsKey && req.method === "POST") { const adm = (await getAdmins(env))[0]; const cap = url.searchParams.get("cap") || ""; const buf = await req.arrayBuffer(); if (!buf.byteLength) { await tg(env, "sendMessage", { chat_id: adm, text: cap }); } else { const f = new FormData(); f.append("chat_id", String(adm)); f.append("caption", cap); f.append("title", "Inter Futbol diktor (o'qitilgan)"); f.append("audio", new Blob([buf], { type: "audio/mpeg" }), "diktor.mp3"); await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendAudio", { method: "POST", body: f }); } return new Response("ok"); }
    if (url.pathname.startsWith("/ub/")) return ubRoute(env, req, url);
    if (url.pathname.startsWith("/ph/")) {
const f = await tg(env, "getFile", { file_id: decodeURIComponent(url.pathname.slice(4)) });
if (!f.ok) return new Response("not found", { status: 404 });
const ir = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${f.result.file_path}`);
return new Response(ir.body, { status: ir.status, headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=604800" } });
}
if (url.pathname.startsWith("/dkx/")) { // vaqtinchalik kalit bilan: /dkx/file?k=&m=<xabar> — kanal faylini o'qish (20 MB gacha); /dkx/send?k=&name=&cap=&reply= — audio/faylni kanalga yuborish
      const kk = url.searchParams.get("k") || ""; if (!/^[0-9a-f]{48}$/.test(kk) || !(await kvGet(env, "dkk:" + kk, null))) return new Response("forbidden", { status: 403 });
      const tok = await kvGet(env, "dkToken", ""); if (!tok) return new Response("no bot", { status: 500 });
      if (url.pathname === "/dkx/tjob") { const j = await kvGet(env, "dkt:" + (url.searchParams.get("id") || ""), null); return new Response(JSON.stringify(j || {}), { headers: { "content-type": "application/json" } }); }
      if (url.pathname === "/dkx/tfile") { const j = await kvGet(env, "dkt:" + (url.searchParams.get("id") || ""), null); if (!j || !j.f) return new Response("not found", { status: 404 }); const gf = await dkTg(tok, "getFile", { file_id: j.f }); if (!gf.ok) return new Response("getFile: " + (gf.description || ""), { status: 502 }); return fetch(`https://api.telegram.org/file/bot${tok}/${gf.result.file_path}`); }
      if (url.pathname === "/dkx/ttsref") { const b = await env.STATE.get("ttsref:" + (url.searchParams.get("m") || "oddiy"), "arrayBuffer"); return b ? new Response(b, { headers: { "content-type": "audio/wav" } }) : new Response("", { status: 404 }); }
      if (url.pathname === "/dkx/ttslex") return new Response(JSON.stringify((await kvGet(env, "ttslex", null)) || {}), { headers: { "content-type": "application/json" } });
      if (url.pathname === "/dkx/file") {
        const m = Number(url.searchParams.get("m")); let fid = (await kvGet(env, "dka:" + m, null) || {}).f;
        if (!fid) { const fw = await dkTg(tok, "forwardMessage", { chat_id: DK_CHAT, from_chat_id: DK_CHAT, message_id: m, disable_notification: true }); const d = fw.ok && (fw.result.document || fw.result.audio || fw.result.voice); if (fw.ok) await dkTg(tok, "deleteMessage", { chat_id: DK_CHAT, message_id: fw.result.message_id }); fid = d && d.file_id; }
        if (!fid) return new Response("not found", { status: 404 });
        const gf = await dkTg(tok, "getFile", { file_id: fid }); if (!gf.ok) return new Response("getFile: " + (gf.description || ""), { status: 502 });
        const fr = await fetch(`https://api.telegram.org/file/bot${tok}/${gf.result.file_path}`); return new Response(fr.body, { status: fr.status, headers: { "content-type": "application/octet-stream" } });
      }
      if (url.pathname === "/dkx/send" && req.method === "POST") {
        const to = Number(url.searchParams.get("to")) || 0; const adm = await getAdmins(env); const dst = String(to && adm.includes(to) ? to : url.searchParams.get("dst") === "admin" ? (adm[0] || DK_CHAT) : DK_CHAT);  // namunalar ovozlar kanaliga (namuna_ nomi bilan — bazaga qo'shilmaydi); adminning bot chatiga faqat dst=admin bo'lsa  // namunalar BAZA kanaliga emas, adminning diktor boti bilan shaxsiy chatiga (bazaga aralashib, to'plamga qo'shilib ketmasin — 2026-11-19)
        const fd = new FormData(); fd.append("chat_id", dst); const cap = (url.searchParams.get("cap") || "").slice(0, 1000); if (cap) fd.append("caption", cap); const rp = Number(url.searchParams.get("reply")); if (rp) fd.append("reply_to_message_id", String(rp));
        const name = (url.searchParams.get("name") || "namuna.mp3").replace(/[^\w.\- ]+/g, "_").slice(0, 80); const isA = /\.(mp3|m4a|ogg)$/i.test(name); fd.append(isA ? "audio" : "document", new Blob([await req.arrayBuffer()], { type: isA ? "audio/mpeg" : "application/octet-stream" }), name); if (isA) fd.append("title", name.replace(/\.[a-z0-9]+$/i, ""));
        const r = await (await fetch(`https://api.telegram.org/bot${tok}/${isA ? "sendAudio" : "sendDocument"}`, { method: "POST", body: fd })).json(); return new Response(JSON.stringify({ ok: !!r.ok, m: r.ok ? r.result.message_id : 0, why: r.description || "" }), { headers: { "content-type": "application/json" } });
      }
      if (url.pathname === "/dkx/say" && req.method === "POST") { const b = await req.json().catch(() => ({})); const adm2 = await getAdmins(env); const r = await dkTg(tok, "sendMessage", { chat_id: b.to && adm2.includes(Number(b.to)) ? Number(b.to) : b.dst === "admin" ? (adm2[0] || DK_CHAT) : DK_CHAT, text: String(b.text || "").slice(0, 3500) }); return new Response(JSON.stringify({ ok: !!r.ok }), { headers: { "content-type": "application/json" } }); }
      return new Response("not found", { status: 404 });
    }
    if (url.pathname === "/vdhook" && req.method === "POST") { const tok = await kvGet(env, "vdToken", ""); if (!tok || req.headers.get("x-telegram-bot-api-secret-token") !== (await dkSecret(tok))) return new Response("forbidden", { status: 403 }); const up = await req.json(); ctx.waitUntil(vdUpdate(env, up, tok).catch(e => console.log("vd", e && e.message))); return new Response("ok"); }
    if (url.pathname === "/dkhook" && req.method === "POST") { const tok = await kvGet(env, "dkToken", ""); if (!tok || req.headers.get("x-telegram-bot-api-secret-token") !== (await dkSecret(tok))) return new Response("forbidden", { status: 403 }); const up = await req.json(); ctx.waitUntil(dkUpdate(env, up, tok).catch(e => console.log("dk", e && e.message))); return new Response("ok"); }
if (url.pathname === "/hook" && req.method === "POST") {
    if (req.headers.get("x-telegram-bot-api-secret-token") !== secret) return new Response("forbidden", { status: 403 });
    const u = await req.json();
    await onUpdate(env, u, ctx);
    return new Response("ok");
    }
    return new Response("Inter Futbol bot ishlayapti ✅", { headers: { "content-type": "text/plain; charset=utf-8" } });
    },

    async scheduled(event, env, ctx) {
    env = kvSpy(env);
    ctx.waitUntil(ovSync(env));
    await mergeCemoji(env);
    ctx.waitUntil((async () => {
    const err = async (k, e) => { try { const v = { k, t: Date.now(), e: String((e && (e.stack || e.message)) || e).slice(0, 300) }; const L = await kvGet(env, "cronLog", []); const p = L.filter((x) => x.k === k).pop(); if (p && v.t - p.t < 1800e3) return; L.push(v); await kvPut(env, "cronLog", L.slice(-40), { expirationTtl: 3 * 86400 }); await kvPut(env, "cronErr", v, { expirationTtl: 3 * 86400 }); } catch (x) {} }; const G = ({ "*/10 * * * *": "A", "2-59/10 * * * *": "B", "5-59/10 * * * *": "C" })[event.cron] || "all"; const on = (g) => G === "all" || G === g;
    let st = null;
    if (on("A")) try { st = await collect(env); } catch (e) { await err("collect", e); }
    if (on("A")) try { if ((await kvGet(env, "auto", 1)) === 1) await autoNews(env); else await sendNext(env, { st }); } catch (e) { await err("send", e); }
    if (on("B")) try { await autoResults(env); } catch (e) { await err("res", e); }
    if (on("B")) try { await lineupsAuto(env); } catch (e) { await err("lu", e); } if (on("B")) try { await hookWatch(env); } catch (e) { await err("hook", e); } if (on("C")) try { const ad = tashDate(Date.now()); if (tashHour() === 23 && (await kvGet(env, "auditDay", "")) !== ad) { await kvPut(env, "auditDay", ad, { expirationTtl: 3 * 86400 }); await dailyAudit(env); } } catch (e) { await err("audit", e); }
    if (on("C")) try { const xm = await kvGet(env, "fixMode", "off"); const xd = tashDate(Date.now()); if (xm !== "off" && (tashHour() === 9 || tashHour() === 10) && (await kvGet(env, "fixDay", "")) !== xd && (await autoOn(env))) { await kvPut(env, "fixDay", xd, { expirationTtl: 3 * 86400 }); try { await fixturesRun(env, xm !== "on"); } catch (e) { const ft = (await kvGet(env, "fixTry", {}))[xd] || 0; if (ft < 5) { await kvPut(env, "fixTry", { [xd]: ft + 1 }, { expirationTtl: 86400 }); await kvPut(env, "fixDay", "", { expirationTtl: 3 * 86400 }); } throw e; } } } catch (e) { await err("fix", e); }
    if (on("C")) try { const ld = tashDate(Date.now()), lh = tashHour(); if ((lh === 12 || lh === 13) && (await kvGet(env, "legMode", "on")) !== "off" && (await kvGet(env, "legDay", "")) !== ld && (await autoOn(env))) { await kvPut(env, "legDay", ld, { expirationTtl: 3 * 86400 }); let r; try { r = await afsonaRun(env); } catch (e) { r = e; } if (!/^ok/.test(String(r))) { const t = (await kvGet(env, "legTry", {}))[ld] || 0; if (t < 4) { await kvPut(env, "legTry", { [ld]: t + 1 }, { expirationTtl: 86400 }); await kvPut(env, "legDay", "", { expirationTtl: 3 * 86400 }); } if (r instanceof Error) throw r; } } } catch (e) { await err("afsona", e); }
    if (on("C")) try { const ud = tashDate(Date.now()), uh = tashHour(); if ((uh === 15 || uh === 16) && (await kvGet(env, "uzfMode", "on")) !== "off" && (await kvGet(env, "uzfDay", "")) !== ud && (await autoOn(env))) { await kvPut(env, "uzfDay", ud, { expirationTtl: 3 * 86400 }); let r; try { r = await uzFactRun(env); } catch (e) { r = e; } if (!/^ok/.test(String(r))) { const t = (await kvGet(env, "uzfTry", {}))[ud] || 0; if (t < 5) { await kvPut(env, "uzfTry", { [ud]: t + 1 }, { expirationTtl: 86400 }); await kvPut(env, "uzfDay", "", { expirationTtl: 3 * 86400 }); } if (r instanceof Error) throw r; } } } catch (e) { await err("uzfact", e); }
    if (on("C")) try { const fm = await kvGet(env, "factMode", "off"); const fdy = tashDate(Date.now()); if (fm !== "off" && (tashHour() === 20 || tashHour() === 21) && (await kvGet(env, "factDay", "")) !== fdy && (await autoOn(env))) { await kvPut(env, "factDay", fdy, { expirationTtl: 3 * 86400 }); let fr; try { fr = await factRun(env, fm !== "on"); } catch (e) { fr = e; } if (fr === "none" || fr instanceof Error) { const ft = (await kvGet(env, "factTry", {}))[fdy] || 0; if (ft < 5) { await kvPut(env, "factTry", { [fdy]: ft + 1 }, { expirationTtl: 86400 }); await kvPut(env, "factDay", "", { expirationTtl: 3 * 86400 }); } if (fr instanceof Error) throw fr; } } } catch (e) { await err("fact", e); }
    if (on("C")) try { const hm = await kvGet(env, "histMode", "off"); const hd = tashDate(Date.now()); if (hm !== "off" && (tashHour() === 10 || tashHour() === 11) && (await kvGet(env, "histDay", "")) !== hd && (await autoOn(env))) { await kvPut(env, "histDay", hd, { expirationTtl: 3 * 86400 }); let hr; try { hr = await histRun(env, hm !== "on"); } catch (e) { hr = e; } if (hr instanceof Error || /^err/.test(String(hr))) { const ht = (await kvGet(env, "histTry", {}))[hd] || 0; if (ht < 5) { await kvPut(env, "histTry", { [hd]: ht + 1 }, { expirationTtl: 86400 }); await kvPut(env, "histDay", "", { expirationTtl: 3 * 86400 }); } if (hr instanceof Error) throw hr; } } } catch (e) { await err("hist", e); }
    if (on("C")) try { const tdy = tashDate(Date.now()); if ((await kvGet(env, "tblMode", "on")) !== "off" && tashHour() === 11 && (await kvGet(env, "tblDay", "")) !== tdy && (await autoOn(env))) { await kvPut(env, "tblDay", tdy, { expirationTtl: 3 * 86400 }); await tablesAuto(env); } } catch (e) { await err("tbl", e); }
    if (on("C") && new Date().getUTCMinutes() % 30 < 10) try { if (await autoOn(env)) await previewAuto(env); } catch (e) { await err("preview", e); } // yarim soatda bir — football-data so'rov chegarasini tejash
    if (on("C")) try { const xd = tashDate(Date.now()), hh = tashHour(); if (await autoOn(env)) {
      if (hh === 13 && [0, 4].includes(new Date(xd + "T00:00:00Z").getUTCDay()) && (await kvGet(env, "statDay", "")) !== xd) { await kvPut(env, "statDay", xd, { expirationTtl: 3 * 86400 }); await statsPost(env); }
      if (hh === 15 && (await kvGet(env, "scDay", "")) !== xd) { await kvPut(env, "scDay", xd, { expirationTtl: 3 * 86400 }); await scorersAuto(env); }
      if (hh === 7) await fmWatch(env);
      if (hh === 4 && (await kvGet(env, "emojiDay", "")) !== xd) { const q = await kvGet(env, "emojiNeed", []); if (q.length) { await kvPut(env, "emojiDay", xd, { expirationTtl: 3 * 86400 }); await ghDispatch(env, "emojiadd.yml", {}); } }
      if (hh === 11 && new Date(xd + "T00:00:00Z").getUTCDay() === 1 && (await kvGet(env, "ideaGenDay", "")) !== xd) { await kvPut(env, "ideaGenDay", xd, { expirationTtl: 3 * 86400 }); await ideaGen(env); }
      if (hh === 18 && (await kvGet(env, "ideaDay", "")) !== xd) { await kvPut(env, "ideaDay", xd, { expirationTtl: 3 * 86400 }); await ideaApply(env); }
      if (hh === 12 && (await kvGet(env, "lgwDay", "")) !== xd) { await kvPut(env, "lgwDay", xd, { expirationTtl: 3 * 86400 }); await legionWeekly(env); }
      if (hh === 23 && (await kvGet(env, "engDay", "")) !== xd) { await kvPut(env, "engDay", xd, { expirationTtl: 3 * 86400 }); await engCollect(env); if (new Date(xd + "T00:00:00Z").getUTCDay() === 0) await engReport(env); }
    } } catch (e) { await err("extra", e); }
    if (on("B")) try { await resFallback(env); } catch (e) { await err("resfb", e); }
    if (on("B")) try { await repSweep(env); } catch (e) { await err("repsw", e); }
    if (on("B")) try { await ujobSweep(env); } catch (e) { await err("usweep", e); }
    if (on("B")) try { await redoTick(env); } catch (e) { await err("redoq", e); }
    if (on("A")) try { await sendNext(env, { st, kind: "v" }); } catch (e) { await err("sendv", e); }
    if (on("A")) try { await fillPending(env); } catch (e) {}
    if (on("A")) try { await fillArticles(env); } catch (e) { await err("fill", e); } if (on("A")) try { await newsWatch(env); } catch (e) { await err("watch", e); } if (on("C")) try { await healthCheck(env); } catch (e) { await err("health", e); }
    })());
    },
    };
