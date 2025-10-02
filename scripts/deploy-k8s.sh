#!/bin/bash
# scripts/deploy-k8s.sh

echo "🚀 Deploying to Kubernetes..."

# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/truckmatch-api -n truckmatch

echo "✅ Deployment successful!"
echo "📊 Getting service info..."
kubectl get services -n truckmatch
