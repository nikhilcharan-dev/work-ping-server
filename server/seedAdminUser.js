// server/seedAdminUser.js
// Schema-accurate seed script for test data

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Organization from './models/Organization.js';
import User from './models/User.js';
import Team from './models/Team.js';
import TeamMembership from './models/TeamMembership.js';
import Project from './models/Project.js';
import ProjectTeam from './models/ProjectTeam.js';
import Attendance from './models/Attendance.js';
import Account from './models/Account.js';
import Admin from './models/Admin.js';
import OrgAdmin from './models/Admin.Org.js';

import bcrypt from 'bcrypt';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workping';

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB.");

  const ADMIN_EMAIL = 'admin@workping.com';
  const USER_EMAIL = 'user@workping.com';

  // Clean up previous data for these users/emails
  await Promise.all([
    Account.deleteMany({ email: { $in: [ADMIN_EMAIL, USER_EMAIL] } }),
    Admin.deleteMany({ email: ADMIN_EMAIL }),
    User.deleteMany({ email: USER_EMAIL }),
    Organization.deleteMany({ name: 'Workping Demo Org' }),
    Team.deleteMany({ teamName: 'Demo Team' }),
    Project.deleteMany({ name: 'Demo Project' }),
    ProjectTeam.deleteMany({ teamName: 'Demo Project Team' }),
    TeamMembership.deleteMany({ userId: { $exists: true } }),
    Attendance.deleteMany({ userId: { $exists: true } }),
    OrgAdmin.deleteMany({}),
  ]);
  console.log("Cleaned up old test data.");

  // 1. Create Organization
  const org = await Organization.create({
    name: 'Workping Demo Org',
    type: 'IT',
    clDays: 15,
    description: 'Demo organization for testing',
    IPWhitelist: ['127.0.0.1'],
    foundedAt: new Date('2020-01-01'),
  });

  // 2. Create Admin Account & Profile
  // NOTE: Previous script used SECRET_KEY for hashing, which broke the normal bcrypt.compare in auth controller
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await Account.create({
    role: 'admin',
    email: ADMIN_EMAIL,
    password: adminPassword,
    emailVerified: true,
    twoFactorEnabled: false,
  });

  const adminProfile = await Admin.create({
    name: 'Admin User',
    email: ADMIN_EMAIL,
    emailVerified: true,
    phoneNumber: '9999999999',
  });

  // Link Admin to Organization
  await OrgAdmin.create({
    organizationId: org._id,
    primaryAdmin: adminProfile._id,
  });

  // 3. Create normal User Account & Profile
  const userPassword = await bcrypt.hash('user123', 10);
  
  await Account.create({
    role: 'employee',
    email: USER_EMAIL,
    password: userPassword,
    emailVerified: true,
    twoFactorEnabled: false,
  });

  const normalUser = await User.create({
    name: 'Test User',
    email: USER_EMAIL,
    phone: '8888888888',
    employeeId: 'EMP-001',
    gender: 'male',
    organizationId: org._id,
    profileImage: null,
    salary: 50000,
    dob: new Date('1995-01-01'),
    address: '123 Demo Street',
    dateOfJoining: new Date('2023-01-01'),
    role: 'employee',
    isActive: true,
  });

  // 4. Create Team (and assign user as manager for testing)
  const team = await Team.create({
    teamName: 'Demo Team',
    description: 'Demo team for testing',
    organizationId: org._id,
    managerId: normalUser._id,
    leaderIds: [normalUser._id],
  });

  // Update user with team ID
  normalUser.teamId = team._id;
  await normalUser.save();

  // 5. Create TeamMembership
  await TeamMembership.create({
    userId: normalUser._id,
    teamId: team._id,
    organizationId: org._id,
    roleInTeam: 'member',
    joinedAt: new Date('2023-01-01'),
    isActive: true,
  });

  // 6. Create Project & ProjectTeam
  const project = await Project.create({
    name: 'Demo Project',
    description: 'Demo project for testing',
    organizationId: org._id,
    projectManager: normalUser._id,
    assignedDate: new Date('2023-02-01'),
    dueDate: new Date('2024-02-01'),
    contractedBy: 'Demo Client',
    status: 'active',
  });

  await ProjectTeam.create({
    teamName: 'Demo Project Team',
    projectId: project._id,
    organizationId: org._id,
    teamManagerId: normalUser._id,
    description: 'Project team for demo project',
    teamLeaderId: normalUser._id,
    users: [normalUser._id],
  });

  console.log('--- SEEDING COMPLETE ---');
  console.log('✅ Organization created: Workping Demo Org');
  console.log('✅ Team created: Demo Team');
  console.log('✅ Project created: Demo Project');
  console.log('');
  console.log('--- ADMIN CREDENTIALS ---');
  console.log('Email: admin@workping.com');
  console.log('Password: admin123');
  console.log('');
  console.log('--- USER CREDENTIALS ---');
  console.log('Email: user@workping.com');
  console.log('Password: user123');
  console.log('-------------------------');
  
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
