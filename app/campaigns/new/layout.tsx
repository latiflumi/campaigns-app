// app/campaigns/new/layout.tsx
// The create page is a Client Component, so the admin check lives here on the server.
import { requireAdminPage } from "@/app/lib/roles"

export default async function NewCampaignLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  return children
}
