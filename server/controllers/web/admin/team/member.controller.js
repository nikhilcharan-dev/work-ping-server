import TeamMembership from "#models/TeamMembership.js";
import mongoose from "mongoose";


export const addTeamMemberToTeam = asyncHandler(
    async(req, res) => {
        const {userId, teamId, organizationId, roleInTeam} = req.body;  
        if(!userId || !teamId || !organizationId){
            return res.status(400).json({error: "Missing required fields"});
        }   
        const membershipExists = await TeamMembership.findOne({userId, teamId, organizationId}) !== null ? true : false;

        if(membershipExists) return res.status(400).json({error: "User is already a member of the team"});
        const detailObject = {userId, teamId, organizationId};
        if(roleInTeam !== undefined && roleInTeam !== null) detailObject.roleInTeam = roleInTeam;

        const addMembership = await TeamMembership.create(detailObject);
        detailObject.membershipId = addMembership._id;

        return res.status(200).json({   
            success: "User added to team successfully",
            membershipDetails: detailObject
        });
    }, "ADMIN_ADD_TEAM_MEMBER_ERROR"
);

export const removeTeamMemberFromTeam = asyncHandler(
    async(req, res) => {
        const {membershipId} = req.body;
        if(!membershipId || !mongoose.Types.ObjectId.isValid(membershipId)){
            return res.status(400).json({error: "Invalid membershipId"});
        }
        const removal = await TeamMembership.findByIdAndDelete(membershipId);

        if(removal === null) return res.status(400).json({error: "No team membership found with given id"});

        return res.status(200).json({
            success: "User removed from team successfully",
            membershipId: removal._id
        });
    }, "ADMIN_REMOVE_TEAM_MEMBER_ERROR"
);

export const getTeamMembers = asyncHandler(
    async(req, res) => {
        const {teamId} = req.body;
        if(!teamId || !mongoose.Types.ObjectId.isValid(teamId)){
            return res.status(400).json({error: "Invalid teamId"});
        }   
        const membersList = await TeamMembership.find({teamId: teamId}).populate({path: "userId", select: "name email"});
        return res.status(200).json(membersList);
    }, "ADMIN_GET_TEAM_MEMBERS_ERROR"
);


export const getUserTeams = asyncHandler(
    async(req, res) => {
        const {userId} = req.body;
        if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
            return res.status(400).json({error: "Invalid userId"});
        }
        const teamsList = await TeamMembership.find({userId: userId}).populate({path: "teamId", select: "teamName description"});
        return res.status(200).json(teamsList);
    }, "ADMIN_GET_USER_TEAMS_ERROR"
);

// update team member's role in team
export const updateTeamMemberRole = asyncHandler(
    async(req, res) => {
        const {membershipId, roleInTeam} = req.body;
        if(!membershipId || !mongoose.Types.ObjectId.isValid(membershipId)){
            return res.status(400).json({error: "Invalid membershipId"});
        }
        if(!roleInTeam){
            return res.status(400).json({error: "Missing required field: roleInTeam"});
        }
        const updatedMembership = await TeamMembership.findByIdAndUpdate(membershipId, {roleInTeam}, {new: true});
        if(updatedMembership === null) return res.status(400).json({error: "No team membership found with given id"});
        return res.status(200).json({
            success: "Team member's role updated successfully",
            membershipDetails: updatedMembership
        });
    }, "ADMIN_UPDATE_TEAM_MEMBER_ROLE_ERROR"
);
