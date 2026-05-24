import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

interface Machine {
  id: string;
  name: string;
  status: string;
}

interface DaemonHandoffModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  machines: Machine[];
}

export function DaemonHandoffModal({ open, onClose, boardId, machines }: DaemonHandoffModalProps) {
  const navigate = useNavigate();
  const hasMachine = machines.length > 0;
  const command = `ak start --board ${boardId}`;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleOpenSettings() {
    onClose();
    navigate("/settings/daemon-connection");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{hasMachine ? "Start the daemon to begin working" : "No machine registered"}</DialogTitle>
          <DialogDescription className="sr-only">
            {hasMachine ? "Copy the command to start the daemon for this board" : "Register a machine to run agents"}
          </DialogDescription>
        </DialogHeader>

        {hasMachine ? (
          <div className="space-y-3">
            <p className="text-sm text-content-secondary">Run this in your terminal to start auto-claiming tasks for this board.</p>
            <div className="flex items-center gap-2 rounded-lg bg-surface-primary border border-border px-4 py-3">
              <code className="flex-1 font-mono text-sm text-content-primary select-all">{command}</code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-xs font-medium text-accent hover:opacity-80 transition-opacity"
                aria-label="Copy command to clipboard"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-content-secondary">
              You need a registered machine to run agents on this board. Register a machine in Settings → Daemon connection, then come back to start
              the daemon.
            </p>
          </div>
        )}

        <DialogFooter>
          {hasMachine ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Later
              </Button>
              <Button onClick={handleOpenSettings}>Open Daemon connection settings</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
