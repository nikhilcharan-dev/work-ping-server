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
      userId: { $in: userIds }
    });

    const membershipsToInsert = [];
    const membershipsToUpdate = [];
    const failedInsertions = [];

    for (const userId of userIds) {
      const userMemberships = existingMemberships.filter(m => m.userId.toString() === userId.toString());
      
      const inOtherTeam = userMemberships.some(m => m.teamId.toString() !== teamId.toString());
      const inCurrentTeam = userMemberships.find(m => m.teamId.toString() === teamId.toString());

      if (inCurrentTeam) {
        if (roleInTeam && inCurrentTeam.roleInTeam !== roleInTeam) {
            membershipsToUpdate.push({
                membershipId: inCurrentTeam._id,
                roleInTeam
            });
        }
      } else if (inOtherTeam) {
        failedInsertions.push({
            id: userId.toString(),
            error: "User is already assigned to another team"
        });
      } else {
        membershipsToInsert.push({
          userId,
          teamId,
          organizationId,
          ...(roleInTeam && { roleInTeam })
        });
      }
    }

    let insertedMemberships = [];
    if (membershipsToInsert.length > 0) {
      insertedMemberships = await TeamMembership.insertMany(membershipsToInsert);
    }
    
    for (const update of membershipsToUpdate) {
      await TeamMembership.findByIdAndUpdate(update.membershipId, { roleInTeam: update.roleInTeam });
    }

    const successCount = membershipsToInsert.length + membershipsToUpdate.length;
    const failedCount = failedInsertions.length;

    return successResponse(res, "Team members processed successfully", {
      successCount,
      failedCount,
      addedCount: membershipsToInsert.length,
      updatedCount: membershipsToUpdate.length,
      membershipIds: insertedMemberships.map(m => m._id),
      failedInsertions
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
        console.log(membersList)
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
