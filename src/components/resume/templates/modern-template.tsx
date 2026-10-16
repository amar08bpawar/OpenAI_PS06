import React from "react";
import type { ResumeData } from "@/types/resume";

interface TemplateProps {
  data: ResumeData;
}

export function ModernCleanTemplate({ data }: TemplateProps) {
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
    <div className="w-full text-slate-900 bg-white p-8 sm:p-10 font-sans leading-relaxed text-[13px] print:p-0 print:text-[12px]">
      {/* Header */}
      <header className="border-b-2 border-indigo-600 pb-4 mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 uppercase">
          {contact.fullName || "Your Full Name"}
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 mt-2 text-xs">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">•</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary?.trim() && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-slate-700 leading-normal">{summary}</p>
        </section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2.5">
            Education
          </h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{edu.institution}</span>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-xs text-slate-500 font-medium">
                      {[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline text-slate-700">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` • ${edu.fieldOfStudy}` : ""}
                  </span>
                  {edu.cgpaOrMarks && (
                    <span className="text-xs font-semibold text-slate-800">{edu.cgpaOrMarks}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical.length > 0 || skills.soft.length > 0 || skills.toolsAndFrameworks.length > 0) && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2">
            Skills & Competencies
          </h2>
          <div className="space-y-1.5 text-xs">
            {skills.technical.length > 0 && (
              <div>
                <span className="font-bold text-slate-800">Technical Skills: </span>
                <span className="text-slate-700">{skills.technical.join(", ")}</span>
              </div>
            )}
            {skills.toolsAndFrameworks.length > 0 && (
              <div>
                <span className="font-bold text-slate-800">Tools & Frameworks: </span>
                <span className="text-slate-700">{skills.toolsAndFrameworks.join(", ")}</span>
              </div>
            )}
            {skills.soft.length > 0 && (
              <div>
                <span className="font-bold text-slate-800">Soft Skills: </span>
                <span className="text-slate-700">{skills.soft.join(", ")}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Experience / Internships */}
      {experience?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2.5">
            Experience & Internships
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <div className="font-bold text-slate-900">
                    {exp.role} <span className="font-normal text-slate-600">at {exp.company}</span>
                  </div>
                  {(exp.startDate || exp.endDate || exp.current) && (
                    <span className="text-xs text-slate-500 font-medium">
                      {[exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                {exp.location && <div className="text-xs text-slate-500 mb-1">{exp.location}</div>}
                {exp.description && (
                  <div className="text-slate-700 text-xs mt-1 whitespace-pre-line leading-relaxed">
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
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2.5">
            Key Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{proj.title}</span>
                    {proj.link && (
                      <span className="text-xs text-indigo-600 font-medium">[{proj.link}]</span>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-xs text-slate-500 font-medium">
                      {[proj.startDate, proj.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                {proj.techStack.length > 0 && (
                  <div className="text-xs font-medium text-slate-600 mt-0.5">
                    Tech Stack: <span className="text-indigo-800">{proj.techStack.join(", ")}</span>
                  </div>
                )}
                {proj.description && (
                  <div className="text-slate-700 text-xs mt-1 whitespace-pre-line leading-relaxed">
                    {proj.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && (
        <section className="mb-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2">
            Certifications
          </h2>
          <div className="space-y-1.5 text-xs">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-800">{cert.name}</span>
                  <span className="text-slate-600"> — {cert.issuer}</span>
                </div>
                {cert.issueDate && <span className="text-slate-500">{cert.issueDate}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements?.length > 0 && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2">
            Achievements & Honors
          </h2>
          <div className="space-y-1.5 text-xs">
            {achievements.map((ach) => (
              <div key={ach.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">{ach.title}</span>
                  {ach.date && <span className="text-slate-500">{ach.date}</span>}
                </div>
                {ach.organization && (
                  <div className="text-slate-600 text-xs">{ach.organization}</div>
                )}
                {ach.description && <div className="text-slate-700 text-xs mt-0.5">{ach.description}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
