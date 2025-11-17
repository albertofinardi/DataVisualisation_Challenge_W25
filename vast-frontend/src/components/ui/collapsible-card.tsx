import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onOpenChange?: (open: boolean) => void;
}

export function CollapsibleCard({
  title,
  icon,
  children,
  open: controlledOpen,
  defaultOpen = true,
  className,
  headerClassName,
  contentClassName,
  onOpenChange,
}: CollapsibleCardProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  // Use controlled value if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = (open: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <Card className={className}>
        <CollapsibleTrigger asChild>
          <CardHeader
            className={cn(
              "cursor-pointer transition-colors",
              !isOpen ? "hover:bg-accent/5" : "",
              headerClassName
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2 text-lg font-semibold">
                {icon}
                {title}
              </span>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "transform rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className={cn("pt-6", contentClassName)}>
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
