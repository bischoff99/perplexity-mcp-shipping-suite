#!/usr/bin/env node

/**
 * Generate Summary Script for MCP Shipping Suite
 * 
 * This script generates a comprehensive project summary including:
 * - Project inventory and structure
 * - Current status and health
 * - Key metrics and statistics
 * - Risk assessment
 * - Prioritized TODO items
 * - Development roadmap
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OUTPUT_FILE = 'SUMMARY.md';
const ARTIFACTS_DIR = 'ARTIFACTS';

class ProjectSummaryGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.timestamp = new Date().toISOString();
    this.summary = {
      metadata: {},
      structure: {},
      health: {},
      metrics: {},
      risks: [],
      todos: [],
      roadmap: []
    };
  }

  async generate() {
    console.log('🔍 Generating project summary...');
    
    try {
      await this.collectMetadata();
      await this.analyzeStructure();
      await this.checkHealth();
      await this.calculateMetrics();
      await this.assessRisks();
      await this.extractTodos();
      await this.buildRoadmap();
      
      const markdownContent = this.formatMarkdown();
      
      // Write summary file
      fs.writeFileSync(path.join(this.projectRoot, OUTPUT_FILE), markdownContent);
      
      // Generate Claude prompt artifact
      await this.generateClaudePrompt();
      
      console.log(`✅ Summary generated: ${OUTPUT_FILE}`);
      console.log(`📋 Claude prompt generated: ${ARTIFACTS_DIR}/CLAUDE_PROMPT_FOR_SUMMARY.txt`);
      
    } catch (error) {
      console.error('❌ Error generating summary:', error.message);
      process.exit(1);
    }
  }

  async collectMetadata() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    this.summary.metadata = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license,
      repository: packageJson.repository,
      keywords: packageJson.keywords || [],
      engines: packageJson.engines,
      packageManager: packageJson.packageManager,
      generatedAt: this.timestamp
    };
  }

  async analyzeStructure() {
    const structure = {
      apps: [],
      libs: [],
      configs: [],
      docs: []
    };

    // Analyze apps
    if (fs.existsSync('apps')) {
      structure.apps = fs.readdirSync('apps')
        .filter(dir => fs.statSync(path.join('apps', dir)).isDirectory())
        .map(app => this.analyzeApp(app));
    }

    // Analyze libs
    if (fs.existsSync('libs')) {
      structure.libs = fs.readdirSync('libs')
        .filter(dir => fs.statSync(path.join('libs', dir)).isDirectory())
        .map(lib => this.analyzeLib(lib));
    }

    // Count configuration files
    structure.configs = this.countFiles([
      '*.config.{js,ts,json}',
      'tsconfig*.json',
      '.env*',
      'Dockerfile*',
      'docker-compose*.yml'
    ]);

    // Count documentation files
    structure.docs = this.countFiles(['**/*.md', 'docs/**/*']);

    this.summary.structure = structure;
  }

  analyzeApp(appName) {
    const appPath = path.join('apps', appName);
    const packagePath = path.join(appPath, 'package.json');
    
    let appInfo = {
      name: appName,
      type: 'unknown',
      port: null,
      hasTests: false,
      hasDockerfile: false,
      dependencies: 0
    };

    if (fs.existsSync(packagePath)) {
      const appPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      appInfo.dependencies = Object.keys(appPackage.dependencies || {}).length;
    }

    // Detect app type
    if (fs.existsSync(path.join(appPath, 'src/server.ts'))) {
      appInfo.type = 'mcp-server';
    } else if (fs.existsSync(path.join(appPath, 'next.config.js'))) {
      appInfo.type = 'next.js';
    }

    // Check for tests
    appInfo.hasTests = fs.existsSync(path.join(appPath, 'tests')) || 
                      fs.existsSync(path.join(appPath, '__tests__'));

    // Check for Dockerfile
    appInfo.hasDockerfile = fs.existsSync(path.join(appPath, 'Dockerfile'));

    // Extract port from common locations
    appInfo.port = this.extractPort(appPath);

    return appInfo;
  }

  analyzeLib(libName) {
    const libPath = path.join('libs', libName);
    const packagePath = path.join(libPath, 'package.json');
    
    let libInfo = {
      name: libName,
      type: 'shared',
      hasTests: false,
      dependencies: 0,
      isPublished: false
    };

    if (fs.existsSync(packagePath)) {
      const libPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      libInfo.dependencies = Object.keys(libPackage.dependencies || {}).length;
      libInfo.isPublished = !libPackage.private;
    }

    // Check for tests
    libInfo.hasTests = fs.existsSync(path.join(libPath, 'tests')) || 
                       fs.existsSync(path.join(libPath, '__tests__'));

    return libInfo;
  }

  extractPort(appPath) {
    const configFiles = [
      'src/main.ts',
      'src/server.ts', 
      'src/index.ts',
      '.env.development'
    ];

    for (const file of configFiles) {
      const filePath = path.join(appPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const portMatch = content.match(/(?:port|PORT)[:\s=]+(\d+)/i);
        if (portMatch) {
          return parseInt(portMatch[1]);
        }
      }
    }
    return null;
  }

  countFiles(patterns) {
    try {
      const result = execSync(`find . ${patterns.map(p => `-name "${p}"`).join(' -o ')} | wc -l`, { 
        encoding: 'utf8' 
      });
      return parseInt(result.trim());
    } catch {
      return 0;
    }
  }

  async checkHealth() {
    const health = {
      buildStatus: 'unknown',
      testStatus: 'unknown',
      lintStatus: 'unknown',
      dependencies: 'unknown',
      security: 'unknown'
    };

    try {
      // Check if dependencies are installed
      health.dependencies = fs.existsSync('node_modules') ? 'installed' : 'missing';

      // Try to run a quick build check
      try {
        execSync('source /home/runner/.bashrc && pnpm run typecheck', { 
          stdio: 'pipe', 
          timeout: 30000 
        });
        health.buildStatus = 'passing';
      } catch {
        health.buildStatus = 'failing';
      }

    } catch (error) {
      console.warn('Warning: Could not complete health check:', error.message);
    }

    this.summary.health = health;
  }

  async calculateMetrics() {
    const metrics = {
      totalFiles: 0,
      linesOfCode: 0,
      testCoverage: 'unknown',
      codeComplexity: 'unknown'
    };

    try {
      // Count TypeScript/JavaScript files
      const tsFiles = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | wc -l', { 
        encoding: 'utf8' 
      });
      metrics.totalFiles = parseInt(tsFiles.trim());

      // Estimate lines of code
      const loc = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | tail -n 1 | awk \'{print $1}\'', { 
        encoding: 'utf8' 
      });
      metrics.linesOfCode = parseInt(loc.trim()) || 0;

    } catch (error) {
      console.warn('Warning: Could not calculate metrics:', error.message);
    }

    this.summary.metrics = metrics;
  }

  async assessRisks() {
    const risks = [];

    // Check for missing documentation
    if (!fs.existsSync('README.md')) {
      risks.push({
        level: 'medium',
        category: 'documentation',
        description: 'Missing main README.md file',
        impact: 'Developer onboarding difficulty'
      });
    }

    // Check for missing environment configuration
    if (!fs.existsSync('.env.example')) {
      risks.push({
        level: 'high',
        category: 'configuration',
        description: 'Missing .env.example file',
        impact: 'Configuration errors in deployment'
      });
    }

    // Check for security vulnerabilities
    try {
      execSync('npm audit --audit-level high', { stdio: 'pipe' });
    } catch {
      risks.push({
        level: 'high',
        category: 'security',
        description: 'Potential security vulnerabilities in dependencies',
        impact: 'Security breaches and compliance issues'
      });
    }

    // Check for missing tests
    const appsWithoutTests = this.summary.structure.apps.filter(app => !app.hasTests);
    if (appsWithoutTests.length > 0) {
      risks.push({
        level: 'medium',
        category: 'testing',
        description: `Apps without tests: ${appsWithoutTests.map(a => a.name).join(', ')}`,
        impact: 'Reduced code quality and reliability'
      });
    }

    this.summary.risks = risks;
  }

  async extractTodos() {
    const todos = [];

    try {
      // Find TODO/FIXME comments in code
      const todoOutput = execSync('grep -r "TODO\\|FIXME\\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules . || true', { 
        encoding: 'utf8' 
      });

      const todoLines = todoOutput.split('\n').filter(line => line.trim());
      
      for (const line of todoLines.slice(0, 10)) { // Limit to first 10
        const [file, ...rest] = line.split(':');
        const comment = rest.join(':').trim();
        
        todos.push({
          priority: comment.includes('FIXME') ? 'high' : 'medium',
          category: 'code',
          description: comment.replace(/\/\/|\/\*|\*\/|\*\s*/g, '').trim(),
          file: file.replace('./', ''),
          line: 'unknown'
        });
      }
    } catch (error) {
      console.warn('Warning: Could not extract TODOs:', error.message);
    }

    this.summary.todos = todos;
  }

  async buildRoadmap() {
    const roadmap = [
      {
        phase: 'Phase 1: Foundation',
        timeline: 'Current Sprint',
        items: [
          'Complete Cursor workspace integration',
          'Implement AI tooling workflows',
          'Set up comprehensive testing suite',
          'Enhance documentation'
        ]
      },
      {
        phase: 'Phase 2: Enhancement',
        timeline: 'Next 2-4 weeks',
        items: [
          'Implement advanced MCP features',
          'Add monitoring and observability',
          'Performance optimization',
          'Security hardening'
        ]
      },
      {
        phase: 'Phase 3: Scale',
        timeline: 'Next 1-2 months',
        items: [
          'Multi-tenant support',
          'Advanced shipping automations',
          'API rate limiting and caching',
          'Production deployment optimization'
        ]
      }
    ];

    this.summary.roadmap = roadmap;
  }

  formatMarkdown() {
    const { metadata, structure, health, metrics, risks, todos, roadmap } = this.summary;

    return `# ${metadata.name} - Project Summary

> Generated on ${new Date(metadata.generatedAt).toLocaleString()}

## 📋 Project Overview

**${metadata.description}**

- **Version:** ${metadata.version}
- **License:** ${metadata.license}
- **Package Manager:** ${metadata.packageManager}
- **Node.js:** ${metadata.engines?.node || 'Not specified'}

## 🏗️ Architecture & Structure

### Applications (${structure.apps.length})
${structure.apps.map(app => `
- **${app.name}** (${app.type})
  - Port: ${app.port || 'Not specified'}
  - Dependencies: ${app.dependencies}
  - Tests: ${app.hasTests ? '✅' : '❌'}
  - Docker: ${app.hasDockerfile ? '✅' : '❌'}
`).join('')}

### Libraries (${structure.libs.length})
${structure.libs.map(lib => `
- **${lib.name}** (${lib.type})
  - Dependencies: ${lib.dependencies}
  - Tests: ${lib.hasTests ? '✅' : '❌'}
  - Published: ${lib.isPublished ? '✅' : '❌'}
`).join('')}

### Project Statistics
- **Configuration Files:** ${structure.configs}
- **Documentation Files:** ${structure.docs}
- **Total TypeScript/JavaScript Files:** ${metrics.totalFiles}
- **Estimated Lines of Code:** ${metrics.linesOfCode.toLocaleString()}

## 🏥 Health Status

| Component | Status |
|-----------|---------|
| Build | ${this.getStatusEmoji(health.buildStatus)} ${health.buildStatus} |
| Dependencies | ${this.getStatusEmoji(health.dependencies)} ${health.dependencies} |
| Tests | ${this.getStatusEmoji(health.testStatus)} ${health.testStatus} |
| Linting | ${this.getStatusEmoji(health.lintStatus)} ${health.lintStatus} |
| Security | ${this.getStatusEmoji(health.security)} ${health.security} |

## ⚠️ Risk Assessment

${risks.length === 0 ? '✅ No major risks identified.' : risks.map(risk => `
### ${this.getRiskEmoji(risk.level)} ${risk.category.toUpperCase()} - ${risk.level.toUpperCase()}
**Issue:** ${risk.description}  
**Impact:** ${risk.impact}
`).join('')}

## 📝 Priority TODO Items

${todos.length === 0 ? '✅ No TODO items found in code.' : todos.slice(0, 5).map(todo => `
- **${todo.priority.toUpperCase()}:** ${todo.description}
  - File: \`${todo.file}\`
  - Category: ${todo.category}
`).join('')}

## 🗺️ Development Roadmap

${roadmap.map(phase => `
### ${phase.phase}
*Timeline: ${phase.timeline}*

${phase.items.map(item => `- ${item}`).join('\n')}
`).join('')}

## 🔧 Development Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Build shared libraries first
pnpm run build:libs

# Start all development servers
pnpm run dev

# Check health
pnpm run health
\`\`\`

## 🤖 AI Integration Status

- **GitHub Copilot:** ✅ Configured
- **Cursor AI:** ✅ Configured  
- **Claude Integration:** 🔄 In Progress
- **Hugging Face:** 🔄 In Progress

## 📊 Key Metrics Summary

- **Active Development:** ${structure.apps.length} applications, ${structure.libs.length} libraries
- **Test Coverage:** ${structure.apps.filter(a => a.hasTests).length}/${structure.apps.length} apps tested
- **Containerization:** ${structure.apps.filter(a => a.hasDockerfile).length}/${structure.apps.length} apps containerized
- **Risk Level:** ${this.getOverallRiskLevel(risks)}

---

*This summary was automatically generated by the MCP Shipping Suite project analyzer.*
`;
  }

  getStatusEmoji(status) {
    const statusMap = {
      'passing': '✅',
      'failing': '❌',
      'unknown': '❓',
      'installed': '✅',
      'missing': '❌'
    };
    return statusMap[status] || '❓';
  }

  getRiskEmoji(level) {
    const riskMap = {
      'low': '🟡',
      'medium': '🟠', 
      'high': '🔴',
      'critical': '💀'
    };
    return riskMap[level] || '❓';
  }

  getOverallRiskLevel(risks) {
    if (risks.some(r => r.level === 'critical')) return 'Critical';
    if (risks.some(r => r.level === 'high')) return 'High';
    if (risks.some(r => r.level === 'medium')) return 'Medium';
    return 'Low';
  }

  async generateClaudePrompt() {
    const promptContent = `# Claude AI Prompt for MCP Shipping Suite Analysis

Please analyze this TypeScript/Node.js MCP (Model Context Protocol) shipping automation project and provide:

1. **Architecture Review**: Evaluate the Nx monorepo structure with apps (EasyPost MCP, Veeqo MCP, Web Dashboard) and shared libraries
2. **Code Quality Assessment**: Review TypeScript patterns, error handling, and MCP protocol implementation
3. **Security Analysis**: Identify potential security vulnerabilities and best practices
4. **Performance Optimization**: Suggest improvements for API integrations and caching
5. **Development Experience**: Recommend enhancements to developer tooling and workflows
6. **Testing Strategy**: Advise on testing approach for MCP servers and integration points
7. **Documentation Improvements**: Suggest documentation enhancements for better developer onboarding

## Project Context
- **Tech Stack**: TypeScript, Node.js, Nx monorepo, Next.js, Docker, PostgreSQL, Redis
- **Purpose**: Shipping automation with EasyPost and Veeqo API integrations
- **Architecture**: MCP servers (ports 3000, 3002) + Web dashboard (port 3003)
- **AI Integration**: GitHub Copilot, Claude, Hugging Face Pro

## Current Status
${JSON.stringify(this.summary, null, 2)}

## Specific Areas of Interest
1. MCP protocol implementation patterns
2. API integration error handling and rate limiting  
3. TypeScript type safety and validation with Zod
4. Monorepo dependency management and build optimization
5. Security best practices for API keys and webhooks
6. Testing strategies for external API integrations
7. Development workflow optimization with AI tooling

Please provide specific, actionable recommendations with code examples where appropriate.`;

    // Ensure ARTIFACTS directory exists
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    }

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'CLAUDE_PROMPT_FOR_SUMMARY.txt'),
      promptContent
    );
  }
}

// Run the generator
if (require.main === module) {
  const generator = new ProjectSummaryGenerator();
  generator.generate().catch(error => {
    console.error('Failed to generate summary:', error);
    process.exit(1);
  });
}

module.exports = ProjectSummaryGenerator;