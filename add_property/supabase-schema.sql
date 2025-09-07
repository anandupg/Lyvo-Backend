-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL, -- Simple text for now
  property_name VARCHAR(255) NOT NULL,
  property_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  max_occupancy INTEGER,
  address JSONB NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  pricing JSONB NOT NULL,
  amenities JSONB DEFAULT '{}'::jsonb,
  rules JSONB DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple indexes
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

