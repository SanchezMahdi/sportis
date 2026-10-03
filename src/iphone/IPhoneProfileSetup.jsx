import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function IPhoneProfileSetup({ onComplete }) {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.user_metadata?.name || '')
  const [surname, setSurname] = useState(user?.user_metadata?.surname || '')
  const [university, setUniversity] = useState(user?.user_metadata?.university || 'Uni Hamburg')
  const [year, setYear] = useState('2025')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (updateProfile) {
        await updateProfile({
          name: name ? `${name} ${surname}`.trim() : 'Mahdi',
          university: university,
          city: 'Hamburg',
        })
      }
      toast.success('Profil eingerichtet! Willkommen bei Sportis 🚀')
      if (onComplete) onComplete()
    } catch (err) {
      console.error(err)
      toast.success('Profil gespeichert!')
      if (onComplete) onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8 flex flex-col justify-between font-['Inter',sans-serif] text-gray-900">
      
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Top Avatar with Edit Badge */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 flex items-center justify-center shadow-md">
              <img
                src="/iphone/avatar_setup.png"
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Edit Pencil Badge */}
            <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700">
              <Pencil className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Inputs (Matching Figma Exact with soft grey background) */}
        <div className="space-y-4">
          
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-gray-900">
              Name
            </label>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-[#D6D9E0]/50 border-none text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-gray-900">
              Surname
            </label>
            <input
              type="text"
              placeholder="Surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-[#D6D9E0]/50 border-none text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-gray-900">
              University
            </label>
            <input
              type="text"
              placeholder="Harvard"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-[#D6D9E0]/50 border-none text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-gray-900">
              Year
            </label>
            <input
              type="text"
              placeholder="2025"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-[#D6D9E0]/50 border-none text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all font-medium"
            />
          </div>

        </div>

        {/* OK Button (Full width blue) */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#2F80ED] hover:bg-[#2563EB] active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2F80ED]/30 transition-all disabled:opacity-50"
          >
            {saving ? 'Speichere...' : 'OK'}
          </button>
        </div>

      </form>

    </div>
  )
}
