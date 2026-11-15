import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCourseOptions } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CourseComboboxProps {
  id?: string | undefined;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean | undefined;
  describedBy?: string | undefined;
}

export function CourseCombobox({ id, value, onChange, invalid, describedBy }: CourseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const options: string[] = getCourseOptions();
  const exact = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full justify-between bg-card font-normal",
            !value && "text-muted-foreground",
            invalid && "border-destructive",
          )}
        >
          {value || "Search for a course…"}
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) rounded-xl p-0" align="start">
        <Command>
          <CommandInput placeholder="Type a course name…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty className="p-1">
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => pick(query.trim())}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <Plus className="size-4" aria-hidden /> Use “{query.trim()}”
                </button>
              ) : (
                <span className="block py-4 text-center text-sm text-muted-foreground">No courses found.</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o} value={o} onSelect={() => pick(o)}>
                  <Check className={cn("size-4", value === o ? "opacity-100" : "opacity-0")} aria-hidden />
                  {o}
                </CommandItem>
              ))}
              {query.trim() && !exact && (
                <CommandItem value={`__custom ${query}`} onSelect={() => pick(query.trim())}>
                  <Plus className="size-4" aria-hidden /> Use “{query.trim()}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
