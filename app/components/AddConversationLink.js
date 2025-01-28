'use client';

import { useState } from "react";

export default function AddConversationLink({ projects }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [link, setLink] = useState("");

  const handleAddLink = async () => {
    const response = await fetch("/api/activities/add-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject, link }),
    });

    if (!response.ok) {
      alert("Failed to add link.");
    } else {
      alert("Link added successfully!");
    }
  };

  return (
    <div>
      <h2>Add Conversation Link</h2>
      <select
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">Select Project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.project_name}
          </option>
        ))}
      </select>
      <input
        type="url"
        placeholder="Public conversation link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="w-full border p-2 mt-2 rounded"
      />
      <button onClick={handleAddLink} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">
        Add Link
      </button>
    </div>
  );
}
