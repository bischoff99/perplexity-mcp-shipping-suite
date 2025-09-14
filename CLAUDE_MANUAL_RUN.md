# Claude Manual Web UI Workflow

## Overview

This guide provides step-by-step instructions for using Claude's web interface to analyze the MCP Shipping Suite when API access is not available.

## 🌐 When to Use Manual Web UI

**Ideal for:**
- Teams without Claude API access
- One-off comprehensive project reviews
- Detailed architectural analysis
- When CI/CD integration is not needed
- Learning and exploration

**Not ideal for:**
- Frequent code reviews
- Automated workflows
- Real-time development feedback

## 📋 Preparation Steps

### Step 1: Generate Project Analysis Prompt

#### Option A: Using CI Artifacts (Recommended)
1. **Trigger CI Pipeline**
   ```bash
   # Ensure GENERATE_CLAUDE_PROMPT=true in GitHub Secrets
   git push origin your-branch
   ```

2. **Download Artifact**
   - Go to GitHub Actions run
   - Download `claude-prompt-manual` artifact
   - Extract `CLAUDE_PROMPT_FOR_SUMMARY.txt`

#### Option B: Generate Locally
```bash
# Clone repository and install dependencies
git clone https://github.com/your-org/perplexity-mcp-shipping-suite.git
cd perplexity-mcp-shipping-suite
pnpm install

# Generate project summary and Claude prompt
node scripts/generate-summary.js

# The prompt will be saved to:
# ARTIFACTS/CLAUDE_PROMPT_FOR_SUMMARY.txt
```

### Step 2: Verify Prompt Contents

The generated prompt should include:

```
✅ Project context and technical stack
✅ Architecture overview (Nx monorepo, MCP servers, web dashboard)
✅ Current metrics (files, dependencies, health status)
✅ Specific analysis requests
✅ Code examples and patterns
✅ Recent changes and git history
```

**Prompt Preview:**
```markdown
# Claude AI Prompt for MCP Shipping Suite Analysis

Please analyze this TypeScript/Node.js MCP (Model Context Protocol) shipping automation project...

## Project Context
- Tech Stack: TypeScript, Node.js, Nx monorepo, Next.js, Docker, PostgreSQL, Redis
- Purpose: Shipping automation with EasyPost and Veeqo API integrations
- Architecture: MCP servers (ports 3000, 3002) + Web dashboard (port 3003)
...
```

## 🤖 Claude Web UI Interaction

### Step 3: Access Claude Web Interface

1. **Go to Claude AI**
   - Visit [claude.ai](https://claude.ai)
   - Sign in with your Claude account
   - Ensure you have sufficient message credits

2. **Start New Conversation**
   - Click "New Chat" or "+"
   - Choose appropriate Claude model (Claude 3.5 Sonnet recommended)

### Step 4: Submit Analysis Request

1. **Copy Full Prompt**
   ```bash
   # Copy entire content of CLAUDE_PROMPT_FOR_SUMMARY.txt
   cat ARTIFACTS/CLAUDE_PROMPT_FOR_SUMMARY.txt | pbcopy  # macOS
   cat ARTIFACTS/CLAUDE_PROMPT_FOR_SUMMARY.txt | xclip -selection clipboard  # Linux
   ```

2. **Paste and Submit**
   - Paste entire prompt into Claude's message box
   - Review to ensure complete prompt was pasted
   - Click "Send" or press Enter

3. **Wait for Analysis**
   - Claude typically takes 30-90 seconds for comprehensive analysis
   - Response will be detailed (3000-6000 words typically)

### Step 5: Review Claude's Response

Claude's analysis will typically include:

#### Architecture Review
- Assessment of Nx monorepo structure
- Service separation and communication patterns
- Scalability and maintainability recommendations
- Dependency management evaluation

#### Code Quality Assessment
- TypeScript usage and type safety
- Error handling patterns
- MCP protocol implementation
- API integration best practices

#### Security Analysis
- Input validation assessment
- Authentication and authorization review
- Secret management practices
- Rate limiting and abuse prevention

#### Performance Optimization
- API efficiency recommendations
- Caching strategies
- Database optimization opportunities
- Memory and resource usage

#### Development Experience
- Build system improvements
- Testing strategy enhancements
- Documentation suggestions
- Developer tooling recommendations

## 💾 Saving and Using Results

### Step 6: Save Claude's Response

1. **Copy Response**
   - Select all of Claude's response
   - Copy to clipboard

2. **Create SUMMARY_CLAUDE.md**
   ```bash
   # In your project repository
   touch SUMMARY_CLAUDE.md
   
   # Paste Claude's response and save
   # Or use your preferred text editor
   ```

3. **Format and Structure**
   ```markdown
   # Claude Analysis: MCP Shipping Suite
   
   > Analysis completed on: [DATE]
   > Claude Model: Claude 3.5 Sonnet
   > Generated via: Manual Web UI
   
   [PASTE CLAUDE'S FULL RESPONSE HERE]
   
   ---
   
   ## Action Items Summary
   - [ ] High Priority: [Extract key items]
   - [ ] Medium Priority: [Extract items]
   - [ ] Low Priority: [Extract items]
   
   ## Next Steps
   1. Review recommendations with team
   2. Prioritize implementation
   3. Create GitHub issues for tracking
   ```

### Step 7: Integrate with Development Workflow

1. **Commit to Repository**
   ```bash
   git add SUMMARY_CLAUDE.md
   git commit -m "docs: Add Claude analysis summary
   
   - Comprehensive architecture review
   - Code quality and security assessment
   - Performance optimization recommendations
   - Development experience improvements"
   ```

2. **Share with Team**
   - Include in pull request description
   - Reference in team meetings
   - Create GitHub issues for action items

3. **Track Implementation**
   ```markdown
   ## Implementation Tracking
   - [x] ~~Fix TypeScript strict mode issues~~ (PR #123)
   - [x] ~~Add input validation with Zod~~ (PR #124)
   - [ ] Implement caching layer (Issue #125)
   - [ ] Add comprehensive error handling (Issue #126)
   ```

## 🔄 Follow-up Analysis

### Iterative Improvements

1. **Focus on Specific Areas**
   ```markdown
   # Follow-up prompt example:
   Based on your previous analysis of the MCP Shipping Suite, I've implemented 
   the following changes:
   
   - Added comprehensive input validation with Zod
   - Implemented rate limiting for API endpoints
   - Enhanced error handling patterns
   
   Please review these specific changes and provide focused recommendations:
   [INCLUDE SPECIFIC CODE CHANGES]
   ```

2. **Update Analysis Regularly**
   - Run analysis monthly or for major releases
   - Track improvements over time
   - Monitor technical debt trends

### Code-Specific Analysis

For focused code review:

```markdown
# Prompt for specific file analysis:
Please review this TypeScript file from the MCP Shipping Suite:

```typescript
[PASTE SPECIFIC CODE FILE]
```

Focus on:
1. Type safety and TypeScript best practices
2. Error handling patterns
3. Performance implications
4. Security considerations
5. Maintainability and readability

Context: This is part of a shipping automation system that handles
real business transactions via EasyPost and Veeqo APIs.
```

## 🎯 Best Practices

### Prompt Optimization

**Do:**
- ✅ Use the generated comprehensive prompt as starting point
- ✅ Include specific context about recent changes
- ✅ Ask for actionable, prioritized recommendations
- ✅ Request code examples in responses
- ✅ Specify output format preferences

**Don't:**
- ❌ Send prompts without project context
- ❌ Ask for generic advice without specifics
- ❌ Ignore the structured prompt format
- ❌ Forget to mention it's a production system

### Response Management

**Do:**
- ✅ Save complete responses for future reference
- ✅ Extract actionable items into tracking systems
- ✅ Share insights with the development team
- ✅ Document implementation of recommendations

**Don't:**
- ❌ Implement suggestions without team review
- ❌ Ignore security-related recommendations
- ❌ Lose track of the original analysis
- ❌ Forget to validate suggestions with the team

## 🔧 Troubleshooting

### Common Issues

#### Empty or Incomplete Response
- **Cause:** Prompt too long or complex
- **Solution:** Break into smaller, focused questions

#### Generic Advice
- **Cause:** Insufficient project context
- **Solution:** Use generated comprehensive prompt

#### Claude Unavailable
- **Cause:** High demand or maintenance
- **Solution:** Try later or use local CLI if available

#### Analysis Too Surface-Level
- **Cause:** Prompt lacks specific technical details
- **Solution:** Include code examples and specific questions

### Quality Checklist

Before submitting to Claude:
- [ ] Full prompt copied (check character count)
- [ ] Project context included
- [ ] Specific analysis areas mentioned
- [ ] Recent changes documented
- [ ] Output format preferences specified

After receiving response:
- [ ] Complete response received
- [ ] Action items identified
- [ ] Security recommendations noted
- [ ] Performance suggestions extracted
- [ ] Next steps documented

## 📊 Example Analysis Workflow

### Real Project Example

```bash
# 1. Generate prompt
node scripts/generate-summary.js

# 2. Review generated files
ls -la ARTIFACTS/
cat SUMMARY.md | head -20

# 3. Copy prompt for Claude
cat ARTIFACTS/CLAUDE_PROMPT_FOR_SUMMARY.txt

# 4. After Claude analysis, save response
echo "Saving Claude's response..."
# [Manual copy/paste to SUMMARY_CLAUDE.md]

# 5. Extract action items
grep -E "^\- \[" SUMMARY_CLAUDE.md > action_items.md

# 6. Commit results
git add SUMMARY_CLAUDE.md SUMMARY.md
git commit -m "docs: Add comprehensive Claude analysis"
```

### Timeline Example

```
Day 1: Generate prompt and submit to Claude
       └── Receive comprehensive analysis
       └── Save as SUMMARY_CLAUDE.md

Day 2: Team review of recommendations
       └── Prioritize action items
       └── Create GitHub issues

Week 1: Implement high-priority items
        └── Security improvements
        └── Critical bug fixes

Week 2-4: Medium priority improvements
          └── Performance optimizations
          └── Code quality enhancements

Month 1: Follow-up analysis
         └── Generate new prompt with changes
         └── Compare improvements
```

## 📚 Resources

### Claude-Specific
- [Claude Web Interface](https://claude.ai)
- [Claude Usage Guidelines](https://support.anthropic.com/)
- [Claude Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)

### MCP Project Resources
- [Project Repository](https://github.com/your-org/perplexity-mcp-shipping-suite)
- [Development Documentation](./README.md)
- [Architecture Guide](./docs/architecture.md)

### Related Workflows
- [Claude API Integration](./CLAUDE_INTEGRATION.md)
- [Local CLI Usage](./scripts/claude_local.sh)
- [Hugging Face Integration](./HUGGINGFACE_INTEGRATION.md)

---

*This workflow ensures comprehensive AI-assisted code review even without API access.*