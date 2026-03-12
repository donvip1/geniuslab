import gecLogo from "@/assets/gec-logo-transparent.png";

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary">
      <img src={gecLogo} alt="GeniusLab CBT" className="h-24 w-auto mb-6 animate-pulse" />
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <p className="text-primary-foreground/80 text-sm mt-4 font-medium">Loading GeniusLab CBT...</p>
    </div>
  );
};
