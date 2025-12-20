import app, { initMongo } from './app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8001;

initMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
