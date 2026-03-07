import TeamMembership from "#models/TeamMembership.js";
import mongoose from "mongoose";
import {
    validateObjectId,
    validateRequiredFields,
    validateEnum
} from "#utils/validators.js";


export const addTeamMemberToTeam = asyncHandler(
    async(req, res) => {
        const {userId, teamId, organizationId, roleInTeam} = req.body;
        
        // Validate required fields
        const requiredCheck = validateRequiredFields(
            { userId, teamId, organizationId },
            ['userId', 'teamId', 'organizationId']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ error: requiredCheck.error });
        }
        
        // Validate user ID
        const userIdValidation = validateObjectId(userId, "User ID");
        if (!userIdValidation.valid) {
            return res.status(400).json({ error: userIdValidation.error });
        }
        
        // Validate team ID
        const teamIdValidation = validateObjectId(teamId, "Team ID");
        if (!teamIdValidation.valid) {
            return res.status(400).json({ error: teamIdValidation.error });
        }
        
        // Validate organization ID
        const orgIdValidation = validateObjectId(organizationId, "Organization ID");
        if (!orgIdValidation.valid) {
            return res.status(400).json({ error: orgIdValidation.error });
        }
        
        // Validate roleInTeam if provided
        if (roleInTeam) {
            const roleValidation = validateEnum(
                roleInTeam,
                ["manager", "teamLead", "member"],
                "Role in team"
            );
            if (!roleValidation.valid) {
                return res.status(400).json({ error: roleValidation.error });
            }
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
        
        // Validate membership ID
        const idValidation = validateObjectId(membershipId, "Membership ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
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
        
        // Validate team ID
        const idValidation = validateObjectId(teamId, "Team ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }
        
        const membersList = await TeamMembership.find({teamId: teamId}).populate({path: "userId", select: "name email"});
        return res.status(200).json(membersList);
    }, "ADMIN_GET_TEAM_MEMBERS_ERROR"
);


export const getUserTeams = asyncHandler(
    async(req, res) => {
        const {userId} = req.body;
        
        // Validate user ID
        const idValidation = validateObjectId(userId, "User ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }
        
        const teamsList = await TeamMembership.find({userId: userId}).populate({path: "teamId", select: "teamName description"});
        return res.status(200).json(teamsList);
    }, "ADMIN_GET_USER_TEAMS_ERROR"
);

// update team member's role in team
export const updateTeamMemberRole = asyncHandler(
    async(req, res) => {
        const {membershipId, roleInTeam} = req.body;
        
        // Validate membership ID
        const idValidation = validateObjectId(membershipId, "Membership ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }
        
        // Validate roleInTeam
        const roleValidation = validateEnum(
            roleInTeam,
            ["manager", "teamLead", "member"],
            "Role in team"
        );
        if (!roleValidation.valid) {
            return res.status(400).json({ error: roleValidation.error });
        }
        
        const updatedMembership = await TeamMembership.findByIdAndUpdate(membershipId, {roleInTeam}, {new: true, runValidators: true});
        if(updatedMembership === null) return res.status(400).json({error: "No team membership found with given id"});
        return res.status(200).json({
            success: "Team member's role updated successfully",
            membershipDetails: updatedMembership
        });
    }, "ADMIN_UPDATE_TEAM_MEMBER_ROLE_ERROR"
);
