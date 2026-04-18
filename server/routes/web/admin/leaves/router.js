import express from "express";
import { getAllLeaves, approveLeave, rejectLeave, getPendingCount } from "#webController/admin/leaves/controller.js";

const Router = express.Router();

Router.get("/pending-count", getPendingCount);
Router.get("/all", getAllLeaves);
Router.post("/approve/:leaveId", approveLeave);
Router.post("/reject/:leaveId", rejectLeave);

export default Router;
