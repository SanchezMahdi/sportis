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

    // Filter to only columns that exist on the public.users table
    const allowedColumns = ['name', 'full_name', 'city', 'gender', 'sports', 'avatar_url', 'language']
    const dbUpdates = {}
    for (const key of allowedColumns) {
      if (updates[key] !== undefined) {
        dbUpdates[key] = updates[key]
      }
    }

    let updatedUserData = null
    if (Object.keys(dbUpdates).length > 0) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update(dbUpdates)
          .eq('id', user.id)
          .select(PROFILE_SELECT)
          .maybeSingle()

        if (!error && data) {
          updatedUserData = data
        }
      } catch (err) {
        console.warn('Fehler beim Aktualisieren der public.users Tabelle:', err)
      }
    }

    // Always synchronize user_metadata in auth.users
    const metaUpdates = {}
    if (updates.name !== undefined) metaUpdates.name = updates.name
    if (updates.full_name !== undefined) metaUpdates.full_name = updates.full_name
    if (updates.avatar_url !== undefined) metaUpdates.avatar_url = updates.avatar_url
    if (updates.city !== undefined) metaUpdates.city = updates.city
    if (updates.phone !== undefined) metaUpdates.phone = updates.phone
    if (updates.contactNumber !== undefined) metaUpdates.phone = updates.contactNumber

    if (Object.keys(metaUpdates).length > 0) {
      try {
        const { data: authData, error: authError } = await supabase.auth.updateUser({
          data: metaUpdates,
        })
        if (!authError && authData?.user) {
          setUser(authData.user)
        }
      } catch (err) {
        console.warn('Fehler beim Aktualisieren der Auth Metadaten:', err)
      }
    }

    return updatedUserData
  }

  const refreshUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        setUser(currentUser)
      }
    } catch {}
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshUser,
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
