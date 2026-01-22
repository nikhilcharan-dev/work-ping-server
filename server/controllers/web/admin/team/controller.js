import Team from "#models/Teams.js";
import mongoose from "mongoose";

export const createTeam = asyncHandler(
    async(req, res) => {
        const {teamName, teamManagerId: managerId, description, teamLeaderId: leaderId, organizationId} = req.body;
        
        if(!teamName || !managerId || !leaderId || !organizationId){
            return res.status(400).json({
                error : "Missing required fields"
            });
        }

        const teamExists = await Team.findOne({teamName}) !== null ? true : false;

        if(teamExists) return res.status(400).json({
            error: "teamName already in use",
            filledDetails: req.body
        });
        
        const detailObject = {teamName, managerId, leaderId, organizationId}

        if(description !== null) detailObject.description = description;

        const addTeam = await Team.insertOne(detailObject);
        detailObject.teamId = addTeam.insertedId;

        return res.status(200).json({
            success: "Team added successfully",
            teamDetails: detailObject
        })

    }, "ADMIN_CREATE_TEAM_ERROR"
);

export const getTeam = asyncHandler(
    async(req, res) => {
        const {teamId} = req.body;

        if(!teamId) return res.status(400).json({error: "Invalid Request : teamId required"});
        
        const finder = await Team.findById(teamId).populate({path: "managerId", select: "name email"}).populate({path: "leaderId" , select: "name email"});

        if(finder === null) return res.status(400).json({error: "Team does not exist with given id"}); 

        return res.status(200).json(finder);
        
    }
);

export const getAllTeams =  asyncHandler(
    async(req, res) => {
        const {organizationId} = req.body;

        if(!organizationId) return res.status(400).json({error: "Invalid Request : organizationId required"})
        
        const teamList = await Team.find({organizationId: organizationId}).populate({path: "managerId", select: "name email"}).populate({path: "leaderId" , select: "name email"});

        return res.status(200).json(teamList);

    }, "ADMIN_GET_TEAMS_ERROR"
);

export const updateTeam = asyncHandler(
    async(req, res) => {
        const updatableDetails = req.body;

        const updater = await Team.findByIdAndUpdate(updatableDetails.teamId ,updatableDetails, { new: true, runValidators: true });

        return res.status(200).json({success: "Team Details updated.", updatedDetails: updater})
                
    }, "ADMIN_UPDATE_TEAM_ERROR"
)

export const deleteTeam = asyncHandler(
    async(req, res) => {
        const {teamId} = req.body;
        if(!teamId) return res.status(400).json({error: "Invalid Request : teamId required"})

        // Cache the team for 30 days

        const deleter = await Team.findByIdAndDelete(teamId);

        if(deleter === null) return res.status(400).json({error: "Deletion failed, Team doesn't exist"});

        return res.status(200).json({success: "Team Deleted"});

    }, "ADMIN_DELETE_TEAM_ERROR"
)

