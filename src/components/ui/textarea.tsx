import * as React from "react";
import { cn } from "./button";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[#2D2D3F] bg-[#1E1E2E] px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#64748B] transition-colors resize-y",
          "focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
