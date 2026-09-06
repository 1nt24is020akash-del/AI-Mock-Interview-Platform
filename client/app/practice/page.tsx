"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DOMAINS = [
  {
    label: "JavaScript/Node.js",
    icon: "🟨",
    level: "Intermediate / Advanced",
    desc: "Event loop, asynchronous promises, microtasks, closures, and Node.js backend runtime concurrency.",
    topics: ["Event Loop", "Closures", "Async/Await", "Worker Threads", "V8 Engine"],
  },
  {
    label: "React",
    icon: "⚛️",
    level: "Frontend Core",
    desc: "Virtual DOM reconciliation, state optimization, hooks lifecycle, Context API, and rendering performance.",
    topics: ["Virtual DOM", "useMemo & useCallback", "Hooks Lifecycle", "State Management"],
  },
  {
    label: "Python",
    icon: "🐍",
    level: "Full Stack / Backend",
    desc: "CPython GIL, memory management, generators, decorators, and asynchronous programming.",
    topics: ["GIL Tradeoffs", "Decorators", "Generators", "Garbage Collection"],
  },
  {
    label: "Data Science",
    icon: "📊",
    level: "ML & Statistics",
    desc: "Machine learning algorithms, bias-variance tradeoff, gradient descent, metrics, and dataset preprocessing.",
    topics: ["Bias-Variance", "Imbalanced Data", "Gradient Descent", "Validation Strategy"],
  },
  {
    label: "DevOps",
    icon: "⚙️",
    level: "Cloud & Infrastructure",
    desc: "Docker container internals, Kubernetes orchestration, CI/CD pipelines, and zero-downtime rollouts.",
    topics: ["Docker Internals", "Kubernetes Ingress", "CI/CD Pipelines", "Canary Deployments"],
  },
  {
    label: "System Design",
    icon: "🏗️",
    level: "Architectural",
    desc: "Large-scale distributed systems, CAP theorem, caching strategies, load balancing, and database sharding.",
    topics: ["Distributed Systems", "CAP Theorem", "Caching Strategies", "High Availability"],
  },
  {
    label: "Database Design",
    icon: "🗄️",
    level: "Data Engineering",
    desc: "ACID properties, transaction isolation levels, indexing internals, and SQL vs NoSQL architectural decisions.",
    topics: ["ACID Properties", "B-Tree Indexes", "SQL vs NoSQL", "Transaction Isolation"],
  },
  {
    label: "General",
    icon: "🎯",
    level: "All Engineering",
    desc: "Behavioral challenges, complex problem solving, debugging methodologies, and web protocol fundamentals.",
    topics: ["Complex Problem Solving", "Production Debugging", "Web Protocols", "Clean Code"],
  },
];

export default function PracticePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  const startSession = (domain: string) => {
    router.push(`/interview?domain=${encodeURIComponent(domain)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <span>🎯</span> Interactive Practice Arena
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              Select an Interview Domain
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your domain below to practice with adaptive AI questions and get instant feedback.
            </p>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full text-xs">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Domain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOMAINS.map((domain) => (
            <Card
              key={domain.label}
              className="p-6 border border-border/60 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      {domain.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {domain.label}
                      </h3>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {domain.level}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">
                    3 Questions
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {domain.desc}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {domain.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] bg-muted/50 border border-border/40 text-muted-foreground px-2 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => startSession(domain.label)}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-xs py-2.5 shadow-sm"
              >
                Start {domain.label} Interview →
              </Button>
            </Card>
          ))}
        </div>

        {/* Resume Banner */}
        <Card className="p-6 border border-primary/20 bg-primary/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
              📄
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Not sure which domain fits you best?
              </h4>
              <p className="text-xs text-muted-foreground">
                Upload your resume in the dashboard to get AI recommendations tailored to your profile.
              </p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs border-primary/30 text-primary hover:bg-primary/5 flex-shrink-0"
            >
              Analyze Resume →
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
