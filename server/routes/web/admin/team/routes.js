import { Router } from 'express';
import { createTeam, getTeam, getAllTeams, updateTeam, deleteTeam } from "#webController/admin/team/controller.js";

const router = Router();

router.post('/create-team', createTeam);
router.post('/get-team', getTeam);
router.post('/get-all-teams', getAllTeams);
router.post('/update-team', updateTeam);
router.post('/delete-Team', deleteTeam);

export default router;