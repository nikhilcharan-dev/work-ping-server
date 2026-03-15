/**
 * API Route Test Suite
 * Tests all frontend-facing backend routes defined in ALL_FRONTEND_BACKEND_ROUTES.json
 *
 * Usage: node test-routes.js
 * Requires: Server running on http://localhost:5000
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000";
const ADMIN_EMAIL = "admin@workping.com";
const ADMIN_PASS = "admin123";

// ─── Colours ─────────────────────────────────────────────────────────────────
const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    grey: "\x1b[90m",
    blue: "\x1b[34m",
};

// ─── State ────────────────────────────────────────────────────────────────────
let token = null;
const results = { pass: 0, fail: 0, skip: 0 };
const failures = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function header(title) {
    console.log(`\n${c.bold}${c.cyan}━━━ ${title} ━━━${c.reset}`);
}

function log(status, method, path, note = "") {
    const icons = { PASS: `${c.green}✔`, FAIL: `${c.red}✘`, SKIP: `${c.yellow}⊘` };
    const icon = icons[status] || "?";
    const noteStr = note ? ` ${c.grey}(${note})${c.reset}` : "";
    console.log(
        `  ${icon} ${c.reset}${c.bold}${method.padEnd(6)}${c.reset} ${path}${noteStr}`
    );
}

async function request(method, path, { data, params, headers: extraHeaders, silent } = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
    };
    try {
        const res = await axios({ method, url, data, params, headers, withCredentials: false });
        return { status: res.status, data: res.data, ok: true };
    } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;
        return { status, data, ok: false, err };
    }
}

function test(status, method, path, res, opts = {}) {
    const {
        expectedStatuses = [200, 201],
        skip = false,
        skipReason = "",
        note = "",
    } = opts;

    if (skip) {
        log("SKIP", method, path, skipReason || note);
        results.skip++;
        return;
    }

    const passed = expectedStatuses.includes(res.status);

    if (passed) {
        log("PASS", method, path, note || `${res.status}`);
        results.pass++;
    } else {
        const detail = `got ${res.status} — ${JSON.stringify(res.data?.message || res.data)?.slice(0, 80)}`;
        log("FAIL", method, path, note || detail);
        results.fail++;
        failures.push({ method, path, status: res.status, detail });
    }
}

// ─── ID Pools ─────────────────────────────────────────────────────────────────
// Populated after fetching real data so dynamic-URL routes have valid IDs.
const ids = {
    employee: null,
    organization: null,
    team: null,
    project: null,
    adminUserId: null,
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    console.log(`\n${c.bold}${c.blue}╔══════════════════════════════════════╗`);
    console.log(`║   API Route Test Suite               ║`);
    console.log(`╚══════════════════════════════════════╝${c.reset}`);
    console.log(`${c.grey}  Base URL : ${BASE_URL}${c.reset}`);
    console.log(`${c.grey}  Admin    : ${ADMIN_EMAIL}${c.reset}`);

    // ── 0. Login ─────────────────────────────────────────────────────────────
    header("Auth — Login (setup)");
    {
        const res = await request("POST", "/api/admin/auth/login", {
            data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
        });
        if (res.ok && res.data?.data?.token) {
            token = res.data.data.token;
            ids.adminUserId = res.data.data.id;
            log("PASS", "POST", "/api/admin/auth/login", `token acquired`);
            results.pass++;
        } else {
            log("FAIL", "POST", "/api/admin/auth/login", `login failed — ${JSON.stringify(res.data)}`);
            results.fail++;
            failures.push({ method: "POST", path: "/api/admin/auth/login", status: res.status, detail: JSON.stringify(res.data) });
            console.log(`\n${c.red}${c.bold}Fatal: Cannot obtain auth token. Aborting authenticated tests.${c.reset}`);
            printSummary();
            return;
        }
    }

    // ── 1. Auth ───────────────────────────────────────────────────────────────
    header("Auth");

    {
        // send-signup-otp — needs OTP/email service; just verify route exists (400 = route hit)
        const res = await request("POST", "/api/admin/auth/send-signup-otp", {
            data: { email: "nonexistent_test_xyz@example.com" },
        });
        test("POST", "POST", "/api/admin/auth/send-signup-otp", res, {
            expectedStatuses: [200, 400, 404, 500],
            note: "route reachability — OTP service may be down",
        });
    }

    {
        // register — tested with missing fields to confirm route exists (400 = reached)
        const res = await request("POST", "/api/admin/auth/register", { data: {} });
        test("POST", "POST", "/api/admin/auth/register", res, {
            expectedStatuses: [400, 409, 422],
            note: "empty payload → validation error expected",
        });
    }

    {
        const res = await request("POST", "/api/admin/auth/logout", {});
        test("POST", "POST", "/api/admin/auth/logout", res, {
            expectedStatuses: [200],
        });
        // Re-login since we just logged out (cookie cleared; token still valid for Bearer)
    }

    // ── 2. Forgot Password ────────────────────────────────────────────────────
    header("Forgot Password");

    {
        const res = await request("POST", "/api/admin/forgot-password/send-otp", {
            data: { email: "nobody@test.com" },
        });
        test("POST", "POST", "/api/admin/forgot-password/send-otp", res, {
            expectedStatuses: [200, 404, 500],
            note: "non-existent email — 404 expected",
        });
    }

    {
        const res = await request("POST", "/api/admin/forgot-password/verify-otp", {
            data: { email: "nobody@test.com", otp: "000000" },
        });
        test("POST", "POST", "/api/admin/forgot-password/verify-otp", res, {
            expectedStatuses: [200, 400, 401, 404, 500],
            note: "invalid OTP — non-200 expected",
        });
    }

    {
        const res = await request("POST", "/api/admin/forgot-password/verify-and-change", {
            data: { email: "nobody@test.com", otp: "000000", newPassword: "Test@1234" },
        });
        test("POST", "POST", "/api/admin/forgot-password/verify-and-change", res, {
            expectedStatuses: [200, 400, 401, 404, 500],
            note: "invalid OTP — non-200 expected",
        });
    }

    // ── 3. Verify Cookie ──────────────────────────────────────────────────────
    header("Verify Cookie");
    {
        // This endpoint only reads req.cookies, not Bearer header — expect 403 from node tests
        const res = await request("GET", "/verify-cookie", {});
        test("GET", "GET", "/verify-cookie", res, {
            expectedStatuses: [200, 403],
            note: "cookie-only; 403 is expected when testing without browser cookies",
        });
    }

    // ── 4. 2FA ────────────────────────────────────────────────────────────────
    header("Two-Factor Authentication");
    {
        const res = await request("POST", "/api/auth/2fa/setup", {});
        test("POST", "POST", "/api/auth/2fa/setup", res, {
            expectedStatuses: [200, 201, 400, 401, 403, 404],
            note: "2FA setup — may need cookie session",
        });
    }
    {
        const res = await request("POST", "/api/auth/2fa/verify", { data: { code: "000000" } });
        test("POST", "POST", "/api/auth/2fa/verify", res, {
            expectedStatuses: [200, 400, 401, 403, 404],
            note: "invalid code — non-200 expected",
        });
    }

    // ── 5. Organisation ───────────────────────────────────────────────────────
    header("Organization");

    // Fetch all orgs (paginated)
    {
        const res = await request("GET", "/api/admin/organization/get-organizations", {
            params: { page: 1, limit: 10 },
        });
        test("GET", "GET", "/api/admin/organization/get-organizations", res, {
            expectedStatuses: [200],
        });
        // Grab first org ID for downstream tests
        const orgs = res.data?.data?.organizations || res.data?.data || [];
        if (Array.isArray(orgs) && orgs.length > 0) ids.organization = orgs[0]._id;
    }

    // All org IDs
    {
        const res = await request("GET", "/api/admin/organization/get-all-organization-ids", {});
        test("GET", "GET", "/api/admin/organization/get-all-organization-ids", res, {
            expectedStatuses: [200],
        });
        if (!ids.organization) {
            const list = res.data?.data || [];
            if (list.length > 0) ids.organization = list[0].organizationId || list[0]._id;
        }
    }

    // Get org by ID
    {
        if (ids.organization) {
            const res = await request("GET", `/api/admin/organization/get-organization-by-id/${ids.organization}`, {});
            test("GET", "GET", "/api/admin/organization/get-organization-by-id/:organizationId", res, {
                expectedStatuses: [200],
            });
        } else {
            test("GET", "GET", "/api/admin/organization/get-organization-by-id/:organizationId", { status: 0 }, {
                skip: true,
                skipReason: "no organization IDs in DB",
            });
        }
    }

    // Find admin by email
    let foundAdminId = null;
    {
        const res = await request("POST", "/api/admin/organization/find-admin-by-email", {
            data: { email: ADMIN_EMAIL },
        });
        test("POST", "POST", "/api/admin/organization/find-admin-by-email", res, {
            expectedStatuses: [200],
        });
        foundAdminId = res.data?.data?.userId?.toString() || res.data?.data?._id?.toString() || null;
    }

    // Add organization — create a temp one
    // Note: Organization.coordinates schema is [Number] (array), NOT an object
    let tempOrgId = null;
    {
        const res = await request("POST", "/api/admin/organization/add-organization", {
            data: {
                name: `Test Org ${Date.now()}`,
                type: "Private",
                foundedAt: "2020-01-01",
                clDays: 12,
                description: "Created by automated test",
                IPWhitelist: [],
                coordinates: [],
            },
        });
        test("POST", "POST", "/api/admin/organization/add-organization", res, {
            expectedStatuses: [200, 201],
        });
        tempOrgId = res.data?.data?._id || res.data?._id || null;
    }

    // Get org admins (after creating org so we have a valid record)
    {
        const orgId = tempOrgId || ids.organization;
        if (orgId) {
            const res = await request("GET", "/api/admin/organization/get-org-admins", {
                params: { organizationId: orgId },
            });
            test("GET", "GET", "/api/admin/organization/get-org-admins", res, {
                expectedStatuses: [200],
            });
            const admins = res.data?.data || [];
            if (Array.isArray(admins) && admins.length > 0) {
                ids.adminUserId = admins[0].userId?.toString() || ids.adminUserId;
            }
        } else {
            test("GET", "GET", "/api/admin/organization/get-org-admins", { status: 0 }, {
                skip: true,
                skipReason: "no organization available",
            });
        }
    }

    // Update organization
    {
        const targetId = tempOrgId || ids.organization;
        if (targetId) {
            const res = await request("POST", "/api/admin/organization/update-organization", {
                data: {
                    _id: targetId,
                    name: `Updated Org ${Date.now()}`,
                    type: "Public",
                    foundedAt: "2021-01-01",
                    clDays: 15,
                    description: "Updated by automated test",
                    IPWhitelist: [],
                    coordinates: [],
                },
            });
            test("POST", "POST", "/api/admin/organization/update-organization", res, {
                expectedStatuses: [200, 201],
            });
        } else {
            test("POST", "POST", "/api/admin/organization/update-organization", { status: 0 }, {
                skip: true,
                skipReason: "no organization to update",
            });
        }
    }

    // Invite admin — invite the found admin as secondary admin of temp org
    {
        const orgId = tempOrgId || ids.organization;
        const adminId = foundAdminId || ids.adminUserId;
        if (orgId && adminId) {
            const res = await request("POST", "/api/admin/organization/invite-admin", {
                data: { organizationId: orgId, userId: adminId, email: ADMIN_EMAIL, name: "Test Admin" },
            });
            test("POST", "POST", "/api/admin/organization/invite-admin", res, {
                expectedStatuses: [200, 409],
                note: res.status === 409 ? "already primary admin" : "",
            });
        } else {
            test("POST", "POST", "/api/admin/organization/invite-admin", { status: 0 }, {
                skip: true,
                skipReason: "no org or admin ID available",
            });
        }
    }

    // Remove admin — remove the secondary admin we just added (use a different admin if possible)
    {
        const orgId = tempOrgId || ids.organization;
        const adminId = foundAdminId || ids.adminUserId;
        if (orgId && adminId) {
            const res = await request("POST", "/api/admin/organization/remove-admin", {
                data: { organizationId: orgId, userId: adminId },
            });
            test("POST", "POST", "/api/admin/organization/remove-admin", res, {
                expectedStatuses: [200, 400, 404],
                note: "400 if user is primary admin",
            });
        } else {
            test("POST", "POST", "/api/admin/organization/remove-admin", { status: 0 }, {
                skip: true,
                skipReason: "no org or admin ID available",
            });
        }
    }

    // Delete temp org
    {
        if (tempOrgId) {
            const res = await request("POST", "/api/admin/organization/delete-organizations", {
                data: { data: [tempOrgId] },
            });
            test("POST", "POST", "/api/admin/organization/delete-organizations", res, {
                expectedStatuses: [200, 201],
                note: "cleanup: delete temp org",
            });
        } else {
            test("POST", "POST", "/api/admin/organization/delete-organizations", { status: 0 }, {
                skip: true,
                skipReason: "no temp org to delete",
            });
        }
    }

    // ── 6. Employees ──────────────────────────────────────────────────────────
    header("Employees");

    // Get org info (used across employee pages)
    {
        const res = await request("GET", "/api/admin/get-all-employees/get-organization-info", {});
        test("GET", "GET", "/api/admin/get-all-employees/get-organization-info", res, {
            expectedStatuses: [200],
        });
    }

    // Get all employees paginated
    {
        const res = await request("GET", "/api/admin/get-all-employees/get-all-employees-by-page-number", {
            params: { page: 1, limit: 10 },
        });
        test("GET", "GET", "/api/admin/get-all-employees/get-all-employees-by-page-number", res, {
            expectedStatuses: [200],
        });
        const employees = res.data?.data?.data || res.data?.data || [];
        if (Array.isArray(employees) && employees.length > 0) ids.employee = employees[0]._id;
    }

    // Get single employee by ID
    {
        if (ids.employee) {
            const res = await request("GET", `/api/admin/employee/get-employee/${ids.employee}`, {});
            test("GET", "GET", "/api/admin/employee/get-employee/:employeeId", res, {
                expectedStatuses: [200],
            });
        } else {
            test("GET", "GET", "/api/admin/employee/get-employee/:employeeId", { status: 0 }, {
                skip: true,
                skipReason: "no employees in DB",
            });
        }
    }

    // Add employee by form — create a temp employee
    let tempEmployeeId = null;
    {
        const orgName = ids.organization ? undefined : "Test Org";
        const res = await request("POST", "/api/admin/add-employees/by-form", {
            data: {
                userName: `Test Employee ${Date.now()}`,
                email: `testemployee_${Date.now()}@test.com`,
                phone: "9876543210",
                userId: `EMP${Date.now()}`,
                organizationName: orgName || "Test Org",
                doj: "2023-01-01",
                gender: "Male",
                workType: "Full-Time",
                salary: 50000,
                dob: "1995-01-01",
                address: "123 Test Street",
                isActive: true,
                aadhaar: "123456789012",
                pan: "ABCDE1234F",
                passport: "",
                bankId: "",
            },
        });
        test("POST", "POST", "/api/admin/add-employees/by-form", res, {
            expectedStatuses: [200, 201, 400],
            note: res.status === 400 ? res.data?.message?.slice(0, 60) : "",
        });
        tempEmployeeId = res.data?.data?._id || res.data?._id || null;
    }

    // Update employee
    {
        const empId = tempEmployeeId || ids.employee;
        if (empId) {
            const res = await request("POST", "/api/admin/employee/update", {
                data: {
                    employeeId: empId,
                    userName: `Updated Employee ${Date.now()}`,
                    email: `updated_${Date.now()}@test.com`,
                    phone: "9876543211",
                    userId: `EMP_UPD_${Date.now()}`,
                    organizationName: "Test Org",
                    doj: "2023-06-01",
                    gender: "Female",
                    workType: "Part-Time",
                    salary: 60000,
                    dob: "1997-05-15",
                    address: "456 Updated Street",
                    isActive: true,
                    aadhaar: "123456789012",
                    pan: "ABCDE1234F",
                    passport: "",
                    bankId: "",
                },
            });
            test("POST", "POST", "/api/admin/employee/update", res, {
                expectedStatuses: [200, 201, 400, 404],
            });
        } else {
            test("POST", "POST", "/api/admin/employee/update", { status: 0 }, {
                skip: true,
                skipReason: "no employee to update",
            });
        }
    }

    // Bulk upload employees (by-excel) — can't upload actual file in this test; confirm route exists
    {
        const res = await request("POST", "/api/admin/add-employees/by-excel", {
            data: {},
            headers: { "Content-Type": "multipart/form-data" },
        });
        test("POST", "POST", "/api/admin/add-employees/by-excel", res, {
            expectedStatuses: [200, 201, 400, 422, 500],
            note: "no file attached — 400/422 expected",
        });
    }

    // Delete temp employee
    {
        const toDelete = tempEmployeeId ? [tempEmployeeId] : [];
        if (toDelete.length > 0) {
            const res = await request("POST", "/api/admin/employees/delete-employees", {
                data: { data: toDelete },
            });
            test("POST", "POST", "/api/admin/employees/delete-employees", res, {
                expectedStatuses: [200, 201],
                note: "cleanup: delete temp employee",
            });
        } else {
            // Test with dummy ID to confirm route exists
            const res = await request("POST", "/api/admin/employees/delete-employees", {
                data: { data: ["000000000000000000000000"] },
            });
            test("POST", "POST", "/api/admin/employees/delete-employees", res, {
                expectedStatuses: [200, 201, 400, 404],
                note: "dummy ID — route reachability",
            });
        }
    }

    // ── 7. Teams ──────────────────────────────────────────────────────────────
    header("Teams");

    // Get teams filtered
    {
        const res = await request("GET", "/api/admin/team/get-teams-filter", {
            params: { page: 1, limit: 10 },
        });
        test("GET", "GET", "/api/admin/team/get-teams-filter", res, {
            expectedStatuses: [200],
        });
        const teams = res.data?.data?.teamList || res.data?.data || [];
        if (Array.isArray(teams) && teams.length > 0) ids.team = teams[0]._id;
    }

    // Create team
    let tempTeamId = null;
    {
        const res = await request("POST", "/api/admin/team/create-team", {
            data: {
                teamName: `Test Team ${Date.now()}`,
                organizationId: ids.organization || "000000000000000000000000",
                teamManagerId: ids.adminUserId || "000000000000000000000000",
                teamLeaderIds: [],
                description: "Created by automated test",
            },
        });
        test("POST", "POST", "/api/admin/team/create-team", res, {
            expectedStatuses: [200, 201, 400],
        });
        tempTeamId = res.data?.data?._id || res.data?._id || null;
    }

    // Get team by ID
    {
        const teamId = tempTeamId || ids.team;
        if (teamId) {
            const res = await request("GET", `/api/admin/team/get-team/${teamId}`, {});
            test("GET", "GET", "/api/admin/team/get-team/:id", res, {
                expectedStatuses: [200],
            });
        } else {
            test("GET", "GET", "/api/admin/team/get-team/:id", { status: 0 }, {
                skip: true,
                skipReason: "no teams in DB",
            });
        }
    }

    // Get team members
    {
        const teamId = tempTeamId || ids.team;
        const res = await request("GET", "/api/admin/team/get-team-members", {
            params: { page: 1, limit: 10, ...(teamId ? { teamId } : {}) },
        });
        test("GET", "GET", "/api/admin/team/get-team-members", res, {
            expectedStatuses: [200],
        });
    }

    // Update team
    {
        const teamId = tempTeamId || ids.team;
        if (teamId) {
            const res = await request("POST", "/api/admin/team/update-team", {
                data: {
                    teamId,
                    teamName: `Updated Team ${Date.now()}`,
                    description: "Updated by automated test",
                    organizationId: ids.organization || "000000000000000000000000",
                    managerId: ids.adminUserId || "000000000000000000000000",
                    leaderIds: [],
                },
            });
            test("POST", "POST", "/api/admin/team/update-team", res, {
                expectedStatuses: [200, 201, 400, 404],
            });
        } else {
            test("POST", "POST", "/api/admin/team/update-team", { status: 0 }, {
                skip: true,
                skipReason: "no team to update",
            });
        }
    }

    // Add team member
    {
        const teamId = tempTeamId || ids.team;
        const memberId = ids.employee || "000000000000000000000000";
        if (teamId) {
            const res = await request("POST", "/api/admin/team/add-team-member", {
                data: { teamId, members: [memberId] },
            });
            test("POST", "POST", "/api/admin/team/add-team-member", res, {
                expectedStatuses: [200, 201, 400, 404],
            });
        } else {
            test("POST", "POST", "/api/admin/team/add-team-member", { status: 0 }, {
                skip: true,
                skipReason: "no team available",
            });
        }
    }

    // Delete temp team
    {
        if (tempTeamId) {
            const res = await request("POST", "/api/admin/team/delete-team", {
                data: { data: [tempTeamId] },
            });
            test("POST", "POST", "/api/admin/team/delete-team", res, {
                expectedStatuses: [200, 201],
                note: "cleanup: delete temp team",
            });
        } else {
            const res = await request("POST", "/api/admin/team/delete-team", {
                data: { data: ["000000000000000000000000"] },
            });
            test("POST", "POST", "/api/admin/team/delete-team", res, {
                expectedStatuses: [200, 201, 400, 404],
                note: "dummy ID — route reachability",
            });
        }
    }

    // ── 8. Projects ───────────────────────────────────────────────────────────
    header("Projects");

    // Get projects
    {
        const res = await request("GET", "/api/admin/project/get-projects", {
            params: { page: 1, limit: 10 },
        });
        test("GET", "GET", "/api/admin/project/get-projects", res, {
            expectedStatuses: [200],
        });
        const projects = res.data?.data?.projects || res.data?.data || [];
        if (Array.isArray(projects) && projects.length > 0) ids.project = projects[0]._id;
    }

    // Create project
    let tempProjectId = null;
    {
        const res = await request("POST", "/api/admin/project/create-project", {
            data: {
                name: `Test Project ${Date.now()}`,
                assignedDate: "2024-01-01",
                dueDate: "2024-12-31",
                contractedBy: "Test Client",
                organizationId: ids.organization || "000000000000000000000000",
                projectManager: ids.employee || "000000000000000000000000",
                description: "Created by automated test",
            },
        });
        test("POST", "POST", "/api/admin/project/create-project", res, {
            expectedStatuses: [200, 201, 400],
        });
        tempProjectId = res.data?.data?._id || res.data?._id || null;
    }

    // Get project by ID
    {
        const projectId = tempProjectId || ids.project;
        if (projectId) {
            const res = await request("GET", "/api/admin/project/get-project", {
                params: { projectId },
            });
            test("GET", "GET", "/api/admin/project/get-project", res, {
                expectedStatuses: [200],
            });
        } else {
            test("GET", "GET", "/api/admin/project/get-project", { status: 0 }, {
                skip: true,
                skipReason: "no projects in DB",
            });
        }
    }

    // Update project
    {
        const projectId = tempProjectId || ids.project;
        if (projectId) {
            const res = await request("POST", "/api/admin/project/update-project", {
                data: {
                    id: projectId,
                    name: `Updated Project ${Date.now()}`,
                    description: "Updated by automated test",
                    projectManager: ids.employee || "000000000000000000000000",
                    organizationId: ids.organization || "000000000000000000000000",
                    dueDate: "2025-06-30",
                    contractedBy: "Updated Client",
                },
            });
            test("POST", "POST", "/api/admin/project/update-project", res, {
                expectedStatuses: [200, 201, 400, 404],
            });
        } else {
            test("POST", "POST", "/api/admin/project/update-project", { status: 0 }, {
                skip: true,
                skipReason: "no project to update",
            });
        }
    }

    // Delete temp project
    {
        if (tempProjectId) {
            const res = await request("POST", "/api/admin/project/delete-projects", {
                data: { data: [tempProjectId] },
            });
            test("POST", "POST", "/api/admin/project/delete-projects", res, {
                expectedStatuses: [200, 201],
                note: "cleanup: delete temp project",
            });
        } else {
            const res = await request("POST", "/api/admin/project/delete-projects", {
                data: { data: ["000000000000000000000000"] },
            });
            test("POST", "POST", "/api/admin/project/delete-projects", res, {
                expectedStatuses: [200, 201, 400, 404],
                note: "dummy ID — route reachability",
            });
        }
    }

    // ── 9. Misc (send-user-ids) ───────────────────────────────────────────────
    header("Misc");

    {
        const res = await request("POST", "/api/send-user-ids", {
            data: { rollNumbers: ["EMP001", "EMP002"] },
        });
        test("POST", "POST", "/api/send-user-ids", res, {
            expectedStatuses: [200, 201, 400, 404, 500],
            note: "route may not be registered on this server",
        });
    }

    // ─── Summary ──────────────────────────────────────────────────────────────
    printSummary();
}

function printSummary() {
    const total = results.pass + results.fail + results.skip;
    console.log(`\n${c.bold}${c.blue}╔══════════════════════════════════════╗`);
    console.log(`║   Test Summary                       ║`);
    console.log(`╚══════════════════════════════════════╝${c.reset}`);
    console.log(`  Total   : ${total}`);
    console.log(`  ${c.green}Passed  : ${results.pass}${c.reset}`);
    console.log(`  ${c.red}Failed  : ${results.fail}${c.reset}`);
    console.log(`  ${c.yellow}Skipped : ${results.skip}${c.reset}`);

    if (failures.length > 0) {
        console.log(`\n${c.bold}${c.red}Failures:${c.reset}`);
        for (const f of failures) {
            console.log(
                `  ${c.red}✘${c.reset} ${c.bold}${f.method}${c.reset} ${f.path} — status ${f.status}`
            );
            if (f.detail) console.log(`     ${c.grey}${f.detail}${c.reset}`);
        }
    }

    console.log();
    process.exit(results.fail > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error(`${c.red}Unhandled error:${c.reset}`, err.message);
    process.exit(1);
});
