import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { ProfileForm } from "@/components/dashboard/profile-form"

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Profile</h3>
        <p className="text-sm text-slate-400">
          This is how others will see you on the site.
        </p>
      </div>
      <div className="border-t border-slate-800" />
      <ProfileForm user={session.user} />
    </div>
  )
}
