const http = require("http");
const path = require("path");

const {
  calculateReadinessScore,
  classifyCandidate,
  normalizeSkills,
  detectWeakAreas,
  validateReadinessInput,
} = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/utils/readiness.utils.js");

const {
  analyzeReadiness,
} = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/services/readiness.service.js");

const {
  READINESS_WEIGHTS,
  READINESS_THRESHOLDS,
  READINESS_CATEGORIES,
} = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/config/readiness.config.js");

const app = require("C:/Users/Admin/Downloads/ai-assistant-main/ai-assistant-main/server/src/index.js");

async function runTestSuite() {
  console.log("================================================================================");
  console.log("DAY 1 — AI PLACEMENT READINESS ENGINE: COMPREHENSIVE VERIFICATION SUITE");
  console.log("================================================================================\n");

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

  // --- UNIT TESTS ---

  // TEST 1: High candidate
  console.log("--- TEST 1: High-Score Candidate ---");
  const t1 = analyzeReadiness({
    resumeScore: 90,
    interviewScore: 85,
    skillScore: 90,
    communicationScore: 90,
    candidateType: "fresher",
  });
  // 90*0.25 + 85*0.35 + 90*0.40 = 22.5 + 29.75 + 36.0 = 88.25
  assert(t1.success === true, "Analysis succeeded");
  assert(t1.data.overallScore === 88.25, `Expected 88.25, got ${t1.data.overallScore}`);
  assert(t1.data.category === READINESS_CATEGORIES.PLACEMENT_READY, `Expected Placement Ready, got ${t1.data.category}`);
  assert(t1.data.weakAreas.length === 0, "No weak areas flagged for high performer");

  // TEST 2: Medium candidate
  console.log("\n--- TEST 2: Medium-Score Candidate ---");
  const t2 = analyzeReadiness({
    resumeScore: 75,
    interviewScore: 70,
    skillScore: 65,
    candidateType: "internship_seeker",
  });
  // 75*0.25 + 70*0.35 + 65*0.40 = 18.75 + 24.5 + 26.0 = 69.25
  assert(t2.success === true, "Analysis succeeded");
  assert(t2.data.overallScore === 69.25, `Expected 69.25, got ${t2.data.overallScore}`);
  assert(t2.data.category === READINESS_CATEGORIES.HIGH_POTENTIAL, `Expected High Potential Candidate, got ${t2.data.category}`);

  // TEST 3: Weak candidate
  console.log("\n--- TEST 3: Low-Score Candidate ---");
  const t3 = analyzeReadiness({
    resumeScore: 50,
    interviewScore: 45,
    skillScore: 40,
    communicationScore: 45,
    candidateType: "experienced",
  });
  // 50*0.25 + 45*0.35 + 40*0.40 = 12.5 + 15.75 + 16.0 = 44.25
  assert(t3.success === true, "Analysis succeeded");
  assert(t3.data.overallScore === 44.25, `Expected 44.25, got ${t3.data.overallScore}`);
  assert(t3.data.category === READINESS_CATEGORIES.NEEDS_IMPROVEMENT, `Expected Needs Improvement, got ${t3.data.category}`);
  assert(t3.data.weakAreas.includes("Resume Quality"), "Flags Resume Quality");
  assert(t3.data.weakAreas.includes("Interview Performance"), "Flags Interview Performance");
  assert(t3.data.weakAreas.includes("Technical Skills"), "Flags Technical Skills");
  assert(t3.data.weakAreas.includes("Communication Skills"), "Flags Communication Skills (< 50)");

  // TEST 4: Boundary: Score 80.00
  console.log("\n--- TEST 4: Boundary Score 80.00 ---");
  const b80 = classifyCandidate(80.0);
  assert(b80 === READINESS_CATEGORIES.PLACEMENT_READY, `Score 80.00 -> ${b80}`);

  // TEST 5: Boundary: Score 79.99
  console.log("\n--- TEST 5: Boundary Score 79.99 ---");
  const b79 = classifyCandidate(79.99);
  assert(b79 === READINESS_CATEGORIES.HIGH_POTENTIAL, `Score 79.99 -> ${b79}`);

  // TEST 6: Boundary: Score 65.00
  console.log("\n--- TEST 6: Boundary Score 65.00 ---");
  const b65 = classifyCandidate(65.0);
  assert(b65 === READINESS_CATEGORIES.HIGH_POTENTIAL, `Score 65.00 -> ${b65}`);

  // TEST 7: Boundary: Score 64.99
  console.log("\n--- TEST 7: Boundary Score 64.99 ---");
  const b64 = classifyCandidate(64.99);
  assert(b64 === READINESS_CATEGORIES.NEEDS_IMPROVEMENT, `Score 64.99 -> ${b64}`);

  // TEST 8: Invalid score (> 100)
  console.log("\n--- TEST 8: Validation Error - Score > 100 ---");
  const inv1 = validateReadinessInput({
    resumeScore: 120,
    interviewScore: 75,
    skillScore: 80,
  });
  assert(inv1.isValid === false, "Score > 100 rejected");
  assert(inv1.errors.some((e) => e.includes("resumeScore")), "Error message mentions resumeScore");

  // TEST 9: Negative score (< 0)
  console.log("\n--- TEST 9: Validation Error - Negative Score ---");
  const inv2 = validateReadinessInput({
    resumeScore: 75,
    interviewScore: 80,
    skillScore: -5,
  });
  assert(inv2.isValid === false, "Score < 0 rejected");
  assert(inv2.errors.some((e) => e.includes("skillScore")), "Error message mentions skillScore");

  // TEST 10: Non-numeric score
  console.log("\n--- TEST 10: Validation Error - Non-Numeric Score ---");
  const inv3 = validateReadinessInput({
    resumeScore: "hello",
    interviewScore: 80,
    skillScore: 70,
  });
  assert(inv3.isValid === false, "String score rejected");

  // TEST 11: Missing required score
  console.log("\n--- TEST 11: Validation Error - Missing Required Score ---");
  const inv4 = validateReadinessInput({
    resumeScore: 80,
    skillScore: 70,
  });
  assert(inv4.isValid === false, "Missing interviewScore rejected");

  // TEST 12: Duplicate missing skills normalization
  console.log("\n--- TEST 12: Duplicate Skills Normalization ---");
  const rawSkills = [" SQL ", "Docker", "SQL", "", "System Design", "docker "];
  const normalized = normalizeSkills(rawSkills);
  assert(normalized.length === 3, `Expected 3 normalized skills, got ${normalized.length}`);
  assert(normalized[0] === "SQL", `Skill 0 is 'SQL' (got '${normalized[0]}')`);
  assert(normalized[1] === "Docker", `Skill 1 is 'Docker' (got '${normalized[1]}')`);
  assert(normalized[2] === "System Design", `Skill 2 is 'System Design' (got '${normalized[2]}')`);

  // TEST 13: Communication threshold gradation (50-59 vs < 50)
  console.log("\n--- TEST 13: Communication Threshold Gradation ---");
  const weakComm = detectWeakAreas({
    resumeScore: 80,
    interviewScore: 80,
    skillScore: 80,
    communicationScore: 55,
  });
  assert(weakComm.includes("Communication"), "Score 55 flags 'Communication'");
  assert(!weakComm.includes("Communication Skills"), "Score 55 does NOT flag 'Communication Skills'");

  // TEST 14: Prompt example calculation exact match
  console.log("\n--- TEST 14: Specification Example Verification ---");
  // Resume = 78, Interview = 72, Skill = 65 -> 78*0.25 (19.50) + 72*0.35 (25.20) + 65*0.40 (26.00) = 70.70
  const specExample = analyzeReadiness({
    resumeScore: 78,
    interviewScore: 72,
    skillScore: 65,
    technicalSkills: ["JavaScript", "React", "Node.js"],
    communicationScore: 60,
    missingSkills: ["SQL", "Docker", "System Design"],
    candidateType: "fresher",
  });
  assert(specExample.data.overallScore === 70.7, `Expected 70.7, got ${specExample.data.overallScore}`);
  assert(specExample.data.category === "High Potential Candidate", `Expected High Potential Candidate, got ${specExample.data.category}`);
  assert(specExample.data.weights.resume === 0.25, "Weight resume = 0.25");
  assert(specExample.data.weights.interview === 0.35, "Weight interview = 0.35");
  assert(specExample.data.weights.skillAssessment === 0.40, "Weight skillAssessment = 0.40");

  // --- HTTP INTEGRATION TESTS ---
  console.log("\n--- TEST 15 & 16: Actual HTTP API Endpoint POST /api/readiness/analyze ---");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  ✓ Ephemeral test server listening on port ${port}`);

  function makePostRequest(pathUrl, postData) {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(postData);
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: pathUrl,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(dataStr),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ statusCode: res.statusCode, raw: body });
            }
          });
        }
      );
      req.on("error", reject);
      req.write(dataStr);
      req.end();
    });
  }

  // 15. Valid HTTP request
  const httpResValid = await makePostRequest("/api/readiness/analyze", {
    resumeScore: 78,
    interviewScore: 72,
    skillScore: 65,
    technicalSkills: ["JavaScript", "React", "Node.js"],
    communicationScore: 60,
    missingSkills: ["SQL", "Docker", "System Design"],
    candidateType: "fresher",
  });

  assert(httpResValid.statusCode === 200, `HTTP status 200 (got ${httpResValid.statusCode})`);
  assert(httpResValid.data.success === true, "Response success === true");
  assert(httpResValid.data.data.overallScore === 70.7, `HTTP overallScore === 70.7 (got ${httpResValid.data.data.overallScore})`);
  assert(httpResValid.data.data.category === "High Potential Candidate", "HTTP category === High Potential Candidate");
  assert(httpResValid.data.data.candidateType === "fresher", "HTTP candidateType preserved");

  // 16. Invalid HTTP request (Validation Error)
  const httpResInvalid = await makePostRequest("/api/readiness/analyze", {
    resumeScore: -10,
    interviewScore: 80,
    skillScore: 70,
  });

  assert(httpResInvalid.statusCode === 400, `HTTP status 400 on invalid input (got ${httpResInvalid.statusCode})`);
  assert(httpResInvalid.data.success === false, "Response success === false");
  assert(httpResInvalid.data.error.code === "VALIDATION_ERROR", `Error code VALIDATION_ERROR (got ${httpResInvalid.data.error.code})`);

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

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
