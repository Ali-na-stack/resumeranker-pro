import { LayoutDashboard, Users, Star, Eye, EyeOff } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="font-display text-xs font-bold tracking-wider uppercase text-sidebar-primary">
                CV Ranker
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
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
        <SidebarFooter className="p-4">
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
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
