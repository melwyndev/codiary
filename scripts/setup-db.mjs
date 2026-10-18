import { execSync } from 'child_process';
import path from 'path';

async function runMigration() {
  console.log('Running database setup via InsForge CLI...');
  try {
    const migrationPath = path.join(process.cwd(), '.insforge/migrations/01_init_schema.sql');
    execSync(`npx @insforge/cli db import "${migrationPath}"`, { stdio: 'inherit' });
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigration();
