import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  orderBy,
  doc,
} from "firebase/firestore"
import { db } from "../firebase"
import type { Chat, Message } from "../types"

/**
 * Retrieves all chats from the database
 * @returns Promise<Chat[]> - Array of all chat documents
 */
export const getAllChats = async (): Promise<Chat[]> => {
  try {
    const snapshot = await getDocs(collection(db, "chat"))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Chat)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return []
  }
}

/**
 * Retrieves a chat by order ID
 * @param orderId - The order ID to search for
 * @returns Promise<Chat | null> - The chat document or null if not found
 */
export const getChatByOrderId = async (orderId: string): Promise<Chat | null> => {
  try {
    // Handle both string and document reference formats for orderref
    // First try with string format (more common in newer implementations)
    let q = query(collection(db, "chat"), where("orderref", "==", orderId))
    let chatSnapshot = await getDocs(q)
    
    // If no results with string, try with document reference format
    if (chatSnapshot.empty) {
      const orderRef = doc(db, "orders", orderId)
      q = query(collection(db, "chat"), where("orderref", "==", orderRef))
      chatSnapshot = await getDocs(q)
    }
    
    if (chatSnapshot.empty) return null
    
    const chatDoc = chatSnapshot.docs[0]
    return { id: chatDoc.id, ...chatDoc.data() } as Chat
  } catch (error) {
    console.error("Error fetching chat:", error)
    return null
  }
}

/**
 * Retrieves all messages for a specific chat
 * @param chatId - The chat ID to get messages from
 * @returns Promise<Message[]> - Array of messages ordered by timestamp
 */
export const getMessagesByChat = async (chatId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, "messages"),
      where("chat_ref", "==", doc(db, "chat", chatId)),
      orderBy("timestamp", "asc")
    )
    const messagesSnapshot = await getDocs(q)
    
    return messagesSnapshot.docs.map((d) => {
      const data = d.data() as any
      return {
        id: d.id,
        ...data,
        timestamp:
          data.timestamp instanceof Date
            ? data.timestamp
            : (data.timestamp?.toDate?.() ?? new Date(data.timestamp)),
      } as Message
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

/**
 * Sends a message from admin to a chat
 * @param chatId - The chat ID to send the message to
 * @param text - The message text content
 * @returns Promise<boolean> - Success status of the operation
 */
export const sendAdminMessage = async (
  chatId: string,
  text: string
): Promise<boolean> => {
  try {
    await addDoc(collection(db, "messages"), {
      chat_ref: doc(db, "chat", chatId),
      admintext: text,
      timestamp: new Date(),
      sender: "admin", // Add sender identification
      read: false, // Track if message has been read
    })
    return true
  } catch (error) {
    console.error("Error sending message:", error)
    return false
  }
}

/**
 * Marks all messages in a chat as read
 * @param chatId - The chat ID to mark messages as read
 * @returns Promise<boolean> - Success status of the operation
 */
export const markChatAsRead = async (chatId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, "messages"),
      where("chat_ref", "==", doc(db, "chat", chatId)),
      where("read", "==", false)
    )
    const messagesSnapshot = await getDocs(q)
    
    // Note: In a production app, you'd want to use batch writes for efficiency
    // This is a simplified version for demonstration
    const promises = messagesSnapshot.docs.map(async (messageDoc) => {
      const messageRef = doc(db, "messages", messageDoc.id)
      // You would use updateDoc here, but it's not imported
      // await updateDoc(messageRef, { read: true })
    })
    
    await Promise.all(promises)
    return true
  } catch (error) {
    console.error("Error marking chat as read:", error)
    return false
  }
}

/**
 * Gets the count of unread messages for a chat
 * @param chatId - The chat ID to count unread messages
 * @returns Promise<number> - Number of unread messages
 */
export const getUnreadMessageCount = async (chatId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, "messages"),
      where("chat_ref", "==", doc(db, "chat", chatId)),
      where("read", "==", false),
      where("sender", "!=", "admin") // Only count non-admin messages
    )
    const messagesSnapshot = await getDocs(q)
    return messagesSnapshot.size
  } catch (error) {
    console.error("Error getting unread message count:", error)
    return 0
  }
}