# POST RASMINI WIKIMEDIA COMMONS FAYLIDAN TIKLASH (2026-11-16, 300-post): post rasmi shu surat bilan qayta chiziladi
# (sarlavhasiz suratli karta, chetlar qoraytirilmaydi). Faqat erkin litsenziya; muallif yozuvi post matniga qo'shiladi. Bazaga hech narsa yozilmaydi.
import json, os, re, sys
import requests
from stadium import commons, W, H, UA

fname, post, wm = os.environ["FILE"], os.environ["POST"], os.environ.get("WM", "")
c = commons(fname)
if not c or not post.isdigit():
    print("- litsenziya mos emas, fayl topilmadi yoki post raqami xato:", fname); sys.exit(1)
r = requests.get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "format": "json", "titles": "File:" + fname, "prop": "imageinfo", "iiprop": "url|size", "iiurlwidth": 2560}, headers=UA, timeout=40).json()
ii = next(iter(r["query"]["pages"].values()))["imageinfo"][0]
url = ii.get("thumburl") or ii["url"]
cr = re.sub(r"^(User:)?", "", c["art"]).strip()
credit = f"Foto: {cr}, {c['lic']}, Wikimedia Commons"
print("surat:", url, ii.get("width"), ii.get("height"), "|", credit)
print("post:", requests.post(W + "/ub/rasm", headers={**H, "content-type": "application/json"}, data=json.dumps({"id": int(post), "face": url, "credit": credit, "wm": "tr" if wm == "tr" else "", "sr": 1 if os.environ.get("SHARP") else 0}), timeout=60).text[:120])
