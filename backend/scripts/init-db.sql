-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL,
    default_value TEXT,
    active BOOLEAN DEFAULT true,
    parent_config_id UUID REFERENCES configurations(id) ON DELETE SET NULL,
    validation_rules JSONB DEFAULT '[]'::jsonb,
    parent_conditions JSONB DEFAULT '[]'::jsonb,
    translations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key);
CREATE INDEX IF NOT EXISTS idx_configurations_parent_config_id ON configurations(parent_config_id);
CREATE INDEX IF NOT EXISTS idx_configurations_active ON configurations(active);
