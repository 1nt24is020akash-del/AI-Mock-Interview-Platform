"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Single source of truth — no more getToken() / removeToken()
  const { isLoggedIn, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  // User's first initial for avatar
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const navLinks = isLoggedIn
    ? [
        { href: "/dashboard", label: "Dashboard", icon: "⚡" },
        { href: "/practice", label: "Practice", icon: "🎯" },
        { href: "/history", label: "My Sessions", icon: "📊" },
      ]
    : [
        { href: "/#features", label: "Features", icon: "✨" },
        { href: "/#how-it-works", label: "How It Works", icon: "🔍" },
        { href: "/#domains", label: "Domains", icon: "🧩" },
      ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl rotate-6 opacity-40 group-hover:rotate-12 transition-transform duration-300" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm tracking-tight">
                  AI
                </span>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                MockInterview
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                AI Powered
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs">{link.icon}</span>
                    {link.label}
                  </span>
                  {isActive(link.href) && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              </Link>
            ))}
          </div>

          {/* ── Desktop Auth Controls ── */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* User pill — now shows real name initial + first name */}
                <div className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-full pl-1.5 pr-3 py-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-black">
                      {initial}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    Hi,{" "}
                    <span className="text-foreground font-semibold">
                      {firstName}
                    </span>
                  </span>
                </div>

                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border/60 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-full transition-colors ${
                      isActive("/login")
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md hover:shadow-primary/25 hover:shadow-lg transition-all duration-200 font-semibold"
                  >
                    Get Started →
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden relative w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-muted/50 transition-colors"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 origin-center ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 origin-center ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Panel ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 px-4 py-4 space-y-1">
          {/* Nav links */}
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
                {isActive(link.href) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          ))}

          <div className="h-px bg-border/50 my-3" />

          {/* Mobile auth actions */}
          {isLoggedIn ? (
            <div className="space-y-2">
              {/* User info row — real name + email from context */}
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-black">
                    {initial}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.name ?? "Welcome back"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email ?? "Ready to practice?"}
                  </p>
                </div>
              </div>

              {/* Quick action links */}
              <div className="grid grid-cols-2 gap-2 px-1">
                {[
                  { href: "/dashboard", label: "Dashboard", icon: "⚡" },
                  { href: "/history", label: "History", icon: "📊" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <Button
                onClick={logout}
                variant="outline"
                className="w-full rounded-xl border-border/60 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full rounded-xl">
                  Login
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold">
                  Get Started Free →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
