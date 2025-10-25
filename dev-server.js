/**
 * This file is used for local development ONLY.
 * It starts a local server that listens on a port, which is something Vercel handles automatically.
 * It imports the main Express app from the Vercel-compatible /api/index.js file.
 */
const app = require('./api/index.js');
const dotenv = require('dotenv');

// Load environment variables from .env file in the root directory
dotenv.config();

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`✅ Backend server is running for local development on http://localhost:${port}`);
});