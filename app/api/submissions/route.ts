import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { exercise_id, prompt_text } = body;

  if (!exercise_id || !prompt_text) {
    return NextResponse.json(
      { error: "exercise_id and prompt_text are required" },
      { status: 400 }
    );
  }

  // Verify exercise exists
  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", exercise_id)
    .single();

  if (exerciseError || !exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      exercise_id,
      trainee_id: user.id,
      prompt_text,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
