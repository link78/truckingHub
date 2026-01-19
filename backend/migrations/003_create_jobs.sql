-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  posted_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Job details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cargo_type VARCHAR(50) NOT NULL,
  cargo_weight DECIMAL(10,2),
  cargo_weight_unit VARCHAR(20) DEFAULT 'lbs',
  
  -- Origin information
  origin_address VARCHAR(255) NOT NULL,
  origin_city VARCHAR(100) NOT NULL,
  origin_state VARCHAR(50) NOT NULL,
  origin_zip VARCHAR(20) NOT NULL,
  origin_country VARCHAR(100) DEFAULT 'USA',
  pickup_date DATE NOT NULL,
  pickup_time TIME,
  
  -- Destination information
  destination_address VARCHAR(255) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  destination_state VARCHAR(50) NOT NULL,
  destination_zip VARCHAR(20) NOT NULL,
  destination_country VARCHAR(100) DEFAULT 'USA',
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  
  -- Distance and pricing
  distance_miles DECIMAL(10,2),
  base_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Status and metadata
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  special_instructions TEXT,
  requires_team_driver BOOLEAN DEFAULT FALSE,
  requires_hazmat BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT positive_price CHECK (base_price >= 0),
  CONSTRAINT positive_weight CHECK (cargo_weight IS NULL OR cargo_weight >= 0),
  CONSTRAINT valid_dates CHECK (delivery_date >= pickup_date)
);

-- Create trigger for jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
