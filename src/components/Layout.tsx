import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import OfflineIndicator from "./OfflineIndicator";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end px-6 py-2 border-b border-border bg-card">
          <OfflineIndicator />
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
