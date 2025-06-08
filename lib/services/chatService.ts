import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  orderBy,
} from "firebase/firestore"
import { db } from "../firebase"
import type { Chat, Message } from "../types"

export const getAllChats = async (): Promise<Chat[]> => {
  try {
    const snapshot = await getDocs(collection(db, "chat"))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Chat)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return []
  }
}

export const getChatByOrderId = async (orderId: string): Promise<Chat | null> => {
  try {
    const q = query(collection(db, "chat"), where("orderref", "==", orderId))
    const chatSnapshot = await getDocs(q)

    if (chatSnapshot.empty) return null

    const chatDoc = chatSnapshot.docs[0]
    return { id: chatDoc.id, ...chatDoc.data() } as Chat
  } catch (error) {
    console.error("Error fetching chat:", error)
    return null
  }
}

export const getMessagesByChat = async (chatId: string): Promise<Message[]> => {
  try {
    const q = query(collection(db, "messages"), where("chat_ref", "==", chatId), orderBy("timestamp", "asc"))
    const messagesSnapshot = await getDocs(q)
    return messagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Message)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

export const sendAdminMessage = async (chatId: string, text: string): Promise<boolean> => {
  try {
    await addDoc(collection(db, "messages"), {
      chat_ref: chatId,
      admintext: text,
      timestamp: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error sending message:", error)
    return false
  }
}
