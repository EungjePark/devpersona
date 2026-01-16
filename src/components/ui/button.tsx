import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25",
        destructive: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
        outline: "border border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary hover:border-border-light",
        secondary: "bg-bg-tertiary text-text-primary hover:bg-bg-elevated",
        ghost: "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
        link: "text-primary-400 underline-offset-4 hover:underline hover:text-primary-300",
        // Tier-specific variants
        legendary: "bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold hover:from-yellow-400 hover:to-amber-300 shadow-lg shadow-yellow-500/30",
        epic: "bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold hover:from-purple-500 hover:to-violet-400 shadow-lg shadow-purple-500/25",
        rare: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
