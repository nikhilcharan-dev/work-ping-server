import User from "#models/User.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import {
    validateObjectId,
    validateString
} from "#utils/validators.js";
import OrgAdmin from "#models/Admin.Org.js";

const getAllEmployeesByPageNumber = asyncHandler(
  async (req, res) => {
    
    let { search = "", organizationId, teamId, page = 1, limit } = req.query;
    
    // Validate search string length
    if (search !== "") {
      const searchValidation = validateString(search, "Search", {
        maxLength: 100
      });
      if (!searchValidation.valid) {
        return errorResponse(res, searchValidation.error);
      }
    }
    
    // Validate organization ID if provided
    if (organizationId) {
      const orgIdValidation = validateObjectId(organizationId, "Organization ID");
      if (!orgIdValidation.valid) {
        return errorResponse(res, orgIdValidation.error);
      }
    }
    
    // Validate team ID if provided
    if (teamId) {
      const teamIdValidation = validateObjectId(teamId, "Team ID");
      if (!teamIdValidation.valid) {
        return errorResponse(res, teamIdValidation.error);
      }
    }

    search = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let filter = [];

    if (search) {
      filter.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    if (organizationId) {
      filter.push({
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId)
        }
      });
    }
    else {
      console.log("user id ", req.user)
      const orgAdmins = await OrgAdmin.find(
        { primaryAdmin: new mongoose.Types.ObjectId(req.user.userId) },
        { organizationId: 1 }
      );

      const organizationIds = orgAdmins.map(org => org.organizationId);

      console.log("org" , organizationIds);

      filter.push({
        $match: {
          organizationId: { $in: organizationIds }
        }
      });

    }

    if(teamId){
      
      if (teamId!="none") {
        filter.push({
          $match: {
            teamId: new mongoose.Types.ObjectId(teamId)
          }
        });
      }
      else {
        filter.push({
          $match: {
            teamId: null
          }
        });
      }
    }

    // Lookup organization name
    filter.push({
      $lookup: {
        from: "organizations",
        localField: "organizationId",
        foreignField: "_id",
        as: "organization"
      }
    });
    filter.push({
      $unwind: { path: "$organization", preserveNullAndEmptyArrays: true }
    });

    // Lookup team/department name
    filter.push({
      $lookup: {
        from: "teams",
        localField: "teamId",
        foreignField: "_id",
        as: "team"
      }
    });
    filter.push({
      $unwind: { path: "$team", preserveNullAndEmptyArrays: true }
    });

    // Lookup govt proof (PAN, Aadhaar, passport, bank)
    filter.push({
      $lookup: {
        from: "govtproofs",
        localField: "_id",
        foreignField: "userId",
        as: "govtProof"
      }
    });
    filter.push({
      $unwind: { path: "$govtProof", preserveNullAndEmptyArrays: true }
    });

    // Lookup projects the employee belongs to
    filter.push({
      $lookup: {
        from: "projectmembers",
        localField: "_id",
        foreignField: "userId",
        as: "projectMemberships"
      }
    });
    filter.push({
      $lookup: {
        from: "projects",
        localField: "projectMemberships.projectId",
        foreignField: "_id",
        as: "assignedProjects"
      }
    });

    // Project fields: replace organizationId with organizationName, add department & govt proof fields
    filter.push({
      $addFields: {
        organizationName: { $ifNull: ["$organization.name", null] },
        departmentName: { $ifNull: ["$team.teamName", null] },
        projects: { $ifNull: ["$assignedProjects.name", []] },
        aadhaarNumber: { $ifNull: ["$govtProof.aadhaarNumber", null] },
        panNumber: { $ifNull: ["$govtProof.panNumber", null] },
        passportNumber: { $ifNull: ["$govtProof.passportNumber", null] },
        bankAccount: { $ifNull: ["$govtProof.bankAccount", null] },
        dateOfJoining: { $dateToString: { format: "%Y-%m-%d", date: "$dateOfJoining" } },
        dob: { $cond: { if: "$dob", then: { $dateToString: { format: "%Y-%m-%d", date: "$dob" } }, else: null } }
      }
    });
    filter.push({
      $project: {
        organization: 0,
        team: 0,
        govtProof: 0
      }
    });

    const pagination = await Pagination(User, page, limit, filter);

    console.log("pagination result ", pagination.documents[0]);

    return successResponse(res, "Employees fetched", {
      totalPages: pagination.totalPages,
      totalRecords: pagination.totalRecords,
      data: pagination.documents
    });
  },
  "GET_ALL_EMPLOYEES_BY_PAGE_NUMBER_CONTROLLER"
);

export default getAllEmployeesByPageNumber;