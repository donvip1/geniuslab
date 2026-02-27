import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User } from "lucide-react";
import gecLogo from "@/assets/gec-logo-new.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

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
                  to="/auth"
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

          {/* Mobile: Login/Logout button */}
          {session ? (
            <Button variant="outline" size="sm" className="md:hidden" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          ) : (
            <Link to="/auth" className="md:hidden">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
