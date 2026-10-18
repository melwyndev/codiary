import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "w-full bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring input-standard appearance-none cursor-pointer !pr-12",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
