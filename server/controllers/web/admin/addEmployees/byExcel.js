
import {insertEmployees} from "#adminHelper/employee/helper.js"
import fs from "fs";
import xlsx from "xlsx";
import express from "express";
import uploadExcel from "#middleware/uploadExcel.js";
const router = express.Router(); 
router.post(
  "/upload-excel",
  uploadExcel.single("file"), // must match input field name
  asyncHandler(
      async (req,res)=>{
          if (!req.file) {
              return res.status(400).json({ message: "No file uploaded" });
            }
            // Get file path from Multer
            const filePath = req.file.path;
            // Read the Excel file
            const workbook = xlsx.readFile(filePath);
            // Get the first sheet name
            const sheetName = workbook.SheetNames[0];
            // Get worksheet
            const sheet = workbook.Sheets[sheetName];
            // Convert sheet to JSON
            const jsonData = xlsx.utils.sheet_to_json(sheet);
            // Delete file after processing
            fs.unlinkSync(filePath);

            //add employees to database
            await insertEmployees(jsonData)
            
            res.json({
                message: "employees added successfully"
            }); 

        }
    , "ERROR_PROCESSING_EXCEL_FILE" )
);

export default router ;
