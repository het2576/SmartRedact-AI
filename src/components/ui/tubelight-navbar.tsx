"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  onClick?: () => void
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  activeTab?: string
}

export function NavBar({ items, className, activeTab: externalActiveTab }: NavBarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(items[0].name)
  const activeTab = externalActiveTab || internalActiveTab

  return (
    <>
      {/* Mobile Navbar - Bottom */}
      <div className="block sm:hidden">
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-20",
            "bg-gradient-to-t from-white/98 via-white/95 to-white/90",
            "backdrop-blur-2xl backdrop-saturate-150",
            "border-t border-gray-200/50",
            "shadow-2xl shadow-gray-200/20",
            "before:absolute before:inset-0 before:bg-gradient-to-t before:from-gray-50/20 before:via-transparent before:to-transparent before:pointer-events-none",
            className,
          )}
        >
          <div className="flex items-center justify-around py-2 px-4">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.name

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else {
                      setInternalActiveTab(item.name);
                    }
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300",
                    "text-gray-600 hover:text-gray-900",
                    "hover:bg-gradient-to-br hover:from-blue-50 hover:via-blue-25 hover:to-transparent",
                    "hover:backdrop-blur-sm hover:shadow-lg hover:shadow-blue-100/50",
                    "hover:border hover:border-blue-200/50",
                    isActive && [
                      "text-blue-600",
                      "bg-gradient-to-br from-blue-100/80 via-blue-50/60 to-transparent",
                      "backdrop-blur-sm",
                      "shadow-lg shadow-blue-200/40",
                      "border border-blue-300/50",
                      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-200/20 before:via-transparent before:to-transparent before:rounded-xl before:pointer-events-none"
                    ],
                  )}
                >
                  <Icon size={20} strokeWidth={2.5} />
                  <span className="text-xs font-medium mt-1">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-indicator"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-400/50"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Desktop Navbar - Top */}
      <div className="hidden sm:block">
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-20",
            "bg-gradient-to-b from-white/98 via-white/95 to-white/90",
            "backdrop-blur-2xl backdrop-saturate-150",
            "border-b border-gray-200/50",
            "shadow-2xl shadow-gray-200/20",
            "before:absolute before:inset-0 before:bg-gradient-to-b before:from-gray-50/20 before:via-transparent before:to-transparent before:pointer-events-none",
            className,
          )}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-400/30">
                  <span className="text-white font-bold text-sm">SR</span>
                </div>
                <span className="text-xl font-bold text-gradient">
                  Smart Redact
                </span>
              </div>

              {/* Navigation Items */}
              <div className="flex items-center space-x-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.name

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          setInternalActiveTab(item.name);
                        }
                      }}
                      className={cn(
                        "relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300",
                        "text-gray-600 hover:text-gray-900",
                        "hover:bg-gradient-to-br hover:from-blue-50 hover:via-blue-25 hover:to-transparent",
                        "hover:backdrop-blur-sm hover:shadow-lg hover:shadow-blue-100/50",
                        "hover:border hover:border-blue-200/50",
                        isActive && [
                          "text-blue-600",
                          "bg-gradient-to-br from-blue-100/80 via-blue-50/60 to-transparent",
                          "backdrop-blur-sm",
                          "shadow-lg shadow-blue-200/40",
                          "border border-blue-300/50",
                          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-200/20 before:via-transparent before:to-transparent before:rounded-xl before:pointer-events-none"
                        ],
                      )}
                    >
                      <Icon size={18} strokeWidth={2.5} />
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="desktop-indicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-400/50"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for desktop navbar */}
      <div className="hidden sm:block h-20" />
    </>
  )
}