import {getOrganizationById,addOrganization,updateOrganization,deleteOrganization, getOrganizationsOfAdmin, getOrganizationIDsOfAdmin} from "#webController/admin/organization/controller.js" 
import express from "express"
const Router = express.Router()

Router.get('/get-organizations',getOrganizationsOfAdmin)
Router.post('/get-organization-by-id',getOrganizationById);
Router.get('/get-all-organization-ids',getOrganizationIDsOfAdmin);
Router.post('/add-organization',addOrganization);
Router.post('/update-organization',updateOrganization);
Router.post('/delete-organizations',deleteOrganization);


export default Router ;
