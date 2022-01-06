echo "=> building image..."
docker build -t user .
docker rmi registry.gitlab.com/kclreflect/api/api:latest
docker tag $(docker images -q user) registry.gitlab.com/kclreflect/api/api:latest
echo "=> pushing image..."
docker push registry.gitlab.com/kclreflect/api/api:latest
# ---------------------------------------------- #
export ENV_FILE="${1:-.env}"
export $(cat $ENV_FILE | xargs)
kubectl config set-context --current --namespace=$API_NAMESPACE
# ---------------------------------------------- #
echo "=> setting up gitlab container registry keys..."
sleep 5
kubectl create secret docker-registry gitlab-container-key --docker-server=$DOCKER_SERVER --docker-username=$DOCKER_USERNAME --docker-password=$DOCKER_PASSWORD --docker-email=$DOCKER_EMAIL
kubectl get secrets gitlab-container-key
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "gitlab-container-key"}]}'
# ---------------------------------------------- #
echo "=> creating secret to store root ca certificate (to be loaded by this service)..."
kubectl create secret generic service-ca-cert --from-literal=service-ca.crt="$(kubectl get secret $SERVICE_CA_SECRET --namespace cert-manager -o json | jq -r '.data."tls.crt"' | base64 -d)"
# ---------------------------------------------- #
echo "=> creating secret for deployment..."
kubectl delete secret ${ENV_SECRET}
kubectl create secret generic ${ENV_SECRET} --from-env-file=./deploy/kubernetes/$ENV_FILE
# ---------------------------------------------- #
echo "=> (re)deploying api..."
kubectl delete deploy api
sed -e 's|ENV_SECRET|'"${ENV_SECRET}"'|g' ./deploy/kubernetes/objects/deployment.yaml | kubectl create -f -
# ---------------------------------------------- #
kubectl get pods
kubectl config set-context --current --namespace=default
