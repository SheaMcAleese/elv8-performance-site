import functools
import http.server
import socketserver

SITE = "/Users/sheamcaleese/Library/CloudStorage/Dropbox/ELV8 - Claude/website/elv8-site"
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=SITE)
with socketserver.TCPServer(("", 8778), handler) as httpd:
    httpd.allow_reuse_address = True
    print("serving on 8778")
    httpd.serve_forever()
