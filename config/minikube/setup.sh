export $(cat .env | xargs)
echo "=> installing and running minikube..."
ssh -o IdentitiesOnly=yes -i $SSH_KEY $SERVER_USER@$SERVER_ADDRESS < ./setup-minikube.sh
echo "=> connecting kubectl to minikube..."
ssh -o IdentitiesOnly=yes -i $SSH_KEY $SERVER_USER@$SERVER_ADDRESS 'docker exec minikube cat /etc/kubernetes/admin.conf' | sed -e 's|control-plane.minikube.internal|'${CLUSTER_ADDRESS}'|g' - > ~/.kube/config-mini
sudo chmod go-r ~/.kube/config-mini
export KUBECONFIG=~/.kube/config-mini
kubectl get pods -A
echo "=> starting minikube tunnel, in background, on server..."
ssh -o IdentitiesOnly=yes -i $SSH_KEY $SERVER_USER@$SERVER_ADDRESS 'minikube tunnel >/home/'${SERVER_USER}'/out.log 2>/home/'${SERVER_USER}'/err.log &'
