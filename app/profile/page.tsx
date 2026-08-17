// app/profile/page.tsx
'use client'

import { useState } from 'react'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'api' | 'notifications'>('general')

  // Form states
  const [userProfile, setUserProfile] = useState({
    fullName: 'Latif Lumi',
    email: 'latif.lumi@example.com',
    role: 'IT Lead / Full Stack Developer',
    company: 'Retail Solutions Ltd.',
    timezone: 'Europe/Belgrade (UTC+01:00)',
    bio: 'Managing core IT infrastructure, database sync pipelines, and internal full-stack e-commerce platforms.',
  })

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setUserProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your personal profile, security options, API keys, and notification preferences.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-900 text-white font-bold text-xl flex items-center justify-center ring-4 ring-slate-100">
            LL
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{userProfile.fullName}</h2>
            <p className="text-xs font-medium text-slate-500">{userProfile.role} • {userProfile.company}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active Account
              </span>
              <span className="text-xs text-slate-400">ID: usr_984210</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors border border-slate-200"
        >
          Change Avatar
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Side Navigation */}
        <nav className="space-y-1">
          {[
            { id: 'general', label: 'General Info', icon: '👤' },
            { id: 'security', label: 'Security & Auth', icon: '🔒' },
            { id: 'api', label: 'API Keys & Tokens', icon: '🔑' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">Personal Details</h3>
                  <p className="text-xs text-slate-500">Update your account name and workspace role.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={userProfile.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={userProfile.email}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Job Title / Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={userProfile.role}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      value={userProfile.timezone}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Europe/Belgrade (UTC+01:00)">Europe/Belgrade (UTC+01:00)</option>
                      <option value="UTC">UTC (Universal Time)</option>
                      <option value="America/New_York (UTC-05:00)">America/New_York (UTC-05:00)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bio / Internal Notes
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={userProfile.bio}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                  />
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">Security Credentials</h3>
                  <p className="text-xs text-slate-500">Update password and manage multi-factor authentication.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full sm:w-80 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="New password"
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-slate-500">Add an extra layer of security using an authenticator app.</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {/* API TAB */}
            {activeTab === 'api' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Developer API Keys</h3>
                    <p className="text-xs text-slate-500">Integrate background jobs, webhooks, or ERP synchronization.</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    + Generate Key
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Production ERP Ingestion Key</span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Active</span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-1">pk_live_8f39a0...92b1</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Created on Jun 12, 2026 • Last used 2 hours ago</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded transition-colors"
                    >
                      Revoke
                    </button>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Staging Courier Webhook Key</span>
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Test Mode</span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-1">pk_test_12e4c9...71f0</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Created on Jul 04, 2026 • Last used yesterday</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">Email & Alert Preferences</h3>
                  <p className="text-xs text-slate-500">Choose when and how you receive workspace alerts.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Campaign Performance Summaries', desc: 'Receive weekly email reports on conversion rates and reach.' },
                    { title: 'API & Webhook Failure Alerts', desc: 'Instant email notifications if database sync pipelines fail.' },
                    { title: 'New System Security Logins', desc: 'Get alerted whenever a new device logs into your account.' },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">{item.title}</span>
                        <span className="text-xs text-slate-500">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  ✓ Profile preferences saved successfully!
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Unsaved changes will be discarded on navigation.
                </span>
              )}

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}