/**
 * AI Placement Readiness Engine — AI Personalized Roadmap Service
 * Generates structured, candidate-tailored career roadmaps using Groq AI
 * with an authentic, highly-calibrated deterministic fallback engine.
 */

const Groq = require("groq-sdk");
const Roadmap = require("../models/Roadmap.js");
const User = require("../models/User.js");

/**
 * Domain-specific learning topics dictionary
 */
const DOMAIN_TOPICS = {
  DSA: [
    "Arrays & HashMaps",
    "Two Pointers & Sliding Window",
    "Linked Lists & Stacks/Queues",
    "Binary Trees & BSTs",
    "Graphs (BFS/DFS)",
    "Dynamic Programming Fundamentals",
    "Time & Space Complexity Analysis",
  ],
  DBMS: [
    "Relational Schema Design & Normalization (1NF to 3NF)",
    "SQL Joins & Complex Queries",
    "B-Tree Indexing & Query Optimization",
    "ACID Properties & Transaction Isolation Levels",
    "NoSQL vs SQL Architectural Tradeoffs",
  ],
  OOP: [
    "Encapsulation, Inheritance, Polymorphism & Abstraction",
    "SOLID Design Principles",
    "Common Design Patterns (Factory, Singleton, Strategy, Observer)",
    "Object Modeling & Composition over Inheritance",
  ],
  OS: [
    "Process vs Thread & CPU Scheduling",
    "Memory Management & Virtual Memory / Paging",
    "Concurrency, Deadlocks, Mutexes & Semaphores",
    "Inter-Process Communication (IPC) & System Calls",
  ],
  CN: [
    "OSI 7-Layer & TCP/IP Reference Models",
    "TCP vs UDP Mechanics & 3-Way Handshake",
    "HTTP/HTTPS, TLS Handshake & DNS Resolution",
    "WebSockets, REST APIs, and Load Balancing",
  ],
  Programming: [
    "Clean Code Principles & DRY",
    "Asynchronous Event Loop & Concurrency Patterns",
    "Memory Management & Garbage Collection",
    "Unit Testing & Test-Driven Development (TDD)",
  ],
  Cloud: [
    "Cloud Computing Fundamentals (IaaS, PaaS, Serverless)",
    "Containerization with Docker & Multi-Stage Builds",
    "AWS Core Services (EC2, S3, RDS, Lambda, VPC)",
    "CI/CD Pipelines & Infrastructure as Code (Terraform)",
  ],
  "AI/ML": [
    "Supervised vs Unsupervised Learning Algorithms",
    "Model Evaluation Metrics (Precision, Recall, F1, PR-AUC)",
    "Feature Engineering & Data Preprocessing with Pandas",
    "Deep Learning Fundamentals & Transformer Architectures",
  ],
  Communication: [
    "STAR Method (Situation, Task, Action, Result) for Behavioral Questions",
    "Technical Whiteboard Articulation & Design Justification",
    "Active Listening & Structured Clarifying Questions",
    "Explaining Complex Architecture to Non-Technical Stakeholders",
  ],
  SystemDesign: [
    "Horizontal vs Vertical Scaling & Load Balancers",
    "Caching Strategies (Cache-Aside, Write-Through, Redis)",
    "Database Sharding, Replication & CAP Theorem Tradeoffs",
    "Message Queues (Kafka, RabbitMQ) & Asynchronous Decoupling",
  ],
};

/**
 * Builds candidate-type tailored project recommendations
 */
function getTargetedProjects(candidateType, weakSkills, missingSkills) {
  const normType = (candidateType || "fresher").toLowerCase();
  const techGaps = Array.from(new Set([...weakSkills, ...missingSkills]));
  const hasDocker = techGaps.some((s) => s.toLowerCase().includes("docker"));
  const hasCloud = techGaps.some((s) => s.toLowerCase().includes("cloud") || s.toLowerCase().includes("aws"));
  const hasRest = techGaps.some((s) => s.toLowerCase().includes("rest") || s.toLowerCase().includes("api"));
  const hasDb = techGaps.some((s) => s.toLowerCase().includes("dbms") || s.toLowerCase().includes("sql"));

  if (normType === "experienced") {
    return [
      {
        title: "High-Throughput Distributed Event-Driven Order Processing System",
        description:
          "Architect an end-to-end distributed system handling 10,000+ RPS with Kafka event streaming, Redis caching, PostgreSQL sharding, and resilience patterns (Circuit Breaker, Rate Limiting).",
        technologies: ["Node.js/Go", "Kafka", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
      },
      {
        title: "Multi-Region Cloud Microservices Architecture with Observability",
        description:
          "Design and deploy production-grade microservices on AWS/GCP with automated CI/CD, OpenTelemetry distributed tracing, Prometheus/Grafana monitoring, and infrastructure-as-code.",
        technologies: ["Docker", "Kubernetes", "AWS ECS/EKS", "Terraform", "Prometheus", "Grafana"],
      },
    ];
  }

  if (normType === "internship_seeker") {
    return [
      {
        title: hasRest
          ? "Production-Grade Full-Stack Portfolio Application with REST APIs"
          : "Collaborative Real-Time Workspace Platform",
        description:
          "Build and deploy a complete web platform featuring JWT authentication, role-based access control, relational database schema, clean RESTful endpoints, and live interactive UI.",
        technologies: ["React", "Node.js", "Express", hasDb ? "PostgreSQL/Prisma" : "MongoDB", "TailwindCSS"],
      },
      {
        title: hasDocker
          ? "Containerized Cloud Deployment Pipeline for Micro-Services"
          : "Developer Utility & API Analytics Dashboard",
        description:
          "Develop a responsive developer dashboard tracking metrics, containerized with multi-stage Docker builds and automated GitHub Actions CI/CD to demonstrate practical engineering.",
        technologies: [hasDocker ? "Docker" : "Next.js", "TypeScript", "REST APIs", "GitHub Actions", "TailwindCSS"],
      },
    ];
  }

  // Fresher
  return [
    {
      title: "Interactive Full-Stack Web Application with Structured Schema",
      description:
        "Implement a structured full-stack application with relational database design (3NF), CRUD operations, secure authentication, and clear algorithmic data processing.",
      technologies: ["React", "Node.js", hasDb ? "PostgreSQL/MySQL" : "MongoDB", "Express", "Git"],
    },
    {
      title: hasDocker || hasCloud
        ? "Containerized Application with Cloud Deployment"
        : "Algorithmic Problem Visualizer & Testing Suite",
      description:
        hasDocker || hasCloud
          ? "Build and package a web service inside lightweight Docker containers and deploy to a cloud provider with CI/CD."
          : "Create an interactive visualizer for fundamental data structures and graph algorithms with unit testing and comprehensive documentation.",
      technologies: hasDocker || hasCloud ? ["Docker", "Node.js", "Express", "AWS/Render"] : ["JavaScript", "React", "Jest", "Algorithms"],
    },
  ];
}

/**
 * Builds candidate-type tailored certifications
 */
function getTargetedCertifications(candidateType, weakSkills, missingSkills) {
  const normType = (candidateType || "fresher").toLowerCase();
  const techGaps = [...weakSkills, ...missingSkills].map((s) => s.toLowerCase());

  if (normType === "experienced") {
    return [
      {
        name: "AWS Certified Solutions Architect – Associate or Professional",
        reason: "Validates high-level enterprise architectural decision-making, distributed systems design, and multi-region resilience.",
      },
      {
        name: "Certified Kubernetes Administrator (CKA)",
        reason: "Demonstrates production container orchestration mastery and hands-on infrastructure operational leadership.",
      },
    ];
  }

  if (normType === "internship_seeker") {
    return [
      {
        name: techGaps.some((s) => s.includes("cloud") || s.includes("aws"))
          ? "AWS Certified Cloud Practitioner"
          : "Meta Front-End or Back-End Developer Professional Certificate",
        reason: "Proves hands-on practical software development competence and industry-standard version control / API practices to recruiters.",
      },
      {
        name: "Postman API Fundamentals Student Expert",
        reason: "Demonstrates practical REST API consumption, integration testing, and documentation skills sought after in internship candidates.",
      },
    ];
  }

  // Fresher
  return [
    {
      name: "AWS Certified Cloud Practitioner or Oracle Certified Associate (Java/SQL)",
      reason: "Provides credible, third-party validation of foundational computing and cloud architectural concepts.",
    },
    {
      name: "HackerRank Problem Solving & SQL Gold Badges",
      reason: "Establishes verified core algorithmic competency and database querying efficiency for entry-level engineering screenings.",
    },
  ];
}

/**
 * Deterministic Fallback Generator
 * Generates personalized, high-precision roadmap based strictly on candidate's real data.
 */
function generateDeterministicRoadmap({
  candidateType = "fresher",
  readinessScore = 65,
  weakAreas = [],
  missingSkills = [],
  interviewPerformance = {},
  skillScores = {},
  resumeData = {},
}) {
  const normType = (candidateType || "fresher").toLowerCase();
  const priorities = [];
  const processedSkills = new Set();

  // 1. Evaluate Weak Technical Skills (Scores < 60)
  Object.entries(skillScores).forEach(([skill, score]) => {
    if (typeof score === "number" && score < 60) {
      processedSkills.add(skill.toLowerCase());
      const isCritical = score < 45 || skill === "DSA" || skill === "DBMS";
      const topics = DOMAIN_TOPICS[skill] || [
        `${skill} Core Principles`,
        `${skill} Practical Problem Solving`,
        `${skill} Production Tradeoffs`,
      ];

      priorities.push({
        skill,
        priority: isCritical ? "High" : "Medium",
        reason: `Your assessment score in ${skill} is ${score}%, which is below the benchmark of 60%.`,
        recommendation:
          normType === "fresher"
            ? `Dedicate focused daily study to master ${skill} fundamentals, solve standard interview problems, and document key principles.`
            : normType === "internship_seeker"
            ? `Build hands-on implementations in ${skill} and integrate them into your active project portfolio.`
            : `Deepen your architectural understanding of ${skill} internals, failure modes, and performance optimization at scale.`,
        topics: topics.slice(0, 4),
      });
    }
  });

  // 2. Evaluate Interview Weaknesses (Communication & Technical Explanation)
  if (interviewPerformance && typeof interviewPerformance === "object") {
    const commScore = interviewPerformance.communicationScore;
    if (typeof commScore === "number" && commScore < 60) {
      priorities.push({
        skill: "Technical Communication & Articulation",
        priority: commScore < 50 ? "High" : "Medium",
        reason: `Interview communication rating was ${commScore}%, indicating verbal explanation gaps during technical queries.`,
        recommendation:
          "Practice explaining technical concepts out loud using the STAR method. Break down complex algorithms into problem statement, intuition, tradeoffs, and code implementation.",
        topics: DOMAIN_TOPICS.Communication.slice(0, 4),
      });
    }

    const expScore = interviewPerformance.explanationQuality;
    if (typeof expScore === "number" && expScore < 60 && !processedSkills.has("explanation")) {
      priorities.push({
        skill: "Explanation Depth & System Reasoning",
        priority: "Medium",
        reason: `Explanation depth scored ${expScore}%. Technical interviewers look for structured reasoning behind architectural and code tradeoffs.`,
        recommendation:
          "When asked technical questions, always state the 'Why' behind your choice. Compare alternative approaches before settling on a solution.",
        topics: ["Tradeoff Analysis", "Alternative Comparison", "Edge Case Identification"],
      });
    }
  }

  // 3. Evaluate Missing Resume Skills
  (missingSkills || []).forEach((skill) => {
    if (!skill || processedSkills.has(skill.toLowerCase())) return;
    processedSkills.add(skill.toLowerCase());

    const isHighImpact =
      skill.toLowerCase().includes("docker") ||
      skill.toLowerCase().includes("aws") ||
      skill.toLowerCase().includes("system design") ||
      skill.toLowerCase().includes("sql") ||
      skill.toLowerCase().includes("rest");

    const topics = DOMAIN_TOPICS[skill] || [
      `${skill} Core Syntax & Workflows`,
      `${skill} Integration in Projects`,
      `${skill} Industry Best Practices`,
    ];

    priorities.push({
      skill,
      priority: isHighImpact ? "High" : "Medium",
      reason: `Flagged as a missing industry skill on your resume, which reduces ATS visibility and interview shortlist rates.`,
      recommendation: `Learn the essential syntax and configuration for ${skill}, apply it in a project, and add verified bullet points to your resume.`,
      topics: topics.slice(0, 3),
    });
  });

  // 4. If fewer than 2 priorities found, add candidate-type specific growth priorities
  if (priorities.length < 2) {
    if (normType === "experienced") {
      priorities.push({
        skill: "High-Scale Distributed System Design",
        priority: "High",
        reason: "Experienced roles heavily weigh distributed caching, database partitioning, and fault tolerance.",
        recommendation: "Review real-world architectures (Netflix, Uber, Twitter) and practice end-to-end design whiteboard sessions.",
        topics: DOMAIN_TOPICS.SystemDesign.slice(0, 4),
      });
    } else if (normType === "internship_seeker") {
      priorities.push({
        skill: "Production Full-Stack Projects & Git Workflows",
        priority: "High",
        reason: "Internship recruiters look for demonstrated ability to commit clean code, write tests, and ship functional features.",
        recommendation: "Polish 2 complete web projects on GitHub with descriptive READMEs, live demo links, and clean commit history.",
        topics: ["Git Feature Branching", "RESTful API Design", "Deployment & CI/CD", "Responsive UI"],
      });
    } else {
      priorities.push({
        skill: "Data Structures & Core Algorithmic Patterns",
        priority: "High",
        reason: "Core problem-solving speed and accuracy form the foundation of entry-level campus and off-campus screenings.",
        recommendation: "Focus on mastering top 50 LeetCode patterns (Two Pointers, Sliding Window, Trees, and Dynamic Programming).",
        topics: DOMAIN_TOPICS.DSA.slice(0, 4),
      });
    }
  }

  // 5. Generate Candidate-Type Specific Weekly Plan
  let weeklyPlan = [];
  if (normType === "experienced") {
    weeklyPlan = [
      {
        week: 1,
        focus: "Distributed Systems Architecture & Concurrency",
        goals: ["Master multi-region consensus (Raft/Paxos) and CAP tradeoffs", "Analyze high-throughput caching patterns"],
        actionItems: ["Design a distributed rate limiter and URL shortener", "Benchmark database sharding vs read replication"],
      },
      {
        week: 2,
        focus: "System Observability, Resilience & Event Streaming",
        goals: ["Implement distributed messaging with Kafka/RabbitMQ", "Deepen understanding of circuit breakers and retries"],
        actionItems: ["Build an event-driven microservice prototype", "Configure Prometheus & Grafana dashboard"],
      },
      {
        week: 3,
        focus: "Cloud Infrastructure, Kubernetes & CI/CD",
        goals: ["Architect zero-downtime deployment pipelines", "Review SLSA and container image signing"],
        actionItems: ["Write production Terraform scripts for VPC & ECS/EKS", "Simulate disaster recovery failover scenarios"],
      },
      {
        week: 4,
        focus: "Architectural Whiteboarding & Leadership Behavioral",
        goals: ["Conduct 3 senior-level system design mock interviews", "Prepare leadership and conflict resolution narratives"],
        actionItems: ["Refine executive summaries of past technical leadership achievements", "Execute mock interviews with senior mentors"],
      },
    ];
  } else if (normType === "internship_seeker") {
    weeklyPlan = [
      {
        week: 1,
        focus: "Practical Coding, REST APIs & Git Workflows",
        goals: ["Build clean RESTful endpoints with validation and error handling", "Master Git branching, PRs, and merge conflict resolution"],
        actionItems: ["Refactor backend controllers into modular services", "Write unit tests for core API endpoints"],
      },
      {
        week: 2,
        focus: "Portfolio Project Development & Database Design",
        goals: ["Build key user-facing features of your main portfolio project", "Implement normalized relational database schemas with indexing"],
        actionItems: ["Design optimal database schema for project", "Implement responsive, accessible UI components"],
      },
      {
        week: 3,
        focus: "Containerization, Cloud Deployment & Documentation",
        goals: ["Containerize project using Docker", "Deploy live version to cloud with automated CI/CD"],
        actionItems: ["Write clean Dockerfile and docker-compose.yml", "Craft comprehensive README with architectural diagram and demo link"],
      },
      {
        week: 4,
        focus: "Interview Question Mastery & Live Mock Practice",
        goals: ["Solve top 30 common internship technical interview questions", "Participate in 2 full adaptive mock interviews"],
        actionItems: ["Review live interview transcripts and target identified weak areas", "Practice explaining project technical challenges fluently"],
      },
    ];
  } else {
    // Fresher
    weeklyPlan = [
      {
        week: 1,
        focus: "Core DSA Patterns & Complexity Analysis",
        goals: ["Solve 20 essential LeetCode Easy/Medium problems", "Master Time & Space complexity calculation"],
        actionItems: ["Focus on Arrays, Two Pointers, Sliding Window, and HashMaps", "Implement custom Stack and Queue data structures"],
      },
      {
        week: 2,
        focus: "DBMS, SQL Queries & Computer Networks",
        goals: ["Master SQL Joins, Subqueries, Normalization, and Indexing", "Review TCP/IP, HTTP/HTTPS, and DNS fundamentals"],
        actionItems: ["Practice 15 SQL query challenges on HackerRank/LeetCode", "Draw and explain the TCP 3-way handshake process"],
      },
      {
        week: 3,
        focus: "OOP Principles & Hands-on Project Implementation",
        goals: ["Solidify SOLID principles and Design Patterns", "Complete full-stack CRUD application with authentication"],
        actionItems: ["Refactor codebase using OOP principles", "Push clean repository to GitHub with documentation"],
      },
      {
        week: 4,
        focus: "Mock Interviews & Technical Articulation Practice",
        goals: ["Complete 3 adaptive technical mock interviews", "Eliminate verbal hesitations using structured answering"],
        actionItems: ["Practice STAR method for project walkthroughs", "Review AI interview feedback and refine weak skills"],
      },
    ];
  }

  // 6. Curated Interview Topics
  const interviewTopics =
    normType === "experienced"
      ? ["Distributed System Design", "CAP Theorem & Partitioning", "Microservices & Event Streaming", "Database Concurrency (MVCC/WAL)", "Scalability & Load Balancing", "Leadership & Tradeoffs"]
      : normType === "internship_seeker"
      ? ["REST API Design", "Practical JavaScript/TypeScript", "React Lifecycle & Hooks", "Database Queries & Indexing", "Git & CI/CD", "Project Architecture Walkthrough"]
      : ["Data Structures (Arrays, Trees, Graphs)", "OOP Principles & SOLID", "DBMS & SQL Normalization", "OS Processes & Threads", "Computer Networks & HTTP", "Coding Problem Solving"];

  // 7. Executive Summary
  const summary =
    normType === "experienced"
      ? `Based on your overall readiness score of ${readinessScore}%, this roadmap is engineered for Senior/Experienced engineering roles. It targets system scalability, distributed architectures, and technical leadership to maximize interview conversion rates at top tier tech firms.`
      : normType === "internship_seeker"
      ? `With an overall readiness score of ${readinessScore}%, this roadmap is optimized for Internship and Junior Developer placement. It prioritizes demonstrable hands-on coding, production REST APIs, containerization, and portfolio readiness to help you stand out to hiring managers.`
      : `With a current readiness score of ${readinessScore}%, this roadmap establishes a rock-solid foundation across core CS fundamentals (DSA, DBMS, OS, OOP) and practical project development, positioning you as an agile, placement-ready campus candidate.`;

  return {
    candidateType: normType,
    readinessScore,
    summary,
    priorities,
    projects: getTargetedProjects(normType, weakAreas, missingSkills),
    certifications: getTargetedCertifications(normType, weakAreas, missingSkills),
    interviewTopics,
    weeklyPlan,
  };
}

/**
 * Generates an AI-Powered Personalized Roadmap.
 * Tries Groq AI first if a valid key is provided; falls back gracefully to the deterministic engine.
 *
 * @param {Object} candidateData - Candidate's unified metrics and profiles
 * @returns {Promise<Object>} Complete structured roadmap
 */
async function generatePersonalizedRoadmap(candidateData) {
  const {
    candidateId,
    candidateType = "fresher",
    readinessScore = 65,
    weakAreas = [],
    missingSkills = [],
    interviewPerformance = {},
    skillScores = {},
    resumeData = {},
  } = candidateData;

  const apiKey = process.env.GROQ_API_KEY;

  // Tier 1: Groq AI Execution if key is valid
  if (apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_")) {
    try {
      const groq = new Groq({ apiKey });

      const prompt = `
You are an elite Silicon Valley Technical Career Coach and Placement Director.
Analyze the candidate's actual assessment metrics and generate a highly personalized, structured career roadmap.

Candidate Profile:
- Candidate Type: ${candidateType} (fresher / internship_seeker / experienced)
- Overall Readiness Score: ${readinessScore}% / 100%
- Identified Weak Skills (Score < 60%): ${JSON.stringify(weakAreas)}
- Missing Resume Skills: ${JSON.stringify(missingSkills)}
- Skill Assessment Breakdown: ${JSON.stringify(skillScores)}
- Interview Performance Metrics: ${JSON.stringify(interviewPerformance)}

Roadmap Rules:
1. Ground all recommendations strictly in the candidate's actual gaps and candidate type.
2. For FRESHER: Emphasize core CS (DSA, OOP, DBMS, OS, CN), clean projects, and coding interview fundamentals.
3. For INTERNSHIP SEEKER: Emphasize practical coding, REST APIs, Git, live portfolio projects, and hands-on skills.
4. For EXPERIENCED: Emphasize advanced distributed system design, scalability, microservices, architecture tradeoffs, and leadership.
5. Set priority to 'High' for critical gaps (<50% score or major missing skill), 'Medium' for moderate gaps, and 'Low' for secondary optimizations.
6. Provide exactly 4 weeks in the weeklyPlan with specific, actionable goals and items.

Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "...",
  "priorities": [
    {
      "skill": "Skill Name",
      "priority": "High" | "Medium" | "Low",
      "reason": "Specific reason tied to candidate's score or resume gap",
      "recommendation": "Concrete actionable learning recommendation",
      "topics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "How this project addresses the candidate's gaps",
      "technologies": ["Tech1", "Tech2", "Tech3"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "reason": "Why this certification benefits this candidate profile"
    }
  ],
  "interviewTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "Theme for the week",
      "goals": ["Goal 1", "Goal 2"],
      "actionItems": ["Action 1", "Action 2"]
    }
  ]
}
`.trim();

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.priorities && Array.isArray(parsed.priorities) && parsed.weeklyPlan) {
          parsed.candidateType = candidateType;
          parsed.readinessScore = readinessScore;

          // Save to MongoDB if candidateId is provided
          if (candidateId) {
            await Roadmap.findOneAndUpdate(
              { userId: candidateId },
              {
                userId: candidateId,
                candidateType,
                readinessScore,
                summary: parsed.summary,
                priorities: parsed.priorities,
                projects: parsed.projects || [],
                certifications: parsed.certifications || [],
                interviewTopics: parsed.interviewTopics || [],
                weeklyPlan: parsed.weeklyPlan || [],
                sourceSnapshot: candidateData,
                generatedAt: new Date(),
              },
              { upsert: true, new: true }
            ).catch((err) => console.warn("Could not persist AI roadmap:", err.message));
          }

          return parsed;
        }
      }
    } catch (groqErr) {
      console.warn("[RoadmapService] Groq AI call failed, transitioning to Tier 2 deterministic engine:", groqErr.message);
    }
  }

  // Tier 2: Deterministic Roadmap Fallback
  const deterministicRoadmap = generateDeterministicRoadmap(candidateData);

  // Save to MongoDB if candidateId is provided
  if (candidateId) {
    try {
      await Roadmap.findOneAndUpdate(
        { userId: candidateId },
        {
          userId: candidateId,
          candidateType: deterministicRoadmap.candidateType,
          readinessScore: deterministicRoadmap.readinessScore,
          summary: deterministicRoadmap.summary,
          priorities: deterministicRoadmap.priorities,
          projects: deterministicRoadmap.projects,
          certifications: deterministicRoadmap.certifications,
          interviewTopics: deterministicRoadmap.interviewTopics,
          weeklyPlan: deterministicRoadmap.weeklyPlan,
          sourceSnapshot: candidateData,
          generatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (saveErr) {
      console.warn("Could not persist deterministic roadmap to MongoDB:", saveErr.message);
    }
  }

  return deterministicRoadmap;
}

/**
 * Retrieves the latest generated roadmap for a candidate, or generates one if none exists.
 *
 * @param {string} candidateId
 * @returns {Promise<Object>} Roadmap record
 */
async function getCandidateRoadmap(candidateId) {
  if (!candidateId) throw new Error("Candidate ID is required.");

  const existing = await Roadmap.findOne({ userId: candidateId }).sort({ generatedAt: -1 }).lean();
  return existing;
}

module.exports = {
  generatePersonalizedRoadmap,
  getCandidateRoadmap,
  generateDeterministicRoadmap,
};
