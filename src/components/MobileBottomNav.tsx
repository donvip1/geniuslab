import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Briefcase, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mainTabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/exam", label: "Exams", icon: BookOpen },
  { to: "/payment", label: "Activate", icon: CreditCard },
  { to: "/services", label: "Services", icon: Briefcase },
  { to: "/profile", label: "Profile", icon: User },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t shadow-[0_-1px_12px_hsl(var(--foreground)/0.06)]">
      <div className="flex items-center justify-around h-16 px-1">
        {mainTabs.map((tab) => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors relative",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium", active && "font-bold")}>
                {tab.label}
              </span>
              {active && (
                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
