import AdminOrg from "#models/Admin.Org.js";
import Team from "#models/Team.js";
import mongoose from "mongoose";

const getOrganizationInfo = asyncHandler(async (req, res) => {
    console.log("you are in getOrgInfo");

    const adminId = new mongoose.Types.ObjectId(req.user.userId);

    const adminOrgs = await AdminOrg.aggregate([
        {
            $match: { primaryAdmin: adminId }
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

    const organizationInfo = {};

    for (const org of adminOrgs) {

        const teams = await Team.find({
            organizationId: org.organizationId
        }).select("_id teamName")
            .sort({ teamName: 1 })
            .lean();

        organizationInfo[org.organizationName]={
            organizationId: org.organizationId,
            teams
        }
    }

    res.status(200).json(organizationInfo);

}, "ADMIN_GET_ORG_INFO_ERROR");

export default getOrganizationInfo;
