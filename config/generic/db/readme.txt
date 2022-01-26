to connect directly to db:

1. exec into db container (e.g. `kubectl exec -it [db container name] -n [db namespace] -- /bin/bash`)
2. get db credentials. NB: if getting password from secret: `kubectl get secrets/[secret name] --template="{{.data.password}}" -n [db namespace] | base64 --decode`
3. connect to db: `mongo --host 127.0.0.1:27017 --tls --username [username] --password [password] --authenticationDatabase [admin db] --sslAllowInvalidCertificates`
