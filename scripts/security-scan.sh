#!/bin/bash

# =============================================================================
# Security Scanning Script for Perplexity MCP Shipping Suite
# Scans Docker images for vulnerabilities including CVE-2025-5399
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if trivy is available
check_trivy() {
    if ! command -v trivy &> /dev/null; then
        print_warning "Trivy not found locally. Using Docker container..."
        TRIVY_CMD="docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache/trivy aquasec/trivy:latest"
    else
        print_success "Using local Trivy installation"
        TRIVY_CMD="trivy"
    fi
}

# Function to scan a specific image
scan_image() {
    local image=$1
    local severity=${2:-HIGH,CRITICAL}
    
    print_status "Scanning image: $image"
    
    if $TRIVY_CMD image --exit-code 0 --severity $severity --format table $image; then
        print_success "No high/critical vulnerabilities found in $image"
        return 0
    else
        print_error "Vulnerabilities found in $image"
        return 1
    fi
}

# Function to check for CVE-2025-5399 specifically
check_cve_2025_5399() {
    local image=$1
    
    print_status "Checking for CVE-2025-5399 in $image"
    
    if $TRIVY_CMD image --exit-code 0 --vuln-type os --format json $image | grep -q "CVE-2025-5399"; then
        print_error "CVE-2025-5399 found in $image - URGENT ACTION REQUIRED"
        return 1
    else
        print_success "CVE-2025-5399 not found in $image"
        return 0
    fi
}

# Function to scan all project images
scan_project_images() {
    print_status "Scanning all project Docker images..."
    
    local images=(
        "redis:7.2-alpine"
        "postgres:15-alpine"
        "nginx:1.25-alpine"
        "node:18-alpine"
        "prom/prometheus:latest"
        "grafana/grafana:latest"
    )
    
    local failed_scans=0
    
    for image in "${images[@]}"; do
        if ! scan_image "$image"; then
            ((failed_scans++))
        fi
        
        if ! check_cve_2025_5399 "$image"; then
            ((failed_scans++))
        fi
        
        echo ""
    done
    
    if [ $failed_scans -eq 0 ]; then
        print_success "All security scans passed!"
        return 0
    else
        print_error "$failed_scans security issues found"
        return 1
    fi
}

# Function to scan built application images
scan_built_images() {
    print_status "Scanning built application images..."
    
    local built_images=(
        "perplexity-easypost-mcp"
        "perplexity-veeqo-mcp"
        "perplexity-web-interface"
    )
    
    local failed_scans=0
    
    for image in "${built_images[@]}"; do
        if docker images | grep -q "$image"; then
            if ! scan_image "$image"; then
                ((failed_scans++))
            fi
        else
            print_warning "Image $image not found locally"
        fi
    done
    
    return $failed_scans
}

# Function to run security scan via Docker Compose
run_compose_security_scan() {
    print_status "Running security scan via Docker Compose..."
    
    if docker-compose ps | grep -q "Up"; then
        print_warning "Stopping running services for security scan..."
        docker-compose down
    fi
    
    # Run security scan
    if docker-compose --profile security up security-scan; then
        print_success "Docker Compose security scan completed"
        return 0
    else
        print_error "Docker Compose security scan failed"
        return 1
    fi
}

# Function to show security recommendations
show_recommendations() {
    echo ""
    echo "🔒 Security Recommendations:"
    echo "=========================="
    echo ""
    echo "1. Update base images regularly:"
    echo "   docker pull redis:7.2-alpine"
    echo "   docker pull postgres:15-alpine"
    echo "   docker pull nginx:1.25-alpine"
    echo ""
    echo "2. Rebuild application images:"
    echo "   docker-compose build --no-cache"
    echo ""
    echo "3. Run security scans regularly:"
    echo "   ./scripts/security-scan.sh"
    echo ""
    echo "4. Monitor for new vulnerabilities:"
    echo "   docker scout cves <image-name>"
    echo ""
    echo "5. Use Docker Compose security profile:"
    echo "   docker-compose --profile security up security-scan"
    echo ""
}

# Main function
main() {
    echo "🔒 Perplexity MCP Shipping Suite - Security Scanner"
    echo "=================================================="
    echo ""
    
    check_trivy
    
    case "${1:-all}" in
        "images")
            scan_project_images
            ;;
        "built")
            scan_built_images
            ;;
        "compose")
            run_compose_security_scan
            ;;
        "cve")
            if [ -z "$2" ]; then
                print_error "Please specify an image name for CVE check"
                exit 1
            fi
            check_cve_2025_5399 "$2"
            ;;
        "all"|*)
            scan_project_images
            scan_built_images
            show_recommendations
            ;;
    esac
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  all      - Scan all images (default)"
    echo "  images   - Scan base Docker images only"
    echo "  built    - Scan built application images only"
    echo "  compose  - Run security scan via Docker Compose"
    echo "  cve <image> - Check specific image for CVE-2025-5399"
    echo "  --help   - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Scan all images"
    echo "  $0 images            # Scan base images only"
    echo "  $0 cve redis:7.2-alpine  # Check specific image for CVE"
    echo ""
    exit 0
fi

# Run main function
main "$@"
