import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(request) {
  try {
    const { projectId, link } = await request.json();

    // Insert the link as an activity
    const { error } = await supabase.from("activities").insert({
      project_id: projectId,
      activity_summary: `Conversation link: ${link}`,
    });

    if (error) {
      console.error("Supabase Error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to add conversation link." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Conversation link added successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error adding conversation link:", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
