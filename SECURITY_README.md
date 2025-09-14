# Security Guidelines for MCP Shipping Suite

## 🔐 Overview

The MCP Shipping Suite handles sensitive shipping data, API keys, and customer information. This document outlines essential security practices for development, deployment, and maintenance.

## 🚨 Critical Security Rules

### 1. **NEVER COMMIT SECRETS**

❌ **DON'T:**
- Commit API keys, passwords, or tokens to version control
- Store secrets in configuration files that are tracked by git
- Hardcode credentials in source code
- Share sensitive information in pull request descriptions or issues

✅ **DO:**
- Use environment variables for all sensitive configuration
- Store production secrets in secure secret management systems (GitHub Secrets, AWS Secrets Manager, etc.)
- Use `.env.example` to document required environment variables
- Review commits for accidentally included secrets

### 2. **API Key and Token Management**

#### Storage
- **Development:** Use `.env.development` (gitignored)
- **CI/CD:** Store in GitHub Secrets
- **Production:** Use cloud provider secret management

#### Best Practices
- Use **sandbox/test API keys** for development and testing
- **Rotate API keys regularly** (every 90 days minimum)
- Use **least-privilege access** - only grant necessary permissions
- **Monitor API key usage** for unusual activity

#### Supported Services
```bash
# EasyPost
EASYPOST_API_KEY=test_xxxxx  # Use test_ prefix for development
EASYPOST_WEBHOOK_SECRET=whsec_xxxxx

# Veeqo
VEEQO_API_KEY=your_veeqo_key_here

# Claude AI (optional)
CLAUDE_API_KEY=sk-ant-xxxxx

# Hugging Face (optional)
HF_API_TOKEN=hf_xxxxx
```

### 3. **Secret Rotation Policy**

#### Frequency
- **API Keys:** Every 90 days
- **Webhook Secrets:** Every 180 days
- **JWT Secrets:** Every 30 days
- **Database Passwords:** Every 60 days

#### Process
1. Generate new secret in service provider
2. Update secret in all environments (dev → staging → production)
3. Monitor for any authentication failures
4. Revoke old secret after 24-48 hours
5. Document rotation in change log

### 4. **Environment Separation**

#### Development Environment
- Use **test/sandbox APIs** exclusively
- Never connect to production databases
- Use separate authentication credentials
- Enable debug logging safely

#### Staging Environment  
- Mirror production configuration
- Use production-like data (anonymized)
- Test secret rotation procedures
- Validate security configurations

#### Production Environment
- Use **production API keys** only
- Enable all security features
- Monitor for security violations
- Implement audit logging

## 🛡️ Application Security

### Input Validation
```typescript
// Always validate external inputs with Zod
import { z } from 'zod';

const shipmentSchema = z.object({
  from_address: addressSchema,
  to_address: addressSchema, 
  parcel: parcelSchema
});

// Validate before processing
const validated = shipmentSchema.parse(request);
```

### API Security
- **Rate limiting:** Implement per-client rate limits
- **Authentication:** Validate API keys and tokens
- **Authorization:** Check permissions for each operation
- **CORS:** Configure allowed origins strictly
- **HTTPS:** Enforce TLS/SSL for all communications

### Database Security
- **Connection encryption:** Use SSL/TLS connections
- **Parameterized queries:** Prevent SQL injection
- **Least privilege:** Database users with minimal permissions
- **Connection pooling:** Limit concurrent connections

### Webhook Security
```typescript
// Verify webhook signatures
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

## 🔍 Security Monitoring

### Logging Best Practices
```typescript
// Log security events without exposing sensitive data
logger.info('Authentication attempt', {
  userId: user.id,
  ip: request.ip,
  userAgent: request.get('User-Agent'),
  // Don't log: passwords, API keys, tokens
});

// Log API usage
logger.info('API request', {
  endpoint: '/api/shipments',
  method: 'POST',
  responseTime: 150,
  // Don't log: request body with personal data
});
```

### Security Alerts
Monitor and alert on:
- Failed authentication attempts
- Unusual API usage patterns
- Error rate spikes
- Unauthorized access attempts
- Configuration changes
- Secret access events

## 🔧 Development Security

### Pre-commit Hooks
The project includes security checks:
```yaml
# .pre-commit-config.yaml includes:
- detect-secrets        # Scan for accidentally committed secrets
- security-audit        # Check for known vulnerabilities
- hadolint             # Docker security best practices
```

### IDE Security Extensions
Recommended VS Code extensions:
- **GitLens:** Review code history for secrets
- **SonarLint:** Detect security vulnerabilities
- **Security Code Scan:** Static security analysis

### Code Review Checklist
- [ ] No hardcoded secrets or credentials
- [ ] Input validation implemented
- [ ] Error handling doesn't expose internal information
- [ ] Authentication and authorization checks present
- [ ] Rate limiting configured
- [ ] Logging doesn't include sensitive data

## 🚀 Deployment Security

### Container Security
```dockerfile
# Use non-root user
USER node

# Don't include build tools in production
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set security headers
LABEL security.scan="enabled"
```

### Infrastructure Security
- **Network policies:** Restrict service-to-service communication
- **Pod security standards:** Use restricted security context
- **Resource limits:** Prevent resource exhaustion attacks
- **Image scanning:** Scan containers for vulnerabilities

### CI/CD Security
```yaml
# GitHub Actions security
- name: Security Scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    format: 'sarif'
    
- name: Dependency Audit
  run: npm audit --audit-level high
```

## 📋 Incident Response

### Security Incident Types
1. **Exposed secrets** (API keys, passwords)
2. **Data breach** (customer information)
3. **Unauthorized access** (system compromise)
4. **Service disruption** (DDoS, resource exhaustion)

### Response Procedure
1. **Immediate:** Rotate/revoke compromised credentials
2. **Assessment:** Determine scope and impact
3. **Containment:** Isolate affected systems
4. **Communication:** Notify stakeholders if required
5. **Recovery:** Restore secure operations
6. **Review:** Conduct post-incident analysis

### Emergency Contacts
- **Lead Developer:** [Contact Information]
- **Security Team:** [Contact Information]
- **Service Providers:** EasyPost, Veeqo support

## 🔍 Security Audit Checklist

### Monthly Review
- [ ] Review access logs for anomalies
- [ ] Audit user permissions and access
- [ ] Check for unused API keys
- [ ] Review security configuration changes
- [ ] Update dependencies with security patches

### Quarterly Review
- [ ] Rotate API keys and secrets
- [ ] Review and update security policies
- [ ] Conduct penetration testing
- [ ] Review incident response procedures
- [ ] Update security training materials

### Annual Review
- [ ] Comprehensive security audit
- [ ] Review compliance requirements
- [ ] Update security architecture
- [ ] Evaluate new security tools
- [ ] Security team training and certification

## 📚 Resources and References

### Security Standards
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)

### Tool Documentation
- [GitHub Security Features](https://docs.github.com/en/code-security)
- [npm Security Audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Docker Security](https://docs.docker.com/engine/security/)

### Service Provider Security
- [EasyPost Security](https://www.easypost.com/security)
- [Veeqo Security Practices](https://www.veeqo.com/security)
- [Claude AI Security](https://www.anthropic.com/security)

## ⚠️ Remember

> **"Security is not a feature you add, it's a way you build."**

Security is everyone's responsibility. When in doubt:
1. **Ask questions** - consult the team
2. **Follow the principle of least privilege**
3. **Document security decisions**
4. **Test security measures**
5. **Keep security simple and maintainable**

---

*Last updated: Generated automatically*
*Next review: Quarterly security audit*