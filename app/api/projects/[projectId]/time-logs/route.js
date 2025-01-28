import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  const { projectId } = params;

  try {
    const { data, error } = await supabase
      .from("time_logs")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;

    return new Response(JSON.stringify({ timeLogs: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to fetch time logs." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
