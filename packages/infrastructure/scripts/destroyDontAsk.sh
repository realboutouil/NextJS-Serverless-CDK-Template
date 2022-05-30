#!/usr/bin/env bash

set -euo pipefail

# import config variables.
source .env.config

# Deploy the cdk stack
echo "--- 🚀 Destroying CDK stack..."
cdk \
  -c certArn="${CERT_ARN}" \
  -c domainName="${DOMAIN_NAME}" \
  -c subDomainName="${SUB_DOMAIN_NAME}" \
  -c environment="${ENVIRONMENT}" \
  destroy --all --force
