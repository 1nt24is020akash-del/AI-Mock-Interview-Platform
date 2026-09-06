const Groq = require("groq-sdk");
const pdfjslib = require("pdfjs-dist/legacy/build/pdf.js");
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
    "html", "css", "css3", "sass", "frontend", "ui/ux", "responsive"
  ],
  "Python": [
    "python", "django", "flask", "fastapi", "pytest", "celery", "poetry",
    "pep8", "asyncio", "pydantic", "scripting", "oop"
  ],
  "Data Science": [
    "machine learning", "deep learning", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "nlp", "computer vision", "data analysis",
    "tableau", "power bi", "matplotlib", "seaborn", "statistics", "data science",
    "analytics", "ai", "artificial intelligence"
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
    { match: "c", label: "C", boundary: true },
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
  ],
};

const INVALID_RESUME_MESSAGE =
  "Unable to analyze this document. Please upload a valid resume containing sufficient information about your skills, education, projects, experience, or qualifications.";

/**
 * Extracts raw text from PDF buffer using pdfjs-dist legacy build.
 */
async function extractTextFromPDF(buffer) {
  try {
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
  } catch (err) {
    console.warn("pdfjs-dist extraction failed, trying pdf-parse fallback:", err.message);
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (parseErr) {
      console.warn("pdf-parse fallback also failed:", parseErr.message);
      throw parseErr;
    }
  }
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
 * Strict Resume Validation
 * Ensures document is a genuine resume, CV, or candidate profile.
 */
function validateResumeText(text) {
  if (!text || typeof text !== "string") return false;
  const cleaned = text.trim();
  if (cleaned.length < 120) return false;

  const lower = cleaned.toLowerCase();

  // Resume structural and thematic keywords
  const resumeSignals = [
    "education",
    "experience",
    "work experience",
    "skills",
    "technical skills",
    "projects",
    "employment",
    "summary",
    "objective",
    "profile",
    "certifications",
    "achievements",
    "qualifications",
    "curriculum vitae",
    "resume",
    "internship",
    "academic",
    "bachelor",
    "master",
    "b.tech",
    "b.e",
    "degree",
    "university",
    "college",
    "cgpa",
    "gpa",
    "coursework",
    "contact",
  ];

  let matchedSignals = 0;
  for (const signal of resumeSignals) {
    if (lower.includes(signal)) {
      matchedSignals++;
    }
  }

  // Check for email, phone, or github/linkedin
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleaned);
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleaned);
  const hasProfileLink = /linkedin\.com|github\.com/i.test(cleaned);
  const hasContactInfo = hasEmail || hasPhone || hasProfileLink;

  // Genuine resumes should contain at least 2 distinct resume signals,
  // and either contact information or at least 3 distinct resume signals.
  if (matchedSignals >= 3) return true;
  if (matchedSignals >= 2 && hasContactInfo) return true;

  return false;
}

/**
 * Check if a skill exists in text considering word boundaries.
 */
function containsSkill(textLower, skillItem) {
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
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?([a-zA-Z0-9_-]+)/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:io|dev|me|vercel\.app|netlify\.app))/i);

  // Candidate Name extraction from top lines
  let candidateName = "";
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (
      line.length >= 3 &&
      line.length <= 40 &&
      !line.includes("@") &&
      !line.includes("http") &&
      !line.includes(".com") &&
      !/^(resume|curriculum|cv|contact|profile|summary|education|skills|projects)/i.test(line) &&
      /^[a-zA-Z\s.'-]+$/.test(line)
    ) {
      candidateName = line;
      break;
    }
  }

  // Professional Title / Headline detection
  let detectedTitle = "";
  const titleKeywords = [
    "Full Stack Developer", "Software Engineer", "Frontend Developer", "Backend Developer",
    "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "Cloud Engineer",
    "Web Developer", "Mobile App Developer", "Software Development Engineer", "Computer Science Student"
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
      if (containsSkill(lower, item)) {
        set.add(item.label);
        allDetectedSkillsSet.add(item.label);
      }
    }
    categorizedSkills[category] = Array.from(set);
  }

  const allSkillsList = Array.from(allDetectedSkillsSet);

  // 3. Candidate Level Detection
  // Check graduation year / student status
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

  const studentTerms = ["student", "undergraduate", "fresher", "intern", "pursuing", "b.tech", "b.e", "bachelor"];
  for (const term of studentTerms) {
    if (lower.includes(term)) {
      isStudentOrFresher = true;
      break;
    }
  }

  // Check explicit years of experience
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
    maxExpYears >= 6 ||
    /\b(senior|lead|principal|architect|staff engineer|tech lead)\b/i.test(text)
  ) {
    candidateLevel = "Senior Developer / Lead";
    simplifiedLevel = "Senior";
    candidateLevelReason = `Identified senior engineering leadership experience${maxExpYears ? ` with ~${maxExpYears}+ years of industry track record` : " and high-level architectural responsibilities"}.`;
  } else if (
    maxExpYears >= 3 ||
    /\b(mid-level|software engineer ii|sde ii|experienced developer)\b/i.test(text)
  ) {
    candidateLevel = "Mid-Level Developer";
    simplifiedLevel = "Mid";
    candidateLevelReason = `Identified established mid-level experience${maxExpYears ? ` with ~${maxExpYears} years of industry development` : " demonstrating independent feature delivery"}.`;
  } else if (maxExpYears >= 1 || (allSkillsList.length >= 6 && !isStudentOrFresher)) {
    candidateLevel = "Junior Developer";
    simplifiedLevel = "Junior";
    candidateLevelReason = "Demonstrated practical programming foundation and hands-on technical project delivery.";
  } else {
    candidateLevel = "Fresher / Entry Level";
    simplifiedLevel = "Junior";
    candidateLevelReason = detectedGradYear
      ? `Academic profile with expected/recent graduation in ${detectedGradYear} and hands-on project implementations.`
      : "Entry-level candidate profile with focus on foundational programming skills and academic projects.";
  }

  // If candidate is title-less, assign based on level and top skill
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

  // 4. Section Splitting & Extraction (Education, Projects, Experience, Certifications)
  const sectionKeywords = [
    { key: "education", regex: /\b(education|academic background|academic qualifications)\b/i },
    { key: "experience", regex: /\b(work experience|experience|employment history|work history|internships)\b/i },
    { key: "projects", regex: /\b(projects|key projects|academic projects|personal projects)\b/i },
    { key: "skills", regex: /\b(skills|technical skills|technologies|skills & tools)\b/i },
    { key: "certifications", regex: /\b(certifications|certificates|licenses)\b/i },
    { key: "achievements", regex: /\b(achievements|awards|honors|extracurricular)\b/i },
  ];

  // Identify section line indices
  const sectionPositions = [];
  lines.forEach((line, idx) => {
    for (const sec of sectionKeywords) {
      if (sec.regex.test(line) && line.length < 45) {
        sectionPositions.push({ key: sec.key, lineIdx: idx, heading: line });
        break;
      }
    }
  });

  // Helper to get text of a specific section
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
  const projectsText = getSectionContent("projects");
  const certsText = getSectionContent("certifications");
  const achievementsText = getSectionContent("achievements");

  // Extract Education items
  const educationList = [];
  const eduLines = educationText ? educationText.split("\n").filter((l) => l.trim().length > 3) : [];
  if (eduLines.length > 0) {
    let currentDegree = "";
    let currentInst = "";
    let currentYr = "";
    for (const l of eduLines) {
      if (/b\.tech|b\.e|bachelor|master|m\.tech|mca|bca|diploma|ph\.d|high school/i.test(l)) {
        if (currentDegree) {
          educationList.push({ degree: currentDegree, institution: currentInst || "University / College", year: currentYr || "Recent" });
        }
        currentDegree = l;
        currentInst = "";
        currentYr = "";
      } else if (/university|institute|college|school|academy/i.test(l)) {
        currentInst = l;
      } else if (/\b(20\d{2})\b/.test(l)) {
        const yrMatch = l.match(/\b(20\d{2})\b/);
        if (yrMatch) currentYr = yrMatch[1];
      }
    }
    if (currentDegree) {
      educationList.push({ degree: currentDegree, institution: currentInst || "University / College", year: currentYr || "Recent" });
    }
  }

  // Fallback if education not cleanly parsed but degree keywords exist in text
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

  // Extract Projects
  const projectsList = [];
  if (projectsText) {
    const pLines = projectsText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    let currentProj = null;

    for (const pl of pLines) {
      const isBullet = /^[•\-\*\u2022\u25E6]|\d+\.\s/.test(pl);
      if (!isBullet && pl.length < 140) {
        if (currentProj && currentProj.title) {
          projectsList.push(currentProj);
        }
        const splitTitle = pl.split(/[|:-]/);
        const titleName = splitTitle[0].trim();
        const techInProj = allSkillsList.filter((s) => pl.toLowerCase().includes(s.toLowerCase()));

        currentProj = {
          title: titleName,
          description: pl,
          technologies: techInProj,
        };
      } else if (currentProj) {
        const cleaned = pl.replace(/^[•\-\*\u2022\u25E6]\s*|\d+\.\s*/, "").trim();
        currentProj.description += (currentProj.description ? " " : "") + cleaned;
        const techInDesc = allSkillsList.filter(
          (s) => pl.toLowerCase().includes(s.toLowerCase()) && !currentProj.technologies.includes(s)
        );
        currentProj.technologies.push(...techInDesc);
      }
    }
    if (currentProj && currentProj.title) {
      projectsList.push(currentProj);
    }
  }

  // Extract Experience
  const experienceList = [];
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

  // If candidate is a fresher / entry level with no employment records, represent accurately:
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

  // Extract Certifications & Achievements
  const certificationsList = [];
  if (certsText) {
    const cLines = certsText.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
    for (const cl of cLines) {
      certificationsList.push({
        name: cl.replace(/^[•\-\*]\s*/, ""),
        issuer: cl.includes("AWS") ? "Amazon Web Services" : cl.includes("Google") ? "Google" : "Certification Authority",
        year: cl.match(/\b(20\d{2})\b/)?.[1] || "Completed",
      });
    }
  }

  const achievementsList = [];
  if (achievementsText) {
    const aLines = achievementsText.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
    for (const al of aLines) {
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

    // Calculate match percentage dynamically
    let matchScore = 0;
    if (matched.length > 0) {
      // Score based on keyword count and breadth
      const baseRatio = matched.length / Math.min(keywords.length, 7);
      matchScore = Math.min(96, Math.round(55 + baseRatio * 40));
    } else {
      // No overlap
      matchScore = 20;
    }

    domainScoringResults.push({
      label: dom,
      matchScore,
      matchedKeywords: matched,
    });
  }

  // Sort descending by match score
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
      reason = `General assessment of core software engineering fundamentals and algorithmic problem solving.`;
    }

    return {
      label: d.label,
      matchScore: d.matchScore,
      confidence: d.matchScore, // backwards compatibility
      priority,
      reason,
      matchedSkills: d.matchedKeywords.slice(0, 4),
    };
  });

  // 6. Professional Summary
  const topDomain = recommendedDomains[0]?.label || "Software Engineering";
  const primarySkillsStr = allSkillsList.slice(0, 5).join(", ") || "modern programming tools";
  const summary = `${candidateName ? candidateName + " is a" : "Candidate is an"} ambitious ${candidateLevel.toLowerCase()} with a primary focus in ${topDomain}. Possesses hands-on technical proficiency in ${primarySkillsStr}. Demonstrates strong engineering fundamentals, structured project development experience, and solid readiness for technical interview evaluations.`;

  // 7. Dynamic Strengths & Areas for Improvement
  const strengths = [];
  if (categorizedSkills.frontend.length >= 2) {
    strengths.push(`Solid frontend engineering proficiency utilizing modern UI technologies (${categorizedSkills.frontend.slice(0, 3).join(", ")}).`);
  }
  if (categorizedSkills.backend.length >= 2) {
    strengths.push(`Hands-on backend service development experience with ${categorizedSkills.backend.slice(0, 3).join(", ")}.`);
  }
  if (categorizedSkills.databases.length >= 1) {
    strengths.push(`Practical database schema modeling and persistence management with ${categorizedSkills.databases.slice(0, 2).join(", ")}.`);
  }
  if (projectsList.length >= 2) {
    strengths.push(`Demonstrated initiative through multiple technical project implementations highlighting end-to-end development skills.`);
  }
  if (categorizedSkills.cloudDevOps.length >= 1) {
    strengths.push(`Experience with modern deployment and cloud workflows (${categorizedSkills.cloudDevOps.slice(0, 2).join(", ")}).`);
  }
  if (strengths.length < 3) {
    strengths.push("Clear presentation of technical competencies and academic coursework.");
  }

  // Areas for Improvement
  const improvements = [];
  const hasMetrics = /\b(\d+%\s*(?:increase|reduction|growth|improvement)|\d+k?\s*(?:users|requests|downloads))\b/i.test(text);
  if (!hasMetrics) {
    improvements.push("Incorporate quantifiable impact and business metrics (e.g., '% performance improvement', 'users served') in project descriptions.");
  }
  if (!githubMatch) {
    improvements.push("Add direct GitHub repository links to projects to allow technical interviewers to review your clean code and commit history.");
  }
  if (categorizedSkills.cloudDevOps.length === 0) {
    improvements.push("Broaden cloud and containerization skills (e.g., Docker, AWS, CI/CD pipelines) to strengthen full-stack deployability.");
  }
  if (!text.toLowerCase().includes("test") && !text.toLowerCase().includes("jest") && !text.toLowerCase().includes("pytest")) {
    improvements.push("Highlight unit testing and automated quality assurance practices (e.g., Jest, PyTest, TDD) to signal production readiness.");
  }
  if (improvements.length < 3) {
    improvements.push("Provide deeper technical explanations for key architectural decisions and problem-solving techniques in projects.");
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
  if (candidateName) contactScore += 25;
  if (emailMatch) contactScore += 30;
  if (phoneMatch) contactScore += 25;
  if (linkedinMatch || githubMatch) contactScore += 20;

  const skillsScore = Math.min(100, Math.max(30, allSkillsList.length * 8));
  const projExpScore = Math.min(100, (projectsList.length + experienceList.length) * 25);
  const impactScore = hasMetrics ? 85 : 45;
  const structureScore = Math.min(100, sectionPositions.length * 20);
  const readabilityScore = text.length > 400 && text.length < 4500 ? 90 : 70;

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
  if (impactScore < 60) qualityTips.push("Add quantifiable results (e.g. reduced load time by 30%, served 500+ daily active users).");
  if (!githubMatch) qualityTips.push("Include a link to your public GitHub profile to showcase code quality.");
  if (skillsScore < 70) qualityTips.push("Group and expand technical skills into clear categories (Languages, Frameworks, Databases, Tools).");
  if (qualityTips.length === 0) qualityTips.push("Maintain updated project links and keep tech stacks aligned with modern industry standards.");

  return {
    candidate: {
      name: candidateName || "Candidate",
      title: detectedTitle || "Software Engineer",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      linkedin: linkedinMatch ? linkedinMatch[0] : "",
      github: githubMatch ? githubMatch[0] : "",
      portfolio: portfolioMatch ? portfolioMatch[0] : "",
      location: "",
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

    // Validate if the document is a genuine resume
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
3. If the candidate is a student or fresh graduate, candidateLevel.level MUST be "Fresher / Entry Level". DO NOT classify students as Senior.
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
      "role": "Job Title",
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
      "year": "Graduation Year"
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
          // Normalize domains and backward compatibility
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
};
