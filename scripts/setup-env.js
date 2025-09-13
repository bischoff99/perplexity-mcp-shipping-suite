#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 Setting up Perplexity MCP Shipping Suite Environment\n');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Read the example file
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ env.example file not found!');
    rl.close();
    return;
  }

  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  console.log('📝 Please provide the following configuration values:\n');

  // EasyPost API Key
  const easypostKey = await question('🔑 EasyPost API Key (get from https://www.easypost.com/account/api-keys): ');
  if (easypostKey.trim()) {
    envContent = envContent.replace('EASYPOST_API_KEY=EZAK_test_your_easypost_api_key_here', `EASYPOST_API_KEY=${easypostKey.trim()}`);
  }

  // Veeqo API Key
  const veeqoKey = await question('🔑 Veeqo API Key (get from https://app.veeqo.com/settings/users): ');
  if (veeqoKey.trim()) {
    envContent = envContent.replace('VEEQO_API_KEY=your_veeqo_api_key_here', `VEEQO_API_KEY=${veeqoKey.trim()}`);
  }

  // Webhook Secret
  const webhookSecret = await question('🔐 Webhook Secret (32 characters, or press Enter for auto-generated): ');
  if (webhookSecret.trim()) {
    envContent = envContent.replace('WEBHOOK_SECRET=your_secure_32_character_webhook_secret_here', `WEBHOOK_SECRET=${webhookSecret.trim()}`);
  } else {
    const autoSecret = generateRandomString(32);
    envContent = envContent.replace('WEBHOOK_SECRET=your_secure_32_character_webhook_secret_here', `WEBHOOK_SECRET=${autoSecret}`);
    console.log(`🔐 Auto-generated webhook secret: ${autoSecret}`);
  }

  // JWT Secret
  const jwtSecret = await question('🔐 JWT Secret (or press Enter for auto-generated): ');
  if (jwtSecret.trim()) {
    envContent = envContent.replace('JWT_SECRET=your_jwt_secret_key_here', `JWT_SECRET=${jwtSecret.trim()}`);
  } else {
    const autoJwtSecret = generateRandomString(64);
    envContent = envContent.replace('JWT_SECRET=your_jwt_secret_key_here', `JWT_SECRET=${autoJwtSecret}`);
    console.log(`🔐 Auto-generated JWT secret: ${autoJwtSecret}`);
  }

  // Environment
  const nodeEnv = await question('🌍 Environment (development/production) [development]: ');
  if (nodeEnv.trim()) {
    envContent = envContent.replace('NODE_ENV=development', `NODE_ENV=${nodeEnv.trim()}`);
  }

  // Ports
  const easypostPort = await question('🔌 EasyPost MCP Server Port [3000]: ');
  if (easypostPort.trim()) {
    envContent = envContent.replace('EASYPOST_PORT=3000', `EASYPOST_PORT=${easypostPort.trim()}`);
  }

  const veeqoPort = await question('🔌 Veeqo MCP Server Port [3002]: ');
  if (veeqoPort.trim()) {
    envContent = envContent.replace('VEEQO_PORT=3002', `VEEQO_PORT=${veeqoPort.trim()}`);
  }

  const webPort = await question('🔌 Web Interface Port [3003]: ');
  if (webPort.trim()) {
    envContent = envContent.replace('WEB_PORT=3003', `WEB_PORT=${webPort.trim()}`);
  }

  // Write the .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment configuration completed!');
  console.log('📁 Created .env file with your configuration');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run install:all');
  console.log('   2. Run: npm run dev');
  console.log('   3. Open: http://localhost:3003');

  rl.close();
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run the setup
setupEnvironment().catch(console.error);
