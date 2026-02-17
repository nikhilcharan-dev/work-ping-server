import { Router } from 'express';
import { createTeam, getTeam, getAllTeams, updateTeam, deleteTeam } from "#webController/admin/team/team.controller.js";
import { addTeamMemberToTeam, removeTeamMemberFromTeam, getTeamMembers, getUserTeams } from "#webController/admin/team/member.controller.js";

const router = Router();

// Team routes

router.post('/create-team', createTeam);
router.post('/get-team', getTeam);
router.post('/get-all-teams', getAllTeams);
router.post('/update-team', updateTeam);
router.post('/delete-Team', deleteTeam);

// Team Member routes

router.post('/add-team-member', addTeamMemberToTeam);
router.post('/remove-team-member', removeTeamMemberFromTeam);
router.post('/get-team-members', getTeamMembers);
router.post('/get-user-teams', getUserTeams);   

export default router;






