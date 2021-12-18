export $(cat .env | xargs)
# ---------------------------------------------- #
kubectl config set-context --current --namespace=$DB_NAMESPACE
echo "=> setting up service..."
kubectl create -f ./objects/service.yaml
sleep 3
# ---------------------------------------------- #
echo "=> setting up external ingress (don't forget to associate desired address with load balancer)..."
sed -e 's|USER_URL|'"${USER_URL}"'|g' ./objects/ingress-tls.yaml | sed -e 's|USER_SECRET|'"${USER_SECRET}"'|g' | kubectl create -f -
echo "=> waiting for certificates to generate (might take longer than this wait)..."
sleep 30
kubectl get certificate 
sleep 3
kubectl describe certificate user
kubectl describe secret ${USER_SECRET}
# ---------------------------------------------- #
echo "=> setting up internal ingress (don't forget to associate desired internal address with load balancer)..."
sed -e 's|INTERNAL_API_URL|'"${INTERNAL_API_URL}"'|g' ./objects/ingress-tls-internal.yaml | sed -e 's|USER_INTERNAL_SECRET|'"${USER_INTERNAL_SECRET}"'|g' | kubectl create -f -
echo "=> waiting for certificates to generate (might take longer than this wait)..."
sleep 30
kubectl get certificate 
sleep 3
kubectl describe certificate user-internal
kubectl describe secret ${USER_INTERNAL_SECRET}
# ---------------------------------------------- #
kubectl config set-context --current --namespace=default
