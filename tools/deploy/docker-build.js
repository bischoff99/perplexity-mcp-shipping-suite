#!/usr/bin/env node

/**
 * Build Docker images for all services
 */

const { execSync } = require('child_process');
const path = require('path');

const services = [
  { name: 'easypost-mcp', path: 'apps/easypost-mcp' },
  { name: 'veeqo-mcp', path: 'apps/veeqo-mcp' },
  { name: 'web-dashboard', path: 'apps/web-dashboard' }
];

console.log('🐳 Building Docker images for all services...\n');

for (const service of services) {
  console.log(`📦 Building ${service.name}...`);
  try {
    execSync(`docker build -t perplexity-${service.name}:latest ${service.path}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${service.name} built successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to build ${service.name}:`, error.message);
    process.exit(1);
  }
}

console.log('🎉 All Docker images built successfully!');
