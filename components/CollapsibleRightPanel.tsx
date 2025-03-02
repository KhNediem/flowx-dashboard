"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Bell, ChevronRight, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: number
  message: string
  timestamp: string
}

interface Employee {
  profile_id: number
  first_name: string
  last_name: string
  role_id: number
  role_name: string
}

const staticNotifications: Notification[] = [
  { id: 1, message: "New shift assignment for tomorrow", timestamp: "2023-06-01T09:00:00Z" },
  { id: 2, message: "Inventory low on item #1234", timestamp: "2023-06-01T10:30:00Z" },
  { id: 3, message: "Employee performance review due", timestamp: "2023-06-01T11:45:00Z" },
  { id: 4, message: "New sales target achieved!", timestamp: "2023-06-01T14:15:00Z" },
  { id: 5, message: "System maintenance scheduled", timestamp: "2023-06-01T16:00:00Z" },
]

export function CollapsibleRightPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from("profiles").select(`
        profile_id,
        first_name,
        last_name,
        role_id,
        roles (
          role_name
        )
      `)

    if (error) {
      console.error("Error fetching employees:", error)
    } else {
      setEmployees(data as Employee[])
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed right-0 top-4 z-50 bg-background border border-border shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight /> : <ChevronLeft />}
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-secondary border-l border-border shadow-lg overflow-hidden z-40"
          >
            <ScrollArea className="h-full p-4">
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
              <div className="space-y-4 mb-6">
                {staticNotifications.map((notification) => (
                  <div key={notification.id} className="p-3 bg-background rounded-lg shadow">
                    <div className="flex items-center mb-2">
                      <Bell className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{notification.message}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <h2 className="text-lg font-semibold mb-4">Employees</h2>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.profile_id} className="p-3 bg-background rounded-lg shadow">
                    <div className="flex items-center">
                      <Avatar className="mr-2">
                        <AvatarImage
                          src={`https://api.dicebear.com/6.x/initials/svg?seed=${employee.first_name} ${employee.last_name}`}
                        />
                        <AvatarFallback>
                          {employee.first_name[0]}
                          {employee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{employee.roles.role_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

