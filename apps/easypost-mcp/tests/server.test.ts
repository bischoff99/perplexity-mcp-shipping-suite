import { EasyPostMCPServer } from '../src/server.js';
import { EasyPostClient } from '../src/services/easypost-client.js';
import { logger } from '../src/utils/logger.js';
import nock from 'nock';

// Mock logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    performance: jest.fn()
  }
}));

// Mock EasyPost Client
jest.mock('../src/services/easypost-client');
const MockedEasyPostClient = EasyPostClient as jest.MockedClass<typeof EasyPostClient>;

describe('EasyPostMCPServer', () => {
  let server: EasyPostMCPServer;
  let mockClient: jest.Mocked<EasyPostClient>;
  
  const defaultConfig = {
    name: 'test-easypost-mcp-server',
    version: '1.0.0',
    apiKey: 'EZAK_test_1234567890abcdef',
    environment: 'test' as const,
    timeout: 30000,
    retryAttempts: 3,
    enableCache: false,
    logLevel: 'error',
    port: undefined
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock client instance
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      getStats: jest.fn(),
      clearCache: jest.fn(),
      healthCheck: jest.fn(),
      dispose: jest.fn()
    } as any;
    
    // Make the mock constructor return our mock instance
    MockedEasyPostClient.mockImplementation(() => mockClient);
    
    // Create server instance
    server = new EasyPostMCPServer(defaultConfig);
  });

  afterEach(async () => {
    if (server && server.isServerRunning()) {
      await server.stop();
    }
    nock.cleanAll();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(MockedEasyPostClient).toHaveBeenCalledWith({
        apiKey: defaultConfig.apiKey,
        timeout: defaultConfig.timeout,
        retryAttempts: defaultConfig.retryAttempts,
        enableCache: defaultConfig.enableCache,
        baseURL: 'https://api.easypost.com/v2'
      });
      
      expect(logger.info).toHaveBeenCalledWith(
        'EasyPost MCP Server initialized',
        expect.objectContaining({
          name: defaultConfig.name,
          version: defaultConfig.version,
          environment: defaultConfig.environment
        })
      );
    });

    it('should set production base URL for production environment', () => {
      const prodConfig = { ...defaultConfig, environment: 'production' as const };
      new EasyPostMCPServer(prodConfig);
      
      expect(MockedEasyPostClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.easypost.com/v2'
        })
      );
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      // Mock successful account check
      mockClient.get.mockResolvedValueOnce({
        id: 'acct_test123',
        balance: '100.00'
      });

      await server.start();
      
      expect(server.isServerRunning()).toBe(true);
      expect(mockClient.get).toHaveBeenCalledWith('/account');
      expect(logger.info).toHaveBeenCalledWith('EasyPost API connection verified');
    });

    it('should fail to start if EasyPost connection fails', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(server.start()).rejects.toThrow('Connection failed');
      expect(server.isServerRunning()).toBe(false);
    });

    it('should stop server gracefully', async () => {
      // Mock successful account check
      mockClient.get.mockResolvedValueOnce({
        id: 'acct_test123',
        balance: '100.00'
      });

      await server.start();
      await server.stop();
      
      expect(server.isServerRunning()).toBe(false);
    });
  });

  describe('Tool Definitions', () => {
    it('should return correct tool definitions', () => {
      const tools = server.getAvailableTools();
      
      expect(tools).toEqual([
        'create_shipment',
        'get_shipment_rates',
        'buy_shipment_label',
        'track_shipment',
        'validate_address',
        'get_smartrate_estimates'
      ]);
    });

    it('should return correct resource definitions', () => {
      const resources = server.getAvailableResources();
      
      expect(resources).toEqual([
        'easypost://account',
        'easypost://carriers'
      ]);
    });
  });

  describe('Configuration', () => {
    it('should return server configuration', () => {
      const config = server.getConfig();
      
      expect(config).toEqual(defaultConfig);
    });

    it('should handle configuration with port', () => {
      const configWithPort = { ...defaultConfig, port: 3000 };
      const serverWithPort = new EasyPostMCPServer(configWithPort);
      
      expect(serverWithPort.getConfig().port).toBe(3000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid environment gracefully', () => {
      // This should not throw during construction
      expect(() => {
        new EasyPostMCPServer({
          ...defaultConfig,
          environment: 'invalid' as any
        });
      }).not.toThrow();
    });

    it('should handle missing API key', () => {
      expect(() => {
        new EasyPostMCPServer({
          ...defaultConfig,
          apiKey: ''
        });
      }).not.toThrow(); // Construction should succeed, validation happens at runtime
    });
  });

  describe('Cache Configuration', () => {
    it('should enable cache when configured', () => {
      const configWithCache = { ...defaultConfig, enableCache: true };
      new EasyPostMCPServer(configWithCache);
      
      expect(MockedEasyPostClient).toHaveBeenCalledWith(
        expect.objectContaining({
          enableCache: true
        })
      );
    });

    it('should disable cache by default', () => {
      expect(MockedEasyPostClient).toHaveBeenCalledWith(
        expect.objectContaining({
          enableCache: false
        })
      );
    });
  });

  describe('HTTP Server Integration', () => {
    it('should not start HTTP server without port', async () => {
      mockClient.get.mockResolvedValueOnce({
        id: 'acct_test123',
        balance: '100.00'
      });

      await server.start();
      
      // No HTTP server should be started
      expect(logger.info).not.toHaveBeenCalledWith(
        expect.stringMatching(/HTTP server started/)
      );
    });

    it('should handle HTTP server configuration with port', () => {
      const configWithPort = { ...defaultConfig, port: 3000 };
      const serverWithPort = new EasyPostMCPServer(configWithPort);
      
      // Should not throw during construction
      expect(serverWithPort).toBeInstanceOf(EasyPostMCPServer);
    });
  });

  describe('Logging Integration', () => {
    it('should log initialization', () => {
      expect(logger.info).toHaveBeenCalledWith(
        'EasyPost MCP Server initialized',
        expect.objectContaining({
          name: defaultConfig.name,
          version: defaultConfig.version,
          environment: defaultConfig.environment,
          enableCache: defaultConfig.enableCache
        })
      );
    });

    it('should log server start', async () => {
      mockClient.get.mockResolvedValueOnce({
        id: 'acct_test123',
        balance: '100.00'
      });

      await server.start();
      
      expect(logger.info).toHaveBeenCalledWith('EasyPost API connection verified');
      expect(logger.info).toHaveBeenCalledWith('MCP Server connected and ready');
    });

    it('should log errors during startup', async () => {
      const error = new Error('Connection failed');
      mockClient.get.mockRejectedValueOnce(error);

      await expect(server.start()).rejects.toThrow('Connection failed');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to start server',
        expect.objectContaining({
          error: 'Connection failed'
        })
      );
    });
  });
});

// Integration tests with real HTTP responses (mocked)
describe('EasyPostMCPServer Integration', () => {
  let server: EasyPostMCPServer;
  
  const config = {
    name: 'integration-test-server',
    version: '1.0.0',
    apiKey: 'EZAK_test_integration_key',
    environment: 'test' as const,
    timeout: 5000,
    retryAttempts: 1,
    enableCache: true,
    logLevel: 'error'
  };

  beforeEach(() => {
    server = new EasyPostMCPServer(config);
    
    // Setup nock interceptors for EasyPost API
    nock('https://api.easypost.com')
      .get('/v2/account')
      .reply(200, {
        id: 'acct_integration_test',
        object: 'Account',
        balance: '100.00',
        name: 'Test Account'
      });
  });

  afterEach(async () => {
    if (server.isServerRunning()) {
      await server.stop();
    }
    nock.cleanAll();
  });

  it('should successfully connect to mocked EasyPost API', async () => {
    await expect(server.start()).resolves.not.toThrow();
    expect(server.isServerRunning()).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    // Override the account endpoint to return an error
    nock.cleanAll();
    nock('https://api.easypost.com')
      .get('/v2/account')
      .reply(401, {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid API key'
        }
      });

    await expect(server.start()).rejects.toThrow();
  });
});

// Performance tests
describe('EasyPostMCPServer Performance', () => {
  let server: EasyPostMCPServer;
  
  beforeEach(() => {
    server = new EasyPostMCPServer({
      name: 'perf-test-server',
      version: '1.0.0',
      apiKey: 'EZAK_test_perf_key',
      environment: 'test',
      timeout: 30000,
      retryAttempts: 3,
      enableCache: true,
      logLevel: 'error'
    });
  });

  afterEach(async () => {
    if (server.isServerRunning()) {
      await server.stop();
    }
  });

  it('should initialize quickly', () => {
    const startTime = Date.now();
    
    new EasyPostMCPServer({
      name: 'quick-init-test',
      version: '1.0.0',
      apiKey: 'EZAK_test_key',
      environment: 'test',
      timeout: 30000,
      retryAttempts: 3,
      enableCache: false,
      logLevel: 'error'
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100); // Should initialize in under 100ms
  });

  it('should handle configuration validation efficiently', () => {
    const startTime = Date.now();
    
    // Create multiple instances to test configuration validation performance
    for (let i = 0; i < 10; i++) {
      new EasyPostMCPServer({
        name: `perf-test-${i}`,
        version: '1.0.0',
        apiKey: `EZAK_test_key_${i}`,
        environment: 'test',
        timeout: 30000,
        retryAttempts: 3,
        enableCache: false,
        logLevel: 'error'
      });
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500); // Should handle 10 instances in under 500ms
  });
});