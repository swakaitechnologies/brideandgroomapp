import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "hero"
    | "white";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";
    
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground shadow hover:bg-primary/90":
              variant === "default",
            "bg-red-500 text-white shadow-sm hover:bg-red-500/90":
              variant === "destructive",
            "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground":
              variant === "outline",
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80":
              variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline":
              variant === "link",
            "bg-white text-black border border-slate-200 shadow-sm hover:bg-slate-50":
              variant === "white",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };





