import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./button";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30",
        success: "bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30",
        warning: "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30",
        danger: "bg-red-500/15 text-red-400 border border-red-500/30",
        outline: "border border-[#2D2D3F] text-[#94A3B8] bg-transparent",
        accent: "bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
