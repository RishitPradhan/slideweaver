import React from "react";

import UploadPage from "./components/UploadPage";
import Header from "@/app/(presentation-generator)/(dashboard)/dashboard/components/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slideweaver | Open Source AI presentation generator",
  description:
    "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
  alternates: {
    canonical: "https://slideweaver.ai/create",
  },
  keywords: [
    "presentation generator",
    "AI presentations",
    "data visualization",
    "automatic presentation maker",
    "professional slides",
    "data-driven presentations",
    "document to presentation",
    "presentation automation",
    "smart presentation tool",
    "business presentations",
  ],
  openGraph: {
    title: "Create Data Presentation | Slideweaver",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    type: "website",
    url: "https://slideweaver.ai/create",
    siteName: "Slideweaver",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Data Presentation | Slideweaver",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    site: "@slideweaver_ai",
    creator: "@slideweaver_ai",
  },
};

const page = () => {
  return (
    <div className="relative">
      <Header />
      <div className="flex flex-col items-center justify-center  mb-8">
        <h1 className="text-[64px] font-normal font-unbounded text-[#ffffff] ">
          AI Presentation
        </h1>
        <p className="text-xl font-syne text-[#f8fafc]">Choose a design, set preferences, and generate polished slides.</p>
      </div>

      <UploadPage />
    </div>
  );
};

export default page;
