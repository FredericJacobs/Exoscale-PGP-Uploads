#!/usr/bin/env python
import SimpleHTTPServer
import SocketServer
import base64
import hmac
import hashlib
from requestsigner import AwsV2Auth
from urlparse       import urlparse
from time           import time

KEY = "XXX"
SECRET = "XXX"
BUCKET = "XXX"
HOST = "sos.exo.io"

class TokenRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not "/token/" in self.path:
            return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

        query = urlparse(self.path).query
        query_components = dict(qc.split("=") for qc in query.split("&"))
        ct = query_components["contentType"]


        key = base64.b32encode(hmac.new(str(time()), "1", hashlib.sha512).digest())[0:30]
        url = 'https://' + HOST + '/' + BUCKET + '/' + key
        auth = AwsV2Auth(KEY, SECRET)
        signed_url = auth.pre_sign(url, method='PUT', headers={'Content-Type': ct})

        self.send_response(200)
        self.send_header('Content-Type','text/plain');
        self.end_headers()
        self.wfile.write(signed_url);
        return

Handler = TokenRequestHandler
server = SocketServer.TCPServer(('0.0.0.0', 8080), Handler)

server.serve_forever()
