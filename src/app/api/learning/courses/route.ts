import { NextRequest, NextResponse } from "next/server";
import { searchCourseraCourses } from "@/lib/services/coursera";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = await searchCourseraCourses({
      query,
      category,
      difficulty,
      limit: Math.min(Math.max(limit, 1), 100),
      offset: Math.max(offset, 0),
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("API /api/learning/courses error:", error);
    return NextResponse.json(
      {
        courses: [],
        total: 0,
        configured: false,
        provider: "error",
        message: "Failed to retrieve courses.",
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
