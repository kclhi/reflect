export $(cat ${1:-.env} | xargs)
# ---------------------------------------------- #
kubectl config set-context --current --namespace=$API_NAMESPACE
echo "=> setting up service..."
kubectl create -f ./objects/service.yaml
sleep 3
# ---------------------------------------------- #
echo "=> copying over existing api url tls secret for use by this service's ingress"
echo "=> WARN: if secret not generated elsewhere, will fail..."
kubectl get secret $API_SECRET --namespace=openfaas -o yaml | sed "s/namespace: .*/namespace: $API_NAMESPACE/" | kubectl apply -f -
kubectl get certificate 
sleep 3
kubectl describe certificate api
sleep 3
kubectl describe secret ${API_SECRET}
sleep 3
# ---------------------------------------------- #
echo "=> setting up external ingress..."
sed -e 's|OPENFAAS_API_URL|'"${OPENFAAS_API_URL}"'|g' ./objects/ingress-tls.yaml | sed -e 's|API_SECRET|'"${API_SECRET}"'|g' | kubectl create -f -
# ---------------------------------------------- #
kubectl config set-context --current --namespace=default
