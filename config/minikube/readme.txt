minikube provides 'staging' environment:

1. create remote machine (including appropriate firewall config (e.g. 8443 kubernetes), and dns entry for cluster domain). min 4cpu, 16gb mem and 16gb storage.
2. run `setup`
3. setup ingress controllers
4. get minikube tunnel external load balancer ip addresses, add to proxy config and then run proxy on remote machine
5. add dns entry for internal load balancer from minikube tunnel
