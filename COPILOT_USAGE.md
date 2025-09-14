# GitHub Copilot Pro Usage Guide

## Overview

This guide covers leveraging GitHub Copilot Pro for enhanced development productivity in the MCP Shipping Suite. Copilot Pro provides AI-powered code suggestions, completions, and chat-based assistance.

## 🚀 Setup and Configuration

### GitHub Copilot Pro Subscription

1. **Subscribe to Copilot Pro**
   - Visit [github.com/features/copilot](https://github.com/features/copilot)
   - Upgrade to Copilot Pro for enhanced features
   - Verify subscription in GitHub settings

2. **Enable for Organization** (if applicable)
   - Organization settings > Copilot
   - Enable for repository access
   - Configure user permissions

### IDE Configuration

#### Visual Studio Code (Recommended)

**Extensions:**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "GitHub.copilot",           // Core Copilot functionality
    "GitHub.copilot-labs",      // Experimental features
    "GitHub.copilot-chat"       // Chat interface
  ]
}
```

**Settings:**
```json
// .vscode/settings.json
{
  "github.copilot.enable": {
    "*": true,
    "typescript": true,
    "javascript": true,
    "python": true,
    "yaml": true,
    "json": true,
    "markdown": true
  },
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.editor.enableCodeActions": true,
  "github.copilot.chat.enabled": true,
  "editor.inlineSuggest.enabled": true,
  "editor.inlineSuggest.showToolbar": "always"
}
```

#### Cursor IDE

Copilot integrates seamlessly with Cursor's AI features:
```json
// Cursor settings
{
  "github.copilot.enable": true,
  "cursor.aiEnabled": true,
  "cursor.copilotEnabled": true
}
```

#### Other IDEs

- **JetBrains IDEs:** Install GitHub Copilot plugin
- **Neovim:** Use `github/copilot.vim` plugin
- **Emacs:** Use `zerolfx/copilot.el` package

## 💡 Core Features and Usage

### 1. Code Autocompletion

**Basic Usage:**
- Type function names, comments, or partial code
- Copilot suggests completions in gray text
- Press `Tab` to accept, `Esc` to dismiss
- Use `Alt + ]` / `Alt + [` to cycle through suggestions

**MCP-Specific Examples:**

```typescript
// Type comment to get implementation
// Create a function to validate shipment addresses using Zod
const validateShipmentAddress = (address: unknown) => {
  // Copilot suggests complete Zod schema and validation
  const addressSchema = z.object({
    name: z.string().min(1),
    street1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().default('US')
  });
  
  return addressSchema.parse(address);
};

// Type function signature to get implementation
async function createEasyPostShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
  // Copilot suggests complete implementation with error handling
  try {
    const validated = validateShipmentRequest(request);
    const response = await easyPostClient.createShipment(validated);
    
    logger.info('Shipment created', { 
      shipmentId: response.id,
      trackingCode: response.tracking_code 
    });
    
    return response;
  } catch (error) {
    logger.error('Shipment creation failed', { error: error.message });
    throw new ShipmentError('Failed to create shipment', error);
  }
}
```

### 2. GitHub Copilot Chat

**Access Methods:**
- VS Code: `Ctrl+Shift+I` or sidebar panel
- Chat panel for extended conversations
- Inline chat for quick questions

**Chat Commands:**

```bash
# Code explanation
/explain - Explain selected code
/doc - Generate documentation
/fix - Suggest fixes for problems
/optimize - Optimize selected code
/tests - Generate test cases

# Project-specific
/workspace - Ask about workspace context
/vscode - VS Code specific questions
```

**MCP Project Chat Examples:**

```
# Understanding MCP Protocol
You: Explain how MCP JSON-RPC 2.0 protocol works in this codebase

# Code Review Assistance  
You: Review this error handling pattern in the EasyPost service

# Testing Help
You: Generate comprehensive tests for the shipment validation logic

# Performance Optimization
You: How can I optimize the rate limiting implementation in server.ts?

# Architecture Questions
You: Explain the Nx monorepo structure and how apps/libs interact
```

### 3. Copilot Labs (Experimental Features)

**Enable Labs:**
```json
// VS Code settings
{
  "github.copilot.labs.enabled": true
}
```

**Labs Features:**
- **Explain Code:** Detailed code explanations
- **Translate Code:** Convert between languages
- **Brushes:** Code transformations (add types, add docs, etc.)
- **Test Generation:** Automated test creation

## 🎯 MCP Shipping Suite Specific Usage

### 1. API Integration Patterns

**EasyPost Integration:**
```typescript
// Type comment for API wrapper generation
// Create EasyPost client with rate limiting and retry logic
class EasyPostClient {
  // Copilot suggests complete implementation
  constructor(
    private apiKey: string,
    private rateLimiter: Bottleneck,
    private logger: Logger
  ) {}

  async createShipment(request: CreateShipmentRequest): Promise<Shipment> {
    // Copilot suggests rate-limited API call with error handling
    return this.rateLimiter.schedule(async () => {
      const response = await fetch(`${this.baseURL}/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shipment: request })
      });

      if (!response.ok) {
        throw new EasyPostError(`API Error: ${response.status}`, response);
      }

      return response.json();
    });
  }
}
```

**Veeqo Integration:**
```typescript
// Generate Veeqo inventory sync function
// Sync inventory levels between Veeqo and local database
async function syncInventoryLevels(productIds: string[]): Promise<void> {
  // Copilot suggests batch processing with error handling
  const batchSize = 50;
  const batches = chunk(productIds, batchSize);
  
  for (const batch of batches) {
    try {
      const inventoryLevels = await veeqoClient.getInventoryLevels(batch);
      await database.updateInventoryLevels(inventoryLevels);
      
      logger.info('Inventory sync completed', { 
        productCount: batch.length 
      });
    } catch (error) {
      logger.error('Inventory sync failed', { 
        batch, 
        error: error.message 
      });
      // Continue with next batch
    }
  }
}
```

### 2. MCP Protocol Implementation

**Tool Definition Generation:**
```typescript
// Type comment for MCP tool creation
// Define MCP tool for creating shipments with comprehensive validation
export const createShipmentTool: MCPTool = {
  // Copilot suggests complete tool definition
  name: 'create_shipment',
  description: 'Create a new shipment with carrier rate shopping and optimization',
  inputSchema: {
    type: 'object',
    properties: {
      from_address: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          company: { type: 'string' },
          street1: { type: 'string' },
          street2: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string', pattern: '^[A-Z]{2}$' },
          zip: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' },
          country: { type: 'string', default: 'US' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' }
        },
        required: ['name', 'street1', 'city', 'state', 'zip']
      },
      // Copilot continues with to_address and parcel definitions
    },
    required: ['from_address', 'to_address', 'parcel']
  }
};
```

**Request Handler Generation:**
```typescript
// Generate MCP request handler with proper error handling
async function handleCreateShipment(request: MCPRequest): Promise<MCPResponse> {
  // Copilot suggests complete handler implementation
  try {
    const { from_address, to_address, parcel, options } = request.params;
    
    // Validate input using Zod schema
    const validatedRequest = createShipmentSchema.parse({
      from_address,
      to_address, 
      parcel,
      options
    });

    // Create shipment via EasyPost
    const shipment = await easyPostService.createShipment(validatedRequest);
    
    // Log successful creation
    logger.info('Shipment created via MCP', {
      shipmentId: shipment.id,
      requestId: request.id
    });

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        success: true,
        shipment: {
          id: shipment.id,
          tracking_code: shipment.tracking_code,
          label_url: shipment.postage_label?.label_url,
          rates: shipment.rates.map(rate => ({
            carrier: rate.carrier,
            service: rate.service,
            rate: rate.rate,
            delivery_days: rate.delivery_days
          }))
        }
      }
    };
  } catch (error) {
    logger.error('MCP shipment creation failed', {
      error: error.message,
      requestId: request.id
    });

    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32000,
        message: 'Shipment creation failed',
        data: { 
          originalError: error.message,
          timestamp: new Date().toISOString()
        }
      }
    };
  }
}
```

### 3. Testing and Quality Assurance

**Test Generation:**
```typescript
// Generate comprehensive test suite for shipment service
describe('ShipmentService', () => {
  // Copilot suggests complete test setup and cases
  let shipmentService: ShipmentService;
  let mockEasyPostClient: jest.Mocked<EasyPostClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockEasyPostClient = createMockEasyPostClient();
    mockLogger = createMockLogger();
    shipmentService = new ShipmentService(mockEasyPostClient, mockLogger);
  });

  describe('createShipment', () => {
    it('should create shipment successfully with valid input', async () => {
      // Copilot suggests realistic test data and assertions
      const request = createValidShipmentRequest();
      const expectedResponse = createMockShipmentResponse();
      
      mockEasyPostClient.createShipment.mockResolvedValue(expectedResponse);

      const result = await shipmentService.createShipment(request);

      expect(result).toEqual(expectedResponse);
      expect(mockEasyPostClient.createShipment).toHaveBeenCalledWith(request);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Shipment created successfully',
        expect.objectContaining({ shipmentId: expectedResponse.id })
      );
    });

    it('should handle validation errors gracefully', async () => {
      const invalidRequest = { invalid: 'data' };

      await expect(
        shipmentService.createShipment(invalidRequest as any)
      ).rejects.toThrow(ValidationError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Shipment validation failed',
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });
});
```

## 🛠️ Advanced Features

### 1. Custom Prompts and Context

**Project-Specific Context:**
```typescript
// Add project context in comments for better suggestions
/**
 * MCP Shipping Suite - EasyPost Integration
 * 
 * This service handles all EasyPost API interactions for the MCP Shipping Suite.
 * Key requirements:
 * - Rate limiting (1000 requests/minute)
 * - Comprehensive error handling
 * - Structured logging with correlation IDs
 * - Webhook signature verification
 * - TypeScript strict mode compliance
 */
```

**Coding Patterns:**
```typescript
// Establish patterns that Copilot learns from
const RATE_LIMIT_CONFIG = {
  maxConcurrent: 10,
  minTime: 100, // 100ms between requests
  reservoir: 1000, // 1000 requests
  reservoirRefreshAmount: 1000,
  reservoirRefreshInterval: 60 * 1000 // 1 minute
};

// Copilot will suggest similar configurations for other services
const VEEQO_RATE_LIMIT_CONFIG = {
  // Similar pattern will be suggested
};
```

### 2. Documentation Generation

**API Documentation:**
```typescript
/**
 * Creates a new shipment using EasyPost API
 * 
 * @param request - Shipment creation request containing addresses and parcel info
 * @returns Promise resolving to created shipment with tracking information
 * @throws {ValidationError} When request data is invalid
 * @throws {RateLimitError} When API rate limit is exceeded
 * @throws {EasyPostError} When EasyPost API returns an error
 * 
 * @example
 * ```typescript
 * const shipment = await createShipment({
 *   from_address: {
 *     name: "John Doe",
 *     street1: "123 Main St",
 *     city: "San Francisco",
 *     state: "CA",
 *     zip: "94105"
 *   },
 *   to_address: {
 *     name: "Jane Smith", 
 *     street1: "456 Oak Ave",
 *     city: "New York",
 *     state: "NY",
 *     zip: "10001"
 *   },
 *   parcel: {
 *     length: 10,
 *     width: 8,
 *     height: 6,
 *     weight: 2.5
 *   }
 * });
 * ```
 */
async function createShipment(request: CreateShipmentRequest): Promise<Shipment> {
  // Implementation...
}
```

### 3. Code Refactoring

**Refactoring Assistance:**
```typescript
// Select legacy code and ask Copilot to refactor
// Old callback-based code:
function createShipmentOld(request, callback) {
  easypost.shipment.create(request, (err, shipment) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, shipment);
    }
  });
}

// Copilot suggests modern async/await refactor:
async function createShipmentNew(request: CreateShipmentRequest): Promise<Shipment> {
  try {
    const shipment = await easypost.shipment.create(request);
    return shipment;
  } catch (error) {
    throw new ShipmentError('Failed to create shipment', error);
  }
}
```

## 📈 Productivity Tips

### 1. Keyboard Shortcuts

**VS Code:**
- `Tab` - Accept suggestion
- `Ctrl+Right Arrow` - Accept word
- `Alt+]` / `Alt+[` - Next/previous suggestion
- `Ctrl+Shift+I` - Open Copilot Chat
- `Ctrl+I` - Inline chat

### 2. Best Practices

**Writing Better Prompts:**
```typescript
// ✅ Good: Descriptive function name and context
// Create a function to validate EasyPost webhook signatures using HMAC-SHA256
function validateEasyPostWebhook(payload: string, signature: string, secret: string): boolean {
  // Copilot provides accurate implementation
}

// ❌ Poor: Vague naming
function validate(data: any): boolean {
  // Copilot may provide generic validation
}
```

**Providing Context:**
```typescript
// ✅ Good: Include business logic context
// Calculate shipping cost with dimensional weight pricing
// Dimensional weight = (L × W × H) / 139 (for inches)
// Use greater of actual weight or dimensional weight
function calculateShippingCost(parcel: Parcel, rate: Rate): number {
  // Copilot understands the business rule
}
```

**Using Comments Effectively:**
```typescript
// ✅ Good: Explain the "why" not just "what"
// Use exponential backoff to handle temporary API failures gracefully
// Start with 1s delay, double each retry, max 5 attempts
async function retryApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  // Copilot provides robust retry logic
}
```

### 3. Learning from Copilot

**Code Exploration:**
```typescript
// Use Copilot to explore APIs and patterns
// How to handle EasyPost rate limiting with bottleneck?
const rateLimiter = new Bottleneck({
  // Copilot suggests appropriate configuration
});

// What's the best pattern for error handling in async functions?
async function exampleFunction(): Promise<Result<Data, Error>> {
  // Copilot suggests Result pattern or other error handling approaches
}
```

## 🔍 Code Review Integration

### 1. Pull Request Reviews

**Copilot for Code Review:**
- Use Copilot chat to understand complex changes
- Ask for explanation of algorithms or patterns
- Generate test cases for new functionality
- Suggest improvements or optimizations

**Example Review Process:**
```bash
# In VS Code, review PR changes
# Select complex function and ask Copilot:
"Explain this function and identify potential issues"

# For new features:
"Generate comprehensive tests for this shipment validation logic"

# For performance concerns:
"How can this database query be optimized?"
```

### 2. Automated Code Review

**GitHub Copilot Integration:**
- Copilot suggestions appear in PR diff view
- Use Copilot X for automated PR summaries
- Generate commit messages with Copilot

## 🚨 Limitations and Best Practices

### 1. Security Considerations

**What to Avoid:**
```typescript
// ❌ Don't let Copilot suggest hardcoded secrets
const apiKey = "sk-live-..."; // Copilot might suggest actual keys

// ✅ Use environment variables
const apiKey = process.env.EASYPOST_API_KEY;

// ❌ Don't trust suggestions for cryptographic operations without verification
function hashPassword(password: string): string {
  // Verify Copilot's crypto suggestions against security best practices
}
```

**Data Privacy:**
```typescript
// ❌ Avoid including sensitive data in comments
// Customer email: john@example.com, SSN: 123-45-6789

// ✅ Use generic examples
// Customer email: user@example.com, ID: user123
```

### 2. Code Quality

**Validation Required:**
- Always review Copilot suggestions for correctness
- Test generated code thoroughly
- Verify security implications
- Check for performance issues
- Ensure consistency with project patterns

**Domain Knowledge:**
```typescript
// Copilot may not understand business rules
// Always verify shipping industry specific logic
function calculateDimensionalWeight(length: number, width: number, height: number): number {
  // Verify the divisor (139 for inches, 5000 for cm) is correct for your region
  return (length * width * height) / 139;
}
```

### 3. Monitoring Usage

**Track Productivity:**
- Monitor acceptance rate of suggestions
- Measure time saved on routine tasks
- Track code quality metrics
- Review generated test coverage

**Team Guidelines:**
- Establish team standards for Copilot usage
- Regular training on effective prompting
- Code review processes that account for AI assistance
- Documentation of AI-generated code

## 📚 Resources

### Official Documentation
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Copilot Pro Features](https://github.com/features/copilot)
- [VS Code Copilot Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)

### Best Practices
- [Copilot Best Practices Guide](https://docs.github.com/en/copilot/using-github-copilot/best-practices-for-using-github-copilot)
- [Effective Prompting Techniques](https://github.blog/2023-06-20-how-to-write-better-prompts-for-github-copilot/)

### Community Resources
- [Copilot Community Discussions](https://github.com/orgs/community/discussions/categories/copilot)
- [Copilot Tips and Tricks](https://github.blog/tag/github-copilot/)

### MCP Specific
- [Project Repository](https://github.com/your-org/perplexity-mcp-shipping-suite)
- [MCP Protocol Documentation](https://spec.modelcontextprotocol.io/)
- [TypeScript Best Practices](./docs/typescript-patterns.md)

---

*Maximize your development productivity with GitHub Copilot Pro in the MCP Shipping Suite.*