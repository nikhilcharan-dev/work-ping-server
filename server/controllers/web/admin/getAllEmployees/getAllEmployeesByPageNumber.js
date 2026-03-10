import User from "#models/User.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";
import {
    validateObjectId,
    validateString
} from "#utils/validators.js";

const getAllEmployeesByPageNumber = asyncHandler(
  async (req, res) => {

    let { search = "", organizationId, teamId, page = 1, limit } = req.query;

    // Validate search string length
    if (search !== "") {
      const searchValidation = validateString(search, "Search", {
        maxLength: 100
      });
      if (!searchValidation.valid) {
        return res.status(400).json({ error: searchValidation.error });
      }
    }
    
    // Validate organization ID if provided
    if (organizationId) {
      const orgIdValidation = validateObjectId(organizationId, "Organization ID");
      if (!orgIdValidation.valid) {
        return res.status(400).json({ error: orgIdValidation.error });
      }
    }
    
    // Validate team ID if provided
    if (teamId) {
      const teamIdValidation = validateObjectId(teamId, "Team ID");
      if (!teamIdValidation.valid) {
        return res.status(400).json({ error: teamIdValidation.error });
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

    const pagination = await Pagination(User, page, limit, filter);

    res.status(200).json({
      totalPages: pagination.totalPages,
      totalRecords: pagination.totalRecords,
      data: pagination.documents
    });
  },
  "GET_ALL_EMPLOYEES_BY_PAGE_NUMBER_CONTROLLER"
);

export default getAllEmployeesByPageNumber;