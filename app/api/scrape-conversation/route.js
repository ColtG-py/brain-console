import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(request) {
  try {
    const { projectId, link } = await request.json();

    if (!link || !link.startsWith("https://chatgpt.com/share/")) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing link." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch the shared conversation page
    const response = await fetch(link);

    if (!response.ok) {
      throw new Error("Failed to fetch the page content.");
    }

    // Get the raw text of the page
    let rawText = await response.text();

    // Preprocess the raw text: Remove all backslashes
    rawText = rawText.replace(/\\/g, "");

    // Extract the full block of conversation text
    const fullBlockRegex = /"role","system".*?"moderation_results"/s;
    const match = fullBlockRegex.exec(rawText);

    if (!match) {
      throw new Error("Failed to find the conversation block.");
    }

    // Extracted conversation block
    const conversationBlock = match[0]
      .replace(/\\n/g, "\n") // Replace escaped newlines with actual newlines
      .trim();

    const prompt = `
        The following is a conversation between a user and an AI. Summarize the key activities and decisions that were made during this conversation in a concise and actionable format:

        ${conversationBlock}

        Provide the summary in a bullet-point format. Focus on decisions, completed actions, or important discussions.
    `;
    
    // Call OpenAI's API
    const reply = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                "role": "user",
                "content": prompt
            }
        ]
    });

    // Extract and parse the JSON from the response
    console.log(reply.choices[0].message?.content)
    const summary = reply.choices[0].message?.content;

    if (!summary) {
        throw new Error("Failed to generate a summary from OpenAI.");
    }

    const { error } = await supabase.from("activities").insert({
        project_id: projectId,
        activity_summary: summary,
    });

    if (error) {
        console.error("Supabase Error:", error.message);
        throw new Error("Failed to insert activity into the database.");
    }

    return new Response(
        JSON.stringify({ message: "Activity summarized and inserted successfully!" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error summarizing and inserting activity:", error.message);
        return new Response(
        JSON.stringify({ error: error.message || "An unexpected error occurred." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}