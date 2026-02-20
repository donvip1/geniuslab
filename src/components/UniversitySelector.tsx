import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface University {
  id: string;
  name: string;
  abbreviation: string | null;
  type: string;
  state: string | null;
}

interface UniversitySelectorProps {
  value: string | null;
  onChange: (universityId: string, universityName: string) => void;
}

export const UniversitySelector = ({ value, onChange }: UniversitySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    const { data } = await supabase
      .from("nigerian_universities")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setUniversities(data || []);
    setLoading(false);
  };

  const grouped = universities.reduce<Record<string, University[]>>((acc, uni) => {
    const key = uni.type.charAt(0).toUpperCase() + uni.type.slice(1);
    if (!acc[key]) acc[key] = [];
    acc[key].push(uni);
    return acc;
  }, {});

  const typeOrder = ["Federal", "State", "Polytechnic", "College"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-[2.5rem] text-left">
          {selectedName ? (
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{selectedName}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select your university...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search university..." />
          <CommandList>
            <CommandEmpty>{loading ? "Loading..." : "No university found."}</CommandEmpty>
            {typeOrder.map((type) =>
              grouped[type] ? (
                <CommandGroup key={type} heading={`${type} Universities`}>
                  {grouped[type].map((uni) => (
                    <CommandItem
                      key={uni.id}
                      value={`${uni.name} ${uni.abbreviation || ""}`}
                      onSelect={() => {
                        onChange(uni.id, uni.name);
                        setSelectedName(`${uni.abbreviation ? uni.abbreviation + " — " : ""}${uni.name}`);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === uni.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span className="text-sm">{uni.abbreviation ? `${uni.abbreviation} — ` : ""}{uni.name}</span>
                        {uni.state && <span className="text-xs text-muted-foreground">{uni.state}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
