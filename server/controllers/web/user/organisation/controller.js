import User from "#models/User.js";
import Organization from "#models/Organization.js";
import Team from "#models/Team.js";
import TeamMembership from "#models/TeamMembership.js";
import mongoose from "mongoose";

export const getMyOrganization = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization) {
            return res.status(404).json({ error: "Organization not found" });
        }

        return res.status(200).json(organization);
    }, "USER_GET_MY_ORG_ERROR"
);

export const getMyTeam = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.teamId) {
            return res.status(404).json({ error: "You are not assigned to any team" });
        }

        const team = await Team.findById(user.teamId)
            .populate({ path: "managerId", select: "name email" })
            .populate({ path: "leaderIds", select: "name email" });

        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        return res.status(200).json(team);
    }, "USER_GET_MY_TEAM_ERROR"
);

export const getMyTeamMembers = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.teamId) {
            return res.status(404).json({ error: "You are not assigned to any team" });
        }

        const members = await TeamMembership.find({
            teamId: user.teamId,
            isActive: true
        }).populate({ path: "userId", select: "name email phone roleInTeam profileImage" });

        return res.status(200).json(members);
    }, "USER_GET_MY_TEAM_MEMBERS_ERROR"
);

export const getAllMyTeams = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const memberships = await TeamMembership.find({
            userId,
            isActive: true
        }).populate({
            path: "teamId",
            select: "teamName description organizationId"
        }).populate({
            path: "organizationId",
            select: "name"
        });

        return res.status(200).json(memberships);
    }, "USER_GET_ALL_MY_TEAMS_ERROR"
);
