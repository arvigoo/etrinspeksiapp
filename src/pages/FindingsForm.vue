<template>
  <div class="container">
    <h1 class="page-title">Tambah Temuan</h1>

    <form @submit.prevent="submitFinding" class="finding-form">
      <!-- Lokasi -->
      <div class="form-group">
        <label for="location">Lokasi Temuan <span class="required-star">*</span></label>
        <input
          type="text"
          id="location"
          v-model="location"
          required
          class="form-input"
          placeholder="Contoh: Area Produksi Lantai 3"
        />
      </div>

      <!-- Deskripsi -->
      <div class="form-group">
        <label for="finding">Deskripsi Temuan <span class="required-star">*</span></label>
        <textarea
          id="finding"
          v-model="finding"
          required
          class="form-textarea"
          rows="4"
          placeholder="Jelaskan temuan secara detail dan faktual"
        ></textarea>
      </div>

      <!-- Bahaya -->
      <div class="form-group">
        <label for="hazardRisk">Bahaya/Risiko</label>
        <input
          type="text"
          id="hazardRisk"
          v-model="hazardRisk"
          class="form-input"
          placeholder="Contoh: Risiko tersandung dan jatuh"
        />
      </div>

      <!-- Rekomendasi -->
      <div class="form-group">
        <label for="recommendation">Rekomendasi</label>
        <input
          type="text"
          id="recommendation"
          v-model="recommendation"
          class="form-input"
          placeholder="Saran perbaikan atau tindakan korektif"
        />
      </div>

      <!-- Upload Foto -->
      <div class="form-group">
        <label>Foto Temuan (maksimal 4)</label>
        <p class="file-info">Anda bisa ambil foto langsung atau pilih dari galeri.</p>

        <!-- Input Kamera -->
        <input
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleFiles"
          class="file-input-hidden"
          id="file-upload-camera"
        />
        <label for="file-upload-camera" class="file-upload-button">
          📷 Ambil Foto
        </label>

        <!-- Input Galeri -->
        <input
          type="file"
          accept="image/*"
          multiple
          @change="handleFiles"
          class="file-input-hidden"
          id="file-upload-gallery"
        />
        <label for="file-upload-gallery" class="file-upload-button">
          🖼️ Pilih dari Galeri
        </label>
      </div>

      <!-- Preview Foto -->
      <div class="preview-container" v-if="previews.length">
        <div v-for="(src, i) in previews" :key="i" class="preview-item">
          <img :src="src" alt="Foto Temuan" class="preview-image" />
          <button type="button" class="remove-btn" @click="removePhoto(i)">❌</button>
        </div>
      </div>

      <!-- Submit -->
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
    useWebWorker: true,
  })
}

// Ambil file input & generate preview
// const handleFiles = async (event) => {
//   const selectedFiles = Array.from(event.target.files)

//   // Gabungkan dengan file yg sudah ada, lalu limit 4
//   const newFiles = [...files.value, ...selectedFiles].slice(0, 4)

//   files.value = []
//   previews.value = []

//   for (const f of newFiles) {
//     const compressed = await compressFile(f)
//     files.value.push(compressed)
//     previews.value.push(URL.createObjectURL(compressed))
//   }
// }

// Ambil file input & generate preview
const handleFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files);

    const newFiles = [...files.value, ...selectedFiles].slice(0, 4);

    previews.value.forEach(url => URL.revokeObjectURL(url));

    files.value = [];
    previews.value = [];
    error.value = ''; // Hapus pesan error sebelumnya

    for (const f of newFiles) {
        try {
            const compressed = await compressFile(f);
            files.value.push(compressed);
            previews.value.push(URL.createObjectURL(compressed));

        } catch (e) {
            error.value = `Gagal memproses foto: ${e.message}. Coba pilih ulang foto lain.`;
            
            break; 
        }
    }
    event.target.value = '';
    
    if (files.value.length > 0 && files.value.length < newFiles.length) {
         success.value = `Hanya ${files.value.length} foto yang berhasil ditambahkan. Batas maksimum 4 foto tercapai atau beberapa foto gagal diproses.`;
    }
};

// Hapus foto dari preview
const removePhoto = (index) => {
  files.value.splice(index, 1)
  previews.value.splice(index, 1)
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
    // Insert ke tabel findings
    const { data: findingData, error: findingErr } = await supabase
      .from('findings')
      .insert([
        {
          inspection_id: inspectionId,
          location: location.value,
          finding: finding.value,
          hazard_risk: hazardRisk.value,
          recommendation: recommendation.value,
        },
      ])
      .select()

    if (findingErr) throw findingErr
    const findingId = findingData[0].id

    // Upload foto & simpan metadata
    for (const file of files.value) {
      const ext = file.name.split('.').pop()
      const fileName = `${auth.user.id}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) throw uploadErr

      await supabase.from('finding_photos').insert([
        {
          finding_id: findingId,
          storage_path: fileName,
          bytes: file.size,
        },
      ])
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
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}
.page-title {
  text-align: center;
  color: #3f3a5a;
  margin-bottom: 30px;
  font-weight: 600;
  border-bottom: 2px solid #f7b8c4;
  padding-bottom: 10px;
}
.finding-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-weight: 500;
  color: #3f3a5a;
  margin-bottom: 8px;
  font-size: 1.05rem;
}
.required-star {
  color: #e8a2ad;
  font-weight: bold;
}
.form-input,
.form-textarea {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: white;
}
.form-input:focus,
.form-textarea:focus {
  border-color: #f7b8c4;
  box-shadow: 0 0 0 3px rgba(247, 184, 196, 0.4);
  outline: none;
}
.form-textarea {
  resize: vertical;
}
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
  background-color: #e8a2ad;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-align: center;
  margin-right: 10px;
}
.file-upload-button:hover {
  background-color: #d1929d;
}
.preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.preview-item {
  position: relative;
  width: calc(50% - 5px);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.preview-image {
  width: 100%;
  height: auto;
  display: block;
}
.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: 14px;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
}
@media (min-width: 480px) {
  .preview-item {
    width: calc(25% - 7.5px);
  }
}
.submit-button {
  padding: 14px 20px;
  background-color: #3f3a5a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
}
.submit-button:hover:not(:disabled) {
  background-color: #554f73;
}
.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}
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
