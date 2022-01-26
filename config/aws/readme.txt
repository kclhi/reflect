aws quirks:

- api load balancer can only be put on private subnet using manual process: https://kops.sigs.k8s.io/topology/#steps-to-change-the-elb-from-internet-facing-to-internal
- disable ability to make S3 buckets public needs to be done manually
- load balancers in an AWS may not be autocreated until one load balancer is manually created via the UI
- make sure enough free elastic IPs (5 max on regular AWS quota)
