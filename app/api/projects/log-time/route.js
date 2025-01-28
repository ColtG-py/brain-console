import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { projectId, duration, summary } = await request.json();

    if (!projectId || !duration) {
      return new Response(
        JSON.stringify({ error: "Missing project ID or duration." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format the date as YYYY-MM-DD
    const date = new Date().toISOString().slice(0, 10);

    // Check if a time log already exists for this project and date
    const { data: existingLog, error: fetchError } = await supabase
      .from("time_logs")
      .select("duration")
      .eq("project_id", projectId)
      .eq("date", date)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Supabase Fetch Error:", fetchError.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch existing time log." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate the new duration
    const newDuration = existingLog ? existingLog.duration + duration : duration;

    // Upsert the time log
    const { error: upsertError } = await supabase
      .from("time_logs")
      .upsert(
        {
          project_id: projectId,
          duration: newDuration,
          date,
        },
        { onConflict: ["project_id", "date"] } // Specify conflict resolution on unique columns
      );

    if (upsertError) {
      console.error("Supabase Time Log Error:", upsertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to log time." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log the activity summary in the `activities` table
    if (summary && summary.trim()) {
      const { error: activityError } = await supabase.from("activities").insert({
        project_id: projectId,
        activity_summary: summary.trim(),
        created_at: new Date().toISOString(),
      });

      if (activityError) {
        console.error("Supabase Activity Log Error:", activityError.message);
        return new Response(
          JSON.stringify({ error: "Failed to log activity summary." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ message: "Time and activity logged successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
