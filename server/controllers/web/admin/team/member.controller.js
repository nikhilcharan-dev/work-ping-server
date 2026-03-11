import TeamMembership from "#models/TeamMembership.js";
import mongoose from "mongoose";
import {
    validateObjectId,
    validateRequiredFields,
    validateEnum
} from "#utils/validators.js";


export const addTeamMemberToTeam = asyncHandler(
  async (req, res) => {
    const { userIds, teamId, organizationId, roleInTeam } = req.body;

    // Validate required fields
    const requiredCheck = validateRequiredFields(
      { userIds, teamId, organizationId },
      ["userIds", "teamId", "organizationId"]
    );
    if (!requiredCheck.valid) {
      return res.status(400).json({ error: requiredCheck.error });
    }

    // Validate userIds array
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds must be a non-empty array" });
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

    // Validate role
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

    // Validate each userId
    for (const userId of userIds) {
      const userIdValidation = validateObjectId(userId, "User ID");
      if (!userIdValidation.valid) {
        return res.status(400).json({ error: userIdValidation.error });
      }
    }

    // Find already existing memberships
    const existingMemberships = await TeamMembership.find({
      userId: { $in: userIds },
      teamId,
      organizationId
    }).select("userId");

    const existingUserIds = existingMemberships.map(m => m.userId.toString());

    // Filter new users
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({ error: "All users are already members of the team" });
    }

    // Prepare objects
    const insertObjects = newUserIds.map(userId => ({
      userId,
      teamId,
      organizationId,
      ...(roleInTeam && { roleInTeam })
    }));

    const memberships = await TeamMembership.insertMany(insertObjects);

    return res.status(200).json({
      success: "Users added to team successfully",
      addedCount: memberships.length,
      membershipIds: memberships.map(m => m._id),
      skippedUsers: existingUserIds
    });
  },
  "ADMIN_ADD_TEAM_MEMBER_ERROR"
);

export const removeTeamMemberFromTeam = asyncHandler(
  async (req, res) => {
    const { membershipIds } = req.body;

    if (!Array.isArray(membershipIds) || membershipIds.length === 0) {
      return res.status(400).json({ error: "membershipIds must be a non-empty array" });
    }

    // Validate IDs
    for (const membershipId of membershipIds) {
      const idValidation = validateObjectId(membershipId, "Membership ID");
      if (!idValidation.valid) {
        return res.status(400).json({ error: idValidation.error });
      }
    }

    const result = await TeamMembership.deleteMany({
      _id: { $in: membershipIds }
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({ error: "No memberships found with given ids" });
    }

    return res.status(200).json({
      success: "Users removed from team successfully",
      removedCount: result.deletedCount
    });
  },
  "ADMIN_REMOVE_TEAM_MEMBER_ERROR"
);

export const getTeamMembers = asyncHandler(
    async(req, res) => {
        const {teamId} = req.query;
        
        // Validate team ID
        const idValidation = validateObjectId(teamId, "Team ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }
        
        const membersList = await TeamMembership.find({teamId: teamId}).populate({path: "userId", select: "name email"});
        return res.status(200).json(membersList);
    }, "ADMIN_GET_TEAM_MEMBERS_ERROR");


export const getUserTeams = asyncHandler(
    async(req, res) => {
        const {userId} = req.query;
        
        // Validate user ID
        const idValidation = validateObjectId(userId, "User ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }
        
        const teamsList = await TeamMembership.find({userId: userId}).populate({path: "teamId", select: "teamName description"});
        return res.status(200).json(teamsList);
    }, "ADMIN_GET_USER_TEAMS_ERROR");

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
    }, "ADMIN_UPDATE_TEAM_MEMBER_ROLE_ERROR");
