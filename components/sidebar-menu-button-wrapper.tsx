"use client"

import { useSidebar, SidebarMenuButton } from "@/components/ui/sidebar"
import { TypeIcon as type, LucideIcon } from 'lucide-react'
import * as React from "react"

interface SidebarMenuButtonWrapperProps {
  isActive: boolean
  onClick: () => void
  tooltip: string
  icon: LucideIcon
  children: React.ReactNode
}

export function SidebarMenuButtonWrapper({
  isActive,
  onClick,
  tooltip,
  icon: Icon,
  children,
}: SidebarMenuButtonWrapperProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  const handleClick = () => {
    onClick()
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarMenuButton
      isActive={isActive}
      onClick={handleClick}
      tooltip={tooltip}
    >
      <Icon />
      <span>{children}</span>
    </SidebarMenuButton>
  )
}
