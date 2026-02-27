import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface YearSelectorProps {
  value: string | null;
  onChange: (year: string | null) => void;
  label?: string;
}

const YEARS = Array.from({ length: 16 }, (_, i) => (2025 - i).toString());

export const YearSelector = ({ value, onChange, label = "Filter by Year" }: YearSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years (Random)</SelectItem>
          {YEARS.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
