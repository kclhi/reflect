export $(cat ${1:-.env} | xargs)
# ---------------------------------------------- #
echo "=> setting up gitlab container registry keys..."
sleep 5
kubectl create secret docker-registry gitlab-container-key --docker-server=$DOCKER_SERVER --docker-username=$DOCKER_USERNAME --docker-password=$DOCKER_PASSWORD --docker-email=$DOCKER_EMAIL --namespace openfaas
kubectl get secrets gitlab-container-key --namespace openfaas
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "gitlab-container-key"}]}' -n openfaas
# ---------------------------------------------- #
echo "=> making queue's CA cert available to openfaas..."
kubectl create secret generic queue-cert --from-literal=queue.pem="$(kubectl get secret $QUEUE_SECRET --namespace $QUEUE_NAMESPACE -o json | jq -r '.data."ca.crt"' | base64 -d)" --namespace openfaas
# ---------------------------------------------- #
echo "=> creating client certificate (signed by service CA) to allow queue client (rabbitmq-connector) to authenticate with the server..."
sed -e 's|QUEUE_CLIENT_SECRET|'"${QUEUE_CLIENT_SECRET}"'|g' ./objects/certificates/queue-client-cert.yaml | kubectl create -f - --namespace openfaas
sleep 5
kubectl get certificate --namespace openfaas
sleep 3
kubectl describe certificate queue-client --namespace openfaas
kubectl describe secret $QUEUE_CLIENT_SECRET --namespace openfaas
# ---------------------------------------------- #
echo "=> creating configmaps..."
sed -e 's|QUEUE_TOPICS|'"${QUEUE_TOPICS}"'|g' ./objects/rabbitmq-connector-configmap.yaml | sed -e 's|QUEUE_USER|'"${QUEUE_USER}"'|g' - | sed -e 's|QUEUE_PASS|'"${QUEUE_PASS}"'|g' - | sed -e 's|QUEUE_CLUSTER_NAME|'"${QUEUE_CLUSTER_NAME}"'|g' - | sed -e 's|QUEUE_NAMESPACE|'"${QUEUE_NAMESPACE}"'|g' - | kubectl create -f - --namespace openfaas
kubectl create configmap topology --from-file ./objects/topology.yaml --namespace openfaas
# ---------------------------------------------- #
echo "=> deploying queue connector..."
kubectl apply -f ./objects/rabbitmq-connector.yaml
sleep 5
kubectl get pods --namespace openfaas
