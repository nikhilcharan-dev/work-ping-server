
import insertEmployees from "#adminHelper/employee/helper.js"
const fs = require("fs");
const xlsx = require("xlsx");
const uploadExcel = require("#middlewares/uploadExcel.js");

app.post(
  "/upload-excel",
  uploadExcel.single("file"), // must match input field name
  asyncHandler(
        async ()=>{
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
    , "Error processing Excel file" )
);
