import organizationController from "#webControllers/admin/organization/controller.js";
import express from "express"
const Router = express.Router()

Router.get('/get-organization-by-id',organizationController.getOrganizationById);
Router.post('/add-organizaton',organizationController.addOrganization);
Router.put('/update-organization',organizationController.updateOrganization);
Router.delete('/delete-organization',organizationController.deleteOrganization);

export default Router ;
