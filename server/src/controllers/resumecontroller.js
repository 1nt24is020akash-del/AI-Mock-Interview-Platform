const Groq = require("groq-sdk");
const { extractTextFromDOCX } = require("../utils/docx-extractor.js");

// Standard Interview Domains supported by the platform
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

// Comprehensive keyword dictionary for domain matching
const DOMAIN_SKILL_KEYWORDS = {
  "JavaScript/Node.js": [
    "javascript", "typescript", "node.js", "nodejs", "express", "expressjs",
    "nest.js", "nestjs", "npm", "async", "es6", "vanilla js", "event loop",
    "jwt", "socket.io", "rest api", "backend", "full stack"
  ],
  "React": [
    "react", "react.js", "reactjs", "next.js", "nextjs", "redux", "zustand",
    "tailwind", "tailwindcss", "shadcn", "jsx", "tsx", "hooks", "vite",
    "html", "css", "css3", "sass", "frontend", "ui/ux", "responsive", "web applications"
  ],
  "Python": [
    "python", "django", "flask", "fastapi", "pytest", "celery", "poetry",
    "pep8", "asyncio", "pydantic", "scripting", "oop"
  ],
  "Data Science": [
    "machine learning", "deep learning", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "nlp", "computer vision", "data analysis",
    "tableau", "power bi", "matplotlib", "seaborn", "statistics", "data science",
    "analytics", "ai", "artificial intelligence", "ml"
  ],
  "DevOps": [
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "ci/cd", "ci / cd",
    "github actions", "gitlab", "jenkins", "terraform", "ansible", "linux",
    "nginx", "helm", "devops", "cloud", "deployment"
  ],
  "System Design": [
    "microservices", "system design", "distributed systems", "load balancing",
    "caching", "redis", "kafka", "rabbitmq", "scalability", "high availability",
    "message queue", "architecture", "monolith", "event-driven"
  ],
  "Database Design": [
    "mongodb", "postgresql", "mysql", "sql", "nosql", "prisma", "mongoose",
    "redis", "dynamodb", "database", "schema", "indexing", "acid", "sqlite",
    "normalization", "queries"
  ],
  "General": [
    "git", "github", "rest api", "graphql", "agile", "scrum", "oop",
    "algorithms", "data structures", "debugging", "problem solving",
    "unit testing", "software engineering", "computer science"
  ],
};

// Curated technical skills dictionary by category
const SKILL_TAXONOMY = {
  languages: [
    { match: "javascript", label: "JavaScript" },
    { match: "typescript", label: "TypeScript" },
    { match: "python", label: "Python" },
    { match: "java", label: "Java", boundary: true },
    { match: "c++", label: "C++" },
    { match: "c#", label: "C#" },
    { match: "c", label: "C", singleLetter: true },
    { match: "golang", label: "Go" },
    { match: "go", label: "Go", boundary: true },
    { match: "rust", label: "Rust", boundary: true },
    { match: "ruby", label: "Ruby", boundary: true },
    { match: "php", label: "PHP" },
    { match: "swift", label: "Swift", boundary: true },
    { match: "kotlin", label: "Kotlin" },
    { match: "dart", label: "Dart" },
    { match: "r", label: "R", boundary: true },
    { match: "scala", label: "Scala" },
    { match: "sql", label: "SQL", boundary: true },
    { match: "bash", label: "Bash" },
    { match: "shell", label: "Shell" },
  ],
  frontend: [
    { match: "react.js", label: "React" },
    { match: "reactjs", label: "React" },
    { match: "react", label: "React", boundary: true },
    { match: "next.js", label: "Next.js" },
    { match: "nextjs", label: "Next.js" },
    { match: "vue.js", label: "Vue.js" },
    { match: "vuejs", label: "Vue.js" },
    { match: "vue", label: "Vue.js", boundary: true },
    { match: "angular", label: "Angular" },
    { match: "svelte", label: "Svelte" },
    { match: "tailwind css", label: "Tailwind CSS" },
    { match: "tailwindcss", label: "Tailwind CSS" },
    { match: "tailwind", label: "Tailwind CSS" },
    { match: "bootstrap", label: "Bootstrap" },
    { match: "html5", label: "HTML5" },
    { match: "html", label: "HTML", boundary: true },
    { match: "css3", label: "CSS3" },
    { match: "css", label: "CSS", boundary: true },
    { match: "sass", label: "Sass/SCSS" },
    { match: "redux", label: "Redux" },
    { match: "zustand", label: "Zustand" },
    { match: "vite", label: "Vite" },
    { match: "webpack", label: "Webpack" },
    { match: "shadcn", label: "shadcn/ui" },
    { match: "material ui", label: "Material UI" },
    { match: "mui", label: "Material UI", boundary: true },
    { match: "jquery", label: "jQuery" },
    { match: "react native", label: "React Native" },
  ],
  backend: [
    { match: "node.js", label: "Node.js" },
    { match: "nodejs", label: "Node.js" },
    { match: "express.js", label: "Express.js" },
    { match: "expressjs", label: "Express.js" },
    { match: "express", label: "Express.js", boundary: true },
    { match: "django", label: "Django" },
    { match: "flask", label: "Flask" },
    { match: "fastapi", label: "FastAPI" },
    { match: "spring boot", label: "Spring Boot" },
    { match: "spring", label: "Spring", boundary: true },
    { match: "nest.js", label: "NestJS" },
    { match: "nestjs", label: "NestJS" },
    { match: "asp.net", label: "ASP.NET" },
    { match: ".net", label: ".NET" },
    { match: "ruby on rails", label: "Ruby on Rails" },
    { match: "graphql", label: "GraphQL" },
    { match: "rest api", label: "REST APIs" },
    { match: "restful", label: "RESTful APIs" },
    { match: "socket.io", label: "Socket.io" },
    { match: "websockets", label: "WebSockets" },
    { match: "microservices", label: "Microservices" },
    { match: "grpc", label: "gRPC" },
  ],
  databases: [
    { match: "mongodb", label: "MongoDB" },
    { match: "postgresql", label: "PostgreSQL" },
    { match: "postgres", label: "PostgreSQL" },
    { match: "mysql", label: "MySQL" },
    { match: "redis", label: "Redis" },
    { match: "sqlite", label: "SQLite" },
    { match: "supabase", label: "Supabase" },
    { match: "firebase", label: "Firebase" },
    { match: "dynamodb", label: "DynamoDB" },
    { match: "cassandra", label: "Cassandra" },
    { match: "mariadb", label: "MariaDB" },
    { match: "oracle", label: "Oracle DB", boundary: true },
    { match: "prisma", label: "Prisma ORM" },
    { match: "mongoose", label: "Mongoose" },
  ],
  cloudDevOps: [
    { match: "aws", label: "AWS", boundary: true },
    { match: "azure", label: "Azure" },
    { match: "gcp", label: "Google Cloud (GCP)" },
    { match: "google cloud", label: "Google Cloud (GCP)" },
    { match: "docker", label: "Docker" },
    { match: "kubernetes", label: "Kubernetes" },
    { match: "k8s", label: "Kubernetes", boundary: true },
    { match: "ci/cd", label: "CI/CD" },
    { match: "github actions", label: "GitHub Actions" },
    { match: "gitlab ci", label: "GitLab CI" },
    { match: "jenkins", label: "Jenkins" },
    { match: "terraform", label: "Terraform" },
    { match: "ansible", label: "Ansible" },
    { match: "linux", label: "Linux" },
    { match: "nginx", label: "Nginx" },
    { match: "cloudflare", label: "Cloudflare" },
    { match: "vercel", label: "Vercel" },
    { match: "netlify", label: "Netlify" },
  ],
  toolsAndOthers: [
    { match: "git", label: "Git", boundary: true },
    { match: "github", label: "GitHub" },
    { match: "gitlab", label: "GitLab" },
    { match: "postman", label: "Postman" },
    { match: "figma", label: "Figma" },
    { match: "jira", label: "Jira" },
    { match: "vs code", label: "VS Code" },
    { match: "vscode", label: "VS Code" },
    { match: "agile", label: "Agile" },
    { match: "scrum", label: "Scrum" },
    { match: "jest", label: "Jest" },
    { match: "pytest", label: "PyTest" },
    { match: "cypress", label: "Cypress" },
    { match: "junit", label: "JUnit" },
    { match: "data structures", label: "Data Structures" },
    { match: "algorithms", label: "Algorithms" },
    { match: "machine learning", label: "Machine Learning" },
    { match: "deep learning", label: "Deep Learning" },
    { match: "pandas", label: "Pandas" },
    { match: "numpy", label: "NumPy" },
    { match: "problem solving", label: "Problem Solving" },
    { match: "oop", label: "OOP" },
  ],
};

const INVALID_RESUME_MESSAGE =
  "Unable to analyze this document. Please upload a valid resume containing sufficient information about your skills, education, projects, experience, or qualifications.";

/**
 * Extracts raw text from PDF buffer using pdf-parse v2 first, then pdfjs-dist fallback.
 */
async function extractTextFromPDF(buffer) {
  // Strategy 1: pdf-parse v2 (Pure JavaScript, fast & reliable)
  try {
    const { PDFParse } = require("pdf-parse");
    if (PDFParse) {
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText();
      await parser.destroy();
      if (res && res.text && res.text.trim().length > 30) {
        return res.text;
      }
    }
  } catch (parseErr) {
    console.warn("PDFParse v2 notice:", parseErr.message);
  }

  // Strategy 2: pdfjs-dist fallback
  try {
    const pdfjslib = require("pdfjs-dist/legacy/build/pdf.js");
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjslib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;
    let textContent = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      textContent += strings.join(" ") + "\n";
    }
    if (textContent.trim().length > 30) {
      return textContent;
    }
  } catch (pdfjsErr) {
    console.warn("pdfjs-dist extraction notice:", pdfjsErr.message);
  }

  // Strategy 3: raw text fallback
  const rawText = buffer.toString("utf-8");
  if (rawText && rawText.trim().length > 50) {
    return rawText;
  }

  throw new Error("Unable to extract text from PDF document.");
}

/**
 * Extracts text based on file mimetype or filename extension.
 */
async function extractTextFromFile(file) {
  const ext = (file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  if (mime.includes("pdf") || ext.endsWith(".pdf")) {
    return await extractTextFromPDF(file.buffer);
  }

  if (
    mime.includes("wordprocessingml") ||
    ext.endsWith(".docx") ||
    mime.includes("msword") ||
    ext.endsWith(".doc")
  ) {
    try {
      const docxText = await extractTextFromDOCX(file.buffer);
      if (docxText && docxText.trim().length > 0) {
        return docxText;
      }
    } catch (docxErr) {
      console.warn("Mammoth docx extraction notice:", docxErr.message);
    }
  }

  // Plain text fallback
  return file.buffer.toString("utf-8");
}

/**
 * Flexible Resume Validation
 * Validates based on actual extracted content and detected resume sections.
 * Accepts meaningful combinations such as Education + Skills + Projects,
 * Education + Skills + Internship, Skills + Projects + Certifications, etc.
 */
function validateResumeText(text) {
  if (!text || typeof text !== "string") {
    console.log("=== RESUME VALIDATION DEBUG ===");
    console.log("Extracted text length: 0");
    console.log("Validation result: REJECTED");
    console.log("Exact reason for rejection: Text is empty or invalid format");
    console.log("===============================");
    return false;
  }

  const cleaned = text.trim();
  const textLength = cleaned.length;
  if (textLength < 50) {
    console.log("=== RESUME VALIDATION DEBUG ===");
    console.log("Extracted text length:", textLength);
    console.log("Validation result: REJECTED");
    console.log("Exact reason for rejection: Document text length is too short (< 50 characters)");
    console.log("===============================");
    return false;
  }

  const lower = cleaned.toLowerCase();
  const lines = cleaned.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // Detect sections using heading regex
  const headingRegex = /^(objective|summary|profile|about me|education|academics|academic background|skills|technical skills|technologies|programming|projects|key projects|academic projects|internship|internships|experience|work experience|employment|certifications|certificates|activities|achievements|awards)[\s:]*$/i;
  const detectedSections = [];
  lines.forEach((l) => {
    if (headingRegex.test(l)) detectedSections.push(l);
  });

  // Major categories evidence
  const hasEdu =
    detectedSections.some((s) => /education|academic/i.test(s)) ||
    /\b(education|academics|degree|university|college|institute|b\.e|b\.tech|bachelor|master|puc|cgpa|gpa|coursework)\b/i.test(lower);

  const hasSkills =
    detectedSections.some((s) => /skills|technologies|programming/i.test(s)) ||
    /\b(technical skills|programming languages|web technologies|database skills)\b/i.test(lower) ||
    (lower.match(/\b(python|java|javascript|typescript|c\+\+|html|css|sql|mongodb|mysql|react|node)\b/g) || []).length >= 2;

  const hasProj =
    detectedSections.some((s) => /projects/i.test(s)) ||
    /\b(projects|academic projects|personal projects|mini project|final year project)\b/i.test(lower) ||
    /\b(chatbot|attendance system|traffic management|application|web app)\b/i.test(lower);

  const hasExpOrIntern =
    detectedSections.some((s) => /internship|experience/i.test(s)) ||
    /\b(internship|intern|work experience|employment|trainee|edu-versity)\b/i.test(lower);

  const hasCertsOrActivities =
    detectedSections.some((s) => /certifications|activities|achievements/i.test(s)) ||
    /\b(certifications|certificates|certified|hackathon|activities|workshops|awards)\b/i.test(lower);

  const hasContact =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleaned) ||
    /(?:\+?91[\s-]?)?[6-9]\d{9}|\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleaned) ||
    /linkedin\.com|github\.com/i.test(cleaned);

  const matchedCategories = [];
  if (hasEdu) matchedCategories.push("Education");
  if (hasSkills) matchedCategories.push("Skills");
  if (hasProj) matchedCategories.push("Projects");
  if (hasExpOrIntern) matchedCategories.push("Experience/Internship");
  if (hasCertsOrActivities) matchedCategories.push("Certifications/Activities");

  const validationScore = Math.min(100, matchedCategories.length * 20 + (hasContact ? 15 : 0));

  // Accept if candidate has at least 2 major categories, or 1 major category + contact info
  const isValid = matchedCategories.length >= 2 || (matchedCategories.length >= 1 && hasContact);
  const rejectionReason = isValid
    ? null
    : `Insufficient resume categories detected (matched ${matchedCategories.length} categories: [${matchedCategories.join(
        ", "
      )}], minimum 2 required).`;

  console.log("=== RESUME VALIDATION DEBUG ===");
  console.log("Extracted text length:", textLength);
  console.log("Detected sections:", detectedSections);
  console.log("Major categories matched:", matchedCategories);
  console.log("Contact info present:", hasContact);
  console.log("Validation score:", validationScore);
  console.log("Validation result:", isValid ? "ACCEPTED" : "REJECTED");
  if (!isValid) {
    console.log("Exact reason for rejection:", rejectionReason);
  }
  console.log("===============================");

  return isValid;
}

/**
 * Check if a skill exists in text considering word boundaries.
 */
function containsSkill(textLower, rawText, skillItem) {
  if (skillItem.singleLetter) {
    // For single-letter 'C', ensure it's in programming context or uppercase isolated token
    return (
      /(?:programming[:\s]|languages?[:\s]|skills?[:\s]|,\s*|\/\s*)c(?:\s*[,/+]|\s*(?:and|&)\s*c\+\+|\s*\n|$)/i.test(textLower) ||
      /(?:^|[,\s:/])C(?:[,\s:/]|$)/.test(rawText)
    );
  }
  if (skillItem.boundary) {
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${skillItem.match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-zA-Z0-9_#+])`, "i");
    return regex.test(textLower);
  }
  return textLower.includes(skillItem.match);
}

/**
 * High-Precision Deterministic Resume Parser (Tier 2)
 * Generates 100% dynamic, evidence-based analysis strictly from actual content.
 */
function performDeterministicAnalysis(rawText) {
  const text = rawText.replace(/\r\n/g, "\n");
  const lower = text.toLowerCase();
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // 1. Candidate Info Extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?91[\s-]?)?[6-9]\d{9}|\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{1,3}\s*\d{10}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?([a-zA-Z0-9_-]+)/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:io|dev|me|vercel\.app|netlify\.app))/i);

  // Candidate Name extraction from top lines
  let candidateName = "";
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.length >= 2 &&
      line.length <= 40 &&
      !line.includes("@") &&
      !line.includes("http") &&
      !line.includes(".com") &&
      !line.includes("+91") &&
      !/^(objective|summary|resume|cv|contact|education|skills|projects|degree)/i.test(line) &&
      /^[a-zA-Z\s.'-]+$/.test(line)
    ) {
      if (line === line.toUpperCase() && line.length > 2) {
        candidateName = line.charAt(0) + line.slice(1).toLowerCase();
      } else {
        candidateName = line;
      }
      break;
    }
  }

  // Professional Title / Headline detection
  let detectedTitle = "";
  const titleKeywords = [
    "Information Science Student", "Computer Science Student",
    "Full Stack Developer", "Software Engineer", "Frontend Developer", "Backend Developer",
    "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "Cloud Engineer",
    "Web Developer", "Software Development Engineer"
  ];
  for (const title of titleKeywords) {
    if (lower.includes(title.toLowerCase())) {
      detectedTitle = title;
      break;
    }
  }

  // 2. Categorized Skills Extraction
  const categorizedSkills = {
    languages: [],
    frontend: [],
    backend: [],
    databases: [],
    cloudDevOps: [],
    toolsAndOthers: [],
  };

  const allDetectedSkillsSet = new Set();

  for (const [category, skillList] of Object.entries(SKILL_TAXONOMY)) {
    const set = new Set();
    for (const item of skillList) {
      if (containsSkill(lower, text, item)) {
        set.add(item.label);
        allDetectedSkillsSet.add(item.label);
      }
    }
    categorizedSkills[category] = Array.from(set);
  }

  const allSkillsList = Array.from(allDetectedSkillsSet);

  // 3. Candidate Level Detection
  let isStudentOrFresher = false;
  let detectedGradYear = null;
  const currentYear = new Date().getFullYear();

  const gradYearMatches = text.match(/\b(20\d{2})\b/g) || [];
  for (const yrStr of gradYearMatches) {
    const yr = parseInt(yrStr, 10);
    if (yr >= currentYear - 1 && yr <= currentYear + 4) {
      detectedGradYear = yr;
      isStudentOrFresher = true;
      break;
    }
  }

  const studentTerms = ["student", "undergraduate", "fresher", "intern", "pursuing", "b.tech", "b.e", "bachelor", "puc", "information science"];
  for (const term of studentTerms) {
    if (lower.includes(term)) {
      isStudentOrFresher = true;
      break;
    }
  }

  const expMatches = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/gi) || [];
  let maxExpYears = 0;
  for (const em of expMatches) {
    const num = parseInt(em, 10);
    if (!isNaN(num) && num > maxExpYears && num < 40) {
      maxExpYears = num;
    }
  }

  let candidateLevel = "Fresher / Entry Level";
  let candidateLevelReason = "";
  let simplifiedLevel = "Junior";

  if (
    !isStudentOrFresher &&
    (maxExpYears >= 6 || /\b(senior|lead|principal|architect|staff engineer|tech lead)\b/i.test(text))
  ) {
    candidateLevel = "Senior Developer / Lead";
    simplifiedLevel = "Senior";
    candidateLevelReason = `Identified senior engineering leadership experience${maxExpYears ? ` with ~${maxExpYears}+ years of industry track record` : " and high-level architectural responsibilities"}.`;
  } else if (
    !isStudentOrFresher &&
    (maxExpYears >= 3 || /\b(mid-level|software engineer ii|sde ii|experienced developer)\b/i.test(text))
  ) {
    candidateLevel = "Mid-Level Developer";
    simplifiedLevel = "Mid";
    candidateLevelReason = `Identified established mid-level experience${maxExpYears ? ` with ~${maxExpYears} years of industry development` : " demonstrating independent feature delivery"}.`;
  } else if (maxExpYears >= 1 && !isStudentOrFresher) {
    candidateLevel = "Junior Developer";
    simplifiedLevel = "Junior";
    candidateLevelReason = "Demonstrated practical programming foundation and hands-on technical project delivery.";
  } else {
    candidateLevel = "Fresher / Entry Level";
    simplifiedLevel = "Junior";
    candidateLevelReason = detectedGradYear
      ? `Academic profile with expected graduation in ${detectedGradYear} and practical project implementations.`
      : "Entry-level candidate profile with focus on foundational programming skills and academic projects.";
  }

  if (!detectedTitle) {
    if (candidateLevel.includes("Fresher")) {
      detectedTitle = "Aspiring Software Engineer";
    } else if (categorizedSkills.frontend.length > categorizedSkills.backend.length) {
      detectedTitle = `${candidateLevel.split(" ")[0]} Frontend Engineer`;
    } else if (categorizedSkills.backend.length > 0) {
      detectedTitle = `${candidateLevel.split(" ")[0]} Software Engineer`;
    } else {
      detectedTitle = "Software Developer";
    }
  }

  // 4. Section Splitting & Extraction
  const sectionKeywords = [
    { key: "objective", regex: /^(objective|summary|profile|about me)[\s:]*$/i },
    { key: "education", regex: /^(education|academics|academic background|academic qualifications)[\s:]*$/i },
    { key: "skills", regex: /^(skills|technical skills|technologies|programming skills)[\s:]*$/i },
    { key: "projects", regex: /^(projects|academic projects|key projects|personal projects)[\s:]*$/i },
    { key: "internship", regex: /^(internship|internships)[\s:]*$/i },
    { key: "experience", regex: /^(experience|work experience|employment history|work history)[\s:]*$/i },
    { key: "certifications", regex: /^(certifications|certificates|licenses)[\s:]*$/i },
    { key: "activities", regex: /^(activities|achievements|awards|extracurricular)[\s:]*$/i },
  ];

  const sectionPositions = [];
  lines.forEach((line, idx) => {
    for (const sec of sectionKeywords) {
      if (sec.regex.test(line)) {
        sectionPositions.push({ key: sec.key, lineIdx: idx, heading: line });
        break;
      }
    }
  });

  function getSectionContent(sectionKey) {
    const found = sectionPositions.find((s) => s.key === sectionKey);
    if (!found) return "";
    const nextSection = sectionPositions
      .filter((s) => s.lineIdx > found.lineIdx)
      .sort((a, b) => a.lineIdx - b.lineIdx)[0];
    const endIdx = nextSection ? nextSection.lineIdx : lines.length;
    return lines.slice(found.lineIdx + 1, endIdx).join("\n");
  }

  const educationText = getSectionContent("education");
  const experienceText = getSectionContent("experience");
  const internshipText = getSectionContent("internship");
  const projectsText = getSectionContent("projects");
  const certsText = getSectionContent("certifications");
  const activitiesText = getSectionContent("activities");

  // Extract Education (supports pipe table format and bullet format)
  const educationList = [];
  const eduLines = educationText ? educationText.split("\n").map((l) => l.trim()).filter((l) => l.length > 2) : [];
  for (const l of eduLines) {
    if (/^degree\s*\|\s*institute/i.test(l)) continue; // skip header
    if (l.includes("|")) {
      const parts = l.split("|").map((p) => p.trim());
      if (parts.length >= 2) {
        const deg = parts[0];
        const inst = parts[1];
        const details = parts[2] || "";
        const yrMatch = details.match(/\b(20\d{2})\b/);
        const gpaMatch = details.match(/(?:cgpa\s*[\d.]+|\b\d+%\b)/i);
        educationList.push({
          degree: deg + (details.includes("ISE") ? " (ISE)" : details.includes("PCMB") ? " (PCMB)" : details.includes("ICSE") ? " (ICSE)" : ""),
          institution: inst,
          year: yrMatch ? yrMatch[1] : "Completed",
          gpa: gpaMatch ? gpaMatch[0] : undefined,
        });
        continue;
      }
    }
    if (/b\.tech|b\.e|bachelor|master|m\.tech|mca|bca|diploma|puc|10th|high school/i.test(l)) {
      educationList.push({
        degree: l,
        institution: "Higher Education Institution",
        year: l.match(/\b(20\d{2})\b/)?.[1] || "Completed",
      });
    }
  }

  if (educationList.length === 0) {
    const degreeMatch = text.match(/(b\.tech|b\.e\.|bachelor of [a-zA-Z\s]+|master of [a-zA-Z\s]+|diploma in [a-zA-Z\s]+)/i);
    if (degreeMatch) {
      educationList.push({
        degree: degreeMatch[0].trim(),
        institution: "Higher Education Institution",
        year: detectedGradYear ? `${detectedGradYear}` : "Completed",
      });
    }
  }

  // Extract Projects (supports numbered items e.g. 1.AI Health Chatbot)
  const projectsList = [];
  if (projectsText) {
    const pLines = projectsText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    let currentProj = null;

    for (const pl of pLines) {
      const isNumberedOrHeader =
        /^\d+\.\s*/.test(pl) ||
        (!/^[•\-\*\u2022\u25E6]|\d+\.\s/.test(pl) && pl.length < 50 && !pl.includes("efficiently") && !pl.includes("monitoring"));

      if (isNumberedOrHeader && pl.length < 75) {
        if (currentProj && currentProj.title) {
          projectsList.push(currentProj);
        }
        const cleanedTitle = pl.replace(/^\d+\.\s*/, "").trim();
        const techInTitle = allSkillsList.filter((s) => {
          if (s === "C") {
            return /(?:^|[,\s:/])C(?:[,\s:/]|$)/.test(pl);
          }
          const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, "i").test(pl);
        });

        currentProj = {
          title: cleanedTitle,
          description: "",
          technologies: techInTitle,
        };
      } else if (currentProj) {
        if (pl.includes("|")) {
          const parts = pl.split("|").map((p) => p.trim());
          currentProj.description += (currentProj.description ? " " : "") + parts[0];
          if (parts[1]) {
            const rawTechTokens = parts[1].split(/[,\s]+/).map((t) => t.trim());
            for (const token of rawTechTokens) {
              if (token.length > 1 && !currentProj.technologies.includes(token)) {
                currentProj.technologies.push(token);
              }
            }
          }
        } else {
          currentProj.description += (currentProj.description ? " " : "") + pl;
        }

        const techInDesc = allSkillsList.filter((s) => {
          if (s === "C") {
            return /(?:^|[,\s:/])C(?:[,\s:/]|$)/.test(pl);
          }
          const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, "i").test(pl);
        });
        for (const t of techInDesc) {
          if (!currentProj.technologies.includes(t)) {
            currentProj.technologies.push(t);
          }
        }
      }
    }
    if (currentProj && currentProj.title) {
      projectsList.push(currentProj);
    }
  }

  // Extract Experience and Internship
  const experienceList = [];

  // Parse Internship section if present
  if (internshipText) {
    const intLines = internshipText.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
    for (const il of intLines) {
      if (il.includes("|")) {
        const parts = il.split("|").map((p) => p.trim());
        experienceList.push({
          role: parts[0] ? `${parts[0]} Intern` : "Intern",
          company: parts[1] || "Technology Organization",
          duration: parts[2] || "Internship Period",
          description: parts[3] || "Worked on technical projects and system developments.",
          highlights: [parts[3] || "Practical internship delivery and technical implementation."],
        });
      } else {
        experienceList.push({
          role: "Technical Intern",
          company: "Industry Internship",
          duration: il.match(/\b(\d+\s*months?|20\d{2})\b/i)?.[0] || "Internship",
          description: il,
          highlights: [il],
        });
      }
    }
  }

  // Parse Experience section if present
  if (experienceText) {
    const expLines = experienceText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    let currentExp = null;

    for (const el of expLines) {
      const isBullet = /^[•\-\*\u2022\u25E6]|\d+\.\s/.test(el);
      if (
        !isBullet &&
        el.length < 140 &&
        (/\b(developer|engineer|intern|lead|consultant|analyst|associate|manager|fellow|architect|specialist)\b/i.test(el) ||
         /\b(20\d{2}|present)\b/i.test(el))
      ) {
        if (currentExp) experienceList.push(currentExp);
        const split = el.split(/[|•-]/);
        const roleName = split[0].trim();
        const comp = split.length > 1 ? split[1].trim() : "Engineering Organization";
        currentExp = {
          role: roleName,
          company: comp,
          duration: el.match(/\b(20\d{2}.*?(?:present|20\d{2}))\b/i)?.[0] || "Past Experience",
          description: "",
          highlights: [],
        };
      } else if (currentExp) {
        const cleanedLine = el.replace(/^[•\-\*\u2022\u25E6]\s*|\d+\.\s*/, "").trim();
        currentExp.description += (currentExp.description ? " " : "") + cleanedLine;
        currentExp.highlights.push(cleanedLine);
      }
    }
    if (currentExp) experienceList.push(currentExp);
  }

  // Default fresher foundation if no experience or internship
  if (experienceList.length === 0) {
    experienceList.push({
      role: "Academic & Personal Projects",
      company: educationList[0]?.institution || "Academic Foundation",
      duration: detectedGradYear ? `Expected ${detectedGradYear}` : "Present",
      description: "Focused on academic coursework, core software engineering principles, and hands-on project implementations.",
      highlights: [
        `Constructed practical software applications utilizing ${allSkillsList.slice(0, 4).join(", ") || "modern programming languages"}.`,
        "Demonstrated technical problem solving and algorithm design capabilities."
      ],
    });
  }

  // Extract Certifications
  const certificationsList = [];
  if (certsText) {
    const cLines = certsText.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
    for (const cl of cLines) {
      const cleaned = cl.replace(/^\d+\.\s*/, "").replace(/^[•\-\*]\s*/, "");
      if (cleaned.includes("|")) {
        const parts = cleaned.split("|").map((p) => p.trim());
        certificationsList.push({
          name: parts[0],
          issuer: parts[1] || "Certification Authority",
          year: cleaned.match(/\b(20\d{2})\b/)?.[1] || "Completed",
        });
      } else {
        certificationsList.push({
          name: cleaned,
          issuer: cleaned.includes("AWS") ? "Amazon Web Services" : cleaned.includes("Infosys") ? "Infosys Springboard" : "Certification Authority",
          year: cleaned.match(/\b(20\d{2})\b/)?.[1] || "Completed",
        });
      }
    }
  }

  // Extract Activities & Achievements (ignoring pagination lines)
  const achievementsList = [];
  if (activitiesText) {
    const aLines = activitiesText.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
    for (const al of aLines) {
      if (al.startsWith("--") || /page\s*\d+/i.test(al)) continue;
      achievementsList.push(al.replace(/^[•\-\*]\s*/, ""));
    }
  }

  // 5. Dynamic Domain Scoring & Matching
  const domainScoringResults = [];

  for (const [dom, keywords] of Object.entries(DOMAIN_SKILL_KEYWORDS)) {
    const matched = [];
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.push(kw);
      }
    }

    let matchScore = 0;
    if (matched.length > 0) {
      const baseRatio = matched.length / Math.min(keywords.length, 6);
      matchScore = Math.min(96, Math.round(58 + baseRatio * 38));
    } else {
      matchScore = 25;
    }

    domainScoringResults.push({
      label: dom,
      matchScore,
      matchedKeywords: matched,
    });
  }

  domainScoringResults.sort((a, b) => b.matchScore - a.matchScore);

  const recommendedDomains = domainScoringResults.slice(0, 4).map((d, idx) => {
    let priority = "Low";
    if (d.matchScore >= 75) priority = "High";
    else if (d.matchScore >= 50) priority = "Medium";

    const matchedStr = d.matchedKeywords.slice(0, 3).join(", ");
    let reason = "";
    if (d.matchedKeywords.length > 0) {
      reason = `Demonstrated practical competency with ${matchedStr}, showing strong alignment with ${d.label} interview requirements.`;
    } else {
      reason = `Assessment of foundational programming principles and algorithmic problem solving.`;
    }

    return {
      label: d.label,
      matchScore: d.matchScore,
      confidence: d.matchScore,
      priority,
      reason,
      matchedSkills: d.matchedKeywords.slice(0, 4),
    };
  });

  // 6. Professional Summary
  const topDomain = recommendedDomains[0]?.label || "Software Engineering";
  const primarySkillsStr = allSkillsList.slice(0, 5).join(", ") || "modern programming tools";
  const summary = `${candidateName ? candidateName + " is an" : "Candidate is an"} ambitious ${candidateLevel.toLowerCase()} with a primary focus in ${topDomain}. Possesses hands-on technical proficiency in ${primarySkillsStr}. Demonstrates strong engineering fundamentals, structured project development experience, and solid readiness for technical interview evaluations.`;

  // 7. Dynamic Strengths & Areas for Improvement
  const strengths = [];
  if (categorizedSkills.languages.length >= 2) {
    strengths.push(`Versatile multi-language foundation with proficiency in ${categorizedSkills.languages.slice(0, 3).join(", ")}.`);
  }
  if (categorizedSkills.databases.length >= 1) {
    strengths.push(`Practical database schema modeling and data persistence management using ${categorizedSkills.databases.slice(0, 2).join(", ")}.`);
  }
  if (projectsList.length >= 2) {
    strengths.push(`Demonstrated hands-on software development through ${projectsList.length} distinct project implementations.`);
  }
  if (experienceList.some((e) => e.role.toLowerCase().includes("intern"))) {
    strengths.push(`Real-world industry exposure via practical software internship experience.`);
  }
  if (strengths.length < 3) {
    strengths.push("Clear presentation of academic excellence, coding practice, and problem solving.");
  }

  const improvements = [];
  const hasMetrics = /\b(\d+%\s*(?:accuracy|increase|reduction|growth|improvement)|\d+k?\s*(?:users|requests|downloads))\b/i.test(text);
  if (!hasMetrics) {
    improvements.push("Incorporate quantifiable impact and business metrics (e.g., '% performance improvement', 'users served') in all project descriptions.");
  }
  if (categorizedSkills.cloudDevOps.length === 0) {
    improvements.push("Broaden cloud deployment and containerization skills (e.g., Docker, AWS, CI/CD pipelines) to strengthen full-stack deployability.");
  }
  if (!text.toLowerCase().includes("test") && !text.toLowerCase().includes("jest") && !text.toLowerCase().includes("pytest")) {
    improvements.push("Highlight unit testing and automated quality assurance practices (e.g., Jest, PyTest, TDD) to signal production readiness.");
  }
  if (improvements.length < 3) {
    improvements.push("Provide deeper technical explanations for architectural patterns and data flow mechanisms in projects.");
  }

  // 8. Missing Information Checklist
  const missingInformation = [];
  if (!githubMatch) missingInformation.push("GitHub Profile URL not detected");
  if (!linkedinMatch) missingInformation.push("LinkedIn Profile URL not detected");
  if (!phoneMatch) missingInformation.push("Contact Phone Number not detected");
  if (!hasMetrics) missingInformation.push("Quantifiable metrics (% or numerical KPIs) in project bullets");
  if (certificationsList.length === 0) missingInformation.push("Industry certifications or specialized course accreditations");

  // 9. Resume Quality & ATS Score
  let contactScore = 0;
  if (candidateName && candidateName !== "Candidate") contactScore += 25;
  if (emailMatch) contactScore += 30;
  if (phoneMatch) contactScore += 25;
  if (linkedinMatch || githubMatch) contactScore += 20;

  const skillsScore = Math.min(100, Math.max(30, allSkillsList.length * 10));
  const projExpScore = Math.min(100, (projectsList.length + experienceList.length) * 25);
  const impactScore = hasMetrics ? 85 : 55;
  const structureScore = Math.min(100, Math.max(60, sectionPositions.length * 15));
  const readabilityScore = text.length > 200 && text.length < 4500 ? 90 : 70;

  const overallScore = Math.round(
    contactScore * 0.15 +
    skillsScore * 0.20 +
    projExpScore * 0.25 +
    impactScore * 0.15 +
    structureScore * 0.15 +
    readabilityScore * 0.10
  );

  let rating = "Good";
  if (overallScore >= 80) rating = "Strong";
  else if (overallScore < 60) rating = "Needs Improvement";

  const qualityTips = [];
  if (impactScore < 70) qualityTips.push("Add quantifiable metrics to project outcomes (e.g. 90% accuracy, users served).");
  if (!githubMatch) qualityTips.push("Include a link to your public GitHub profile to showcase code quality.");
  if (categorizedSkills.cloudDevOps.length === 0) qualityTips.push("Learn and feature containerization tools like Docker to stand out in technical screenings.");
  if (qualityTips.length === 0) qualityTips.push("Keep project descriptions concise with clear action verbs and measurable results.");

  return {
    candidate: {
      name: candidateName || "Candidate",
      title: detectedTitle || "Aspiring Software Engineer",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      linkedin: linkedinMatch ? linkedinMatch[0] : "",
      github: githubMatch ? githubMatch[0] : "",
      portfolio: portfolioMatch ? portfolioMatch[0] : "",
      location: text.includes("India") ? "India" : "",
    },
    candidateLevel: {
      level: candidateLevel,
      reasoning: candidateLevelReason,
      yearsOfExperience: maxExpYears,
    },
    summary,
    skills: categorizedSkills,
    experience: experienceList,
    education: educationList,
    projects: projectsList,
    certifications: certificationsList,
    achievements: achievementsList,
    recommendedDomains,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    missingInformation,
    resumeQuality: {
      overallScore,
      rating,
      breakdown: {
        contactCompleteness: contactScore,
        skillsClarity: skillsScore,
        experienceOrProjects: projExpScore,
        quantifiableImpact: impactScore,
        structureCompleteness: structureScore,
        formattingReadability: readabilityScore,
      },
      tips: qualityTips,
    },
    // Compatibility fields
    experienceLevel: simplifiedLevel,
    skillsDetected: allSkillsList.slice(0, 15),
  };
}

/**
 * Controller: analyzeResume
 */
const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded. Please upload a resume file (PDF, DOCX, or TXT).",
        message: "No file uploaded. Please upload a resume file (PDF, DOCX, or TXT).",
      });
    }

    let resumeText = "";
    try {
      resumeText = await extractTextFromFile(req.file);
    } catch (extractionError) {
      console.error("Text extraction failed:", extractionError.message);
      return res.status(400).json({
        error: INVALID_RESUME_MESSAGE,
        message: INVALID_RESUME_MESSAGE,
      });
    }

    // Validate if document is a genuine resume
    const isValid = validateResumeText(resumeText);
    if (!isValid) {
      return res.status(400).json({
        error: INVALID_RESUME_MESSAGE,
        message: INVALID_RESUME_MESSAGE,
      });
    }

    const truncated = resumeText.slice(0, 7000);

    // Tier 1: Groq AI attempt if valid API key is present
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_")) {
      try {
        const groq = new Groq({ apiKey });
        const prompt = `
You are an expert technical recruiter, career coach, and ATS resume analyzer.
Analyze the following resume and respond ONLY with a valid JSON object. No explanations or text outside the JSON.

Available Interview Domains on our platform: ${DOMAINS.join(", ")}

Resume Text:
"""
${truncated}
"""

Rules:
1. All analysis must be 100% grounded strictly in the provided resume text.
2. DO NOT invent fake companies, fake years of experience, or skills not present.
3. If the candidate is a student, intern, or fresh graduate, candidateLevel.level MUST be "Fresher / Entry Level". DO NOT classify students as Senior.
4. Categorize skills ONLY if they appear in the resume.
5. In recommendedDomains, recommend the best-fitting domains from the available domains list, calculate genuine match scores (0-100), assign priority ("High", "Medium", "Low"), and cite specific skills as evidence.

JSON Schema:
{
  "candidate": {
    "name": "Extracted Candidate Name or empty",
    "title": "Detected Professional Headline/Title",
    "email": "email or empty",
    "phone": "phone or empty",
    "linkedin": "linkedin url or empty",
    "github": "github url or empty",
    "portfolio": "portfolio url or empty"
  },
  "candidateLevel": {
    "level": "Fresher / Entry Level" | "Junior Developer" | "Mid-Level Developer" | "Senior Developer / Lead",
    "reasoning": "Reason based on graduation year, student status, or actual work experience duration",
    "yearsOfExperience": 0
  },
  "summary": "2-3 sentence professional summary based strictly on this resume",
  "skills": {
    "languages": ["..."],
    "frontend": ["..."],
    "backend": ["..."],
    "databases": ["..."],
    "cloudDevOps": ["..."],
    "toolsAndOthers": ["..."]
  },
  "experience": [
    {
      "role": "Job Title or Internship",
      "company": "Company Name",
      "duration": "Dates/Duration",
      "description": "Responsibilities",
      "highlights": ["..."]
    }
  ],
  "education": [
    {
      "degree": "Degree / Field",
      "institution": "University / College",
      "year": "Graduation Year",
      "gpa": "CGPA/GPA if present"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Short description of project",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuer",
      "year": "Year"
    }
  ],
  "achievements": ["Achievement 1"],
  "recommendedDomains": [
    {
      "label": "Domain Name from Available List",
      "matchScore": 92,
      "priority": "High" | "Medium" | "Low",
      "reason": "Why recommended based on specific skills in resume",
      "matchedSkills": ["skill1", "skill2"]
    }
  ],
  "strengths": ["Strength 1 based on real evidence", "Strength 2", "Strength 3"],
  "improvements": ["Improvement area 1 based on real gaps", "Improvement area 2", "Improvement area 3"],
  "missingInformation": ["Missing item 1 (e.g. metrics, github, etc.)"],
  "resumeQuality": {
    "overallScore": 82,
    "rating": "Strong" | "Good" | "Needs Improvement",
    "breakdown": {
      "contactCompleteness": 90,
      "skillsClarity": 85,
      "experienceOrProjects": 80,
      "quantifiableImpact": 60,
      "structureCompleteness": 95,
      "formattingReadability": 90
    },
    "tips": ["Tip 1", "Tip 2"]
  }
}
`.trim();

        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const raw = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);

        if (parsed && parsed.recommendedDomains && Array.isArray(parsed.recommendedDomains)) {
          parsed.recommendedDomains = parsed.recommendedDomains.filter((d) =>
            DOMAINS.includes(d.label)
          );
          parsed.experienceLevel =
            parsed.candidateLevel?.level?.includes("Senior")
              ? "Senior"
              : parsed.candidateLevel?.level?.includes("Mid")
              ? "Mid"
              : "Junior";
          parsed.skillsDetected = [
            ...(parsed.skills?.languages || []),
            ...(parsed.skills?.frontend || []),
            ...(parsed.skills?.backend || []),
            ...(parsed.skills?.databases || []),
            ...(parsed.skills?.cloudDevOps || []),
            ...(parsed.skills?.toolsAndOthers || []),
          ].slice(0, 15);

          return res.json({ analysis: parsed, message: "Analysis complete" });
        }
      } catch (groqErr) {
        console.warn("Groq AI analysis error, executing Tier 2 deterministic engine:", groqErr.message);
      }
    }

    // Tier 2: High-Precision Deterministic Analysis Fallback
    const analysis = performDeterministicAnalysis(resumeText);
    return res.json({ analysis, message: "Analysis complete" });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({
      error: "Failed to analyze resume. Please try again.",
      message: error.message || "Failed to analyze resume",
    });
  }
};

module.exports = {
  analyzeResume,
  validateResumeText,
  performDeterministicAnalysis,
  extractTextFromFile,
};
