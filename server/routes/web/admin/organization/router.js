import {getOrganizationById,addOrganization,updateOrganization,deleteOrganization, getOrganizationsOfAdmin, getOrganizationIDsOfAdmin} from "#webController/admin/organization/controller.js" 
import express from "express"
const Router = express.Router()

Router.get("/", getOrganizationsOfAdmin);
Router.get('/get-organizations',getOrganizationsOfAdmin)
Router.get('/get-organization-by-id/:id',getOrganizationById);
Router.get('/get-all-organization-ids',getOrganizationIDsOfAdmin);
Router.post('/add-organization',addOrganization);
Router.post('/update-organization',updateOrganization);
Router.post('/delete-organizations',deleteOrganization);


export default Router ;
