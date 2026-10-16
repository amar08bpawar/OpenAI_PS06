"use client";

import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Printer,
  Save,
  Download,
  RotateCcw,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ResumeData, ResumeTemplateId, ResumeRecord } from "@/types/resume";
import { ResumeEditor } from "@/components/resume/resume-editor";
import { PrintableResume } from "@/components/resume/printable-resume";
import {
  saveResumeDraftAction,
  importAcademicProfileResumeAction,
} from "@/app/actions/resume";

interface ResumeClientViewProps {
  initialResume?: ResumeRecord | null;
  profileResumeData: ResumeData;
}

export function ResumeClientView({
  initialResume,
  profileResumeData,
}: ResumeClientViewProps) {
  // Resume state
  const [resumeId, setResumeId] = useState<string | undefined>(initialResume?.id);
  const [title, setTitle] = useState<string>(initialResume?.title || "My Placement Resume");
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(
    initialResume?.template_id || "modern"
  );
  const [resumeData, setResumeData] = useState<ResumeData>(
    initialResume?.data || profileResumeData
  );

  // UI state
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showPdfTip, setShowPdfTip] = useState(true);

  // Ref for react-to-print
  const resumePrintRef = useRef<HTMLDivElement>(null);

  // Configure react-to-print
  const handlePrint = useReactToPrint({
    contentRef: resumePrintRef,
    documentTitle: `${(resumeData.contact.fullName || "Resume").replace(/\s+/g, "_")}_Placement_Hub`,
    pageStyle: `
      @page {
        size: A4;
        margin: 12mm 14mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background: #ffffff !important;
          color: #000000 !important;
        }
        #placement-printable-resume {
          box-shadow: none !important;
          border: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `,
  });

  // Track edits
  const handleDataChange = (newData: ResumeData) => {
    setResumeData(newData);
    setSaveStatus("unsaved");
  };

  // Save to Supabase
  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveStatus("saving");
    setSaveMessage(null);

    try {
      const res = await saveResumeDraftAction({
        id: resumeId,
        title,
        template_id: templateId,
        data: resumeData,
      });

      if (res.success && res.data) {
        setResumeId(res.data.id);
        setSaveStatus("saved");
        setSaveMessage("Draft saved securely in your account.");
        setTimeout(() => setSaveMessage(null), 3500);
      } else {
        setSaveStatus("unsaved");
        setSaveMessage(res.error || "Failed to save draft.");
      }
    } catch (err: any) {
      setSaveStatus("unsaved");
      setSaveMessage(err?.message || "Failed to connect to database.");
    } finally {
      setSaving(false);
    }
  };

  // Import from academic profile
  const handleImportProfile = async () => {
    if (
      saveStatus === "unsaved" &&
      !window.confirm("Importing will overwrite current form fields with your Academic Profile data. Continue?")
    ) {
      return;
    }

    setImporting(true);
    try {
      const res = await importAcademicProfileResumeAction();
      if (res.success && res.data) {
        setResumeData(res.data);
        setSaveStatus("unsaved");
        setSaveMessage("Imported latest academic profile details.");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err: any) {
      setSaveMessage("Error importing profile data.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / PDF instructions */}
      {showPdfTip && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-950 dark:text-blue-100">
                How to Download as PDF:
              </p>
              <p className="mt-0.5 leading-relaxed text-blue-800 dark:text-blue-300">
                Click <strong>&quot;Print / Save PDF&quot;</strong> below. In the browser print dialog that opens, change the <strong>Destination</strong> to <strong>&quot;Save as PDF&quot;</strong>. The resume template will download as a crisp, ATS-friendly document with standard margins.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPdfTip(false)}
            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header and Controls Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Resume Title and Status */}
          <div className="space-y-1.5 flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus("unsaved");
                }}
                placeholder="Resume Title..."
                className="font-bold text-lg sm:text-xl text-foreground bg-transparent border-b border-dashed border-border hover:border-primary focus:border-primary focus:outline-none w-full pb-0.5"
              />
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
              {saveStatus === "unsaved" && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  ● Unsaved changes
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving draft...
                </span>
              )}
              {saveMessage && (
                <span className="text-muted-foreground ml-2">| {saveMessage}</span>
              )}
            </div>
          </div>

          {/* Action Buttons & Template Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Template Selector */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => {
                  setTemplateId("modern");
                  setSaveStatus("unsaved");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  templateId === "modern"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Modern Clean
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateId("classic");
                  setSaveStatus("unsaved");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  templateId === "classic"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Classic Corporate
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateId("minimal");
                  setSaveStatus("unsaved");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  templateId === "minimal"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tech Minimal
              </button>
            </div>

            {/* Profile Import Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportProfile}
              disabled={importing}
              className="gap-1.5 text-xs"
              title="Sync fields from your Academic Profile"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${importing ? "animate-spin" : ""}`} />
              Import Profile
            </Button>

            {/* Save Draft Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={saving}
              className="gap-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              Save Draft
            </Button>

            {/* Print / Save PDF Button */}
            <Button
              size="sm"
              onClick={() => handlePrint()}
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Mobile View Switcher (Visible on < lg) */}
        <div className="mt-4 pt-3 border-t border-border flex lg:hidden items-center justify-center gap-2">
          <Button
            variant={mobileTab === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setMobileTab("edit")}
            className="flex-1 gap-1.5 text-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Resume Details
          </Button>
          <Button
            variant={mobileTab === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setMobileTab("preview")}
            className="flex-1 gap-1.5 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            Live Preview & Print
          </Button>
        </div>
      </div>

      {/* Main Workspace: Split View on Desktop, Tabbed on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form Column */}
        <div
          className={`lg:col-span-6 space-y-4 ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Resume Content Editor
            </h3>
            <span className="text-xs text-muted-foreground">
              Changes reflect live on the preview
            </span>
          </div>

          <ResumeEditor data={resumeData} onChange={handleDataChange} />
        </div>

        {/* Live Printable Preview Column */}
        <div
          className={`lg:col-span-6 ${
            mobileTab === "edit" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-600" />
                Live Preview (A4 Printable Layout)
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] uppercase tracking-wider">
                  Template: {templateId}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint()}
                  className="h-7 text-xs gap-1"
                >
                  <Printer className="h-3 w-3" />
                  Print / PDF
                </Button>
              </div>
            </div>

            {/* Paper Preview Card */}
            <div className="bg-slate-100 dark:bg-slate-900/60 p-3 sm:p-6 rounded-2xl border border-border overflow-x-auto shadow-inner">
              <div className="min-w-[650px] sm:min-w-0">
                <PrintableResume
                  ref={resumePrintRef}
                  data={resumeData}
                  templateId={templateId}
                />
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              📄 Preview represents standard A4 dimensions (210mm × 297mm). Page breaks adapt dynamically upon printing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
