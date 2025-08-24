<template>
  <div class="dashboard-container">
    <h1 class="page-title">Dashboard Inspeksi</h1>

    <div class="action-bar">
      <button class="add-inspection-button" @click="goToAddInspection">
        <span class="icon">+</span> Tambah Inspeksi Baru
      </button>

      <div class="filter-group">
        <label for="type-filter" class="filter-label">Filter Jenis:</label>
        <select v-model="selectedType" id="type-filter" class="filter-select">
          <option value="">Semua Jenis</option>
          <option v-for="type in inspectionTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
    </div>

    <div class="status-messages">
      <p v-if="loading" class="loading-message">
        <span class="spinner"></span> Memuat data inspeksi...
      </p>
      <p v-if="error" class="message error-message">{{ error }}</p>
    </div>


    <div v-for="(inspections, month) in groupedInspections" :key="month" class="month-group">
      <button class="accordion-header" @click="toggleMonth(month)" :class="{ 'is-open': openMonths.includes(month) }">
        <span class="accordion-title">{{ month }}</span>
        <span class="inspection-count">({{ inspections.length }} Inspeksi)</span>
        <span class="toggle-icon">{{ openMonths.includes(month) ? '▲' : '▼' }}</span>
      </button>

      <div class="panel" v-show="openMonths.includes(month)">
        <div v-for="ins in inspections" :key="ins.id" class="inspection-card">
          <div class="card-info">
            <p class="info-item"><strong>Tanggal:</strong> <span>{{ ins.inspection_date }}</span></p>
            <p class="info-item"><strong>Jenis:</strong> <span>{{ ins.inspection_type }}</span></p>
            <p class="info-item finding-count-display">
              <strong>Temuan:</strong>
              <span :class="{'has-findings': ins.findings_count > 0}">{{ ins.findings_count }}</span>
            </p>
          </div>

          <div class="card-buttons">
            <button class="action-btn view-btn" @click="goToFindings(ins.id)">
              Lihat Temuan
            </button>
            <button class="action-btn add-btn" @click="goToAddFinding(ins.id)">
              Tambah Temuan
            </button>
            <button class="action-btn delete-btn" @click="deleteInspection(ins)">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!loading && Object.keys(groupedInspections).length === 0" class="no-data-message">
      Tidak ada data inspeksi yang ditemukan. Silakan tambahkan inspeksi baru.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import dayjs from 'dayjs'

const auth = useAuthStore()
const router = useRouter()
const inspectionTypes = ['KONSTRUKSI', 'PERILAKU', 'INSIDEN', 'UTILITAS', 'PROTEKSI']

const inspections = ref([])
const loading = ref(false)
const error = ref('')
const selectedType = ref('')
const openMonths = ref([])

// Ambil data inspeksi + jumlah temuan tiap inspeksi
const fetchInspections = async () => {
  loading.value = true
  try {
    const { data, error: supError } = await supabase
      .from('inspections')
      .select('id, inspection_date, inspection_type, findings(id)')
      .eq('user_id', auth.user.id)
      .order('inspection_date', { ascending: false })

    if (supError) throw supError

    inspections.value = data.map(i => ({
      ...i,
      findings_count: i.findings?.length || 0
    }))
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Group per bulan
const groupedInspections = computed(() => {
  const grouped = {}
  const filtered = selectedType.value
    ? inspections.value.filter(i => i.inspection_type === selectedType.value)
    : inspections.value

  filtered.forEach(i => {
    const month = dayjs(i.inspection_date).format('MMMM YYYY')
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(i)
  })

  return grouped
})

const toggleMonth = (month) => {
  if (openMonths.value.includes(month)) {
    openMonths.value = openMonths.value.filter(m => m !== month)
  } else {
    openMonths.value.push(month)
  }
}

const goToFindings = (id) => router.push(`/inspeksi/${id}/listfindings`)
const goToAddFinding = (id) => router.push(`/inspeksi/${id}/findings`)
const goToAddInspection = () => router.push(`/inspeksi`)

// Delete inspeksi beserta temuan & foto
const deleteInspection = async (ins) => {
  if (!confirm('Yakin ingin menghapus inspeksi beserta semua temuan & fotonya?')) return

  loading.value = true
  try {
    // ambil temuan & foto
    const { data: inspectionData, error: fetchErr } = await supabase
      .from('inspections')
      .select('id, findings(id, finding_photos(storage_path))')
      .eq('id', ins.id)
      .single()
    if (fetchErr) throw fetchErr

    const findings = inspectionData.findings ?? []

    for (const f of findings) {
      const photos = f.finding_photos ?? []
      for (const p of photos) {
        // hapus foto di storage
        const path = p.storage_path.replace('https://xjbhxewtxznofpalwjic.supabase.co/storage/v1/object/public/inspection-photos/', '')
        await supabase.storage.from('inspection-photos').remove([path])
      }
      // hapus temuan
      await supabase.from('findings').delete().eq('id', f.id)
    }

    // hapus inspeksi
    await supabase.from('inspections').delete().eq('id', ins.id)

    // refresh data
    await fetchInspections()
  } catch (err) {
    alert('Gagal hapus inspeksi: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(fetchInspections)
</script>
<style scoped>
/* Color Palette Consistency */
/* Soft Pink: #F7B8C4 (Accent Light) */
/* Dusty Rose: #E8A2AD (Accent Medium/Header) */
/* Deep Violet/Navy: #3F3A5A (Text/Primary Button) */
/* Background: #FAFAFA */

.dashboard-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background-color: #FAFAFA;
}

.page-title {
  text-align: center;
  color: #3F3A5A;
  margin-bottom: 30px;
  font-weight: 700;
  border-bottom: 3px solid #F7B8C4;
  padding-bottom: 15px;
}

/* --- Action Bar & Filters --- */

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 15px;
  flex-wrap: wrap; /* Allows wrapping on smaller screens */
}

.add-inspection-button {
  padding: 12px 20px;
  background-color: #3F3A5A;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-inspection-button:hover {
  background-color: #554f73;
}

.add-inspection-button .icon {
  font-size: 1.2rem;
  margin-right: 5px;
  font-weight: bold;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-weight: 500;
  color: #3F3A5A;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #CCCCCC;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  transition: border-color 0.3s;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #F7B8C4;
  outline: none;
}

/* --- Status Messages --- */

.status-messages {
  min-height: 20px; /* Space holder */
}

.loading-message {
  text-align: center;
  color: #E8A2AD;
  font-weight: 500;
}

.spinner {
  /* (Reusable spinner code from previous components) */
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
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

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

.no-data-message {
  text-align: center;
  padding: 40px;
  color: #666;
  background-color: white;
  border: 1px dashed #CCCCCC;
  border-radius: 8px;
  margin-top: 20px;
}

/* --- Accordion (Monthly Group) --- */

.month-group {
  margin-bottom: 15px;
  border-radius: 10px;
  overflow: hidden; /* Ensures child elements respect border radius */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.accordion-header {
  width: 100%;
  padding: 15px 20px;
  border: none;
  background-color: #E8A2AD; /* Dusty Rose Header */
  color: white;
  text-align: left;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.accordion-header:hover {
  background-color: #d1929d;
}

.accordion-header.is-open {
  background-color: #3F3A5A; /* Darker color when open for contrast */
}

.accordion-title {
  flex-grow: 1;
}

.inspection-count {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-right: 10px;
}

.toggle-icon {
  font-weight: bold;
}

.panel {
  padding: 10px 0;
  background-color: white;
}

/* --- Inspection Card --- */

.inspection-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.inspection-card:last-child {
  border-bottom: none;
}

.inspection-card:hover {
  background-color: #fffafb; /* Very subtle pink hover */
}

.card-info {
  flex-grow: 1;
  display: flex;
  gap: 30px;
}

.info-item {
  color: #3F3A5A;
  margin: 0;
  white-space: nowrap;
}

.info-item strong {
  font-weight: 600;
}

.finding-count-display span {
  font-weight: bold;
}

.finding-count-display .has-findings {
  color: #E8A2AD; /* Highlight count if findings exist */
}

/* --- Card Buttons --- */

.card-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  font-weight: 500;
}

.view-btn {
  background-color: #3F3A5A;
  color: white;
  border-color: #3F3A5A;
}

.view-btn:hover {
  background-color: #554f73;
}

.add-btn {
  background-color: white;
  color: #E8A2AD;
  border-color: #E8A2AD;
}

.add-btn:hover {
  background-color: #E8A2AD;
  color: white;
}

.delete-btn {
  background-color: white;
  color: #c0392b; /* Standard red for deletion */
  border-color: #c0392b;
}

.delete-btn:hover {
  background-color: #c0392b;
  color: white;
}

/* Responsive adjustments */
@media (max-width: 700px) {
  .inspection-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-info {
    flex-direction: column;
    gap: 5px;
    margin-bottom: 15px;
  }
  
  .card-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .action-btn {
    flex: 1; /* Makes buttons fill space */
  }
}

@media (max-width: 700px) {
  .dashboard-container {
    padding: 10px; /* Kurangi padding container agar konten lebih lebar */
  }

  .action-bar {
    flex-direction: column; /* Tumpuk tombol dan filter */
    align-items: stretch; /* Regangkan elemen agar lebar penuh */
    gap: 15px; /* Beri jarak yang lebih besar */
  }

  .add-inspection-button {
    width: 100%; /* Tombol Tambah Inspeksi lebar penuh */
  }

  .filter-group {
    width: 100%;
    flex-direction: column; /* Tumpuk label dan select filter */
    align-items: flex-start;
  }
  
  .filter-select {
    width: 100%; /* Select filter lebar penuh */
  }

  /* --- Inspection Card adjustments --- */
  .inspection-card {
    flex-direction: column; /* Tumpuk info dan tombol */
    align-items: flex-start;
    padding: 15px;
  }

  .card-info {
    flex-direction: column; /* Tumpuk Tanggal, Jenis, Temuan */
    gap: 8px; /* Jarak antar info lebih renggang */
    margin-bottom: 15px;
    width: 100%;
  }

  .info-item {
    padding: 5px 0;
    /* Tambahkan border bawah tipis untuk pemisah visual antar info */
    border-bottom: 1px dashed #eee; 
  }
  
  .info-item:last-child {
      border-bottom: none;
  }

  .card-buttons {
    width: 100%;
    justify-content: space-between; /* Bagikan ruang secara merata */
    gap: 5px; /* Kurangi sedikit jarak antar tombol agar muat */
  }

  .action-btn {
    flex: 1; /* Biarkan tombol mengambil ruang yang sama */
    padding: 10px 5px; /* Perbesar padding vertikal untuk sentuhan */
  }
}

/* Penyesuaian spesifik jika lebar layar sangat kecil (misal: iPhone SE) */
@media (max-width: 400px) {
    .card-buttons {
      flex-direction: column; /* Jika tombol terlalu panjang, tumpuk lagi */
    }
    
    .action-btn {
      width: 100%;
      margin: 3px 0;
    }
}
</style>