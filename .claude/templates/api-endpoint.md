# Template: API Endpoint Implementation

## Endpoint Overview
**Endpoint:** `{{method}} {{path}}`  
**Purpose:** {{endpoint_purpose}}  
**Owner:** {{team_name}}  
**Version:** {{api_version}}

## Requirements Analysis

### **Functional Requirements**
- {{requirement_1}}
- {{requirement_2}}
- {{requirement_3}}

### **Non-Functional Requirements**
- **Performance:** {{performance_target}} (e.g., < 200ms response time)
- **Throughput:** {{throughput_target}} (e.g., 1000 RPS)
- **Availability:** {{availability_target}} (e.g., 99.9% uptime)
- **Security:** {{security_requirements}}

## API Specification

### **OpenAPI Definition**
```yaml
paths:
  {{path}}:
    {{method}}:
      summary: {{endpoint_summary}}
      description: {{detailed_description}}
      tags:
        - {{tag_name}}
      parameters:
        - name: {{param_name}}
          in: {{param_location}}
          required: {{required}}
          schema:
            type: {{param_type}}
            description: {{param_description}}
      requestBody:
        required: {{body_required}}
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/{{RequestSchema}}'
            example:
              {{request_example}}
      responses:
        '{{success_code}}':
          description: {{success_description}}
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/{{ResponseSchema}}'
              example:
                {{response_example}}
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden  
        '404':
          description: Not Found
        '500':
          description: Internal Server Error
      security:
        - {{auth_scheme}}: [{{required_scopes}}]
```

### **Schema Definitions**
```yaml
components:
  schemas:
    {{RequestSchema}}:
      type: object
      required:
        - {{required_field}}
      properties:
        {{field_name}}:
          type: {{field_type}}
          description: {{field_description}}
          example: {{field_example}}
          
    {{ResponseSchema}}:
      type: object
      properties:
        data:
          type: {{data_type}}
          description: {{data_description}}
        meta:
          type: object
          properties:
            timestamp:
              type: string
              format: date-time
            request_id:
              type: string
              description: Unique request identifier
        links:
          type: object
          properties:
            self:
              type: string
              description: Link to this resource
```

## Implementation

### **Controller/Handler**
```typescript
// {{endpoint_name}}.controller.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { {{ServiceName}} } from '../services/{{service_name}}.service';
import { ValidationError, NotFoundError } from '../errors';

// Request validation schema
const {{RequestSchema}} = z.object({
  {{field_name}}: z.{{validation_rule}}().{{constraints}},
  // Add more fields as needed
});

// Query parameter validation
const {{QuerySchema}} = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort: z.enum(['asc', 'desc']).default('asc'),
  filter: z.string().optional(),
});

export class {{ControllerName}} {
  constructor(private {{service_name}}Service: {{ServiceName}}) {}

  async {{method_name}}(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request parameters
      const params = {{QuerySchema}}.parse(req.query);
      
      // Validate request body (if applicable)
      const body = {{method}} !== 'GET' ? {{RequestSchema}}.parse(req.body) : undefined;
      
      // Extract user context
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      
      // Authorization check
      if (!this.hasPermission(userRoles, '{{required_permission}}')) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Insufficient permissions'
        });
      }
      
      // Rate limiting check
      await this.checkRateLimit(req.ip, '{{endpoint_key}}');
      
      // Business logic execution
      const result = await this.{{service_name}}Service.{{method_name}}({
        ...params,
        ...(body && { data: body }),
        userId,
        requestId: req.requestId
      });
      
      // Log successful operation
      req.logger.info('{{endpoint_name}} completed successfully', {
        userId,
        requestId: req.requestId,
        duration: Date.now() - req.startTime
      });
      
      // Format response
      const response = {
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          request_id: req.requestId,
          ...(result.pagination && { pagination: result.pagination })
        },
        links: {
          self: `${req.baseUrl}${req.path}`,
          ...(this.generateRelatedLinks(result, req))
        }
      };
      
      // Set appropriate status code
      const statusCode = {{method}} === 'POST' ? 201 : 200;
      
      // Set cache headers (if applicable)
      if ({{method}} === 'GET' && {{cacheable}}) {
        res.set('Cache-Control', 'public, max-age={{cache_duration}}');
        res.set('ETag', this.generateETag(result));
      }
      
      res.status(statusCode).json(response);
      
    } catch (error) {
      // Handle specific error types
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        });
      }
      
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: error.message
        });
      }
      
      // Log unexpected errors
      req.logger.error('{{endpoint_name}} error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestId: req.requestId
      });
      
      next(error);
    }
  }
  
  private hasPermission(userRoles: string[], requiredPermission: string): boolean {
    // Implement role-based permission checking
    return userRoles.includes(requiredPermission) || userRoles.includes('admin');
  }
  
  private async checkRateLimit(ip: string, key: string): Promise<void> {
    // Implement rate limiting logic
    const limit = {{rate_limit}};
    const window = {{rate_window}};
    // ... rate limiting implementation
  }
  
  private generateRelatedLinks(result: any, req: Request) {
    // Generate HATEOAS links
    const links: any = {};
    
    if (result.id) {
      links.edit = `${req.baseUrl}/{{resource}}/${result.id}`;
      links.delete = `${req.baseUrl}/{{resource}}/${result.id}`;
    }
    
    return links;
  }
  
  private generateETag(data: any): string {
    // Generate ETag for caching
    return `"${Buffer.from(JSON.stringify(data)).toString('base64')}"`;
  }
}
```

### **Service Layer**
```typescript
// {{service_name}}.service.ts
import { {{RepositoryName}} } from '../repositories/{{repository_name}}.repository';
import { {{EventPublisher}} } from '../events/{{event_publisher}}';
import { {{CacheService}} } from '../cache/{{cache_service}}';

export class {{ServiceName}} {
  constructor(
    private {{repository_name}}Repository: {{RepositoryName}},
    private eventPublisher: {{EventPublisher}},
    private cacheService: {{CacheService}}
  ) {}

  async {{method_name}}(params: {{ParamsType}}): Promise<{{ReturnType}}> {
    // Input validation and sanitization
    const sanitizedParams = this.sanitizeInput(params);
    
    // Check cache first (if applicable)
    if ({{use_cache}}) {
      const cacheKey = this.generateCacheKey(sanitizedParams);
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Business logic validation
    await this.validateBusinessRules(sanitizedParams);
    
    // Database transaction
    const result = await this.{{repository_name}}Repository.transaction(async (trx) => {
      // Perform database operations
      const {{entity}} = await this.{{repository_name}}Repository.{{db_operation}}(
        sanitizedParams,
        trx
      );
      
      // Update related entities (if needed)
      if ({{has_side_effects}}) {
        await this.updateRelatedEntities({{entity}}, trx);
      }
      
      return {{entity}};
    });
    
    // Cache the result
    if ({{use_cache}}) {
      const cacheKey = this.generateCacheKey(sanitizedParams);
      await this.cacheService.set(cacheKey, result, {{cache_ttl}});
    }
    
    // Publish domain events
    await this.publishEvents(result, params);
    
    // Return formatted result
    return this.formatResponse(result);
  }
  
  private sanitizeInput(params: any): any {
    // Implement input sanitization
    return {
      ...params,
      // Remove/escape dangerous characters
      // Normalize data formats
    };
  }
  
  private async validateBusinessRules(params: any): Promise<void> {
    // Implement business logic validation
    // Throw appropriate errors for violations
  }
  
  private async publishEvents(result: any, params: any): Promise<void> {
    const event = {
      type: '{{domain}}.{{entity}}.{{action}}',
      version: '1.0.0',
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: params.requestId,
        userId: params.userId
      }
    };
    
    await this.eventPublisher.publish(event);
  }
}
```

## Testing Strategy

### **Unit Tests**
```typescript
// {{endpoint_name}}.test.ts
import request from 'supertest';
import { app } from '../app';
import { {{ServiceName}} } from '../services/{{service_name}}.service';

describe('{{method}} {{path}}', () => {
  let mockService: jest.Mocked<{{ServiceName}}>;
  
  beforeEach(() => {
    mockService = {
      {{method_name}}: jest.fn(),
    } as any;
    
    // Inject mock service
    app.container.bind({{ServiceName}}).toConstantValue(mockService);
  });
  
  describe('Success cases', () => {
    it('should {{success_case_1}}', async () => {
      // Arrange
      const requestData = {{valid_request_data}};
      const expectedResponse = {{expected_response}};
      mockService.{{method_name}}.mockResolvedValue(expectedResponse);
      
      // Act
      const response = await request(app)
        .{{method_lowercase}}('{{path}}')
        .send(requestData)
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe({{expected_status}});
      expect(response.body.data).toEqual(expectedResponse);
      expect(mockService.{{method_name}}).toHaveBeenCalledWith(
        expect.objectContaining(requestData)
      );
    });
  });
  
  describe('Error cases', () => {
    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .{{method_lowercase}}('{{path}}')
        .send({{invalid_request_data}})
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
    
    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .{{method_lowercase}}('{{path}}')
        .send({{valid_request_data}});
      
      expect(response.status).toBe(401);
    });
    
    it('should return 403 for insufficient permissions', async () => {
      const response = await request(app)
        .{{method_lowercase}}('{{path}}')
        .send({{valid_request_data}})
        .set('Authorization', 'Bearer limited-token');
      
      expect(response.status).toBe(403);
    });
  });
});
```

### **Integration Tests**
```typescript
// {{endpoint_name}}.integration.test.ts
import { setupTestDatabase, cleanupTestDatabase } from '../test/setup';
import { createTestUser, createAuthToken } from '../test/helpers';

describe('{{method}} {{path}} Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  it('should handle complete workflow', async () => {
    // Create test data
    const user = await createTestUser({{user_data}});
    const token = createAuthToken(user);
    
    // Execute request
    const response = await request(app)
      .{{method_lowercase}}('{{path}}')
      .send({{request_data}})
      .set('Authorization', `Bearer ${token}`);
    
    // Verify response
    expect(response.status).toBe({{expected_status}});
    
    // Verify database state
    const {{entity}} = await {{EntityModel}}.findById(response.body.data.id);
    expect({{entity}}).toBeDefined();
    expect({{entity}}.{{field}}).toBe({{expected_value}});
    
    // Verify events were published
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '{{event_type}}'
      })
    );
  });
});
```

## Performance Considerations

### **Optimization Checklist**
- [ ] Database query optimization (indexes, joins)
- [ ] Response payload size minimization
- [ ] Caching strategy implementation
- [ ] Rate limiting configuration
- [ ] Connection pooling setup
- [ ] Async processing for heavy operations

### **Performance Targets**
- **Response Time:** {{response_time_target}}
- **Throughput:** {{throughput_target}}
- **Error Rate:** {{error_rate_target}}
- **Cache Hit Rate:** {{cache_hit_rate_target}}

## Monitoring & Alerting

### **Metrics to Track**
- Request rate and response time
- Error rates by type (4xx, 5xx)
- Cache hit/miss rates
- Database query performance
- Authentication/authorization failures

### **Alert Conditions**
- Response time > {{alert_threshold}}ms
- Error rate > {{error_threshold}}%
- Request rate spike > {{spike_threshold}}x normal
- Cache hit rate < {{cache_threshold}}%

## Security Checklist

- [ ] Input validation and sanitization
- [ ] Authentication required
- [ ] Authorization checks implemented
- [ ] Rate limiting configured
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection (if applicable)
- [ ] Sensitive data encryption
- [ ] Audit logging enabled

---
*Generated with Claude Code - API Endpoint Template*