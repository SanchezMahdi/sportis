import { createContext, useContext, useEffect, useState } from 'react'
import { getAuthRedirectUrl, isMissingSupabaseSchema, supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const PROFILE_SELECT = 'id, name, full_name, city, gender, sports, avatar_url, mvp_count, high_fives_received, sessions_played, reliability_score, win_loss_ratio, avg_rating, last_activity, created_at'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl('/login?confirmed=1'),
        data: {
          name: userData.name,
        },
      },
    })

    if (error) throw error

    // With email confirmation enabled there is no authenticated session yet.
    // In that case the database trigger creates the profile after auth.users insert.
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('users').upsert({
        id: data.user.id,
        email: email,
        name: userData.name,
        city: userData.city || null,
        gender: userData.gender || null,
        sports: userData.sports || [],
      })

      if (profileError) {
        if (isMissingSupabaseSchema(profileError)) {
          console.warn('Profil-Tabelle fehlt, Auth-Registrierung war dennoch erfolgreich:', profileError)
        } else {
          console.warn('Fehler beim Erstellen des Profils:', profileError)
        }
      }
    }

    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Nicht angemeldet')

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select(PROFILE_SELECT)
      .single()

    if (error) throw error

    if (updates.name !== undefined) {
      await supabase.auth.updateUser({ data: { name: updates.name } })
    }

    return data
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden')
  }
  return context
}
