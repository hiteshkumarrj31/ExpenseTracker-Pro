import glob
import os

# 1. Update js/pwa.js
with open("js/pwa.js", "r") as f:
    pwa = f.read()

pwa = pwa.replace("const isRoot = location.pathname.endsWith('ExpenseTracker-Pro/') || location.pathname === '/' || location.pathname.endsWith('index.html');", "const inPagesDir = location.pathname.includes('/pages/');")
pwa = pwa.replace("const swUrl = isRoot ? './sw.js' : '../sw.js';", "const swUrl = inPagesDir ? '../sw.js' : './sw.js';")
pwa = pwa.replace("const scope = isRoot ? './' : '../';", "const scope = inPagesDir ? '../' : './';")

with open("js/pwa.js", "w") as f:
    f.write(pwa)

# 2. Inject meta tags and script into HTML files
def inject_pwa(filepath, is_root):
    with open(filepath, "r") as f:
        content = f.read()

    manifest_href = "manifest.json" if is_root else "../manifest.json"
    pwa_src = "js/pwa.js" if is_root else "../js/pwa.js"

    # Inject in head
    head_injection = f"""
<link rel="manifest" href="{manifest_href}">
<meta name="theme-color" content="#2563EB">
<link rel="apple-touch-icon" href="{"assets/favicon/icon-192.png" if is_root else "../assets/favicon/icon-192.png"}">
"""
    if "rel=\"manifest\"" not in content:
        content = content.replace("</head>", f"{head_injection}</head>")

    # Inject in body
    script_injection = f'<script src="{pwa_src}"></script>\n'
    if "pwa.js" not in content:
        content = content.replace("</body>", f"{script_injection}</body>")

    with open(filepath, "w") as f:
        f.write(content)

inject_pwa("index.html", True)
for page in glob.glob("pages/*.html"):
    inject_pwa(page, False)

print("PWA tags injected successfully.")
