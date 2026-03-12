import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Eye, EyeOff } from "lucide-react";
import gecLogo from "@/assets/gec-logo-transparent.png";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be less than 72 characters");
const usernameSchema = z.string().trim().min(1, "Username is required").max(50, "Username must be less than 50 characters");
const fullNameSchema = z.string().trim().min(1, "Full name is required").max(100, "Full name must be less than 100 characters");

const loginSchema = z.object({
  email: emailSchema.optional(),
  password: passwordSchema,
  username: usernameSchema.optional(),
});

const signupSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "", username: "" });
  const [signupData, setSignupData] = useState({ 
    fullName: "", 
    username: "",
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingSession, setExistingSession] = useState<{ email: string; displayName: string | null } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setExistingSession({ 
          email: session.user.email || "Unknown",
          displayName: profile?.username || profile?.full_name || null
        });
      }
      setCheckingSession(false);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setExistingSession(null);
    setLoading(false);
    toast({ title: "Logged out", description: "You have been signed out successfully." });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a password reset link." });
      setShowForgotPassword(false);
      setForgotEmail("");
    }
    setForgotLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (isAdminLogin) {
        usernameSchema.parse(loginData.username);
        passwordSchema.parse(loginData.password);
      } else {
        emailSchema.parse(loginData.email);
        passwordSchema.parse(loginData.password);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);

    try {
      let authData;
      
      if (isAdminLogin) {
        const { data: adminData, error: adminError } = await supabase
          .from("admin_credentials")
          .select("user_id")
          .eq("username", loginData.username)
          .single();

        if (adminError || !adminData) throw new Error("Invalid admin credentials");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", adminData.user_id)
          .single();

        if (profileError || !profileData) throw new Error("Admin profile not found");

        const { data, error } = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password: loginData.password,
        });
        if (error) throw error;
        authData = data;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        });
        if (error) throw error;
        authData = data;
      }

      toast({ title: "Login successful!", description: "Welcome back to GeniusLab." });

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .single();

      if (roleData) {
        navigate("/admin");
      } else {
        navigate("/exam");
      }
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupData.fullName,
            username: signupData.username,
          },
        },
      });

      if (error) throw error;

      toast({ title: "Account created successfully!", description: "You can now login and start practicing." });
      setActiveTab("login");
      setSignupData({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message || "Could not create account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={gecLogo} alt="GeniusLab" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Already Logged In</CardTitle>
            <CardDescription>
              You are currently signed in as <span className="font-medium">{existingSession.displayName || existingSession.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/exam")} className="w-full">
              <GraduationCap className="mr-2 h-4 w-4" /> Go to Exams
            </Button>
            <Button variant="link" onClick={() => navigate("/")} className="w-full text-sm">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={gecLogo} alt="GeniusLab" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>
              <Button type="submit" className="w-full" disabled={forgotLoading}>
                {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Reset Link"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => setShowForgotPassword(false)} className="text-sm">Back to Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={gecLogo} alt="GeniusLab" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Welcome to GeniusLab</CardTitle>
          <CardDescription>Sign in to access your exams and track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input type="checkbox" id="admin-login" checked={isAdminLogin} onChange={(e) => setIsAdminLogin(e.target.checked)} className="rounded border-gray-300" />
                  <Label htmlFor="admin-login" className="cursor-pointer text-sm">Admin Login</Label>
                </div>

                {isAdminLogin ? (
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Admin Username</Label>
                    <Input id="login-username" type="text" placeholder="admin username" value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} required maxLength={50} />
                    {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email or Username</Label>
                    <Input id="login-email" type="text" placeholder="your@email.com or username" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} required={!isAdminLogin} maxLength={255} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} required maxLength={72} />
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {!isAdminLogin && (
                  <div className="text-right">
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" placeholder="John Doe" value={signupData.fullName} onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })} required maxLength={100} />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input id="signup-username" placeholder="johndoe123" value={signupData.username} onChange={(e) => setSignupData({ ...signupData, username: e.target.value })} required maxLength={50} />
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="your@email.com" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} required maxLength={255} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password (min 8 characters)</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="••••••••" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} required maxLength={72} />
                    <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input id="signup-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} required maxLength={72} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate("/")} className="text-sm">Back to Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
