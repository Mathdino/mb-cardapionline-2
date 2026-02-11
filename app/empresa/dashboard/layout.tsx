"use client"

import React from "react"

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { CompanySidebar } from '@/components/company/sidebar'
import { FoodLoading } from '@/components/ui/food-loading'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FoodLoading />
      </div>
    )
  }

  if (!user) {
    router.push('/empresa')
    return null
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <CompanySidebar />
      
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
