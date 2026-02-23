import mongoose from 'mongoose';
import Organization from '#models/Organization.js';
import OrgAdmin from '#models/Admin.Org.js';
import Admin from '#models/Admin.js'
import Pagination from "#helpers/pagination.js";
import AdminOrg from "#models/Admin.Org.js";

const existingOrganizationOfAdminWithSameName = async (userId , organizationName)=>{
    let existingOrg = await OrgAdmin.find({
        primaryAdmin : userId
    }).populate({
        path : "organizationId",
        match : { name : organizationName }
    }).lean()
    return existingOrg.filter(
        doc => doc.organizationId !== null
    );
}

const addOrganization = asyncHandler( async (req,res)=>{
    console.log("entered")
    let { name } = req.body;
    let { userId } =  req.user;
    userId = new mongoose.Types.ObjectId(userId);
    let adminOrganisationsWithSameName =await existingOrganizationOfAdminWithSameName(userId,name)
    if(adminOrganisationsWithSameName.length) {
        return res.status(409).json({ "error" : "Organization already exits" });
    }
    const newOrganization =  await Organization.create(req.body);

    let check = await OrgAdmin.create({
        organizationId : newOrganization._id,
        primaryAdmin : userId
    })
    console.log(check)
    return res.status(201).json(newOrganization);
}, "ADMIN_ADD_ORG_ERROR" );

const getOrganizationsOfAdmin = asyncHandler(async (req , res) => {

    let { userId } = req.user;
    userId = new mongoose.Types.ObjectId(userId);

    let existingAdmin = await Admin.findById(userId);
    if (!existingAdmin) {
        return res.status(404).json({
            error: "Admin Doesn't Exist"
        });
    }

    let { search = "", page = 1 ,limit = 10 } = req.query;

    search = search.trim();
    page = Number(page);

    const skip = (page - 1) * limit;

    const filter = [
        {
            $match: { primaryAdmin: userId }
        },
        {
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        },
        { $unwind: "$organization" },
        {
            $match: {
                "organization.name": {
                    $regex: search,
                    $options: "i"
                }
            }
        },
        { $sort: { "organization.name": 1 } },
    ];
    
    const pagination = await Pagination(AdminOrg,page,limit,filter);

    const adminOrganisations = pagination.documents
    
    const organizations = []
    adminOrganisations.forEach(item => (
        organizations.push(item.organization)
    ));

    console.log(toString(organizations))
    
    return res.status(200).json({
        totalRecords: pagination.totalRecords,
        totalPages: pagination.totalPages,
        organizations
    });

}, "ADMIN_GET_ORG_ERROR");


const updateOrganization = asyncHandler(async (req,res)=>{
    const updateOrganizationTo = req.body;
    let existingOrganization = await Organization.findById(updateOrganizationTo._id);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    return res.status(200).json( await Organization.findByIdAndUpdate(
        updateOrganizationTo._id,
        updateOrganizationTo,
        {new : true}
    ).lean());
}, "ADMIN_UPDATE_ORG_ERROR");

const getOrganizationById = asyncHandler( async (req,res)=>{
    let { organizationId } = req.body;
    organizationId = new mongoose.Types.ObjectId(organizationId)
    let existingOrganization = await Organization.findById(organizationId);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    return res.status(200).json(existingOrganization)
});

const deleteOrganization = asyncHandler(async (req,res)=>{
    let { organizationId , passKey } = req.body;
    organizationId = new mongoose.Types.ObjectId(organizationId)
    let existingOrganization = await Organization.findById(organizationId);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    if(passKey != existingOrganization.passKey) {
        return res.status(401).json({error : "Incorrect Passkey"});
    }
    await OrgAdmin.findOneAndDelete({organizationId: organizationId});
    return res.status(200).json(await Organization.findByIdAndDelete(
        organizationId
    ).lean());
}, "ADMIN_DELETE_ORG_ERROR");

const getOrganizationIDsOfAdmin = asyncHandler(async (req,res)=>{
    let { userId } = req.user;
    userId = new mongoose.Types.ObjectId(userId);
    let existingAdmin = await Admin.findById(userId);
    if (!existingAdmin) {
        return res.status(404).json({
            error: "Admin Doesn't Exist"
        });
    }
    let organizationIds = await OrgAdmin.find({primaryAdmin : userId}).populate({path: "organizationId", select: "_id name"}).lean();
    organizationIds = organizationIds.map(doc => ({organizationId: doc.organizationId._id, name: doc.organizationId.name}));
    return res.status(200).json(organizationIds);
}, "ADMIN_GET_ORG_IDS_ERROR");


export {
    addOrganization,
    updateOrganization,
    getOrganizationById,
    getOrganizationsOfAdmin,
    deleteOrganization,
    getOrganizationIDsOfAdmin
}
