import re
ONES=["nol","bir","ikki","uch","to'rt","besh","olti","yetti","sakkiz","to'qqiz"]
TENS=["","o'n","yigirma","o'ttiz","qirq","ellik","oltmish","yetmish","sakson","to'qson"]
def card(n):
    n=int(n)
    if n<10: return ONES[n]
    if n<100: return (TENS[n//10]+(" "+ONES[n%10] if n%10 else ""))
    if n<1000: return ((ONES[n//100]+" " if n//100>1 else "bir ")+"yuz"+(" "+card(n%100) if n%100 else ""))
    if n<1_000_000: return (card(n//1000)+" ming"+(" "+card(n%1000) if n%1000 else ""))
    return card(n//1_000_000)+" million"+(" "+card(n%1_000_000) if n%1_000_000 else "")
def ordw(n):
    w=card(n); return w+("nchi" if w[-1] in "aeiou" else "inchi")
def score(a,b):
    w=card(a); return w+("yuv" if w[-1] in "aeiou" else "uv")+" "+card(b)
def norm(t):
    t=t.replace("‘","'").replace("’","'").replace("ʻ","'").replace("ʼ","'").replace("“","").replace("”","").replace("«","").replace("»","").replace("—",",")
    t=re.sub(r"\b(XIX|XX|XXI)(-| )asr", lambda m: {"XIX":"o'n to'qqizinchi","XX":"yigirmanchi","XXI":"yigirma birinchi"}[m[1]]+" asr", t)
    t=re.sub(r"\b1/(2|4|8|16) final", lambda m: {"2":"yarim","4":"chorak","8":"sakkizdan bir","16":"o'n oltidan bir"}[m[1]]+" final", t)
    t=re.sub(r"\b(\d{1,2}):(\d{1,2})\b", lambda m: score(m[1],m[2]), t)
    t=re.sub(r"\b(\d+)-(yil|yoshli|daqiqa|o'rin|tur|hafta|marta|yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)", lambda m: ordw(m[1])+" "+m[2] if m[2]!="yoshli" else card(m[1])+" yoshli", t)
    t=re.sub(r"\b(\d+)-(?=[A-Za-z'])", lambda m: ordw(m[1])+" ", t)
    t=re.sub(r"\b(\d+)[,.](\d)\b(?![,.]\d)(%?)", lambda m: card(m[1])+" butun o'ndan "+card(m[2])+(" foiz" if m[3] else ""), t)
    t=re.sub(r"\b(\d+)%", lambda m: card(m[1])+" foiz", t)
    t=re.sub(r"\b(\d+)(?=[a-z])", lambda m: card(m[1]), t)
    t=re.sub(r"\b\d+\b", lambda m: card(m[0]), t)
    return re.sub(r"\s+"," ",t).strip()
if __name__=="__main__":
    for s in ["2:1","3:0","2013-yilda","18-yoshli","2025-yil 29-mart kuni","70%","716 sprint"]: print(s,"->",norm(s))
