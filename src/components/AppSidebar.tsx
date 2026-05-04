import { LayoutDashboard, ScanBarcode, Package, Receipt, Store, Users, LogOut } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarFooter, useSidebar,
} from "./ui/sidebar";
import { usePos, useCurrentUser } from "@/store/pos";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useEffect } from "react";

const adminItems = [
  { title: "Point of Sale", url: "/pos", icon: ScanBarcode },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Sales", url: "/sales", icon: Receipt },
  { title: "Staff & Counters", url: "/staff", icon: Users },
];

const cashierItems = [
  { title: "Point of Sale", url: "/pos", icon: ScanBarcode },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const logout = usePos((s) => s.logout);

  // 👇 Force open on first load
  useEffect(() => {
    setOpen(true);
  }, []);

  const items = currentUser?.role === "admin" ? adminItems : cashierItems;

  const handleSwitch = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="none" className="border-r border-border bg-card h-screen" variant="sidebar" >
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">Northwind POS</span>
              <span className="text-xs text-muted-foreground">Retail terminal</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        {!collapsed && currentUser && (
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">{currentUser.name}</span>
            <Badge variant="outline" className="text-[10px]">
              {currentUser.role}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleSwitch}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Switch / Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}