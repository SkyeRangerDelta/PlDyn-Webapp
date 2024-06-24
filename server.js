// Boots the Webapp

// Imports
import { config } from 'dotenv';
import { exec } from 'child_process';

// Vars
config();

const port = process.env.APP_PORT || 4200;
const host = process.env.APP_HOST || 'localhost';

// Start the server
const cmd = `ng serve --host ${host} --port ${port}`;

console.info('[INFO]', `Starting server on ${host}:${port}`);
exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error('[ERROR]', error);
  }

  if (stderr) {
    console.error('[ERROR]', error);
  }

  console.log('[INFO]', stdout);
});
