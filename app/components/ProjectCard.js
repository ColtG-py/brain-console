import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"  
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"
import { Play, Pause } from "lucide-react"; // For icons
import { Edit, Save, X, ArrowUp, ArrowDown, Trash, Plus } from "lucide-react"; // Icons for edit/save/cancel
import { useRouter } from "next/navigation";

export default function ProjectCard({ project, refetchProjects, isActive, onToggleProject }) {
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState({ url: "", description: "" });
    const [isDialogOpen, setIsDialogOpen] = useState(false); // Track dialog state
    const [confirmDelete, setConfirmDelete] = useState(false); // Toggle delete confirmation mode
    const [inProgress, setInProgress] = useState(project.in_progress);
    const [toggleLoading, setToggleLoading] = useState(false); // Renamed state for pause/play button
    const [link, setLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false); // Toggle for edit mode
    const [updatedTitle, setUpdatedTitle] = useState(project.project_name); // Editable title
    const { toast } = useToast(); // Use the toast hook
    const latestActivity = project.activities?.[0];
    const truncatedActivity =
    latestActivity?.activity_summary.length > 40
        ? `${latestActivity.activity_summary.substring(0, 40)}...`
        : latestActivity?.activity_summary || "No activity logged yet.";
    const activityDate = latestActivity?.created_at
    ? new Date(latestActivity.created_at).toLocaleDateString()
    : "No date available";

    // Determine card background based on project status
    const cardClasses = project.in_progress
    ? "shadow-md" // Default style for in-progress
    : "shadow-md bg-gray-100"; // Gray background for not in-progress

    const router = useRouter();

    const fetchLinks = async () => {
        try {
          const response = await fetch(`/api/projects/${project.id}/links`);
          const data = await response.json();
  
          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch links.");
          }
  
          setLinks(data.links);
        } catch (err) {
          console.error("Error fetching links:", err.message);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, [project.id]);

    const handleDialogOpen = (open) => {
        setIsDialogOpen(open);
        if (open) {
          fetchLinks();
        }
    };

    const handleAddLink = async () => {
        if (!newLink.url.trim()) {
          alert("URL cannot be empty.");
          return;
        }
    
        try {
          const response = await fetch(`/api/projects/${project.id}/links`, {
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
          const response = await fetch(`/api/projects/${project.id}/links/${linkId}`, {
            method: "DELETE",
          });
    
          if (!response.ok) {
            throw new Error("Failed to delete link.");
          }
    
          setLinks((prev) => prev.filter((link) => link.id !== linkId)); // Update UI immediately
        } catch (err) {
          console.error("Error deleting link:", err.message);
        }
    };

    const handleUpdateTitle = async () => {
        try {
          const response = await fetch("/api/projects/update-project-name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              projectName: updatedTitle,
            }),
          });
    
          if (!response.ok) {
            throw new Error("Failed to update project name.");
          }
    
          const data = await response.json();
          console.log(data.message);
    
          // Show success toast
          toast({
            title: "Project Updated",
            description: "The project name was updated successfully.",
            duration: 3000,
          });
    
          setEditMode(false); // Exit edit mode
          refetchProjects();
        } catch (error) {
          console.error("Error updating project name:", error.message);
    
          // Show error toast
          toast({
            title: "Error",
            description: "Failed to update the project name. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      };

    const handleToggleInProgress = async () => {
        setToggleLoading(true);
        try {
          const response = await fetch("/api/projects/update-project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              inProgress: !inProgress,
            }),
          });
    
          if (!response.ok) {
            throw new Error("Failed to update project state.");
          }
    
          const data = await response.json();
          console.log(data.message);
    
          // Toggle the state locally
          setInProgress(!inProgress);
          refetchProjects();
    
          // Show success toast
          toast({
            title: "Project Updated",
            description: `The project has been ${
              inProgress ? "paused" : "started"
            } successfully.`,
            duration: 3000,
          });
        } catch (error) {
          console.error("Error updating project state:", error.message);
          toast({
            title: "Error",
            description: "Failed to update the project state. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        } finally {
          setToggleLoading(false);
        }
      };

      const handleDeleteProject = async () => {
        try {
          const response = await fetch(`/api/projects/${project.id}`, {
            method: "DELETE",
          });
    
          if (!response.ok) {
            throw new Error("Failed to delete the project.");
          }
    
          const data = await response.json();
          console.log(data.message);
    
          refetchProjects(); // Refresh project list after deletion
        } catch (err) {
          console.error("Error deleting project:", err.message);
          alert("Failed to delete the project. Please try again.");
        }
      };

  const handleLinkSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/scrape-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id, // Include the project ID
          link,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to scrape the conversation.");
      }

      const data = await response.json();

      // Show success toast
      toast({
        title: "Success!",
        description: "Conversation scraped and activity logged successfully.",
        duration: 3000, // 3 seconds
      });

      // Clear the link input
      setLink("");
    } catch (error) {
      console.error("Error scraping conversation:", error.message);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to scrape the conversation. Please try again.",
        variant: "destructive",
        duration: 3000, // 3 seconds
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Card */}
      <Card className={cardClasses}>
        <div className="flex justify-between top-2 left-2">
            <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleProject(project)}
            className={`p-2 ${
                isActive
                ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                : "bg-green-100 text-white hover:bg-green-300"
            }`}
            >
            {isActive ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            </Button>
            <Button
                size="sm"
                variant="ghost"
                className="ml-2 text-blue-500"
                onClick={() => router.push(`/projects/${project.id}`)}
            >
                View Details
            </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
            <CardHeader>
                <CardTitle>
                    {project.project_name}
                </CardTitle>
                <CardDescription>
                    <p>{project.summary}</p>
                </CardDescription>
              </CardHeader>
              <CardContent> 
                <div className="p-2 border rounded-md text-sm text-gray-600">
                    <p>
                        <strong>Last Activity Date:</strong> {activityDate}
                    </p>
                    <p>
                        <strong>Last Activity:</strong> {truncatedActivity}
                    </p>
                </div>
              </CardContent>
            </div>
          </DialogTrigger>

          {/* Dialog */}
          <DialogContent>
            <DialogHeader className="flex items-center gap-2">
                {/* Editable Title */}
                {editMode ? (
                <div className="flex items-center gap-2 w-full">
                    <input
                    type="text"
                    value={updatedTitle}
                    onChange={(e) => setUpdatedTitle(e.target.value)}
                    className="p-2 border rounded-md w-full"
                    />
                    <Button onClick={handleUpdateTitle}>
                    <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setEditMode(false)}>
                    <X className="w-4 h-4" />
                    </Button>
                </div>
                ) : (
                <div className="flex items-center gap-2">
                    <DialogTitle>{project.project_name}</DialogTitle>
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditMode(true)}
                    >
                    <Edit className="w-4 h-4" />
                    </Button>
                </div>
                )}
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>Summary:</strong> {project.summary}
              </p>
              <div className="space-y-2">
                <label htmlFor="conversation-link" className="block text-sm">
                  OpenAI Conversation Link:
                </label>
                <Input
                  id="conversation-link"
                  placeholder="Paste the public conversation link here..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
            {links.length > 0 ? (
              links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between border-b py-1"
                >
                  <div className="flex-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      {link.url}
                    </a>
                    {link.description && (
                      <p className="text-sm text-gray-500">{link.description}</p>
                    )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No links added yet.</p>
            )}
          </div>

          {/* Add New Link */}
          <div className="flex items-center gap-2 mt-4">
            <Input
              placeholder="URL"
              value={newLink.url}
              onChange={(e) =>
                setNewLink({ ...newLink, url: e.target.value })
              }
              className="w-1/2"
            />
            <Input
              placeholder="Description (optional)"
              value={newLink.description}
              onChange={(e) =>
                setNewLink({ ...newLink, description: e.target.value })
              }
              className="w-1/2"
            />
            <Button onClick={handleAddLink} className="bg-blue-500 text-white">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
            <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.activities && project.activities.length > 0 ? (
                project.activities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(activity.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {activity.activity_summary.length > 40
                        ? `${activity.activity_summary.substring(0, 40)}...`
                        : activity.activity_summary}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="2">No activities logged yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
            <DialogFooter>
              <Button
                onClick={handleToggleInProgress}
                disabled={loading}
                className="mr-auto"
              >
                {loading ? "Updating..." : inProgress ? <Pause /> : <Play />}
              </Button>
              {!confirmDelete ? (
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={() => setConfirmDelete(true)} // Show confirmation buttons
                >
                    <Trash className="w-4 h-4" />
                </Button>
                ) : (
                <div className="flex items-center gap-2">
                    <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteProject}
                    className="bg-red-500 text-white hover:bg-red-600"
                    >
                    Confirm
                    </Button>
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelete(false)} // Cancel delete confirmation
                    className="text-muted-foreground"
                    >
                    Cancel
                    </Button>
                </div>
              )}
              <Button
                onClick={handleLinkSubmit}
                disabled={loading || !link}
                className={loading ? "opacity-75" : ""}
              >
                {loading ? "Submitting..." : "Submit Link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
}
