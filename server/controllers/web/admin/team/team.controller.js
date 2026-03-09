import Organization from "#models/Organization.js";
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
    async(req, res) => {
        console.log(req.cookies);
        const {teamName, teamManagerId: managerId, description, teamLeaderIds: leaderIds, organizationId} = req.body;

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
        
        // Validate organization ID
        const orgIdValidation = validateObjectId(organizationId, "Organization ID");
        if (!orgIdValidation.valid) {
            return res.status(400).json({ error: orgIdValidation.error });
        }
        
        // Validate manager ID if provided
        if (managerId) {
            const managerIdValidation = validateObjectId(managerId, "Manager ID");
            if (!managerIdValidation.valid) {
                return res.status(400).json({ error: managerIdValidation.error });
            }
        }

        const teamExists = await Team.findOne({teamName, organizationId}) !== null ? true : false;

        if(teamExists) return res.status(400).json({
            error: "teamName already in use",
            filledDetails: req.body
        });

        const detailObject = {teamName, managerId : managerId || null, leaderIds : leaderIds || [], organizationId}

        if(description !== undefined && description !== null) {
            const descValidation = validateString(description, "Description", {
                maxLength: 500
            });
            if (!descValidation.valid) {
                return res.status(400).json({ error: descValidation.error });
            }
            detailObject.description = description;
        }

        const addTeam = await Team.create(detailObject);

        detailObject.teamId = addTeam._id;

        return res.status(200).json({
            success: "Team added successfully",
            teamDetails: detailObject
        })

    }, "ADMIN_CREATE_TEAM_ERROR");

export const getTeam = asyncHandler(
    async(req, res) => {
        const {id : teamId} = req.params;

        // Validate team ID
        const idValidation = validateObjectId(teamId, "Team ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }

        const finder = await Team.findById(teamId).populate({path: "managerId", select: "name email"}).populate({path: "leaderIds" , select: "name email"});

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

        const teamList = await Team.find({organizationId: organizationId}).populate({path: "managerId", select: "name email"}).populate({path: "leaderIds" , select: "name email"});

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

        console.log("checkpoint", thefilter)

        const results = await pagination(Team, page, limit, thefilter)

        return res.status(200).json({teamList: results.documents, totalRecords: results.totalRecords, totalPages: results.totalPages});
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
    async(req, res) => {
        const {teamId} = req.body;
        
        // Validate team ID
        const idValidation = validateObjectId(teamId, "Team ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }

        // Cache the team for 30 days

        const deleter = await Team.findByIdAndDelete(teamId);

        if(deleter === null) return res.status(400).json({error: "Deletion failed, Team doesn't exist"});

        return res.status(200).json({success: "Team Deleted"});

    }, "ADMIN_DELETE_TEAM_ERROR");
