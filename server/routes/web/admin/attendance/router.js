import express from "express";
import {
    getAttendanceSummary,
    getAttendanceByOrganizationId,
    getAttendanceByTeamId,
} from "#webController/admin/attendance/controller.js";

const Router = express.Router();

Router.get("/summary", getAttendanceSummary);
Router.post("/by-organization", getAttendanceByOrganizationId);
Router.post("/by-team", getAttendanceByTeamId);

export default Router;
