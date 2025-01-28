import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Stopwatch({ activeProject, onStop }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // Time in seconds
  const [intervalId, setIntervalId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog state
  const [summary, setSummary] = useState(""); // Summary input

  // Start the stopwatch
  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      const id = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000); // Increment every second
      setIntervalId(id);
    }
  };

  // Pause the stopwatch
  const handlePause = () => {
    if (isRunning) {
      clearInterval(intervalId);
      setIsRunning(false);
    }
  };

  // Stop the stopwatch and open the summary dialog
  const handleStop = () => {
    clearInterval(intervalId);
    setIsRunning(false);
    setIsDialogOpen(true); // Open the dialog
  };

  // Handle submitting the summary
  const handleSubmitSummary = () => {
    if (!summary.trim()) {
      alert("Summary cannot be empty.");
      return;
    }

    // Call the parent-provided `onStop` with elapsed time and summary
    if (onStop) {
      onStop(elapsedTime, summary); // Pass elapsed time and summary to the parent
    }

    // Reset stopwatch state
    setElapsedTime(0); // Reset the timer
    setSummary(""); // Reset the summary input
    setIsDialogOpen(false); // Close the dialog
  };

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      clearInterval(intervalId);
    };
  }, [intervalId]);

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-bold">Stopwatch</h2>
      <p className="text-sm">
        Active Project: {activeProject ? activeProject.project_name : "None"}
      </p>
      <div className="text-2xl font-mono mt-2">
        {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={!activeProject || isRunning}
        >
          Start
        </button>
        <button
          onClick={handlePause}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
          disabled={!isRunning}
        >
          Pause
        </button>
        <button
          onClick={handleStop}
          className="px-4 py-2 bg-red-500 text-white rounded"
          disabled={!activeProject}
        >
          Stop
        </button>
      </div>

      {/* Summary Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <h4 className="font-semibold text-lg">Log Activity Summary</h4>
          <Input
            placeholder="What did you work on?"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="mt-4"
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitSummary}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
