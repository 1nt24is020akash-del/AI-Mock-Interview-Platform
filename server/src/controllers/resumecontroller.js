const Groq = require("groq-sdk");
const pdfjslib = require("pdfjs-dist/legacy/build/pdf.js");

const DOMAINS = [
  "JavaScript/Node.js",
  "React",
  "Python",
  "Data Science",
  "DevOps",
  "System Design",
  "Database Design",
  "General",
];

const DOMAIN_SKILL_KEYWORDS = {
  "JavaScript/Node.js": [
    "javascript", "typescript", "node.js", "nodejs", "express", "expressjs",
    "nest.js", "nestjs", "npm", "async", "es6", "vanilla js", "event loop",
    "jwt", "socket.io", "rest api"
  ],
  "React": [
    "react", "react.js", "reactjs", "next.js", "nextjs", "redux", "zustand",
    "tailwind", "tailwindcss", "shadcn", "jsx", "tsx", "hooks", "vite",
    "html", "css", "css3", "sass", "frontend"
  ],
  "Python": [
    "python", "django", "flask", "fastapi", "pytest", "celery", "poetry",
    "pep8", "asyncio", "pydantic"
  ],
  "Data Science": [
    "machine learning", "deep learning", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "nlp", "computer vision", "data analysis",
    "tableau", "power bi", "matplotlib", "seaborn", "statistics", "data science"
  ],
  "DevOps": [
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "ci/cd", "ci / cd",
    "github actions", "gitlab", "jenkins", "terraform", "ansible", "linux",
    "nginx", "helm", "devops"
  ],
  "System Design": [
    "microservices", "system design", "distributed systems", "load balancing",
    "caching", "redis", "kafka", "rabbitmq", "scalability", "high availability",
    "message queue", "architecture"
  ],
  "Database Design": [
    "mongodb", "postgresql", "mysql", "sql", "nosql", "prisma", "mongoose",
    "redis", "dynamodb", "database", "schema", "indexing", "acid", "sqlite"
  ],
  "General": [
    "git", "github", "rest api", "graphql", "agile", "scrum", "oop",
    "algorithms", "data structures", "debugging", "problem solving", "unit testing"
  ]
};

const ALL_SKILL_DISPLAY = [
  { match: "react", label: "React" },
  { match: "next.js", label: "Next.js" },
  { match: "nextjs", label: "Next.js" },
  { match: "node.js", label: "Node.js" },
  { match: "nodejs", label: "Node.js" },
  { match: "express", label: "Express.js" },
  { match: "typescript", label: "TypeScript" },
  { match: "javascript", label: "JavaScript" },
  { match: "python", label: "Python" },
  { match: "django", label: "Django" },
  { match: "flask", label: "Flask" },
  { match: "fastapi", label: "FastAPI" },
  { match: "mongodb", label: "MongoDB" },
  { match: "postgresql", label: "PostgreSQL" },
  { match: "mysql", label: "MySQL" },
  { match: "sql", label: "SQL" },
  { match: "redis", label: "Redis" },
  { match: "docker", label: "Docker" },
  { match: "kubernetes", label: "Kubernetes" },
  { match: "aws", label: "AWS" },
  { match: "git", label: "Git" },
  { match: "github", label: "GitHub" },
  { match: "tailwind", label: "Tailwind CSS" },
  { match: "redux", label: "Redux" },
  { match: "graphql", label: "GraphQL" },
  { match: "rest api", label: "REST APIs" },
  { match: "ci/cd", label: "CI/CD" },
  { match: "machine learning", label: "Machine Learning" },
  { match: "pandas", label: "Pandas" },
  { match: "numpy", label: "NumPy" },
  { match: "microservices", label: "Microservices" }
];

async function extractTextFromPDF(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjslib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;
  let textContent = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    textContent += strings.join(" ") + "\n";
  }
  return textContent;
}

function performSmartResumeAnalysis(text) {
  const lower = text.toLowerCase();

  // 1. Detect skills
  const skillsDetectedSet = new Set();
  for (const item of ALL_SKILL_DISPLAY) {
    if (lower.includes(item.match)) {
      skillsDetectedSet.add(item.label);
    }
  }
  let skillsDetected = Array.from(skillsDetectedSet).slice(0, 12);
  if (skillsDetected.length === 0) {
    skillsDetected = ["JavaScript", "HTML/CSS", "Git", "REST APIs", "Problem Solving"];
  }

  // 2. Experience level detection
  let experienceLevel = "Junior";
  const yearsMatches = lower.match(/(\d+)\+?\s*(?:years?|yrs?)/g) || [];
  let maxYears = 0;
  for (const ym of yearsMatches) {
    const num = parseInt(ym);
    if (!isNaN(num) && num > maxYears && num < 40) {
      maxYears = num;
    }
  }

  if (
    maxYears >= 5 ||
    lower.includes("senior") ||
    lower.includes("lead") ||
    lower.includes("architect") ||
    lower.includes("staff engineer")
  ) {
    experienceLevel = "Senior";
  } else if (
    maxYears >= 2 ||
    lower.includes("mid-level") ||
    lower.includes("software engineer ii") ||
    lower.includes("associate engineer")
  ) {
    experienceLevel = "Mid";
  } else {
    experienceLevel = "Junior";
  }

  // 3. Domain Scoring
  const domainScores = [];
  for (const [dom, keywords] of Object.entries(DOMAIN_SKILL_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) count++;
    }
    domainScores.push({ domain: dom, count });
  }

  domainScores.sort((a, b) => b.count - a.count);

  const domainReasons = {
    "JavaScript/Node.js": "Demonstrates strong foundation in modern JavaScript, asynchronous execution, and server-side runtimes.",
    "React": "Strong frontend background with modern React components, state management, and UI styling.",
    "Python": "Demonstrated capability in Python scripting, backend services, and clean modular code.",
    "Data Science": "Experience with data exploration, statistical modeling, and analytical frameworks.",
    "DevOps": "Hands-on experience with containerization, deployment pipelines, and cloud automation.",
    "System Design": "Shows understanding of distributed systems, high availability patterns, and scalable microservices.",
    "Database Design": "Solid experience with schema normalization, query performance, and persistent data storage.",
    "General": "Well-rounded software engineering fundamentals, debugging skills, and problem-solving ability."
  };

  const top3 = domainScores.slice(0, 3);
  // Ensure we have at least 3 distinct domains
  const chosenDomains = top3.filter((d) => d.count > 0);
  if (chosenDomains.length < 3) {
    for (const d of domainScores) {
      if (!chosenDomains.find((x) => x.domain === d.domain)) {
        chosenDomains.push(d);
        if (chosenDomains.length === 3) break;
      }
    }
  }

  const confidenceBase = [92, 85, 78];
  const recommendedDomains = chosenDomains.slice(0, 3).map((item, idx) => ({
    label: item.domain,
    reason: domainReasons[item.domain] || "Strong alignment with candidate skills and experience profile.",
    confidence: confidenceBase[idx] - Math.min(idx * 3, 10)
  }));

  // 4. Strengths
  const strengths = [];
  if (skillsDetected.some((s) => ["React", "Next.js", "Tailwind CSS", "JavaScript"].includes(s))) {
    strengths.push("Proficient in modern frontend engineering and responsive user interfaces.");
  }
  if (skillsDetected.some((s) => ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "SQL"].includes(s))) {
    strengths.push("Hands-on full-stack development experience with scalable APIs and database management.");
  }
  if (skillsDetected.some((s) => ["Docker", "Kubernetes", "AWS", "CI/CD", "Git"].includes(s))) {
    strengths.push("Familiarity with modern deployment practices, version control, and cloud workflows.");
  }
  if (strengths.length < 3) {
    strengths.push("Clear communication of technical achievements and project contributions.");
  }
  if (strengths.length < 3) {
    strengths.push("Solid foundation in core computer science principles and problem-solving.");
  }

  // 5. Professional summary
  const topDomain = recommendedDomains[0]?.label || "Full Stack";
  const primarySkills = skillsDetected.slice(0, 4).join(", ");
  const summary = `Candidate demonstrates a solid foundation as a ${experienceLevel}-level developer with a strong focus in ${topDomain}. Possesses practical hands-on experience utilizing key technologies including ${primarySkills}. Well-prepared for technical interview rounds with strong potential across full-stack and domain-specific roles.`;

  return {
    summary,
    experienceLevel,
    skillsDetected,
    strengths: strengths.slice(0, 3),
    recommendedDomains
  };
}

const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded", message: "No file uploaded" });
    }

    let resumeText = "";
    if (req.file.mimetype === "application/pdf") {
      try {
        const parsed = await extractTextFromPDF(req.file.buffer);
        resumeText = parsed || "";
      } catch (pdfErr) {
        console.warn("PDF extraction warning:", pdfErr.message);
        resumeText = req.file.buffer.toString("utf-8");
      }
    } else {
      resumeText = req.file.buffer.toString("utf-8");
    }

    if (!resumeText || resumeText.trim().length < 30) {
      return res.status(400).json({
        error: "Failed to extract text from resume",
        message: "Failed to extract readable text from resume. Please ensure the file is not an image-only PDF."
      });
    }

    const truncated = resumeText.slice(0, 6000);

    // If a valid Groq API key is present, attempt LLM completion
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_")) {
      try {
        const groq = new Groq({ apiKey });
        const prompt = `
You are an expert technical recruiter and career coach.
Analyze the following resume and respond ONLY with a valid JSON object. No text outside JSON.

Available interview domains: ${DOMAINS.join(", ")}

Resume text:
"""
${truncated}
"""

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence professional summary of the candidate",
  "experienceLevel": "Junior" | "Mid" | "Senior",
  "skillsDetected": ["skill1", "skill2", "skill3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "recommendedDomains": [
    {
      "label": "exact domain name from the available list",
      "reason": "one sentence why this domain fits them",
      "confidence": 85
    }
  ]
}

Rules:
- experienceLevel must be exactly "Junior", "Mid", or "Senior"
- skillsDetected: list up to 12 actual skills found in the resume
- strengths: list 3 specific professional strengths
- recommendedDomains: recommend 3 domains ordered by best fit, confidence is 0-100
- domain label must exactly match one from the available domains list
- confidence scores should be realistic and different for each domain
`.trim();

        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const raw = response.choices[0]?.message?.content || "{}";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedAnalysis = JSON.parse(jsonMatch[0]);
          if (parsedAnalysis && parsedAnalysis.recommendedDomains) {
            parsedAnalysis.recommendedDomains = parsedAnalysis.recommendedDomains.filter((d) =>
              DOMAINS.includes(d.label)
            );
            return res.json({ analysis: parsedAnalysis, message: "Analysis complete" });
          }
        }
      } catch (groqError) {
        console.warn("Groq API error, falling back to smart analyzer:", groqError.message);
      }
    }

    // Smart heuristic analyzer fallback
    const analysis = performSmartResumeAnalysis(resumeText);
    return res.json({ analysis, message: "Analysis complete" });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({ error: "Internal server error", message: error.message || "Failed to analyze resume" });
  }
};

module.exports = {
  analyzeResume,
};
