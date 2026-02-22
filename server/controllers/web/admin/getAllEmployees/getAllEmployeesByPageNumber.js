import User from "#models/User.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";

const getAllEmployeesByPageNumber = asyncHandler(
  async (req, res) => {

    let { search = "", organizationId, teamId, page = 1, limit = 10 } = req.query;

    search = search.trim();

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

    if (teamId) {
      filter.push({
        $match: {
          teamId: new mongoose.Types.ObjectId(teamId)
        }
      });
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