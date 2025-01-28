"use client";

import { useState, useEffect } from "react";
import ProjectCard from "./components/ProjectCard";
import Stopwatch from "./components/Stopwatch";
import { FilePlus } from "lucide-react"; // Import the FilePlus icon

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false); // Track creation state
  const [newProject, setNewProject] = useState({
    project_name: "",
    summary: "",
  });

  const [jsonInput, setJsonInput] = useState("");

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch projects.");
      }

      setProjects(data.projects);
    } catch (err) {
      console.error(err.message);
      setError(err.message || "An error occurred while fetching projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const sortedProjects = projects.sort((a, b) => {
    // Sort by in_progress (true first)
    if (a.in_progress !== b.in_progress) {
      return b.in_progress - a.in_progress;
    }

    // Sort by last activity date (most recent first)
    const aDate = a.activities?.[0]?.created_at
      ? new Date(a.activities[0].created_at)
      : new Date(0); // Default to epoch if no activity
    const bDate = b.activities?.[0]?.created_at
      ? new Date(b.activities[0].created_at)
      : new Date(0);
    return bDate - aDate;
  });

  const handleCreateProject = async () => {
    if (!newProject.project_name || !newProject.summary) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: newProject.project_name,
          summary: newProject.summary,
          in_progress: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project.");
      }

      const data = await response.json();
      setProjects((prev) => [...prev, data.project]); // Add new project to the list
      setNewProject({ project_name: "", summary: "" }); // Reset the form
      setCreating(false); // Exit creation mode
    } catch (err) {
      console.error("Error creating project:", err.message);
      alert("Failed to create the project. Please try again.");
    }
  };

  const handleToggleProject = (project) => {
    if (activeProject && activeProject.id === project.id) {
      // Move project back to the project list
      setProjects((prev) => [...prev, activeProject]);
      setActiveProject(null);
    } else {
      // Move project to the active slot
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setActiveProject(project);
    }
  };

  const handleStopwatchStop = async (elapsedTime, summary) => {
    if (activeProject) {
      try {
        await fetch("/api/projects/log-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: activeProject.id,
            duration: elapsedTime,
            summary, // Include the summary
          }),
        });
  
        // Optionally refetch state if needed
        refetchProjects();
      } catch (err) {
        console.error("Error logging time and activity:", err.message);
      }
  
      // Reset state
      setActiveProject(null);
    }
  };
  

  const handleImport = async () => {
    try {
      const importedProjects = JSON.parse(jsonInput);

      const isValid = importedProjects.every(
        (project) =>
          "project_name" in project &&
          "summary" in project &&
          "in_progress" in project &&
          typeof project.project_name === "string" &&
          typeof project.summary === "string" &&
          typeof project.in_progress === "boolean"
      );

      if (!isValid) {
        throw new Error("Invalid JSON structure. Please check your data.");
      }

      const response = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: importedProjects }),
      });

      if (!response.ok) {
        throw new Error("Failed to import projects.");
      }

      alert("Projects imported successfully!");
      setJsonInput("");
      setProjects([...projects, ...importedProjects]); // Update the state with new projects
    } catch (err) {
      console.error(err.message);
      setError(err.message || "An error occurred while importing projects.");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <main className="p-8">
      <div className="mb-8">
        <Stopwatch
          activeProject={activeProject}
          onStop={handleStopwatchStop}
        />
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-md min-h-[100px]">
          {activeProject ? (
            <ProjectCard
              project={activeProject}
              onToggleProject={handleToggleProject}
              refetchProjects={fetchProjects}
              isActive={true}
            />
          ) : (
            <p className="text-gray-500">No active project</p>
          )}
        </div>
      </div>
      {sortedProjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedProjects.map((project) => (
              <ProjectCard 
                key={project.project_name} 
                project={project} 
                onToggleProject={handleToggleProject}
                refetchProjects={fetchProjects}
              />
            ))}
            <div className="shadow-md p-4 border border-dashed border-gray-300 rounded-md flex flex-col justify-center items-center">
              {creating ? (
                <div className="w-full space-y-4">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={newProject.project_name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, project_name: e.target.value })
                    }
                    className="w-full p-2 border rounded-md"
                  />
                  <textarea
                    placeholder="Summary"
                    value={newProject.summary}
                    onChange={(e) =>
                      setNewProject({ ...newProject, summary: e.target.value })
                    }
                    className="w-full p-2 border rounded-md"
                  />
                  <button
                    onClick={handleCreateProject}
                    className="w-full bg-green-100 text-white py-2 rounded-md hover:bg-green-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setCreating(false)}
                    className="w-full bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="bg-green-100 text-white p-4 rounded-full hover:bg-green-300"
                >
                  <FilePlus />
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">Brain Console</h1>
          <p className="text-gray-700 mb-4">
            To get started, ask me this question in the OpenAI web console:
          </p>
          <pre className="bg-gray-100 p-4 rounded mb-4">
            "Can you provide a JSON block of all the projects you’re tracking
            for me?"
          </pre>
          <p className="text-gray-700 mb-6">
            Ensure the JSON structure matches the following format:
          </p>
          <pre className="bg-gray-100 p-4 rounded mb-4">
            {`[
              {
                "project_name": "Project Name",
                "summary": "Short summary of the project.",
                "in_progress": true
              }
            ]`}
          </pre>
          <p className="text-gray-700 mb-6">
            Once you have the JSON, paste it below to import your projects:
          </p>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON block here..."
            className="w-full h-40 border p-2 rounded mb-4"
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            onClick={handleImport}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Import Projects
          </button>
        </>
      )}
    </main>
  );
}
