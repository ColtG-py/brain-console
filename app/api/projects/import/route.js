import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(request) {
  try {
    const { projects } = await request.json();

    // Directly insert rows into Supabase
    const { error } = await supabase.from("projects").insert(projects);

    if (error) {
      console.error("Supabase Error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to insert projects into the database." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Projects imported successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error importing projects:", error.message);
    return new Response(
      JSON.stringify({ error: "Invalid request or server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
