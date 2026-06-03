import express from 'express';
import cors from 'cors';
import { router } from './routes';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 

app.use('/api', router);

app.get('/', (req, res) => {
});

app.listen(PORT, () => {
  console.log(`
  🚀 SERVIDOR RODANDO!
  ---------------------------------------
  Local:   http://localhost:${PORT}
  Rede:    http://192.168.253.18:${PORT} (Use este IP no App)
  ---------------------------------------
  `);
});