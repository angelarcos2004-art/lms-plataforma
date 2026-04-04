import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = cargando | null = sin sesión | objeto = sesión activa
  const [session, setSession] = useState(undefined)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(undefined)
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false)

  useEffect(() => {
    // Leer sesión existente al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    // Escuchar cambios de sesión en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveringPassword(true)
        }
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          // Si había un perfil null (de un cierre de sesión previo o inicio fresco), forzamos undefined
          setProfile(undefined) 
          fetchProfile(session.user.id)
        }
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('id', userId)
      .single()
    setProfile(data || null)
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signInWithPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, nombre) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    setIsRecoveringPassword(false)
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, isRecoveringPassword,
      signInWithGoogle, signInWithPassword, signUp, signOut,
      resetPassword, updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
