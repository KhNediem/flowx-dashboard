import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell } from "lucide-react"

export function RightPanel() {
  return (
    <aside className="hidden w-[400px] border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 xl:block">
      <div className="flex h-14 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Notifications</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-secondary p-2">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">You have a bug that needs...</p>
                <p className="text-sm text-muted-foreground">Just now</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Next Month Demand</h3>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-2 flex-1 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.random() * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">Flavor</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Contacts</h3>
            <div className="space-y-4">
              {["Natali Craig", "Drew Cano", "Orlando Diggs", "Andi Lane", "Kate Morrison"].map((name) => (
                <div key={name} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg`} />
                    <AvatarFallback>
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

