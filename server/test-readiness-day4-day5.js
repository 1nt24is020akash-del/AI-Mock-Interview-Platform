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
} = require("./src/services/readiness.service.js");

async function runDay4Day5Tests() {
  console.log("================================================================================");
  console.log("DAY 4 & DAY 5: PLACEMENT READINESS DASHBOARD & HISTORICAL TRACKING TEST SUITE");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-interview-mock";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
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

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: MATHEMATICAL SPECIFICATION & FORMULA ACCURACY
  // Formula: readinessScore = resumeScore * 0.25 + interviewScore * 0.35 + skillScore * 0.40
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Testing Standard Mathematical Formula & Tier Classification ---");

  // Test Case 1: Resume 80, Interview 85, Skills 82 -> 82.55, Placement Ready
  const c1 = calculateReadinessPure({ resumeScore: 80, interviewScore: 85, skillScore: 82 });
  assert(c1.readinessScore === 82.55, `Case 1 Score: Expected 82.55, got ${c1.readinessScore}`);
  assert(c1.category === "Placement Ready", `Case 1 Category: Expected Placement Ready, got ${c1.category}`);
  assert(c1.scoreBreakdown.resume === 80, "Case 1 Breakdown: Resume is 80");
  assert(c1.scoreBreakdown.interview === 85, "Case 1 Breakdown: Interview is 85");
  assert(c1.scoreBreakdown.technicalSkills === 82, "Case 1 Breakdown: Technical Skills is 82");

  // Test Case 2: Resume 70, Interview 60, Skills 55 -> 60.5, Needs Improvement
  const c2 = calculateReadinessPure({ resumeScore: 70, interviewScore: 60, skillScore: 55 });
  assert(c2.readinessScore === 60.5, `Case 2 Score: Expected 60.5, got ${c2.readinessScore}`);
  assert(c2.category === "Needs Improvement", `Case 2 Category: Expected Needs Improvement, got ${c2.category}`);
  assert(c2.weakAreas.some(w => w.area === "Technical Skills" && w.score === 55), "Case 2 Weak Areas: Identifies Technical Skills (<60)");

  // Test Case 3: Resume 80, Interview 70, Skills 72 -> 73.3, High Potential Candidate
  const c3 = calculateReadinessPure({ resumeScore: 80, interviewScore: 70, skillScore: 72 });
  assert(c3.readinessScore === 73.3, `Case 3 Score: Expected 73.3, got ${c3.readinessScore}`);
  assert(c3.category === "High Potential Candidate", `Case 3 Category: Expected High Potential Candidate, got ${c3.category}`);
  assert(c3.strongAreas.includes("Resume Quality"), "Case 3 Strong Areas: Resume Quality >= 80 recognized");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: HISTORICAL TRACKING & SNAPSHOT STORAGE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing ReadinessHistory Model & Progression Tracking ---");

  // Set up test users
  const testCandidateA = await User.findOneAndUpdate(
    { email: "candidate.day5.a@adaptive.ai" },
    { name: "Candidate Progression A", email: "candidate.day5.a@adaptive.ai", password: "password123", candidateType: "fresher" },
    { upsert: true, new: true }
  );

  const testCandidateB = await User.findOneAndUpdate(
    { email: "candidate.day5.b@adaptive.ai" },
    { name: "Candidate Isolated B", email: "candidate.day5.b@adaptive.ai", password: "password123", candidateType: "experienced" },
    { upsert: true, new: true }
  );

  // Clean previous records for clean tests
  await ReadinessHistory.deleteMany({ userId: { $in: [testCandidateA._id, testCandidateB._id] } });
  await Resume.deleteMany({ userId: { $in: [testCandidateA._id, testCandidateB._id] } });
  await Interview.deleteMany({ userId: { $in: [testCandidateA._id, testCandidateB._id] } });
  await SkillAssessment.deleteMany({ userId: { $in: [testCandidateA._id, testCandidateB._id] } });

  // Edge Case: First-time candidate with zero snapshots
  const emptyHistory = await getReadinessHistory(testCandidateA._id);
  assert(Array.isArray(emptyHistory.history) && emptyHistory.history.length === 0, "First-time user history is empty array");
  assert(emptyHistory.currentScore === null, "First-time user currentScore is null");
  assert(emptyHistory.previousScore === null, "First-time user previousScore is null");
  assert(emptyHistory.improvement === null, "First-time user improvement is null");

  // Record Snapshot 1 for User A: Baseline (score 65)
  const snap1 = await saveReadinessSnapshot(testCandidateA._id, {
    resumeScore: 60,
    interviewScore: 60,
    skillScore: 70,
    communicationScore: 65,
    source: "skill_assessment",
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
  });
  // 60*0.25 + 60*0.35 + 70*0.40 = 15 + 21 + 28 = 64
  assert(snap1 && snap1.score === 64, `Snapshot 1: Recorded score 64, got ${snap1?.score}`);
  assert(snap1.category === "Needs Improvement", `Snapshot 1: Category is Needs Improvement (${snap1?.category})`);

  // Record Snapshot 2 for User A: Improvement (score 73) -> Delta +9
  const snap2 = await saveReadinessSnapshot(testCandidateA._id, {
    resumeScore: 70,
    interviewScore: 70,
    skillScore: 77.5,
    communicationScore: 75,
    source: "interview",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  });
  // 70*0.25 + 70*0.35 + 77.5*0.40 = 17.5 + 24.5 + 31 = 73
  assert(snap2 && snap2.score === 73, `Snapshot 2: Recorded score 73, got ${snap2?.score}`);
  assert(snap2.category === "High Potential Candidate", `Snapshot 2: Category transitioned to High Potential Candidate`);

  // Fetch history for User A: Check delta calculation (+9 improvement)
  const historyA = await getReadinessHistory(testCandidateA._id);
  assert(historyA.history.length === 2, `User A history has 2 records, got ${historyA.history.length}`);
  assert(historyA.currentScore === 73, `Current score is 73, got ${historyA.currentScore}`);
  assert(historyA.previousScore === 64, `Previous score is 64, got ${historyA.previousScore}`);
  assert(historyA.improvement === 9, `Improvement delta is +9 (+${historyA.improvement})`);

  // Record Snapshot 3 for User A: Drop (score 66) -> Delta -7
  const snap3 = await saveReadinessSnapshot(testCandidateA._id, {
    resumeScore: 60,
    interviewScore: 60,
    skillScore: 75,
    source: "interview",
    createdAt: new Date(),
  });
  // 60*0.25 + 60*0.35 + 75*0.40 = 15 + 21 + 30 = 66
  assert(snap3 && snap3.score === 66, `Snapshot 3: Recorded score 66, got ${snap3?.score}`);

  const historyAUpdated = await getReadinessHistory(testCandidateA._id);
  assert(historyAUpdated.history.length === 3, "User A history now has 3 records");
  assert(historyAUpdated.currentScore === 66, "Current score updated to 66");
  assert(historyAUpdated.previousScore === 73, "Previous score updated to 73");
  assert(historyAUpdated.improvement === -7, `Negative improvement delta correctly reflects -7 (${historyAUpdated.improvement})`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: MULTI-USER ISOLATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Candidate Data Isolation (Multi-User Security) ---");

  // User B creates a snapshot with score 85
  await saveReadinessSnapshot(testCandidateB._id, {
    resumeScore: 85,
    interviewScore: 85,
    skillScore: 85,
    source: "resume",
  });

  const historyB = await getReadinessHistory(testCandidateB._id);
  assert(historyB.history.length === 1, `User B has exactly 1 snapshot, got ${historyB.history.length}`);
  assert(historyB.currentScore === 85, `User B current score is 85, got ${historyB.currentScore}`);

  // Verify User A still only sees their 3 records and cannot access User B's score
  const checkUserAIsolation = await getReadinessHistory(testCandidateA._id);
  assert(checkUserAIsolation.history.length === 3, "User A history remains strictly isolated with 3 snapshots");
  assert(!checkUserAIsolation.history.some(h => String(h.userId) !== String(testCandidateA._id)), "No foreign snapshots present in User A's history");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 4: HTTP API ENDPOINTS VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing HTTP API Endpoints ---");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey_ai_assistant_2026";
  const tokenA = jwt.sign({ userId: testCandidateA._id }, jwtSecret, { expiresIn: "1h" });

  async function apiCall(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const dataStr = body ? JSON.stringify(body) : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
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

  // 4.1 POST /api/readiness/calculate (Pure calculation endpoint)
  const calcRes = await apiCall("POST", "/api/readiness/calculate", {
    resumeScore: 80,
    interviewScore: 85,
    skillScore: 82,
  });
  assert(calcRes.status === 200, `POST /calculate returned HTTP 200 (got ${calcRes.status})`);
  assert(calcRes.body.data.readinessScore === 82.55, `POST /calculate returned 82.55 (got ${calcRes.body.data.readinessScore})`);
  assert(calcRes.body.data.category === "Placement Ready", "POST /calculate classified as Placement Ready");

  // 4.2 GET /api/readiness/history (Authenticated candidate history)
  const histRes = await apiCall("GET", "/api/readiness/history", null, tokenA);
  assert(histRes.status === 200, `GET /history returned HTTP 200 (got ${histRes.status})`);
  assert(histRes.body.data.history.length === 3, `GET /history returned 3 historical snapshots`);
  assert(histRes.body.data.currentScore === 66, `GET /history returned currentScore = 66`);
  assert(histRes.body.data.previousScore === 73, `GET /history returned previousScore = 73`);
  assert(histRes.body.data.improvement === -7, `GET /history returned improvement = -7`);

  // 4.3 POST /api/readiness/history (Manual / explicit snapshot recording)
  const newSnapRes = await apiCall("POST", "/api/readiness/history", {
    resumeScore: 90,
    interviewScore: 88,
    skillScore: 85,
    communicationScore: 90,
    source: "manual",
  }, tokenA);
  assert(newSnapRes.status === 201, `POST /history returned HTTP 201 Created (got ${newSnapRes.status})`);
  // 90*0.25 + 88*0.35 + 85*0.40 = 22.5 + 30.8 + 34 = 87.3
  assert(newSnapRes.body.data.score === 87.3, `POST /history recorded score 87.3 (got ${newSnapRes.body.data.score})`);
  assert(newSnapRes.body.data.category === "Placement Ready", "POST /history classified as Placement Ready");

  // 4.4 GET /api/readiness/current (Current Readiness profile with weak areas & recommendations)
  // First seed User A with SkillAssessment and Resume to test real breakdown
  await SkillAssessment.create({
    userId: testCandidateA._id,
    scores: { DSA: 55, DBMS: 85, OOP: 80, OS: 50, CN: 75, Programming: 82, Cloud: 58, "AI/ML": 65 },
  });

  await Resume.create({
    userId: testCandidateA._id,
    fileName: "candidate_a.pdf",
    resumeScore: 78,
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    missingSkills: ["Docker", "Kubernetes"],
  });

  const currentRes = await apiCall("GET", "/api/readiness/current", null, tokenA);
  assert(currentRes.status === 200, `GET /current returned HTTP 200 (got ${currentRes.status})`);
  assert(typeof currentRes.body.data.readinessScore === "number", `GET /current has readinessScore (${currentRes.body.data.readinessScore})`);
  assert(currentRes.body.data.scoreBreakdown.resume === 78, "GET /current breakdown includes real resumeScore (78)");
  assert(currentRes.body.data.weakAreas.length > 0, "GET /current identified weak areas");
  // Check weak areas sorted weakest first
  const weakScores = currentRes.body.data.weakAreas.map(w => w.score);
  const isSorted = weakScores.every((val, i, arr) => !i || arr[i - 1] <= val);
  assert(isSorted, `Weak areas are sorted weakest first: ${weakScores.join(", ")}`);
  assert(currentRes.body.data.weakAreas[0].recommendation !== undefined, "Weak areas include actionable recommendations");
  assert(currentRes.body.data.strongAreas.includes("DBMS"), "Strong areas include DBMS (85 >= 80)");

  server.close();

  console.log("\n================================================================================");
  console.log(`DAY 4 & DAY 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDay4Day5Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
