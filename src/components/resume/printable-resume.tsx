"use client";

import React, { forwardRef } from "react";
import type { ResumeData, ResumeTemplateId } from "@/types/resume";
import { ModernCleanTemplate } from "./templates/modern-template";
import { ClassicCorporateTemplate } from "./templates/classic-template";
import { TechMinimalistTemplate } from "./templates/minimal-template";

interface PrintableResumeProps {
  data: ResumeData;
  templateId: ResumeTemplateId;
}

export const PrintableResume = forwardRef<HTMLDivElement, PrintableResumeProps>(
  ({ data, templateId }, ref) => {
    return (
      <div
        ref={ref}
        id="placement-printable-resume"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 mx-auto shadow-2xl transition-all duration-200 border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-none print:min-h-0 print:bg-white print:text-black"
        style={{
          boxSizing: "border-box",
        }}
      >
        {templateId === "classic" && <ClassicCorporateTemplate data={data} />}
        {templateId === "minimal" && <TechMinimalistTemplate data={data} />}
        {templateId === "modern" && <ModernCleanTemplate data={data} />}
      </div>
    );
  }
);

PrintableResume.displayName = "PrintableResume";
