import express from 'express';
import { addWebsite } from '../controllers/WebsiteControllers.js';

const router = express.Router();

router.post('/', addWebsite);

export default router;

