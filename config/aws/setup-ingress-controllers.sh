# as the controller created here uses an aws specific configuration, listed as such
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
echo "=> about to create internal and external load balancers..."
sleep 5
helm install -f ./objects/load-balancer-aws.yaml nginx-ingress-controller ingress-nginx/ingress-nginx # create load balancer (ingress controller)
echo "=> now associate load balancers (internal and external) with appropriate addresses in DNS (CNAME) and confirm reachable before continuing"
kubectl get service
