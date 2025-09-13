# Copilot Configuration Test

This file tests if GitHub Copilot is properly configured for the project.

## Test Instructions

1. **Open VS Code**:
   ```bash
   code .vscode/perplexity-mcp.code-workspace
   ```

2. **Create a new TypeScript file** and test these patterns:

### Test 1: MCP Handler Pattern
```typescript
// Create a new MCP tool handler for shipment tracking
async handleTrackShipment(args: any): Promise<any> {
  // Copilot should suggest proper validation, logging, and error handling
}
```

### Test 2: API Service Pattern
```typescript
// Create a new EasyPost service method for address validation
class EasyPostService {
  async validateAddress(address: any) {
    // Copilot should suggest rate limiting, error handling, and response validation
  }
}
```

### Test 3: Zod Schema Pattern
```typescript
// Create a validation schema for shipping address
const addressSchema = z.object({
  // Copilot should suggest proper address fields with validation
});
```

### Test 4: Jest Test Pattern
```typescript
// Create unit tests for shipment creation
describe('ShipmentService', () => {
  // Copilot should suggest proper test structure with setup/teardown
});
```

## Expected Behavior

If Copilot is properly configured, you should see:
- ✅ Suggestions that follow MCP protocol patterns
- ✅ Proper TypeScript types and error handling
- ✅ Zod validation schemas with appropriate constraints
- ✅ Jest test patterns with proper structure
- ✅ Rate limiting and API integration patterns
- ✅ Logging with structured format

## Troubleshooting

If suggestions don't appear or seem generic:
1. Check GitHub Copilot subscription and VS Code extension
2. Ensure `.github/copilot-instructions.md` is in repository root
3. Reload VS Code window
4. Check VS Code settings for Copilot configuration
5. Review `.copilotignore` to ensure files aren't excluded

## Validation Commands

```bash
# Check if Copilot files are properly tracked
git ls-files | grep -E "(copilot|vscode)"

# Verify workspace configuration
ls -la .vscode/

# Check if configuration files exist
ls -la .github/copilot-instructions.md .copilotignore
```

Success indicators:
- All configuration files present ✅
- VS Code loads workspace properly ✅
- Copilot suggestions are context-aware ✅
- No sensitive files suggested by Copilot ✅