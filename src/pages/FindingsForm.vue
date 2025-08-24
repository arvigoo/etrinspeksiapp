<template>
  <div class="container">
    <h1 class="page-title">Tambah Temuan</h1>

    <form @submit.prevent="submitFinding" class="finding-form">
      <div class="form-group">
        <label for="location">Lokasi Temuan <span class="required-star">*</span></label>
        <input type="text" id="location" v-model="location" required class="form-input" placeholder="Contoh: Area Produksi Lantai 3"/>
      </div>

      <div class="form-group">
        <label for="finding">Deskripsi Temuan <span class="required-star">*</span></label>
        <textarea id="finding" v-model="finding" required class="form-textarea" rows="4" placeholder="Jelaskan temuan secara detail dan faktual"></textarea>
      </div>

      <div class="form-group">
        <label for="hazardRisk">Bahaya/Risiko</label>
        <input type="text" id="hazardRisk" v-model="hazardRisk" class="form-input" placeholder="Contoh: Risiko tersandung dan jatuh"/>
      </div>

      <div class="form-group">
        <label for="recommendation">Rekomendasi</label>
        <input type="text" id="recommendation" v-model="recommendation" class="form-input" placeholder="Saran perbaikan atau tindakan korektif"/>
      </div>

      <div class="form-group">
        <label>Foto Temuan (maksimal 4)</label>
        <p class="file-info">Bisa langsung gunakan kamera di HP Anda.</p>
        <input type="file"
               multiple
               accept="image/*"
               capture="environment"
               @change="handleFiles"
               class="file-input-hidden"
               id="file-upload-input"/>
        <label for="file-upload-input" class="file-upload-button">
          Pilih/Ambil Foto
        </label>
      </div>

      <div class="preview-container" v-if="previews.length">
        <div v-for="(src, i) in previews" :key="i" class="preview-item">
          <img :src="src" alt="Foto Temuan" class="preview-image" />
        </div>
      </div>

      <button type="submit" :disabled="loading" class="submit-button">
        <span v-if="loading">Menyimpan...</span>
        <span v-else>Submit Temuan</span>
      </button>
    </form>

    <p v-if="error" class="message error-message">{{ error }}</p>
    <p v-if="success" class="message success-message">{{ success }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import imageCompression from 'browser-image-compression'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const inspectionId = route.params.id

const location = ref('')
const finding = ref('')
const hazardRisk = ref('')
const recommendation = ref('')
const files = ref([])
const previews = ref([])

const loading = ref(false)
const error = ref('')
const success = ref('')

// Kompres file sebelum preview & upload
const compressFile = async (file) => {
  return await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true
  })
}

// Ambil file input & generate preview
const handleFiles = async (event) => {
  const selectedFiles = Array.from(event.target.files).slice(0, 4)
  files.value = []
  previews.value = []

  for (const f of selectedFiles) {
    const compressed = await compressFile(f)
    files.value.push(compressed)
    previews.value.push(URL.createObjectURL(compressed))
  }
}

const submitFinding = async () => {
  if (!location.value || !finding.value) {
    error.value = 'Lokasi dan deskripsi temuan wajib diisi'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // 1️⃣ Insert ke tabel findings
    const { data: findingData, error: findingErr } = await supabase
      .from('findings')
      .insert([{
        inspection_id: inspectionId,
        location: location.value,
        finding: finding.value,
        hazard_risk: hazardRisk.value,
        recommendation: recommendation.value
      }])
      .select()

    if (findingErr) throw findingErr
    const findingId = findingData[0].id

    // 2️⃣ Upload foto & simpan metadata
    for (const file of files.value) {
      const ext = file.name.split('.').pop()
      const fileName = `${auth.user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) throw uploadErr

      // Masukkan path (bukan publicUrl) ke DB
      await supabase.from('finding_photos').insert([{
        finding_id: findingId,
        storage_path: fileName,
        width: file.width || null,
        height: file.height || null,
        bytes: file.size
      }])
    }

    success.value = 'Temuan berhasil ditambahkan!'
    location.value = ''
    finding.value = ''
    hazardRisk.value = ''
    recommendation.value = ''
    files.value = []
    previews.value = []

    router.push(`/inspeksi/${inspectionId}/listfindings`)

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
/* Color Palette */
/* Soft Pink: #F7B8C4 (Light/Primary) */
/* Dusty Rose: #E8A2AD (Darker Pink/Accent) */
/* Deep Violet/Navy: #3F3A5A (Text/Strong Accent) */
/* Background: #FAFAFA */
/* Neutral: #CCCCCC */

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #FAFAFA; /* Light background */
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.page-title {
  text-align: center;
  color: #3F3A5A;
  margin-bottom: 30px;
  font-weight: 600;
  border-bottom: 2px solid #F7B8C4; /* Soft pink underline */
  padding-bottom: 10px;
}

.finding-form {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Space between form groups */
}

/* --- Form Elements --- */

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
  color: #E8A2AD; /* Dusty Rose for required fields */
  font-weight: bold;
}

.form-input,
.form-textarea {
  padding: 12px;
  border: 1px solid #CCCCCC;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: white;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #F7B8C4; /* Soft pink focus */
  box-shadow: 0 0 0 3px rgba(247, 184, 196, 0.4); /* Pink glow */
  outline: none;
}

.form-textarea {
  resize: vertical;
}

/* --- File Input --- */

.file-info {
  font-size: 0.9rem;
  color: #666;
  margin-top: -5px;
  margin-bottom: 10px;
}

.file-input-hidden {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}

.file-upload-button {
  display: inline-block;
  padding: 10px 15px;
  background-color: #E8A2AD; /* Dusty Rose button */
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-align: center;
  transition: background-color 0.3s, transform 0.1s;
}

.file-upload-button:hover {
  background-color: #d1929d; /* Slightly darker hover */
}

/* --- Image Preview --- */

.preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  justify-content: flex-start;
}

.preview-item {
  width: calc(50% - 5px); /* Max two per row on smaller screens */
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

@media (min-width: 480px) {
  .preview-item {
    width: calc(25% - 7.5px); /* Four per row on wider screens */
  }
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

/* --- Messages --- */

.message {
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-weight: 500;
}

.error-message {
  background-color: #ffe0e6; /* Light pink/red background for error */
  color: #c0392b; /* Deep red text */
  border: 1px solid #f9909c;
}

.success-message {
  background-color: #e6ffe0; /* Light green for success (standard practice) */
  color: #27ae60;
  border: 1px solid #90f99c;
}
</style>