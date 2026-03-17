'use client'

interface AdvisorProfile {
  name: string
  specialty?: string | null
  bio?: string | null
  communication_style?: string | null
  specialties_tags?: string[] | null
  industries_tags?: string[] | null
  experience?: string[] | null
  // For specialists/ICPs (non-advisor catalog entries)
  justification?: string
  archetype?: string
  demographics?: string
  quote?: string
}

interface Props {
  profile: AdvisorProfile | null
  isOpen: boolean
  onClose: () => void
  type?: 'advisor' | 'specialist' | 'persona'
}

export default function AdvisorProfileDrawer({ profile, isOpen, onClose, type = 'advisor' }: Props) {
  if (!isOpen || !profile) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[400px] h-full bg-[#0D1535] border-l border-[#1E2A4A] p-6 overflow-y-auto flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8892A4] hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div>
          <h2 className="text-[18px] font-outfit font-bold text-white pr-6">{profile.name}</h2>
          {profile.specialty && (
            <p className="text-sm text-[#B8860B] mt-0.5">{profile.specialty}</p>
          )}
          {profile.archetype && (
            <p className="text-xs text-[#8892A4] mt-1">{profile.archetype}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Sobre este consejero</p>
            <p className="text-sm text-[#e0e0e5] leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Justification (specialists) */}
        {profile.justification && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Por qué es relevante</p>
            <p className="text-sm text-[#e0e0e5] leading-relaxed">{profile.justification}</p>
          </div>
        )}

        {/* Demographics (personas) */}
        {profile.demographics && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Perfil demográfico</p>
            <p className="text-sm text-[#e0e0e5] leading-relaxed">{profile.demographics}</p>
          </div>
        )}

        {/* Quote (personas) */}
        {profile.quote && (
          <div className="bg-[#0A1128] border border-[#B8860B]/20 rounded-lg px-4 py-3">
            <p className="text-sm text-[#B8860B]/80 italic leading-relaxed">{profile.quote}</p>
          </div>
        )}

        {/* Communication style */}
        {profile.communication_style && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Estilo de comunicación</p>
            <p className="text-sm text-[#F8F8F8] italic">"{profile.communication_style}"</p>
          </div>
        )}

        {/* Specialties */}
        {profile.specialties_tags && profile.specialties_tags.length > 0 && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">Especialidades</p>
            <div className="flex flex-wrap gap-2">
              {profile.specialties_tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 text-xs bg-[#1E2A4A] text-[#8892A4] rounded">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Industries */}
        {profile.industries_tags && profile.industries_tags.length > 0 && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">Industrias</p>
            <div className="flex flex-wrap gap-2">
              {profile.industries_tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 text-xs bg-[#1E2A4A] text-[#8892A4] rounded">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience && profile.experience.length > 0 && (
          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">Experiencia</p>
            <ul className="space-y-1.5">
              {profile.experience.map((exp: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-[#8892A4]">
                  <span className="text-[#B8860B] shrink-0 mt-0.5">·</span>
                  {exp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {type === 'advisor' && !profile.bio && !profile.communication_style && (
          <p className="text-sm text-[#4A5568] italic">Perfil completo próximamente.</p>
        )}
      </div>
    </div>
  )
}
