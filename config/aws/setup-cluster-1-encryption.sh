export $(cat .env | xargs)
# ---------------------------------------------- #
echo "=> adding encryption config..."
cat << EOF | kops create secret encryptionconfig -f - --state s3://$STATE_BUCKET_NAME
kind: EncryptionConfig
apiVersion: v1
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: $(head -c 32 /dev/urandom | base64)
    - identity: {}
EOF
# ---------------------------------------------- #
echo "=> downloading current config..."
kops get --state s3://$STATE_BUCKET_NAME -o yaml > cluster-desired-config.yaml
# ---------------------------------------------- #
echo "=> add 'encryptionConfig: true' under cluster 'spec:' to current config (vim to open...)" # could be done with sed, but risky, perhaps
sleep 10
vim cluster-desired-config.yaml
# ---------------------------------------------- #
echo "=> updating existing config..."
kops replace --state s3://$STATE_BUCKET_NAME -f cluster-desired-config.yaml
# ---------------------------------------------- #
echo "=> running cluster updates..."
kops update cluster --yes --state s3://$STATE_BUCKET_NAME
kops rolling-update cluster --yes --state s3://$STATE_BUCKET_NAME
rm cluster-desired-config.yaml
# ---------------------------------------------- #
echo "=> pods and nodes for reference:"
kubectl get pod -o wide -A
