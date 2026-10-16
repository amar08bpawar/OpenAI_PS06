import React from "react";
import type { ResumeData } from "@/types/resume";

interface TemplateProps {
  data: ResumeData;
}

export function ClassicCorporateTemplate({ data }: TemplateProps) {
  const { contact, summary, education, skills, projects, experience, certifications, achievements } = data;

  const contactItems = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedinUrl ? contact.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "") : null,
    contact.githubUrl ? contact.githubUrl.replace(/^https?:\/\/(www\.)?/, "") : null,
  ].filter(Boolean);

  return (
    <div className="w-full text-black bg-white p-8 sm:p-10 font-serif leading-relaxed text-[13px] print:p-0 print:text-[12px]">
      {/* Centered Traditional Header */}
      <header className="text-center pb-3 mb-4 border-b border-black">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-black">
          {contact.fullName || "Your Full Name"}
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-xs text-neutral-800 mt-1 font-sans">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-neutral-400">|</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary?.trim() && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-neutral-400 pb-0.5 mb-1.5 font-sans">
            Career Objective / Summary
          </h2>
          <p className="text-neutral-900 leading-normal text-justify">{summary}</p>
        </section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-neutral-400 pb-0.5 mb-2 font-sans">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold">
                  <span>{edu.institution}</span>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-xs font-normal font-sans">
                      {[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline italic text-xs text-neutral-900">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
                  </span>
                  {edu.cgpaOrMarks && (
                    <span className="font-semibold not-italic font-sans">{edu.cgpaOrMarks}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical.length > 0 || skills.toolsAndFrameworks.length > 0 || skills.soft.length > 0) && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-neutral-400 pb-0.5 mb-1.5 font-sans">
            Technical & Professional Skills
          </h2>
          <div className="space-y-1 text-xs">
            {skills.technical.length > 0 && (
              <div>
                <strong className="font-sans">Languages & Frameworks: </strong>
                <span>{skills.technical.join(", ")}</span>
              </div>
            )}
            {skills.toolsAndFrameworks.length > 0 && (
              <div>
                <strong className="font-sans">Developer Tools & Databases: </strong>
                <span>{skills.toolsAndFrameworks.join(", ")}</span>
              </div>
            )}
            {skills.soft.length > 0 && (
              <div>
                <strong className="font-sans">Core Competencies: </strong>
                <span>{skills.soft.join(", ")}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-neutral-400 pb-0.5 mb-2 font-sans">
            Professional Experience & Internships
          </h2>
          <div className="space-y-2.5">
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{exp.company}</span>
                  {(exp.startDate || exp.endDate || exp.current) && (
                    <span className="text-xs font-sans">
                      {[exp.startDate, exp.current ? "Present" : exp.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline italic text-xs mb-1">
                  <span>{exp.role}</span>
                  {exp.location && <span className="not-italic font-sans">{exp.location}</span>}
                </div>
                {exp.description && (
                  <div className="text-xs whitespace-pre-line leading-relaxed font-sans text-neutral-900">
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-neutral-400 pb-0.5 mb-2 font-sans">
            Academic & Independent Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">
                    {proj.title}
                    {proj.link && <span className="font-normal text-xs font-sans ml-1">({proj.link})</span>}
                  </span>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-xs font-sans">
                      {[proj.startDate, proj.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                {proj.techStack.length > 0 && (
                  <div className="text-xs italic text-neutral-800 font-sans mb-0.5">
                    Technologies: {proj.techStack.join(", ")}
                  </div>
                )}
                {proj.description && (
                  <div className="text-xs whitespace-pre-line leading-relaxed font-sans text-neutral-900">
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
        <section className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-neutral-400 pb-0.5 mb-1.5 font-sans">
            Certifications
          </h2>
          <div className="space-y-1 text-xs">
            {certifications.map((c) => (
              <div key={c.id} className="flex justify-between">
                <span>
                  <strong>{c.name}</strong> — {c.issuer}
                </span>
                {c.issueDate && <span className="font-sans">{c.issueDate}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements?.length > 0 && (
        <section className="mb-3 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-neutral-400 pb-0.5 mb-1.5 font-sans">
            Key Achievements
          </h2>
          <div className="space-y-1 text-xs">
            {achievements.map((ach) => (
              <div key={ach.id}>
                <div className="flex justify-between font-bold">
                  <span>{ach.title}</span>
                  {ach.date && <span className="font-sans font-normal">{ach.date}</span>}
                </div>
                {ach.organization && <div className="italic text-neutral-700">{ach.organization}</div>}
                {ach.description && <div className="font-sans text-neutral-800 mt-0.5">{ach.description}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
