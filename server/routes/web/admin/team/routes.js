import { Router } from 'express';
import { createTeam, getTeam, getAllTeams, updateTeam, deleteTeam, getTeamsPagination } from "#webController/admin/team/team.controller.js";
import { addTeamMemberToTeam, removeTeamMemberFromTeam, getTeamMembers, getUserTeams} from "#webController/admin/team/member.controller.js";

const router = Router();

// Team routes

router.post('/create-team', createTeam);
router.get('/get-team/:id', getTeam);
router.post('/get-all-teams', getAllTeams);
router.post('/update-team', updateTeam);
router.post('/delete-team', deleteTeam);
router.get('/get-teams-filter', getTeamsPagination);

// Team Member routes

router.get('/add-team-member', addTeamMemberToTeam);
router.post('/remove-team-member', removeTeamMemberFromTeam);
router.get('/get-team-members', getTeamMembers);
router.get('/get-user-teams', getUserTeams);

export default router;






