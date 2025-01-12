#!/bin/bash

# Configuration
AWS_PROFILE="personal"
AWS_REGION="us-east-1"
ECR_REPO_NAME="aerie"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile ${AWS_PROFILE} 2>/dev/null)

# ECR repository URL
ECR_REPO_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Get ECR password token
ECR_PASSWORD=$(aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE})

echo "📝 Docker Registry Credentials:"
echo "Username: AWS"
echo "Password: ${ECR_PASSWORD}"
echo "Registry URL: ${ECR_REPO_URL}"
echo -e "\n💡 Full Image URL (use this in Dokploy):"
echo "${ECR_REPO_URL}/${ECR_REPO_NAME}:latest" 