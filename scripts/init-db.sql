-- Initialize PostgreSQL database for Perplexity MCP Suite
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    service VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    request_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service ON audit_logs(service);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create configuration table
CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for configurations
CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key);

-- Create webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    service VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for metrics
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_service ON metrics(service);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for configurations table
CREATE TRIGGER update_configurations_updated_at 
    BEFORE UPDATE ON configurations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default configurations
INSERT INTO configurations (key, value, description) VALUES
    ('system.version', '"1.0.0"', 'System version'),
    ('system.initialized', 'true', 'System initialization flag'),
    ('cache.default_ttl', '300', 'Default cache TTL in seconds'),
    ('rate_limit.default', '100', 'Default rate limit per window'),
    ('rate_limit.window_ms', '900000', 'Rate limit window in milliseconds')
ON CONFLICT (key) DO NOTHING;

-- Create a view for system health
CREATE OR REPLACE VIEW system_health AS
SELECT 
    'database' as component,
    'healthy' as status,
    NOW() as last_check,
    'PostgreSQL connection successful' as message
UNION ALL
SELECT 
    'audit_logs' as component,
    CASE WHEN COUNT(*) > 0 THEN 'healthy' ELSE 'warning' END as status,
    NOW() as last_check,
    'Audit logs table accessible' as message
FROM audit_logs
UNION ALL
SELECT 
    'webhook_events' as component,
    CASE WHEN COUNT(*) >= 0 THEN 'healthy' ELSE 'error' END as status,
    NOW() as last_check,
    'Webhook events table accessible' as message
FROM webhook_events;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO perplexity;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO perplexity;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO perplexity;

-- Create a function to clean up old audit logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old metrics (optional)
CREATE OR REPLACE FUNCTION cleanup_old_metrics(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM metrics 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
INSERT INTO audit_logs (service, action, details) VALUES
    ('database', 'initialization', '{"message": "Database initialized successfully", "version": "1.0.0"}');
