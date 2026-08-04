import { useEffect, useState } from 'react'
import { X, MapPin, Calendar, Clock, UserRound, CheckCircle2 } from 'lucide-react'
import { fetchActivityById, submitRegistration } from './registrationService'
import type { PublicActivity } from './publicActivityService'
import type { RegistrationFormData } from './registrationService'
import { getProvinces, getCities, getBarangays } from './region11Data'

const YOUTH_CLASSES = ['In-School Youth', 'Out-of-School Youth', 'Working Youth', 'Person with Disability (PWD Youth)']
const SECTORAL_GROUPS = ['Indigenous People', 'LGBTQIA+', 'Solo Parent', 'Youth with Disability', 'None']

const emptyForm: RegistrationFormData = {
  firstName: '', middleName: '', lastName: '', suffix: '',
  age: '', genderIdentity: '', street: '', province: '', city: '', barangay: '',
  contact: '', org: '', youthClass: '', sectoral: '',
}

interface Props {
  activityId: string
  onClose: () => void
}

function ActivityModal({ activityId, onClose }: Props) {
  const [activity, setActivity] = useState<PublicActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refCode, setRefCode] = useState('')

  const provinces = getProvinces()
  const cities = form.province ? getCities(form.province) : []
  const barangays = form.province && form.city ? getBarangays(form.province, form.city) : []

  useEffect(() => {
    load(activityId)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [activityId])

  async function load(id: string) {
    setLoading(true)
    const data = await fetchActivityById(id)
    setActivity(data)
    setLoading(false)
  }

  function setField(key: keyof RegistrationFormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'province') {
        next.city = ''
        next.barangay = ''
      }
      if (key === 'city') next.barangay = ''
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!activity) return

    if (!form.firstName.trim()) return setFormError('First Name is required.')
    if (!form.lastName.trim()) return setFormError('Last Name is required.')
    const age = parseInt(form.age, 10)
    if (!form.age || isNaN(age) || age < 15 || age > 30) return setFormError('Age must be between 15 and 30.')
    if (!form.genderIdentity) return setFormError('Gender Identity is required.')
    if (!form.street.trim()) return setFormError('House No. / Street is required.')
    if (!form.province.trim()) return setFormError('Province / Area is required.')
    if (!form.city.trim()) return setFormError('City / Municipality is required.')
    if (!form.barangay.trim()) return setFormError('Barangay is required.')
    if (!/^09\d{9}$/.test(form.contact)) return setFormError('A valid Philippine mobile number is required (09XXXXXXXXX).')
    if (!form.youthClass) return setFormError('Please select a Youth Classification.')

    setSubmitting(true)
    const result = await submitRegistration(activity, form)
    setSubmitting(false)

    if (!result.ok) {
      setFormError(result.error || 'Registration failed.')
      return
    }
    setRefCode(result.refCode || '')
  }

  const open = activity ? Math.max(0, activity.slots - activity.taken) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-500 hover:text-gray-800"
        >
          <X size={16} />
        </button>

        {loading ? (
          <div className="py-24 text-center text-gray-400">Loading…</div>
        ) : !activity ? (
          <div className="py-24 text-center text-gray-400">Activity not found.</div>
        ) : refCode ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-primary" />
            <h1 className="text-xl font-bold text-gray-900 mb-1">You're Registered!</h1>
            <p className="text-sm text-gray-500 mb-6">{activity.title}</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="text-xs text-gray-500 mb-1">Your Reference Code</div>
              <div className="text-2xl font-bold text-primary tracking-wider">{refCode}</div>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Save this code — you'll need it to check in / mark attendance on the activity day.
            </p>
            <button onClick={onClose} className="w-full btn-primary py-2.5">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="h-28 relative" style={{ backgroundColor: activity.colorBg || '#1a5c3a' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            </div>
            <div className="p-6">
              <div className="text-[11px] font-bold uppercase tracking-wide text-primary mb-1.5">{activity.programName}</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{activity.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> {activity.date}</span>
                {activity.time && <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {activity.time}</span>}
                <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {activity.venue}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{activity.previewDesc}</p>

              {!showForm && activity.fullDesc && (
                <p className="text-sm text-gray-500 mb-4 italic">Full details unlock after you register.</p>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500 mb-5">
                <span>{open <= 0 ? 'Full' : `${open} slot${open === 1 ? '' : 's'} left`}</span>
                <span>{activity.taken}/{activity.slots} registered</span>
              </div>

              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  disabled={open <= 0}
                  className="w-full btn-primary py-2.5 disabled:opacity-40"
                >
                  {open <= 0 ? 'Activity Full' : 'Register Now'}
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 mt-4 border-t border-gray-100 pt-5">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2"><UserRound size={16} /> Your Information</h2>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name *"><input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className="input" /></Field>
                    <Field label="Middle Name"><input value={form.middleName} onChange={(e) => setField('middleName', e.target.value)} className="input" /></Field>
                    <Field label="Last Name *"><input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className="input" /></Field>
                    <Field label="Suffix"><input value={form.suffix} onChange={(e) => setField('suffix', e.target.value)} className="input" placeholder="Jr., III, etc." /></Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Age * (15-30)"><input type="number" min={15} max={30} value={form.age} onChange={(e) => setField('age', e.target.value)} className="input" /></Field>
                    <Field label="Gender Identity *">
                      <select value={form.genderIdentity} onChange={(e) => setField('genderIdentity', e.target.value)} className="input">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="House No. / Street *"><input value={form.street} onChange={(e) => setField('street', e.target.value)} className="input" /></Field>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Province *">
                      <select value={form.province} onChange={(e) => setField('province', e.target.value)} className="input">
                        <option value="">Select</option>
                        {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                    <Field label="City / Municipality *">
                      <select value={form.city} onChange={(e) => setField('city', e.target.value)} className="input" disabled={!form.province}>
                        <option value="">{form.province ? 'Select' : 'Select province first'}</option>
                        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Barangay *">
                      <select value={form.barangay} onChange={(e) => setField('barangay', e.target.value)} className="input" disabled={!form.city}>
                        <option value="">{form.city ? 'Select' : 'Select city first'}</option>
                        {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Mobile Number * (09XXXXXXXXX)"><input value={form.contact} onChange={(e) => setField('contact', e.target.value)} className="input" placeholder="09171234567" /></Field>
                  <Field label="Organization (optional)"><input value={form.org} onChange={(e) => setField('org', e.target.value)} className="input" /></Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Youth Classification *">
                      <select value={form.youthClass} onChange={(e) => setField('youthClass', e.target.value)} className="input">
                        <option value="">Select</option>
                        {YOUTH_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Sectoral Group (optional)">
                      <select value={form.sectoral} onChange={(e) => setField('sectoral', e.target.value)} className="input">
                        <option value="">Select</option>
                        {SECTORAL_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                  </div>

                  {formError && <p className="text-sm text-red-500">⚠️ {formError}</p>}

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={submitting} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
                      {submitting ? 'Registering…' : 'Register Now'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-5 py-2.5">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export default ActivityModal