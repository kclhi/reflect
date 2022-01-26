export $(cat .env | xargs)
# ---------------------------------------------- #
echo "=> deleting queue connector..."
kubectl delete deploy rabbitmq-connector -n openfaas
# ---------------------------------------------- #
echo "=> deleting configmaps..."
kubectl delete configmap rabbitmq-connector-configmap --namespace openfaas
kubectl delete configmap topology  --namespace openfaas
# ---------------------------------------------- #
echo "=> deleting client certificate (signed by service CA) to allow client (rabbitmq-connector) to authenticate with the server..."
kubectl delete certificate queue-client --namespace openfaas
kubectl delete secret $QUEUE_CLIENT_SECRET --namespace openfaas
# ---------------------------------------------- #
echo "=> deleting queue's cert from functions..."
kubectl delete secret queue-cert --namespace openfaas
# ---------------------------------------------- #
echo "=> deleting gitlab container registry keys..."
kubectl delete secret gitlab-container-key --namespace openfaas
# ---------------------------------------------- #
echo "=> check removal of connector (and wait if still terminating):"
kubectl get pods --namespace openfaas

