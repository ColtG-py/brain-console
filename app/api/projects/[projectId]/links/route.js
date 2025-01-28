import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  const { projectId } = params; // Update to projectId

  try {
    const { data, error } = await supabase
      .from("project_links")
      .select("*")
      .eq("project_id", projectId); // Use projectId instead of id

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ links: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Error fetching links" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request, { params }) {
  const { projectId } = params; // Update to projectId
  const { url, description } = await request.json();

  try {
    const { data, error } = await supabase
      .from("project_links")
      .insert([{ project_id: projectId, url, description }]); // Use projectId

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Error adding link" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
