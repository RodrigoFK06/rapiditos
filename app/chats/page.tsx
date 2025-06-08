"use client"

import { useEffect } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { useChatStore } from "@/lib/stores/useChatStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Eye } from "lucide-react"
import type { Chat } from "@/lib/types"

const columns: ColumnDef<Chat>[] = [
  {
    accessorKey: "chatnumber",
    header: "Chat",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const chat = row.original
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/chats/${chat.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      )
    },
  },
]

export default function ChatsPage() {
  const { chats, isLoading, fetchChats } = useChatStore()

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chats</h1>
          <p className="text-muted-foreground">Conversaciones entre clientes y riders</p>
        </div>
        <DataTable columns={columns} data={chats} searchKey="chatnumber" searchPlaceholder="Buscar por número..." />
      </div>
    </DashboardLayout>
  )
}
