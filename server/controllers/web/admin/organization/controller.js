import mongoose from 'mongoose';
import Organisation from '#models/Organisation.js';
import OrgAdmin from '#models/Admin.Org.js';
import Admin from '#models/Admin.js'

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
    let { name } = req.body;
    let { userId } =  req.user;
    userId = new mongoose.Types.ObjectId(userId);
    let adminOrganisationsWithSameName =await existingOrganizationOfAdminWithSameName(userId,name)
    if(adminOrganisationsWithSameName.length) {
        return res.status(409).json({ "error" : "Organization already exits" });
    }
    const newOrganization =  await Organisation.create(req.body);

    await OrgAdmin.create({
        organizationId : newOrganization._id,
        primaryAdmin : userId
    })

    return res.status(201).json(newOrganization);
}, "ADMIN_ADD_ORG_ERROR" );

const getOrganizationsOfAdmin = asyncHandler(async (req , res)=>{
    let { userId } = req.user;
    userId = new mongoose.Types.ObjectId(userId);
    let existingAdmin = await Admin.findById(userId)
    if(!existingAdmin) {
        return res.status(404).json({
            error : "Admin Doesn't Exists"
        })
    }
    const adminOrganisations = await OrgAdmin.find({
        primaryAdmin : userId
    }).populate({
        path: "organizationId",
    })
    return res.status(200).json(adminOrganisations)
}, "ADMIN_GET_ORG_ERROR" );

const updateOrganization = asyncHandler(async (req,res)=>{
    const updateOrganizationTo = req.body;
    let existingOrganization = await Organisation.findById(updateOrganizationTo._id);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    return res.status(200).json( await Organisation.findByIdAndUpdate(
        updateOrganizationTo._id,
        updateOrganizationTo,
        {new : true}
    ).lean());
}, "ADMIN_UPDATE_ORG_ERROR");

const getOrganizationById = asyncHandler( async (req,res)=>{
    let { organizationId } = req.body;
    organizationId = new mongoose.Types.ObjectId(organizationId)
    let existingOrganization = await Organisation.findById(organizationId);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    return res.status(200).json(existingOrganization) 
});

const deleteOrganization = asyncHandler(async (req,res)=>{
    let { organizationId , passKey } = req.body;
    organizationId = new mongoose.Types.ObjectId(organizationId)
    let existingOrganization = await Organisation.findById(organizationId);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    if(passKey != existingOrganization.passKey) {
        return res.status(401).json({error : "Incorrect Passkey"});
    }
    return res.status(200).json(await Organisation.findByIdAndDelete(
        organizationId
    ).lean());
}, "ADMIN_DELETE_ORG_ERROR");

//COMPLETE GET ALL ORGANISATIONS OF AN ADMIN

export {
    addOrganization,
    updateOrganization,
    getOrganizationById,
    getOrganizationsOfAdmin,
    deleteOrganization
}