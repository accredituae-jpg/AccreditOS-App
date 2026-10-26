import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { Certificate } from "../types/certificates.types";

interface RenewalBadgeProps {
  cert?: Certificate;
  status?: string;
  daysLeft?: number;
}

export function RenewalBadge({ cert, status, daysLeft }: RenewalBadgeProps) {
  const renewalStatus = cert?.renewalStatus ?? status;
  const daysUntilExpiry = cert?.daysUntilExpiry ?? daysLeft;

  if (renewalStatus === "expired") {
    return (
      <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/20 font-semibold px-2 py-0.5">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    );
  }
  if (renewalStatus === "expiring-soon") {
    return (
      <Badge variant="outline" className="bg-warning/15 text-warning border-warning/20 font-semibold px-2 py-0.5">
        <RefreshCw className="w-3 h-3 mr-1" />
        {daysUntilExpiry ?? 0} days
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-success/15 text-success border-success/20 font-semibold px-2 py-0.5">
      Valid
    </Badge>
  );
}

interface InvoiceBadgeProps {
  cert?: Certificate;
  invoiceIssued?: boolean;
}

export function InvoiceBadge({ cert, invoiceIssued }: InvoiceBadgeProps) {
  const isIssued = cert?.invoiceIssued ?? invoiceIssued;

  return isIssued ? (
    <Badge variant="outline" className="bg-info/15 text-info border-info/20 font-semibold px-2 py-0.5">
      Invoiced
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20 font-semibold px-2 py-0.5">
      Not Invoiced
    </Badge>
  );
}
