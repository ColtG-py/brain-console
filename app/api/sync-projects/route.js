// app/api/sync-projects/route.js
import { generateProjectsFromOpenAI } from "@/utils/open-ai";
import { insertProjectsIntoSupabase } from "@/hooks/useProjects";

export async function POST(request) {
  try {
    // Generate projects from OpenAI
    const projects = await generateProjectsFromOpenAI();

    // Insert projects into Supabase
    const result = await insertProjectsIntoSupabase(projects);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Projects synced successfully!", data: result.data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error syncing projects:", error.message);
    return new Response(
      JSON.stringify({ error: "An error occurred while syncing projects." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
