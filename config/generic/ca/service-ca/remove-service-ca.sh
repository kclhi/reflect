export $(cat .env | xargs)
# ---------------------------------------------- #
echo "removing CA..."
kubectl delete clusterissuer service-ca-issuer
# ---------------------------------------------- #
echo "removing secret to store certificate and key (internal root CA) credentials..."
kubectl delete secret $SERVICE_CA_SECRET --namespace cert-manager
# ---------------------------------------------- #
echo "removing these credentials..."
rm service-ca-tls.key
rm service-ca-tls.pem


