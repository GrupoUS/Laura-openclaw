"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function updateProfile(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string

  // Mock update for demo
  if (session.user.id !== "mock-user-id") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name, email },
      })
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function createCheckoutSession(priceId: string) {
  const session = await auth()

  if (!session?.user?.email || !session?.user?.id) {
    throw new Error("Not authenticated")
  }
  
  // Create Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: session.user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata: {
      userId: session.user.id,
    },
  })

  if (!checkoutSession.url) {
    throw new Error("Error creating checkout session")
  }

  redirect(checkoutSession.url)
}
