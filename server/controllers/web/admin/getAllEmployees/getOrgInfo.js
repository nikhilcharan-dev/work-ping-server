import AdminOrg from "#models/Admin.Org.js";
import Team from "#models/Team.js";

const getOrgInfo = asyncHandler(async (req, res) => {
    console.log("you are in getOrgInfo");

    const adminId = req.user;

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

    res.status(200).json(orgInfo);

}, "GET_ORG_INFO");

export default getOrgInfo;