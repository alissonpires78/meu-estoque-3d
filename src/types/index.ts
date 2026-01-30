export type UserRole = 'admin' | 'user' | 'readOnly'

export interface AppUser {
  uid: string
  email: string | null
  displayName: string | null
  role: UserRole
  approved: boolean
  createdAt?: { seconds: number }
}

export interface PendingUser {
  uid: string
  email: string
  displayName?: string
  createdAt: { seconds: number }
  status: 'pending' | 'approved' | 'rejected'
}
