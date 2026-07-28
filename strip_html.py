import glob
import re
import os

pages = [os.path.basename(p) for p in glob.glob("pages/*.html")]
names = [p.replace('.html', '') for p in pages]

def process_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()
    
    # Replace index links
    content = content.replace('href="../index.html"', 'href="../"')
    content = content.replace('href="index.html"', 'href="./"')
    
    # Replace page links
    for name in names:
        content = re.sub(rf'href="{name}\.html"', f'href="{name}"', content)
        content = re.sub(rf'href="pages/{name}\.html"', f'href="pages/{name}"', content)
        content = re.sub(rf"location\.href = '{name}\.html'", f"location.href = '{name}'", content)
        content = re.sub(rf"location\.href = 'pages/{name}\.html'", f"location.href = 'pages/{name}'", content)

    # Make sure we add PWA redirect to index.html if it's index
    if filepath == "index.html" and "isStandalone" not in content:
        script = """
  <!-- Standalone App Redirect -->
  <script>
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || (window.Capacitor && window.Capacitor.isNative);
    if (isStandalone) {
      window.location.replace('pages/dashboard');
    }
  </script>
"""
        content = content.replace("</head>", f"{script}</head>")

    with open(filepath, "w") as f:
        f.write(content)

process_file("index.html")
for page in glob.glob("pages/*.html"):
    process_file(page)

# Add Interceptor to app.js
interceptor = """
// Intercept clicks on links without .html for Capacitor / Local File protocol
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href && !href.startsWith('http') && !href.startsWith('#') && !href.endsWith('/') && !href.endsWith('.html')) {
    const isCapacitorOrLocal = location.protocol === 'file:' || (window.Capacitor && window.Capacitor.isNative);
    if (isCapacitorOrLocal) {
      e.preventDefault();
      window.location.href = href + '.html';
    }
  }
});
"""
with open("js/app.js", "r") as f:
    app_js = f.read()
if "isCapacitorOrLocal" not in app_js:
    with open("js/app.js", "a") as f:
        f.write(f"\n{interceptor}\n")

# Update manifest.json
with open("manifest.json", "r") as f:
    man = f.read()
man = man.replace('"./pages/dashboard.html"', '"./pages/dashboard"')
with open("manifest.json", "w") as f:
    f.write(man)

# Update sw.js caching - cache both the .html and the extensionless route so it works offline
with open("sw.js", "r") as f:
    sw = f.read()
for name in names:
    sw = sw.replace(f"'./pages/{name}.html',", f"'./pages/{name}.html',\n  './pages/{name}',")
sw = sw.replace("caches.match('./pages/dashboard.html')", "caches.match('./pages/dashboard')")
with open("sw.js", "w") as f:
    f.write(sw)

print("HTML extensions stripped.")
