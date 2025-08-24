<template>
  <div class="login-page-container">
    <div class="login-card">
      <h1 class="page-title">Selamat Datang!</h1>
      <p class="subtitle">Masuk ke Dashboard Inspeksi</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input 
            v-model="email" 
            type="email" 
            placeholder="Alamat Email" 
            required 
            class="form-input"
          />
        </div>

        <div class="form-group">
          <input 
            v-model="password" 
            type="password" 
            placeholder="Kata Sandi" 
            required 
            class="form-input" 
          />
        </div>
        
        <button type="submit" :disabled="loading" class="submit-button">
          {{ loading ? 'Memproses...' : 'Login' }}
        </button>
      </form>

      <p v-if="error" class="message error-message">{{ error }}</p>
      
      <div class="footer-note">
        <p>Aplikasi Audit & Inspeksi</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  try {
    await auth.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
/* Color Palette Consistency */
/* Soft Pink: #F7B8C4 (Accent Light) */
/* Dusty Rose: #E8A2AD (Accent Medium) */
/* Deep Violet/Navy: #3F3A5A (Text/Primary) */
/* Background: #FAFAFA */

.login-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* Full screen height */
  background-color: #FAFAFA; /* Light background */
}

.login-card {
  max-width: 400px;
  width: 90%;
  padding: 40px 30px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  border-top: 5px solid #E8A2AD; /* Dusty Rose accent */
}

.page-title {
  color: #3F3A5A;
  margin-bottom: 5px;
  font-weight: 700;
  font-size: 2rem;
}

.subtitle {
    color: #888;
    margin-bottom: 30px;
    font-size: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* --- Form Elements --- */

.form-group {
    width: 100%;
}

.form-input {
  width: 100%;
  padding: 14px 15px;
  border: 1px solid #CCCCCC;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #fcfcfc;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-input::placeholder {
    color: #aaa;
}

.form-input:focus {
  border-color: #F7B8C4;
  box-shadow: 0 0 0 3px rgba(247, 184, 196, 0.4);
  outline: none;
}

/* --- Submit Button --- */

.submit-button {
  width: 100%;
  padding: 15px;
  background-color: #3F3A5A; /* Deep accent color */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, opacity 0.3s;
  margin-top: 10px;
}

.submit-button:hover:not(:disabled) {
  background-color: #554f73;
}

.submit-button:disabled {
  background-color: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.7;
}

/* --- Error Message --- */

.message {
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-weight: 500;
}

.error-message {
  background-color: #ffe0e6; /* Light pink/red error background */
  color: #c0392b;
  border: 1px solid #f9909c;
}

.footer-note {
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.footer-note p {
    font-size: 0.85rem;
    color: #999;
}
</style>
