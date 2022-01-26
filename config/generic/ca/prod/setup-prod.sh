export $(cat .env | xargs)
helm repo add jetstack https://charts.jetstack.io
helm repo update
# ---------------------------------------------- #
echo "=> about to install cert manager (may already be installed)..."
sleep 5
helm install cert-manager --namespace cert-manager --create-namespace --set installCRDs=true --version v1.6 jetstack/cert-manager
# ---------------------------------------------- #
echo "=> about to create cluster issuer..."
sed -e 's|CERT_EMAIL|'"${CERT_EMAIL}"'|g' ./objects/prod-issuer.yaml | kubectl create -f -
kubectl describe clusterissuer letsencrypt-prod -n cert-manager
