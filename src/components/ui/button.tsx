"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#7C3AED] text-white hover:bg-[#6D28D9] focus-visible:ring-[#7C3AED]",
        secondary:
          "bg-[#1E1E2E] text-[#F8FAFC] border border-[#2D2D3F] hover:bg-[#2D2D3F] focus-visible:ring-[#2D2D3F]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
        ghost:
          "text-[#F8FAFC] hover:bg-[#1E1E2E] focus-visible:ring-[#2D2D3F]",
        outline:
          "border border-[#2D2D3F] bg-transparent text-[#F8FAFC] hover:bg-[#1E1E2E] focus-visible:ring-[#2D2D3F]",
        accent:
          "bg-[#22D3EE] text-[#0B0B12] hover:bg-[#06B6D4] focus-visible:ring-[#22D3EE]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, cn };
