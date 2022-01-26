export $(cat .env | xargs)
kubectl config set-context --current --namespace=$DB_NAMESPACE
# ---------------------------------------------- #
echo "=> generating certificate and key for DB servers' tls (signed by service CA)..."
sed -e 's|DB_NAMESPACE|'"${DB_NAMESPACE}"'|g' ./objects/certificates/db-cert.yaml | sed -e 's|DB_NAME|'"${DB_NAME}"'|g' - | sed -e 's|DB_SECRET|'"${DB_SECRET}"'|g' - | kubectl create -f -
sleep 5
kubectl get certificate
sleep 3
kubectl describe certificate db
kubectl describe secret $DB_SECRET
# ---------------------------------------------- #
echo "=> making queue's CA cert available to servers..."
kubectl create configmap db-cert --from-literal=ca.crt="$(kubectl get secret $DB_SECRET -o json | jq -r '.data."ca.crt"' | base64 -d)"
# ---------------------------------------------- #
echo "=> setting up db rbac..."
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/rbac/role_database.yaml
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/rbac/role_binding_database.yaml
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/rbac/service_account_database.yaml
kubectl logs deployment/mongodb-kubernetes-operator
sleep 5
# ---------------------------------------------- #
echo "=> creating user..."
USERNAME="u"$(echo $RANDOM | md5sum | head -c 10)
PASSWORD=$(echo $RANDOM | md5sum | head -c 10)
kubectl create secret generic $MONGO_PASSWORD_SECRET --from-literal="password=${PASSWORD}"
sleep 3
# ---------------------------------------------- #
echo "=> creating db..."
sed -e 's|USERNAME|'"${USERNAME}"'|g' ./objects/mongodb.yaml | sed -e 's|MONGO_PASSWORD_SECRET|'"${MONGO_PASSWORD_SECRET}"'|g' - | sed -e 's|DB_NAME|'"${DB_NAME}"'|g' - | sed -e 's|SCRAM_SECRET|'"${SCRAM_SECRET}"'|g' - | sed -e 's|DB_SECRET|'"${DB_SECRET}"'|g' - | kubectl apply -f -
sleep 5
# ---------------------------------------------- #
kubectl logs deployment/mongodb-kubernetes-operator
echo $USERNAME
echo $PASSWORD
kubectl config set-context --current --namespace=default
