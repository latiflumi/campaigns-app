"use client"

// app/profile/ProfileForm.tsx

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Camera, Loader2, Trash2, Lock, AtSign, CalendarDays } from "lucide-react"
import UserAvatar from "../UserAvatar"
import { updateProfile, uploadAvatar, removeAvatar, type ProfileInput } from "./actions"

type Fields = Required<{ [K in keyof ProfileInput]: string }>

interface ProfileFormProps {
  user: { userId: string; userName: string; createdAt: string; avatarSrc: string | null }
  initial: Fields
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const memberSince = (iso: string) => {
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

const BIO_MAX = 500
const RAW_MAX_BYTES = 15 * 1024 * 1024

/** Center-crops and scales an image to a 256×256 WebP (JPEG where WebP encoding isn't supported). */
async function toAvatarBlob(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no canvas")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9))
  const webp = await encode("image/webp")
  if (webp?.type === "image/webp") return webp
  const jpeg = await encode("image/jpeg")
  if (!jpeg) throw new Error("encode failed")
  return jpeg
}

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-transparent focus:ring-2 focus:ring-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:placeholder:text-neutral-500"

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-neutral-700 uppercase dark:text-neutral-300">
          {label}
        </label>
        {hint && <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function ProfileForm({ user, initial }: ProfileFormProps) {
  const [saved, setSaved] = useState<Fields>(initial)
  const [form, setForm] = useState<Fields>(initial)
  const [saving, setSaving] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState(user.avatarSrc)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const dirty = (Object.keys(form) as (keyof Fields)[]).some((k) => form[k] !== saved[k])
  const displayName = form.fullName.trim() || user.userName
  const subtitle = [form.jobTitle.trim(), form.company.trim()].filter(Boolean).join(" · ")

  // Warn before leaving the page with unsaved edits
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const res = await updateProfile(form)
    setSaving(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as Fields
    setForm(trimmed)
    setSaved(trimmed)
    toast.success("Profile saved.")
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // allow picking the same file again
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.")
      return
    }
    if (file.size > RAW_MAX_BYTES) {
      toast.error("That image is over 15 MB. Choose a smaller one.")
      return
    }

    setAvatarBusy(true)
    try {
      let blob: Blob
      try {
        blob = await toAvatarBlob(file)
      } catch {
        toast.error("Couldn't read that image. Try a JPG or PNG.")
        return
      }
      const data = new FormData()
      data.append("avatar", blob, blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg")
      const res = await uploadAvatar(data)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setAvatarSrc(res.url)
      toast.success("Photo updated.")
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleRemove = async () => {
    setAvatarBusy(true)
    const res = await removeAvatar()
    setAvatarBusy(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    setAvatarSrc(null)
    toast.success("Photo removed.")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Your name, photo and details as they appear in CampaignStudio.</p>
      </div>

      {/* Identity card: previews edits as you type */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
            aria-label="Change photo"
            className="group relative size-24 shrink-0 cursor-pointer rounded-full ring-4 ring-neutral-100 transition-shadow focus-visible:ring-brand-500 focus-visible:outline-none disabled:cursor-wait dark:ring-neutral-800"
          >
            <UserAvatar name={displayName} src={avatarSrc} className="size-24 text-4xl" />
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white transition-opacity ${
                avatarBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
            >
              {avatarBusy ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
            </span>
          </button>
          <input ref={fileRef} id="avatar-file" type="file" accept="image/*" onChange={handleFile} className="sr-only" tabIndex={-1} />

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-neutral-900 dark:text-neutral-100">{displayName}</h2>
            {subtitle && <p className="mt-0.5 truncate text-sm text-neutral-600 dark:text-neutral-300">{subtitle}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <AtSign className="size-3.5" />
                {user.userName}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Member since {memberSince(user.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 sm:flex-col">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              <Camera className="size-3.5" />
              {avatarSrc ? "Change photo" : "Upload photo"}
            </button>
            {avatarSrc && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={avatarBusy}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </section>

      {/* General info */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">General info</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">All fields are optional.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName">
            <input id="fullName" type="text" value={form.fullName} onChange={set("fullName")} maxLength={80} autoComplete="name" placeholder="e.g. Latif Lumi" className={inputClass} />
          </Field>

          <Field label="Username" htmlFor="userName" hint={<span className="inline-flex items-center gap-1"><Lock className="size-3" />Used to sign in</span>}>
            <input id="userName" type="text" value={user.userName} readOnly className={`${inputClass} cursor-not-allowed bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400`} />
          </Field>

          <Field label="Job title" htmlFor="jobTitle">
            <input id="jobTitle" type="text" value={form.jobTitle} onChange={set("jobTitle")} maxLength={80} autoComplete="organization-title" placeholder="e.g. Marketing Manager" className={inputClass} />
          </Field>

          <Field label="Company" htmlFor="company">
            <input id="company" type="text" value={form.company} onChange={set("company")} maxLength={80} autoComplete="organization" placeholder="e.g. A&M Clothes" className={inputClass} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" value={form.email} onChange={set("email")} maxLength={120} autoComplete="email" placeholder="name@company.com" className={inputClass} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field
              label="Bio"
              htmlFor="bio"
              hint={
                <span className={form.bio.length > BIO_MAX - 50 ? "text-amber-600 dark:text-amber-400" : undefined}>
                  {form.bio.length}/{BIO_MAX}
                </span>
              }
            >
              <textarea id="bio" rows={4} value={form.bio} onChange={set("bio")} maxLength={BIO_MAX} placeholder="A line or two about your role." className={`${inputClass} resize-y`} />
            </Field>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
          <span className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
            {dirty ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            ) : (
              "All changes saved"
            )}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(saved)}
              disabled={!dirty || saving}
              className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={!dirty || saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
