import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Delete the project from the database
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      console.error("Error deleting project:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to delete project." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Project deleted successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in DELETE /api/projects:", err.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(request, { params }) {
    const { projectId } = params;
  
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
  
    if (error) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    return new Response(JSON.stringify({ project: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }