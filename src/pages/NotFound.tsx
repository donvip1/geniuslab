import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted pb-20 lg:pb-0 px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
