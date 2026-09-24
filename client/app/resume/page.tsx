"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResumeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tab=resume");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Navigating to Resume Analysis Studio...</p>
      </div>
    </div>
  );
}
