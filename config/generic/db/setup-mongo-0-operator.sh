export $(cat .env | xargs)
# ---------------------------------------------- #
echo "=> setting up mongodb operator rbac..."
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/crd/bases/mongodbcommunity.mongodb.com_mongodbcommunity.yaml
kubectl create namespace $DB_NAMESPACE
kubectl config set-context --current --namespace=$DB_NAMESPACE
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/rbac/role_binding.yaml
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/rbac/service_account.yaml
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/rbac/role.yaml
# ---------------------------------------------- #
echo "=> setting up mongodb operator..."
kubectl apply -f https://raw.githubusercontent.com/mongodb/mongodb-kubernetes-operator/master/config/manager/manager.yaml
sleep 5
kubectl get pods
kubectl config set-context --current --namespace=default
# ---------------------------------------------- #
echo "wait for operator to initialise, then run (1)"
