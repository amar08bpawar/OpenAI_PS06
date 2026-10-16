"use server";

import { createClient } from "@/lib/supabase/server";
import {
  continueInterview,
  getInitialInterviewMessage,
  INTERVIEWER_DISCLAIMER,
  type InterviewResponse,
} from "@/lib/services/interview";
import type { InterviewCategory, InterviewMessage, InterviewSession } from "@/types/database";

export async function startInterviewSessionAction(params: {
  category: InterviewCategory;
  roleTarget: string;
}): Promise<{
  success: boolean;
  session?: InterviewSession;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required to start an interview session." };
  }

  const roleTarget = params.roleTarget.trim() || "Software Engineer";
  const initialMessage = getInitialInterviewMessage(params.category, roleTarget);

  const { data: session, error } = await supabase
    .from("interview_sessions")
    .insert({
      student_id: user.id,
      category: params.category,
      role_target: roleTarget,
      messages: [initialMessage] as any,
      status: "active",
    })
    .select()
    .single();

  if (error || !session) {
    return { success: false, error: error?.message || "Failed to initialize interview session." };
  }

  return { success: true, session: session as any };
}

export async function sendInterviewMessageAction(params: {
  sessionId: string;
  userMessage: string;
}): Promise<{
  success: boolean;
  message?: InterviewMessage;
  feedback?: string;
  rating?: string;
  disclaimer?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  // 1. Fetch active session
  const { data: session, error: fetchError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", params.sessionId)
    .single();

  if (fetchError || !session) {
    return { success: false, error: "Interview session not found." };
  }

  if (session.student_id !== user.id) {
    return { success: false, error: "Unauthorized access to this interview session." };
  }

  const currentMessages: InterviewMessage[] = (session.messages as any) || [];

  // 2. Add user message
  const userMsgItem: InterviewMessage = {
    role: "user",
    content: params.userMessage.trim(),
    timestamp: new Date().toISOString(),
  };

  // 3. Generate AI response and critique
  const aiResult = await continueInterview({
    category: session.category,
    roleTarget: session.role_target,
    messages: currentMessages,
    userMessage: params.userMessage,
  });

  if (!aiResult.success || !aiResult.data) {
    return { success: false, error: aiResult.error || "Failed to generate interviewer response." };
  }

  const assistantMsgItem: InterviewMessage = {
    role: "assistant",
    content: aiResult.data.reply,
    timestamp: new Date().toISOString(),
    feedback: aiResult.data.feedback,
  };

  const updatedMessages = [...currentMessages, userMsgItem, assistantMsgItem];

  // 4. Update session
  await supabase
    .from("interview_sessions")
    .update({
      messages: updatedMessages as any,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.sessionId);

  return {
    success: true,
    message: assistantMsgItem,
    feedback: aiResult.data.feedback,
    rating: aiResult.data.rating,
    disclaimer: INTERVIEWER_DISCLAIMER,
  };
}

export async function getStudentInterviewSessionsAction(): Promise<{
  success: boolean;
  data?: InterviewSession[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data as any) || [] };
}
