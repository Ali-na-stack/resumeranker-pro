import { LayoutDashboard, Users, GitCompare, Moon, Sun, Eye, EyeOff } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Candidates", url: "/candidates", icon: Users },
  { title: "Compare", url: "/compare", icon: GitCompare },
];

interface AppSidebarProps {
  biasReduction: boolean;
  onBiasReductionChange: (value: boolean) => void;
}

export function AppSidebar({ biasReduction, onBiasReductionChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {/* Brand */}
          <div className={`px-4 pt-5 pb-4 ${collapsed ? "flex justify-center" : ""}`}>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-primary/90 flex items-center justify-center shrink-0">
                <span className="text-primary-foreground text-[10px] font-bold font-display">CV</span>
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-sm font-display font-semibold text-sidebar-foreground tracking-tight leading-none">CV Ranker</h1>
                  <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">Smart Hiring</p>
                </div>
              )}
            </div>
          </div>

          <SidebarSeparator className="opacity-20 mx-3" />

          <SidebarGroupContent className="mt-3 px-2">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors duration-150"
                      activeClassName="!bg-sidebar-accent !text-sidebar-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="px-4 pb-5 space-y-3">
          <SidebarSeparator className="opacity-20" />

          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              {biasReduction ? (
                <EyeOff className="h-3.5 w-3.5 text-sidebar-foreground/45" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-sidebar-foreground/45" />
              )}
              <Label htmlFor="bias-mode" className="text-[11px] text-sidebar-foreground/55 cursor-pointer">
                Bias Reduction
              </Label>
            </div>
            <Switch
              id="bias-mode"
              checked={biasReduction}
              onCheckedChange={onBiasReductionChange}
              className="scale-75 origin-right"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/55 hover:text-sidebar-foreground h-8 text-xs"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
