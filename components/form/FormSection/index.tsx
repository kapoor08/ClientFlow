import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  separatorClassName?: string;
}

export function FormSection({
  title,
  description,
  children,
  className = "",
  separatorClassName = "",
}: FormSectionProps) {
  return (
    <Card className={cn(!title || !description, "pt-0")}>
      <CardContent className={`pt-4 space-y-4 ${className}`}>
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {(title || description) && <Separator className={separatorClassName} />}
        {children}
      </CardContent>
    </Card>
  );
}
