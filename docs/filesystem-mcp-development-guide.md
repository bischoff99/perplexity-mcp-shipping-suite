# Filesystem MCP Server Development Guide

## Overview

The Filesystem MCP Server is configured for the Perplexity MCP Shipping Suite to provide enhanced file system operations for development workflows. This guide covers configuration, capabilities, and best practices for using the filesystem MCP server effectively.

## Configuration

### Current Configuration

The filesystem MCP server is configured in `.mcp.json`:

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/bischoff666/Projects/perplexity"],
    "description": "Enhanced filesystem operations scoped to perplexity project directory",
    "enabled": true
  }
}
```

### Key Features

- **Scoped Access**: Limited to `/home/bischoff666/Projects/perplexity` directory for security
- **Full File Operations**: Read, write, create, delete, and modify files
- **Directory Management**: List, create, and navigate directories
- **Search Capabilities**: Find files and content across the project
- **Permission Handling**: Respects file system permissions

## Development Workflows

### 1. File Operations

#### Reading Files
```bash
# Read any file in the project
read_file path/to/file.txt

# Read configuration files
read_file package.json
read_file .mcp.json
```

#### Writing Files
```bash
# Create new files
write_to_file new-file.txt "Content here"

# Update existing files
replace_in_file existing-file.txt "old content" "new content"
```

#### File Management
```bash
# List directory contents
list_files apps/
list_files libs/

# Search for files
search_files "*.ts" "function"
search_files "*.json" "mcp"
```

### 2. Project Navigation

#### Quick Navigation Script
Use the development navigation script:

```bash
# Navigate to different parts of the project
./dev-navigate.sh easypost    # Go to EasyPost MCP server
./dev-navigate.sh veeqo       # Go to Veeqo MCP server
./dev-navigate.sh web         # Go to Web Dashboard
./dev-navigate.sh libs        # Go to Shared Libraries
./dev-navigate.sh config      # Go to Configuration
```

#### Directory Structure Analysis
```bash
# Get overview of project structure
list_files . true  # Recursive listing

# Analyze specific directories
list_files apps/easypost/src/
list_files apps/veeqo/src/
```

### 3. Code Analysis and Search

#### Finding Code Patterns
```bash
# Search for TypeScript interfaces
search_files "*.ts" "interface"

# Find function definitions
search_files "*.ts" "function.*Handler"

# Search for configuration patterns
search_files "*.json" "mcpServers"
```

#### Analyzing Dependencies
```bash
# Check package.json files
read_file package.json
read_file apps/easypost/package.json
read_file apps/veeqo/package.json
```

### 4. Development Automation

#### Automated File Operations
```bash
# Run the development workflow script
./scripts/filesystem-dev-workflow.sh

# Check development logs
cat dev-filesystem.log
```

#### Project Statistics
The workflow script provides:
- TypeScript file count: 67 files
- JavaScript file count: 46 files
- Configuration files: 53 files
- MCP servers configured: 14 servers

## Best Practices

### 1. Security Considerations

- **Scoped Access**: Filesystem operations are limited to the project directory
- **Permission Awareness**: Respect file permissions and ownership
- **Safe Operations**: Use read operations for analysis, write operations carefully

### 2. Performance Optimization

- **Targeted Searches**: Use specific file patterns to limit search scope
- **Recursive Control**: Use `recursive=true` only when necessary
- **Batch Operations**: Group related file operations together

### 3. Development Workflow

- **Version Control**: Always check git status before making changes
- **Backup Important Files**: Create backups of critical configuration files
- **Test Changes**: Verify changes don't break existing functionality

### 4. Integration with Other MCP Servers

The filesystem MCP server works alongside other MCP servers:

- **Git MCP**: Version control operations
- **GitHub MCP**: Repository management
- **Context7 MCP**: Documentation and context
- **EasyPost/Veeqo MCP**: Domain-specific operations

## Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Check file permissions
ls -la file.txt

# Change permissions if needed
chmod 644 file.txt
```

#### Path Resolution
```bash
# Use absolute paths within project scope
read_file /home/bischoff666/Projects/perplexity/package.json

# Or relative paths from project root
read_file package.json
```

#### File Not Found
```bash
# Verify file exists
ls -la path/to/file

# Check current working directory
pwd
```

### Debug Information

#### Check MCP Server Status
```bash
# Verify filesystem MCP server is running
curl http://localhost:3000/health  # If health endpoint available

# Check MCP configuration
read_file .mcp.json
```

#### Development Logs
```bash
# Check development logs
cat dev-filesystem.log

# Monitor file operations
tail -f dev-filesystem.log
```

## Advanced Usage

### 1. Custom Scripts

Create custom scripts for repetitive tasks:

```bash
# Create a script for project analysis
cat > analyze-project.sh << 'EOF'
#!/bin/bash
echo "Project Analysis Report"
echo "======================"
echo "TypeScript files: $(find . -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "JavaScript files: $(find . -name "*.js" -o -name "*.jsx" | wc -l)"
echo "Total source files: $(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l)"
echo "Configuration files: $(find . -name "*.json" -o -name "*.config.*" | wc -l)"
EOF
chmod +x analyze-project.sh
```

### 2. Integration Patterns

#### With Git Operations
```bash
# Check git status before file operations
git status

# Create backup before major changes
cp important-file.txt important-file.txt.backup

# Commit changes after verification
git add .
git commit -m "Updated via filesystem MCP server"
```

#### With Build Processes
```bash
# Check build status
npm run build

# Verify generated files
list_files dist/
list_files build/
```

### 3. Monitoring and Logging

#### File Operation Tracking
```bash
# Log all file operations
echo "[$(date)] File operation: $operation on $file" >> dev-filesystem.log

# Monitor file changes
find . -name "*.ts" -newer dev-filesystem.log
```

## Available Tools Summary

### File Operations
- `read_file`: Read file contents
- `write_to_file`: Create new files
- `replace_in_file`: Modify existing files
- `list_files`: List directory contents
- `search_files`: Search for patterns

### Development Scripts
- `./scripts/filesystem-dev-workflow.sh`: Complete development setup
- `./dev-navigate.sh`: Quick project navigation
- `analyze-project.sh`: Project structure analysis

### Test Files
- `test-filesystem.txt`: Basic functionality test
- `test-filesystem-dev.txt`: Development workflow test
- `dev-filesystem.log`: Operation log

## Next Steps

1. **Explore Capabilities**: Test different file operations
2. **Create Custom Workflows**: Build scripts for your specific needs
3. **Integrate with CI/CD**: Automate file operations in deployment pipelines
4. **Monitor Usage**: Track filesystem operations for optimization

## Support

For issues with the filesystem MCP server:
1. Check the development log: `cat dev-filesystem.log`
2. Verify MCP configuration: `read_file .mcp.json`
3. Test basic operations: `./scripts/filesystem-dev-workflow.sh`
4. Review this documentation for troubleshooting steps

---

**Last Updated**: $(date)
**Filesystem MCP Version**: @modelcontextprotocol/server-filesystem
**Project Scope**: /home/bischoff666/Projects/perplexity
