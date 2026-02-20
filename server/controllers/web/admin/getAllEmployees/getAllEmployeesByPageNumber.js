import User from "#models/User.js";
import Pagination from "#helpers/pagination.js";
const getAllEmployeesByPageNumber = asyncHandler(
  async (req, res) => {

    let { search = "", organizationId, teamId, page = 1 ,limit } = req.query;

    let filter = []

    if (organizationId) {
        filter.push(
            {
                $match : { organizationId : { $eq: { organizationId } } }
            }
        )
    }

    if (teamId) {
        filter.push(
            {
                $match : { teamId : { $eq: { teamId } } }
            }
        )
    }

    console.log(filter);

    const pagination = await Pagination.call(User,search ,page, limit, filter);

    const totalRecords = pagination.totalRecords
    const totalPages = pagination.totalPages
    const employees = pagination.documents

    res.status(200).json({
      totalPages,
      totalRecords,
      data: employees
    });

  },
  "GET_ALL_EMPLOYEES_BY_PAGE_NUMBER_CONTROLLER"
);

export default getAllEmployeesByPageNumber;
