import React from "react";
import type { ResumeData } from "@/types/resume";

interface TemplateProps {
  data: ResumeData;
}

export function TechMinimalistTemplate({ data }: TemplateProps) {
  const { contact, summary, education, skills, projects, experience, certifications, achievements } = data;

  const contactItems = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedinUrl ? contact.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "") : null,
    contact.githubUrl ? contact.githubUrl.replace(/^https?:\/\/(www\.)?/, "") : null,
    contact.portfolioUrl ? contact.portfolioUrl.replace(/^https?:\/\/(www\.)?/, "") : null,
  ].filter(Boolean);

  return (
    <div className="w-full text-zinc-900 bg-white p-8 sm:p-10 font-sans leading-relaxed text-[12.5px] print:p-0 print:text-[11.5px]">
      {/* Header */}
      <header className="mb-5 pb-3 border-b-2 border-zinc-900 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-mono">
            {contact.fullName || "Your Full Name"}
          </h1>
          <p className="text-xs text-zinc-600 font-mono mt-0.5">{"// Software Engineering & Placement Candidate"}</p>
        </div>
        {contactItems.length > 0 && (
          <div className="flex flex-col sm:items-end text-xs text-zinc-700 font-mono space-y-0.5">
            {contactItems.slice(0, 4).map((item, idx) => (
              <span key={idx} className="truncate max-w-[280px]">
                {item}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary?.trim() && (
        <section className="mb-4 break-inside-avoid">
          <div className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
            {"// PROFILE SUMMARY"}
          </div>
          <p className="text-zinc-800 leading-normal pl-2 border-l-2 border-zinc-300">{summary}</p>
        </section>
      )}

      {/* Skills */}
      {(skills.technical.length > 0 || skills.toolsAndFrameworks.length > 0 || skills.soft.length > 0) && (
        <section className="mb-4 break-inside-avoid">
          <div className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            {"// TECHNICAL TOOLBOX"}
          </div>
          <div className="pl-2 border-l-2 border-zinc-300 space-y-1 text-xs">
            {skills.technical.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="font-mono text-[11px] font-bold text-zinc-700">languages/frameworks:</span>
                <span className="text-zinc-900">{skills.technical.join(" · ")}</span>
              </div>
            )}
            {skills.toolsAndFrameworks.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="font-mono text-[11px] font-bold text-zinc-700">tools/databases:</span>
                <span className="text-zinc-900">{skills.toolsAndFrameworks.join(" · ")}</span>
              </div>
            )}
            {skills.soft.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="font-mono text-[11px] font-bold text-zinc-700">practices:</span>
                <span className="text-zinc-900">{skills.soft.join(" · ")}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <div className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            {"// WORK & INTERNSHIP EXPERIENCE"}
          </div>
          <div className="pl-2 border-l-2 border-zinc-300 space-y-2.5">
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-zinc-950 font-mono text-xs">
                    {exp.role} <span className="text-zinc-600 font-sans">@ {exp.company}</span>
                  </span>
                  {(exp.startDate || exp.endDate || exp.current) && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {[exp.startDate, exp.current ? "PRESENT" : exp.endDate].filter(Boolean).join(" -> ")}
                    </span>
                  )}
                </div>
                {exp.location && <div className="text-[11px] text-zinc-500 mb-0.5">{exp.location}</div>}
                {exp.description && (
                  <div className="text-zinc-800 text-xs mt-1 whitespace-pre-line leading-relaxed">
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <section className="mb-4">
          <div className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            {"// FEATURED ENGINEERING PROJECTS"}
          </div>
          <div className="pl-2 border-l-2 border-zinc-300 space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-950 font-mono text-xs">{proj.title}</span>
                    {proj.link && (
                      <span className="text-[11px] text-zinc-600 font-mono">[{proj.link}]</span>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {[proj.startDate, proj.endDate].filter(Boolean).join(" -> ")}
                    </span>
                  )}
                </div>
                {proj.techStack.length > 0 && (
                  <div className="text-[11px] font-mono text-zinc-600 mt-0.5">
                    stack: {proj.techStack.map((t) => `[${t}]`).join(" ")}
                  </div>
                )}
                {proj.description && (
                  <div className="text-zinc-800 text-xs mt-1 whitespace-pre-line leading-relaxed">
                    {proj.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <section className="mb-4 break-inside-avoid">
          <div className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            {"// ACADEMIC EDUCATION"}
          </div>
          <div className="pl-2 border-l-2 border-zinc-300 space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-zinc-950 font-mono text-xs">{edu.institution}</span>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {[edu.startDate, edu.endDate].filter(Boolean).join(" -> ")}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline text-xs text-zinc-700">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                  </span>
                  {edu.cgpaOrMarks && (
                    <span className="font-mono text-[11px] font-bold text-zinc-800">{edu.cgpaOrMarks}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Achievements */}
      {(certifications?.length > 0 || achievements?.length > 0) && (
        <section className="mb-3 break-inside-avoid">
          <div className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            {"// CERTIFICATIONS & RECOGNITION"}
          </div>
          <div className="pl-2 border-l-2 border-zinc-300 space-y-1.5 text-xs">
            {certifications.map((c) => (
              <div key={c.id} className="flex justify-between">
                <span>
                  <strong>{c.name}</strong> — {c.issuer}
                </span>
                {c.issueDate && <span className="font-mono text-[11px] text-zinc-500">{c.issueDate}</span>}
              </div>
            ))}
            {achievements.map((ach) => (
              <div key={ach.id} className="flex justify-between">
                <span>
                  <strong>{ach.title}</strong>
                  {ach.organization ? ` (${ach.organization})` : ""}
                </span>
                {ach.date && <span className="font-mono text-[11px] text-zinc-500">{ach.date}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
