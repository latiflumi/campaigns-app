"use server"

// app/profile/actions.ts

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { getSession } from "../lib/session"
import { AVATAR_MAX_BYTES, AVATAR_TYPES, avatarUrl } from "../lib/avatar"
import { getT } from "../lib/i18n/server"
import type { Dict } from "../lib/i18n/dictionaries"

type Result<T = object> = ({ success: true } & T) | { success: false; error: string }

// Empty inputs are stored as NULL rather than ""; messages in the caller's language
const optionalText = (t: Dict, max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, t.serverErrors.maxChars(label, max))
    .transform((v) => v || null)

const profileSchema = (t: Dict) =>
  z.object({
    fullName: optionalText(t, 80, t.profile.fullName),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((v) => v === "" || z.email().safeParse(v).success, t.serverErrors.invalidEmail)
      .transform((v) => v || null),
    jobTitle: optionalText(t, 80, t.profile.jobTitle),
    company: optionalText(t, 80, t.profile.company),
    bio: optionalText(t, 500, t.profile.bio),
  })

export type ProfileInput = z.input<ReturnType<typeof profileSchema>>

export async function updateProfile(input: ProfileInput): Promise<Result> {
  const t = await getT()
  const session = await getSession()
  if (!session) return { success: false, error: t.serverErrors.sessionExpired }

  const parsed = profileSchema(t).safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? t.serverErrors.checkForm }

  try {
    await prisma.user.update({ where: { userId: session.userId }, data: parsed.data })
    revalidatePath("/", "layout") // header shows the name/avatar
    return { success: true }
  } catch (error) {
    console.error("Database Error (profile):", error)
    return { success: false, error: t.serverErrors.profileSaveFailed }
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
  const t = await getT()
  const session = await getSession()
  if (!session) return { success: false, error: t.serverErrors.sessionExpired }

  const file = formData.get("avatar")
  if (!(file instanceof File) || file.size === 0) return { success: false, error: t.serverErrors.chooseImage }
  if (file.size > AVATAR_MAX_BYTES) return { success: false, error: t.serverErrors.imageTooLarge }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = sniffImageType(bytes)
  if (!type) return { success: false, error: t.serverErrors.imageType }

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
    return { success: false, error: t.serverErrors.photoSaveFailed }
  }
}

export async function removeAvatar(): Promise<Result> {
  const t = await getT()
  const session = await getSession()
  if (!session) return { success: false, error: t.serverErrors.sessionExpired }

  try {
    await prisma.user.update({
      where: { userId: session.userId },
      data: { avatar: null, avatarType: null, avatarUpdatedAt: null },
    })
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Database Error (avatar remove):", error)
    return { success: false, error: t.serverErrors.photoRemoveFailed }
  }
}
