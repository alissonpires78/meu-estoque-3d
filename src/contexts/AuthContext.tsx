import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { UserRole, AppUser } from '../types'

const USERS_COLLECTION = 'users'
const PENDING_USERS_COLLECTION = 'pendingUsers'

interface AuthContextValue {
  user: User | null
  appUser: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  hasRole: (role: UserRole) => boolean
  isAdmin: boolean
  canWrite: boolean
  canRead: boolean
  // Admin: pending users
  pendingUsers: Array<{ id: string; email: string; displayName?: string; createdAt: any }>
  approveUser: (uid: string, role: UserRole) => Promise<void>
  rejectUser: (uid: string) => Promise<void>
  sendApprovalLink: (uid: string, role: UserRole) => Promise<string>
  // Admin: user management
  allUsers: AppUser[]
  setUserRole: (uid: string, role: UserRole) => Promise<void>
  deleteUser: (uid: string) => Promise<void>
  refreshAppUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState<AuthContextValue['pendingUsers']>([])
  const [allUsers, setAllUsers] = useState<AppUser[]>([])

  const fetchAppUser = useCallback(async (uid: string): Promise<AppUser | null> => {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      uid: snap.id,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      role: (data.role as UserRole) ?? 'readOnly',
      approved: data.approved === true,
      createdAt: data.createdAt,
    }
  }, [])

  const refreshAppUser = useCallback(async () => {
    if (!user) {
      setAppUser(null)
      return
    }
    const au = await fetchAppUser(user.uid)
    setAppUser(au)
  }, [user, fetchAppUser])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const au = await fetchAppUser(firebaseUser.uid)
        setAppUser(au)
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [fetchAppUser])

  useEffect(() => {
    if (!appUser || appUser.role !== 'admin') return
    const load = async () => {
      const q = query(
        collection(db, PENDING_USERS_COLLECTION),
        where('status', '==', 'pending')
      )
      const snap = await getDocs(q)
      setPendingUsers(
        snap.docs.map((d) => ({
          id: d.id,
          email: d.data().email ?? '',
          displayName: d.data().displayName,
          createdAt: d.data().createdAt,
        }))
      )
    }
    load()
  }, [appUser])

  useEffect(() => {
    if (!appUser || appUser.role !== 'admin') return
    const load = async () => {
      const snap = await getDocs(collection(db, USERS_COLLECTION))
      setAllUsers(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            uid: d.id,
            email: data.email ?? null,
            displayName: data.displayName ?? null,
            role: (data.role as UserRole) ?? 'readOnly',
            approved: data.approved === true,
            createdAt: data.createdAt,
          }
        })
      )
    }
    load()
  }, [appUser, user])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), {
      email: cred.user.email,
      displayName: displayName ?? cred.user.displayName ?? null,
      role: 'readOnly',
      approved: false,
      createdAt: serverTimestamp(),
    })
    await setDoc(doc(db, PENDING_USERS_COLLECTION, cred.user.uid), {
      email: cred.user.email ?? email,
      displayName: displayName ?? null,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    if (cred.user.email) await sendEmailVerification(cred.user)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const hasRole = (role: UserRole): boolean => {
    if (!appUser || !appUser.approved) return false
    if (role === 'admin') return appUser.role === 'admin'
    if (role === 'user') return appUser.role === 'admin' || appUser.role === 'user'
    return true
  }

  const approveUser = async (uid: string, role: UserRole) => {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, { approved: true, role })
    const pendingRef = doc(db, PENDING_USERS_COLLECTION, uid)
    await updateDoc(pendingRef, { status: 'approved' })
    setPendingUsers((prev) => prev.filter((p) => p.id !== uid))
  }

  const rejectUser = async (uid: string) => {
    await updateDoc(doc(db, PENDING_USERS_COLLECTION, uid), { status: 'rejected' })
    setPendingUsers((prev) => prev.filter((p) => p.id !== uid))
  }

  const sendApprovalLink = async (uid: string, role: UserRole): Promise<string> => {
    await approveUser(uid, role)
    const baseUrl = window.location.origin
    return `${baseUrl}/auth/approve?uid=${uid}&role=${role}`
  }

  const setUserRole = async (uid: string, role: UserRole) => {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { role })
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role } : u))
    )
  }

  const deleteUser = async (uid: string) => {
    await deleteDoc(doc(db, USERS_COLLECTION, uid))
    setAllUsers((prev) => prev.filter((u) => u.uid !== uid))
  }

  const isAdmin = appUser?.role === 'admin' && appUser?.approved === true
  const canWrite = hasRole('user')
  const canRead = appUser?.approved === true

  const value: AuthContextValue = {
    user,
    appUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasRole,
    isAdmin,
    canWrite,
    canRead,
    pendingUsers,
    approveUser,
    rejectUser,
    sendApprovalLink,
    allUsers,
    setUserRole,
    deleteUser,
    refreshAppUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
