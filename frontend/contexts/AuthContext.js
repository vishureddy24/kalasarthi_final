"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext({})

// Lazy load Firebase only when needed
let firebaseAuth = null
let firebaseApp = null

async function getFirebaseAuth() {
  if (firebaseAuth) return { auth: firebaseAuth, app: firebaseApp }
  
  // Import Firebase modules
  const [{ initializeApp, getApps, getApp }, { getAuth }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth')
  ])
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  
  firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  firebaseAuth = getAuth(firebaseApp)
  
  return { auth: firebaseAuth, app: firebaseApp }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  // Fetch profile in BACKGROUND - don't block auth flow
  const fetchProfile = useCallback(async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken()
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data.profile)
        return data.profile
      }
      setUserProfile(null)
      return null
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setUserProfile(null)
      return null
    }
  }, [])

  // 🔥 OPTIMIZED: Load Firebase dynamically on mount
  useEffect(() => {
    let timeoutId
    let unsubscribe = null

    async function initAuth() {
      const { auth } = await getFirebaseAuth()
      const firebaseAuthModule = await import('firebase/auth')
      
      unsubscribe = firebaseAuthModule.onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser)
          fetchProfile(firebaseUser)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
        setAuthReady(true)
      })
    }

    initAuth()

    // SAFETY: Force loading off after 3 seconds max
    timeoutId = setTimeout(() => {
      setLoading(false)
      setAuthReady(true)
    }, 3000)

    return () => {
      if (unsubscribe) unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [fetchProfile])

  const login = async (email, password) => {
    const { auth } = await getFirebaseAuth()
    const firebaseAuthModule = await import('firebase/auth')
    const result = await firebaseAuthModule.signInWithEmailAndPassword(auth, email, password)
    return result
  }

  const register = async (email, password, displayName) => {
    const { auth } = await getFirebaseAuth()
    const firebaseAuthModule = await import('firebase/auth')
    const result = await firebaseAuthModule.createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await firebaseAuthModule.updateProfile(result.user, { displayName })
    }
    return result
  }

  const demoLogin = async () => {
    const { auth } = await getFirebaseAuth()
    const firebaseAuthModule = await import('firebase/auth')
    const email = 'demo@kalasarthi.com'
    const password = 'Demo@123456'
    try {
      return await firebaseAuthModule.signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const result = await firebaseAuthModule.createUserWithEmailAndPassword(auth, email, password)
        await firebaseAuthModule.updateProfile(result.user, { displayName: 'Demo User' })
        return result
      }
      throw err
    }
  }

  const logout = async () => {
    try {
      const { auth } = await getFirebaseAuth()
      const firebaseAuthModule = await import('firebase/auth')
      if (auth && firebaseAuthModule.signOut) {
        await firebaseAuthModule.signOut(auth)
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
    setUser(null)
    setUserProfile(null)
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      return fetchProfile(user)
    }
    return null
  }, [user, fetchProfile])

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      login,
      register,
      demoLogin,
      logout,
      refreshProfile,
      isAuthenticated: !!user,
      isOnboarded: userProfile?.isOnboarded || false,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
