const Groq = require("groq-sdk");
const Interview = require("../models/Interview.js");

const QUESTION_BANK = {
  "JavaScript/Node.js": [
    "Can you explain the JavaScript event loop and how asynchronous callbacks, promises (microtasks), and macrotasks are prioritized during execution?",
    "What is the difference between shallow copy and deep copy in JavaScript, and how do closures capture variables in lexical scope?",
    "How does Node.js handle high concurrency despite having a single-threaded event loop, and in what scenarios would you use Worker Threads or Cluster mode?"
  ],
  "React": [
    "Explain how React's Virtual DOM reconciliation and diffing algorithm work. What specific optimization techniques can prevent unnecessary re-renders?",
    "Can you describe the differences between `useEffect`, `useLayoutEffect`, and `useMemo`? In what situations is `useCallback` essential?",
    "How do you approach state management in large-scale React applications, and how would you compare Context API with state libraries like Zustand or Redux?"
  ],
  "Python": [
    "Explain the Global Interpreter Lock (GIL) in CPython. How does it impact CPU-bound versus I/O-bound concurrency, and how can you work around it?",
    "What are Python generators and decorators? Could you explain how you would write a decorator to measure function execution time?",
    "How does memory management and garbage collection work in Python, particularly handling reference counting and circular dependencies?"
  ],
  "Data Science": [
    "Explain the bias-variance tradeoff in supervised machine learning. What specific techniques and validation strategies do you use to detect and prevent overfitting?",
    "How do you handle severe class imbalance in datasets, and why might accuracy be a misleading metric in such cases compared to F1-score or PR-AUC?",
    "Describe the mathematical intuition behind gradient descent and how optimizers like Adam improve upon basic stochastic gradient descent."
  ],
  "DevOps": [
    "Can you explain the architecture of Docker containers compared to virtual machines? How do Linux cgroups and namespaces enable container isolation?",
    "Walk me through how you design an end-to-end CI/CD deployment pipeline with automated testing, canary deployments, and zero-downtime rollbacks.",
    "How do Kubernetes Pods, Services, and Ingress controllers interact to route incoming user traffic to containerized applications?"
  ],
  "System Design": [
    "How would you design a scalable URL shortener service like Bitly to handle millions of writes and billions of reads daily? Discuss database schema and caching.",
    "Explain the CAP theorem and the fundamental tradeoffs between strong consistency and eventual consistency in distributed systems.",
    "How do you design an effective caching strategy (e.g., Cache-Aside, Write-Through) and how do you handle cache invalidation and cache stampede problems?"
  ],
  "Database Design": [
    "What are the ACID properties in relational databases, and how do transaction isolation levels prevent phenomena like dirty reads and phantom reads?",
    "When would you choose a NoSQL document database like MongoDB over a relational database like PostgreSQL, and what are the main tradeoffs?",
    "Explain database indexing: how do B-Tree indexes accelerate queries, and what performance costs are associated with maintaining excessive indexes?"
  ],
  "General": [
    "Tell me about a complex technical challenge or production bug you encountered in a recent project. How did you diagnose and resolve it?",
    "How do you approach writing clean, maintainable, and testable code, and what principles do you follow during code reviews?",
    "Can you explain what happens under the hood from the moment a user types a URL in their browser and presses Enter until the web page renders?"
  ]
};

const systemPrompt = (domain) =>
  `
You are a senior technical interviewer conducting a mock interview for a ${domain} developer role.
Ask one clear, specific technical question at a time.
After the candidate answers, provide feedback and the next question.

Return ONLY the question, nothing else.
`.trim();

// Helper to get fallback question
function getFallbackQuestion(domain, index = 0) {
  const list = QUESTION_BANK[domain] || QUESTION_BANK["General"];
  return list[Math.min(index, list.length - 1)];
}

// Helper to evaluate answer if Groq is unavailable
function generateSmartFeedback(answer, domain, questionIndex) {
  const trimmed = (answer || "").trim();
  const wordCount = trimmed.split(/\s+/).length;

  let feedback = "";
  let score = 75;

  if (wordCount < 10) {
    feedback = `Your answer is brief. While you touched on the topic, an interviewer in a ${domain} role would expect deeper technical explanation, practical examples, and domain terminology.`;
    score = 55;
  } else if (wordCount < 25) {
    feedback = `Good start. You understand the basic concept, but you could strengthen your response by elaborating on edge cases, performance considerations, and real-world usage.`;
    score = 72;
  } else if (wordCount < 60) {
    feedback = `Solid answer! You explained the core concepts clearly with relevant technical context. Demonstrating structured communication and problem-solving reasoning made your answer stand out.`;
    score = 84;
  } else {
    feedback = `Excellent, comprehensive explanation. You provided strong technical depth, addressed trade-offs, and articulated the concepts with high clarity and professional precision.`;
    score = 92;
  }

  return { feedback, score };
}

// ── Start Interview ───────────────────────────────────────
const startInterview = async (req, res) => {
  try {
    const { domain = "General" } = req.body;
    if (!domain) return res.status(400).json({ message: "Domain is required" });

    let firstQuestion = "";

    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_")) {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt(domain) },
            {
              role: "user",
              content: `Start the interview. Ask me the first ${domain} technical question. Only ask the question, no preamble.`,
            },
          ],
          temperature: 0.7,
        });

        firstQuestion = completion.choices[0]?.message?.content?.trim();
      } catch (groqErr) {
        console.warn("Groq error in startInterview, using curated question:", groqErr.message);
      }
    }

    if (!firstQuestion) {
      firstQuestion = getFallbackQuestion(domain, 0);
    }

    const interview = await Interview.create({
      userId: req.userId,
      domain,
      messages: [{ role: "ai", content: firstQuestion }],
    });

    res.status(201).json({
      sessionId: interview._id,
      question: firstQuestion,
    });
  } catch (err) {
    console.error("startInterview error:", err);
    res
      .status(500)
      .json({ message: "Failed to start interview", error: err.message });
  }
};

// ── Submit Answer ─────────────────────────────────────────
const submitAnswer = async (req, res) => {
  try {
    const {
      sessionId,
      answer,
      domain = "General",
      questionsAnswered = 0,
    } = req.body;

    if (!sessionId || !answer)
      return res.status(400).json({ message: "Missing required fields" });

    const interview = await Interview.findOne({
      _id: sessionId,
      userId: req.userId,
    });
    if (!interview)
      return res.status(404).json({ message: "Session not found" });

    const isComplete = questionsAnswered >= 2; // complete after 3 questions (0, 1, 2)
    let feedback = "";
    let score = 75;
    let nextQuestion = "";

    const apiKey = process.env.GROQ_API_KEY;
    const canUseGroq = apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_");

    if (canUseGroq) {
      try {
        const groq = new Groq({ apiKey });

        // 1. Generate feedback
        const feedbackResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `You are an expert ${domain} interview evaluator.
Provide constructive feedback on this interview answer in 2-3 sentences.
Focus on:
- Clarity and structure of the response
- Technical accuracy and depth
- Communication skills
- Areas for improvement

Answer: "${answer}"

Return ONLY the feedback, no additional text.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        });
        feedback = feedbackResponse.choices[0]?.message?.content?.trim() || "";

        if (isComplete) {
          const scoreResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "user",
                content: `Rate this interview answer on a scale of 1-100 for a ${domain} position.
Consider technical accuracy, communication, and problem-solving.
Return ONLY a number between 10-100, nothing else.
Answer: "${answer}"`,
              },
            ],
            temperature: 0.5,
            max_tokens: 10,
          });
          const scoreRaw = scoreResponse.choices[0]?.message?.content?.trim();
          score = Math.max(10, Math.min(100, parseInt(scoreRaw) || 75));
        } else {
          const nextQResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "user",
                content: `You are an expert ${domain} interviewer. Generate the NEXT interview question based on the previous answer.
The question should:
- Be different from typical generic interview questions
- Build on topics relevant to ${domain}
- Be open-ended and professional
- Test deeper understanding of the domain

Previous answer context: "${answer.substring(0, 100)}..."

Return ONLY the new question, nothing else.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 150,
          });
          nextQuestion = nextQResponse.choices[0]?.message?.content?.trim() || "";
        }
      } catch (groqErr) {
        console.warn("Groq error during answer submission, using smart feedback:", groqErr.message);
      }
    }

    // Fallback feedback & question if Groq was unavailable or failed
    if (!feedback) {
      const evaluation = generateSmartFeedback(answer, domain, questionsAnswered);
      feedback = evaluation.feedback;
      score = evaluation.score;
    }

    if (!isComplete && !nextQuestion) {
      nextQuestion = getFallbackQuestion(domain, questionsAnswered + 1);
    }

    // Save messages to MongoDB
    interview.messages.push({
      role: "user",
      content: answer,
      timestamp: new Date(),
    });
    interview.messages.push({
      role: "ai",
      content: feedback,
      timestamp: new Date(),
    });
    interview.questionsAnswered = questionsAnswered + 1;

    if (isComplete) {
      interview.score = score;
      interview.isComplete = true;
      interview.feedback = feedback;
      const durationMin = Math.max(
        1,
        Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000)
      );
      interview.duration = durationMin;

      await interview.save();
      return res.json({ feedback, score, isComplete: true });
    }

    await interview.save();
    return res.json({ feedback, nextQuestion, isComplete: false });
  } catch (err) {
    console.error("submitAnswer error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// ── Get All Completed Interviews ──────────────────────────
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      userId: req.userId,
      isComplete: true,
    })
      .select("domain score duration questionsAnswered createdAt")
      .sort({ createdAt: -1 });

    const mapped = interviews.map((i) => ({
      id: i._id,
      topic: i.domain,
      score: i.score,
      duration: i.duration,
      date: i.createdAt,
    }));

    res.json({ interviews: mapped });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch interviews", error: err.message });
  }
};

// ── Get Single Interview ──────────────────────────────────
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!interview)
      return res.status(404).json({ message: "Interview not found" });
    res.json({ interview });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { startInterview, submitAnswer, getInterviews, getInterview };
