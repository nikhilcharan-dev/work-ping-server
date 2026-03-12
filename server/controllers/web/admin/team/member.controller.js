import TeamMembership from "#models/TeamMembership.js";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import {
    validateObjectId,
    validateRequiredFields,
    validateEnum
} from "#utils/validators.js";


export const addTeamMemberToTeam = asyncHandler(
  async (req, res) => {
    const { userIds, teamId, organizationId, roleInTeam } = req.body;

    const requiredCheck = validateRequiredFields(
      { userIds, teamId, organizationId },
      ["userIds", "teamId", "organizationId"]
    );
    if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse(res, "userIds must be a non-empty array");
    }

    const teamIdValidation = validateObjectId(teamId, "Team ID");
    if (!teamIdValidation.valid) return errorResponse(res, teamIdValidation.error);

    const orgIdValidation = validateObjectId(organizationId, "Organization ID");
    if (!orgIdValidation.valid) return errorResponse(res, orgIdValidation.error);

    if (roleInTeam) {
      const roleValidation = validateEnum(
        roleInTeam,
        ["manager", "teamLead", "member"],
        "Role in team"
      );
      if (!roleValidation.valid) return errorResponse(res, roleValidation.error);
    }

    for (const userId of userIds) {
      const userIdValidation = validateObjectId(userId, "User ID");
      if (!userIdValidation.valid) return errorResponse(res, userIdValidation.error);
    }

    const existingMemberships = await TeamMembership.find({
      userId: { $in: userIds },
      teamId,
      organizationId
    }).select("userId");

    const existingUserIds = existingMemberships.map(m => m.userId.toString());
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return errorResponse(res, "All users are already members of the team");
    }

    const insertObjects = newUserIds.map(userId => ({
      userId,
      teamId,
      organizationId,
      ...(roleInTeam && { roleInTeam })
    }));

    const memberships = await TeamMembership.insertMany(insertObjects);

    return successResponse(res, "Users added to team successfully", {
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
      return errorResponse(res, "membershipIds must be a non-empty array");
    }

    for (const membershipId of membershipIds) {
      const idValidation = validateObjectId(membershipId, "Membership ID");
      if (!idValidation.valid) return errorResponse(res, idValidation.error);
    }

    const result = await TeamMembership.deleteMany({
      _id: { $in: membershipIds }
    });

    if (result.deletedCount === 0) return errorResponse(res, "No memberships found with given ids", 404);

    return successResponse(res, "Users removed from team successfully", { removedCount: result.deletedCount });
  },
  "ADMIN_REMOVE_TEAM_MEMBER_ERROR"
);

export const getTeamMembers = asyncHandler(
    async (req, res) => {
        const { teamId } = req.query;

        const idValidation = validateObjectId(teamId, "Team ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const membersList = await TeamMembership.aggregate([
            { $match: { teamId: new mongoose.Types.ObjectId(teamId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1, email: 1 } }],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }
        ]);

        return successResponse(res, "Team members fetched", membersList);
    }, "ADMIN_GET_TEAM_MEMBERS_ERROR");

export const getUserTeams = asyncHandler(
    async (req, res) => {
        const { userId } = req.query;

        const idValidation = validateObjectId(userId, "User ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const teamsList = await TeamMembership.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "teams",
                    localField: "teamId",
                    foreignField: "_id",
                    pipeline: [{ $project: { teamName: 1, description: 1 } }],
                    as: "team"
                }
            },
            { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } }
        ]);

        return successResponse(res, "User teams fetched", teamsList);
    }, "ADMIN_GET_USER_TEAMS_ERROR");

export const updateTeamMemberRole = asyncHandler(
    async (req, res) => {
        const { membershipId, roleInTeam } = req.body;

        const idValidation = validateObjectId(membershipId, "Membership ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const roleValidation = validateEnum(
            roleInTeam,
            ["manager", "teamLead", "member"],
            "Role in team"
        );
        if (!roleValidation.valid) return errorResponse(res, roleValidation.error);

        const updatedMembership = await TeamMembership.findByIdAndUpdate(
            membershipId,
            { roleInTeam },
            { new: true, runValidators: true }
        );
        if (!updatedMembership) return errorResponse(res, "No team membership found with given id", 404);

        return successResponse(res, "Team member's role updated successfully", updatedMembership);
    }, "ADMIN_UPDATE_TEAM_MEMBER_ROLE_ERROR");
