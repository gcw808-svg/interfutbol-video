# Inter Futbol: SURATDAGI ODAMLARNI TOPISH (2026-11-10). YOLOX-tiny (Megvii, Apache-2.0; models/yolox_tiny.onnx, onnxruntime, CPU) —
# faqat "odam gavdasi" ramkalarini beradi; yuzni tanimaydi, kimligini bilmaydi (kimligi doim izoh matni va formadagi yozuvdan).
# main_person(im) -> (asosiy odam ramkasi [x0,y0,x1,y1] 0..1 yoki None, yirik odamlar soni)
import os

import numpy as np
from PIL import Image

_S = {}
SIZE = 416


def _sess():
    if "s" not in _S:
        import onnxruntime as ort
        _S["s"] = ort.InferenceSession(os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "yolox_tiny.onnx"), providers=["CPUExecutionProvider"])
    return _S["s"]


def detect(im, thr=0.35):
    w, h = im.size
    r = min(SIZE / w, SIZE / h)
    rs = im.convert("RGB").resize((max(1, int(w * r)), max(1, int(h * r))), Image.BILINEAR)
    pad = np.full((SIZE, SIZE, 3), 114, dtype=np.float32)
    pad[:rs.height, :rs.width] = np.asarray(rs, dtype=np.float32)[:, :, ::-1]  # BGR, 0..255
    o = _sess().run(None, {_sess().get_inputs()[0].name: pad.transpose(2, 0, 1)[None]})[0][0]
    grids, strides = [], []
    for s in (8, 16, 32):
        n = SIZE // s
        xv, yv = np.meshgrid(np.arange(n), np.arange(n))
        grids.append(np.stack((xv, yv), 2).reshape(-1, 2)); strides.append(np.full((n * n, 1), s))
    g, st = np.concatenate(grids), np.concatenate(strides)
    xy, wh = (o[:, :2] + g) * st, np.exp(o[:, 2:4]) * st
    sc = o[:, 4] * o[:, 5]  # obyekt × "person" sinfi
    k = sc > thr
    b = np.concatenate([xy[k] - wh[k] / 2, xy[k] + wh[k] / 2], 1) / r
    sc = sc[k]
    keep = []
    for i in np.argsort(-sc):  # NMS
        ok = True
        for j in keep:
            ix = max(0, min(b[i, 2], b[j, 2]) - max(b[i, 0], b[j, 0])) * max(0, min(b[i, 3], b[j, 3]) - max(b[i, 1], b[j, 1]))
            u = (b[i, 2] - b[i, 0]) * (b[i, 3] - b[i, 1]) + (b[j, 2] - b[j, 0]) * (b[j, 3] - b[j, 1]) - ix
            if ix / max(u, 1e-6) > 0.5:
                ok = False; break
        if ok:
            keep.append(i)
    return [(float(max(0, b[i, 0])), float(max(0, b[i, 1])), float(min(w, b[i, 2])), float(min(h, b[i, 3])), float(sc[i])) for i in keep]


def main_person(im):
    w, h = im.size
    best, cand = None, []
    for x0, y0, x1, y1, s in detect(im):
        bw, bh = x1 - x0, y1 - y0
        if bw < w * 0.06 or bh < h * 0.15:
            continue
        cx = (x0 + x1) / 2 / w
        side = (x0 <= w * 0.01 and x1 < w * 0.5) or (x1 >= w * 0.99 and x0 > w * 0.5)  # chetdan kesilib kirgan odam
        score = bw * bh * (1 - 0.9 * abs(cx - 0.5)) * (0.45 if side else 1) * (0.6 + 0.4 * s)
        cand.append((score, bw * bh, side, (x0, y0, x1, y1)))
    if not cand:
        return None, 0
    cand.sort(key=lambda c: -c[0])
    best = cand[0]
    # "yirik odam": asosiy odam maydonining kamida 45% i va chetdan kesilmagan
    n = 1 + sum(1 for c in cand[1:] if c[1] >= best[1] * 0.45 and not c[2])
    x0, y0, x1, y1 = best[3]
    return [round(x0 / w, 3), round(y0 / h, 3), round(x1 / w, 3), round(y1 / h, 3)], n


def analyse(im):
    # (asosiy odam ramkasi, yirik odamlar soni, chetdan kesilib kirgan begona odamlar ramkalari — kartada kadrdan chiqariladi)
    w, h = im.size
    box, n = main_person(im)
    ex = []
    if box:
        mcx = (box[0] + box[2]) / 2 * w
        for x0, y0, x1, y1, s in detect(im, 0.25):
            edge = x0 <= w * 0.012 or x1 >= w * 0.988
            if edge and (y1 - y0) >= h * 0.25 and not (x0 < mcx < x1) and (x1 - x0) < w * 0.4:
                ex.append([round(x0 / w, 3), round(y0 / h, 3), round(x1 / w, 3), round(y1 / h, 3)])
    return box, n, ex[:2]
