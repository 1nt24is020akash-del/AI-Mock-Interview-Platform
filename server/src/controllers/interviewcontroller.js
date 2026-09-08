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

// Curated Contextual Follow-Up Question Bank (per domain and difficulty)
const FOLLOW_UP_BANK = {
  "JavaScript/Node.js": {
    EASY: [
      "Can you give a quick code snippet or practical example of the JavaScript behavior you just described?",
      "How does the concept you mentioned behave when running in strict mode ('use strict')?",
      "What is a common pitfall or bug that occurs if a developer misunderstands what you just explained?"
    ],
    MEDIUM: [
      "In the architecture you just described, how does that behavior change under asynchronous execution or inside Promise chains?",
      "Can you describe an edge case where this approach could cause performance bottlenecks or unexpected memory retention?",
      "How would you test and verify this specific behavior in a unit or integration test suite?"
    ],
    HARD: [
      "How does the V8 runtime handle memory allocation and optimization for what you described under heavy concurrency?",
      "In a clustered Node.js production service, what race conditions or thread pool saturation issues could emerge from this?",
      "How would you diagnose and profile issues related to this in production using CPU/heap profilers or core dumps?"
    ]
  },
  "React": {
    EASY: [
      "Can you provide a simple component example showing how you would write that in JSX?",
      "Why is state immutability crucial when applying the concept you described in React?",
      "What happens to child components when the state or props you mentioned change?"
    ],
    MEDIUM: [
      "How would you prevent unnecessary re-renders when using this pattern across a complex component tree?",
      "What trade-offs exist between using this approach versus managing state with a custom hook or external store?",
      "How does React's reconciliation engine process updates related to what you explained?"
    ],
    HARD: [
      "How does React Fiber's lane-based priority scheduling handle concurrent updates in this scenario?",
      "In a React Server Components (RSC) architecture, would this code run on the server, client, or during hydration?",
      "How would you benchmark and minimize the frame drop or layout shifts caused by frequent updates here?"
    ]
  },
  "Python": {
    EASY: [
      "Could you show how that looks in Python syntax with a concise code example?",
      "What built-in functions or standard library idioms in Python are best suited for working with this?",
      "How does Python handle exceptions or type errors when this operation encounters invalid input?"
    ],
    MEDIUM: [
      "How does Python's memory management or garbage collector handle the objects created in your approach?",
      "What are the time and space complexities of the implementation you described?",
      "How does the Global Interpreter Lock (GIL) impact this if running multiple CPU-bound operations in parallel?"
    ],
    HARD: [
      "How would you implement this using Python's `asyncio` event loop without blocking the main event loop thread?",
      "What happens at the CPython bytecode / opcode evaluation loop level during this operation?",
      "How would you optimize this for zero-copy memory access or sub-millisecond execution using Cython or native C extensions?"
    ]
  },
  "Data Science": {
    EASY: [
      "Can you give an intuitive real-world example of when you would apply this technique in an analytics project?",
      "How would you explain the outcome and intuition of this method to a non-technical business stakeholder?",
      "What basic data cleaning or preprocessing step is critical before applying this?"
    ],
    MEDIUM: [
      "How would you diagnose whether your model is suffering from high bias versus high variance in this scenario?",
      "If the dataset suffered from severe 95:5 class imbalance, how would you adjust your evaluation metrics and modeling strategy?",
      "Why might accuracy be a misleading metric here compared to F1-score or PR-AUC?"
    ],
    HARD: [
      "Mathematically, how does the loss surface behave here, and how do you prevent vanishing or exploding gradients?",
      "How would you monitor and detect distribution shift / concept drift for this in real-time production?",
      "How would you scale this inference pipeline to handle sub-10ms latencies over millions of high-dimensional vectors?"
    ]
  },
  "DevOps": {
    EASY: [
      "Can you explain the basic command line workflow or configuration file used to achieve what you described?",
      "What is the key advantage of this approach over traditional virtualized or bare-metal server setups?",
      "What happens if a process running inside this environment crashes unexpectedly?"
    ],
    MEDIUM: [
      "If you need to automate this in a CI/CD pipeline, what specific testing gates and security scans would you enforce?",
      "How would you manage environment-specific configurations and secrets securely in this setup?",
      "How does networking and port mapping function between the container user-space and the host OS in your scenario?"
    ],
    HARD: [
      "If this container experiences severe memory pressure and triggers the Linux kernel OOM killer, how do you diagnose and prevent it?",
      "How would you architect multi-region failover and distributed state replication for this service with sub-minute RTO/RPO?",
      "How do you enforce zero-trust security, mutual TLS (mTLS), and cryptographic image signing at the cluster admission level?"
    ]
  },
  "System Design": {
    EASY: [
      "What is the simplest architecture diagram or data flow you would start with for this requirement?",
      "What is the single point of failure (SPOF) in that initial setup, and how do you remove it?",
      "Why would you introduce a cache or load balancer in front of the application servers here?"
    ],
    MEDIUM: [
      "How would your architecture gracefully handle a sudden 10x traffic surge during a peak viral event?",
      "What caching invalidation strategy (e.g. Cache-Aside, Write-Through) would you choose, and why?",
      "How do you guarantee database consistency between read replicas and the primary database node?"
    ],
    HARD: [
      "How would you resolve distributed data conflicts across continents using CRDTs or Paxos/Raft consensus?",
      "How does your design address the CAP theorem tradeoffs during an cross-region network partition?",
      "How would you prevent cascading service failures and stampeding herds during downstream database degradation?"
    ]
  },
  "Database Design": {
    EASY: [
      "Can you give an example of an SQL query or schema definition that illustrates this?",
      "What is the key performance difference between finding records via an index versus a full table scan?",
      "Why is referential integrity and foreign key constraints important in relational schemas?"
    ],
    MEDIUM: [
      "How would transaction isolation levels (e.g., Read Committed vs Serializable) affect concurrent writes in this scenario?",
      "What indexing strategy (e.g., B-Tree, Composite, Hash) would you apply, and what is the write overhead?",
      "When would you partition or shard this table, and what partition key would you select to avoid hot spotting?"
    ],
    HARD: [
      "How do the Write-Ahead Log (WAL) and MVCC handle concurrency conflicts under sustained high write loads?",
      "How would you execute a zero-downtime schema migration on this table with hundreds of millions of rows?",
      "How does the database manage distributed transactions across shards without introducing two-phase commit latency?"
    ]
  },
  "General": {
    EASY: [
      "Can you walk me through a specific, concrete example of how you applied that in a project?",
      "What was the most important lesson or takeaway from that experience?",
      "How did you explain your technical approach to peers or team members?"
    ],
    MEDIUM: [
      "What architectural alternatives or trade-offs did you evaluate before settling on that solution?",
      "If you had to build it over again with more time or scale, what would you improve?",
      "How did you test and measure the success of that technical decision?"
    ],
    HARD: [
      "What was the most critical architectural risk in that approach, and what automated safeguards did you put in place?",
      "How did you balance short-term delivery deadlines against long-term architectural debt?",
      "How did you align conflicting viewpoints among senior engineering stakeholders when making that choice?"
    ]
  }
};

FOLLOW_UP_BANK["JavaScript"] = FOLLOW_UP_BANK["JavaScript/Node.js"];

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

// Helper to get contextual fallback follow-up question
function getFallbackFollowUp(domain, difficulty = "MEDIUM", index = 0, answer = "", currentQuestion = "") {
  const domainBank = FOLLOW_UP_BANK[domain] || FOLLOW_UP_BANK["General"];
  const tier = (difficulty || "MEDIUM").toUpperCase();
  const list = domainBank[tier] || domainBank["MEDIUM"] || FOLLOW_UP_BANK["General"]["MEDIUM"];
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

  // 1. Single character letter spam (4+ identical letters consecutively, e.g., "UUUU", "AAAAAAA", "hhhh")
  // Note: Only targets letters so programming syntax like "===", spread operator "...", markdown, and numbers like "1000" are not blocked.
  if (/([a-zA-Z])\1{3,}/i.test(trimmed)) {
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
  // Excludes standard technical terms/acronyms and only triggers on short non-answers or when majority of words are vowel-less
  const TECHNICAL_WHITELIST = new Set([
    "https", "chgrp", "pbkdf", "pstmt", "sysfs", "nginx", "mysql", "redis", "dmesg", "syslog", "cgroups", "kubectl", "crontab", "rsync"
  ]);
  const words = trimmed.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, "")).filter(Boolean);
  const suspiciousClusterWords = words.filter(
    (w) => w.length >= 5 && !/[aeiouy]/.test(w) && !TECHNICAL_WHITELIST.has(w)
  );
  if (
    suspiciousClusterWords.length > 0 &&
    (words.length <= 3 || suspiciousClusterWords.length > words.length * 0.3)
  ) {
    return {
      isValid: false,
      reason: "consonant_cluster",
      feedback: "Your response does not address the question. Please provide a relevant technical explanation.",
    };
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

const DOMAIN_KEYWORDS = {
  "DevOps": new Set([
    "docker", "container", "containers", "vm", "vms", "virtual", "machine", "machines",
    "linux", "kernel", "cgroup", "cgroups", "namespace", "namespaces", "memory", "cpu",
    "oom", "killer", "dmesg", "syslog", "stats", "process", "processes", "isolation",
    "kubernetes", "k8s", "pod", "pods", "prometheus", "grafana", "monitoring", "nginx",
    "deploy", "deployment", "ci", "cd", "pipeline", "cluster", "bridge", "veth", "sigkill",
    "exit", "swap", "backpressure", "limits", "throttling", "ansible", "terraform", "helm"
  ]),
  "React": new Set([
    "react", "component", "components", "state", "props", "hook", "hooks", "useeffect",
    "usestate", "usememo", "usecallback", "render", "rendering", "dom", "vdom", "virtual",
    "jsx", "redux", "context", "lifecycle", "ref", "memo", "reconciliation", "fiber"
  ]),
  "JavaScript/Node.js": new Set([
    "javascript", "js", "node", "nodejs", "event", "loop", "promise", "promises", "async",
    "await", "callback", "closure", "closures", "scope", "prototype", "prototypal", "v8",
    "thread", "memory", "stream", "buffer", "express", "npm", "json", "module", "modules", "require"
  ]),
  "System Design": new Set([
    "system", "architecture", "scale", "scaling", "scalability", "horizontal", "vertical",
    "load", "balancer", "cache", "caching", "redis", "memcached", "cap", "latency",
    "throughput", "distributed", "microservice", "microservices", "consistency", "partition",
    "queue", "kafka", "message", "rabbitmq", "sharding", "replication", "availability"
  ]),
  "Database Design": new Set([
    "sql", "database", "databases", "query", "queries", "table", "tables", "index",
    "indexes", "indexing", "btree", "acid", "transaction", "transactions", "join", "joins",
    "postgresql", "postgres", "mysql", "mongodb", "nosql", "schema", "normalization",
    "foreign", "primary", "key", "sharding", "replica", "replication", "isolation", "deadlock"
  ]),
  "General": new Set([
    "code", "software", "develop", "developer", "development", "engineering", "engineer",
    "debug", "debugging", "test", "testing", "design", "architecture", "system", "project",
    "performance", "error", "solution", "algorithm", "data", "structure", "clean", "refactor"
  ]),
};
DOMAIN_KEYWORDS["JavaScript"] = DOMAIN_KEYWORDS["JavaScript/Node.js"];

const QUESTION_STOPWORDS = new Set([
  "what", "is", "are", "how", "why", "can", "you", "explain", "the", "to", "and", "of", "in",
  "a", "an", "on", "for", "with", "do", "does", "if", "this", "that", "it", "its", "by", "or",
  "between", "difference", "compare", "compared", "when", "where", "which", "should", "would",
  "could", "me", "my", "your", "from", "at", "then", "into", "under", "over", "about", "tell",
  "describe", "give", "example", "please", "using", "used", "like"
]);

// Smart evaluation fallback if Groq is unavailable
function generateSmartFeedback(
  answer,
  domain = "General",
  currentDifficulty = "MEDIUM",
  questionIndex = 0,
  consecutiveFollowUps = 0,
  currentQuestion = ""
) {
  const validation = validateAnswer(answer, currentQuestion);
  if (!validation.isValid) {
    return {
      isValid: false,
      score: 0,
      correctness: "Incorrect / Non-responsive",
      relevance: "Irrelevant or non-answer",
      technicalUnderstanding: "None demonstrated",
      clarity: "Unstructured / non-substantive",
      strengths: [],
      weaknesses: [
        "Response does not address the technical question asked",
        "Provided non-answer, greeting, or irrelevant text"
      ],
      reasoning: "The candidate did not provide a substantive technical response to the question.",
      feedback: validation.feedback,
      action: "NEW_QUESTION",
      actionReason: "Cannot follow up on an invalid or non-answer. Moving to a new question at adjusted difficulty.",
    };
  }

  const trimmed = (answer || "").trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Semantic keyword and topic relevance evaluation
  const ansTokens = trimmed.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
  let qMatches = 0;
  if (currentQuestion) {
    const qTokens = currentQuestion
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !QUESTION_STOPWORDS.has(w));
    const qTokenSet = new Set(qTokens);
    for (const token of ansTokens) {
      if (qTokenSet.has(token)) qMatches++;
    }
  }

  const domainKeywords = DOMAIN_KEYWORDS[domain] || DOMAIN_KEYWORDS["General"];
  let domainMatches = 0;
  for (const token of ansTokens) {
    if (domainKeywords.has(token)) domainMatches++;
  }

  // Detect off-topic or unrelated answers
  const isUnrelated =
    (qMatches === 0 && domainMatches === 0 && wordCount >= 6) ||
    (qMatches === 0 && domainMatches <= 1 && wordCount >= 15);

  if (isUnrelated) {
    return {
      isValid: true,
      score: 15, // WEAK
      correctness: "Unrelated / Off-topic",
      relevance: "Response does not address the question asked",
      technicalUnderstanding: "No relevant technical concepts demonstrated",
      clarity: "Response is off-topic",
      strengths: [],
      weaknesses: [
        "Response does not address the technical question asked",
        "Content is off-topic or unrelated to the domain subject",
      ],
      reasoning: "The response was evaluated as off-topic or irrelevant to the technical question.",
      feedback: "Your response does not appear to address the technical question asked. Please provide a relevant technical explanation.",
      action: "NEW_QUESTION",
      actionReason: "Candidate provided an off-topic answer. Transitioning to a new technical question at adjusted difficulty.",
    };
  }

  let feedback = "";
  let score = 65;
  let strengths = [];
  let weaknesses = [];
  let reasoning = "";
  let correctness = "";
  let relevance = "Directly addresses the question topic";
  let technicalUnderstanding = "";
  let clarity = "";

  if (wordCount < 10) {
    score = 45; // WEAK (< 50)
    correctness = "Partially accurate or overly simplistic";
    technicalUnderstanding = "Basic surface-level mention without architectural depth";
    clarity = "Very brief and incomplete";
    strengths = ["Identified core terminology relevant to the question"];
    weaknesses = [
      "Response is too brief to demonstrate operational or architectural mastery",
      "Lacks concrete implementation details, mechanisms, and examples",
    ];
    reasoning =
      "The candidate touched upon relevant terminology but provided an extremely brief answer without sufficient technical depth or explanation.";
    feedback =
      "Your response touches on a relevant technical point, but is very brief. Elaborate further with architectural details, mechanisms, and practical examples to strengthen your answer.";
  } else if (wordCount < 25) {
    score = 68; // AVERAGE (50 to 79)
    correctness = "Technically accurate on the fundamental concepts";
    technicalUnderstanding = "Solid foundation with working knowledge of standard patterns";
    clarity = "Good, understandable explanation of the core idea";
    strengths = [
      "Accurately explains the primary concept",
      "Demonstrates practical working understanding of the topic",
    ];
    weaknesses = [
      "Could elaborate more on edge cases, trade-offs, and failure modes",
      "Would benefit from deeper architectural or internal mechanics details",
    ];
    reasoning =
      "The candidate demonstrated sound basic understanding of the concept, but missed deeper edge-case analysis and architectural trade-offs.";
    feedback =
      "Good start. You understand the basic concept, but you could strengthen your response by elaborating on edge cases, performance considerations, and practical usage.";
  } else if (wordCount < 55) {
    score = 84; // STRONG (>= 80)
    correctness = "Technically accurate and precise";
    technicalUnderstanding = "Deep understanding of underlying mechanisms and component interaction";
    clarity = "Well-structured, concise, and professional explanation";
    strengths = [
      "Clear and comprehensive explanation of core mechanics",
      "Structured communication connecting concepts to practical application"
    ];
    weaknesses = [
      "Could briefly touch on subtle performance bottlenecks or distributed failure modes"
    ];
    reasoning = "Strong candidate response demonstrating clear technical competence, structured reasoning, and accurate terminology.";
    feedback = "Solid answer! You explained the core concepts clearly with relevant technical context. Demonstrating structured communication and problem-solving reasoning made your answer stand out.";
  } else {
    score = 94; // STRONG (>= 80)
    correctness = "Exceptionally accurate and detailed";
    technicalUnderstanding = "Advanced mastery of internals, trade-offs, and system interactions";
    clarity = "Exemplary professional articulation and reasoning";
    strengths = [
      "Comprehensive depth covering architectural mechanisms and trade-offs",
      "High clarity with nuanced understanding of production considerations"
    ];
    weaknesses = [];
    reasoning = "Outstanding technical depth, addressing core concepts, operational trade-offs, and practical implications with high precision.";
    feedback = "Excellent, comprehensive explanation. You provided strong technical depth, addressed trade-offs, and articulated the concepts with high clarity and professional precision.";
  }

  // Decision rule:
  // If consecutiveFollowUps >= 1 -> enforce NEW_QUESTION (max 1 consecutive follow-up rule)
  // Otherwise, if candidate gave a partial/average answer or an interesting strong answer -> FOLLOW_UP
  const action = (consecutiveFollowUps >= 1) ? "NEW_QUESTION" : "FOLLOW_UP";
  const actionReason = action === "FOLLOW_UP"
    ? (score >= 80
        ? "Candidate showed strong knowledge; following up to probe deeper architectural reasoning and trade-offs."
        : "Candidate provided a solid foundation; following up to probe for clarification, edge cases, and missing concepts.")
    : (consecutiveFollowUps >= 1
        ? "Maximum consecutive follow-up reached on this topic. Transitioning to a new technical area."
        : "Topic sufficiently explored. Moving to a new question.");

  return {
    isValid: true,
    score,
    correctness,
    relevance,
    technicalUnderstanding,
    clarity,
    strengths,
    weaknesses,
    reasoning,
    feedback,
    action,
    actionReason,
  };
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
      currentQuestion: firstQuestion,
      difficultyHistory: [
        {
          questionIndex: 1,
          difficulty: initialDifficulty,
          score: null,
          performance: null,
          timestamp: new Date(),
        },
      ],
      messages: [{ role: "ai", content: firstQuestion, isQuestion: true, isFollowUp: false }],
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
      currentQuestion: clientCurrentQuestion,
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

    const apiKey = process.env.GROQ_API_KEY;
    const canUseGroq = apiKey && !apiKey.includes("placeholder") && apiKey.startsWith("gsk_");

    // Retrieve the exact question being answered (client-specified or last isQuestion message)
    let currentQuestion = (clientCurrentQuestion || "").trim();
    if (!currentQuestion) {
      if (interview.currentQuestion) {
        currentQuestion = interview.currentQuestion;
      } else if (interview.messages && interview.messages.length > 0) {
        for (let i = interview.messages.length - 1; i >= 0; i--) {
          const m = interview.messages[i];
          if (m.role === "ai" && m.isQuestion && m.content) {
            currentQuestion = m.content;
            break;
          }
        }
      }
    }

    // ── STEP 1: VALIDATE ANSWER BEFORE TECHNICAL EVALUATION ──
    const validation = validateAnswer(answer, currentQuestion);

    // If answer is invalid (spam, keyboard mashing, repeated characters, greetings, or non-answers):
    if (!validation.isValid) {
      const invalidScore = 0;
      const invalidPerformance = "WEAK";
      const invalidFeedback =
        validation.feedback ||
        "Your response does not address the question. Please provide a relevant technical explanation.";
      const nextDifficulty = calculateNextDifficulty(currentDifficulty, invalidPerformance);
      const action = "NEW_QUESTION";
      const actionReason =
        "The candidate provided an invalid or non-answer. Resetting topic to a new question at adjusted difficulty.";
      const strengths = [];
      const weaknesses = [
        "Response does not address the technical question asked",
        "Provided non-answer, greeting, or irrelevant text",
      ];
      const reasoning =
        "Candidate submitted an invalid response or non-answer, resulting in a score of 0 and difficulty demotion.";

      interview.consecutiveFollowUps = 0;

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
            console.warn(
              "Groq error on invalid answer transition, using question bank:",
              groqErr.message
            );
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
        action,
        actionReason,
        strengths,
        weaknesses,
        reasoning,
        isFollowUp: false,
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
        isQuestion: false,
        isFollowUp: false,
        assessment: {
          score: invalidScore,
          strengths,
          weaknesses,
          reasoning,
          action,
        },
      });

      if (!isComplete && nextQ) {
        interview.currentQuestion = nextQ;
        interview.messages.push({
          role: "ai",
          content: nextQ,
          timestamp: new Date(),
          isQuestion: true,
          isFollowUp: false,
        });
      }

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
          action,
          actionReason,
          strengths,
          weaknesses,
          reasoning,
          isFollowUp: false,
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
        action,
        actionReason,
        strengths,
        weaknesses,
        reasoning,
        isFollowUp: false,
        difficultyHistory: interview.difficultyHistory,
      });
    }

    // ── STEP 2: TECHNICAL EVALUATION (FOR VALID ANSWERS) ──
    const consecutiveFollowUps = interview.consecutiveFollowUps || 0;
    const forceNewQuestion = consecutiveFollowUps >= 1;

    let evalAssessment = null;
    if (canUseGroq) {
      try {
        const groq = new Groq({ apiKey });

        const evalPrompt = `You are a senior technical interviewer conducting an adaptive mock interview for a ${domain} developer.
Current Question: "${currentQuestion}"
Current Difficulty Level: ${currentDifficulty}
Previous Consecutive Follow-up Count on this topic: ${consecutiveFollowUps} (Rule: Maximum 1 consecutive follow-up allowed).

Evaluate the candidate's answer thoroughly across 4 key dimensions:
1. Correctness: Are the technical statements factually true and accurate?
2. Relevance: Does the response directly address the question asked?
3. Technical Understanding: Does the candidate understand core principles, mechanisms, and trade-offs?
4. Quality/Clarity of Explanation: Is the explanation well-structured, clear, and professional?

Scoring rubric (0-100):
- 80-100: STRONG (accurate, detailed, handles nuances/trade-offs and mechanisms)
- 50-79: AVERAGE (understands basic concept, mostly accurate, but lacks depth or misses key details)
- 10-49: WEAK (valid attempt but incorrect, shallow, or missing core principles)

Next action decision ("action"):
- Choose "FOLLOW_UP" or "NEW_QUESTION".
- RULE: If consecutiveFollowUps >= 1, "action" MUST be "NEW_QUESTION" (to ensure broad coverage of topics).
- Otherwise:
  * If candidate gave a partial, average, or interesting answer with concepts that should be probed deeper -> "FOLLOW_UP".
  * If candidate gave an exceptionally thorough answer with nothing left to explore in this topic -> "NEW_QUESTION".

Next question ("nextQuestion"):
- If action is "FOLLOW_UP":
  * Ask an intelligent follow-up question directly related to what the candidate said in their answer or previous question. Probe deeper understanding, clarification, reasoning, or missing concepts.
  * The follow-up question MUST match the candidate's adapted difficulty level (EASY: basic syntax/definition/simple example; MEDIUM: application/edge cases/practical constraints; HARD: internals/concurrency/scale).
- If action is "NEW_QUESTION":
  * Ask a new technical question on a different topic in ${domain} at the adapted difficulty level.

Return strictly valid JSON with no markdown fences:
{
  "isValid": true,
  "score": 85,
  "correctness": "Brief assessment of correctness",
  "relevance": "Brief assessment of relevance",
  "technicalUnderstanding": "Brief assessment of technical understanding",
  "clarity": "Brief assessment of clarity",
  "strengths": ["1-2 concise strengths"],
  "weaknesses": ["1-2 concise weaknesses or areas for improvement"],
  "reasoning": "1-2 sentences explaining why this score was awarded",
  "feedback": "2-3 sentences of constructive evaluation feedback",
  "action": "FOLLOW_UP or NEW_QUESTION",
  "actionReason": "Reason for choosing follow-up or new question",
  "nextQuestion": "The follow-up or new question to ask next"
}`;

        const evalResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: evalPrompt },
            {
              role: "user",
              content: `TARGET QUESTION TO EVALUATE AGAINST:\n"${currentQuestion}"\n\nCANDIDATE'S SUBMITTED ANSWER:\n"${answer}"\n\nCarefully evaluate this candidate's answer against the target question above. If the answer accurately addresses this specific target question, award an accurate technical score reflecting their technical knowledge and competence.`,
            },
          ],
          temperature: 0.4,
          max_tokens: 450,
        });

        const evalContent = evalResponse.choices[0]?.message?.content?.trim() || "";
        try {
          const parsed = JSON.parse(evalContent.replace(/```json|```/g, "").trim());
          if (parsed && typeof parsed.score === "number") {
            evalAssessment = parsed;
          }
        } catch (parseErr) {
          console.warn("Groq JSON parse error, falling back to smart evaluation:", parseErr.message);
        }
      } catch (groqErr) {
        console.warn("Groq error during answer evaluation, falling back to smart feedback:", groqErr.message);
      }
    }

    let score = 70;
    let feedback = "";
    let strengths = [];
    let weaknesses = [];
    let reasoning = "";
    let action = "NEW_QUESTION";
    let actionReason = "";
    let nextQuestion = "";

    if (evalAssessment) {
      score = Math.max(0, Math.min(100, Math.round(evalAssessment.score)));
      feedback = evalAssessment.feedback || "Your response has been evaluated.";
      strengths = Array.isArray(evalAssessment.strengths) ? evalAssessment.strengths : [];
      weaknesses = Array.isArray(evalAssessment.weaknesses) ? evalAssessment.weaknesses : [];
      reasoning = evalAssessment.reasoning || "Evaluation based on correctness, technical understanding, and clarity.";
      action = (forceNewQuestion || evalAssessment.action === "NEW_QUESTION") ? "NEW_QUESTION" : "FOLLOW_UP";
      actionReason = evalAssessment.actionReason || (action === "FOLLOW_UP" ? "Probing deeper into candidate's response." : "Moving to a new question.");
      if (evalAssessment.nextQuestion) {
        nextQuestion = evalAssessment.nextQuestion;
      }
    } else {
      // Offline / smart evaluation fallback
      const evaluation = generateSmartFeedback(
        answer,
        domain,
        currentDifficulty,
        questionsAnswered,
        consecutiveFollowUps,
        currentQuestion
      );
      score = evaluation.score;
      feedback = evaluation.feedback;
      strengths = evaluation.strengths;
      weaknesses = evaluation.weaknesses;
      reasoning = evaluation.reasoning;
      action = evaluation.action;
      actionReason = evaluation.actionReason;
    }

    // Classify performance and compute adapted next difficulty
    const performance = classifyPerformance(score);
    const nextDifficulty = calculateNextDifficulty(currentDifficulty, performance);

    // If not complete and nextQuestion is not yet determined:
    if (!isComplete && !nextQuestion) {
      if (action === "FOLLOW_UP") {
        nextQuestion = getFallbackFollowUp(domain, nextDifficulty, questionsAnswered, answer, currentQuestion);
      } else {
        nextQuestion = getFallbackQuestion(domain, nextDifficulty, questionsAnswered + 1);
      }
    }

    // Update consecutive follow-ups counter
    if (action === "FOLLOW_UP") {
      interview.consecutiveFollowUps = (interview.consecutiveFollowUps || 0) + 1;
    } else {
      interview.consecutiveFollowUps = 0;
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
      score,
      performance,
      action,
      actionReason,
      strengths,
      weaknesses,
      reasoning,
      isFollowUp: action === "FOLLOW_UP",
      timestamp: new Date(),
    });

    interview.messages.push({
      role: "user",
      content: answer,
      timestamp: new Date(),
    });
    interview.messages.push({
      role: "ai",
      content: feedback,
      timestamp: new Date(),
      isQuestion: false,
      isFollowUp: false,
      assessment: {
        score,
        strengths,
        weaknesses,
        reasoning,
        action,
      },
    });

    if (!isComplete && nextQuestion) {
      interview.currentQuestion = nextQuestion;
      interview.messages.push({
        role: "ai",
        content: nextQuestion,
        timestamp: new Date(),
        isQuestion: true,
        isFollowUp: action === "FOLLOW_UP",
      });
    }

    if (isComplete) {
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
        action,
        actionReason,
        strengths,
        weaknesses,
        reasoning,
        isFollowUp: action === "FOLLOW_UP",
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
      action,
      actionReason,
      strengths,
      weaknesses,
      reasoning,
      isFollowUp: action === "FOLLOW_UP",
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
  getFallbackFollowUp,
  generateSmartFeedback,
  QUESTION_BANK,
  FOLLOW_UP_BANK,
};
