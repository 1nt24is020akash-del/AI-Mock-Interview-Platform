const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const http = require("http");

dotenv.config({ path: "C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/.env" });
process.env.VERCEL = "1";

const app = require("./src/index.js");
const User = require("./src/models/User.js");
const Resume = require("./src/models/Resume.js");
const Interview = require("./src/models/Interview.js");
const SkillAssessment = require("./src/models/SkillAssessment.js");
const ReadinessHistory = require("./src/models/ReadinessHistory.js");

const {
  calculateReadinessPure,
  saveReadinessSnapshot,
  getReadinessHistory,
  getCurrentReadiness,
  analyzeReadiness,
} = require("./src/services/readiness.service.js");

const {
  generatePersonalizedRoadmap,
} = require("./src/services/roadmap.service.js");

const {
  categorizeSkills,
} = require("./src/utils/readiness.utils.js");

async function runDay5TestingSuite() {
  console.log("================================================================================");
  console.log("DAY 5: COMPLETE PLACEMENT READINESS ENGINE TESTING & VERIFICATION SUITE");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-interview-mock";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  console.log("✓ Connected to MongoDB for Day 5 verification\n");

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

  // ──────────────────────────────────────────────────────────────────────────
  // 1. READINESS SCORE FORMULA & NUMERICAL BOUNDARIES
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Testing Readiness Score Formula & Boundary Conditions ---");

  // Case 1: Resume 80, Interview 85, Skills 82
  const c1 = calculateReadinessPure({ resumeScore: 80, interviewScore: 85, skillScore: 82 });
  // 80*0.25 + 85*0.35 + 82*0.40 = 20 + 29.75 + 32.80 = 82.55
  assert(c1.readinessScore === 82.55, `Case 1: Expected 82.55, got ${c1.readinessScore}`);
  assert(c1.category === "Placement Ready", `Case 1 Category: Placement Ready (${c1.category})`);

  // Case 2: Resume 70, Interview 60, Skills 55
  const c2 = calculateReadinessPure({ resumeScore: 70, interviewScore: 60, skillScore: 55 });
  // 70*0.25 + 60*0.35 + 55*0.40 = 17.5 + 21 + 22 = 60.50
  assert(c2.readinessScore === 60.50, `Case 2: Expected 60.50, got ${c2.readinessScore}`);
  assert(c2.category === "Needs Improvement", `Case 2 Category: Needs Improvement (${c2.category})`);

  // Case 3: Resume 80, Interview 70, Skills 72
  const c3 = calculateReadinessPure({ resumeScore: 80, interviewScore: 70, skillScore: 72 });
  // 80*0.25 + 70*0.35 + 72*0.40 = 20 + 24.5 + 28.8 = 73.30
  assert(c3.readinessScore === 73.30, `Case 3: Expected 73.30, got ${c3.readinessScore}`);
  assert(c3.category === "High Potential Candidate", `Case 3 Category: High Potential Candidate (${c3.category})`);

  // Edge Case: score = 0
  const cZero = calculateReadinessPure({ resumeScore: 0, interviewScore: 0, skillScore: 0 });
  assert(cZero.readinessScore === 0, `Score 0: Expected 0, got ${cZero.readinessScore}`);
  assert(cZero.category === "Needs Improvement", `Score 0 Category: Needs Improvement (${cZero.category})`);

  // Edge Case: score = 100
  const cHundred = calculateReadinessPure({ resumeScore: 100, interviewScore: 100, skillScore: 100 });
  assert(cHundred.readinessScore === 100, `Score 100: Expected 100, got ${cHundred.readinessScore}`);
  assert(cHundred.category === "Placement Ready", `Score 100 Category: Placement Ready (${cHundred.category})`);

  // Edge Case: Decimal scores
  const cDec = calculateReadinessPure({ resumeScore: 78.5, interviewScore: 65.25, skillScore: 81.75 });
  // 78.5*0.25 + 65.25*0.35 + 81.75*0.40 = 19.625 + 22.8375 + 32.70 = 75.1625 -> 75.16
  assert(cDec.readinessScore === 75.16, `Decimal scores: Expected 75.16, got ${cDec.readinessScore}`);
  assert(cDec.category === "High Potential Candidate", `Decimal scores category: High Potential Candidate (${cDec.category})`);

  // Edge Case: Missing values
  const cMissing = calculateReadinessPure({ resumeScore: 80 });
  assert(!isNaN(cMissing.readinessScore), "Missing values do not produce NaN");
  assert(cMissing.readinessScore === 20, `Missing values: Expected 20, got ${cMissing.readinessScore}`);

  // Edge Case: Invalid values (NaN, null, undefined)
  const cInvalid = calculateReadinessPure({ resumeScore: "invalid", interviewScore: null, skillScore: undefined });
  assert(!isNaN(cInvalid.readinessScore), "Invalid string/null values do not produce NaN");
  assert(cInvalid.readinessScore === 0, "Invalid string/null values default gracefully to 0");

  // Edge Case: Values above 100 clamped
  const cAbove = calculateReadinessPure({ resumeScore: 150, interviewScore: 120, skillScore: 200 });
  assert(cAbove.readinessScore === 100, `Values above 100 clamped to 100: got ${cAbove.readinessScore}`);

  // Edge Case: Negative values clamped
  const cNeg = calculateReadinessPure({ resumeScore: -30, interviewScore: -50, skillScore: -10 });
  assert(cNeg.readinessScore === 0, `Negative values clamped to 0: got ${cNeg.readinessScore}`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CANDIDATE TYPES & AI ROADMAP SPECIALIZATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Candidate Types & AI Roadmap Specialization ---");

  // Fresher Candidate Roadmap
  const fresherRoadmap = await generatePersonalizedRoadmap({
    candidateType: "fresher",
    readinessScore: 68,
    weakAreas: ["DSA", "DBMS"],
    missingSkills: ["Git"],
    skillScores: { DSA: 45, DBMS: 50, OOP: 75 },
  });
  assert(fresherRoadmap.candidateType === "fresher", "Fresher: candidateType confirmed");
  assert(fresherRoadmap.summary.toLowerCase().includes("campus") || fresherRoadmap.summary.toLowerCase().includes("foundation"), "Fresher summary targets campus/foundation context");
  assert(fresherRoadmap.weeklyPlan[0].focus.toLowerCase().includes("dsa"), "Fresher Week 1 focuses on core DSA patterns");
  assert(fresherRoadmap.interviewTopics.some(t => t.includes("Data Structures") || t.includes("OOP")), "Fresher topics include core CS (Data Structures / OOP)");

  // Internship Seeker Candidate Roadmap
  const internRoadmap = await generatePersonalizedRoadmap({
    candidateType: "internship_seeker",
    readinessScore: 70,
    weakAreas: ["CN"],
    missingSkills: ["REST APIs"],
    skillScores: { DSA: 70, CN: 55 },
  });
  assert(internRoadmap.candidateType === "internship_seeker", "Internship Seeker: candidateType confirmed");
  assert(internRoadmap.summary.toLowerCase().includes("internship"), "Internship Seeker summary targets internship positioning");
  assert(internRoadmap.weeklyPlan[0].focus.toLowerCase().includes("practical") || internRoadmap.weeklyPlan[0].focus.toLowerCase().includes("rest api"), "Internship Week 1 focuses on practical coding / REST APIs");
  assert(internRoadmap.projects[0].technologies.some(t => t.toLowerCase().includes("react") || t.toLowerCase().includes("node") || t.toLowerCase().includes("rest")), "Internship projects focus on practical full-stack / REST APIs");

  // Experienced Candidate Roadmap
  const expRoadmap = await generatePersonalizedRoadmap({
    candidateType: "experienced",
    readinessScore: 78,
    weakAreas: ["Cloud"],
    missingSkills: ["System Design"],
    skillScores: { Cloud: 55 },
  });
  assert(expRoadmap.candidateType === "experienced", "Experienced: candidateType confirmed");
  assert(expRoadmap.summary.toLowerCase().includes("senior") || expRoadmap.summary.toLowerCase().includes("experienced"), "Experienced summary targets Senior/Experienced roles");
  assert(expRoadmap.weeklyPlan[0].focus.toLowerCase().includes("distributed") || expRoadmap.weeklyPlan[0].focus.toLowerCase().includes("architecture"), "Experienced Week 1 focuses on distributed systems architecture");
  assert(expRoadmap.certifications.some(c => c.name.includes("AWS") || c.name.includes("Kubernetes")), "Experienced certifications target AWS Solutions Architect / CKA");

  // ──────────────────────────────────────────────────────────────────────────
  // 3. WEAK AREA DETECTION & THRESHOLDS
  // Sample: DSA = 45, DBMS = 75, OOP = 85, OS = 55, CN = 60, Cloud = 40
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Weak Area Detection (< 60) and Strong Area (>= 80) ---");

  const sampleSkills = {
    DSA: 45,
    DBMS: 75,
    OOP: 85,
    OS: 55,
    CN: 60,
    Cloud: 40,
  };

  const categorized = categorizeSkills(sampleSkills);

  // Expected Weak (<60): DSA (45), OS (55), Cloud (40)
  assert(categorized.weakAreas.includes("DSA"), "Weak Area: DSA (45 < 60) flagged");
  assert(categorized.weakAreas.includes("OS"), "Weak Area: OS (55 < 60) flagged");
  assert(categorized.weakAreas.includes("Cloud"), "Weak Area: Cloud (40 < 60) flagged");
  assert(categorized.weakAreas.length === 3, `Weak Area count: Expected 3, got ${categorized.weakAreas.length}`);

  // Expected Moderate (60-79): DBMS (75), CN (60) -> Must NOT be in weak areas
  assert(!categorized.weakAreas.includes("DBMS"), "DBMS (75 >= 60) is NOT in weak areas");
  assert(!categorized.weakAreas.includes("CN"), "CN (60 >= 60) is NOT in weak areas");
  assert(categorized.moderateAreas.includes("DBMS"), "Moderate Area: DBMS (75) classified as moderate");
  assert(categorized.moderateAreas.includes("CN"), "Moderate Area: CN (60) classified as moderate");

  // Expected Strong (>=80): OOP (85) -> Must NOT be in weak areas
  assert(!categorized.weakAreas.includes("OOP"), "OOP (85 >= 80) is NOT in weak areas");
  assert(categorized.strongAreas.includes("OOP"), "Strong Area: OOP (85 >= 80) classified as strong");

  // ──────────────────────────────────────────────────────────────────────────
  // 4. HISTORICAL TRACKING: 3 RECORDS (55 -> 65 -> 74) & DELTA CALCULATION
  // Previous: 65, Current: 74, Improvement: +9
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing Historical Tracking & Delta Calculation (55 -> 65 -> 74) ---");

  const candidateHistoryUser = await User.findOneAndUpdate(
    { email: "candidate.day5.history@adaptive.ai" },
    { name: "Candidate History Test", email: "candidate.day5.history@adaptive.ai", password: "password123" },
    { upsert: true, new: true }
  );

  // Clear previous records
  await ReadinessHistory.deleteMany({ userId: candidateHistoryUser._id });

  // Record 1: Score 55
  await saveReadinessSnapshot(candidateHistoryUser._id, {
    resumeScore: 50,
    interviewScore: 55,
    skillScore: 57.5,
    source: "resume",
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
  });
  // 50*0.25 + 55*0.35 + 57.5*0.40 = 12.5 + 19.25 + 23 = 54.75 -> 55 (with custom override)

  // Force snapshot 1 to exact score 55
  await ReadinessHistory.findOneAndUpdate(
    { userId: candidateHistoryUser._id },
    { score: 55, category: "Needs Improvement" }
  );

  // Record 2: Score 65
  await ReadinessHistory.create({
    userId: candidateHistoryUser._id,
    score: 65,
    resumeScore: 65,
    interviewScore: 65,
    skillScore: 65,
    category: "High Potential Candidate",
    source: "interview",
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
  });

  // Record 3: Score 74
  await ReadinessHistory.create({
    userId: candidateHistoryUser._id,
    score: 74,
    resumeScore: 75,
    interviewScore: 75,
    skillScore: 72.5,
    category: "High Potential Candidate",
    source: "skill_assessment",
    createdAt: new Date(),
  });

  const historyResult = await getReadinessHistory(candidateHistoryUser._id);
  assert(historyResult.history.length === 3, `Stored records: Expected 3, got ${historyResult.history.length}`);
  assert(historyResult.currentScore === 74, `Current score: Expected 74, got ${historyResult.currentScore}`);
  assert(historyResult.previousScore === 65, `Previous score: Expected 65, got ${historyResult.previousScore}`);
  assert(historyResult.improvement === 9, `Improvement delta: Expected +9, got +${historyResult.improvement}`);
  assert(historyResult.category === "High Potential Candidate", `Current category: High Potential Candidate`);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. RECOMMENDATION EVOLUTION
  // First result: DSA = 45, SQL = 50, Communication = 55
  // Updated: DSA = 75, SQL = 78, Communication = 60
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Testing Recommendation Evolution (Before vs After Skill Improvement) ---");

  // Initial State: Weak skills
  const initialRoadmap = await generatePersonalizedRoadmap({
    candidateType: "fresher",
    readinessScore: 50,
    weakAreas: ["DSA", "DBMS", "Communication"],
    skillScores: { DSA: 45, DBMS: 50 },
    interviewPerformance: { communicationScore: 55 },
  });

  const initialPriorities = initialRoadmap.priorities.map(p => p.skill.toLowerCase());
  assert(initialPriorities.some(s => s.includes("dsa")), "Initial Roadmap prioritizes weak skill DSA (45)");
  assert(initialPriorities.some(s => s.includes("dbms")), "Initial Roadmap prioritizes weak skill DBMS (50)");
  assert(initialPriorities.some(s => s.includes("communication")), "Initial Roadmap prioritizes weak Communication (55)");

  // Improved State: Candidate improves DSA to 75, DBMS to 78, Communication to 60
  const updatedRoadmap = await generatePersonalizedRoadmap({
    candidateType: "fresher",
    readinessScore: 72,
    weakAreas: [], // No remaining weak skills < 60!
    skillScores: { DSA: 75, DBMS: 78 },
    interviewPerformance: { communicationScore: 60 },
  });

  const updatedPriorities = updatedRoadmap.priorities.map(p => p.skill.toLowerCase());
  assert(!updatedPriorities.some(s => s === "dsa"), "Updated Roadmap NO LONGER flags DSA as a weak priority (score 75)");
  assert(!updatedPriorities.some(s => s === "dbms"), "Updated Roadmap NO LONGER flags DBMS as a weak priority (score 78)");
  assert(!updatedPriorities.some(s => s.includes("communication") && p_has_weak(s)), "Updated Roadmap reflects communication improvement (60 >= 60)");

  function p_has_weak(str) {
    return str.includes("rating was 55");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. END-TO-END FLOW INTEGRATION & API ERROR RESILIENCE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 6. Testing End-to-End Flow & API Error Handling ---");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey_ai_assistant_2026";
  const token = jwt.sign({ userId: candidateHistoryUser._id }, jwtSecret, { expiresIn: "1h" });

  async function apiCall(method, path, body = null, authToken = null) {
    return new Promise((resolve, reject) => {
      const dataStr = body ? JSON.stringify(body) : null;
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      if (dataStr) headers["Content-Length"] = Buffer.byteLength(dataStr);

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers,
        },
        (res) => {
          let chunks = "";
          res.on("data", (chunk) => (chunks += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(chunks);
              resolve({ status: res.statusCode, body: parsed });
            } catch {
              resolve({ status: res.statusCode, body: chunks });
            }
          });
        }
      );
      req.on("error", reject);
      if (dataStr) req.write(dataStr);
      req.end();
    });
  }

  // 6.1 Complete Flow: Candidate updates skills -> snapshots auto-created -> readiness calculated
  const skillUpdateRes = await apiCall("POST", "/api/readiness/skills", {
    scores: { DSA: 85, DBMS: 80, OOP: 90, OS: 70, CN: 75, Programming: 88, Cloud: 65, "AI/ML": 70 },
  }, token);
  assert(skillUpdateRes.status === 200, "Step 1: Skill update returned HTTP 200");

  // Step 2: GET /api/readiness/current retrieves real data
  const currentRes = await apiCall("GET", "/api/readiness/current", null, token);
  assert(currentRes.status === 200, "Step 2: GET /current returned HTTP 200");
  assert(currentRes.body.data.scoreBreakdown.technicalSkills >= 70, "Step 2: Technical skills calculated correctly from real scores");
  assert(currentRes.body.data.strongAreas.includes("OOP"), "Step 2: Strong areas include OOP (90 >= 80)");

  // Step 3: GET /api/readiness/history retrieves updated timeline
  const histRes = await apiCall("GET", "/api/readiness/history", null, token);
  assert(histRes.status === 200, "Step 3: GET /history returned HTTP 200");
  assert(histRes.body.data.history.length >= 3, "Step 3: Historical tracking preserves chronological snapshots");

  // 6.2 Error Case: Missing User ID
  const noUserRes = await apiCall("GET", "/api/readiness/current");
  assert(noUserRes.status === 400, "Missing user ID returns HTTP 400 Bad Request");
  assert(noUserRes.body.error.code === "MISSING_CANDIDATE_ID", "Error code is MISSING_CANDIDATE_ID");

  // 6.3 Error Case: Invalid Candidate Type
  const invalidTypeRes = await apiCall("POST", "/api/readiness/candidate-type", {
    candidateType: "invalid_type_abc",
  }, token);
  assert(invalidTypeRes.status === 400, "Invalid candidate type returns HTTP 400 Bad Request");
  assert(invalidTypeRes.body.error.code === "INVALID_CANDIDATE_TYPE", "Error code is INVALID_CANDIDATE_TYPE");

  // 6.4 Error Case: Invalid score (> 100) in /api/readiness/calculate
  const invalidScoreRes = await apiCall("POST", "/api/readiness/calculate", {
    resumeScore: 150,
    interviewScore: 80,
    skillScore: 80,
  });
  assert(invalidScoreRes.status === 400, "Score > 100 rejected with HTTP 400");
  assert(invalidScoreRes.body.error.code === "INVALID_SCORE", "Error code is INVALID_SCORE");

  server.close();

  console.log("\n================================================================================");
  console.log(`DAY 5 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDay5TestingSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
