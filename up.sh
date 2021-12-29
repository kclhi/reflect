echo "=> building image..."
docker build -t user .
docker rmi registry.gitlab.com/kclreflect/user/user:latest
docker tag $(docker images -q user) registry.gitlab.com/kclreflect/user/user:latest
echo "=> pushing image..."
docker push registry.gitlab.com/kclreflect/user/user:latest
# ---------------------------------------------- #
export $(cat .env | xargs)
kubectl config set-context --current --namespace=$DB_NAMESPACE
# ---------------------------------------------- #
echo "=> setting up gitlab container registry keys..."
sleep 5
kubectl create secret docker-registry gitlab-container-key --docker-server=$DOCKER_SERVER --docker-username=$DOCKER_USERNAME --docker-password=$DOCKER_PASSWORD --docker-email=$DOCKER_EMAIL
kubectl get secrets gitlab-container-key
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "gitlab-container-key"}]}'
# ---------------------------------------------- #
echo "=> creating secret for deployment..."
kubectl delete secret ${ENV_SECRET}
kubectl create secret generic ${ENV_SECRET} --from-env-file=./deploy/kubernetes/.env
# ---------------------------------------------- #
echo "=> (re)deploying user..."
kubectl delete deploy user
sed -e 's|DB_PASS_SECRET|'"${DB_PASS_SECRET}"'|g' ./deploy/kubernetes/objects/deployment.yaml | sed -e 's|DB_SECRET|'"${DB_SECRET}"'|g' - | sed -e 's|ENV_SECRET|'"${ENV_SECRET}"'|g' - | kubectl create -f -
# ---------------------------------------------- #
kubectl get pods
kubectl config set-context --current --namespace=default
