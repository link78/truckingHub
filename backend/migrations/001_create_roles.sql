-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('trucker', 'Independent truck driver or owner-operator'),
  ('dispatcher', 'Manages and coordinates logistics operations'),
  ('shipper', 'Posts freight jobs and manages shipments'),
  ('service_provider', 'Provides additional logistics services'),
  ('admin', 'System administrator with full access')
ON CONFLICT (name) DO NOTHING;
