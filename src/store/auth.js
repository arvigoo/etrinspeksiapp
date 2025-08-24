import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null, // persist
    profile: JSON.parse(localStorage.getItem('profile')) || null
  }),
  actions: {
    async login({ email, password }) {
      const { data: userData, error: err } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (err) throw err
      this.user = userData.user
      localStorage.setItem('user', JSON.stringify(this.user))

      // Ambil profile username dari tabel profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single()

      if (profileErr) throw profileErr
      this.profile = profile
      localStorage.setItem('profile', JSON.stringify(profile))
    },

    logout() {
      supabase.auth.signOut()
      this.user = null
      this.profile = null
      localStorage.removeItem('user')
      localStorage.removeItem('profile')
    },

    async fetchUser() {
      const { data } = await supabase.auth.getUser()
      this.user = data.user
      localStorage.setItem('user', JSON.stringify(this.user))
    }
  }
})
