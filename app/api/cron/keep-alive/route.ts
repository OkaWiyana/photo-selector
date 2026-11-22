import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error: "Supabase client not initialized",
      },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("galleries")
    .select("id")
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: "ok",
    message: "supabase pinged successfully! Project remains active.",
    timestamp: new Date().toISOString(),
    dataCount: data?.length ?? 0,
  });
}
