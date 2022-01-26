export $(cat ${1:-.env} | xargs)
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm repo update
# ---------------------------------------------- #
echo "=> about to install openfaas..."
sleep 5
kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/namespaces.yml
helm upgrade openfaas --install openfaas/openfaas --namespace openfaas --set functionNamespace=openfaas-fn --set generateBasicAuth=true --set serviceType=ClusterIP # no direct external connection
PASSWORD=$(kubectl -n openfaas get secret basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode) 
echo "=> openFaaS admin password: $PASSWORD"
# ---------------------------------------------- #
echo "=> creating secret to store root ca certificate (to be loaded by functions)..."
kubectl create secret generic service-ca-cert --from-literal=service-ca.crt="$(kubectl get secret $SERVICE_CA_SECRET --namespace cert-manager -o json | jq -r '.data."tls.crt"' | base64 -d)" --namespace openfaas-fn
# ---------------------------------------------- #
echo "=> about to install ingress resource..."
sleep 5
sed -e 's|OPENFAAS_API_URL|'"${OPENFAAS_API_URL}"'|g' ./objects/ingress-tls-openfaas.yaml | kubectl create -f - --namespace openfaas # create ingress resource for openfaas (which communicates with the controller; one controller many resources)
# ---------------------------------------------- #
echo "=> waiting for certificates to generate (might take longer than this wait)..."
sleep 30
kubectl get certificate --namespace openfaas
sleep 3
kubectl describe certificate api --namespace openfaas 
kubectl describe secret ${API_SECRET} --namespace openfaas
# ---------------------------------------------- #
echo "=> setting up gitlab container registry keys..."
sleep 5
kubectl create secret docker-registry gitlab-container-key --docker-server=$DOCKER_SERVER --docker-username=$DOCKER_USERNAME --docker-password=$DOCKER_PASSWORD --docker-email=$DOCKER_EMAIL --namespace openfaas-fn
kubectl get secrets gitlab-container-key --namespace openfaas-fn
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "gitlab-container-key"}]}' -n openfaas-fn
echo "=> WARN: login locally to Gitlab (in addition to the keys on Kubernetes being set), in order to push from faas-cli"
# ---------------------------------------------- #
echo "=> logging in to openfaas API..."
faas-cli login --gateway https://$OPENFAAS_API_URL --username admin --password $PASSWORD
