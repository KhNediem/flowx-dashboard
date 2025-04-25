"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Users, ShoppingCart, LogOut, ShoppingBag, Store } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <aside className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          FlowX
        </Link>
      </div>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Dashboards</h2>
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                isActive("/")
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/sales"
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                isActive("/sales")
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Sales
            </Link>
            <Link
              href="/inventory"
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                isActive("/inventory")
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              }`}
            >
              <Package className="h-4 w-4" />
              Inventory
            </Link>
            <Link
              href="/products"
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                isActive("/products")
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Products
            </Link>
            <Link
              href="/stores"
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                isActive("/stores")
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              }`}
            >
              <Store className="h-4 w-4" />
              Stores
            </Link>
            <Link
              href="/employees"
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                isActive("/employees")
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              }`}
            >
              <Users className="h-4 w-4" />
              Employees
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 rounded-lg px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}

