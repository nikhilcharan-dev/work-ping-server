import User from "#models/User.js";

const getAllEmployeesByPageNumber = asyncHandler(
  async (req, res) => {

    let { search = "", organizationId, teamId, page = 1 } = req.query;

    page = Number(page);
    const limit = 10;
    const skip = (page - 1) * limit;

    search = search.trim(); 

    const filter = {};

    if (organizationId) {
      filter.organizationId = organizationId;
    }

    if (teamId) {
      filter.teamId = teamId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    console.log(filter);

    const totalRecords = await User.countDocuments(filter);

    const employees = await User
      .find(filter)
      .sort({ employeeId: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      currentPage: page,
      data: employees
    });

  },
  "GET_ALL_EMPLOYEES_BY_PAGE_NUMBER_CONTROLLER"
);

export default getAllEmployeesByPageNumber;
