"use server";

import { createClient } from "@/lib/supabase/server";
import {
  continueInterview,
  getInitialInterviewMessage,
  INTERVIEWER_DISCLAIMER,
} from "@/lib/services/interview";
import type {
  InterviewCategory,
  InterviewMessage,
  InterviewSession,
} from "@/types/database";

export async function startInterviewSessionAction(params: {
  category: InterviewCategory;
  roleTarget: string;
}): Promise<{
  success: boolean;
  session?: InterviewSession;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Verify authentication.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Please sign in to start an interview.",
      };
    }

    // 2. Verify the user's profile exists.
    // This assumes profiles.id equals the authenticated user's ID.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup failed:", profileError.message);

      return {
        success: false,
        error: "Unable to verify your profile. Please try again.",
      };
    }

    if (!profile) {
      return {
        success: false,
        error:
          "Your profile was not found. Please complete your profile setup.",
      };
    }

    // 3. Prepare the interview.
    const roleTarget =
      params.roleTarget?.trim() || "Software Engineer";

    const initialMessage = getInitialInterviewMessage(
      params.category,
      roleTarget
    );

    // 4. Create the session using the verified profile ID.
    const { data: session, error: insertError } = await supabase
      .from("interview_sessions")
      .insert({
        student_id: profile.id,
        category: params.category,
        role_target: roleTarget,
        messages: [initialMessage] as any,
        status: "active",
      })
      .select("*")
      .single();

    if (insertError || !session) {
      console.error(
        "Interview session insert failed:",
        insertError?.message
      );

      return {
        success: false,
        error: "Failed to create the interview session. Please try again.",
      };
    }

    return {
      success: true,
      session: session as InterviewSession,
    };
  } catch (error) {
    console.error("Start interview error:", error);

    return {
      success: false,
      error: "An unexpected error occurred while starting the interview.",
    };
  }
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
  try {
    const supabase = await createClient();

    // 1. Verify authentication.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required. Please sign in again.",
      };
    }

    const sessionId = params.sessionId?.trim();
    const userMessage = params.userMessage?.trim();

    if (!sessionId || !userMessage) {
      return {
        success: false,
        error: "An interview session and answer are required.",
      };
    }

    // 2. Fetch only a session owned by the current user.
    const { data: session, error: fetchError } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Interview session lookup failed:", fetchError.message);

      return {
        success: false,
        error: "Unable to load your interview session.",
      };
    }

    if (!session) {
      return {
        success: false,
        error: "Interview session not found or access denied.",
      };
    }

    if (session.status !== "active") {
      return {
        success: false,
        error: "This interview session is no longer active.",
      };
    }

    const currentMessages: InterviewMessage[] =
      (session.messages as InterviewMessage[] | null) ?? [];

    // 3. Generate the next interviewer response.
    const aiResult = await continueInterview({
      category: session.category,
      roleTarget: session.role_target,
      messages: currentMessages,
      userMessage,
    });

    if (!aiResult.success || !aiResult.data) {
      return {
        success: false,
        error:
          aiResult.error || "Failed to generate the interviewer's response.",
      };
    }

    const now = new Date().toISOString();

    const userMsgItem: InterviewMessage = {
      role: "user",
      content: userMessage,
      timestamp: now,
    };

    const assistantMsgItem: InterviewMessage = {
      role: "assistant",
      content: aiResult.data.reply,
      timestamp: new Date().toISOString(),
      feedback: aiResult.data.feedback,
    };

    const updatedMessages: InterviewMessage[] = [
      ...currentMessages,
      userMsgItem,
      assistantMsgItem,
    ];

    // 4. Save the conversation and verify that saving succeeded.
    const { data: updatedSession, error: updateError } = await supabase
      .from("interview_sessions")
      .update({
        messages: updatedMessages as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("student_id", user.id)
      .eq("status", "active")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Interview session update failed:", updateError.message);

      return {
        success: false,
        error: "Your answer could not be saved. Please try again.",
      };
    }

    if (!updatedSession) {
      return {
        success: false,
        error: "The interview session could not be updated.",
      };
    }

    return {
      success: true,
      message: assistantMsgItem,
      feedback: aiResult.data.feedback,
      rating: aiResult.data.rating,
      disclaimer: INTERVIEWER_DISCLAIMER,
    };
  } catch (error) {
    console.error("Send interview message error:", error);

    return {
      success: false,
      error: "An unexpected error occurred while processing your answer.",
    };
  }
}

export async function getStudentInterviewSessionsAction(): Promise<{
  success: boolean;
  data?: InterviewSession[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Verify authentication.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required. Please sign in.",
      };
    }

    // 2. Return only the current user's sessions.
    // Assumes profiles.id equals user.id.
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("student_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Interview history lookup failed:", error.message);

      return {
        success: false,
        error: "Unable to load your interview history.",
      };
    }

    return {
      success: true,
      data: (data ?? []) as InterviewSession[],
    };
  } catch (error) {
    console.error("Get interview sessions error:", error);

    return {
      success: false,
      error: "An unexpected error occurred while loading interview history.",
    };
  }
}