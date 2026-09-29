import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../../api/auth'
import { Building2, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

type Step = 'email' | 'reset' | 'done'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await forgotPassword(email)
      setDevOtp(result.dev_otp ?? null)
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    try {
      await resetPassword({ email, otp, new_password: newPassword })
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-white">Dealer Desk</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {step === 'email' && (
            <>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Reset your password</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
                Enter your account email and we'll send a 6-digit verification code.
              </p>
              {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                  <input
                    type="email" required autoComplete="email" placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit" disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {submitting ? 'Sending…' : 'Send Verification Code'}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Enter your code</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-1">
                If an account exists for <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>, a code has been sent. It expires in 10 minutes.
              </p>
              {devOtp && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-3 mb-1">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">DEV ONLY</span> — no email provider is configured yet, so here's the code directly: <span className="font-mono font-bold">{devOtp}</span>
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
              <form onSubmit={handleReset} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Verification code</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6} required placeholder="123456"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.5em] font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm new password</label>
                  <input
                    type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit" disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setStep('email')} className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  Use a different email
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Password reset</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
                You can now sign in with your new password. You've been signed out everywhere else for security.
              </p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        {step !== 'done' && (
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mt-5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
        )}
      </div>
    </div>
  )
}
