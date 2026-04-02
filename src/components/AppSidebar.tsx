import { LayoutDashboard, Users, Star, Eye, EyeOff, Sun, Moon } from "lucide-react";
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Candidates", url: "/candidates", icon: Users },
  { title: "Shortlisted", url: "/shortlisted", icon: Star },
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
          <SidebarGroupLabel>
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="relative rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-1.5 shadow-lg shadow-[hsl(var(--primary)/0.3)]">
                  <span className="text-[10px] font-display font-bold text-primary-foreground leading-none">CR</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-xs font-bold tracking-wider uppercase text-sidebar-foreground">
                    CV Ranker
                  </span>
                  <span className="text-[9px] text-sidebar-foreground/40 font-medium tracking-wide">
                    Smart Hiring
                  </span>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center">
                <div className="rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-1.5 shadow-lg shadow-[hsl(var(--primary)/0.3)]">
                  <span className="text-[10px] font-display font-bold text-primary-foreground leading-none">CR</span>
                </div>
              </div>
            )}
          </SidebarGroupLabel>
          {!collapsed && (
            <div className="px-3 pt-4 pb-1">
              <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/30">
                Navigation
              </span>
            </div>
          )}
          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-lg px-3 py-2 hover:bg-sidebar-accent/60 transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm border-l-2 border-l-[hsl(var(--sidebar-primary))]"
                    >
                      <item.icon className="mr-2.5 h-4 w-4" />
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
        <SidebarFooter className="p-4 space-y-3">
          <div className="rounded-lg bg-sidebar-accent/40 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : (
                  <Moon className="h-4 w-4 mr-2" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {biasReduction ? (
                <EyeOff className="h-4 w-4 text-sidebar-foreground/70" />
              ) : (
                <Eye className="h-4 w-4 text-sidebar-foreground/70" />
              )}
              <Label htmlFor="bias-mode" className="text-xs text-sidebar-foreground/70 cursor-pointer">
                Bias Reduction
              </Label>
              <Switch
                id="bias-mode"
                checked={biasReduction}
                onCheckedChange={onBiasReductionChange}
                className="ml-auto scale-75"
              />
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
