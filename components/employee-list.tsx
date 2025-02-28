"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Employee {
  profile_id: number
  first_name: string
  last_name: string
  username: string
  role_id: number
  phone_number: string
  hourly_rate?: number
  salary?: number
}

const roleMap = {
  1: "Manager",
  2: "Supervisor",
  3: "Employee",
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const supabase = createClientComponentClient()

  const addForm = useForm<Omit<Employee, "profile_id">>()
  const editForm = useForm<Employee>()

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("profiles")
      .select("profile_id, first_name, last_name, username, role_id, phone_number, hourly_rate, salary")

    if (error) {
      console.error("Error fetching employees:", error)
    } else {
      setEmployees(data || [])
    }
  }

  const handleAddEmployee = async (data: Omit<Employee, "profile_id">) => {
    const { error } = await supabase.from("profiles").insert([data])

    if (error) {
      console.error("Error adding employee:", error)
    } else {
      setIsAddDialogOpen(false)
      fetchEmployees()
    }
  }

  const handleEditEmployee = async (data: Employee) => {
    const { error } = await supabase.from("profiles").update(data).eq("profile_id", data.profile_id)

    if (error) {
      console.error("Error updating employee:", error)
    } else {
      setIsEditDialogOpen(false)
      fetchEmployees()
    }
  }

  const handleDeleteEmployee = async (profileId: number) => {
    const { error } = await supabase.from("profiles").delete().eq("profile_id", profileId)

    if (error) {
      console.error("Error deleting employee:", error)
    } else {
      fetchEmployees()
    }
  }

  const EmployeeForm = ({
    form,
    onSubmit,
    dialogTitle,
  }: { form: any; onSubmit: (data: any) => void; dialogTitle: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(roleMap).map(([id, role]) => (
                    <SelectItem key={id} value={id}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{dialogTitle}</Button>
      </form>
    </Form>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Employees</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.profile_id}>
              <TableCell>{`${employee.first_name} ${employee.last_name}`}</TableCell>
              <TableCell>{employee.username}</TableCell>
              <TableCell>{roleMap[employee.role_id as keyof typeof roleMap]}</TableCell>
              <TableCell>{employee.phone_number}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(employee)
                    setIsViewDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(employee)
                    editForm.reset(employee)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteEmployee(employee.profile_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm form={addForm} onSubmit={handleAddEmployee} dialogTitle="Add Employee" />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm form={editForm} onSubmit={handleEditEmployee} dialogTitle="Update Employee" />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p>
                  <strong>Name:</strong> {`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                </p>
                <p>
                  <strong>Username:</strong> {selectedEmployee.username}
                </p>
                <p>
                  <strong>Role:</strong> {roleMap[selectedEmployee.role_id as keyof typeof roleMap]}
                </p>
                <p>
                  <strong>Phone Number:</strong> {selectedEmployee.phone_number}
                </p>
                {selectedEmployee.hourly_rate && (
                  <p>
                    <strong>Hourly Rate:</strong> ${selectedEmployee.hourly_rate.toFixed(2)}
                  </p>
                )}
                {selectedEmployee.salary && (
                  <p>
                    <strong>Salary:</strong> ${selectedEmployee.salary.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

