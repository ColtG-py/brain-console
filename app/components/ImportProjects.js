'use client';

import { useState } from "react";

export default function ImportProjects() {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");

  const handleImport = async () => {
    try {
      const projects = JSON.parse(jsonInput);

      const response = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });

      if (!response.ok) {
        throw new Error("Failed to import projects.");
      }

      alert("Projects imported successfully!");
      setJsonInput("");
    } catch (err) {
      setError("Invalid JSON or server error. Please try again.");
      console.error(err.message);
    }
  };

  return (
    <div>
      <h2>Import Projects</h2>
      <textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder="Paste JSON here..."
        className="w-full border p-2 rounded"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button onClick={handleImport} className="bg-blue-600 text-white px-4 py-2 rounded">
        Import Projects
      </button>
    </div>
  );
}
