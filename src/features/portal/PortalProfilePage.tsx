import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { useMyProfile, useUpdateMyProfile, useChangeMyPassword } from '../../hooks/usePortal'
import Spinner from '../../components/loaders/Spinner'
import Alert from '../../components/alerts/Alert'
import { useUiStore } from '../../stores/uiStore'

export default function PortalProfilePage() {
  const { data: dealer, isLoading, isError } = useMyProfile()
  const updateProfile = useUpdateMyProfile()
  const changePassword = useChangeMyPassword()
  const addToast = useUiStore((s) => s.addToast)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwError, setPwError] = useState<string | null>(null)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError || !dealer) return <Alert type="danger" message="Failed to load your profile." />

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    updateProfile.mutate({
      display_name: String(fd.get('display_name') || ''),
      phone_primary: String(fd.get('phone_primary') || ''),
      whatsapp_phone: String(fd.get('whatsapp_phone') || ''),
      city: String(fd.get('city') || ''),
      state_normalized: String(fd.get('state_normalized') || ''),
    }, {
      onSuccess: () => addToast('Profile updated', 'success'),
      onError: () => addToast('Failed to update profile', 'error'),
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    if (pwForm.new_password !== pwForm.confirm) { setPwError('New passwords do not match.'); return }
    changePassword.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password }, {
      onSuccess: () => { addToast('Password changed', 'success'); setPwForm({ current_password: '', new_password: '', confirm: '' }) },
      onError: () => setPwError('Current password is incorrect.'),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500">Your dealer account information</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">{dealer.name}</p>
            <p className="text-xs font-mono text-slate-400">{dealer.code}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Display Name</label>
            <input name="display_name" defaultValue={dealer.display_name} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Phone</label>
              <input name="phone_primary" defaultValue={dealer.phone_primary} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">WhatsApp</label>
              <input name="whatsapp_phone" defaultValue={dealer.whatsapp_phone} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">City</label>
              <input name="city" defaultValue={dealer.city} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">State</label>
              <input name="state_normalized" defaultValue={dealer.state_normalized} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
            <div>
              <p className="text-xs text-slate-400">Tier</p>
              <p className="text-slate-600">{dealer.tier_name} <span className="text-xs text-slate-400">(set by staff)</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Territory</p>
              <p className="text-slate-600">{dealer.territory_name} <span className="text-xs text-slate-400">(set by staff)</span></p>
            </div>
          </div>
          <button type="submit" disabled={updateProfile.isPending} className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          <input
            type="password" placeholder="Current password" required
            value={pwForm.current_password} onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password" placeholder="New password" required minLength={8}
            value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password" placeholder="Confirm new password" required minLength={8}
            value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={changePassword.isPending} className="w-full bg-slate-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-slate-900 disabled:opacity-50">
            {changePassword.isPending ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
