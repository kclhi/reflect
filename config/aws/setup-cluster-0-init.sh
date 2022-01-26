export $(cat .env | xargs)
read -n 1 -s -r -p "=> WARN: setting up cluster which involves deleting existing (if exists). any key to continue. manually exit if not"
echo
# ---------------------------------------------- #
echo "=> deleting existing cluster..."
kops delete cluster --name=$CLUSTER_NAME --state s3://$STATE_BUCKET_NAME --yes
read -n 1 -s -r -p "=> WARN: cluster properly removed (or did not exist)? any key to continue. manually exit if no"
echo
# ---------------------------------------------- #
echo "=> clearing existing bucket..."
sh ./util/s3/empty_bucket.sh --bucket s3://$STATE_BUCKET_NAME
aws s3 rm s3://$STATE_BUCKET_NAME --recursive
aws s3api delete-bucket --bucket $STATE_BUCKET_NAME --region $STATE_BUCKET_REGION
read -n 1 -s -r -p "=> WARN: bucket properly removed (or did not exist)? any key to continue. manually exit if no"
echo
# ---------------------------------------------- #
echo "=> creating bucket..."
aws s3api create-bucket --bucket $STATE_BUCKET_NAME --region $STATE_BUCKET_REGION --create-bucket-configuration LocationConstraint=$STATE_BUCKET_REGION
sleep 3
echo "=> versioning and encrypting bucket..."
aws s3api put-bucket-versioning --bucket $STATE_BUCKET_NAME --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket $STATE_BUCKET_NAME --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
sleep 3
# ---------------------------------------------- #
echo "=> creating cluster (NB. add '--admin-access IP_CIDR' to restrict source IPs for control plane (and bastion), e.g. to VPN source)..."
kops create cluster --name $CLUSTER_NAME --zones $CLUSTER_REGION --topology private --networking kube-router --bastion --ssh-public-key $HOST_PUBLIC_KEY_PATH --state s3://$STATE_BUCKET_NAME --cloud aws --master-size "t2.xlarge" --node-size "t2.xlarge" --node-count 3 --yes 
echo "=> shortly validate with: kops validate cluster --state=s3://${STATE_BUCKET_NAME}"
echo "=> WARN: api load balancer in public subnet. move to private subnet manually (see readme), and then use sshuttle to forward all requests to control plane: sshuttle -r user@bastion.host 0/0 -x bastion.host --ssh-cmd 'ssh -o ServerAliveInterval=60 -i ssh/key/path'"
