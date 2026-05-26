import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, AlertCircle, CheckCircle } from 'lucide-react'

const ROLES = ['customer','staff','manager','admin']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username:'', email:'', password:'', role:'customer' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/auth/signup', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      setSuccess(data.message)
      setTimeout(() => navigate('/login'), 1800)
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-12"
         style={{background:'var(--dark-bg)'}}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
             style={{background:'radial-gradient(circle, var(--cinema-red) 0%, transparent 70%)'}} />
      </div>

      <div className="relative w-full max-w-sm fade-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
               style={{background:'var(--gold)'}}>
            <Film size={24} color="#0a0a0f" />
          </div>
          <h1 className="font-display text-4xl tracking-widest" style={{color:'var(--gold)'}}>CINEMA+</h1>
          <p className="text-gray-500 text-sm mt-2">Create your account</p>
        </div>

        <div className="card-dark rounded-xl p-8">
          {error   && <div className="flex items-center gap-2 text-red-400 text-sm mb-5 p-3 rounded-lg bg-red-400/10 border border-red-400/20"><AlertCircle size={14}/>{error}</div>}
          {success && <div className="flex items-center gap-2 text-green-400 text-sm mb-5 p-3 rounded-lg bg-green-400/10 border border-green-400/20"><CheckCircle size={14}/>{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              {key:'username', label:'Username',      type:'text',     ph:'johndoe'},
              {key:'email',    label:'Email address', type:'email',    ph:'john@example.com'},
              {key:'password', label:'Password',      type:'password', ph:'••••••••'},
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{f.label}</label>
                <input className="input-dark w-full px-4 py-3 rounded-lg text-sm"
                       type={f.type} placeholder={f.ph}
                       value={form[f.key]}
                       onChange={e => setForm({...form, [f.key]:e.target.value})}
                       required />
              </div>
            ))}

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button"
                          onClick={() => setForm({...form, role:r})}
                          className={`py-2 rounded-lg text-xs uppercase tracking-widest border transition-all ${
                            form.role === r
                              ? 'border-yellow-500/60 text-yellow-400 bg-yellow-400/10'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                          style={{borderColor: form.role===r ? undefined : 'var(--dark-border)'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
                    className="btn-gold w-full py-3 rounded-lg text-sm uppercase tracking-widest disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already registered?{' '}
            <Link to="/login" className="hover:text-white transition-colors" style={{color:'var(--gold)'}}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
