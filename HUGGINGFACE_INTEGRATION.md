# Hugging Face Integration Guide

## Overview

This guide covers integrating Hugging Face Pro into the MCP Shipping Suite development and deployment workflow. Hugging Face can be used for model deployment, space creation, and inference API access.

## 🚀 Getting Started

### Prerequisites

1. **Hugging Face Pro Account**
   - Sign up at [huggingface.co](https://huggingface.co)
   - Upgrade to Pro for enhanced features
   - Generate API token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

2. **Local Setup**
   ```bash
   # Install Hugging Face CLI
   pip install huggingface_hub
   # OR
   pipx install huggingface_hub
   
   # Install Gradio for spaces
   pip install gradio
   ```

3. **Authentication**
   ```bash
   # Method 1: Interactive login
   huggingface-cli login
   
   # Method 2: Environment variable
   export HF_API_TOKEN=hf_xxxxxxxxxxxxx
   
   # Verify authentication
   huggingface-cli whoami
   ```

## 🔧 Integration Modes

### 1. Local Development Integration

**Setup for Local Usage:**

```bash
# 1. Install and authenticate
pipx install huggingface_hub
huggingface-cli login

# 2. Test basic functionality
huggingface-cli repo create test-repo --type model --private
huggingface-cli repo delete test-repo --type model

# 3. Use project script
chmod +x scripts/hf_deploy.sh
./scripts/hf_deploy.sh --check
```

**Local Workflow:**
```bash
# Deploy model to Hugging Face
./scripts/hf_deploy.sh --model mcp-shipping-model

# Deploy interactive demo space
./scripts/hf_deploy.sh --space mcp-shipping-demo

# Deploy both model and space
./scripts/hf_deploy.sh --all

# Test inference API
./scripts/hf_deploy.sh --test
```

### 2. CI/CD Pipeline Integration

**GitHub Secrets Configuration:**
```bash
# Repository Settings > Secrets and Variables > Actions
HF_API_TOKEN=hf_xxxxxxxxxxxxx
USE_HF=true  # Enable Hugging Face deployment
```

**Automatic Deployment:**
The CI pipeline automatically deploys to Hugging Face when:
- `HF_API_TOKEN` secret exists
- `USE_HF` is set to `'true'`
- Tests pass successfully

**CI Workflow Features:**
- Authenticates with Hugging Face Hub
- Builds project artifacts
- Creates model repository
- Deploys Gradio space for demos
- Uploads deployment logs as artifacts

### 3. Inference API Integration

**Using Hugging Face Inference API:**

```typescript
// Example TypeScript integration
class HuggingFaceInference {
  constructor(private apiToken: string) {}

  async generateShippingRecommendation(context: string): Promise<string> {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Shipping context: ${context}\nRecommendation:`,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
          }
        })
      }
    );
    
    const result = await response.json();
    return result[0]?.generated_text || 'No recommendation available';
  }
}
```

## 🏗️ Model Deployment

### Creating Model Repository

**Manual Creation:**
```bash
# Create model repository
huggingface-cli repo create mcp-shipping-suite --type model --private

# Upload model files
huggingface-cli upload mcp-shipping-suite ./model-artifacts --repo-type model
```

**Using Project Script:**
```bash
# Automated model deployment
./scripts/hf_deploy.sh --model mcp-shipping-suite

# With custom organization
HF_ORGANIZATION=your-org ./scripts/hf_deploy.sh --model custom-model-name
```

**Generated Model Contents:**
```
model-repository/
├── README.md              # Model card with documentation
├── config.json            # Model configuration and metadata
├── model-artifacts/       # Generated from project build
│   ├── package.json       # Dependencies and scripts
│   ├── dist/              # Compiled TypeScript
│   └── docs/              # Documentation
└── examples/              # Usage examples
```

### Model Card Example

The script generates a comprehensive model card:

```markdown
---
title: MCP Shipping Suite Model
tags:
- mcp
- shipping
- automation
- typescript
- api-integration
license: mit
---

# MCP Shipping Suite Model

Intelligent shipping automation model built with TypeScript and the Model Context Protocol.

## Features
- EasyPost API integration for multi-carrier shipping
- Veeqo inventory management integration
- Automated rate shopping and optimization
- Real-time shipment tracking
- Webhook processing for status updates

## Usage
This model works with the MCP Shipping Suite infrastructure...
```

## 🎨 Space Deployment

### Creating Interactive Demo Space

**Automated Space Creation:**
```bash
# Deploy interactive Gradio space
./scripts/hf_deploy.sh --space mcp-shipping-demo

# Custom space with organization
HF_ORGANIZATION=your-org ./scripts/hf_deploy.sh --space custom-demo
```

**Generated Space Features:**
- **Shipment Creation Demo:** Interactive form for creating shipments
- **Tracking Simulation:** Mock tracking interface
- **Rate Shopping:** Compare carrier rates
- **API Documentation:** Interactive API explorer

### Gradio App Structure

```python
# Generated app.py structure
import gradio as gr
import json
from datetime import datetime

def create_shipment_demo(from_addr, to_addr, weight, dimensions):
    """Simulate shipment creation with realistic data"""
    # Implementation with mock EasyPost-style response
    
def track_shipment_demo(tracking_code):
    """Simulate shipment tracking with status updates"""
    # Implementation with mock tracking events

# Gradio interface with tabs for different features
with gr.Blocks(title="MCP Shipping Suite Demo") as demo:
    gr.Markdown("# 📦 MCP Shipping Suite Demo")
    
    with gr.Tab("Create Shipment"):
        # Shipment creation interface
        
    with gr.Tab("Track Shipment"):
        # Tracking interface
        
    with gr.Tab("About"):
        # Project information and links

demo.launch()
```

### Space Configuration

```yaml
# Generated README.md for space
---
title: MCP Shipping Suite Demo
emoji: 📦
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---
```

## 🔍 Inference API Usage

### Supported Models

**Pre-trained Models for Shipping:**
- `microsoft/DialoGPT-medium` - Conversational AI for customer service
- `facebook/bart-large-cnn` - Text summarization for shipping docs
- `distilbert-base-uncased` - Text classification for shipping categories

**Custom Model Training:**
```python
# Example: Fine-tune model for shipping classification
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import TrainingArguments, Trainer

# Load base model
model = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased", 
    num_labels=5  # Express, Ground, Priority, International, etc.
)

# Fine-tune on shipping data
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=shipping_dataset,
    eval_dataset=eval_dataset,
)

trainer.train()
```

### API Integration Examples

**Text Classification for Shipping Type:**
```typescript
async function classifyShipment(description: string): Promise<string> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/distilbert-base-uncased',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: description,
        parameters: {
          candidate_labels: ['express', 'ground', 'priority', 'international', 'freight']
        }
      })
    }
  );
  
  const result = await response.json();
  return result.labels[0]; // Highest confidence label
}
```

**Document Summarization:**
```typescript
async function summarizeShippingDocument(text: string): Promise<string> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_length: 150,
          min_length: 30,
          do_sample: false
        }
      })
    }
  );
  
  const result = await response.json();
  return result[0].summary_text;
}
```

## 🛠️ Development Workflow

### Local Development

```bash
# 1. Set up environment
export HF_API_TOKEN=hf_xxxxxxxxxxxxx
export USE_HF=true

# 2. Test authentication
./scripts/hf_deploy.sh --check

# 3. Test inference API
./scripts/hf_deploy.sh --test

# 4. Deploy development model
./scripts/hf_deploy.sh --model mcp-shipping-dev

# 5. Deploy demo space
./scripts/hf_deploy.sh --space mcp-shipping-dev-demo
```

### Production Deployment

```bash
# 1. Build production artifacts
pnpm run build:libs
pnpm run build:apps

# 2. Deploy production model
HF_ORGANIZATION=mcp-shipping ./scripts/hf_deploy.sh --model shipping-suite-v1

# 3. Deploy production demo
HF_ORGANIZATION=mcp-shipping ./scripts/hf_deploy.sh --space shipping-suite-demo

# 4. Update model tags
huggingface-cli repo tag mcp-shipping/shipping-suite-v1 v1.0.0
```

### Staging Environment

```bash
# Deploy to staging space for testing
./scripts/hf_deploy.sh --space mcp-shipping-staging

# Test inference endpoints
curl -X POST "https://api-inference.huggingface.co/models/mcp-shipping/shipping-suite-staging" \
  -H "Authorization: Bearer $HF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "Express delivery for fragile electronics"}'
```

## 📊 Monitoring and Analytics

### Usage Tracking

**Hugging Face Hub Analytics:**
- Model download statistics
- Space usage metrics
- Inference API call volumes
- User engagement data

**Custom Analytics Integration:**
```typescript
// Track usage in your application
async function trackHuggingFaceUsage(operation: string, model: string) {
  await analytics.track('huggingface_api_call', {
    operation,
    model,
    timestamp: new Date().toISOString(),
    user_id: getCurrentUserId(),
  });
}

// Usage example
await trackHuggingFaceUsage('text_classification', 'mcp-shipping/classification-model');
```

### Cost Management

**Inference API Costs:**
- Free tier: 30,000 characters/month
- Pro tier: Higher limits + priority access
- Monitor usage via dashboard

**Optimization Strategies:**
```typescript
// Implement caching to reduce API calls
class CachedHuggingFaceInference {
  private cache = new Map<string, { result: any, timestamp: number }>();
  private CACHE_TTL = 3600000; // 1 hour

  async classifyWithCache(text: string): Promise<string> {
    const cacheKey = `classify:${text}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    
    const result = await this.classifyShipment(text);
    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### Authentication Failures
```bash
# Check token format and permissions
echo $HF_API_TOKEN | cut -c1-3  # Should be "hf_"

# Test authentication
huggingface-cli whoami

# Re-authenticate if needed
huggingface-cli logout
huggingface-cli login
```

#### Model Upload Failures
```bash
# Check file sizes and formats
ls -lh model-artifacts/

# Verify repository exists
huggingface-cli repo info your-org/model-name --repo-type model

# Check network and retry
./scripts/hf_deploy.sh --model your-model --verbose
```

#### Inference API Errors

| Error Code | Cause | Solution |
|------------|-------|----------|
| 401 | Invalid API token | Check HF_API_TOKEN format |
| 429 | Rate limit exceeded | Implement backoff, upgrade plan |
| 503 | Model loading | Wait for model to load, retry |
| 400 | Invalid input format | Check input parameters |

### Performance Optimization

**Model Selection:**
- Use smaller models for faster inference
- Consider model quantization for production
- Implement model ensemble for accuracy

**API Optimization:**
```typescript
// Batch requests when possible
async function batchClassifyShipments(descriptions: string[]): Promise<string[]> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/your-model',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: descriptions, // Array of inputs
        options: { wait_for_model: true }
      })
    }
  );
  
  return response.json();
}
```

## 📚 Resources

### Hugging Face Documentation
- [Hugging Face Hub Documentation](https://huggingface.co/docs/hub/)
- [Inference API Guide](https://huggingface.co/docs/api-inference/)
- [Gradio Documentation](https://gradio.app/docs/)
- [Spaces Documentation](https://huggingface.co/docs/hub/spaces)

### Model Development
- [Transformers Library](https://huggingface.co/docs/transformers/)
- [Model Training Guide](https://huggingface.co/docs/transformers/training)
- [Fine-tuning Tutorial](https://huggingface.co/docs/transformers/training)

### API References
- [Inference API Reference](https://huggingface.co/docs/api-inference/detailed_parameters)
- [Hub API Reference](https://huggingface.co/docs/huggingface_hub/main/en/package_reference/login)

### MCP Integration
- [Project Repository](https://github.com/your-org/perplexity-mcp-shipping-suite)
- [MCP Protocol Docs](https://spec.modelcontextprotocol.io/)
- [Shipping API Patterns](./docs/api-patterns.md)

---

*Leverage Hugging Face Pro to enhance your MCP Shipping Suite with AI-powered features.*