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
          <div class="header-content">
            <p class="card-location">
              <span class="icon">📍</span>
              <strong>Lokasi:</strong> {{ f.location }}
            </p>
            <div class="card-actions">
              <button @click="editFinding(f)" class="btn btn-edit">
                <span class="icon">✏️</span> Edit
              </button>
              <button @click="deleteFinding(f.id)" class="btn btn-delete">
                <span class="icon">🗑️</span> Hapus
              </button>
            </div>
          </div>
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

          <div class="detail-group">
            <p class="detail-label">Keterangan:</p>
            <p class="detail-content notes">{{ f.notes || 'Tidak ada keterangan' }}</p>
          </div>
        </div>

        <div class="card-footer" v-if="f.photos && f.photos.length">
          <p class="photo-title"><span class="icon">📸</span> Bukti Foto:</p>
          <div class="photos-gallery">
            <div v-for="p in f.photos" :key="p.id" class="photo-container">
              <img
                :src="p.signedUrl || ''"
                alt="Foto Temuan"
                class="finding-photo"
              />
              <button @click="deletePhoto(p.id, f.id)" class="delete-photo-btn">
                <span class="icon">❌</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-else-if="!loading" class="no-findings-message">
      Tidak ada temuan yang tercatat untuk inspeksi ini.
    </p>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Temuan</h2>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Lokasi:</label>
            <input v-model="editForm.location" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>Deskripsi:</label>
            <textarea v-model="editForm.finding" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>Bahaya/Risiko:</label>
            <textarea v-model="editForm.hazard_risk" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>Rekomendasi:</label>
            <textarea v-model="editForm.recommendation" class="form-textarea"></textarea>
          </div>

          <div class="form-group">
            <label>Keterangan:</label>
            <textarea v-model="editForm.notes" class="form-textarea" placeholder="Catatan tambahan..."></textarea>
          </div>
          <div class="form-group">
            <label>Tambah Foto Baru:</label>
            <input 
              ref="photoInput"
              type="file" 
              multiple 
              accept="image/*" 
              @change="handlePhotoUpload"
              class="form-input"
            />
            <div v-if="newPhotos.length" class="preview-photos">
              <div v-for="(photo, index) in newPhotos" :key="index" class="preview-item">
                <img :src="photo.preview" alt="Preview" class="preview-image" />
                <button @click="removeNewPhoto(index)" class="remove-preview-btn">❌</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn btn-cancel">Batal</button>
          <button @click="saveFinding" :disabled="saving" class="btn btn-save">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content confirmation-modal" @click.stop>
        <div class="modal-header">
          <h2>Konfirmasi Hapus</h2>
        </div>
        <div class="modal-body">
          <p>Apakah Anda yakin ingin menghapus temuan ini? Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-cancel">Batal</button>
          <button @click="confirmDelete" :disabled="deleting" class="btn btn-delete">
            {{ deleting ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
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

// Edit Modal
const showEditModal = ref(false)
const editForm = ref({
  id: null,
  location: '',
  finding: '',
  hazard_risk: '',
  recommendation: '',
  notes: '' 
})
const newPhotos = ref([])
const photoInput = ref(null)
const saving = ref(false)

// Delete Modal
const showDeleteModal = ref(false)
const findingToDelete = ref(null)
const deleting = ref(false)

// Ambil temuan + generate signed URL untuk setiap foto
const fetchFindings = async () => {
  loading.value = true
  try {
    const { data, error: supError } = await supabase
      .from('findings')
      .select(`id, location, finding, hazard_risk, recommendation, notes, finding_photos(*)`)
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

// Edit Finding
const editFinding = (finding) => {
  editForm.value = {
    id: finding.id,
    location: finding.location || '',
    finding: finding.finding || '',
    hazard_risk: finding.hazard_risk || '',
    recommendation: finding.recommendation || '',
    notes: finding.notes || ''
  }
  newPhotos.value = []
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = {
    id: null,
    location: '',
    finding: '',
    hazard_risk: '',
    recommendation: '',
    notes: ''
  }
  newPhotos.value = []
  if (photoInput.value) {
    photoInput.value.value = ''
  }
}

// Handle photo upload
const handlePhotoUpload = (event) => {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPhotos.value.push({
          file,
          preview: e.target.result,
          name: file.name
        })
      }
      reader.readAsDataURL(file)
    }
  })
}

const removeNewPhoto = (index) => {
  newPhotos.value.splice(index, 1)
}

// Save finding
const saveFinding = async () => {
  saving.value = true
  try {
    // Update finding data
    const { error: updateError } = await supabase
      .from('findings')
      .update({
        location: editForm.value.location,
        finding: editForm.value.finding,
        hazard_risk: editForm.value.hazard_risk,
        recommendation: editForm.value.recommendation,
        notes: editForm.value.notes
      })
      .eq('id', editForm.value.id)

    if (updateError) throw updateError

    // Upload new photos if any
    if (newPhotos.value.length > 0) {
      const userId = auth.user.id
      
      for (const photo of newPhotos.value) {
        // Generate UUID for filename
        const uuid = crypto.randomUUID()
        const fileExtension = photo.name.split('.').pop()
        
        // Follow storage policy path: {user_id}/{inspection_id}/{finding_id}/{uuid}.ext
        const filePath = `${userId}/${inspectionId}/${editForm.value.id}/${uuid}.${fileExtension}`
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('inspection-photos')
          .upload(filePath, photo.file)

        if (uploadError) throw uploadError

        // Save photo record
        const { error: photoError } = await supabase
          .from('finding_photos')
          .insert({
            finding_id: editForm.value.id,
            storage_path: uploadData.path,
            width: null, // You can get actual dimensions if needed
            height: null,
            bytes: photo.file.size
          })

        if (photoError) throw photoError
      }
    }

    // Refresh findings list
    await fetchFindings()
    closeEditModal()
    
  } catch (err) {
    error.value = 'Gagal menyimpan: ' + err.message
  } finally {
    saving.value = false
  }
}

// Delete photo
const deletePhoto = async (photoId, findingId) => {
  if (!confirm('Hapus foto ini?')) return

  try {
    // Get photo data first to delete from storage
    const { data: photoData, error: fetchError } = await supabase
      .from('finding_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    if (photoData.storage_path) {
      const { error: storageError } = await supabase
        .storage
        .from('inspection-photos')
        .remove([photoData.storage_path])

      if (storageError) console.error('Storage delete error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('finding_photos')
      .delete()
      .eq('id', photoId)

    if (dbError) throw dbError

    // Update local state
    const findingIndex = findings.value.findIndex(f => f.id === findingId)
    if (findingIndex !== -1) {
      findings.value[findingIndex].photos = findings.value[findingIndex].photos.filter(p => p.id !== photoId)
    }

  } catch (err) {
    error.value = 'Gagal menghapus foto: ' + err.message
  }
}

// Delete finding
const deleteFinding = (findingId) => {
  findingToDelete.value = findingId
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  findingToDelete.value = null
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    // Get finding data with photos
    const { data: findingData, error: fetchError } = await supabase
      .from('findings')
      .select('finding_photos(*)')
      .eq('id', findingToDelete.value)
      .single()

    if (fetchError) throw fetchError

    // Delete photos from storage
    if (findingData.finding_photos && findingData.finding_photos.length > 0) {
      const filePaths = findingData.finding_photos
        .map(p => p.storage_path)
        .filter(Boolean)

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase
          .storage
          .from('inspection-photos')
          .remove(filePaths)

        if (storageError) console.error('Storage delete error:', storageError)
      }
    }

    // Delete finding (cascade will delete photos)
    const { error: deleteError } = await supabase
      .from('findings')
      .delete()
      .eq('id', findingToDelete.value)

    if (deleteError) throw deleteError

    // Update local state
    findings.value = findings.value.filter(f => f.id !== findingToDelete.value)
    closeDeleteModal()

  } catch (err) {
    error.value = 'Gagal menghapus temuan: ' + err.message
  } finally {
    deleting.value = false
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.card-location {
  font-size: 1.15rem;
  color: #3F3A5A;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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

.photo-container {
  position: relative;
  width: calc(50% - 5px); /* Max two per row on smaller screens */
}

.finding-photo {
  width: 100%;
  height: auto;
  border-radius: 6px;
  object-fit: cover;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.finding-photo:hover {
  transform: scale(1.02);
}

.delete-photo-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.delete-photo-btn:hover {
  background: rgba(255, 255, 255, 1);
}

@media (min-width: 600px) {
  .photo-container {
    width: calc(25% - 7.5px); /* Four per row on wider screens */
  }
}

/* --- Buttons --- */

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-edit {
  background-color: #E8A2AD;
  color: white;
}

.btn-edit:hover {
  background-color: #d89aa5;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}

.btn-save {
  background-color: #28a745;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background-color: #218838;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background-color: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- Modal Styles --- */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.confirmation-modal {
  max-width: 400px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #3F3A5A;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #000;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* --- Form Styles --- */

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #3F3A5A;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #E8A2AD;
  box-shadow: 0 0 0 2px rgba(232, 162, 173, 0.2);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* --- Photo Preview --- */

.preview-photos {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.remove-preview-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-preview-btn:hover {
  background: #c82333;
}

/* --- Responsive --- */

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .card-actions {
    align-self: flex-end;
  }

  .modal-content {
    margin: 10px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn {
    width: 100%;
  }
}
</style>