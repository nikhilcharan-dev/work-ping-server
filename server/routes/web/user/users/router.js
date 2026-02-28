import { Router } from 'express';
import { getProfile, updateProfile, changePassword, deactivateAccount } from '#webController/user/profile/controller.js';

const router = Router();

router.get('/profile', getProfile);
router.post('/update-profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/deactivate-account', deactivateAccount);

export default router;
