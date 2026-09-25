"use server"

// app/profile/actions.ts

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { getSession } from "../lib/session"
import { AVATAR_MAX_BYTES, AVATAR_TYPES, avatarUrl } from "../lib/avatar"

type Result<T = object> = ({ success: true } & T) | { success: false; error: string }

// Empty inputs are stored as NULL rather than ""
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} can be at most ${max} characters`)
    .transform((v) => v || null)

const ProfileSchema = z.object({
  fullName: optionalText(80, "Full name"),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address")
    .transform((v) => v || null),
  jobTitle: optionalText(80, "Job title"),
  company: optionalText(80, "Company"),
  bio: optionalText(500, "Bio"),
})

export type ProfileInput = z.input<typeof ProfileSchema>

export async function updateProfile(input: ProfileInput): Promise<Result> {
  const session = await getSession()
  if (!session) return { success: false, error: "Your session has expired. Sign in again." }

  const parsed = ProfileSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." }

  try {
    await prisma.user.update({ where: { userId: session.userId }, data: parsed.data })
    revalidatePath("/", "layout") // header shows the name/avatar
    return { success: true }
  } catch (error) {
    console.error("Database Error (profile):", error)
    return { success: false, error: "Couldn't save your profile. Try again." }
  }
}

/** Checks the file's first bytes, so a renamed non-image is rejected. */
function sniffImageType(bytes: Uint8Array): (typeof AVATAR_TYPES)[number] | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to))
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png"
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp"
  return null
}

export async function uploadAvatar(formData: FormData): Promise<Result<{ url: string }>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Your session has expired. Sign in again." }

  const file = formData.get("avatar")
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "Choose an image to upload." }
  if (file.size > AVATAR_MAX_BYTES) return { success: false, error: "That image is too large. Try a smaller one." }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = sniffImageType(bytes)
  if (!type) return { success: false, error: "Use a JPG, PNG or WebP image." }

  try {
    const updated = await prisma.user.update({
      where: { userId: session.userId },
      data: { avatar: bytes, avatarType: type, avatarUpdatedAt: new Date() },
      select: { avatarUpdatedAt: true },
    })
    revalidatePath("/", "layout")
    return { success: true, url: avatarUrl(session.userId, updated.avatarUpdatedAt!) }
  } catch (error) {
    console.error("Database Error (avatar):", error)
    return { success: false, error: "Couldn't save your photo. Try again." }
  }
}

export async function removeAvatar(): Promise<Result> {
  const session = await getSession()
  if (!session) return { success: false, error: "Your session has expired. Sign in again." }

  try {
    await prisma.user.update({
      where: { userId: session.userId },
      data: { avatar: null, avatarType: null, avatarUpdatedAt: null },
    })
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Database Error (avatar remove):", error)
    return { success: false, error: "Couldn't remove your photo. Try again." }
  }
}
