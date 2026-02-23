import Organization from "#models/Organization.js";
import Team from "#models/Team.js";
import AdminOrg from "#models/Admin.Org.js";
import mongoose from "mongoose";
import pagination from "#helpers/pagination.js";

export const createTeam = asyncHandler(
    async(req, res) => {
        console.log(req.cookies);
        const {teamName, teamManagerId: managerId, description, teamLeaderId: leaderId, organizationId} = req.body;
        
        if(!teamName || !organizationId){
            return res.status(400).json({
                error : "Missing required fields"
            });
        }

        

        const teamExists = await Team.findOne({teamName, organizationId}) !== null ? true : false;

        if(teamExists) return res.status(400).json({
            error: "teamName already in use",
            filledDetails: req.body
        });
        
        const detailObject = {teamName, managerId : managerId || null, leaderId : leaderId || null, organizationId}

        if(description !== undefined && description !== null) detailObject.description = description;

        const addTeam = await Team.create(detailObject);

        detailObject.teamId = addTeam._id;

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

export const getTeamsPagination = asyncHandler(
    async(req, res) => {
        const {organizationId, page = 1, limit = 10, search = ""} = req.query;

        const adminId = req.userId;

        const thefilter = [];

        const orgList = []
        
        if(organizationId){
            
            orgList.push(new mongoose.Types.ObjectId(organizationId));
                
        
        } else {
            const orgs = await AdminOrg.find({adminId}).select("organizationId");
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
                    teamName: { $regex: search.trim(), $options: "i" }
                }
            })
        }

        console.log("checkpoint", thefilter)

        const results = await pagination(Team, page, limit, thefilter)

        return res.status(200).json({teamList: results.documents, totalRecords: results.totalRecords, totalPages: results.totalPages});
    }, "GET_TEAMS_PAGINATION_ERROR"
)

export const updateTeam = asyncHandler(
    async(req, res) => {
        const {teamId, ...updatableDetails} = req.body;
        if(!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({error: "Invalid teamId"});
        }

        const updater = await Team.findByIdAndUpdate(teamId ,updatableDetails, { new: true, runValidators: true });

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

