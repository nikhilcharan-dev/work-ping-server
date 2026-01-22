import Organisation from '#models/Organisation.js';
import OrgAdmin from '#models/Admin.Org.js';
import Admin from '#models/Admin.js'


const existingOrganizationOfAdminWithSameName = async (adminId , organizationName)=>{
    return await OrgAdmin.findById({
        adminId
    }).populate({
        path : "organizationId",
        match : { name : organizationName }
    }).lean()
}

const addOrganization = asycHandler( async (req,res)=>{
    const { name , type , clDays , description , ipWhitelist , foundedAt , geoFencing} = req.body;
    const {adminId} =  req.user;
    
    if(existingOrganizationOfAdminWithSameName) {
        return res.status(409).json({ "error" : "Organization already exits" });
    }

    const newOrganization =  await Organisation.create({
        name: name,
        type: type,
        clDays: clDays,
        description: description,
        ipWhitelist: ipWhitelist,
        foundedAt: foundedAt,
        geoFencing:  geoFencing
    })

    await OrgAdmin.create({
        organizationId : newOrganization._id,
        primaryAdmin : adminId
    })

    return res.status(201).json(newOrganization);
});

const getOrganizationById = asycHandler(async (req , res)=>{
    const adminId = req.user;
    const existingAdmin = await Admin.findOneById(adminId)
    if(!existingAdmin) {
        return res.status(404).json({
            error : "Admin Doesn't Exists"
        })
    }
    const adminOrganisations = await OrgAdmin.findByid({
        adminId
    }).populate({
        path: "organizationId",
    })
    return res.status(200).json(adminOrganisations)
});

const updateOrganizaton = asyncHandler(async (req,res)=>{
    let updateOrganizatonTo = req.body;
    let existingOrganization = await Organisation.findOneById(updateOrganizatonTo._id);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    return res.status(200).json( await User.findByIdAndUpdate(
        updateOrganizationTo._id,
        updateOrganizationTo,
        {new : true}
    ).lean());
});

const deleteOrganizaton = asyncHandler(async (req,res)=>{
    let { organizationId , passKey } = req.body;
    let existingOrganization = await Organisation.findOneById(organizationId);
    if(!existingOrganization) {
        return res.status(404).json({error: "Organizaton Doesn't Exists"});
    }
    if(passKey != existingOrganization.passKey) {
        return res.status(401).json({error : "Incorrect Passkey"});
    }
    return res.status(200).json(await User.findByIdAndDelete(
        organizationId
    ).lean());
});

export default {
    addOrganization,
    updateOrganizaton,
    getOrganizationById,
    deleteOrganizaton
}