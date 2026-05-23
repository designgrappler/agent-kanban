// MachinesPage redirects to the Daemon connection tab in Settings.
// The daemon connection UI (Add Machine, machine list) lives in DaemonConnectionSection.tsx.
import { Navigate } from "react-router-dom";

export function MachinesPage() {
  return <Navigate to="/settings/daemon-connection" replace />;
}
