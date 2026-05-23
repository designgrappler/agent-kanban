import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { Header } from "../components/Header";
import { DaemonConnectionSection } from "../components/settings/DaemonConnectionSection";
import { LabelsSection } from "../components/settings/LabelsSection";
import { ProfileSettingsSection } from "../components/settings/ProfileSettingsSection";
import { cn } from "../lib/utils";
import { AccountPage } from "./AccountPage";

const settingsLinks = [
  { to: "/settings/profile", label: "Profile" },
  { to: "/settings/account", label: "Account" },
  { to: "/settings/labels", label: "Labels" },
  { to: "/settings/daemon-connection", label: "Daemon connection" },
];

export function SettingsPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 md:flex-row md:px-8">
        <aside className="w-full shrink-0 md:w-48">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-content-tertiary">Settings</h2>
          <nav aria-label="Settings" className="space-y-1">
            {settingsLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-accent-soft text-accent" : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <Routes>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileSettingsSection />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="labels" element={<LabelsSection />} />
          <Route path="daemon-connection" element={<DaemonConnectionSection />} />
          <Route path="*" element={<Navigate to="profile" replace />} />
        </Routes>
      </div>
    </div>
  );
}
