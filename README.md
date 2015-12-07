# LAMBDA LOCAL SERVER

- creates a local server to allow calls to lambda functions created by JAWS

## how to run

- place these files into your project
- update certificate data
- run node-server

```
/usr/local/bin/node lambda-server.js
```

- https://localhost:8888/<stage>/<pathname>

## prequisites

- jaws-framework@1.3.x --> https://github.com/jaws-framework/JAWS
- use your https certificate or create a self signed certificate
-- http://stackoverflow.com/questions/10175812/how-to-create-a-self-signed-certificate-with-openssl