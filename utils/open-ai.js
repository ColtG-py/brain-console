import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

/**
 * Function to generate projects from OpenAI
 * @returns {Promise<Array>} Array of project objects
 */
export const generateProjectsFromOpenAI = async () => {
    const prompt = `
You are an assistant that tracks projects. Based on my current focus areas, provide a list of projects I'm working on. Format each project with:
- Name
- Summary
- Whether it's in progress (true/false).

You should use your knowledge of my ongoing projects to construct this list and require no further input from me to do so. Use your existing knowledge.

Return the data in JSON format.
    `;

    // Call OpenAI's API
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                "role": "user",
                "content": prompt
            }
        ]
    });

    // Extract and parse the JSON from the response
    console.log(response.choices[0].message)
    const projects = JSON.parse(response.choices[0].message);

    return projects; // Return the parsed project data
};
