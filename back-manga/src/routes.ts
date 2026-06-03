import { Router } from 'express';
import { AvaliacaoController } from './controllers/AvaliacaoController';

const router = Router();
const controller = new AvaliacaoController();

router.post('/sincronizar-pacote', controller.sincronizarPacote);
router.get('/listar', controller.listar);

export { router };