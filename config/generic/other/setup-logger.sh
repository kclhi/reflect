# temporary separate install; helm with grafana + plugins prometheus (performance) and loki (logs) together not current working: https://github.com/grafana/helm-charts/issues/741
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
# ---------------------------------------------- #
echo "=> installing grafana + prometheus..."
helm install prometheus --namespace loki --create-namespace  prometheus-community/kube-prometheus-stack
# ---------------------------------------------- #
echo "=> installing loki..."
helm upgrade --install loki grafana/loki-stack --namespace loki --set grafana.enabled=false,prometheus.enabled=false,prometheus.alertmanager.persistentVolume.enabled=false,prometheus.server.persistentVolume.enabled=false
# ---------------------------------------------- #
kubectl get secret --namespace loki prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode; echo
echo "=> add 'http://loki:3100' as a source of in prometheus..."
sleep 10
kubectl port-forward "service/prometheus-grafana" 3000:80 -n loki
