const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: "C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/.env" });

const app = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/index.js");
const User = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/User.js");
const Roadmap = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/Roadmap.js");
const Resume = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/Resume.js");
const SkillAssessment = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/models/SkillAssessment.js");
const {
  generateDeterministicRoadmap,
  generatePersonalizedRoadmap,
} = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/services/roadmap.service.js");

async function runDay3Tests() {
  console.log("================================================================================");
  console.log("DAY 3 TASK: AI PERSONALIZED ROADMAP VERIFICATION SUITE");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-interview-mock";
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB for Day 3 verification\n");

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

  // --- UNIT TESTS: Candidate Type Personalization Grounding ---
  console.log("--- UNIT TESTS: Candidate-Type Tailored Roadmaps ---");

  // Test Case 1: Fresher
  console.log("\n[TEST CASE 1: Fresher Target Profile]");
  const fresherRoadmap = generateDeterministicRoadmap({
    candidateType: "fresher",
    readinessScore: 62,
    weakAreas: ["DSA", "OS"],
    missingSkills: ["Docker"],
    interviewPerformance: { communicationScore: 55, explanationQuality: 50 },
    skillScores: { DSA: 42, OS: 52, DBMS: 82, OOP: 80 },
  });

  assert(fresherRoadmap.candidateType === "fresher", "Candidate type is 'fresher'");
  assert(fresherRoadmap.readinessScore === 62, "Readiness score is 62%");
  assert(fresherRoadmap.summary.toLowerCase().includes("fresher") || fresherRoadmap.summary.toLowerCase().includes("campus"), "Summary addresses fresher/campus context");
  assert(fresherRoadmap.priorities.some((p) => p.skill === "DSA"), "High priority includes weak skill DSA (< 60)");
  assert(fresherRoadmap.priorities.some((p) => p.skill.includes("Communication")), "Includes Communication priority for low verbal score (55)");
  assert(fresherRoadmap.priorities.some((p) => p.skill === "Docker"), "Includes missing resume skill Docker");
  assert(!fresherRoadmap.priorities.some((p) => p.skill === "DBMS"), "Strong skill DBMS (82) is NOT in priorities");
  assert(fresherRoadmap.weeklyPlan.length === 4, "Weekly plan contains exactly 4 weeks");
  assert(fresherRoadmap.weeklyPlan[0].focus.toLowerCase().includes("dsa"), "Week 1 focus emphasizes DSA fundamentals");
  assert(fresherRoadmap.projects.length >= 2, "Recommends at least 2 structured projects");
  assert(fresherRoadmap.certifications.length >= 2, "Recommends at least 2 relevant certifications");

  // Test Case 2: Internship Seeker
  console.log("\n[TEST CASE 2: Internship Seeker Target Profile]");
  const internRoadmap = generateDeterministicRoadmap({
    candidateType: "internship_seeker",
    readinessScore: 68,
    weakAreas: ["CN", "REST APIs"],
    missingSkills: ["REST APIs"],
    interviewPerformance: { communicationScore: 70, explanationQuality: 65 },
    skillScores: { CN: 48, Programming: 75, DSA: 70 },
  });

  assert(internRoadmap.candidateType === "internship_seeker", "Candidate type is 'internship_seeker'");
  assert(internRoadmap.summary.toLowerCase().includes("internship"), "Summary addresses internship positioning");
  assert(internRoadmap.priorities.some((p) => p.skill === "CN"), "Prioritizes weak skill CN");
  assert(internRoadmap.weeklyPlan[0].focus.toLowerCase().includes("rest") || internRoadmap.weeklyPlan[0].focus.toLowerCase().includes("git") || internRoadmap.weeklyPlan[0].focus.toLowerCase().includes("coding"), "Week 1 focus emphasizes practical coding / REST APIs");
  assert(internRoadmap.projects.some((p) => p.description.toLowerCase().includes("rest") || p.description.toLowerCase().includes("api")), "Projects emphasize practical REST APIs/web applications");

  // Test Case 3: Experienced
  console.log("\n[TEST CASE 3: Experienced Target Profile]");
  const expRoadmap = generateDeterministicRoadmap({
    candidateType: "experienced",
    readinessScore: 78,
    weakAreas: ["Cloud", "SystemDesign"],
    missingSkills: ["Kubernetes"],
    interviewPerformance: { communicationScore: 80, explanationQuality: 58 },
    skillScores: { Cloud: 55, DSA: 85, DBMS: 88 },
  });

  assert(expRoadmap.candidateType === "experienced", "Candidate type is 'experienced'");
  assert(expRoadmap.summary.toLowerCase().includes("senior") || expRoadmap.summary.toLowerCase().includes("experienced"), "Summary addresses Senior/Experienced roles");
  assert(expRoadmap.priorities.some((p) => p.skill === "Cloud"), "Prioritizes weak Cloud skill");
  assert(expRoadmap.weeklyPlan[0].focus.toLowerCase().includes("distributed") || expRoadmap.weeklyPlan[0].focus.toLowerCase().includes("architecture"), "Week 1 focus emphasizes distributed systems");
  assert(expRoadmap.projects.some((p) => p.title.toLowerCase().includes("distributed") || p.description.toLowerCase().includes("distributed")), "Projects emphasize high-scale distributed systems");
  assert(expRoadmap.certifications.some((c) => c.name.toLowerCase().includes("architect") || c.name.toLowerCase().includes("kubernetes")), "Certifications target AWS Solutions Architect / CKA");

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

  // Create test user in MongoDB
  const testCandidate = await User.findOneAndUpdate(
    { email: "candidate.day3.roadmap@adaptive.ai" },
    {
      name: "Roadmap Test Candidate",
      email: "candidate.day3.roadmap@adaptive.ai",
      password: "password123",
      candidateType: "fresher",
    },
    { upsert: true, new: true }
  );

  const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey_ai_assistant_2026";
  const tokenCandidate = jwt.sign({ userId: testCandidate._id }, jwtSecret, { expiresIn: "1h" });

  // Clean previous roadmaps
  await Roadmap.deleteMany({ userId: testCandidate._id });

  // TEST CASE 4: POST /api/readiness/roadmap/generate
  console.log("[TEST CASE 4: POST /api/readiness/roadmap/generate]");
  const resGen = await makeRequest(
    "/api/readiness/roadmap/generate",
    "POST",
    {
      candidateId: testCandidate._id,
      candidateType: "internship_seeker",
      readinessScore: 72,
      weakAreas: ["DBMS", "REST APIs"],
      missingSkills: ["Docker"],
      skillScores: { DBMS: 50, DSA: 75, OOP: 80 },
    },
    { Authorization: `Bearer ${tokenCandidate}` }
  );

  assert(resGen.statusCode === 200, "HTTP 200 OK for roadmap generation");
  assert(resGen.data.success === true, "Response success === true");
  assert(resGen.data.data.candidateType === "internship_seeker", "Returned candidateType is internship_seeker");
  assert(Array.isArray(resGen.data.data.priorities), "priorities is an array");
  assert(Array.isArray(resGen.data.data.weeklyPlan), "weeklyPlan is an array with 4 weeks");
  assert(resGen.data.data.weeklyPlan.length === 4, "Weekly plan has 4 weeks");

  // TEST CASE 5: GET /api/readiness/roadmap/:candidateId
  console.log("\n[TEST CASE 5: GET /api/readiness/roadmap/:candidateId]");
  const resGet = await makeRequest(`/api/readiness/roadmap/${testCandidate._id}`);
  assert(resGet.statusCode === 200, "HTTP 200 OK for stored roadmap retrieval");
  assert(resGet.data.success === true, "Roadmap retrieval success === true");
  assert(resGet.data.data.candidateType === "internship_seeker", "Retrieved stored candidateType matches");
  assert(resGet.data.data.priorities.length > 0, "Retrieved roadmap has priorities");

  // TEST CASE 6: GET /api/readiness/roadmap (Authenticated Candidate via JWT)
  console.log("\n[TEST CASE 6: GET /api/readiness/roadmap (JWT Auth)]");
  const resAuthGet = await makeRequest(
    "/api/readiness/roadmap",
    "GET",
    null,
    { Authorization: `Bearer ${tokenCandidate}` }
  );
  assert(resAuthGet.statusCode === 200, "HTTP 200 OK for JWT authenticated roadmap request");
  assert(resAuthGet.data.data.userId === String(testCandidate._id), "Correct candidate roadmap retrieved via JWT");

  // TEST CASE 7: POST /api/readiness/candidate-type
  console.log("\n[TEST CASE 7: POST /api/readiness/candidate-type]");
  const resTypeUpdate = await makeRequest(
    "/api/readiness/candidate-type",
    "POST",
    { candidateType: "experienced" },
    { Authorization: `Bearer ${tokenCandidate}` }
  );
  assert(resTypeUpdate.statusCode === 200, "HTTP 200 OK for candidate type update");
  assert(resTypeUpdate.data.data.candidateType === "experienced", "Updated candidateType is 'experienced'");

  // Verify in MongoDB
  const updatedUserInDb = await User.findById(testCandidate._id);
  assert(updatedUserInDb.candidateType === "experienced", "MongoDB User record confirmed candidateType === 'experienced'");

  // TEST CASE 8: Invalid Candidate Type Validation
  console.log("\n[TEST CASE 8: Invalid Candidate Type Validation]");
  const resInvalidType = await makeRequest(
    "/api/readiness/candidate-type",
    "POST",
    { candidateType: "invalid_type_abc" },
    { Authorization: `Bearer ${tokenCandidate}` }
  );
  assert(resInvalidType.statusCode === 400, "HTTP 400 Bad Request for invalid candidate type");
  assert(resInvalidType.data.error.code === "INVALID_CANDIDATE_TYPE", "Error code is INVALID_CANDIDATE_TYPE");

  // Clean up server
  await new Promise((resolve) => server.close(resolve));
  console.log("\n  ✓ Test server closed cleanly\n");

  console.log("================================================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runDay3Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
