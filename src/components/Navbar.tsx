import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import gecLogo from "@/assets/gec-logo-new.png";

export const Navbar = () => {
  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
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
              <Link
                key={link.to}
                to={link.to}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/auth">
              <Button variant="default" className="ml-4">
                Login
              </Button>
            </Link>
          </div>

          {/* Mobile: Login button only (nav is in bottom bar) */}
          <Link to="/auth" className="md:hidden">
            <Button variant="default" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
