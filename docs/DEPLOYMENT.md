# Deployment Guide

## Overview

This guide covers deploying the Perplexity MCP Shipping Suite in various environments, from local development to production.

## Quick Start

### Local Development
```bash
# Start all services
pnpm run dev

# Or with Docker
docker-compose up -d
```

### Production Deployment
```bash
# Build and deploy
pnpm run build:all
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Environment Configuration

### Development Environment
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_CACHE=false
ENABLE_WEBHOOKS=false
```

### Production Environment
```env
NODE_ENV=production
LOG_LEVEL=info
ENABLE_CACHE=true
REDIS_URL=redis://your-redis-url:6379
ENABLE_WEBHOOKS=true
WEBHOOK_SECRET=your_secure_webhook_secret
```

## Docker Deployment

### Basic Docker Setup
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker
```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Docker Services
- **Redis**: Port 6379 (Caching)
- **PostgreSQL**: Port 5432 (Database)
- **EasyPost MCP**: Port 3000
- **Veeqo MCP**: Port 3002
- **Web Interface**: Port 3003
- **Prometheus**: Port 9090 (Optional)
- **Grafana**: Port 3001 (Optional)

## Platform Deployments

### Railway Deployment
```bash
# Deploy to Railway
railway up

# Configure environment variables
railway variables set EASYPOST_API_KEY=your_key_here
railway variables set VEEQO_API_KEY=your_key_here
```

### Heroku Deployment
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set EASYPOST_API_KEY=your_key_here
heroku config:set VEEQO_API_KEY=your_key_here

# Deploy
git push heroku main
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-shipping-suite
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-shipping-suite
  template:
    metadata:
      labels:
        app: mcp-shipping-suite
    spec:
      containers:
      - name: easypost-mcp
        image: easypost-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: EASYPOST_API_KEY
          valueFrom:
            secretKeyRef:
              name: easypost-secret
              key: api-key
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      - name: veeqo-mcp
        image: veeqo-mcp:latest
        ports:
        - containerPort: 3002
        env:
        - name: VEEQO_API_KEY
          valueFrom:
            secretKeyRef:
              name: veeqo-secret
              key: api-key
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
      - name: web-dashboard
        image: web-dashboard:latest
        ports:
        - containerPort: 3003
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3003
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3003
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Monitoring & Observability

### Health Checks
All services provide health check endpoints:

```bash
# EasyPost MCP Server
curl http://localhost:3000/health

# Veeqo MCP Server
curl http://localhost:3002/health

# Web Interface
curl http://localhost:3003/health
```

### Metrics (Optional)
Enable Prometheus and Grafana for advanced monitoring:

```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3001
# Default credentials: admin/admin
```

### Logging
All services use structured JSON logging with contextual metadata:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Shipment created successfully",
  "service": "easypost-mcp-server",
  "shipmentId": "shp_123",
  "duration": 150
}
```

## Security Considerations

### Production Security
- ✅ Non-root Docker users
- ✅ API key validation and rotation
- ✅ Rate limiting and request size limits
- ✅ Input validation and sanitization
- ✅ Webhook signature verification
- ✅ Secure logging (no sensitive data)
- ✅ HTTPS/TLS enforcement

### Environment Variables
Never commit API keys to version control:
```bash
# Use environment variables
export EASYPOST_API_KEY=your_key_here
export VEEQO_API_KEY=your_key_here

# Or use .env files (not committed)
echo "EASYPOST_API_KEY=your_key_here" >> .env
echo "VEEQO_API_KEY=your_key_here" >> .env
```

### Docker Security
```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
USER nodejs

# Use specific versions
FROM node:18-alpine

# Remove unnecessary packages
RUN apk del --no-cache python3 make g++
```

## Performance Optimization

### Caching Strategy
- **Response caching** with configurable TTL
- **Redis** for distributed caching
- **Connection pooling** for HTTP clients
- **Target response time**: <200ms

### Rate Limiting
- **EasyPost**: Built-in retry with exponential backoff
- **Veeqo**: 5 requests/second enforced
- **Bottleneck** library for queue management

### Resource Limits
```yaml
# Docker Compose resource limits
services:
  easypost-mcp:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## Troubleshooting

### Common Deployment Issues

**1. Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003

# Kill processes using ports
sudo kill -9 $(lsof -t -i:3000)
```

**2. Docker Issues**
```bash
# Check Docker status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Clean up
docker-compose down -v --remove-orphans
docker system prune -f
```

**3. Database Connection**
```bash
# Test PostgreSQL connection
docker-compose exec postgres psql -U perplexity -d perplexity_mcp -c "SELECT 1;"

# Test Redis connection
docker-compose exec redis redis-cli ping
```

**4. API Key Issues**
```bash
# Verify EasyPost API key
curl -H "Authorization: Bearer YOUR_KEY" https://api.easypost.com/v2/account

# Verify Veeqo API key
curl -H "x-api-key: YOUR_KEY" https://api.veeqo.com/current_user
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug docker-compose up

# Enable verbose output
DEBUG_MODE=true docker-compose up
```

## Backup & Recovery

### Database Backup
```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U perplexity perplexity_mcp > backup.sql

# Redis backup
docker-compose exec redis redis-cli BGSAVE
```

### Configuration Backup
```bash
# Backup environment files
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Backup Docker volumes
docker run --rm -v perplexity_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
```

## Scaling

### Horizontal Scaling
```yaml
# Docker Compose scaling
services:
  easypost-mcp:
    deploy:
      replicas: 3
  veeqo-mcp:
    deploy:
      replicas: 2
  web-dashboard:
    deploy:
      replicas: 2
```

### Load Balancing
```nginx
# Nginx configuration
upstream easypost_backend {
    server easypost-mcp-1:3000;
    server easypost-mcp-2:3000;
    server easypost-mcp-3:3000;
}

upstream veeqo_backend {
    server veeqo-mcp-1:3002;
    server veeqo-mcp-2:3002;
}

server {
    listen 80;
    
    location /easypost/ {
        proxy_pass http://easypost_backend/;
    }
    
    location /veeqo/ {
        proxy_pass http://veeqo_backend/;
    }
}
```

## Maintenance

### Regular Maintenance Tasks
```bash
# Update dependencies
pnpm update

# Run security audit
pnpm audit

# Clean up Docker
docker system prune -f

# Rotate logs
logrotate /etc/logrotate.d/mcp-shipping-suite
```

### Monitoring Checklist
- [ ] Service health checks passing
- [ ] Response times <200ms
- [ ] Error rates <1%
- [ ] Disk space >20% free
- [ ] Memory usage <80%
- [ ] API rate limits not exceeded

## Support

For deployment issues:
- Check service logs: `docker-compose logs -f`
- Verify environment variables: `docker-compose config`
- Test health endpoints: `curl http://localhost:3000/health`
- Review monitoring dashboards
- Contact support team
