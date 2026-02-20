import { Button } from "@/components/ui/button";

interface SemesterToggleProps {
  value: "first" | "second";
  onChange: (semester: "first" | "second") => void;
}

export const SemesterToggle = ({ value, onChange }: SemesterToggleProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={value === "first" ? "default" : "outline"}
        onClick={() => onChange("first")}
        size="sm"
      >
        1st Semester
      </Button>
      <Button
        variant={value === "second" ? "default" : "outline"}
        onClick={() => onChange("second")}
        size="sm"
      >
        2nd Semester
      </Button>
    </div>
  );
};
