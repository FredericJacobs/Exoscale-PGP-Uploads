import base64
import hashlib
import hmac
import time

from datetime    import datetime
from urlparse    import urlparse
from email.utils import quote
from urllib      import urlencode

from requests.auth import AuthBase

class AwsV2Auth(AuthBase):
    def __init__(self, key, secret, presigned_ttl=3600):
        self.key = key
        self.secret = secret
        self.presigned_ttl = presigned_ttl

    def __call__(self, request):
        date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
        request.headers['x-amz-date'] = date
        signature = self.sign(request.method, request.url, request.headers)
        request.headers['Authorization'] = 'AWS {0}:{1}'.format(self.key,
                                                                signature)
        return request

    def sign(self, method, url, headers, expires=None):
        parsed = urlparse(url)
        path = parsed.path
        sig_headers = sorted([[k.lower(), v]
                              for k, v in headers.items()
                              if k.lower().startswith('x-amz-')],
                             key=lambda i: i[0])
        sig_headers = "\n".join((
            ":".join((key, value))
            for key, value in sig_headers
        ))
        parts = [method,
                 headers.get('Content-MD5', ''),
                 headers.get('Content-Type', ''),
                 # date provided in x-amz-date if not from Expires
                 str(expires) if expires is not None else ""]
        if sig_headers:
            parts.append(sig_headers)
        parts.append(quote(path))

        string_to_sign = "\n".join(parts)
        return base64.b64encode(hmac.new(
            self.secret.encode(),
            string_to_sign.encode(),
            digestmod=hashlib.sha1,
        ).digest()).decode()

    def pre_sign(self, url, method='GET', headers=None, expires=None):
        if expires is None:
            expires = int(time.time()) + self.presigned_ttl
        if headers is None:
            headers = {}
        sig = self.sign(method, url, headers, expires)
        qs = urlencode({'Expires': expires,
                        'Signature': sig,
                        'AWSAccessKeyId': self.key})
        return '{0}?{1}'.format(url, qs)
