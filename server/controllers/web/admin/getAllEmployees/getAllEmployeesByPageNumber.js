import User from "#models/User.js"
const getAllEmployeesByPageNumber = asyncHandler( async (req, res) => {

    let { organizationId, teamId, page = 1 } = req.body;
    page = Number(page);
    const limit = 10;
    const skip = (page - 1) * limit;

    const employees = await User
        .find({ organizationId, teamId})
        .sort({ employeeId: 1 })
        .skip(skip)
        .limit(limit);

    const totalRecords = employees.length

    res.status(200).json({
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        data: employees
    });

}, "GET_ALL_EMPLOYEES_BY_PAGE_NUMBER_CONTROLLER");

export default getAllEmployeesByPageNumber;