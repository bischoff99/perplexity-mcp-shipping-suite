# Template: Microservice Setup & Architecture

## Service Overview
**Service Name:** {{service_name}}  
**Domain:** {{business_domain}}  
**Owner Team:** {{team_name}}  
**Repository:** {{repo_url}}

## Architecture Requirements

### **Core Functionality**
- [ ] Define primary service responsibilities
- [ ] Identify service boundaries and contracts
- [ ] Design data models and schemas
- [ ] Define API interfaces (REST/GraphQL/gRPC)
- [ ] Plan event-driven interactions

### **Technical Stack**
- **Runtime:** {{runtime}} (Node.js, Python, Go, Java, etc.)
- **Framework:** {{framework}}
- **Database:** {{database}} (PostgreSQL, MongoDB, Redis, etc.)
- **Message Queue:** {{message_queue}} (RabbitMQ, Kafka, SQS, etc.)
- **Cache:** {{caching_strategy}}

### **Infrastructure Setup**

#### **Containerization**
- [ ] Create optimized Dockerfile
- [ ] Configure multi-stage builds
- [ ] Set up health checks
- [ ] Configure resource limits
- [ ] Add security scanning

#### **Kubernetes Deployment**
- [ ] Create deployment manifests
- [ ] Configure service discovery
- [ ] Set up ingress routing
- [ ] Implement horizontal pod autoscaling
- [ ] Configure persistent volumes if needed

#### **Service Mesh Integration**
- [ ] Configure Istio/Linkerd sidecar
- [ ] Set up traffic policies
- [ ] Implement circuit breakers
- [ ] Configure retry policies
- [ ] Add distributed tracing

## Development Setup

### **Local Development**
```bash
# Clone repository
git clone {{repo_url}}
cd {{service_name}}

# Install dependencies
{{install_command}}

# Start development server
{{dev_command}}

# Run tests
{{test_command}}
```

### **Docker Development**
```bash
# Build development image
docker build -t {{service_name}}:dev .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f {{service_name}}
```

### **Environment Configuration**
```yaml
# docker-compose.yml
version: '3.8'
services:
  {{service_name}}:
    build: .
    ports:
      - "{{port}}:{{port}}"
    environment:
      - NODE_ENV=development
      - DATABASE_URL={{database_url}}
      - REDIS_URL={{redis_url}}
      - MESSAGE_QUEUE_URL={{queue_url}}
    depends_on:
      - database
      - redis
      - message-queue
    volumes:
      - ./src:/app/src
      - /app/node_modules

  database:
    image: postgres:15
    environment:
      POSTGRES_DB: {{db_name}}
      POSTGRES_USER: {{db_user}}
      POSTGRES_PASSWORD: {{db_password}}
    volumes:
      - db_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:
```

## API Design

### **REST Endpoints**
```yaml
openapi: 3.0.0
info:
  title: {{service_name}} API
  version: 1.0.0
paths:
  /api/v1/{{resource}}:
    get:
      summary: List {{resource}}s
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/{{Resource}}'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    post:
      summary: Create {{resource}}
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Create{{Resource}}Request'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{{Resource}}'
```

### **Event Schema**
```json
{
  "eventType": "{{service_name}}.{{resource}}.created",
  "version": "1.0.0",
  "data": {
    "id": "{{resource_id}}",
    "attributes": {},
    "metadata": {
      "timestamp": "2023-01-01T00:00:00Z",
      "source": "{{service_name}}",
      "correlationId": "{{correlation_id}}"
    }
  }
}
```

## Monitoring & Observability

### **Metrics Collection**
- [ ] Application metrics (request rate, latency, errors)
- [ ] Business metrics (domain-specific KPIs)
- [ ] Infrastructure metrics (CPU, memory, disk)
- [ ] Database metrics (connections, query performance)

### **Logging Strategy**
- [ ] Structured logging (JSON format)
- [ ] Correlation IDs for distributed tracing
- [ ] Log levels and filtering
- [ ] Centralized log aggregation

### **Health Checks**
```typescript
// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  try {
    await Promise.all([
      database.ping(),
      messageQueue.ping(),
      cache.ping()
    ]);
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

## Security Implementation

### **Authentication & Authorization**
- [ ] JWT token validation
- [ ] Role-based access control (RBAC)
- [ ] API key authentication
- [ ] Rate limiting and throttling

### **Data Protection**
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Sensitive data encryption
- [ ] Audit logging

### **Network Security**
- [ ] HTTPS/TLS encryption
- [ ] Network policies (Kubernetes)
- [ ] Service-to-service authentication (mTLS)
- [ ] Secrets management (Vault, K8s secrets)

## Testing Strategy

### **Unit Tests**
- [ ] Business logic testing
- [ ] Database layer testing
- [ ] Event handling testing
- [ ] Error scenarios testing

### **Integration Tests**
- [ ] API endpoint testing
- [ ] Database integration testing
- [ ] Message queue integration
- [ ] External service mocking

### **Performance Tests**
- [ ] Load testing (expected traffic)
- [ ] Stress testing (peak traffic)
- [ ] Spike testing (sudden increases)
- [ ] Volume testing (large datasets)

## Deployment Pipeline

### **CI/CD Stages**
```yaml
# .github/workflows/deploy.yml
name: Deploy {{service_name}}
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          {{install_command}}
          {{test_command}}
          
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Security scan
        run: |
          {{security_scan_command}}
          
  build-and-deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t {{registry}}/{{service_name}}:${{ github.sha }} .
      - name: Deploy to staging
        run: |
          kubectl set image deployment/{{service_name}} {{service_name}}={{registry}}/{{service_name}}:${{ github.sha }}
```

## Operations Runbook

### **Deployment Checklist**
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Secrets updated
- [ ] Feature flags configured
- [ ] Monitoring alerts enabled

### **Rollback Procedure**
1. Identify the last known good version
2. Update deployment to previous image tag
3. Verify service health and metrics
4. Check downstream service compatibility
5. Update monitoring and alerts

### **Troubleshooting**
```bash
# Check service status
kubectl get pods -l app={{service_name}}

# View recent logs
kubectl logs -l app={{service_name}} --tail=100

# Access service metrics
curl http://{{service_name}}.{{namespace}}.svc.cluster.local:{{port}}/metrics

# Database connectivity
kubectl exec -it deployment/{{service_name}} -- curl {{database_health_url}}
```

## Documentation Links
- [ ] API Documentation: {{api_docs_url}}
- [ ] Architecture Decision Records: {{adr_url}}
- [ ] Monitoring Dashboard: {{dashboard_url}}
- [ ] Incident Response: {{incident_response_url}}

---
*Generated with Claude Code - Microservice Setup Template*