import express from 'express';
import { getDiseases } from '../controllers/disease.js';

const router = express.Router();

router.get('/', getDiseases);

export default router;