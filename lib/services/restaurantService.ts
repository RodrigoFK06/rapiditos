import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore"
import { db, storage } from "../firebase"
import type { Restaurant, Dish } from "../types"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  try {
    const restaurantDoc = await getDoc(doc(db, "restaurant", id))
    if (restaurantDoc.exists()) {
      return { id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant
    }
    return null
  } catch (error) {
    console.error("Error fetching restaurant:", error)
    return null
  }
}

export const getAllRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const restaurantsSnapshot = await getDocs(collection(db, "restaurant"))
    return restaurantsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Restaurant)
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return []
  }
}

export const updateRestaurant = async (id: string, data: Partial<Restaurant>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "restaurant", id), data)
    return true
  } catch (error) {
    console.error("Error updating restaurant:", error)
    return false
  }
}

export const toggleRestaurantStatus = async (id: string, isActive: boolean): Promise<boolean> => {
  return updateRestaurant(id, { isActive })
}

export const uploadRestaurantImage = async (file: File, restaurantId: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `restaurants/${restaurantId}/${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

export const addDishToRestaurant = async (restaurantId: string, dish: Dish): Promise<boolean> => {
  try {
    const restaurantRef = doc(db, "restaurant", restaurantId)
    const restaurantDoc = await getDoc(restaurantRef)

    if (!restaurantDoc.exists()) {
      return false
    }

    const restaurant = restaurantDoc.data() as Restaurant
    const platillos = restaurant.platillos || []

    await updateDoc(restaurantRef, {
      platillos: [...platillos, dish],
    })

    return true
  } catch (error) {
    console.error("Error adding dish:", error)
    return false
  }
}
