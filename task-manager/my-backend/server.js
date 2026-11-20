import 'dotenv/config';
import app from './src/app.js';
import { createTables } from './src/db.js';

const PORT = process.env.PORT || 3000;

async function start() {
  await createTables();
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
}

start();