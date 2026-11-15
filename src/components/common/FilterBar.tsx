import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCourseOptions, getProfessorOptions, getYearOptions } from "@/lib/api";
import { TIP_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FilterKey = "course" | "professor" | "type" | "year";
export type FilterValues = Partial<Record<FilterKey | "search", string | undefined>>;

const ALL = "__all";

interface FilterBarProps {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  fields: FilterKey[];
  showSearch?: boolean | undefined;
  searchPlaceholder?: string | undefined;
  className?: string | undefined;
}

export function FilterBar({
  value,
  onChange,
  fields,
  showSearch,
  searchPlaceholder = "Search tips…",
  className,
}: FilterBarProps) {
  const options: Record<FilterKey, { label: string; items: string[] }> = {
    course: { label: "Course", items: getCourseOptions() },
    professor: { label: "Professor", items: getProfessorOptions(value.course) },
    type: { label: "Tip type", items: [...TIP_TYPES] },
    year: { label: "Year", items: getYearOptions() },
  };

  const set = (key: FilterKey, v: string) => {
    const next = { ...value, [key]: v === ALL ? undefined : v };
    if (key === "course") next.professor = undefined;
    onChange(next);
  };

  const active = fields.some((f) => value[f]) || Boolean(value.search);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label="Search tips"
            placeholder={searchPlaceholder}
            value={value.search ?? ""}
            onChange={(e) => onChange({ ...value, search: e.target.value || undefined })}
            className="h-11 pl-10"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        {fields.map((key) => (
          <Select key={key} value={value[key] ?? ALL} onValueChange={(v) => set(key, v)}>
            <SelectTrigger aria-label={`Filter by ${options[key].label.toLowerCase()}`} className="sm:w-48">
              <SelectValue placeholder={options[key].label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All {options[key].label.toLowerCase()}s</SelectItem>
              {options[key].items.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="col-span-2 justify-self-start"
            onClick={() => onChange({})}
          >
            <X aria-hidden /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
