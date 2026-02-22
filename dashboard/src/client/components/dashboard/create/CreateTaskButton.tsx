
import { useState } from 'react'
import { Button } from '@/client/components/dashboard/ui/button'
import { CreateTaskSheet } from './CreateTaskSheet'

export function CreateTaskButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <span>\u2795</span> Nova Task
      </Button>
      <CreateTaskSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
