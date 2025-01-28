import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET() {
  try {
    // Fetch all projects and their associated activities
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        project_name,
        summary,
        in_progress,
        activities (
          activity_summary,
          created_at
        )
      `)
      .order("created_at", { foreignTable: "activities", ascending: false }); // Order activities by creation date (descending)

    if (error) {
      console.error("Supabase Error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch projects with activities." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ projects: data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching projects:", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


export async function POST(request) {
    try {
      const { project_name, summary, in_progress } = await request.json();
  
      const { data, error } = await supabase
        .from("projects")
        .insert({ project_name, summary, in_progress })
        .select("*")
        .single();
  
      if (error) {
        console.error("Error creating project:", error.message);
        return new Response(
          JSON.stringify({ error: "Failed to create project." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
  
      return new Response(
        JSON.stringify({ project: data }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Error in POST /api/projects:", err.message);
      return new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }