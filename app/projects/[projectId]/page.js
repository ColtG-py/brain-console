"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Trash, Plus, Edit, Save, X, Upload } from "lucide-react"; // Icons
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export default function DrillDownPage({ params }) {
  const { projectId } = params; // Access projectId from the route
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [links, setLinks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]); // For file management
  const [newFile, setNewFile] = useState(null);
  const [fileAlert, setFileAlert] = useState(false); // Alert for missing file
  const [newLink, setNewLink] = useState({ url: "", description: "" });
  const [inProgress, setInProgress] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState("");
  
  const { toast } = useToast();

  // Fetch project details, links, and activities
  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project details.");
      }

      setProject(data.project);
      setLinks(data.project.links || []);
      setActivities(data.project.activities || []);
      setInProgress(data.project.in_progress);
      setUpdatedTitle(data.project.project_name);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/time-logs`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch time logs.");
      }

      setTimeLogs(data.timeLogs || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch files.");
      }

      setFiles(data.files || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchTimeLogs();
    fetchFiles();
  }, [projectId]);

  const handleUploadFile = async () => {
    if (!newFile) {
      setFileAlert(true);
      setTimeout(() => setFileAlert(false), 5000); // Automatically hide the alert after 5 seconds
      return;
    }

    const formData = new FormData();
    formData.append("file", newFile);

    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file.");
      }

      const data = await response.json();
      setFiles((prev) => [...prev, { name: newFile.name, url: data.url }]);
      setNewFile(null); // Reset the file input

      toast({
        title: "File Uploaded",
        description: "The file was uploaded successfully.",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error uploading file:", err.message);
    }
  };

  const handleDeleteFile = async (fileName) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete file.");
      }

      setFiles((prev) => prev.filter((file) => file.name !== fileName));

      toast({
        title: "File Deleted",
        description: "The file was deleted successfully.",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error deleting file:", err.message);
    }
  };

  const getChartData = () => {
    const aggregation = timeLogs.reduce((acc, log) => {
      acc[log.date] = (acc[log.date] || 0) + log.duration; // Sum durations for each date
      return acc;
    }, {});
  
    return Object.entries(aggregation)
      .map(([date, duration]) => ({
        date,
        duration: parseFloat((duration / 60).toFixed(2)), // Convert seconds to minutes
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date in ascending order
  };
  

  if (loading) {
    return <p>Loading...</p>;
  }

  const handleAddLink = async () => {
    if (!newLink.url.trim()) {
      alert("URL cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      });

      if (!response.ok) {
        throw new Error("Failed to add link.");
      }

      const data = await response.json();
      setLinks((prev) => [...prev, data.link]);
      setNewLink({ url: "", description: "" }); // Reset new link input
    } catch (err) {
      console.error("Error adding link:", err.message);
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/links/${linkId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete link.");
      }

      setLinks((prev) => prev.filter((link) => link.id !== linkId));
    } catch (err) {
      console.error("Error deleting link:", err.message);
    }
  };

  const handleToggleInProgress = async () => {
    try {
      const response = await fetch(`/api/projects/update-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, inProgress: !inProgress }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project state.");
      }

      setInProgress(!inProgress);

      toast({
        title: "Project Updated",
        description: `The project is now ${
          inProgress ? "paused" : "in progress"
        }.`,
        duration: 3000,
      });
    } catch (err) {
      console.error("Error toggling project state:", err.message);
    }
  };

  const handleUpdateTitle = async () => {
    try {
      const response = await fetch("/api/projects/update-project-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectName: updatedTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project name.");
      }

      toast({
        title: "Project Updated",
        description: "The project name was updated successfully.",
        duration: 3000,
      });

      setEditMode(false);
      fetchProjectDetails();
    } catch (error) {
      console.error("Error updating project name:", error.message);
      toast({
        title: "Error",
        description: "Failed to update the project name. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (loading) return <p>Loading...</p>;


  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "#2563eb",
    },
    mobile: {
      label: "Mobile",
      color: "#60a5fa",
    },
  }

  return (
    <main className="p-8">
      <header className="mb-6">
        {editMode ? (
          <div className="flex items-center gap-2">
            <Input
              value={updatedTitle}
              onChange={(e) => setUpdatedTitle(e.target.value)}
            />
            <Button onClick={handleUpdateTitle}>
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={() => setEditMode(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{project.project_name}</h1>
            <Button variant="ghost" onClick={() => setEditMode(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        )}
        <p>{project.summary}</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Managed Files</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length > 0 ? (
              files.map((file) => (
                <TableRow key={file.name}>
                  <TableCell>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      {file.name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => handleDeleteFile(file.name)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="2">No files uploaded yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center gap-2 mt-4">
          <Input
            type="file"
            onChange={(e) => setNewFile(e.target.files[0])}
            className="w-2/3"
          />
          <Button onClick={handleUploadFile}>
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Links</h2>
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between border-b pb-2"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                {link.url}
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500"
                onClick={() => handleDeleteLink(link.id)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Input
            placeholder="URL"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          />
          <Input
            placeholder="Description (optional)"
            value={newLink.description}
            onChange={(e) =>
              setNewLink({ ...newLink, description: e.target.value })
            }
          />
          <Button onClick={handleAddLink}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Activities</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length > 0 ? (
              activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{activity.activity_summary}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="2">No activities logged yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Time Logs</h2>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getChartData()}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="duration" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </section>
    </main>
  );
}
