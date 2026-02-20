"use client"

import { useTransition } from "react"
import { updateProfile } from "@/lib/actions"
import { Loader2 } from "lucide-react"

export function ProfileForm({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await updateProfile(formData)
    })
  }

  return (
    <form action={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white">
            Username
          </label>
          <input
            id="name"
            name="name"
            defaultValue={user?.name || ""}
            className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
            disabled={isPending}
          />
          <p className="text-[0.8rem] text-slate-400">
            This is your public display name.
          </p>
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white">
            Email
          </label>
           <select
             id="email"
             name="email"
             defaultValue={user?.email || ""}
             className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             disabled={isPending}
           >
             <option value="">Select a verified email to display</option>
             <option value="test@example.com">test@example.com</option>
             <option value="other@example.com">other@example.com</option>
           </select>
          <p className="text-[0.8rem] text-slate-400">
            You can manage verified email addresses in your{" "}
            <a href="/examples/forms" className="text-blue-500 hover:text-blue-400">email settings</a>.
          </p>
        </div>
        <div className="grid gap-2">
          <label htmlFor="bio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us a little bit about yourself"
            disabled={isPending}
          />
          <p className="text-[0.8rem] text-slate-400">
            You can <span>@mention</span> other users and organizations.
          </p>
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update profile
      </button>
    </form>
  )
}
