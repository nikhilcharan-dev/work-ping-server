import { addTeamMemberToTeam, removeTeamMemberFromTeam, getTeamMembers, getUserTeams } from "#webController/admin/teamMembers/controller.js";
import { Router } from "express";

const router = Router();

router.post('/add-team-member', addTeamMemberToTeam);
router.post('/remove-team-member', removeTeamMemberFromTeam);
router.post('/get-team-members', getTeamMembers);
router.post('/get-user-teams', getUserTeams);   

export default router;