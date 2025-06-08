import { create } from "zustand"
import { getAllChats, getChatByOrderId, getMessagesByChat, sendAdminMessage } from "../services/chatService"
import type { Chat, Message } from "../types"

interface ChatState {
  chats: Chat[]
  currentChat: Chat | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  fetchChats: () => Promise<void>
  fetchChatByOrder: (orderId: string) => Promise<void>
  fetchMessages: (chatId: string) => Promise<void>
  sendMessage: (chatId: string, text: string) => Promise<boolean>
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchChats: async () => {
    set({ isLoading: true, error: null })
    try {
      const chats = await getAllChats()
      set({ chats, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar chats",
        isLoading: false,
      })
    }
  },

  fetchChatByOrder: async (orderId: string) => {
    set({ isLoading: true, error: null })
    try {
      const chat = await getChatByOrderId(orderId)
      set({ currentChat: chat, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar el chat",
        isLoading: false,
      })
    }
  },

  fetchMessages: async (chatId: string) => {
    set({ isLoading: true, error: null })
    try {
      const messages = await getMessagesByChat(chatId)
      set({ messages, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar mensajes",
        isLoading: false,
      })
    }
  },

  sendMessage: async (chatId: string, text: string) => {
    set({ isLoading: true, error: null })
    try {
      const success = await sendAdminMessage(chatId, text)
      if (success) {
        const messages = await getMessagesByChat(chatId)
        set({ messages, isLoading: false })
      } else {
        set({ isLoading: false })
      }
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al enviar mensaje",
        isLoading: false,
      })
      return false
    }
  },
}))
