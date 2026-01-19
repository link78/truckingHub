-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  rated_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rating details
  overall_rating INTEGER NOT NULL,
  communication_rating INTEGER,
  professionalism_rating INTEGER,
  timeliness_rating INTEGER,
  
  -- Review
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Response
  response_text TEXT,
  response_date TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT rating_range_overall CHECK (overall_rating >= 1 AND overall_rating <= 5),
  CONSTRAINT rating_range_communication CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
  CONSTRAINT rating_range_professionalism CHECK (professionalism_rating IS NULL OR (professionalism_rating >= 1 AND professionalism_rating <= 5)),
  CONSTRAINT rating_range_timeliness CHECK (timeliness_rating IS NULL OR (timeliness_rating >= 1 AND timeliness_rating <= 5)),
  CONSTRAINT no_self_rating CHECK (rated_user_id != rating_user_id),
  CONSTRAINT unique_job_rating UNIQUE (job_id, rated_user_id, rating_user_id)
);

-- Create trigger for ratings table
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update user average rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    average_rating = (
      SELECT COALESCE(AVG(overall_rating), 0)
      FROM ratings
      WHERE rated_user_id = NEW.rated_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM ratings
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE id = NEW.rated_user_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_rating_trigger AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();
