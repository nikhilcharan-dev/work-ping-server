import User from "#models/User.js";
import Attendance from "#models/Attendance.js";
import Leave from "#models/Leave.js";
import Organization from "#models/Organization.js";
import { validatePhone } from "#utils/validators.js";

// ── GET /internal/employee/by-phone/:phone ────────────────────────────────────
export const getEmployeeByPhone = asyncHandler(async (req, res) => {
    const { phone } = req.params;
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) return res.status(400).json({ found: false, error: phoneValidation.error });

    const user = await User.findOne({ phone: phoneValidation.normalized })
        .populate("organizationId", "name clDays")
        .lean();

    if (!user) return res.status(404).json({ found: false });
    if (!user.organizationId) return res.status(404).json({ found: false, error: "Employee organization not found" });

    return res.json({
        found: true,
        userId: user._id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        workType: user.workType,
        organizationId: user.organizationId._id,
        organizationName: user.organizationId.name,
        clDays: user.organizationId.clDays || 12
    });
}, "INTERNAL_GET_EMPLOYEE_ERROR");

// ── GET /internal/attendance/today/:userId ────────────────────────────────────
export const getAttendanceToday = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now);   end.setHours(23, 59, 59, 999);

    const record = await Attendance.findOne({
        userId,
        date: { $gte: start, $lte: end }
    }).lean();

    return res.json({ record: record || null });
}, "INTERNAL_ATTENDANCE_TODAY_ERROR");

// ── GET /internal/attendance/week/:userId ─────────────────────────────────────
export const getAttendanceWeek = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;  // back to Monday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
        userId,
        date: { $gte: weekStart }
    }).sort({ date: 1 }).lean();

    return res.json({ records });
}, "INTERNAL_ATTENDANCE_WEEK_ERROR");

// ── GET /internal/leave/balance/:userId ───────────────────────────────────────
export const getLeaveBalance = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("organizationId", "clDays").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear   = new Date(year, 11, 31, 23, 59, 59);

    const approvedLeaves = await Leave.find({
        userId,
        status: "approved",
        dates: { $elemMatch: { $gte: startOfYear, $lte: endOfYear } }
    }).lean();

    let usedDays = 0;
    approvedLeaves.forEach(leave => {
        (leave.dates || []).forEach(d => {
            const date = new Date(d);
            if (date >= startOfYear && date <= endOfYear) usedDays++;
        });
    });

    const totalCLDays = user.organizationId?.clDays || 12;
    return res.json({ totalCLDays, usedDays, remainingDays: totalCLDays - usedDays });
}, "INTERNAL_LEAVE_BALANCE_ERROR");

// ── GET /internal/leave/recent/:userId ───────────────────────────────────────
export const getRecentLeaves = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const leaves = await Leave.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    return res.json({ leaves });
}, "INTERNAL_RECENT_LEAVES_ERROR");

// ── POST /internal/leave/apply ────────────────────────────────────────────────
export const applyLeave = asyncHandler(async (req, res) => {
    const { userId, dates, leaveType, reason } = req.body;

    if (!userId || !dates || !leaveType) {
        return res.status(400).json({ error: "userId, dates, and leaveType are required" });
    }

    const validTypes = ["Casual", "Sick", "Earned", "Unpaid"];
    if (!validTypes.includes(leaveType)) {
        return res.status(400).json({ error: `Invalid leave type. Use: ${validTypes.join(", ")}` });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const normalizedDates = [];
    for (const d of dates) {
        const date = new Date(d);
        if (isNaN(date.getTime())) return res.status(400).json({ error: `Invalid date: ${d}` });
        if (date < today) return res.status(400).json({ error: `Date ${date.toLocaleDateString("en-IN")} is in the past` });
        normalizedDates.push(date);
    }

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const leave = await Leave.create({
        userId,
        organizationId: user.organizationId,
        leaveType,
        dates: normalizedDates,
        reason: reason || "",
        appliedBy: userId,
        status: "pending"
    });

    return res.status(201).json({ success: true, leaveId: leave._id });
}, "INTERNAL_APPLY_LEAVE_ERROR");
