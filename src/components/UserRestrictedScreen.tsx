import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Home, Mail, Pause, AlertTriangle, Ban } from "lucide-react";

interface UserRestrictedScreenProps {
  restrictionType: "paused" | "suspended" | "banned";
  reason?: string | null;
  expiresAt?: string | null;
}

export const UserRestrictedScreen = ({ restrictionType, reason, expiresAt }: UserRestrictedScreenProps) => {
  const navigate = useNavigate();

  const getRestrictionDetails = () => {
    switch (restrictionType) {
      case "paused":
        return {
          icon: <Pause className="h-8 w-8 text-yellow-500" />,
          title: "Account Paused",
          description: "Your account has been temporarily paused",
          bgColor: "bg-yellow-500/10",
        };
      case "suspended":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
          title: "Account Suspended",
          description: "Your account has been suspended",
          bgColor: "bg-orange-500/10",
        };
      case "banned":
        return {
          icon: <Ban className="h-8 w-8 text-destructive" />,
          title: "Account Banned",
          description: "Your account has been permanently banned",
          bgColor: "bg-destructive/10",
        };
      default:
        return {
          icon: <UserX className="h-8 w-8 text-muted-foreground" />,
          title: "Access Restricted",
          description: "Your access has been restricted",
          bgColor: "bg-muted",
        };
    }
  };

  const details = getRestrictionDetails();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${details.bgColor} flex items-center justify-center`}>
            {details.icon}
          </div>
          <CardTitle className="text-2xl">{details.title}</CardTitle>
          <CardDescription>{details.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reason && (
            <div className="bg-muted p-4 rounded-lg text-left">
              <p className="text-sm font-medium mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}

          {expiresAt && (
            <div className="text-sm text-muted-foreground">
              <p>Access will be restored on:</p>
              <p className="font-semibold text-foreground">{formatDate(expiresAt)}</p>
            </div>
          )}

          {restrictionType === "banned" && (
            <p className="text-sm text-muted-foreground">
              This restriction is permanent. If you believe this is an error, please contact support.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button 
              onClick={() => window.location.href = "mailto:support@geniuslabz.xyz"} 
              variant="ghost"
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
