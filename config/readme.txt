* setup

to set up production cluster for this project, add appropriate .env files and run:

aws/setup-cluster-0-init
aws/setup-cluster-1-encryption
aws/setup-ingress-controllers
generic/ca/prod/setup-prod
generic/ca/service-ca/setup-service-ca
generic/openfaas/setup-openfaas
generic/queue/setup-queue
generic/queue/setup-queue-connector
generic/db/setup-mongo-0-operator
generic/db/setup-mongo-1
generic/fhir/setup-fhir

'staging' cluster uses minikube
