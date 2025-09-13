# GitHub Copilot Setup and Usage Guide

## Overview

This repository is configured with comprehensive GitHub Copilot instructions to help developers work more efficiently with the MCP (Model Context Protocol) shipping automation codebase.

## Setup

### Prerequisites
- GitHub Copilot subscription
- VS Code with GitHub Copilot extension installed
- Node.js 18+ and npm

### Installation
1. **Install VS Code Extensions**:
   ```bash
   code --install-extension github.copilot
   code --install-extension github.copilot-chat
   ```

2. **Open Workspace**:
   ```bash
   code .vscode/perplexity-mcp.code-workspace
   ```

3. **Verify Configuration**:
   - Check that Copilot is enabled in VS Code status bar
   - Open a TypeScript file and verify suggestions appear
   - Test Copilot Chat with: "Explain this MCP server architecture"

## Configuration Files

### `.github/copilot-instructions.md`
Primary configuration providing:
- Project architecture overview
- MCP protocol patterns and best practices
- TypeScript/Node.js coding guidelines
- Testing strategies and patterns
- API integration patterns

### `.vscode/settings.json`
Workspace-specific Copilot settings:
- File type associations
- Auto-completion preferences
- IntelliSense configuration

### `.copilotignore`
Security configuration excluding:
- Environment files with API keys
- Build artifacts and logs
- Sensitive credentials and secrets

## Using Copilot Effectively

### Code Generation
Copilot understands these project-specific patterns:

**MCP Tool Handler**:
```typescript
// Copilot will suggest proper MCP handler pattern
async handleCreateShipment(args: any): Promise<any> {
  // Type your intent and let Copilot complete
}
```

**API Service Integration**:
```typescript
// Copilot knows the rate limiting and retry patterns
class EasyPostService {
  constructor(apiKey: string) {
    // Copilot will suggest proper initialization
  }
}
```

**Validation Schemas**:
```typescript
// Copilot understands Zod schema patterns
const shipmentSchema = z.object({
  // Describe the fields and Copilot will complete
});
```

### Copilot Chat Commands

Use these prompts for optimal results:

**Architecture Questions**:
- "How should I structure a new MCP tool for tracking shipments?"
- "What's the best way to handle rate limiting for the Veeqo API?"
- "Explain the error handling pattern used in this codebase"

**Code Review**:
- "Review this MCP handler for security issues"
- "Check if this API integration follows project patterns"
- "Validate this Zod schema against the API documentation"

**Testing Assistance**:
- "Generate unit tests for this shipping service"
- "Create integration tests for this MCP tool"
- "Write E2E tests for this shipment workflow"

### Best Practices

#### Do:
- ✅ Use descriptive variable names to guide Copilot
- ✅ Write comments explaining business logic before coding
- ✅ Leverage Copilot for boilerplate code and tests
- ✅ Use Copilot Chat for architecture decisions
- ✅ Review all generated code for business logic correctness

#### Don't:
- ❌ Accept Copilot suggestions without review
- ❌ Use Copilot for sensitive security logic without validation
- ❌ Let Copilot generate API keys or secrets
- ❌ Accept database queries without security review

## Common Workflows

### Adding a New MCP Tool

1. **Start with a comment**:
   ```typescript
   // Create a new MCP tool to validate international addresses using EasyPost
   ```

2. **Let Copilot suggest the structure**:
   ```typescript
   // Copilot will suggest proper handler, validation, and types
   ```

3. **Use Chat for complex logic**:
   "How should I handle address validation errors in an MCP tool?"

### API Integration

1. **Describe the integration**:
   ```typescript
   // Integrate with FedEx tracking API, include rate limiting and retry logic
   ```

2. **Let Copilot build the service**:
   ```typescript
   // Copilot knows the project patterns for API services
   ```

3. **Generate tests**:
   "Generate comprehensive tests for this FedEx integration"

### Debugging

1. **Use debug configurations**:
   - Use the preconfigured launch.json for debugging
   - Set breakpoints and inspect MCP protocol messages

2. **Copilot debugging assistance**:
   "Why might this MCP tool be returning validation errors?"
   "Help me debug this rate limiting issue"

## Security Considerations

### What Copilot Can See
- Code structure and patterns
- Comments and documentation
- Import/export statements
- Public APIs and schemas

### What Copilot Cannot See (via .copilotignore)
- API keys and secrets
- Environment files
- Build artifacts
- Sensitive credentials

### Review Requirements
Always review Copilot suggestions for:
- API key handling
- Input validation logic
- Error message content (no sensitive data)
- Database queries and security
- Authentication and authorization

## Troubleshooting

### Copilot Not Working
1. Check GitHub Copilot subscription status
2. Verify VS Code extension is installed and enabled
3. Reload VS Code window
4. Check network connectivity

### Poor Suggestions
1. Add more descriptive comments
2. Use consistent naming patterns
3. Ensure proper project structure
4. Leverage the workspace configuration

### Configuration Issues
1. Verify `.github/copilot-instructions.md` is in repository root
2. Check `.vscode/settings.json` permissions
3. Ensure `.copilotignore` is properly formatted

## Advanced Usage

### Custom Prompts
Create project-specific prompts for common tasks:

```typescript
// Generate a complete MCP tool for [specific shipping task]
// Include: validation, error handling, logging, and tests
```

### Team Collaboration
- Share workspace configurations across team
- Document custom Copilot patterns in team wiki
- Review Copilot-generated code in pull requests

### Integration with CI/CD
- Use Copilot-generated tests in pipeline
- Leverage Copilot for documentation updates
- Generate deployment scripts with Copilot assistance

## Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [VS Code Copilot Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Project Architecture Documentation](./docs/)

## Support

For Copilot-specific issues:
1. Check VS Code Developer Tools console
2. Review GitHub Copilot status page
3. Consult team documentation
4. Contact repository maintainers

Remember: GitHub Copilot is a powerful tool, but the final responsibility for code quality, security, and correctness remains with the developer.