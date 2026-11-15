import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { reportTip } from "@/lib/api";
import { REPORT_REASONS, type ReportReason } from "@/lib/types";

interface ReportDialogProps {
  tipId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ tipId, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason) {
      setError("Please pick a reason.");
      return;
    }
    setSubmitting(true);
    await reportTip(tipId, reason, details.trim() || undefined);
    setSubmitting(false);
    onOpenChange(false);
    setReason("");
    setDetails("");
    setError("");
    toast.success("Thanks for flagging this", {
      description: "A moderator will review the tip shortly.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this tip</DialogTitle>
          <DialogDescription>Help keep advice useful and respectful.</DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={reason}
          onValueChange={(v) => {
            setReason(v as ReportReason);
            setError("");
          }}
          aria-label="Reason for reporting"
          className="gap-2"
        >
          {REPORT_REASONS.map((r) => (
            <Label
              key={r}
              htmlFor={`reason-${tipId}-${r}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 font-medium hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft"
            >
              <RadioGroupItem id={`reason-${tipId}-${r}`} value={r} />
              {r}
            </Label>
          ))}
        </RadioGroup>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`details-${tipId}`}>Anything else? (optional)</Label>
          <Textarea
            id={`details-${tipId}`}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={300}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            {submitting ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
