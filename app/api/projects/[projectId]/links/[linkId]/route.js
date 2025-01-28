import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function DELETE(request, { params }) {
  const { projectId, linkId } = params;

  try {
    const { error } = await supabase
      .from("project_links")
      .delete()
      .eq("id", linkId)
      .eq("project_id", projectId);

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ message: "Link deleted successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Error deleting link." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
