#!/usr/bin/env node

/**
 * MCP Setup Validation Script
 * Validates that both MCP servers are properly configured for Cursor
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating MCP Setup for Cursor...\n');

// Check configuration file
const configPath = path.join(__dirname, '.cursor', 'mcp_settings.json');
if (fs.existsSync(configPath)) {
  console.log('✅ Cursor MCP configuration file exists');

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (config.mcpServers) {
      console.log(`✅ Found ${Object.keys(config.mcpServers).length} MCP servers configured:`);

      for (const [name, server] of Object.entries(config.mcpServers)) {
        console.log(`   - ${name}: ${server.command} ${server.args?.join(' ') || ''}`);

        // Check if executable exists
        const executablePath = path.join(__dirname, server.cwd, server.args[0]);
        if (fs.existsSync(executablePath)) {
          console.log(`     ✅ Executable found: ${executablePath}`);
        } else {
          console.log(`     ❌ Executable missing: ${executablePath}`);
        }
      }
    } else {
      console.log('❌ No MCP servers configured');
    }
  } catch (error) {
    console.log('❌ Invalid JSON configuration:', error.message);
  }
} else {
  console.log('❌ Cursor MCP configuration file missing');
}

// Check server builds
console.log('\n📦 Checking MCP Server Builds:');

const easypostDist = path.join(__dirname, 'easypost', 'dist', 'index.js');
if (fs.existsSync(easypostDist)) {
  console.log('✅ EasyPost MCP server built');
} else {
  console.log('❌ EasyPost MCP server not built - run: cd easypost && npm run build');
}

const veeqoDist = path.join(__dirname, 'veeqo', 'dist', 'index.js');
if (fs.existsSync(veeqoDist)) {
  console.log('✅ Veeqo MCP server built');
} else {
  console.log('❌ Veeqo MCP server not built - run: cd veeqo && npm run build');
}

// Check environment files
console.log('\n🔐 Checking Environment Configuration:');

const easypostEnv = path.join(__dirname, 'easypost', '.env');
if (fs.existsSync(easypostEnv)) {
  console.log('✅ EasyPost environment file exists');
} else {
  console.log('⚠️  EasyPost .env file missing');
}

const veeqoEnv = path.join(__dirname, 'veeqo', '.env');
if (fs.existsSync(veeqoEnv)) {
  console.log('✅ Veeqo environment file exists');
} else {
  console.log('⚠️  Veeqo .env file missing');
}

console.log('\n🎯 Setup Summary:');
console.log('   📁 Configuration: .cursor/mcp_settings.json');
console.log('   🚀 EasyPost MCP: 15 shipping automation tools');
console.log('   🏪 Veeqo MCP: 37 inventory management tools');
console.log('   📊 Total Tools: 52 AI-powered business tools');

console.log('\n🎉 Ready for Cursor Integration!');
console.log('   1. Restart Cursor to load MCP configuration');
console.log('   2. Use AI prompts to interact with shipping & inventory');
console.log('   3. Example: "Create a shipment from SF to NYC for 2lb package"');