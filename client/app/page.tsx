"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getToken } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (getToken()) {
      router.push("/dashboard");
    }
  }, [router]);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: "🎯",
      title: "Domain-Specific Questions",
      description:
        "Practice with questions tailored to your industry: JavaScript, React, Python, Data Science, DevOps, and more.",
    },
    {
      icon: "🤖",
      title: "AI-Powered Evaluation",
      description:
        "Get intelligent feedback from Groq AI on technical accuracy, communication skills, and problem-solving approach.",
    },
    {
      icon: "⚡",
      title: "Instant Feedback",
      description:
        "Receive real-time constructive feedback after each answer to help you improve immediately.",
    },
    {
      icon: "📊",
      title: "Performance Scoring",
      description:
        "Get scored on each interview and track your improvement across different domains.",
    },
    {
      icon: "🔄",
      title: "Multiple Attempts",
      description:
        "Practice unlimited interviews across all domains to build confidence and expertise.",
    },
    {
      icon: "💡",
      title: "Smart Follow-ups",
      description:
        "AI generates contextual follow-up questions based on your previous answers to dive deeper.",
    },
  ];

  const domains = [
    "JavaScript/Node.js",
    "React",
    "Python",
    "Data Science",
    "DevOps",
    "System Design",
    "Database Design",
    "General",
  ];

  const aiCapabilities = [
    {
      icon: "🧠",
      title: "Natural Language Understanding",
      description:
        "Our AI comprehends nuanced answers, not just keywords. It understands intent, context, and depth — just like a senior interviewer would.",
      highlight: "Powered by Groq LLM",
    },
    {
      icon: "🔍",
      title: "Deep Answer Analysis",
      description:
        "Every response is analyzed across multiple dimensions: technical correctness, clarity, structure, and completeness.",
      highlight: "Multi-dimensional scoring",
    },
    {
      icon: "🎙️",
      title: "Dynamic Question Generation",
      description:
        "Questions adapt to your seniority level and are never repeated. The AI creates fresh, relevant scenarios each session.",
      highlight: "Infinitely fresh content",
    },
    {
      icon: "🔗",
      title: "Contextual Follow-ups",
      description:
        "Just like a real interviewer, the AI follows up on your answers — probing deeper on strong points and clarifying weak ones.",
      highlight: "Real interview simulation",
    },
  ];

  const mockInterviewBenefits = [
    {
      emoji: "😰",
      problem: "Interview anxiety freezes your mind",
      solution:
        "Repeated mock sessions build neural pathways for calm, structured thinking under pressure.",
      stat: "73% reduction in anxiety after 5 sessions",
    },
    {
      emoji: "🗣️",
      problem: "You know the answer but can't articulate it",
      solution:
        "Practice translates knowledge into clear, confident verbal delivery with structured communication.",
      stat: "2x improvement in answer clarity",
    },
    {
      emoji: "⏱️",
      problem: "You run out of time or ramble",
      solution:
        "Timed responses train you to be concise, complete, and on-point within expected timeframes.",
      stat: "60% better time management",
    },
    {
      emoji: "🪞",
      problem: "You don't know your own blind spots",
      solution:
        "AI identifies patterns in your weak areas across sessions so you know exactly what to study.",
      stat: "Precise gap identification",
    },
  ];

  const testimonials = [
    {
      name: "Rohan Sharma",
      role: "Frontend Developer @ Flipkart",
      avatar: "RS",
      text: "After 10 mock sessions, I walked into my Flipkart interview feeling genuinely prepared. The AI's feedback on my React answers was shockingly accurate.",
      rating: 5,
    },
    {
      name: "Priya Nair",
      role: "Data Scientist @ Razorpay",
      avatar: "PN",
      text: "I used to ramble in interviews. The AI flagged this after my second session and I actively worked on it. Got the offer after targeting exactly those weak spots.",
      rating: 5,
    },
    {
      name: "Arjun Mehta",
      role: "DevOps Engineer @ Infosys",
      avatar: "AM",
      text: "The system design questions were spot-on for what I faced in actual interviews. The follow-up questions especially felt like a real technical round.",
      rating: 5,
    },
  ];

  const comparisonPoints = [
    { label: "Available 24/7", ai: true, traditional: false },
    { label: "Instant feedback", ai: true, traditional: false },
    { label: "Unlimited practice", ai: true, traditional: false },
    { label: "Unbiased evaluation", ai: true, traditional: false },
    { label: "Tracks progress over time", ai: true, traditional: false },
    { label: "Domain-specific questions", ai: true, traditional: true },
    { label: "Adapts to your answers", ai: true, traditional: true },
    { label: "Human nuance", ai: false, traditional: true },
  ];

  const faqs = [
    {
      q: "How does the AI evaluate my answers?",
      a: "Our AI uses Groq's large language model to analyze your answers across multiple dimensions: technical accuracy, completeness, communication clarity, and problem-solving approach. It compares your response to expert-level expected answers and generates detailed feedback.",
    },
    {
      q: "Is this better than practicing with a friend?",
      a: "It's complementary. AI provides unbiased, instant, consistent feedback at any time — something a friend can't always give. It also remembers your history and can spot patterns across sessions. Use both for best results.",
    },
    {
      q: "How many questions are in each mock interview?",
      a: "Each session has 5–8 questions per domain, including AI-generated follow-up questions based on your previous answers. No two sessions are exactly alike.",
    },
    {
      q: "Can I target a specific company's interview style?",
      a: "Our domain-specific question banks are designed around real interview patterns from top tech companies. System Design questions, for example, follow patterns from FAANG-style interviews.",
    },
    {
      q: "How is my progress tracked?",
      a: "Your dashboard tracks scores per session, improvement trends, and weak areas identified by the AI. You can compare performance across sessions and domains.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-block">
              <div className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
                ✨ AI-Powered Interview Platform
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Master Your{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Interview Skills
              </span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Practice with AI-powered mock interviews tailored to your domain.
            Get instant intelligent feedback and watch your confidence grow with
            every session.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full px-8"
            >
              Start Free Practice
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="rounded-full px-8"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "8+ Domains",
              value: "JavaScript, React, Python, and more",
            },
            { label: "AI Powered", value: "Groq LLM for intelligent feedback" },
            { label: "24/7 Available", value: "Practice anytime, anywhere" },
            { label: "Instant Scoring", value: "Get results in seconds" },
          ].map((stat, i) => (
            <Card
              key={i}
              className="p-4 md:p-6 text-center border border-border/50 hover:border-primary/50 transition-colors"
            >
              <p className="font-semibold text-primary text-sm md:text-base">
                {stat.label}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {stat.value}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* How Mock Interviews Help You — Problem/Solution */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <div className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
            Why Mock Interviews Work
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Real Problems. Real Solutions.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most candidates fail not because they lack knowledge — but because
            they've never practiced translating that knowledge under pressure.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {mockInterviewBenefits.map((item, index) => (
            <Card
              key={index}
              className="p-8 border border-border hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{item.emoji}</div>
                <div>
                  <p className="text-sm font-medium text-destructive/80 mb-1">
                    The Problem
                  </p>
                  <p className="font-semibold text-foreground text-lg mb-3">
                    {item.problem}
                  </p>
                  <p className="text-sm font-medium text-primary mb-1">
                    How We Fix It
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                    {item.solution}
                  </p>
                  <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    📈 {item.stat}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* AI Capabilities Deep Dive */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-primary/[0.03] rounded-3xl">
        <div className="text-center mb-16">
          <div className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
            Under the Hood
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How Our AI Actually Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not a quiz engine. Not keyword-matching. A genuine AI interviewer
            that thinks, listens, and responds like a senior engineer would.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {aiCapabilities.map((cap, index) => (
            <div key={index} className="flex gap-5 items-start">
              <div className="text-4xl flex-shrink-0 mt-1">{cap.icon}</div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {cap.title}
                  </h3>
                  <span className="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full">
                    {cap.highlight}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {cap.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Flow Diagram */}
        <div className="mt-16 p-8 border border-primary/20 rounded-2xl bg-background">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            AI Interview Flow
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 text-sm">
            {[
              { label: "Your Answer", icon: "🗣️" },
              { label: "NLP Analysis", icon: "🔍" },
              { label: "Knowledge Scoring", icon: "📐" },
              { label: "Gap Detection", icon: "🚨" },
              { label: "Follow-up Gen", icon: "❓" },
              { label: "Feedback Report", icon: "📋" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl mb-1">
                    {step.icon}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium text-center w-16">
                    {step.label}
                  </p>
                </div>
                {i < 5 && (
                  <div className="text-primary text-lg font-light pb-5">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI vs Traditional Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Mock Interviews vs Traditional Prep
          </h2>
          <p className="text-lg text-muted-foreground">
            See why thousands are switching to AI-first practice
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div />
            <div className="bg-primary/10 rounded-xl p-3">
              <p className="text-primary font-bold text-sm">
                🤖 AI Mock Interview
              </p>
            </div>
            <div className="border border-border rounded-xl p-3">
              <p className="text-muted-foreground font-semibold text-sm">
                👥 Traditional Prep
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {comparisonPoints.map((point, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-4 items-center py-3 border-b border-border/50"
              >
                <p className="text-sm text-foreground font-medium">
                  {point.label}
                </p>
                <div className="flex justify-center">
                  <span
                    className={`text-xl ${point.ai ? "text-green-500" : "text-red-400"}`}
                  >
                    {point.ai ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex justify-center">
                  <span
                    className={`text-xl ${point.traditional ? "text-green-500" : "text-red-400"}`}
                  >
                    {point.traditional ? "✓" : "✗"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive features designed to make you interview-ready
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Sample Feedback Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
            See It In Action
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            What AI Feedback Looks Like
          </h2>
          <p className="text-lg text-muted-foreground">
            Detailed, actionable, and instantly generated
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Sample Question */}
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Interview Question
              </p>
            </div>
            <p className="font-semibold text-foreground text-lg mb-4">
              "Explain the difference between `useEffect` and `useLayoutEffect`
              in React. When would you use each?"
            </p>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Your Answer
              </p>
              <p className="text-sm text-foreground/80 italic">
                "useEffect runs after the render is painted to the screen, while
                useLayoutEffect runs synchronously after all DOM mutations but
                before the browser paints..."
              </p>
            </div>
          </Card>

          {/* Sample AI Feedback */}
          <Card className="p-6 border border-primary/30 bg-primary/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                AI Feedback
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Overall Score
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-to-r from-primary to-accent rounded-full" />
                  </div>
                  <span className="text-sm font-bold text-primary">8/10</span>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-semibold text-green-600">
                  ✅ Strengths
                </p>
                <p className="text-xs text-muted-foreground">
                  Correctly identified the timing difference. Mentioned DOM
                  mutations — shows deeper understanding.
                </p>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-semibold text-amber-600">
                  ⚠️ Improve
                </p>
                <p className="text-xs text-muted-foreground">
                  Missed the performance implication: useLayoutEffect can cause
                  visual lag if overused. Didn't mention accessibility-related
                  animation use cases.
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-blue-600">
                  🔁 Follow-up Question
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  "Can overusing useLayoutEffect affect perceived performance?
                  How would you debug it?"
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Domains Section */}
      <section id="domains" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Practice Across Multiple Domains
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from a variety of interview domains to build expertise
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {domains.map((domain, index) => (
            <Card
              key={index}
              className="p-6 text-center border-2 border-border/50 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
            >
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {domain}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: "1",
              title: "Sign Up",
              desc: "Create your free account in seconds",
            },
            {
              step: "2",
              title: "Choose Domain",
              desc: "Select your interview domain",
            },
            {
              step: "3",
              title: "Practice",
              desc: "Answer AI-generated questions",
            },
            {
              step: "4",
              title: "Improve",
              desc: "Get feedback and track progress",
            },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-center text-sm">
                  {item.desc}
                </p>
              </div>
              {i < 3 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
            Success Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Real Results from Real Candidates
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <Card
              key={index}
              className={`p-8 border transition-all duration-300 ${activeTab === index ? "border-primary shadow-lg scale-[1.02]" : "border-border"}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                "{t.text}"
              </p>
            </Card>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`w-2 h-2 rounded-full transition-all ${activeTab === i ? "bg-primary w-6" : "bg-border"}`}
            />
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our AI interview platform
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="border border-border overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <p className="font-semibold text-foreground pr-4">{faq.q}</p>
                <span
                  className={`text-primary text-xl flex-shrink-0 transition-transform duration-200 ${activeFaq === index ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
              {activeFaq === index && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12 md:p-16 text-center border border-primary/20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Excel in Your Next Interview?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start practicing now with our AI-powered interview platform. Free to
            use, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full px-8"
            >
              Start Practicing Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="rounded-full px-8"
            >
              Already have an account?
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
