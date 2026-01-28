import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Home, AlertTriangle } from "lucide-react";

interface ExamLockedScreenProps {
  message?: string | null;
}

export const ExamLockedScreen = ({ message }: ExamLockedScreenProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Exams Currently Unavailable</CardTitle>
          <CardDescription>
            The exam section has been temporarily locked by an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div className="bg-muted p-4 rounded-lg text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{message}</p>
              </div>
            </div>
          )}
          
          <p className="text-muted-foreground text-sm">
            Please check back later or contact your administrator for more information.
          </p>

          <Button onClick={() => navigate("/")} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
