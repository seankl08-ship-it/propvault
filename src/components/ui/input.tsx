import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[10px] border-[1.5px] border-[var(--line-2)] bg-[var(--paper)] px-3 py-2 font-[family-name:var(--font-mukta)] text-[15px] text-[var(--ink-2)] placeholder:text-[var(--ink-3)] focus:border-[var(--cyan)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(0,174,239,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
