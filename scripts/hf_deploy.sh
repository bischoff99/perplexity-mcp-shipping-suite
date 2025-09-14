#!/bin/bash

# Hugging Face Deployment Script for MCP Shipping Suite
# This script provides integration with Hugging Face Hub for model and space deployment

set -e

# Configuration
HF_SPACE_NAME="mcp-shipping-suite"
HF_MODEL_NAME="mcp-shipping-model"
HF_ORGANIZATION="" # Optional: specify organization
ARTIFACTS_DIR="ARTIFACTS"
BUILD_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Hugging Face CLI is installed
check_hf_cli() {
    if ! command -v huggingface-cli &> /dev/null; then
        error "Hugging Face CLI is not installed."
        echo ""
        echo "To install Hugging Face CLI:"
        echo "1. Using pip: pip install huggingface_hub"
        echo "2. Using pipx: pipx install huggingface_hub"
        echo "3. Authenticate: huggingface-cli login"
        echo ""
        exit 1
    fi
}

# Check if authenticated with Hugging Face
check_hf_auth() {
    if [ -z "$HF_API_TOKEN" ]; then
        if ! huggingface-cli whoami &> /dev/null; then
            error "Not authenticated with Hugging Face."
            echo ""
            echo "To authenticate:"
            echo "1. Run: huggingface-cli login"
            echo "2. Enter your API token from https://huggingface.co/settings/tokens"
            echo "3. Or set HF_API_TOKEN environment variable"
            echo ""
            exit 1
        fi
    else
        info "Using HF_API_TOKEN from environment"
        export HUGGING_FACE_HUB_TOKEN="$HF_API_TOKEN"
    fi
}

# Check if we should proceed with deployment
check_deployment_conditions() {
    if [ "$USE_HF" != "true" ]; then
        warning "Hugging Face deployment disabled (USE_HF != 'true')"
        echo "To enable: export USE_HF=true"
        exit 0
    fi

    if [ -z "$HF_API_TOKEN" ] && ! huggingface-cli whoami &> /dev/null; then
        error "Hugging Face deployment requires authentication"
        exit 1
    fi
}

# Create a model repository
create_model_repo() {
    local model_name="${1:-$HF_MODEL_NAME}"
    local org_prefix=""
    
    if [ -n "$HF_ORGANIZATION" ]; then
        org_prefix="$HF_ORGANIZATION/"
    fi
    
    info "Creating model repository: ${org_prefix}${model_name}"
    
    # Create repository
    huggingface-cli repo create "${org_prefix}${model_name}" --type model --private || {
        warning "Repository may already exist or creation failed"
    }
    
    success "Model repository ready: https://huggingface.co/${org_prefix}${model_name}"
}

# Create a space repository
create_space_repo() {
    local space_name="${1:-$HF_SPACE_NAME}"
    local org_prefix=""
    
    if [ -n "$HF_ORGANIZATION" ]; then
        org_prefix="$HF_ORGANIZATION/"
    fi
    
    info "Creating space repository: ${org_prefix}${space_name}"
    
    # Create repository
    huggingface-cli repo create "${org_prefix}${space_name}" --type space --space_sdk gradio --private || {
        warning "Repository may already exist or creation failed"
    }
    
    success "Space repository ready: https://huggingface.co/spaces/${org_prefix}${space_name}"
}

# Upload model artifacts
upload_model() {
    local model_name="${1:-$HF_MODEL_NAME}"
    local org_prefix=""
    
    if [ -n "$HF_ORGANIZATION" ]; then
        org_prefix="$HF_ORGANIZATION/"
    fi
    
    info "Preparing model artifacts for upload..."
    
    # Create model artifacts directory
    local model_dir="$ARTIFACTS_DIR/model"
    mkdir -p "$model_dir"
    
    # Create a simple model card
    cat > "$model_dir/README.md" << EOF
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

This model is part of the MCP (Model Context Protocol) Shipping Suite, providing intelligent shipping automation capabilities.

## Features

- EasyPost API integration for shipping operations
- Veeqo inventory management integration  
- Automated rate shopping and optimization
- Real-time shipment tracking
- Webhook processing for status updates

## Usage

This model is designed to work with the MCP Shipping Suite infrastructure. See the main repository for deployment instructions.

## Model Architecture

Built with TypeScript and Node.js, this model implements:
- JSON-RPC 2.0 protocol for MCP communication
- RESTful API patterns for external integrations
- Event-driven architecture for real-time updates
- Comprehensive error handling and logging

## Generated

This model was automatically generated from the MCP Shipping Suite project.
Generated on: $(date)
EOF

    # Create model metadata
    cat > "$model_dir/config.json" << EOF
{
  "model_type": "mcp-shipping-suite",
  "architecture": "typescript-nodejs",
  "version": "1.0.0",
  "features": [
    "shipping-automation",
    "api-integration", 
    "real-time-tracking",
    "webhook-processing"
  ],
  "supported_carriers": [
    "easypost",
    "fedex",
    "ups",
    "usps"
  ],
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # Upload the model
    info "Uploading model to: ${org_prefix}${model_name}"
    
    huggingface-cli upload "${org_prefix}${model_name}" "$model_dir" --repo-type model
    
    success "Model uploaded successfully!"
    info "View at: https://huggingface.co/${org_prefix}${model_name}"
}

# Create and upload a Gradio space
upload_space() {
    local space_name="${1:-$HF_SPACE_NAME}"
    local org_prefix=""
    
    if [ -n "$HF_ORGANIZATION" ]; then
        org_prefix="$HF_ORGANIZATION/"
    fi
    
    info "Preparing Gradio space for upload..."
    
    # Create space directory
    local space_dir="$ARTIFACTS_DIR/space"
    mkdir -p "$space_dir"
    
    # Create space README
    cat > "$space_dir/README.md" << EOF
---
title: MCP Shipping Suite
emoji: 📦
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---

# MCP Shipping Suite Demo

Interactive demo of the MCP (Model Context Protocol) Shipping Suite.

This space provides a web interface to explore the shipping automation capabilities.
EOF

    # Create a simple Gradio app
    cat > "$space_dir/app.py" << 'EOF'
import gradio as gr
import json
from datetime import datetime

def create_shipment_demo(from_address, to_address, weight, length, width, height):
    """Demo function for shipment creation"""
    
    # Simulate shipment creation
    shipment = {
        "id": f"shp_{int(datetime.now().timestamp())}",
        "status": "created",
        "from_address": from_address,
        "to_address": to_address,
        "parcel": {
            "weight": weight,
            "length": length,
            "width": width,
            "height": height
        },
        "created_at": datetime.now().isoformat(),
        "rates": [
            {"carrier": "FedEx", "service": "Ground", "rate": 12.50},
            {"carrier": "UPS", "service": "Ground", "rate": 11.75},
            {"carrier": "USPS", "service": "Priority", "rate": 8.95}
        ]
    }
    
    return json.dumps(shipment, indent=2)

def track_shipment_demo(tracking_code):
    """Demo function for shipment tracking"""
    
    # Simulate tracking response
    tracking = {
        "tracking_code": tracking_code,
        "status": "in_transit",
        "status_detail": "Package is on its way to destination",
        "estimated_delivery": "2024-01-15",
        "tracking_events": [
            {
                "status": "pre_transit",
                "message": "Shipping label created",
                "datetime": "2024-01-10T10:00:00Z",
                "location": "Origin facility"
            },
            {
                "status": "in_transit", 
                "message": "Package picked up",
                "datetime": "2024-01-10T14:30:00Z",
                "location": "Origin facility"
            },
            {
                "status": "in_transit",
                "message": "In transit to destination",
                "datetime": "2024-01-12T08:15:00Z", 
                "location": "Sorting facility"
            }
        ]
    }
    
    return json.dumps(tracking, indent=2)

# Create Gradio interface
with gr.Blocks(title="MCP Shipping Suite Demo") as demo:
    gr.Markdown("# 📦 MCP Shipping Suite Demo")
    gr.Markdown("Interactive demo of shipping automation capabilities")
    
    with gr.Tab("Create Shipment"):
        gr.Markdown("## Create a new shipment")
        
        with gr.Row():
            from_addr = gr.Textbox(label="From Address", placeholder="123 Main St, City, State 12345")
            to_addr = gr.Textbox(label="To Address", placeholder="456 Oak Ave, City, State 67890")
        
        with gr.Row():
            weight = gr.Number(label="Weight (lbs)", value=2.5)
            length = gr.Number(label="Length (in)", value=10)
            width = gr.Number(label="Width (in)", value=8)
            height = gr.Number(label="Height (in)", value=6)
        
        create_btn = gr.Button("Create Shipment", variant="primary")
        shipment_output = gr.Code(label="Shipment Response", language="json")
        
        create_btn.click(
            create_shipment_demo,
            inputs=[from_addr, to_addr, weight, length, width, height],
            outputs=shipment_output
        )
    
    with gr.Tab("Track Shipment"):
        gr.Markdown("## Track an existing shipment")
        
        tracking_input = gr.Textbox(label="Tracking Code", placeholder="1Z999AA1234567890")
        track_btn = gr.Button("Track Shipment", variant="primary")
        tracking_output = gr.Code(label="Tracking Response", language="json")
        
        track_btn.click(
            track_shipment_demo,
            inputs=tracking_input,
            outputs=tracking_output
        )
    
    with gr.Tab("About"):
        gr.Markdown("""
        ## About MCP Shipping Suite
        
        The MCP Shipping Suite is a comprehensive shipping automation platform built with:
        
        - **TypeScript/Node.js** - Modern development stack
        - **Model Context Protocol (MCP)** - JSON-RPC 2.0 for AI integration
        - **EasyPost & Veeqo APIs** - Multi-carrier shipping and inventory management
        - **Nx Monorepo** - Scalable project structure
        - **Docker** - Containerized deployment
        
        ### Features
        - Multi-carrier rate shopping
        - Real-time shipment tracking
        - Automated label generation
        - Webhook processing
        - Inventory integration
        - AI-powered optimization
        
        ### Repository
        [GitHub Repository](https://github.com/mcp-shipping/perplexity-suite)
        """)

if __name__ == "__main__":
    demo.launch()
EOF

    # Create requirements.txt
    cat > "$space_dir/requirements.txt" << EOF
gradio==4.44.0
EOF

    # Upload the space
    info "Uploading space to: ${org_prefix}${space_name}"
    
    huggingface-cli upload "${org_prefix}${space_name}" "$space_dir" --repo-type space
    
    success "Space uploaded successfully!"
    info "View at: https://huggingface.co/spaces/${org_prefix}${space_name}"
}

# Run inference test
test_inference() {
    info "Testing Hugging Face Inference API..."
    
    if [ -z "$HF_API_TOKEN" ]; then
        error "HF_API_TOKEN required for inference testing"
        exit 1
    fi
    
    # Test with a simple model (using a public model for testing)
    local test_model="microsoft/DialoGPT-medium"
    local test_input="Hello, how can I help with shipping?"
    
    info "Testing inference with model: $test_model"
    
    local response=$(curl -s -X POST \
        "https://api-inference.huggingface.co/models/$test_model" \
        -H "Authorization: Bearer $HF_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"inputs\": \"$test_input\"}")
    
    if echo "$response" | jq . > /dev/null 2>&1; then
        success "Inference API test successful"
        info "Response: $(echo "$response" | jq -r '.[0].generated_text // .error // "Unknown response"')"
    else
        error "Inference API test failed"
        echo "Response: $response"
        exit 1
    fi
}

# Usage function
usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Hugging Face Integration for MCP Shipping Suite"
    echo ""
    echo "OPTIONS:"
    echo "  -m, --model [NAME]    Create and upload model repository"
    echo "  -s, --space [NAME]    Create and upload Gradio space"
    echo "  -t, --test            Test Hugging Face Inference API"
    echo "  -c, --check           Check Hugging Face CLI setup"
    echo "  -a, --all             Deploy both model and space"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "ENVIRONMENT VARIABLES:"
    echo "  HF_API_TOKEN         Hugging Face API token"
    echo "  USE_HF               Enable deployment (set to 'true')"
    echo "  HF_ORGANIZATION      Optional organization name"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 --model            # Deploy model with default name"
    echo "  $0 --space my-demo    # Deploy space with custom name"
    echo "  $0 --all              # Deploy both model and space"
    echo "  $0 --test             # Test inference API"
    echo ""
}

# Main script logic
main() {
    case "${1:-}" in
        -m|--model)
            check_hf_cli
            check_hf_auth
            check_deployment_conditions
            create_model_repo "${2:-}"
            upload_model "${2:-}"
            ;;
        -s|--space)
            check_hf_cli
            check_hf_auth
            check_deployment_conditions
            create_space_repo "${2:-}"
            upload_space "${2:-}"
            ;;
        -t|--test)
            check_hf_cli
            check_hf_auth
            test_inference
            ;;
        -c|--check)
            info "Checking Hugging Face CLI installation..."
            check_hf_cli
            success "Hugging Face CLI is installed"
            
            info "Checking authentication..."
            check_hf_auth
            success "Authentication successful"
            ;;
        -a|--all)
            check_hf_cli
            check_hf_auth
            check_deployment_conditions
            
            info "Deploying model..."
            create_model_repo
            upload_model
            
            info "Deploying space..."
            create_space_repo
            upload_space
            ;;
        -h|--help)
            usage
            ;;
        "")
            warning "No operation specified. Use --help for usage information."
            usage
            ;;
        *)
            error "Unknown option: $1"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi