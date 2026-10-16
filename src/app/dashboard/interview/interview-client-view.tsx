"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  startInterviewSessionAction,
  sendInterviewMessageAction,
} from "@/app/actions/interview";
import type { InterviewCategory, InterviewMessage, InterviewSession } from "@/types/database";
import {
  UserCheck,
  Bot,
  Send,
  Loader2,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  Briefcase,
  Users,
  Code,
  Smile,
  PlusCircle,
  Clock,
} from "lucide-react";

interface Props {
  initialSessions: InterviewSession[];
}

const CATEGORY_META: Record<
  InterviewCategory,
  { label: string; icon: any; description: string }
> = {
  hr: {
    label: "HR & Behavioral",
    icon: UserCheck,
    description: "STAR method, strengths, career aspirations, and culture fit.",
  },
  technical: {
    label: "Technical Concepts",
    icon: Code,
    description: "System design, databases, algorithms, and technical architecture.",
  },
  communication: {
    label: "Communication Skills",
    icon: Smile,
    description: "Concise articulation, non-technical explanations, and clarity.",
  },
  teamwork: {
    label: "Teamwork & Collaboration",
    icon: Users,
    description: "Conflict resolution, empathy, and working in agile teams.",
  },
  mock: {
    label: "Comprehensive Mock Round",
    icon: Briefcase,
    description: "End-to-end full placement interview simulation.",
  },
};

export function InterviewClientView({ initialSessions }: Props) {
  const [sessions, setSessions] = useState<InterviewSession[]>(initialSessions);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(
    initialSessions[0] || null
  );

  // New session config
  const [showNewConfig, setShowNewConfig] = useState(initialSessions.length === 0);
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategory>("hr");
  const [roleTarget, setRoleTarget] = useState("Software Engineer");
  const [starting, setStarting] = useState(false);

  // Message stream
  const [userAnswer, setUserAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, sending]);

  const handleStartSession = async () => {
    setStarting(true);
    setError(null);

    try {
      const res = await startInterviewSessionAction({
        category: selectedCategory,
        roleTarget: roleTarget.trim() || "Software Engineer",
      });

      if (res.success && res.session) {
        setCurrentSession(res.session);
        setSessions((prev) => [res.session!, ...prev]);
        setShowNewConfig(false);
      } else {
        setError(res.error || "Failed to initialize interview session.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to start interview.");
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession || !userAnswer.trim() || sending) return;

    const messageText = userAnswer.trim();
    setUserAnswer("");
    setSending(true);
    setError(null);

    // Optimistically add user message
    const tempUserMsg: InterviewMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setCurrentSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : null
    );

    try {
      const res = await sendInterviewMessageAction({
        sessionId: currentSession.id,
        userMessage: messageText,
      });

      if (res.success && res.message) {
        setCurrentSession((prev) =>
          prev ? { ...prev, messages: [...prev.messages, res.message!] } : null
        );
      } else {
        setError(res.error || "Failed to receive interviewer response.");
      }
    } catch (err: any) {
      setError(err?.message || "Communication failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Practice Guidance Banner */}
      <Alert className="border-primary/20 bg-primary/5">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertTitle className="font-semibold text-xs tracking-wide uppercase">
          Simulated AI Interview Coach
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Conversations are conducted with <strong>OpenAI gpt-4o-mini</strong>. All ratings and
          feedback are simulated for educational placement practice.
        </AlertDescription>
      </Alert>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-1 space-y-4">
          <Button
            onClick={() => setShowNewConfig(true)}
            className="w-full gap-2 justify-start font-medium"
            variant={showNewConfig ? "default" : "outline"}
          >
            <PlusCircle className="h-4 w-4" /> New Interview Session
          </Button>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Previous Sessions ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1 max-h-[420px] overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  No interview sessions yet.
                </p>
              ) : (
                sessions.map((s) => {
                  const meta = CATEGORY_META[s.category] || CATEGORY_META.hr;
                  const Icon = meta.icon;
                  const isSelected = currentSession?.id === s.id && !showNewConfig;

                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setCurrentSession(s);
                        setShowNewConfig(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{s.role_target}</div>
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {meta.label} • {new Date(s.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Session or New Config */}
        <div className="lg:col-span-3">
          {showNewConfig ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Start New Interview Session</CardTitle>
                <CardDescription>
                  Configure your target role and the round you wish to practice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Target Job Title / Role
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Frontend Engineer, Cloud Analyst, Associate SDE"
                    value={roleTarget}
                    onChange={(e) => setRoleTarget(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                    Select Interview Round
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(CATEGORY_META) as InterviewCategory[]).map((cat) => {
                      const meta = CATEGORY_META[cat];
                      const Icon = meta.icon;
                      const isSel = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            isSel
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">{meta.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {meta.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex gap-3">
                <Button onClick={handleStartSession} disabled={starting} className="gap-2">
                  {starting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting Up Interview...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Start Interview
                    </>
                  )}
                </Button>
                {currentSession && (
                  <Button variant="ghost" onClick={() => setShowNewConfig(false)}>
                    Cancel
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : currentSession ? (
            <Card className="flex flex-col h-[650px] border-border">
              {/* Session Header */}
              <CardHeader className="py-3 px-5 border-b border-border flex flex-row items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold">
                      {currentSession.role_target}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_META[currentSession.category]?.label || "Interview"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Mock round in progress • Started on{" "}
                    {new Date(currentSession.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages Stream */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentSession.messages.map((msg, idx) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        isAssistant ? "items-start" : "items-end"
                      } space-y-2 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto"}`}
                    >
                      {/* Speaker Badge */}
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1">
                        {isAssistant ? (
                          <>
                            <Bot className="h-3 w-3 text-primary" /> AI Interviewer
                          </>
                        ) : (
                          <>
                            You (Candidate)
                          </>
                        )}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isAssistant
                            ? "bg-muted/70 text-foreground border border-border/60 rounded-tl-none"
                            : "bg-primary text-primary-foreground rounded-tr-none font-normal"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Labeled Feedback Card for Assistant Messages */}
                      {isAssistant && msg.feedback && (
                        <div className="w-full mt-1.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-950 dark:text-amber-200 text-xs space-y-1">
                          <div className="font-semibold flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" /> AI-Generated Answer Feedback
                          </div>
                          <p className="leading-relaxed">{msg.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {sending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Interviewer is evaluating your response and preparing the next question...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <CardFooter className="p-3 border-t border-border bg-background/50">
                <form onSubmit={handleSendMessage} className="w-full flex flex-col gap-2">
                  <div className="relative">
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value.slice(0, 2000))}
                      placeholder="Type your response to the interviewer... (Tip: use STAR format: Situation, Task, Action, Result)"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-normal"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {userAnswer.length} / 2,000 characters
                    </span>

                    <Button
                      type="submit"
                      disabled={!userAnswer.trim() || sending}
                      size="sm"
                      className="gap-1.5"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" /> Send Answer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardFooter>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
