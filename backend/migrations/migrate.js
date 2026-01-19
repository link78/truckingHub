const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migrations...\n');
    
    // Get all migration files in order
    const migrationFiles = [
      '001_create_roles.sql',
      '002_create_users.sql',
      '003_create_jobs.sql',
      '004_create_bids.sql',
      '005_create_notifications.sql',
      '006_create_ratings.sql',
      '007_create_indexes.sql'
    ];
    
    // Run each migration
    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Running migration: ${file}...`);
      await client.query(sql);
      console.log(`✓ ${file} completed\n`);
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
    // Close the connection pool - this is a standalone script that exits after completion
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('\n✓ Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = runMigrations;
