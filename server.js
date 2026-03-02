// Root-level server wrapper for Railway deployment
import('./backend/server.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
