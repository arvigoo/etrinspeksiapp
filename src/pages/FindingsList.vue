<template>
  <div class="container">
    <h1 class="page-title">Daftar Temuan Inspeksi</h1>

    <div class="loading-message" v-if="loading">
      <span class="spinner"></span> Memuat data temuan...
    </div>
    <p v-if="error" class="message error-message">{{ error }}</p>

    <div v-if="findings.length" class="findings-list">
      <div v-for="f in findings" :key="f.id" class="finding-card">
        <div class="card-header">
          <p class="card-location">
            <span class="icon">📍</span>
            <strong>Lokasi:</strong> {{ f.location }}
          </p>
        </div>

        <div class="card-body">
          <div class="detail-group">
            <p class="detail-label">Deskripsi:</p>
            <p class="detail-content">{{ f.finding }}</p>
          </div>

          <div class="detail-group">
            <p class="detail-label">Bahaya/Risiko:</p>
            <p class="detail-content hazard-risk">{{ f.hazard_risk || 'Belum diidentifikasi' }}</p>
          </div>

          <div class="detail-group">
            <p class="detail-label">Rekomendasi:</p>
            <p class="detail-content recommendation">{{ f.recommendation || 'Belum ada rekomendasi' }}</p>
          </div>
        </div>

        <div class="card-footer" v-if="f.photos && f.photos.length">
          <p class="photo-title"><span class="icon">📸</span> Bukti Foto:</p>
          <div class="photos-gallery">
            <img
              v-for="p in f.photos"
              :key="p.id"
              :src="p.signedUrl || ''"
              alt="Foto Temuan"
              class="finding-photo"
            />
          </div>
        </div>
      </div>
    </div>

    <p v-else-if="!loading" class="no-findings-message">
      Tidak ada temuan yang tercatat untuk inspeksi ini.
    </p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const auth = useAuthStore()
const inspectionId = route.params.id

const findings = ref([])
const loading = ref(false)
const error = ref('')

// Ambil temuan + generate signed URL untuk setiap foto
const fetchFindings = async () => {
  loading.value = true
  try {
    const { data, error: supError } = await supabase
      .from('findings')
      .select(`id, location, finding, hazard_risk, recommendation, finding_photos(*)`)
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true })

    if (supError) throw supError

    // Mapping + generate signed URL
    findings.value = await Promise.all(
      data.map(async f => {
        const photos = f.finding_photos || []

        // Ambil signed URL untuk setiap foto
        const photosWithUrl = await Promise.all(
          photos.map(async p => {
            if (!p.storage_path) return p
            const { data: signed, error: urlErr } = await supabase
              .storage
              .from('inspection-photos')
              .createSignedUrl(p.storage_path, 3600) // 1 jam
            if (urlErr) console.error(urlErr)
            return { ...p, signedUrl: signed?.signedUrl || '' }
          })
        )

        return { ...f, photos: photosWithUrl }
      })
    )
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchFindings)
</script>
<style scoped>
/* Color Palette */
/* Soft Pink: #F7B8C4 (Accent Light) */
/* Dusty Rose: #E8A2AD (Accent Medium) */
/* Deep Violet/Navy: #3F3A5A (Text/Primary) */
/* Background: #FAFAFA */

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #FAFAFA;
}

.page-title {
  text-align: center;
  color: #3F3A5A;
  margin-bottom: 30px;
  font-weight: 700;
  border-bottom: 3px solid #E8A2AD; /* Dusty Rose underline */
  padding-bottom: 15px;
}

/* --- Loading and Error Messages --- */

.loading-message {
  text-align: center;
  padding: 20px;
  color: #E8A2AD;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Simple Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #E8A2AD;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.no-findings-message {
  text-align: center;
  padding: 40px;
  color: #666;
  background-color: white;
  border: 1px dashed #CCCCCC;
  border-radius: 8px;
  margin-top: 20px;
}

/* --- Finding Card --- */

.finding-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
  overflow: hidden;
  border-left: 5px solid #F7B8C4; /* Soft pink border for highlight */
}

.card-header {
  padding: 15px 20px;
  background-color: #F7F7F7;
  border-bottom: 1px solid #eee;
}

.card-location {
  font-size: 1.15rem;
  color: #3F3A5A;
  font-weight: 600;
  margin: 0;
}

.icon {
  margin-right: 5px;
}

.card-body {
  padding: 20px;
}

.detail-group {
  margin-bottom: 15px;
}

.detail-label {
  font-weight: 600;
  color: #E8A2AD; /* Dusty Rose label */
  font-size: 0.95rem;
  margin: 0 0 4px 0;
  text-transform: uppercase;
}

.detail-content {
  color: #3F3A5A;
  margin: 0;
  line-height: 1.4;
}

.hazard-risk {
  font-style: italic;
  color: #cc0000; /* Red for emphasis on risk */
}

.recommendation {
  font-weight: 500;
  color: #008000; /* Green for solutions/recommendations */
}

/* --- Photos Gallery --- */

.card-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  background-color: #fcfcfc;
}

.photo-title {
  font-weight: 600;
  color: #3F3A5A;
  margin-bottom: 10px;
}

.photos-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.finding-photo {
  width: calc(50% - 5px); /* Max two per row on smaller screens */
  height: auto;
  border-radius: 6px;
  object-fit: cover;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.finding-photo:hover {
  transform: scale(1.02);
}

@media (min-width: 600px) {
  .finding-photo {
    width: calc(25% - 7.5px); /* Four per row on wider screens */
  }
}
</style>