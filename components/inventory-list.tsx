"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, List, ArrowUpDown } from "lucide-react"

const inventory = [
  {
    id: "#CM9801",
    name: "Product",
    sku: "CHR-002",
    category: "Pastry",
    stock: "25",
    status: "In Stock",
  },
  // Add more items...
]

export function InventoryList() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        <Input
          placeholder="Search"
          className="max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input type="checkbox" className="rounded border-muted" />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <input type="checkbox" className="rounded border-muted" />
                </TableCell>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    ⋮
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <Button variant="outline" size="icon" disabled>
          {"<"}
        </Button>
        {[1, 2, 3, 4, 5].map((page) => (
          <Button key={page} variant={page === 1 ? "default" : "outline"} size="icon">
            {page}
          </Button>
        ))}
        <Button variant="outline" size="icon">
          {">"}
        </Button>
      </div>
    </div>
  )
}

