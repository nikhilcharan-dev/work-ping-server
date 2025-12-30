import mongoose from 'mongoose';

const OrgAdmin = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
});

export default mongoose.model('OrgAdmin', OrgAdmin);