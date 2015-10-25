# Exoscale CORS Upload with PGP

This is a sample project to show issues of CORS uploads in FireFox with Exoscale. DO NOT USE ANY OF THIS CODE IN PRODUCTION.

## Instructions

- 1) Sign up and make a bucket on Exoscale's portal.
- 2) Setup `backend/backend-server` with bucket, API Key and secret.
- 3) Setup CORS configuration:
```
<?xml version="1.0" ?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>WHATEVER OTHER DOMAIN YOU WANT TO TRY</AllowedOrigin>
    <AllowedOrigin>http://localhost:8080</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedHeader>Authorization</AllowedHeader>
    <AllowedHeader>Content-Type</AllowedHeader>
    <AllowedHeader>Host</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```
- 4) Launch terminal at root of the repository and run `python backend/backend-server.py`
- 5) Open browser at `http://localhost:8080/client/test.html` in Chrome and upload a file
- 6) The console doesn't report any CORS errors and the file should be in your bucket.
- 7) Do the same in FireFox, and notice the following CORS issue in the console `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://sos.exo.io/XXXX. (Reason: CORS header 'Access-Control-Allow-Origin' missing).`

Adding `<AllowedHeader>Access-Control-Allow-Origin</AllowedHeader>` to configuration doesn't help.
