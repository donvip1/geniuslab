import { Input } from "@/components/ui/input";
import { useState, forwardRef } from "react";
import { sanitizeHTML, escapeHTML, detectSuspiciousInput } from "@/lib/security";
import { AlertTriangle } from "lucide-react";

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
  detectXSS?: boolean;
  onSanitizedChange?: (value: string) => void;
}

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ sanitize = true, detectXSS = true, onSanitizedChange, onChange, ...props }, ref) => {
    const [warning, setWarning] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Detect suspicious patterns
      if (detectXSS && detectSuspiciousInput(value)) {
        setWarning("Potentially unsafe input detected");
        // Still allow the change but warn the user
      } else {
        setWarning("");
      }

      // Sanitize if enabled
      if (sanitize) {
        value = sanitizeHTML(value);
      }

      // Call the sanitized change handler if provided
      if (onSanitizedChange) {
        onSanitizedChange(value);
      }

      // Call original onChange
      if (onChange) {
        // Create a new event with sanitized value
        const sanitizedEvent = {
          ...e,
          target: { ...e.target, value },
        };
        onChange(sanitizedEvent as any);
      }
    };

    return (
      <div className="space-y-1">
        <Input ref={ref} {...props} onChange={handleChange} />
        {warning && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span>{warning}</span>
          </div>
        )}
      </div>
    );
  }
);

SecureInput.displayName = "SecureInput";
