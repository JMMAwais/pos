import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { usePos } from "../store/pos";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  description?: string;
  /** Called with the verified admin pin so the caller can pass it to a store action that requires it. */
  onApproved: (adminPin: string) => void;
};

export function AdminPinDialog({ open, onOpenChange, title = "Admin approval required", description, onApproved }: Props) {
  const verifyAdminPin = usePos((s) => s.verifyAdminPin);
  const [pin, setPin] = useState("");

  const submit = (value: string) => {
    if (verifyAdminPin(value)) {
      onApproved(value);
      onOpenChange(false);
      setPin("");
    } else {
      toast.error("Invalid admin PIN");
      setPin("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setPin(""); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex justify-center py-2">
          <InputOTP maxLength={6} value={pin} onChange={(v) => { setPin(v); if (v.length >= 4) submit(v); }}>
            <InputOTPGroup>
              {Array.from({ length: 4 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <p className="text-center text-xs text-muted-foreground">Enter an admin PIN to approve.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => submit(pin)}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
