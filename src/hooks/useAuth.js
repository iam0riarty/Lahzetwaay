import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Simple hash (for production use bcrypt via edge function)
export const simpleHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('lw_user')
    if (saved) setUser(JSON.parse(saved))
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const hash = simpleHash(password)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password_hash', hash)
      .single()
    if (error || !data) return { error: 'اسم المستخدم أو كلمة المرور غلط' }
    localStorage.setItem('lw_user', JSON.stringify(data))
    setUser(data)
    return { data }
  }

  const register = async (name, username, password) => {
    const hash = simpleHash(password)
    const { data, error } = await supabase
      .from('users')
      .insert({ name, username: username.toLowerCase(), password_hash: hash })
      .select()
      .single()
    if (error) return { error: error.code === '23505' ? 'الاسم ده موجود قبل كده' : 'حصل خطأ — حاول تاني' }
    localStorage.setItem('lw_user', JSON.stringify(data))
    setUser(data)
    return { data }
  }

  const logout = () => {
    localStorage.removeItem('lw_user')
    setUser(null)
  }

  const verifyCode = async (type) => {
    const { data } = await supabase
      .from('secret_codes')
      .select('code_value')
      .eq('code_type', type)
      .single()
    return data?.code_value
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, verifyCode }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
