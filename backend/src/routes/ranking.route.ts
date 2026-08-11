import { Router } from 'express';
import { 
  getGlobalRanking, 
  getOpennessRanking, 
  forceSyncRanking 
} from '../controllers/ranking.controller.js';

const router = Router();

router.get('/global', getGlobalRanking);
router.get('/openness', getOpennessRanking);
router.post('/sync', forceSyncRanking);

export default router;