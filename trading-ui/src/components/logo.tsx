import * as React from "react"
import { Network } from "lucide-react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <Network 
      size={size} 
      className={className} 
      {...props as any} 
    />
  )
}
