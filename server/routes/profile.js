import express from 'express';
import { getPublicProfile } from '../controllers/publicProfileController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/:username', asyncHandler(getPublicProfile));

export default router;
