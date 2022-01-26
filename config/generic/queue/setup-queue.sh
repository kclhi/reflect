export $(cat .env | xargs)
# ---------------------------------------------- #
echo "=> installing queue cluster operator (manages cluster creation)..."
kubectl apply -f "https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml"
# ---------------------------------------------- #
echo "=> generating certificate and key for queue server tls (signed by service CA)..."
kubectl create namespace $QUEUE_NAMESPACE
sed -e 's|QUEUE_NAMESPACE|'"${QUEUE_NAMESPACE}"'|g' ./objects/certificates/queue-cert.yaml | sed -e 's|QUEUE_CLUSTER_NAME|'"${QUEUE_CLUSTER_NAME}"'|g' - | sed -e 's|QUEUE_SECRET|'"${QUEUE_SECRET}"'|g' - | kubectl create -f - --namespace $QUEUE_NAMESPACE
sleep 5
kubectl get certificate --namespace $QUEUE_NAMESPACE
sleep 3
kubectl describe certificate queue --namespace $QUEUE_NAMESPACE
kubectl describe secret $QUEUE_SECRET --namespace $QUEUE_NAMESPACE
# ---------------------------------------------- #
echo "=> making queue's CA cert available to functions..."
kubectl create secret generic queue-cert --from-literal=queue.pem="$(kubectl get secret $QUEUE_SECRET --namespace $QUEUE_NAMESPACE -o json | jq -r '.data."ca.crt"' | base64 -d)" --namespace openfaas-fn
# ---------------------------------------------- #
echo "=> creating client certificate (signed by service CA) to allow queue clients (functions) to authenticate themselves with the server..."
sed -e 's|QUEUE_CLIENT_SECRET|'"${QUEUE_CLIENT_SECRET}"'|g' ./objects/certificates/queue-client-cert.yaml | kubectl create -f - --namespace openfaas-fn
sleep 5
kubectl get certificate --namespace openfaas-fn
sleep 3
kubectl describe certificate queue-client --namespace openfaas-fn
kubectl describe secret $QUEUE_CLIENT_SECRET --namespace openfaas-fn
# ---------------------------------------------- #
echo "=> making service CA (root) cert available to rabbit cluster to use in client authentication..."
kubectl create secret generic service-ca-cert --from-literal=ca.crt="$(kubectl get secret $SERVICE_CA_SECRET --namespace cert-manager -o json | jq -r '.data."tls.crt"' | base64 -d)" --namespace ${QUEUE_NAMESPACE}
sleep 3
# ---------------------------------------------- #
echo "=> creating queue cluster..."
sed -e 's|QUEUE_CLUSTER_NAME|'"${QUEUE_CLUSTER_NAME}"'|g' ./objects/rabbitmq.yaml | sed -e 's|QUEUE_NAMESPACE|'"${QUEUE_NAMESPACE}"'|g' - | sed -e 's|QUEUE_SECRET|'"${QUEUE_SECRET}"'|g' - | kubectl create -f -
echo "=> waiting for queue to set up before probing for credentials..."
sleep 30
echo "=> username: "$(kubectl get secret ${QUEUE_CLUSTER_NAME}-default-user -o jsonpath='{.data.username}' --namespace ${QUEUE_NAMESPACE} | base64 --decode)
echo "=> password: "$(kubectl get secret ${QUEUE_CLUSTER_NAME}-default-user -o jsonpath='{.data.password}' --namespace ${QUEUE_NAMESPACE} | base64 --decode)
echo "=> connect with: 'kubectl port-forward "service/${QUEUE_CLUSTER_NAME}" 15671 --namespace ${QUEUE_NAMESPACE}'"
echo "=> WARN: setup credentials if using queue connector"
