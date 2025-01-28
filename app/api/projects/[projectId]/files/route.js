import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  const { projectId } = params;

  if (!projectId) {
    return new Response(
      JSON.stringify({ error: "Missing project ID." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // List all files for the given project ID
    const { data, error } = await supabase.storage
      .from("files")
      .list(`${projectId}/`);

    if (error) {
      console.error("Supabase Storage Error (List):", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to list files." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ files: data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error (List):", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request, { params }) {
  const { projectId } = params;

  if (!projectId) {
    return new Response(
      JSON.stringify({ error: "Missing project ID." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fileName = `${projectId}/${Date.now()}-${file.name}`;

    // Upload the file to the 'files' bucket
    const { data, error } = await supabase.storage
      .from("files")
      .upload(fileName, file, {
        upsert: true,
      });

    if (error) {
      console.error("Supabase Storage Error (Upload):", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to upload file." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("files")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ message: "File uploaded successfully.", url: publicUrlData.publicUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error (Upload):", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(request, { params }) {
  const { projectId } = params;

  if (!projectId) {
    return new Response(
      JSON.stringify({ error: "Missing project ID." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return new Response(
        JSON.stringify({ error: "File name is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase.storage
      .from("files")
      .remove([`${projectId}/${fileName}`]);

    if (error) {
      console.error("Supabase Storage Error (Delete):", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to delete file." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "File deleted successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error (Delete):", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
