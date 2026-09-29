"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// A marca é clara em todas as telas (loja, painel e PDV sob luz do dia).
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-olive" />,
        info: <InfoIcon className="size-4 text-sage" />,
        warning: <TriangleAlertIcon className="size-4 text-gold-ink" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin text-olive" />,
      }}
      style={
        {
          "--normal-bg": "var(--ug-paper)",
          "--normal-text": "var(--ug-ink)",
          "--normal-border": "var(--ug-hairline)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-lift font-sans",
          description: "text-stone-ink",
          actionButton: "!bg-olive !text-offwhite !rounded-full",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
