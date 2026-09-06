"use client"
import InterviewContent from "@/components/InterviewContent";
import React, { Suspense } from "react";

const page = () => {
  return (
    <Suspense fallback={<div>is loading..</div>}>
      <InterviewContent />
    </Suspense>
  );
};

export default page;
