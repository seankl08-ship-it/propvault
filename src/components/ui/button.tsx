import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full transition-[transform,background-color,opacity] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ink)] text-white font-[family-name:var(--font-montserrat)] font-bold hover:opacity-90",
        primary:
          "bg-[var(--pink)] text-white font-[family-name:var(--font-montserrat)] font-bold hover:opacity-90",
        destructive:
          "bg-[var(--pink)] text-white font-[family-name:var(--font-montserrat)] font-bold hover:opacity-90",
        outline:
          "border border-[var(--line-2)] bg-transparent text-[var(--ink)] font-[family-name:var(--font-montserrat)] font-semibold hover:bg-[var(--bg)]",
        ghost:
          "border border-[var(--line-2)] bg-transparent text-[var(--ink)] font-[family-name:var(--font-montserrat)] font-semibold hover:bg-[var(--bg)]",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
