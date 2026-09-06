const express = require("express");
const { protect } = require("../middleware/auth.js");
const multer=require("multer");
const { analyzeResume } = require("../controllers/resumecontroller.js");
const router = express.Router();

const upload=multer({
    storage:multer.memoryStorage(),
    limits:{fileSize:5*1024*1024}, // 5MB limit
    fileFilter:(req,file,cb)=>{
        const allowedTypes=["application/pdf","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if(allowedTypes.includes(file.mimetype)){
            cb(null,true);
        }else{
            cb(new Error("Invalid file type"),false);
        }
    }
});
router.post("/analyze", protect, upload.single("resume"), analyzeResume);

module.exports = router;