import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-medium uppercase tracking-[0.08em] transition-[transform,box-shadow,background-color,color] duration-150 ease-stamp disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-paper-raised shadow-stamp hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#15171A] active:translate-x-0 active:translate-y-0 active:shadow-none",
        flag:
          "bg-flag text-paper-raised shadow-stamp hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#15171A] active:translate-x-0 active:translate-y-0 active:shadow-none",
        outline:
          "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper-raised",
        ghost:
          "text-ink-soft hover:text-ink underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink",
        destructive:
          "border border-alert text-alert hover:bg-alert hover:text-paper-raised",
      },
      size: {
        default: "px-5 py-2.5 text-xs",
        sm: "px-3.5 py-1.5 text-[11px]",
        lg: "px-7 py-3.5 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
