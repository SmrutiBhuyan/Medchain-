import express from 'express';
import { getOutbreaks, getNearbyOutbreaks } from '../controllers/outbreak.js';

const router = express.Router();

router.get('/', getOutbreaks);
router.post('/nearby', getNearbyOutbreaks);

export default router;