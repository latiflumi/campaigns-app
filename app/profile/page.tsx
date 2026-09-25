// app/profile/page.tsx
import { redirect } from "next/navigation"
import { prisma } from "../lib/prisma"
import { getSession } from "../lib/session"
import { avatarUrl } from "../lib/avatar"
import ProfileForm from "./ProfileForm"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { userId: session.userId },
    select: {
      userId: true,
      userName: true,
      fullName: true,
      email: true,
      jobTitle: true,
      company: true,
      bio: true,
      avatarUpdatedAt: true,
      createdAt: true,
    },
  })
  if (!user) redirect("/login")

  return (
    <ProfileForm
      user={{
        userId: user.userId,
        userName: user.userName,
        createdAt: user.createdAt.toISOString(),
        avatarSrc: user.avatarUpdatedAt ? avatarUrl(user.userId, user.avatarUpdatedAt) : null,
      }}
      initial={{
        fullName: user.fullName ?? "",
        email: user.email ?? "",
        jobTitle: user.jobTitle ?? "",
        company: user.company ?? "",
        bio: user.bio ?? "",
      }}
    />
  )
}
