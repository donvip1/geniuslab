import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Menu, LogIn, BookOpen, Info, Phone } from "lucide-react";
import gecLogo from "@/assets/gec-logo-new.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    { to: "/payment", label: "Activate" },
    { to: "/exam", label: "Take Exam" },
    { to: "/contact", label: "Contact" },
  ];

  const mobileMoreLinks = [
    { to: "/about", label: "About Us", icon: Info },
    { to: "/contact", label: "Contact", icon: Phone },
    { to: "/jamb-study", label: "Study Materials", icon: BookOpen },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <img src={gecLogo} alt="GeniusLab Educational Consult" className="h-20 md:h-28 w-auto" />
            <span className="hidden sm:inline">GeniusLab</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-foreground/80 hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
            {session ? (
              <div className="flex items-center gap-3 ml-4">
                <Link
                  to="/profile"
                  className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Profile</span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="default" className="ml-4">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile: More menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {mobileMoreLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    <link.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
                <div className="border-t my-2" />
                {session ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="font-medium">Login / Sign Up</span>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
