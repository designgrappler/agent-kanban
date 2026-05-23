// AccountSettingsPage redirects to the consolidated SettingsPage.
// All settings content (Profile, Account, Labels, Daemon connection) lives in SettingsPage.tsx.
import { Navigate } from "react-router-dom";

export function AccountSettingsPage() {
  return <Navigate to="/settings/profile" replace />;
}
