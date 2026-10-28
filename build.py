#!/usr/bin/env python3
"""Compila ASCENSO 3.0 en un único HTML (para artefacto o para abrir sin servidor).
Lee el orden de <script src> de index.html y lo incrusta todo. Las imágenes se incrustan (en WebP sin pérdida si pesa menos y decodifica idéntico; si no, PNG); los efectos de sonido se incrustan; la música se lee de assets/audio/music/ (no se incrusta: era 16 MB de HTML).
Uso: python3 tools/build.py [--sin-nube]   (--sin-nube quita el SDK de Supabase del HTML compilado)"""
import os, glob, base64, json, re, sys, io
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
source_html = 'tools/plantilla.html'
html = open(source_html, encoding='utf-8').read()
css = open('css/style.css', encoding='utf-8').read()
no_cloud = '--sin-nube' in sys.argv
if no_cloud:
    html = re.sub(r'\n<!-- SDK oficial[^\n]*\n<script src="https://cdn[^"]+"></script>', '', html)
srcs = [x.split('?')[0] for x in re.findall(r'<script src="(js/[^"]+)"></script>', html)]   # sin ?v= de caché
js = '\n'.join(open(f, encoding='utf-8').read() for f in srcs)
# minificación sin cambiar el comportamiento: se conservan los nombres de funciones y clases (los usa el juego)
TERSER = '/home/claude/work/tools_min/node_modules/terser/bin/terser'
if os.path.exists(TERSER) and not os.environ.get('SIN_MINIFICAR'):
    import subprocess
    r = subprocess.run(['node', TERSER, '--compress', '--mangle', '--keep-fnames', '--keep-classnames'], input=js, capture_output=True, text=True)
    if r.returncode == 0 and r.stdout.strip(): js = r.stdout

assets = {}
def img_payload(f):
    """WebP sin pérdida si decodifica IGUAL píxel a píxel y pesa menos; si no, el archivo original."""
    raw = open(f, 'rb').read()
    if f.endswith('.jpg'): return 'image/jpeg', raw
    if os.environ.get('SIN_WEBP'): return 'image/png', raw
    try:
        src = Image.open(io.BytesIO(raw)).convert('RGBA')
        buf = io.BytesIO(); src.save(buf, format='WEBP', lossless=True, exact=True, method=6)
        wb = buf.getvalue()
        if np.array(src)[..., 3].min() < 255: return 'image/png', raw
        back = np.array(Image.open(io.BytesIO(wb)).convert('RGBA'))
        if back.shape == np.array(src).shape and np.array_equal(back, np.array(src)) and len(wb) < len(raw):
            return 'image/webp', wb
    except Exception:
        pass
    return 'image/png', raw
for f in sorted(glob.glob('assets/img/**/*.png', recursive=True) + glob.glob('assets/img/**/*.jpg', recursive=True)):
    key = os.path.relpath(f, 'assets/img').replace(os.sep, '/')
    mime, payload = img_payload(f)
    assets[key] = 'data:' + mime + ';base64,' + base64.b64encode(payload).decode()
audio = {}
for kind in ['sfx']:   # solo efectos: la música NO se incrusta (va en assets/audio/music/ junto al HTML)
    for f in sorted(glob.glob(f'assets/audio/{kind}/*')):
        if not f.lower().endswith(('.ogg', '.mp3', '.wav')): continue
        ext = f.rsplit('.', 1)[-1].lower()
        mime = {'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg'}.get(ext, 'audio/mpeg')
        audio[f'{kind}/{os.path.basename(f)}'] = f'data:{mime};base64,' + base64.b64encode(open(f, 'rb').read()).decode()
inject = 'window.ASSETS = ' + json.dumps(assets) + ';\nwindow.AUDIO_FILES = ' + json.dumps(audio) + ';\n'
css = re.sub(r"url\(['\"]?\.\./assets/img/([^'\")]+)['\"]?\)", lambda m: 'url(data:image/png;base64,' + base64.b64encode(open('assets/img/' + m.group(1), 'rb').read()).decode() + ')', css)
html = re.sub(r'<link rel="stylesheet" href="css/style\.css[^"]*">', lambda _m: '<style>\n' + css + '\n</style>', html)
html = re.sub(r'<script src="js/[^"]+"></script>\n?', '', html)
html = html.replace('<script src="js/config.js"></script>', '')
html = html.replace('</body>', '<script>\n' + inject + js + '\n</script>\n</body>')
out = 'dist/ascenso-sin-nube.html' if no_cloud else 'dist/ascenso.html'
html = html.replace('</head>', '<link rel="manifest" href="manifest.json">\n<meta name="theme-color" content="#1f3a24">\n<link rel="icon" href="icon-192.png">\n</head>', 1)
html = html.replace('</body>', '<script>if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(function () {});</script>\n</body>', 1)
os.makedirs('dist', exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print(f"listo: {out} ({os.path.getsize(out)/1048576:.2f} MB, {len(assets)} imágenes, {len(audio)} audios, {len(srcs)} módulos)")
import hashlib, shutil
ver = hashlib.sha1(open(out, 'rb').read()).hexdigest()[:12]
shutil.copy(out, 'dist/index.html')
open('dist/sw.js', 'w', encoding='utf-8').write(open('tools/sw_template.js', encoding='utf-8').read().replace('__VERSION__', ver))
for f in ['manifest.json', 'icon-192.png', 'icon-512.png']: shutil.copy('pwa/' + f, 'dist/' + f)
print('sin conexión lista: versión', ver)
