# Claude Integration Guide

## Overview

This guide covers integrating Claude AI into the MCP Shipping Suite development workflow. Claude can be used in three modes: API integration, local CLI, and manual web UI.

## 🔧 Integration Modes

### 1. API Mode (Automated CI/CD)

**Best for:** Automated code review and analysis in CI/CD pipelines

#### Setup
1. **Get Claude API Key**
   - Sign up for Claude API access at [console.anthropic.com](https://console.anthropic.com/)
   - Generate an API key
   - Add to GitHub Secrets as `CLAUDE_API_KEY`

2. **Configure GitHub Secrets**
   ```bash
   # Repository Settings > Secrets and Variables > Actions
   CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
   USE_CLAUDE=true
   ```

3. **CI Integration**
   The CI pipeline automatically runs Claude analysis when:
   - `CLAUDE_API_KEY` secret exists
   - `USE_CLAUDE` is set to `'true'`

#### API Usage Example
```bash
# The CI workflow makes this API call:
curl -X POST "https://api.anthropic.com/v1/messages" \
  -H "Authorization: Bearer $CLAUDE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 4000,
    "messages": [{
      "role": "user", 
      "content": "Analyze this MCP shipping project..."
    }]
  }'
```

#### Rate Limits and Costs
- **Rate Limit:** 1000 requests/minute for API
- **Cost:** ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **Recommended:** Use for key branches (main, develop) to manage costs

### 2. Local CLI Mode (Preferred for Development)

**Best for:** Interactive development, local code analysis, rapid iteration

#### Installation
```bash
# Install Claude CLI (when available)
npm install -g @anthropic-ai/claude-cli

# Or use alternative local setup
pip install anthropic
```

#### Authentication
```bash
# Authenticate with Claude CLI
claude auth login

# Verify authentication
claude auth status
```

#### Usage
```bash
# Run comprehensive project analysis
./scripts/claude_local.sh --analyze

# Interactive mode for development
./scripts/claude_local.sh --interactive

# Analyze specific files
./scripts/claude_local.sh --code apps/easypost/src/server.ts

# Quick project summary
./scripts/claude_local.sh --summary
```

#### Local CLI Features
- **Real-time feedback** during development
- **Interactive sessions** for debugging
- **File-specific analysis** for focused improvements
- **Offline preparation** of prompts for web UI

### 3. Manual Web UI Mode (Fallback)

**Best for:** Teams without API access, one-off analysis, detailed review

#### Workflow
1. **Generate Prompt**
   ```bash
   # Generate project summary and Claude prompt
   node scripts/generate-summary.js
   ```

2. **Download Prompt from CI**
   - CI generates `claude-prompt-manual` artifact
   - Download from GitHub Actions run
   - Or use locally generated `ARTIFACTS/CLAUDE_PROMPT_FOR_SUMMARY.txt`

3. **Use Claude Web UI**
   - Go to [claude.ai](https://claude.ai)
   - Start new conversation
   - Paste the full prompt
   - Copy response to `SUMMARY_CLAUDE.md`

4. **CI Integration**
   - CI will comment on PRs with prompt instructions
   - Manual step required to paste Claude's response
   - Include `SUMMARY_CLAUDE.md` in PR commits

## 📋 What Claude Analyzes

### Architecture Review
- Nx monorepo structure and organization
- Service separation and communication patterns
- Dependency management and build order
- Scalability and maintainability concerns

### Code Quality Assessment
- TypeScript patterns and type safety
- Error handling strategies
- MCP protocol implementation
- API integration patterns

### Security Analysis
- Input validation and sanitization
- Authentication and authorization
- Secret management practices
- Rate limiting and abuse prevention

### Performance Optimization
- API call efficiency and caching
- Database query optimization
- Memory usage and resource management
- Async/await patterns and error propagation

### Development Experience
- Build system optimization
- Testing strategy improvements
- Documentation quality and completeness
- Developer tooling enhancements

### Testing Strategy
- Unit test coverage and quality
- Integration test patterns
- E2E testing for user workflows
- Mock strategies for external services

## 🛠️ Integration Patterns

### CI/CD Integration
```yaml
# .github/workflows/ci-cd.yml
optional-claude-api:
  if: ${{ secrets.CLAUDE_API_KEY && secrets.USE_CLAUDE == 'true' }}
  steps:
    - name: Generate project summary
      run: node scripts/generate-summary.js
    
    - name: Call Claude API
      run: |
        # API call with generated prompt
        # Saves response to SUMMARY_CLAUDE.md
    
    - name: Upload analysis
      uses: actions/upload-artifact@v4
      with:
        name: claude-analysis
        path: SUMMARY_CLAUDE.md
```

### Local Development Integration
```bash
# Add to package.json scripts
{
  "scripts": {
    "analyze": "scripts/claude_local.sh --analyze",
    "review": "scripts/claude_local.sh --interactive"
  }
}

# Use in development workflow
pnpm run analyze    # Full project analysis
pnpm run review     # Interactive session
```

### Pre-commit Hook Integration
```yaml
# .pre-commit-config.yaml
- repo: local
  hooks:
    - id: claude-analysis
      name: Claude Code Analysis
      entry: scripts/claude_local.sh --summary
      language: system
      stages: [manual]
```

## 🔍 Prompt Engineering

### Generated Prompts Include
- **Project context** and technical stack
- **Current architecture** overview
- **Specific areas of focus** for analysis
- **Code examples** and patterns
- **Recent changes** and git history
- **Metrics and health status**

### Custom Prompt Sections
```markdown
## Custom Analysis Request
Please focus on:
1. MCP protocol implementation patterns
2. API integration error handling
3. TypeScript type safety improvements
4. Performance optimization opportunities
5. Security vulnerability assessment
```

### Prompt Optimization Tips
- **Be specific** about analysis areas
- **Include context** about recent changes
- **Request actionable** recommendations
- **Ask for code examples** in responses
- **Specify format** for responses (markdown, JSON, etc.)

## 📊 Analysis Output

### Expected Response Format
```markdown
# Claude Analysis: MCP Shipping Suite

## Executive Summary
- Overall architecture assessment
- Key recommendations
- Priority improvements

## Detailed Analysis
### Architecture Review
- [Specific findings and recommendations]

### Code Quality
- [Type safety, patterns, best practices]

### Security Assessment
- [Vulnerabilities and mitigation strategies]

### Performance Optimization
- [Bottlenecks and improvement opportunities]

## Action Items
1. High Priority: [Critical issues]
2. Medium Priority: [Improvements]
3. Low Priority: [Nice-to-have enhancements]
```

### Integration with Development Workflow
- **Save as `SUMMARY_CLAUDE.md`** in repository
- **Reference in pull requests** for code review
- **Track action items** in project management tools
- **Update documentation** based on recommendations

## 🚀 Best Practices

### For API Integration
- **Monitor usage** to control costs
- **Cache responses** for similar prompts
- **Use for key milestones** not every commit
- **Set up alerts** for API failures

### For Local CLI
- **Use interactive mode** for development
- **Prepare prompts offline** for efficiency
- **Save common prompts** for reuse
- **Integrate with editor** workflows

### For Manual Web UI
- **Prepare comprehensive prompts** beforehand
- **Copy responses carefully** to avoid formatting issues
- **Version control responses** for tracking
- **Use for major reviews** and planning

### General Guidelines
- **Validate Claude's suggestions** before implementing
- **Combine with human code review** for best results
- **Use for learning** and skill development
- **Document insights** for team knowledge sharing

## 🔧 Troubleshooting

### Common Issues

#### API Authentication Failures
```bash
# Check API key format
echo $CLAUDE_API_KEY | cut -c1-10  # Should start with sk-ant-

# Test API access
curl -H "Authorization: Bearer $CLAUDE_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     https://api.anthropic.com/v1/models
```

#### CLI Authentication Issues
```bash
# Check authentication status
claude auth status

# Re-authenticate if needed
claude auth logout
claude auth login
```

#### Prompt Generation Failures
```bash
# Debug prompt generation
node scripts/generate-summary.js --verbose

# Check file permissions
ls -la scripts/
chmod +x scripts/claude_local.sh
```

### Error Codes and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API key | Check `CLAUDE_API_KEY` format |
| 429 Rate Limited | Too many requests | Implement backoff, reduce frequency |
| 500 Server Error | Claude API issues | Retry later, check status page |
| ENOENT | Missing scripts | Run `node scripts/generate-summary.js` first |

## 📚 Additional Resources

### Documentation
- [Claude API Documentation](https://docs.anthropic.com/claude/reference/)
- [Anthropic Safety Guidelines](https://www.anthropic.com/safety)
- [Claude Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)

### Community
- [Anthropic Discord](https://discord.gg/anthropic)
- [Claude Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [Claude API Examples](https://github.com/anthropics/claude-api-examples)

### MCP Specific
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Shipping API Best Practices](docs/shipping-api-patterns.md)

---

*Need help? Check the troubleshooting section or reach out to the development team.*