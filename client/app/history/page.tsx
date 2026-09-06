"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Interview {
  id: string;
  date: string;
  score: number;
  duration: number;
  topic: string;
}

const DOMAIN_ICONS: Record<string, string> = {
  "JavaScript/Node.js": "🟨",
  "React": "⚛️",
  "Python": "🐍",
  "Data Science": "📊",
  "DevOps": "⚙️",
  "System Design": "🏗️",
  "Database Design": "🗄️",
  "General": "🎯",
};

export default function HistoryPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState("All");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchInterviews();
    }
  }, [isLoggedIn]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/api/interviews");
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error("Failed to load interview history", err);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const { data } = await axiosInstance.get(`/api/interviews/${id}`);
      setSelectedSession(data.interview);
    } catch (err) {
      console.error("Failed to load details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRetake = (domain: string) => {
    router.push(`/interview?domain=${encodeURIComponent(domain)}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  const uniqueDomains = ["All", ...Array.from(new Set(interviews.map((i) => i.topic)))];
  const filtered = filterDomain === "All" ? interviews : interviews.filter((i) => i.topic === filterDomain);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <span>📊</span> Session History
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              My Interview Sessions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review your past performance, AI feedback, and practice scores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/practice">
              <Button className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-xs shadow-sm">
                ⚡ New Practice
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        {uniqueDomains.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {uniqueDomains.map((d) => (
              <button
                key={d}
                onClick={() => setFilterDomain(d)}
                className={`text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all ${
                  filterDomain === d
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Session List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 border border-border/50 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              No sessions found
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {filterDomain === "All"
                ? "You haven't completed any interview sessions yet. Start your first session to track your progress!"
                : `No completed sessions under "${filterDomain}".`}
            </p>
            <Link href="/practice">
              <Button className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs px-6">
                Start an Interview →
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {[...filtered].reverse().map((session) => (
              <Card
                key={session.id}
                className="p-5 border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-center text-2xl flex-shrink-0">
                    {DOMAIN_ICONS[session.topic] || "🎯"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-foreground text-sm truncate">
                        {session.topic}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${
                          session.score >= 80
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : session.score >= 60
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                        }`}
                      >
                        {session.score >= 80 ? "🟢" : session.score >= 60 ? "🔵" : "🟠"}{" "}
                        {session.score}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>
                        📅{" "}
                        {new Date(session.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>⏱ {session.duration} min</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="hidden md:flex flex-col items-end gap-1 w-28 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        style={{ width: `${session.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {session.score}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingDetails}
                      onClick={() => viewDetails(session.id)}
                      className="rounded-full text-xs border-border/60"
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRetake(session.topic)}
                      className="rounded-full text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
                    >
                      Retake
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selectedSession && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedSession(null);
            }}
          >
            <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-border/60 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">
                    {DOMAIN_ICONS[selectedSession.domain] || "🎯"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedSession.domain} Session Details
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedSession.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {selectedSession.duration} min duration
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Performance Score
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {selectedSession.score}%
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {selectedSession.score >= 80 ? "Excellent" : selectedSession.score >= 60 ? "Good" : "Needs Practice"}
                  </span>
                </div>

                {selectedSession.feedback && (
                  <div className="p-4 bg-primary/[0.03] border border-primary/20 rounded-xl">
                    <p className="text-xs font-bold text-foreground mb-1">
                      Overall Evaluation
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedSession.feedback}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-foreground mb-3">
                    Session Conversation
                  </p>
                  <div className="space-y-3">
                    {selectedSession.messages?.map((msg: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                          msg.role === "user"
                            ? "bg-primary/5 border-primary/20 ml-6"
                            : "bg-muted/40 border-border/60 mr-6"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5 font-semibold">
                          <span>
                            {msg.role === "user" ? "👤 You" : "🤖 AI Interviewer"}
                          </span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSession(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="rounded-full text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
                  onClick={() => {
                    const dom = selectedSession.domain;
                    setSelectedSession(null);
                    handleRetake(dom);
                  }}
                >
                  Retake Interview →
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
