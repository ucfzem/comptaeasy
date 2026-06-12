import app from './api/app.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ ComptaEasy API running on port ${PORT}`);
  console.log(`  Dashboard: http://localhost:${PORT}`);
  console.log(`  API:       http://localhost:${PORT}/api/health`);
});
