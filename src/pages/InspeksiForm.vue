<template>
  <div class="container">
    <h1 class="page-title">Formulir Inspeksi Baru</h1>

    <form @submit.prevent="submitInspection" class="inspection-form">
      <div class="form-group">
        <label for="date">Tanggal Inspeksi <span class="required-star">*</span>:</label>
        <input 
          type="date" 
          v-model="inspectionDate" 
          id="date" 
          required 
          class="form-input" 
        />
      </div>

      <div class="form-group">
        <label for="type">Jenis Inspeksi <span class="required-star">*</span>:</label>
        <select v-model="inspectionType" id="type" required class="form-select">
          <option disabled value="">Pilih jenis inspeksi</option>
          <option 
            v-for="type in inspectionTypes" 
            :key="type" 
            :value="type"
          >
            {{ type }}
          </option>
        </select>
      </div>

      <button type="submit" :disabled="loading" class="submit-button">
        <span v-if="loading">Menyimpan...</span>
        <span v-else>Mulai Inspeksi</span>
      </button>
    </form>

    <p v-if="error" class="message error-message">{{ error }}</p>
    <p v-if="success" class="message success-message">{{ success }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

const inspectionDate = ref('')
const inspectionType = ref('')
const inspectionTypes = ['KONSTRUKSI', 'PERILAKU', 'INSIDEN', 'UTILITAS', 'PROTEKSI']
const loading = ref(false)
const error = ref('')
const success = ref('')

const auth = useAuthStore()
const router = useRouter()

const submitInspection = async () => {
  if (!inspectionDate.value || !inspectionType.value) {
    error.value = 'Semua field harus diisi'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const { data, error: supError } = await supabase
      .from('inspections')
      .insert([
        {
          user_id: auth.user.id,
          inspection_date: inspectionDate.value,
          inspection_type: inspectionType.value
        }
      ])
      .select() // supaya data hasil insert dikembalikan

    if (supError) throw supError

    success.value = 'Inspeksi berhasil dibuat!'
    inspectionDate.value = ''
    inspectionType.value = ''

    // redirect ke halaman tambah temuan (future)
    router.push(`/inspeksi/${data[0].id}/findings`)

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Color Palette Consistency */
/* Soft Pink: #F7B8C4 (Accent Light) */
/* Dusty Rose: #E8A2AD (Accent Medium) */
/* Deep Violet/Navy: #3F3A5A (Text/Primary) */
/* Background: #FAFAFA */

.container {
  max-width: 450px;
  margin: 0 auto;
  padding: 30px;
  background-color: white; /* Clean background for the form box */
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-top: 5px solid #E8A2AD; /* Dusty Rose accent top border */
}

.page-title {
  text-align: center;
  color: #3F3A5A;
  margin-bottom: 30px;
  font-weight: 600;
  font-size: 1.8rem;
}

.inspection-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* --- Form Group & Labels --- */

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #3F3A5A;
  margin-bottom: 8px;
  font-size: 1.05rem;
}

.required-star {
  color: #E8A2AD;
  font-weight: bold;
}

/* --- Input Fields --- */

.form-input,
.form-select {
  padding: 12px;
  border: 1px solid #CCCCCC;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #fcfcfc;
  appearance: none; /* Remove default styling for select on some browsers */
  cursor: pointer;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-input:focus,
.form-select:focus {
  border-color: #F7B8C4;
  box-shadow: 0 0 0 3px rgba(247, 184, 196, 0.4);
  outline: none;
}

.form-select {
  /* Add custom arrow for select box (professional look) */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="%233F3A5A" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 12px top 50%;
  padding-right: 30px; /* Space for the custom arrow */
}


/* --- Submit Button --- */

.submit-button {
  padding: 14px 20px;
  background-color: #3F3A5A; /* Deep accent color for primary action */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, opacity 0.3s;
  margin-top: 15px;
}

.submit-button:hover:not(:disabled) {
  background-color: #554f73;
}

.submit-button:disabled {
  background-color: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.7;
}

/* --- Messages --- */

.message {
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-weight: 500;
}

.error-message {
  background-color: #ffe0e6;
  color: #c0392b;
  border: 1px solid #f9909c;
}

.success-message {
  background-color: #e6ffe0;
  color: #27ae60;
  border: 1px solid #90f99c;
}
</style>