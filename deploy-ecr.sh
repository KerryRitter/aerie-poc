#!/bin/bash

# Exit on error
set -e

# Configuration
AWS_PROFILE="personal"
AWS_REGION="us-east-1"  # Change this to your preferred region
ECR_REPO_NAME="aerie"
IMAGE_TAG="latest"
IAM_USER="ecr-pull-user"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile ${AWS_PROFILE} 2>/dev/null)

# ECR repository URL
ECR_REPO_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"

echo "🚀 Starting deployment to AWS ECR..."

# Create ECR repository if it doesn't exist
echo "📦 Ensuring ECR repository exists..."
if ! aws ecr describe-repositories \
    --repository-names ${ECR_REPO_NAME} \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE} >/dev/null 2>&1; then
    aws ecr create-repository \
        --repository-name ${ECR_REPO_NAME} \
        --region ${AWS_REGION} \
        --profile ${AWS_PROFILE} >/dev/null 2>&1
fi

# Create IAM user if it doesn't exist
echo "👤 Ensuring IAM pull user exists..."
if ! aws iam get-user --user-name ${IAM_USER} --profile ${AWS_PROFILE} >/dev/null 2>&1; then
    aws iam create-user --user-name ${IAM_USER} --profile ${AWS_PROFILE}
    
    # Create policy for ECR pull access
    POLICY_DOC='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ecr:GetAuthorizationToken"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage"
                ],
                "Resource": "arn:aws:ecr:'"${AWS_REGION}"':'"${AWS_ACCOUNT_ID}"':repository/'"${ECR_REPO_NAME}"'"
            }
        ]
    }'
    
    POLICY_NAME="ECRPullAccess"
    aws iam put-user-policy \
        --user-name ${IAM_USER} \
        --policy-name ${POLICY_NAME} \
        --policy-document "${POLICY_DOC}" \
        --profile ${AWS_PROFILE}
fi

# Check for existing access keys
EXISTING_KEYS=$(aws iam list-access-keys --user-name ${IAM_USER} --profile ${AWS_PROFILE} --query 'AccessKeyMetadata[*].AccessKeyId' --output text)
if [ -z "$EXISTING_KEYS" ]; then
    # Create access key if none exist
    ACCESS_KEY=$(aws iam create-access-key --user-name ${IAM_USER} --profile ${AWS_PROFILE} --output json)
    echo -e "\n🔑 New IAM Credentials (SAVE THESE, they won't be shown again!):"
    echo "Access Key ID: $(echo $ACCESS_KEY | jq -r .AccessKey.AccessKeyId)"
    echo "Secret Access Key: $(echo $ACCESS_KEY | jq -r .AccessKey.SecretAccessKey)"
else
    echo -e "\n🔑 Access key already exists for ${IAM_USER} (ID: ${EXISTING_KEYS})"
fi

# Authenticate Docker to ECR
echo "🔑 Authenticating with ECR..."
aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} 2>/dev/null | \
    docker login --username AWS --password-stdin ${ECR_REPO_URL} >/dev/null 2>&1

# Build Docker image
echo "🏗️ Building Docker image..."
docker build -t ${ECR_REPO_NAME} . >/dev/null 2>&1

# Tag image
echo "🏷️ Tagging image..."
docker tag ${ECR_REPO_NAME}:latest ${ECR_REPO_URL}:${IMAGE_TAG} >/dev/null 2>&1

# Push image to ECR
echo "⬆️ Pushing image to ECR..."
docker push ${ECR_REPO_URL}:${IMAGE_TAG} >/dev/null 2>&1

echo "✅ Deployment complete! Image pushed to ${ECR_REPO_URL}:${IMAGE_TAG}"

# Output credentials for Dokploy
if [ -z "$EXISTING_KEYS" ]; then
    KEY_ID=$(echo $ACCESS_KEY | jq -r .AccessKey.AccessKeyId)
    SECRET_KEY=$(echo $ACCESS_KEY | jq -r .AccessKey.SecretAccessKey)
else
    KEY_ID=$EXISTING_KEYS
    echo "ℹ️  Using existing access key. If you need the secret key, please check your records or create a new key by deleting the existing one."
fi

echo -e "\n📝 AWS Credentials for Dokploy:"
echo "AWS_ACCESS_KEY_ID: ${KEY_ID}"
echo "AWS_SECRET_ACCESS_KEY: ${SECRET_KEY:-<check your records>}"
echo "AWS_REGION: ${AWS_REGION}"
echo "ECR_REGISTRY: ${ECR_REPO_URL}" 