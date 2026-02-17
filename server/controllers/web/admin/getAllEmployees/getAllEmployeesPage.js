import User from "#models/User.js";
import AdminOrg from "#models/Admin.Org.js";
import Team from "#models/Team.js";

const getAllEmployeesPage = asyncHandler(async (req, res) => {
    console.log("you are in getAllEmployeesPage");
    const adminId = req.user;
    const limit = 10;

    const employees = await User.find()
        .sort({ employeeId: 1 })
        .limit(limit);

    const totalRecords = await User.countDocuments();

    const adminOrgs = await AdminOrg.aggregate([
        {
            $match: { adminId: adminId }
        },
        {
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        },
        {
            $unwind: "$organization"
        },
        {
            $project: {
                organizationId: "$organization._id",
                organizationName: "$organization.name"
            }
        }
    ]);

    const orgInfo = [];

    for (const org of adminOrgs) {

        const teams = await Team.find({
            organizationId: org.organizationId
        }).select("_id teamName")
            .sort({ teamName: 1 })
            .lean();

        orgInfo.push({
            organizationId: org.organizationId,
            organizationName: org.organizationName,
            teams: formattedTeams
        });
    }

    res.status(200).json({
        orgInfo,
        records: {
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords,
            data: employees
        }
    });

}, "GET_ALL_EMPLOYEES_CONTROLLER");

export default getAllEmployeesPage;