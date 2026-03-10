import express from "express";
import Attendance from "#models/Attendance.js";
import Organization from "#models/Organization.js";
import User from "#models/User.js";
import Team from "#models/Team.js"
import {
    validateObjectId,
    validateDate,
    validateRequiredFields
} from "#utils/validators.js";

const getAttendanceByUserId = asyncHandler(
  async (req, res) => {
    // console.log("request reached");

    const { userId, date } = req.body;
    
    // Validate required fields
    const requiredCheck = validateRequiredFields(
        { userId, date },
        ['userId', 'date']
    );
    if (!requiredCheck.valid) {
        return res.status(400).json({ error: requiredCheck.error });
    }
    
    // Validate user ID
    const userIdValidation = validateObjectId(userId, "User ID");
    if (!userIdValidation.valid) {
        return res.status(400).json({ error: userIdValidation.error });
    }
    
    // Validate date
    const dateValidation = validateDate(date, "Date");
    if (!dateValidation.valid) {
        return res.status(400).json({ error: dateValidation.error });
    }

    const attendanceRecord = await Attendance.findOne({
      userId,
      date,
    });

    if (!attendanceRecord) {
      return res.status(200).json({
        status: "Attendance Not Captured Yet",
      });
    }

    return res.status(200).json(attendanceRecord);
  },
  "GET_ATTENDANCE_BY_USER_ID");

const getAttendanceByTeamId = asyncHandler(
  async (req, res) => {
    const { teamId, date } = req.body;
    
    // Validate required fields
    const requiredCheck = validateRequiredFields(
        { teamId, date },
        ['teamId', 'date']
    );
    if (!requiredCheck.valid) {
        return res.status(400).json({ error: requiredCheck.error });
    }
    
    // Validate team ID
    const teamIdValidation = validateObjectId(teamId, "Team ID");
    if (!teamIdValidation.valid) {
        return res.status(400).json({ error: teamIdValidation.error });
    }
    
    // Validate date
    const dateValidation = validateDate(date, "Date");
    if (!dateValidation.valid) {
        return res.status(400).json({ error: dateValidation.error });
    }
    
    const existingTeam = await Team.findById(teamId)
    if(!existingTeam) {
        return res.status(404).json({
            error: "Team Doesn't Exists"
        });
    } 
    const teamMembers = await User.find({ teamId }).select("_id name email");

    if (!teamMembers || teamMembers.length === 0) {
      return res.status(404).json({
        error: "Organization Has No Users",
      });
    }

    const userIds = teamMembers.map((user) => user._id);

    const teamAttendance = await Attendance.find({
      userId: { $in: userIds },
      date,
    }).populate("userId", "name email");

    if (!teamAttendance || teamAttendance.length === 0) {
      return res.status(200).json({
        status: "No Attendance Recorded For This Team",
      });
    }

    return res.status(200).json({
      teamId,
      date,
      totalMembers: teamMembers.length,
      attendanceCount: teamAttendance.length,
      records: teamAttendance,
    });
  },
  "GET_ATTENDANCE_BY_TEAM_ID");

const getAttendanceByOrganizationId = asyncHandler(
  async (req, res) => {
    const { organizationId, date } = req.body;
    
    // Validate required fields
    const requiredCheck = validateRequiredFields(
        { organizationId, date },
        ['organizationId', 'date']
    );
    if (!requiredCheck.valid) {
        return res.status(400).json({ error: requiredCheck.error });
    }
    
    // Validate organization ID
    const orgIdValidation = validateObjectId(organizationId, "Organization ID");
    if (!orgIdValidation.valid) {
        return res.status(400).json({ error: orgIdValidation.error });
    }
    
    // Validate date
    const dateValidation = validateDate(date, "Date");
    if (!dateValidation.valid) {
        return res.status(400).json({ error: dateValidation.error });
    }
    
    const existingOrganization = await Organization.findById(organizationId)
    if(!existingOrganization) {
        return res.status(404).json({
            error:  "Organization Doesn't Exists"
        });
    } 

    const users = await User.find({ organizationId }).select("_id name email");

    if (!users || users.length === 0) {
      return res.status(404).json({
        error: "Organization Has No Users",
      });
    }

    const userIds = users.map((user) => user._id);

    const organizationAttendance = await Attendance.find({
      userId: { $in: userIds },
      date,
    }).populate("userId", "name email");

    if (!organizationAttendance || organizationAttendance.length === 0) {
      return res.status(200).json({
        status: "No Attendance Recorded For This Organization",
      });
    }

    return res.status(200).json({
      organizationId,
      date,
      totalUsers: users.length,
      attendanceCount: organizationAttendance.length,
      records: organizationAttendance,
    });
  },
  "GET_ATTENDANCE_BY_ORGANIZATION_ID");

export {
  getAttendanceByUserId,
  getAttendanceByTeamId,
  getAttendanceByOrganizationId,
};
