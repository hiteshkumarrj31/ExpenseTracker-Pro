with open("sw.js", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "pages/" in line and not ".html" in line and not "caches.match" in line:
        continue # skip extensionless entries
    new_lines.append(line)

content = "".join(new_lines)
# Bump cache version
content = content.replace("etp-v2", "etp-v3")

# Add rewrite logic to fetch
fetch_rewrite = """
  if (sameOrigin) {
    let cacheKey = request;
    if (url.pathname.includes('/pages/') && !url.pathname.endsWith('.html') && !url.pathname.endsWith('/')) {
       cacheKey = new Request(url.pathname + '.html');
    }
    // Cache-first for our own app shell files
    event.respondWith(
      caches.match(cacheKey).then((cached) => {
"""

content = content.replace("""
  if (sameOrigin) {
    // Cache-first for our own app shell files
    event.respondWith(
      caches.match(request).then((cached) => {""", fetch_rewrite)

with open("sw.js", "w") as f:
    f.write(content)
