export $(cat .env | xargs)
kubectl config set-context --current --namespace=$DB_NAMESPACE
# ---------------------------------------------- #
echo "=> deleting stateful set..."
kubectl delete statefulset ${DB_NAME}
# ---------------------------------------------- #
echo "=> deleting volumes..."
kubectl delete pvc data-volume-${DB_NAME}-0 
kubectl delete pvc logs-volume-${DB_NAME}-0 
#kubectl delete pvc data-volume-${DB_NAME}-1 
#kubectl delete pvc logs-volume-${DB_NAME}-1 
#kubectl delete pvc data-volume-${DB_NAME}-2
#kubectl delete pvc logs-volume-${DB_NAME}-2
# ---------------------------------------------- #
echo "=> deleting db..."
kubectl delete MongoDBCommunity $DB_NAME
# ---------------------------------------------- #
echo "=> deleting secrets..."
kubectl delete secret $MONGO_PASSWORD_SECRET
kubectl delete secret $SCRAM_SECRET-scram-credentials
kubectl delete certificate db
kubectl delete secret $DB_SECRET
kubectl delete configmap db-cert
# ---------------------------------------------- #
echo "=> deleting operator..."
kubectl delete deploy mongodb-kubernetes-operator
# ---------------------------------------------- #
echo "=> deleting rbac..."
kubectl delete role mongodb-kubernetes-operator 
kubectl delete serviceaccount mongodb-kubernetes-operator 
kubectl delete rolebinding mongodb-kubernetes-operator 
kubectl delete role mongodb-database 
kubectl delete serviceaccount mongodb-database 
kubectl delete rolebinding mongodb-database 
kubectl config set-context --current --namespace=default

