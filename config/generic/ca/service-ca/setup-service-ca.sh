export $(cat .env | xargs)
helm repo add jetstack https://charts.jetstack.io
helm repo update
# ---------------------------------------------- #
echo "=> installing cert manager (may already be installed)..."
helm install cert-manager --namespace cert-manager --create-namespace --set installCRDs=true --version v1.6 jetstack/cert-manager
# ---------------------------------------------- #
echo "=> generating service certificate and key (internal root CA)..."
rm service-ca-tls.key
rm service-ca-tls.pem
openssl genrsa -out service-ca-tls.key 4096
openssl req -x509 -new -nodes -subj "${CA_SUBJECT_STRING}" -key service-ca-tls.key -sha256 -days 1825 -out service-ca-tls.pem
sleep 3
# ---------------------------------------------- #
echo "=> creating secret to store these credentials..."
kubectl create secret tls $SERVICE_CA_SECRET --key="service-ca-tls.key" --cert="service-ca-tls.pem" --namespace cert-manager
# ---------------------------------------------- #
echo "=> creating CA..."
sed -e 's|SERVICE_CA_SECRET|'"${SERVICE_CA_SECRET}"'|g' ./objects/service-ca-issuer.yaml | kubectl create -f -
kubectl describe clusterissuer service-ca-issuer
