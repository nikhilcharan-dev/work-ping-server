import fs from "fs";
import xlsx from "xlsx";
import User from "#models/User.js";

const insertByExcel =
  asyncHandler(
      async (req,res)=>{
          if (!req.file) {
              return res.status(400).json({ message: "No file uploaded" });
            }
            const filePath = req.file.path;
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(sheet);
            // Delete file after processing
            fs.unlinkSync(filePath);

            const requiredFields = [
                "name",
                "email",
                "phone",
                "employeeId",
                "organizationId",
                "dateOfJoining"
            ];

            const uniqueFields = ["email", "phone", "employeeId"];

            const failedRecords = [];

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                row["password"] = "static";
                let invalid = false;

                // Required field check
                for (const field of requiredFields) {
                    if (
                        row[field] === undefined ||
                        row[field] === null ||
                        (typeof row[field] === "string" && row[field].trim() === "")
                    ) {
                        invalid = true;
                        failedRecords.push({
                            error: `Required field "${field}" is missing or empty`,
                            rowNumber: i + 2,
                            rowData: row,
                            field
                        });
                        break;
                    }
                }

                if (invalid) continue;
                // Unique field check
                for (const field of uniqueFields) {
                    const existing = await User.findOne({ [field]: row[field] });
                    if (existing) {
                    invalid = true;
                    failedRecords.push({
                        error: `Field "${field}" must be unique`,
                        rowNumber: i + 2,
                        rowData: row,
                        field
                    });
                    break;
                    }
                }
                if (!invalid) {
                    console.log("VALID");
                    try {
                        await User.create(row);
                    } catch(err) {
                        console.log(err.message);
                    }
                } else {
                    console.log("Invalid");
                }
            }
            console.log(failedRecords)

            if(!failedRecords.length){
                return res.status(201).json({
                    message: "employees added successfully",
                    count: {
                        "total": jsonData.length,
                        "failed": failedRecords.length
                    },
                }); 
            }
            return res.status(207).json({
                count: {
                    "total": jsonData.length,
                    "failed": failedRecords.length
                },
                error : failedRecords
            })
        }
    , "ERROR_PROCESSING_EXCEL_FILE" );

export default insertByExcel ;  