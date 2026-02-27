import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Briefcase, Phone, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mainTabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/exam", label: "Exams", icon: BookOpen },
  { to: "/services", label: "Services", icon: Briefcase },
  { to: "/contact", label: "Contact", icon: Phone },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const moreLinks = [
    { to: "/about", label: "About Us" },
    { to: "/payment", label: "Pricing" },
    ...(session
      ? [{ to: "/auth", label: "My Profile" }]
      : [{ to: "/auth", label: "Login / Sign Up" }]),
    { to: "/jamb-exam", label: "JAMB Exam" },
    { to: "/jamb-study", label: "Study Materials" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t shadow-[0_-2px_10px_hsl(var(--foreground)/0.08)]">
      <div className="flex items-center justify-around h-16 px-1">
        {mainTabs.map((tab) => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors",
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

        {/* More menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {moreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.to)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
