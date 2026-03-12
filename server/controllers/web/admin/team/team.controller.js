import Organization from "#models/Organization.js";
import User from "#models/User.js";
import Team from "#models/Team.js";
import AdminOrg from "#models/Admin.Org.js";
import mongoose from "mongoose";
import pagination from "#helpers/pagination.js";
import {
    validateObjectId,
    validateString,
    validateRequiredFields
} from "#utils/validators.js";

export const createTeam = asyncHandler(
async (req, res) => {

    const {
        teamName,
        teamManagerId: managerId,
        description,
        teamLeaderIds: leaderIds,
        organizationId
    } = req.body;

    // Validate required fields
    const requiredCheck = validateRequiredFields(
        { teamName, organizationId },
        ['teamName', 'organizationId']
    );

    if (!requiredCheck.valid) {
        return res.status(400).json({ error: requiredCheck.error });
    }

    // Validate team name
    const nameValidation = validateString(teamName, "Team name", {
        minLength: 2,
        maxLength: 100
    });

    if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.error });
    }

    // Validate organizationId
    const orgValidation = validateObjectId(organizationId, "Organization ID");

    if (!orgValidation.valid) {
        return res.status(400).json({ error: orgValidation.error });
    }

    // Validate managerId if provided
    if (managerId) {
        const managerValidation = validateObjectId(managerId, "Manager ID");

        if (!managerValidation.valid) {
            return res.status(400).json({ error: managerValidation.error });
        }
    }

    let cleanedLeaderIds = [];

    // Validate leaderIds if provided
    if (leaderIds) {

        if (!Array.isArray(leaderIds)) {
            return res.status(400).json({
                error: "teamLeaderIds must be an array"
            });
        }

        for (const leaderId of leaderIds) {
            const leaderValidation = validateObjectId(leaderId, "Leader ID");

            if (!leaderValidation.valid) {
                return res.status(400).json({ error: leaderValidation.error });
            }
        }

        // Remove duplicate leaderIds
        cleanedLeaderIds = [...new Set(leaderIds)];

        // Prevent manager being a leader
        if (managerId && cleanedLeaderIds.includes(managerId)) {
            return res.status(400).json({
                error: "Team manager cannot be added as a team leader"
            });
        }
    }

    // Check if team already exists in organization
    const teamExists = await Team.findOne({
        teamName,
        organizationId
    });

    if (teamExists) {
        return res.status(400).json({
            error: "Team name already exists in this organization",
            filledDetails: req.body
        });
    }

    const detailObject = {
        teamName,
        managerId: managerId || null,
        leaderIds: cleanedLeaderIds,
        organizationId
    };

    // Validate description
    if (description !== undefined && description !== null) {

        const descValidation = validateString(description, "Description", {
            maxLength: 500
        });

        if (!descValidation.valid) {
            return res.status(400).json({ error: descValidation.error });
        }

        detailObject.description = description;
    }

    // Create team
    const createdTeam = await Team.create(detailObject);

    return res.status(201).json({
        success: "Team added successfully",
        teamDetails: {
            ...detailObject,
            teamId: createdTeam._id
        }
    });

}, "ADMIN_CREATE_TEAM_ERROR");

export const getTeam = asyncHandler(
    async(req, res) => {
        const {id : teamId} = req.params;

        // Validate team ID
        const idValidation = validateObjectId(teamId, "Team ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }

        const finder = await Team.findById(teamId).populate({path: "managerId", select: "employeeId name email"}).populate({path: "leaderIds" , select: "employeeId name email"});

        console.log("jjm",finder)

        if(finder === null) return res.status(400).json({error: "Team does not exist with given id"});

        return res.status(200).json(finder);

    }, "ADMIN_GET_TEAM_ERROR");

export const getAllTeams =  asyncHandler(
    async(req, res) => {
        const {organizationId} = req.body;

        // Validate organization ID
        const idValidation = validateObjectId(organizationId, "Organization ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }

        const teamList = await Team.find({organizationId: organizationId}).populate({path: "managerId", select: "employeeId name email"}).populate({path: "leaderIds" , select: "employeeId name email"});

        return res.status(200).json(teamList);

    }, "ADMIN_GET_TEAMS_ERROR");

export const getTeamsPagination = asyncHandler(
    async(req, res) => {
        const {organizationId, page = 1, limit = 10, search = ""} = req.query;

        const adminId = req.user.userId;

        const thefilter = [];

        const orgList = []

        if(organizationId){

            orgList.push(new mongoose.Types.ObjectId(organizationId));


        } else {
            const orgs = await AdminOrg.find({primaryAdmin: adminId}).select("organizationId");
            orgList.push(...orgs.map(org => org.organizationId));
        }

        thefilter.push({
            $match: {
                organizationId: { $in: orgList.map(org => org) }
            }
        })

        if(search.trim() !== "") {
            thefilter.push({
                $match: {
                    teamName: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" }
                }
            })
        }

        // console.log("checkpoint", thefilter)

        const results = await pagination(Team, page, limit, thefilter)

        // console.log("checkpoint2", results.documents);


        // Replace managerId and leaderIds ObjectIds with employeeId
        const teamListWithEmployeeIds = await Promise.all(
            results.documents.map(async (team) => {
                let managerEmployeeId = null;
                if (team.managerId) {
                    const manager = await User.findById(team.managerId).select("employeeId");
                    managerEmployeeId = manager ? manager.employeeId : null;
                }
                let leaderEmployeeIds = [];
                if (Array.isArray(team.leaderIds) && team.leaderIds.length > 0) {
                    const leaders = await User.find({ _id: { $in: team.leaderIds } }).select("employeeId");
                    leaderEmployeeIds = leaders.map(l => l.employeeId);
                }
                return {
                    ...team,
                    managerId: managerEmployeeId,
                    leaderIds: leaderEmployeeIds
                };
            })
        );

        return res.status(200).json({teamList: teamListWithEmployeeIds, totalRecords: results.totalRecords, totalPages: results.totalPages});
    }, "GET_TEAMS_PAGINATION_ERROR");

export const updateTeam = asyncHandler(
    async(req, res) => {
        const {teamId, ...updatableDetails} = req.body;
        if(!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({error: "Invalid teamId"});
        }

        const updater = await Team.findByIdAndUpdate(teamId ,updatableDetails, { new: true, runValidators: true });

        return res.status(200).json({success: "Team Details updated.", updatedDetails: updater})

    }, "ADMIN_UPDATE_TEAM_ERROR");

export const deleteTeam = asyncHandler(
  async (req, res) => {
    const { data : teamIds } = req.body;

    // Check if array exists
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: "teamIds must be a non-empty array" });
    }

    // Validate all IDs
    for (const teamId of teamIds) {
      const idValidation = validateObjectId(teamId, "Team ID");
      if (!idValidation.valid) {
        return res.status(400).json({ error: idValidation.error });
      }
    }

    // Delete teams
    const result = await Team.deleteMany({
      _id: { $in: teamIds }
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({ error: "Deletion failed, Teams don't exist" });
    }

    return res.status(200).json({
      success: `${result.deletedCount} team(s) deleted`
    });
  },
  "ADMIN_DELETE_TEAM_ERROR"
);