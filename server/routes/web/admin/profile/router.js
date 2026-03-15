import { getProfile, updateProfile, changePassword, deactivateAccount } from '#webController/admin/auth/controller.js';
import { Router } from 'express';

const router = Router();

router.get('/profile', getProfile);
router.post('/update-profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/deactivate-account', deactivateAccount);

export default router;
