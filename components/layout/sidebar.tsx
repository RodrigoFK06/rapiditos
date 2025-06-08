"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Home,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Users,
  Bike,
  MessageSquare,
  FileCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/useAuthStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()
  const [open, setOpen] = useState(false)

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Pedidos",
      icon: ShoppingBag,
      href: "/orders",
      active: pathname === "/orders" || pathname.startsWith("/orders/"),
    },
    {
      label: "Restaurantes",
      icon: Package,
      href: "/restaurants",
      active: pathname === "/restaurants" || pathname.startsWith("/restaurants/"),
    },
    {
      label: "Repartidores",
      icon: Bike,
      href: "/riders",
      active: pathname === "/riders" || pathname.startsWith("/riders/"),
    },
    {
      label: "Usuarios",
      icon: Users,
      href: "/users",
      active: pathname === "/users" || pathname.startsWith("/users/"),
    },
    {
      label: "Chats",
      icon: MessageSquare,
      href: "/chats",
      active: pathname === "/chats" || pathname.startsWith("/chats/"),
    },
    {
      label: "Documentos",
      icon: FileCheck,
      href: "/documents",
      active: pathname === "/documents" || pathname.startsWith("/documents/"),
    },
    {
      label: "Estadísticas",
      icon: BarChart3,
      href: "/stats",
      active: pathname === "/stats",
    },
  ]

  return (
    <>
      <div className="hidden h-full w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">Rapiditos</span>
            <span className="text-muted-foreground">Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar>
              <AvatarImage src={user?.photo_url || "/placeholder.svg"} />
              <AvatarFallback>{user?.display_name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.display_name || "Admin"}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-xl"
              onClick={() => setOpen(false)}
            >
              <span className="text-primary">Rapiditos</span>
              <span className="text-muted-foreground">Admin</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                    route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto border-t p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Avatar>
                <AvatarImage src={user?.photo_url || "/placeholder.svg"} />
                <AvatarFallback>{user?.display_name?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.display_name || "Admin"}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
