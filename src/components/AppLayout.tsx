import { SidebarProvider, SidebarTrigger,SidebarInset  } from "../components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navigate, Outlet } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { useCurrentUser, useCurrentCounter } from "@/store/pos";

export default function AppLayout() {
  const currentUser = useCurrentUser();
  const currentCounter = useCurrentCounter();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
       <SidebarInset>
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {currentCounter?.name} · {currentUser?.name} ({currentUser?.role})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Online
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      </SidebarInset>
    </SidebarProvider>
  );
}