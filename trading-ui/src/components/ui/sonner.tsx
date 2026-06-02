"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!bg-emerald-950/90 group-[.toaster]:!border-emerald-800 group-[.toaster]:!text-emerald-100 group-[.toaster]:backdrop-blur-sm",
          error:
            "group-[.toaster]:!bg-red-950/90 group-[.toaster]:!border-red-800 group-[.toaster]:!text-red-100 group-[.toaster]:backdrop-blur-sm",
          warning:
            "group-[.toaster]:!bg-amber-950/90 group-[.toaster]:!border-amber-800 group-[.toaster]:!text-amber-100 group-[.toaster]:backdrop-blur-sm",
          info:
            "group-[.toaster]:!bg-blue-950/90 group-[.toaster]:!border-blue-800 group-[.toaster]:!text-blue-100 group-[.toaster]:backdrop-blur-sm",
          loading:
            "group-[.toaster]:!bg-zinc-900/90 group-[.toaster]:!border-zinc-700 group-[.toaster]:backdrop-blur-sm",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:border-border",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
