import { useState } from "react";
import { BookOpen, Briefcase, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CourseCombobox } from "@/components/common/CourseCombobox";
import { getProfessorOptions, submitTip } from "@/lib/api";
import {
  COURSE_CODE_MAP,
  MAX_TIP_LENGTH,
  MIN_TIP_LENGTH,
  type Tip,
  type TipCategory,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const BATCH_OPTIONS = [
  "2026 batch",
  "2025 batch",
  "2024 batch",
  "2023 batch",
  "2022 batch",
  "2021 batch",
];

export const KNOWN_COMPANIES = [
  "Amazon",
  "Google",
  "Microsoft",
  "TCS",
  "Infosys",
  "Adobe",
  "Atlassian",
  "Uber",
  "Goldman Sachs",
  "Oracle",
];

const CATEGORY_ITEMS: {
  id: TipCategory;
  label: string;
  icon: typeof BookOpen;
  description: string;
}[] = [
  {
    id: "course",
    label: "Course",
    icon: BookOpen,
    description: "Syllabus, exams & labs",
  },
  {
    id: "professor",
    label: "Professor",
    icon: GraduationCap,
    description: "Teaching style & grading",
  },
  {
    id: "company",
    label: "Company",
    icon: Briefcase,
    description: "Placements & interviews",
  },
  {
    id: "general",
    label: "General",
    icon: Sparkles,
    description: "Campus advice",
  },
];

function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

function CharCounter({ length }: { length: number }) {
  const tooShort = length < MIN_TIP_LENGTH;
  return (
    <span className={cn("text-xs tabular-nums", tooShort ? "text-muted-foreground" : "text-success")}>
      {length}/{MAX_TIP_LENGTH}
      {tooShort && ` · ${MIN_TIP_LENGTH - length} more needed`}
    </span>
  );
}

interface TipFormProps {
  initialTopic?: string | undefined;
  onSuccess: (tip: Tip) => void;
  className?: string | undefined;
}

export function TipForm({ initialTopic = "", onSuccess, className }: TipFormProps) {
  const isInitialCompany = KNOWN_COMPANIES.some((c) => c.toLowerCase() === initialTopic.toLowerCase());
  const [category, setCategory] = useState<TipCategory>(isInitialCompany ? "company" : "course");

  // Contextual inputs
  const [course, setCourse] = useState(isInitialCompany ? "" : initialTopic);
  const [courseCode, setCourseCode] = useState(
    !isInitialCompany && initialTopic ? COURSE_CODE_MAP[initialTopic] ?? "" : "",
  );
  const [professor, setProfessor] = useState("");
  const [company, setCompany] = useState(isInitialCompany ? initialTopic : "");

  // Metadata & anonymity
  const [authorBatch, setAuthorBatch] = useState("2023 batch");
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [showBadge, setShowBadge] = useState(false);

  const [errors, setErrors] = useState<{
    course?: string | undefined;
    professor?: string | undefined;
    company?: string | undefined;
    text?: string | undefined;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleCategoryChange = (nextCategory: TipCategory) => {
    setCategory(nextCategory);
    setErrors({});
  };

  const handleCourseChange = (selectedCourse: string) => {
    setCourse(selectedCourse);
    if (selectedCourse in COURSE_CODE_MAP) {
      setCourseCode(COURSE_CODE_MAP[selectedCourse] ?? "");
    }
    setErrors((prev) => ({ ...prev, course: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};

    if (category === "course" && !course.trim()) {
      next.course = "Please choose or enter a course name.";
    }
    if (category === "professor" && !professor.trim()) {
      next.professor = "Please enter the professor's name.";
    }
    if (category === "company" && !company.trim()) {
      next.company = "Please enter the company name.";
    }

    const len = text.trim().length;
    if (len < MIN_TIP_LENGTH) {
      next.text = `Your tip needs at least ${MIN_TIP_LENGTH} characters (currently ${len}).`;
    }
    if (len > MAX_TIP_LENGTH) {
      next.text = `Please keep it under ${MAX_TIP_LENGTH} characters.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      const createdTip = await submitTip({
        category,
        course: category === "course" || category === "professor" ? course : undefined,
        course_name: category === "course" || category === "professor" ? course : undefined,
        course_code:
          category === "course" || category === "professor"
            ? courseCode.trim() || (course ? COURSE_CODE_MAP[course] ?? course : undefined)
            : undefined,
        professor: category === "professor" || category === "course" ? professor.trim() || undefined : undefined,
        company: category === "company" ? company.trim() || undefined : undefined,
        author_batch: authorBatch,
        text,
        anonymous,
        showBadge: !anonymous && showBadge,
      });

      toast.success("Tip submitted successfully!", {
        description: "Your advice will start helping juniors right away.",
      });
      onSuccess(createdTip);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't share your tip");
    } finally {
      setSubmitting(false);
    }
  };

  const professors = getProfessorOptions(course);

  const getTextPlaceholder = () => {
    switch (category) {
      case "course":
        return "What would you tell a junior about this course? Key exam chapters, lab vivas, attendance, which resources actually worked…";
      case "professor":
        return "How is their teaching style, grading fairness, quiz frequency, or viva questions? Keep it constructive…";
      case "company":
        return "Describe the interview rounds, coding test difficulty, questions asked, or resume prep that helped you crack the offer…";
      case "general":
      default:
        return "What do you wish you had known earlier in college? Campus hacks, clubs, study routines, productivity…";
    }
  };

  return (
    <form onSubmit={submit} noValidate className={cn("space-y-6 rounded-3xl border bg-card p-5 shadow-soft sm:p-7", className)}>
      {/* 1. Category Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-foreground">
          Category <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CATEGORY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCategoryChange(item.id)}
                className={cn(
                  "group flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm"
                    : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/60 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("size-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-bold", isSelected ? "text-foreground" : "text-foreground/80")}>
                    {item.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-tight opacity-75">{item.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Contextual Fields based on Category */}
      <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
        {category === "course" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="course">
                  Course Name <span className="text-destructive">*</span>
                </Label>
                <CourseCombobox
                  id="course"
                  value={course}
                  onChange={handleCourseChange}
                  invalid={Boolean(errors.course)}
                  describedBy={errors.course ? "course-error" : undefined}
                />
                <FieldError id="course-error" message={errors.course} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="course-code">
                  Course Code <span className="font-normal text-muted-foreground">(e.g. OS, DBMS, CS301)</span>
                </Label>
                <Input
                  id="course-code"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. OS"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="professor">
                Professor <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="professor"
                list="professor-options"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="e.g. Prof. Meera Iyer"
              />
              <datalist id="professor-options">
                {professors.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        {category === "professor" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="professor-name">
                Professor Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="professor-name"
                list="professor-options"
                value={professor}
                onChange={(e) => {
                  setProfessor(e.target.value);
                  setErrors((x) => ({ ...x, professor: undefined }));
                }}
                placeholder="e.g. Prof. Meera Iyer"
                aria-invalid={Boolean(errors.professor) || undefined}
              />
              <datalist id="professor-options">
                {professors.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <FieldError id="prof-error" message={errors.professor} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prof-course">
                  Course Taught <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <CourseCombobox id="prof-course" value={course} onChange={handleCourseChange} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-course-code">
                  Course Code <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="prof-course-code"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. OS"
                />
              </div>
            </div>
          </div>
        )}

        {category === "company" && (
          <div className="space-y-1.5">
            <Label htmlFor="company-name">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              list="company-options"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setErrors((x) => ({ ...x, company: undefined }));
              }}
              placeholder="e.g. Amazon, Google, Microsoft, TCS..."
              aria-invalid={Boolean(errors.company) || undefined}
            />
            <datalist id="company-options">
              {KNOWN_COMPANIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <FieldError id="company-error" message={errors.company} />
          </div>
        )}

        {category === "general" && (
          <div className="text-sm text-muted-foreground">
            <p>Share advice on general campus life, study routines, internships, or college hacks.</p>
          </div>
        )}
      </div>

      {/* 3. Batch Selector */}
      <div className="space-y-1.5">
        <Label htmlFor="author-batch">Your Batch</Label>
        <Select value={authorBatch} onValueChange={setAuthorBatch}>
          <SelectTrigger id="author-batch" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BATCH_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Tip Text Area */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="tip-text">
            Your Tip <span className="text-destructive">*</span>
          </Label>
          <CharCounter length={text.trim().length} />
        </div>
        <Textarea
          id="tip-text"
          rows={5}
          value={text}
          maxLength={MAX_TIP_LENGTH}
          onChange={(e) => {
            setText(e.target.value);
            if (errors.text && e.target.value.trim().length >= MIN_TIP_LENGTH)
              setErrors((x) => ({ ...x, text: undefined }));
          }}
          onBlur={() => text && validate()}
          aria-invalid={Boolean(errors.text) || undefined}
          aria-describedby={errors.text ? "text-error" : "text-hint"}
          className={cn("text-base leading-relaxed", errors.text && "border-destructive")}
          placeholder={getTextPlaceholder()}
        />
        <p id="text-hint" className="text-xs text-muted-foreground">
          At least {MIN_TIP_LENGTH} characters. Embeddings will be computed from this tip and category fields.
        </p>
        <FieldError id="text-error" message={errors.text} />
      </div>

      {/* 5. Anonymity and Badge Options */}
      <div className="space-y-3 rounded-2xl border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="anon"
            className="mt-0.5"
            checked={anonymous}
            onCheckedChange={(v) => {
              const isAnon = v === true;
              setAnonymous(isAnon);
              if (isAnon) setShowBadge(false);
            }}
          />
          <div>
            <Label htmlFor="anon" className="cursor-pointer font-semibold text-foreground">
              Post anonymously
            </Label>
            <p className="text-xs text-muted-foreground">
              {anonymous
                ? `Juniors will only see “Anonymous (${authorBatch})”. Your name and profile remain completely private.`
                : "Your name or verified senior profile will be displayed alongside this tip."}
            </p>
          </div>
        </div>

        {!anonymous && (
          <div className="ml-7 flex items-center gap-3 border-t border-border/50 pt-2.5">
            <Checkbox id="badge" checked={showBadge} onCheckedChange={(v) => setShowBadge(v === true)} />
            <Label htmlFor="badge" className="cursor-pointer text-xs text-foreground/90">
              Display verified student badge (Class of {authorBatch.replace(/\D/g, "")})
            </Label>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting && <Loader2 className="animate-spin" aria-hidden />}
        {submitting ? "Submitting tip…" : "Share tip"}
      </Button>
    </form>
  );
}
