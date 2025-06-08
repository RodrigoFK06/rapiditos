"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChatStore } from "@/lib/stores/useChatStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Send } from "lucide-react"

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string

  const { messages, isLoading, fetchMessages, sendMessage } = useChatStore()
  const [text, setText] = useState("")

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId)
    }
  }, [chatId, fetchMessages])

  const handleSend = async () => {
    if (text.trim()) {
      await sendMessage(chatId, text)
      setText("")
    }
  }

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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
            <p className="text-muted-foreground">Mensajes con el cliente o repartidor</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="border p-2 rounded-md">
                  <p className="text-sm">{msg.clientext || msg.ridertext || msg.admintext}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(msg.timestamp as unknown as string).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje" />
              <Button type="button" onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
