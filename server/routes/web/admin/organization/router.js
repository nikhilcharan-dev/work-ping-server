import {getOrganizationById,addOrganization,updateOrganization,deleteOrganization, getOrganizationsOfAdmin} from "#webController/admin/organization/controller.js" 
import express from "express"
const Router = express.Router()

Router.get('/get-organizations',getOrganizationsOfAdmin)
Router.get('/get-organization-by-id',getOrganizationById);
Router.post('/add-organization',addOrganization);
Router.post('/update-organization',updateOrganization);
Router.delete('/delete-organization',deleteOrganization);

export default Router ;
