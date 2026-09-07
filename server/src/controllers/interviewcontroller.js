const Groq = require("groq-sdk");
const Interview = require("../models/Interview.js");

const QUESTION_BANK = {
  "JavaScript/Node.js": {
    EASY: [
      "What is the difference between `var`, `let`, and `const` in JavaScript, and how does variable hoisting work?",
      "Can you explain what primitive data types exist in JavaScript and how `==` differs from `===`?",
      "What is a callback function in JavaScript, and how does `setTimeout` work with the event queue?"
    ],
    MEDIUM: [
      "Can you explain the JavaScript event loop and how asynchronous callbacks, promises (microtasks), and macrotasks are prioritized during execution?",
      "What is the difference between shallow copy and deep copy in JavaScript, and how do closures capture variables in lexical scope?",
      "How does Node.js handle high concurrency despite having a single-threaded event loop, and in what scenarios would you use Worker Threads or Cluster mode?"
    ],
    HARD: [
      "How does the V8 JavaScript engine handle memory allocation between Young and Old generations, and how would you identify and debug memory leaks in a production Node.js service?",
      "Explain how the Node.js `libuv` thread pool functions under the hood for asynchronous I/O, file system operations, and cryptographic operations, including how to tune thread pool sizing.",
      "How would you implement a custom asynchronous stream backpressure mechanism in Node.js to safely process multi-gigabyte files without exhausting server RAM?"
    ]
  },
  "React": {
    EASY: [
      "What is JSX in React, and what is the difference between props and state?",
      "What are React hooks, and what are the basic rules for using the `useState` hook?",
      "Why is the `key` prop required when rendering lists of elements in React, and what happens if you use the array index as a key?"
    ],
    MEDIUM: [
      "Explain how React's Virtual DOM reconciliation and diffing algorithm work. What specific optimization techniques can prevent unnecessary re-renders?",
      "Can you describe the differences between `useEffect`, `useLayoutEffect`, and `useMemo`? In what situations is `useCallback` essential?",
      "How do you approach state management in large-scale React applications, and how would you compare Context API with state libraries like Zustand or Redux?"
    ],
    HARD: [
      "Explain how React Concurrent Mode and the Fiber architecture prioritize work units using lanes and cooperative scheduling to avoid blocking the main browser thread.",
      "How would you architect a zero-runtime micro-frontend or dynamic component federation setup with React, ensuring isolated state and CSS boundaries without duplicate dependency bundles?",
      "How does React Server Components (RSC) fundamentally differ from traditional Server-Side Rendering (SSR) in terms of bundling, hydration, and client runtime footprint?"
    ]
  },
  "Python": {
    EASY: [
      "What is the difference between lists and tuples in Python, and when would you use one over the other?",
      "How do dictionaries work in Python, and what are the requirements for an object to be used as a dictionary key?",
      "What is the difference between `is` and `==` in Python, and how does Python handle None checks?"
    ],
    MEDIUM: [
      "What are Python generators and decorators? Could you explain how you would write a decorator to measure function execution time?",
      "Explain the Global Interpreter Lock (GIL) in CPython. How does it impact CPU-bound versus I/O-bound concurrency, and how can you work around it?",
      "How does memory management and garbage collection work in Python, particularly handling reference counting and circular dependencies?"
    ],
    HARD: [
      "Explain Python's async event loop architecture (`asyncio`), task scheduling, and how coroutines interact with generators and green threads in high-throughput network services.",
      "How do Python metaclasses and the `__new__` vs `__init__` lifecycle work under the hood? Provide a concrete use case such as building an ORM schema validator.",
      "How does CPython optimize byte-code execution via specialized opcodes and the adaptive interpreter (PEP 659), and how does PEP 703 (free-threaded Python) eliminate the GIL?"
    ]
  },
  "Data Science": {
    EASY: [
      "What is the difference between supervised and unsupervised machine learning, and what are typical examples of each?",
      "What is the difference between mean, median, and mode, and which metric is most resilient to outliers in skewed distributions?",
      "What is data normalization vs standardization, and why is feature scaling necessary for distance-based algorithms like KNN and SVM?"
    ],
    MEDIUM: [
      "Explain the bias-variance tradeoff in supervised machine learning. What specific techniques and validation strategies do you use to detect and prevent overfitting?",
      "How do you handle severe class imbalance in datasets, and why might accuracy be a misleading metric in such cases compared to F1-score or PR-AUC?",
      "Describe the mathematical intuition behind gradient descent and how optimizers like Adam improve upon basic stochastic gradient descent."
    ],
    HARD: [
      "Explain the self-attention mechanism in Transformers mathematically, including why query, key, and value vectors are scaled by the square root of the dimension $d_k$.",
      "How do you diagnose and mitigate covariate shift and concept drift in production ML models, and how would you build an automated shadow deployment pipeline for continuous retraining?",
      "Explain how high-dimensional sparse embeddings are generated and indexed at scale using approximate nearest neighbor algorithms like HNSW or ScaNN for real-time recommendation engines."
    ]
  },
  "DevOps": {
    EASY: [
      "What is Git version control, and what is the difference between `git merge` and `git rebase`?",
      "What is Docker, and what is the difference between a Docker image and a Docker container?",
      "What is continuous integration and continuous deployment (CI/CD), and why is it important in software development?"
    ],
    MEDIUM: [
      "Can you explain the architecture of Docker containers compared to virtual machines? How do Linux cgroups and namespaces enable container isolation?",
      "Walk me through how you design an end-to-end CI/CD deployment pipeline with automated testing, canary deployments, and zero-downtime rollbacks.",
      "How do Kubernetes Pods, Services, and Ingress controllers interact to route incoming user traffic to containerized applications?"
    ],
    HARD: [
      "How would you design a multi-region Kubernetes disaster recovery architecture with active-active traffic routing, distributed storage replication, and sub-minute RTO/RPO?",
      "Explain how service meshes like Istio implement mTLS, distributed tracing, and circuit breaking at the Envoy sidecar level without application code modifications.",
      "How do you secure a GitOps pipeline against supply chain attacks, ensuring cryptographic image signing with Sigstore/Cosign, SLSA compliance, and runtime admission control?"
    ]
  },
  "System Design": {
    EASY: [
      "What is the difference between vertical scaling and horizontal scaling, and what are their respective limitations?",
      "What is a load balancer and what are common load balancing algorithms like Round Robin and Least Connections?",
      "What is caching in web applications, and why is Redis or Memcached placed in front of a relational database?"
    ],
    MEDIUM: [
      "How would you design a scalable URL shortener service like Bitly to handle millions of writes and billions of reads daily? Discuss database schema and caching.",
      "Explain the CAP theorem and the fundamental tradeoffs between strong consistency and eventual consistency in distributed systems.",
      "How do you design an effective caching strategy (e.g., Cache-Aside, Write-Through) and how do you handle cache invalidation and cache stampede problems?"
    ],
    HARD: [
      "Architect a globally distributed, real-time collaborative document editing system like Google Docs handling concurrent edits with conflict-free replicated data types (CRDTs) or Operational Transformation (OT).",
      "How would you design a high-frequency financial ledger system requiring strict ACID compliance, idempotency, event sourcing, and high-availability across partitions without two-phase commit bottlenecks?",
      "Design a fault-tolerant distributed rate-limiting service that handles 10 million requests per second globally with sliding window algorithms, minimal redis synchronization latency, and graceful degradation during network partitions."
    ]
  },
  "Database Design": {
    EASY: [
      "What is the difference between a primary key and a foreign key in a relational database?",
      "What is database normalization, and what is the purpose of First, Second, and Third Normal Forms (1NF, 2NF, 3NF)?",
      "What is an SQL JOIN and how does an INNER JOIN differ from a LEFT JOIN?"
    ],
    MEDIUM: [
      "What are the ACID properties in relational databases, and how do transaction isolation levels prevent phenomena like dirty reads and phantom reads?",
      "When would you choose a NoSQL document database like MongoDB over a relational database like PostgreSQL, and what are the main tradeoffs?",
      "Explain database indexing: how do B-Tree indexes accelerate queries, and what performance costs are associated with maintaining excessive indexes?"
    ],
    HARD: [
      "Explain the internals of Write-Ahead Logging (WAL), checkpointing, and MVCC (Multi-Version Concurrency Control) in PostgreSQL or InnoDB, and how they achieve durability without blocking reads during heavy writes.",
      "How do distributed databases like CockroachDB or Google Spanner achieve external consistency and serializability across continents using Paxos/Raft consensus and atomic TrueTime clocks?",
      "How do you execute a zero-downtime database schema migration on a table with 500 million rows, including index creation and column type changes under high write load?"
    ]
  },
  "General": {
    EASY: [
      "Can you describe your background and what motivated you to pursue software engineering?",
      "What is your approach to debugging when your code produces unexpected output or fails a test?",
      "How do you handle constructive feedback during code reviews or project retrospectives?"
    ],
    MEDIUM: [
      "Tell me about a complex technical challenge or production bug you encountered in a recent project. How did you diagnose and resolve it?",
      "How do you approach writing clean, maintainable, and testable code, and what principles do you follow during code reviews?",
      "Can you explain what happens under the hood from the moment a user types a URL in their browser and presses Enter until the web page renders?"
    ],
    HARD: [
      "Describe a scenario where you had to make a critical architectural tradeoff between technical debt, system performance, and time-to-market. What was your decision framework and what were the long-term consequences?",
      "How do you systematically lead the post-mortem analysis of a major production outage, identifying root causes across human factors, system failure modes, and automated safeguard gaps?",
      "How do you evaluate and safely adopt new bleeding-edge technologies or frameworks in an enterprise environment without destabilizing existing mission-critical systems?"
    ]
  }
};

// Aliases
QUESTION_BANK["JavaScript"] = QUESTION_BANK["JavaScript/Node.js"];

// Helper: Classify performance based on numerical score
function classifyPerformance(score) {
  if (score >= 80) return "STRONG";
  if (score >= 50) return "AVERAGE";
  return "WEAK";
}

// Helper: Calculate next difficulty level with strict bounds [EASY, MEDIUM, HARD]
function calculateNextDifficulty(currentDifficulty, performance) {
  const levels = ["EASY", "MEDIUM", "HARD"];
  const normalized = (currentDifficulty || "MEDIUM").toUpperCase();
  let currentIndex = levels.indexOf(normalized);
  if (currentIndex === -1) currentIndex = 1; // Default to MEDIUM

  if (performance === "STRONG") {
    currentIndex = Math.min(levels.length - 1, currentIndex + 1);
  } else if (performance === "WEAK") {
    currentIndex = Math.max(0, currentIndex - 1);
  }
  // AVERAGE preserves currentIndex

  return levels[currentIndex];
}

// Helper to get fallback question based on domain, difficulty tier, and index
function getFallbackQuestion(domain, difficulty = "MEDIUM", index = 0) {
  const domainBank = QUESTION_BANK[domain] || QUESTION_BANK["General"];
  const tier = (difficulty || "MEDIUM").toUpperCase();
  const list = domainBank[tier] || domainBank["MEDIUM"] || QUESTION_BANK["General"]["MEDIUM"];
  return list[Math.abs(index) % list.length];
}

// System prompt generator explicitly targeting requested difficulty
const systemPrompt = (domain, difficulty = "MEDIUM") =>
  `
You are a senior technical interviewer conducting a mock interview for a ${domain} developer role.
The current interview difficulty level is: ${difficulty}.

Difficulty guidelines:
- EASY: Focus on core definitions, basic syntax, fundamental principles, and straightforward concept questions.
- MEDIUM: Focus on practical application of concepts, real-world development scenarios, component interaction, and standard problem solving.
- HARD: Focus on advanced architecture, deep engine/system internals, concurrency, performance optimization, edge cases, and design trade-offs.

Ask one clear, specific technical question strictly matching the ${difficulty} difficulty level.
Return ONLY the question, nothing else.
`.trim();

// Validate answer to filter out spam, keyboard mashing, repeated characters, greetings, and non-answers
function validateAnswer(answer, currentQuestion = "") {
  const trimmed = (answer || "").trim();
  if (!trimmed) {
    return {
      isValid: false,
      reason: "empty",
      feedback: "Your response does not provide a meaningful answer to the question. Please provide a relevant technical explanation.",
    };
  }

  const cleanLetters = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleanLetters.length === 0) {
    return {
      isValid: false,
      reason: "symbols_only",
      feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
    };
  }

  // 1. Single character spam (3+ identical characters consecutively, e.g., "UUUUU", "AAAAAAA")
  if (/(.)\1{2,}/i.test(trimmed)) {
    return {
      isValid: false,
      reason: "repeated_characters",
      feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
    };
  }

  // 2. Periodic short pattern repetition (e.g., "HIHIHIHI", "hahahaha", "abcabcabc")
  if (cleanLetters.length >= 4) {
    for (let len = 1; len <= 4; len++) {
      const unit = cleanLetters.slice(0, len);
      const repeated = unit.repeat(Math.ceil(cleanLetters.length / len)).slice(0, cleanLetters.length);
      if (repeated === cleanLetters && cleanLetters.length >= len * 2) {
        return {
          isValid: false,
          reason: "repeated_pattern",
          feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
        };
      }
    }
  }

  // 3. Low character diversity / entropy (e.g. length >= 5 with <= 2 unique letters like "HIHIHI", "hi hi hi")
  const uniqueLetters = new Set(cleanLetters.split(""));
  if (cleanLetters.length >= 5 && uniqueLetters.size <= 2) {
    return {
      isValid: false,
      reason: "low_diversity",
      feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
    };
  }

  // 4. Keyboard row mashing (e.g., "asdfghjkl", "qwertyuiop", "zxcvbnm")
  const KEYBOARD_SEQUENCES = [
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "poiuytrewq",
    "lkjhgfdsa",
    "mnbvcxz",
    "1234567890",
  ];
  for (const seq of KEYBOARD_SEQUENCES) {
    for (let start = 0; start <= seq.length - 4; start++) {
      const sub = seq.substring(start, start + 4);
      if (cleanLetters.includes(sub) && cleanLetters.length <= 15) {
        return {
          isValid: false,
          reason: "keyboard_mash",
          feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
        };
      }
    }
  }

  // 5. Consonant clusters without vowels in words of 5+ characters (e.g., "dfghjkl", "qwrtyp")
  const words = trimmed.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, "")).filter(Boolean);
  for (const w of words) {
    if (w.length >= 5 && !/[aeiouy]/.test(w)) {
      return {
        isValid: false,
        reason: "consonant_cluster",
        feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
      };
    }
  }

  // 6. Repeated identical words (e.g., "test test test", "hello hello hello")
  if (words.length >= 2) {
    const uniqueWords = new Set(words);
    if (uniqueWords.size === 1) {
      return {
        isValid: false,
        reason: "repeated_words",
        feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
      };
    }
  }

  // 7. Non-answers and conversational greetings only
  const GREETINGS_AND_NON_ANSWERS = new Set([
    "hi", "hello", "hey", "hola", "sup", "yo", "good morning", "good afternoon",
    "good evening", "how are you", "test", "testing", "ok", "okay", "yes", "no",
    "idk", "i dont know", "i don't know", "no idea", "dunno", "not sure",
    "pass", "skip", "next", "bye", "who are you", "what", "why", "help"
  ]);
  const normalizedPhrase = words.join(" ");
  if (GREETINGS_AND_NON_ANSWERS.has(normalizedPhrase)) {
    return {
      isValid: false,
      reason: "greeting_or_non_answer",
      feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
    };
  }

  return { isValid: true };
}

// Smart evaluation fallback if Groq is unavailable
function generateSmartFeedback(answer, domain, questionIndex) {
  const validation = validateAnswer(answer);
  if (!validation.isValid) {
    return {
      isValid: false,
      feedback: validation.feedback,
      score: 0,
    };
  }

  const trimmed = (answer || "").trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let feedback = "";
  let score = 65;

  if (wordCount < 7) {
    // Valid but very concise response (e.g. "Containers share the host kernel.")
    feedback = `Your response touches on a relevant technical point, but is very brief. Elaborate further with architectural details, mechanisms, and practical examples to strengthen your answer.`;
    score = 45; // WEAK (< 50)
  } else if (wordCount < 25) {
    feedback = `Good start. You understand the basic concept, but you could strengthen your response by elaborating on edge cases, performance considerations, and practical usage.`;
    score = 68; // AVERAGE (50 to 79)
  } else if (wordCount < 55) {
    feedback = `Solid answer! You explained the core concepts clearly with relevant technical context. Demonstrating structured communication and problem-solving reasoning made your answer stand out.`;
    score = 84; // STRONG (>= 80)
  } else {
    feedback = `Excellent, comprehensive explanation. You provided strong technical depth, addressed trade-offs, and articulated the concepts with high clarity and professional precision.`;
    score = 94; // STRONG (>= 80)
  }

  return { isValid: true, feedback, score };
}

// ── Start Interview ───────────────────────────────────────
const startInterview = async (req, res) => {
  try {
    const { domain = "General" } = req.body;
    if (!domain) return res.status(400).json({ message: "Domain is required" });

    const initialDifficulty = "MEDIUM";
    let firstQuestion = "";

    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_")) {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt(domain, initialDifficulty) },
            {
              role: "user",
              content: `Start the interview. Ask me the first ${domain} technical question at ${initialDifficulty} difficulty. Only ask the question, no preamble.`,
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
      firstQuestion = getFallbackQuestion(domain, initialDifficulty, 0);
    }

    const interview = await Interview.create({
      userId: req.userId,
      domain,
      currentDifficulty: initialDifficulty,
      difficultyHistory: [
        {
          questionIndex: 1,
          difficulty: initialDifficulty,
          score: null,
          performance: null,
          timestamp: new Date(),
        },
      ],
      messages: [{ role: "ai", content: firstQuestion }],
    });

    res.status(201).json({
      sessionId: interview._id,
      question: firstQuestion,
      difficulty: initialDifficulty,
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

    const currentDifficulty = interview.currentDifficulty || "MEDIUM";
    const isComplete = questionsAnswered >= 2; // Complete after 3 questions (0, 1, 2)
    let feedback = "";
    let score = 70;
    let nextQuestion = "";

    const apiKey = process.env.GROQ_API_KEY;
    const canUseGroq = apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_");

    // Retrieve the current question being answered from conversation history
    let currentQuestion = "";
    if (interview.messages && interview.messages.length > 0) {
      for (let i = interview.messages.length - 1; i >= 0; i--) {
        if (interview.messages[i].role === "ai" && interview.messages[i].content) {
          currentQuestion = interview.messages[i].content;
          break;
        }
      }
    }

    // ── STEP 1: VALIDATE ANSWER BEFORE TECHNICAL EVALUATION ──
    const validation = validateAnswer(answer, currentQuestion);

    // If answer is invalid (spam, keyboard mashing, repeated characters, greetings, or non-answers):
    if (!validation.isValid) {
      const invalidScore = 0;
      const invalidPerformance = "WEAK";
      const invalidFeedback = validation.feedback || "Your response does not address the question. Please provide a relevant technical explanation.";
      const nextDifficulty = calculateNextDifficulty(currentDifficulty, invalidPerformance);

      let nextQ = "";
      if (!isComplete) {
        if (canUseGroq) {
          try {
            const groq = new Groq({ apiKey });
            const nextQResponse = await groq.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: systemPrompt(domain, nextDifficulty),
                },
                {
                  role: "user",
                  content: `The candidate gave an invalid or non-answer to the previous question.
The interview difficulty has adapted down to: ${nextDifficulty}.
Ask the NEXT technical question strictly at ${nextDifficulty} difficulty for a ${domain} developer.
Return ONLY the question, nothing else.`,
                },
              ],
              temperature: 0.7,
              max_tokens: 150,
            });
            nextQ = nextQResponse.choices[0]?.message?.content?.trim() || "";
          } catch (groqErr) {
            console.warn("Groq error on invalid answer transition, using question bank:", groqErr.message);
          }
        }

        if (!nextQ) {
          nextQ = getFallbackQuestion(domain, nextDifficulty, questionsAnswered + 1);
        }
      }

      // Update Interview state in MongoDB
      interview.currentDifficulty = nextDifficulty;
      interview.questionsAnswered = questionsAnswered + 1;

      if (!interview.difficultyHistory) {
        interview.difficultyHistory = [];
      }
      interview.difficultyHistory.push({
        questionIndex: questionsAnswered + 1,
        difficulty: currentDifficulty,
        score: invalidScore,
        performance: invalidPerformance,
        timestamp: new Date(),
      });

      interview.messages.push({
        role: "user",
        content: answer,
        timestamp: new Date(),
      });
      interview.messages.push({
        role: "ai",
        content: invalidFeedback,
        timestamp: new Date(),
      });

      if (isComplete) {
        const validScores = interview.difficultyHistory
          .map((h) => h.score)
          .filter((s) => typeof s === "number");
        const avgScore =
          validScores.length > 0
            ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
            : 0;

        interview.score = avgScore;
        interview.isComplete = true;
        interview.feedback = invalidFeedback;
        const durationMin = Math.max(
          1,
          Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000)
        );
        interview.duration = durationMin;

        await interview.save();
        return res.json({
          feedback: invalidFeedback,
          score: avgScore,
          isComplete: true,
          currentDifficulty: nextDifficulty,
          previousDifficulty: currentDifficulty,
          performance: invalidPerformance,
          difficultyHistory: interview.difficultyHistory,
        });
      }

      await interview.save();
      return res.json({
        feedback: invalidFeedback,
        nextQuestion: nextQ,
        isComplete: false,
        currentDifficulty: nextDifficulty,
        previousDifficulty: currentDifficulty,
        performance: invalidPerformance,
        score: invalidScore,
        difficultyHistory: interview.difficultyHistory,
      });
    }

    // ── STEP 2: TECHNICAL EVALUATION (FOR VALID ANSWERS) ──
    if (canUseGroq) {
      try {
        const groq = new Groq({ apiKey });

        const evalResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert ${domain} interview evaluator.
Evaluate candidate answers objectively for the question asked at ${currentDifficulty} difficulty level.

Interview Question: "${currentQuestion}"

Evaluation rules:
1. First verify if the candidate made a genuine attempt to answer the question.
2. If the response does NOT attempt to answer the question, or consists of greetings, random text, keyboard mashing, or unrelated content, classify as INVALID: {"isValid": false, "score": 0, "feedback": "Your response does not address the question. Please provide a relevant technical explanation."}.
3. If the answer is valid:
   - 80-100: STRONG (accurate, detailed technical explanation, addresses nuances and edge cases)
   - 50-79: AVERAGE (understands basic concept, mostly accurate, but lacks depth or misses key details)
   - 10-49: WEAK (valid attempt but incorrect, extremely shallow, or missing core principles)

Return strictly valid JSON with no markdown formatting:
{"isValid": true, "feedback": "2-3 sentences of constructive feedback", "score": 85}`,
            },
            {
              role: "user",
              content: `Candidate's answer: "${answer}"`,
            },
          ],
          temperature: 0.5,
          max_tokens: 250,
        });

        const evalContent = evalResponse.choices[0]?.message?.content?.trim() || "";
        try {
          const parsed = JSON.parse(evalContent.replace(/```json|```/g, "").trim());
          if (parsed.isValid === false || parsed.score === 0) {
            feedback = parsed.feedback || "Your response does not address the question. Please provide a relevant technical explanation.";
            score = 0;
          } else {
            if (parsed.feedback) feedback = parsed.feedback;
            if (typeof parsed.score === "number") {
              score = Math.max(0, Math.min(100, Math.round(parsed.score)));
            }
          }
        } catch (parseErr) {
          const scoreMatch = evalContent.match(/"score"\s*:\s*(\d+)/i) || evalContent.match(/\b(\d{1,3})\b/);
          if (scoreMatch) {
            score = Math.max(0, Math.min(100, parseInt(scoreMatch[1])));
          }
          feedback = evalContent.replace(/"score".*$/, "").replace(/[{}\"]/g, "").trim();
        }
      } catch (groqErr) {
        console.warn("Groq error during answer evaluation, falling back to smart feedback:", groqErr.message);
      }
    }

    // Fallback feedback & score if Groq was unavailable or failed
    if (!feedback) {
      const evaluation = generateSmartFeedback(answer, domain, questionsAnswered);
      feedback = evaluation.feedback;
      score = evaluation.score;
    }

    // Classify performance and compute new difficulty
    const performance = classifyPerformance(score);
    const nextDifficulty = calculateNextDifficulty(currentDifficulty, performance);

    // If not complete, generate NEXT question using the NEW difficulty
    if (!isComplete) {
      if (canUseGroq) {
        try {
          const groq = new Groq({ apiKey });
          const nextQResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: systemPrompt(domain, nextDifficulty),
              },
              {
                role: "user",
                content: `The candidate just answered a question and performed at a ${performance} level.
The interview difficulty has adapted to: ${nextDifficulty}.
Ask the NEXT technical question strictly at ${nextDifficulty} difficulty for a ${domain} developer.
Previous context: Candidate answered: "${answer.substring(0, 100)}..."
Return ONLY the question, nothing else.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 150,
          });

          nextQuestion = nextQResponse.choices[0]?.message?.content?.trim() || "";
        } catch (groqErr) {
          console.warn("Groq error generating next question, using question bank:", groqErr.message);
        }
      }

      if (!nextQuestion) {
        nextQuestion = getFallbackQuestion(domain, nextDifficulty, questionsAnswered + 1);
      }
    }

    // Update Interview state in MongoDB
    interview.currentDifficulty = nextDifficulty;
    interview.questionsAnswered = questionsAnswered + 1;

    // Record question history
    if (!interview.difficultyHistory) {
      interview.difficultyHistory = [];
    }
    interview.difficultyHistory.push({
      questionIndex: questionsAnswered + 1,
      difficulty: currentDifficulty,
      score,
      performance,
      timestamp: new Date(),
    });

    // Save chat messages
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

    if (isComplete) {
      // Calculate overall average score
      const validScores = interview.difficultyHistory
        .map((h) => h.score)
        .filter((s) => typeof s === "number");
      const avgScore =
        validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : score;

      interview.score = avgScore;
      interview.isComplete = true;
      interview.feedback = feedback;
      const durationMin = Math.max(
        1,
        Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000)
      );
      interview.duration = durationMin;

      await interview.save();
      return res.json({
        feedback,
        score: avgScore,
        isComplete: true,
        currentDifficulty: nextDifficulty,
        previousDifficulty: currentDifficulty,
        performance,
        difficultyHistory: interview.difficultyHistory,
      });
    }

    await interview.save();
    return res.json({
      feedback,
      nextQuestion,
      isComplete: false,
      currentDifficulty: nextDifficulty,
      previousDifficulty: currentDifficulty,
      performance,
      score,
      difficultyHistory: interview.difficultyHistory,
    });
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
      .select("domain score duration questionsAnswered currentDifficulty difficultyHistory createdAt")
      .sort({ createdAt: -1 });

    const mapped = interviews.map((i) => ({
      id: i._id,
      topic: i.domain,
      score: i.score,
      duration: i.duration,
      currentDifficulty: i.currentDifficulty || "MEDIUM",
      difficultyHistory: i.difficultyHistory || [],
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

module.exports = {
  startInterview,
  submitAnswer,
  getInterviews,
  getInterview,
  validateAnswer,
  calculateNextDifficulty,
  classifyPerformance,
  getFallbackQuestion,
  generateSmartFeedback,
  QUESTION_BANK,
};
