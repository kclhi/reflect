export $(cat .env | xargs)
# ---------------------------------------------- #
kubectl config set-context --current --namespace=$DB_NAMESPACE
echo "=> setting up service..."
kubectl create -f ./objects/service.yaml
sleep 3
# ---------------------------------------------- #
echo "=> setting up ingress (don't forget to associate desired address with load balancer)..."
sed -e 's|USER_URL|'"${USER_URL}"'|g' ./objects/ingress-tls.yaml | sed -e 's|USER_SECRET|'"${USER_SECRET}"'|g' | kubectl create -f -
echo "=> waiting for certificates to generate (might take longer than this wait)..."
sleep 30
kubectl get certificate 
sleep 3
kubectl describe certificate user
kubectl describe secret ${USER_SECRET}
# ---------------------------------------------- #
kubectl config set-context --current --namespace=default
