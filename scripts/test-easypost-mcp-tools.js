#!/usr/bin/env node

/**
 * Simple MCP Client to test EasyPost MCP Server tools
 * This script connects to the MCP server via stdio and tests each tool
 */

import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';

class MCPClient {
    constructor() {
        this.requestId = 1;
        this.server = null;
    }

    async start() {
        console.log('🚀 Starting EasyPost MCP Server...');

        // Start the MCP server
        this.server = spawn('node', ['dist/index.js'], {
            stdio: ['pipe', 'pipe', 'inherit'],
            env: process.env
        });

        // Handle server responses
        this.server.stdout.on('data', (data) => {
            try {
                const response = JSON.parse(data.toString());
                this.handleResponse(response);
            } catch (error) {
                console.log('Server output:', data.toString());
            }
        });

        this.server.on('error', (error) => {
            console.error('❌ Server error:', error);
        });

        // Send initialization request
        await this.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {}
            },
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        });
    }

    async sendRequest(method, params = {}) {
        const request = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method,
            params
        };

        console.log(`📤 Sending ${method} request:`, JSON.stringify(request, null, 2));

        this.server.stdin.write(JSON.stringify(request) + '\n');

        // Wait for response (simplified for demo)
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 1000);
        });
    }

    handleResponse(response) {
        console.log('📥 Received response:', JSON.stringify(response, null, 2));
    }

    async testTools() {
        console.log('\n🔧 Testing MCP Tools...\n');

        // 1. List available tools
        console.log('1️⃣ Listing available tools...');
        await this.sendRequest('tools/list');

        // 2. Test address validation
        console.log('\n2️⃣ Testing address validation...');
        await this.sendRequest('tools/call', {
            name: 'validate_address',
            arguments: {
                street1: '417 Montgomery Street',
                city: 'San Francisco',
                state: 'CA',
                zip: '94104',
                country: 'US'
            }
        });

        // 3. Test shipment rate calculation
        console.log('\n3️⃣ Testing shipment rates...');
        await this.sendRequest('tools/call', {
            name: 'get_shipment_rates',
            arguments: {
                to_address: {
                    street1: '1 E Main St',
                    city: 'Mesa',
                    state: 'AZ',
                    zip: '85201',
                    country: 'US'
                },
                from_address: {
                    street1: '417 Montgomery Street',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94104',
                    country: 'US'
                },
                parcel: {
                    length: 10,
                    width: 8,
                    height: 4,
                    weight: 15
                }
            }
        });

        // 4. Test creating a shipment
        console.log('\n4️⃣ Testing shipment creation...');
        await this.sendRequest('tools/call', {
            name: 'create_shipment',
            arguments: {
                to_address: {
                    name: 'John Doe',
                    street1: '1 E Main St',
                    city: 'Mesa',
                    state: 'AZ',
                    zip: '85201',
                    country: 'US'
                },
                from_address: {
                    name: 'Sender Corp',
                    street1: '417 Montgomery Street',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94104',
                    country: 'US'
                },
                parcel: {
                    length: 10,
                    width: 8,
                    height: 4,
                    weight: 15
                }
            }
        });

        // 5. Test smartrate estimates
        console.log('\n5️⃣ Testing smartrate estimates...');
        await this.sendRequest('tools/call', {
            name: 'get_smartrate_estimates',
            arguments: {
                to_address: {
                    street1: '1 E Main St',
                    city: 'Mesa',
                    state: 'AZ',
                    zip: '85201',
                    country: 'US'
                },
                from_address: {
                    street1: '417 Montgomery Street',
                    city: 'San Francisco',
                    state: 'CA',
                    zip: '94104',
                    country: 'US'
                },
                parcel: {
                    length: 10,
                    width: 8,
                    height: 4,
                    weight: 15
                }
            }
        });
    }

    async stop() {
        console.log('\n🛑 Stopping MCP server...');
        if (this.server) {
            this.server.kill();
        }
    }
}

// Run the test
async function main() {
    const client = new MCPClient();

    try {
        await client.start();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for server to start
        await client.testTools();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for responses
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await client.stop();
        process.exit(0);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}