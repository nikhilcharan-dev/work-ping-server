import { storage,fileFilter } from "#config";
// Multer instance
const uploadExcel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});


module.exports = uploadExcel;
