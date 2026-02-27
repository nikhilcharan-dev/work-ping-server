import Salary from "#models/Salary.js";
import User from "#models/User.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";

export const getMySalarySlips = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        let { page = 1, limit = 10, status } = req.query;

        const filter = [
            { $match: { userId: new mongoose.Types.ObjectId(userId) } }
        ];

        if (status) {
            filter.push({ $match: { status } });
        }

        filter.push({ $sort: { generatedDate: -1 } });

        const pagination = await Pagination(Salary, page, limit, filter);

        return res.status(200).json({
            totalRecords: pagination.totalRecords,
            totalPages: pagination.totalPages,
            salarySlips: pagination.documents
        });
    }, "USER_GET_SALARY_SLIPS_ERROR"
);

export const getSalarySlipById = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { salaryId } = req.params;

        if (!salaryId || !mongoose.Types.ObjectId.isValid(salaryId)) {
            return res.status(400).json({ error: "Invalid salaryId" });
        }

        const salary = await Salary.findOne({ _id: salaryId, userId });

        if (!salary) {
            return res.status(404).json({ error: "Salary slip not found" });
        }

        return res.status(200).json(salary);
    }, "USER_GET_SALARY_SLIP_BY_ID_ERROR"
);

export const getSalaryByMonth = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ error: "Month is required (e.g. '2025-06')" });
        }

        const salary = await Salary.findOne({ userId, month });

        if (!salary) {
            return res.status(404).json({ error: "Salary slip not found for the given month" });
        }

        return res.status(200).json(salary);
    }, "USER_GET_SALARY_BY_MONTH_ERROR"
);
