
import { useState } from 'react'
import { Button } from '@/client/components/dashboard/ui/button'
import { CreateTaskSheet } from './CreateTaskSheet'

export function CreateTaskButton({ mobile }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className={mobile ? 'px-2' : 'gap-1.5'}>
        <span>\u2795</span> {!mobile && 'Nova Task'}
      </Button>
      <CreateTaskSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
