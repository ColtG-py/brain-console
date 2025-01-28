import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(request) {
  try {
    const { projectId, projectName } = await request.json();

    if (!projectId || !projectName) {
      return new Response(
        JSON.stringify({ error: "Missing project ID or name." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update the project's name
    const { error } = await supabase
      .from("projects")
      .update({ project_name: projectName })
      .eq("id", projectId);

    if (error) {
      console.error("Supabase Error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to update project name." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Project name updated successfully!" }),
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
