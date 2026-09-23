const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: "C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/.env" });

const app = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/index.js");
const User = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/User.js");
const Interview = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/Interview.js");
const Resume = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/Resume.js");
const SkillAssessment = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/SkillAssessment.js");

const {
  categorizeSkills,
  validateSkillScores,
  InterviewPerformanceAdapter,
  ResumePerformanceAdapter,
} = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/utils/readiness.utils.js");

async function runDay2Tests() {
  console.log("================================================================================");
  console.log("DAY 2 TASK: CONNECT RESUME + INTERVIEW + SKILL DATA VERIFICATION SUITE");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-interview-mock";
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB for verification\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // Set up test candidates
  const user1 = await User.findOneAndUpdate(
    { email: "candidate.day2.all@adaptive.ai" },
    { name: "Candidate All Sources", email: "candidate.day2.all@adaptive.ai", password: "password123" },
    { upsert: true, new: true }
  );

  const user2 = await User.findOneAndUpdate(
    { email: "candidate.day2.nointerview@adaptive.ai" },
    { name: "Candidate No Interview", email: "candidate.day2.nointerview@adaptive.ai", password: "password123" },
    { upsert: true, new: true }
  );

  const user3 = await User.findOneAndUpdate(
    { email: "candidate.day2.noresume@adaptive.ai" },
    { name: "Candidate No Resume", email: "candidate.day2.noresume@adaptive.ai", password: "password123" },
    { upsert: true, new: true }
  );

  const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey_ai_assistant_2026";
  const tokenUser1 = jwt.sign({ userId: user1._id }, jwtSecret, { expiresIn: "1h" });

  // Clean previous test records
  await Resume.deleteMany({ userId: { $in: [user1._id, user2._id, user3._id] } });
  await Interview.deleteMany({ userId: { $in: [user1._id, user2._id, user3._id] } });
  await SkillAssessment.deleteMany({ userId: { $in: [user1._id, user2._id, user3._id] } });

  // 1. Setup User 1 (All 3 Sources Available)
  await Resume.create({
    userId: user1._id,
    fileName: "akash_resume.pdf",
    resumeScore: 78,
    skills: ["Java", "Python", "React", "MongoDB"],
    projects: [{ title: "E-Commerce Platform" }, { title: "Cab Booking System" }],
    education: "B.E. Computer Science",
    experience: [{ role: "Frontend Intern", company: "TechCorp" }],
    certifications: ["Full Stack Development"],
    missingSkills: ["AWS", "Docker"],
  });

  await Interview.create({
    userId: user1._id,
    domain: "React",
    score: 75,
    isComplete: true,
    totalQuestionsAsked: 10,
    questionsAnswered: 8,
    questionsSkipped: 2,
    difficultyHistory: [
      { questionIndex: 1, score: 80, difficulty: "MEDIUM", candidateAnswer: "Detailed React explanation...", skipped: false },
      { questionIndex: 2, score: 70, difficulty: "HARD", candidateAnswer: "High concurrency fiber answer...", skipped: false, isFollowUp: true },
      { questionIndex: 3, score: 0, difficulty: "HARD", skipped: true },
    ],
  });

  await SkillAssessment.create({
    userId: user1._id,
    scores: {
      DSA: 72,
      DBMS: 80,
      OOP: 85,
      OS: 55,
      CN: 60,
      Programming: 78,
      Cloud: 40,
      "AI/ML": 65,
    },
  });

  // 2. Setup User 2 (Resume available, Interview unavailable)
  await Resume.create({
    userId: user2._id,
    fileName: "resume_only.pdf",
    resumeScore: 82,
    skills: ["JavaScript", "TypeScript"],
    missingSkills: ["Kubernetes"],
  });

  await SkillAssessment.create({
    userId: user2._id,
    scores: { DSA: 90, DBMS: 85 },
  });

  // 3. Setup User 3 (Interview available, Resume unavailable)
  await Interview.create({
    userId: user3._id,
    domain: "Node.js",
    score: 85,
    isComplete: true,
    questionsAnswered: 5,
    questionsSkipped: 0,
    totalQuestionsAsked: 5,
  });

  // --- UNIT TESTS FOR SKILL CATEGORIZATION & VALIDATION ---
  console.log("--- UNIT TESTS: Skill Categorization & Thresholds ---");

  const categorized = categorizeSkills({
    DSA: 72,
    DBMS: 80,
    OOP: 85,
    OS: 55,
    CN: 60,
    Programming: 78,
    Cloud: 40,
    "AI/ML": 65,
  });

  // Test Case 4: Skill score below 60 -> Weak
  assert(categorized.weakAreas.includes("OS"), "Test Case 4: OS (55) is classified as weak (< 60)");
  assert(categorized.weakAreas.includes("Cloud"), "Test Case 4: Cloud (40) is classified as weak (< 60)");
  assert(!categorized.weakAreas.includes("DBMS"), "Test Case 4: DBMS (80) is NOT in weakAreas");

  // Test Case 5: Skill score >= 80 -> Strong
  assert(categorized.strongAreas.includes("DBMS"), "Test Case 5: DBMS (80) is classified as strong (>= 80)");
  assert(categorized.strongAreas.includes("OOP"), "Test Case 5: OOP (85) is classified as strong (>= 80)");
  assert(!categorized.strongAreas.includes("OS"), "Test Case 5: OS (55) is NOT in strongAreas");

  // Moderate skills: 60 - 79
  assert(categorized.moderateAreas.includes("DSA"), "DSA (72) is classified as moderate (60-79)");
  assert(categorized.moderateAreas.includes("CN"), "CN (60) is classified as moderate (60-79)");

  // Test Case 6: Validation Error for Invalid Scores
  console.log("\n--- UNIT TESTS: Skill Score Validation ---");
  const val120 = validateSkillScores({ DSA: 120, DBMS: 80 });
  assert(val120.isValid === false, "Test Case 6: Score 120 rejected with validation error");

  const valNeg = validateSkillScores({ DSA: 70, DBMS: -10 });
  assert(valNeg.isValid === false, "Test Case 6: Negative score -10 rejected with validation error");

  const valValid = validateSkillScores({ DSA: 75, DBMS: 85 });
  assert(valValid.isValid === true, "Valid scores (75, 85) accepted successfully");

  // --- HTTP INTEGRATION TESTS ---
  console.log("\n--- HTTP INTEGRATION TESTS: Ephemeral Server ---");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  ✓ Test server listening on port ${port}\n`);

  function makeRequest(pathUrl, method = "GET", postData = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port,
        path: pathUrl,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (postData) {
        const dataStr = JSON.stringify(postData);
        options.headers["Content-Length"] = Buffer.byteLength(dataStr);
      }

      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      });
      req.on("error", reject);
      if (postData) req.write(JSON.stringify(postData));
      req.end();
    });
  }

  // TEST CASE 1: All 3 Sources Available
  console.log("--- TEST CASE 1: Resume + Interview + Skills All Available ---");
  const resCase1 = await makeRequest(`/api/readiness/candidate/${user1._id}`);
  assert(resCase1.statusCode === 200, "HTTP 200 OK");
  assert(resCase1.data.success === true, "Response success === true");
  assert(resCase1.data.data.dataAvailability.resume === true, "dataAvailability.resume === true");
  assert(resCase1.data.data.dataAvailability.interview === true, "dataAvailability.interview === true");
  assert(resCase1.data.data.dataAvailability.skills === true, "dataAvailability.skills === true");
  assert(resCase1.data.data.resume.resumeScore === 78, `Resume score is 78 (got ${resCase1.data.data.resume?.resumeScore})`);
  assert(resCase1.data.data.interview.overallInterviewScore === 75, `Interview score is 75 (got ${resCase1.data.data.interview?.overallInterviewScore})`);
  assert(resCase1.data.data.skills.DSA === 72, `Skill DSA is 72 (got ${resCase1.data.data.skills?.DSA})`);
  assert(resCase1.data.data.weakAreas.includes("OS"), "weakAreas includes 'OS'");
  assert(resCase1.data.data.strongAreas.includes("OOP"), "strongAreas includes 'OOP'");

  // TEST CASE 2: Resume available, Interview unavailable
  console.log("\n--- TEST CASE 2: Resume Available, Interview Unavailable ---");
  const resCase2 = await makeRequest(`/api/readiness/candidate/${user2._id}`);
  assert(resCase2.statusCode === 200, "HTTP 200 OK without crashing");
  assert(resCase2.data.data.dataAvailability.resume === true, "dataAvailability.resume === true");
  assert(resCase2.data.data.dataAvailability.interview === false, "dataAvailability.interview === false");
  assert(resCase2.data.data.interview === null, "interview field is null (no fake score)");
  assert(resCase2.data.data.resume.resumeScore === 82, "Resume score is 82");

  // TEST CASE 3: Interview available, Resume unavailable
  console.log("\n--- TEST CASE 3: Interview Available, Resume Unavailable ---");
  const resCase3 = await makeRequest(`/api/readiness/candidate/${user3._id}`);
  assert(resCase3.statusCode === 200, "HTTP 200 OK without crashing");
  assert(resCase3.data.data.dataAvailability.resume === false, "dataAvailability.resume === false");
  assert(resCase3.data.data.dataAvailability.interview === true, "dataAvailability.interview === true");
  assert(resCase3.data.data.resume === null, "resume field is null (no fake score)");
  assert(resCase3.data.data.interview.overallInterviewScore === 85, "Interview score is 85");

  // TEST CASE 6 (HTTP): Invalid skill score via API
  console.log("\n--- TEST CASE 6 (HTTP): POST /api/readiness/skills with Invalid Score ---");
  const resCase6 = await makeRequest(
    "/api/readiness/skills",
    "POST",
    { candidateId: user1._id, scores: { DSA: 150, Cloud: -20 } }
  );
  assert(resCase6.statusCode === 400, `Rejected with HTTP 400 (got ${resCase6.statusCode})`);
  assert(resCase6.data.success === false, "Response success === false");
  assert(resCase6.data.error.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");

  // TEST CASE 7: Authenticated Candidate via JWT Token
  console.log("\n--- TEST CASE 7: Current Authenticated Candidate (via JWT) ---");
  const resCase7 = await makeRequest(
    "/api/readiness/candidate",
    "GET",
    null,
    { Authorization: `Bearer ${tokenUser1}` }
  );
  assert(resCase7.statusCode === 200, "HTTP 200 OK for authenticated user");
  assert(resCase7.data.data.candidateId === String(user1._id), `Retrieved data for candidate ${user1._id}`);
  assert(resCase7.data.data.resume.resumeScore === 78, "Authenticated candidate resume score matches");

  // POST /api/readiness/skills update test
  console.log("\n--- UPDATE TEST: POST /api/readiness/skills ---");
  const resSkillUpdate = await makeRequest(
    "/api/readiness/skills",
    "POST",
    {
      scores: {
        DSA: 92,
        DBMS: 88,
        OOP: 90,
        OS: 70,
        CN: 75,
        Programming: 85,
        Cloud: 65,
        "AI/ML": 82,
      },
    },
    { Authorization: `Bearer ${tokenUser1}` }
  );
  assert(resSkillUpdate.statusCode === 200, "Skill assessment update succeeded");
  assert(resSkillUpdate.data.data.scores.DSA === 92, "Updated DSA score is 92");
  assert(resSkillUpdate.data.data.strongAreas.includes("DSA"), "DSA is now in strongAreas (>= 80)");

  // Clean up server
  await new Promise((resolve) => server.close(resolve));
  console.log("  ✓ Test server closed cleanly\n");

  console.log("================================================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runDay2Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
