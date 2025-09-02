<template>
  <div class="report-container">
    <div class="header">
      <h1 class="title">Laporan Temuan K3RS</h1>
      <div class="subtitle">Rumah Sakit Paru Sumatera Barat</div>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Jenis Inspeksi:</label>
        <select v-model="selectedType" class="filter-select">
          <option value="">Semua Jenis Inspeksi</option>
          <option v-for="type in inspectionTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Dari Tanggal:</label>
        <input type="date" v-model="startDate" class="filter-input">
      </div>

      <div class="filter-group">
        <label>Sampai Tanggal:</label>
        <input type="date" v-model="endDate" class="filter-input">
      </div>

      <div class="action-buttons">
        <button @click="fetchReport" :disabled="loading" class="btn btn-primary">
          <span v-if="loading">⏳ Loading...</span>
          <span v-else>🔍 Tampilkan Data</span>
        </button>
        
        <button 
          @click="downloadPDF" 
          :disabled="!reportData.length || isGeneratingPDF || isGeneratingXLSX" 
          class="btn btn-success"
        >
          <span v-if="isGeneratingPDF">⏳ Generating PDF...</span>
          <span v-else>📄 Download PDF</span>
        </button>

        <!-- Dropdown untuk pilihan Excel -->
        <div class="excel-dropdown">
          <button 
            @click="toggleExcelDropdown"
            :disabled="!reportData.length || isGeneratingPDF || isGeneratingXLSX" 
            class="btn btn-excel"
          >
            <span v-if="isGeneratingXLSX">⏳ Generating Excel...</span>
            <span v-else>📊 Download Excel ▼</span>
          </button>
          
          <div v-if="showExcelDropdown" class="dropdown-menu">
            <button @click="downloadExcelWithImages" class="dropdown-item">
              📊 Excel dengan Gambar
            </button>
            <button @click="downloadExcelSimple" class="dropdown-item">
              📋 Excel Sederhana
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading dan Error States -->
    <div v-if="loading" class="status-message loading">
      <div class="spinner"></div>
      <p>Memuat data inspeksi...</p>
    </div>

    <div v-if="error" class="status-message error">
      <p>❌ Error: {{ error }}</p>
    </div>

    <div v-if="isGeneratingPDF" class="status-message generating">
      <div class="spinner"></div>
      <p>🔄 Generating PDF report... Mohon tunggu sebentar.</p>
    </div>

    <div v-if="isGeneratingXLSX" class="status-message generating">
      <div class="spinner"></div>
      <p>📊 Generating Excel report... Mohon tunggu sebentar.</p>
      <div class="generating-details">
        <small>{{ excelGenerationStatus }}</small>
      </div>
    </div>

    <!-- Data Summary -->
    <div v-if="reportData.length && !loading" class="data-summary">
      <div class="summary-card">
        <h3>📊 Ringkasan Data</h3>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-number">{{ reportData.length }}</span>
            <span class="stat-label">Total Inspeksi</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ totalFindings }}</span>
            <span class="stat-label">Total Temuan</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ totalPhotos }}</span>
            <span class="stat-label">Total Foto</span>
          </div>
        </div>
        <div class="date-range" v-if="startDate || endDate">
          <strong>Periode:</strong> 
          {{ formatDateRange() }}
        </div>
      </div>
    </div>

    <!-- Data Preview Table -->
    <div v-if="reportData.length && !loading" class="data-preview">
      <h3>📋 Preview Data</h3>
      <div class="table-container">
        <table class="preview-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Jenis Inspeksi</th>
              <th>Lokasi</th>
              <th>Temuan</th>
              <th>Foto</th>
              <th>Risiko</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(inspection, inspectionIndex) in reportData" :key="inspection.id">
              <tr v-for="(finding, findingIndex) in inspection.findings" 
                  :key="`${inspection.id}-${finding.id}`"
                  :class="{ 'alternate-row': (inspectionIndex + findingIndex) % 2 === 1 }">
                <td>{{ getRowNumber(inspectionIndex, findingIndex) }}</td>
                <td>{{ formatDate(inspection.inspection_date) }}</td>
                <td>{{ inspection.inspection_type }}</td>
                <td>{{ finding.location || '-' }}</td>
                <td class="finding-text">{{ truncateText(finding.finding, 50) }}</td>
                <td class="photo-cell">
                  <span class="photo-count">📷 {{ finding.photos?.length || 0 }}</span>
                </td>
                <td class="risk-text">{{ truncateText(finding.hazard_risk, 30) }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- No Data Message -->
    <div v-if="!reportData.length && !loading && !error" class="no-data">
      <div class="no-data-icon">📄</div>
      <h3>Belum ada data</h3>
      <p>Pilih filter dan klik "Tampilkan Data" untuk melihat laporan inspeksi.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'
import { generateReportPDF } from '../lib/pdfexport'
// Import fungsi Excel generator
import { generateReportExcel, generateReportExcelSimple } from '../lib/xlsxexport'

const inspectionTypes = ['KONSTRUKSI','PRILAKU K3','INSIDEN','UTILITAS','PROTEKSI']
const selectedType = ref('')
const startDate = ref('')
const endDate = ref('')

const reportData = ref([])
const loading = ref(false)
const error = ref('')
const isGeneratingPDF = ref(false)
const isGeneratingXLSX = ref(false)
const excelGenerationStatus = ref('')
const showExcelDropdown = ref(false)

// Computed properties untuk statistik
const totalFindings = computed(() => {
  return reportData.value.reduce((total, inspection) => {
    return total + (inspection.findings?.length || 0)
  }, 0)
})

const totalPhotos = computed(() => {
  return reportData.value.reduce((total, inspection) => {
    return total + (inspection.findings?.reduce((findingTotal, finding) => {
      return findingTotal + (finding.photos?.length || 0)
    }, 0) || 0)
  }, 0)
})

// Helper functions
const formatDate = (dateStr) => {
  return dayjs(dateStr).format('DD/MM/YYYY')
}

const formatDateRange = () => {
  if (startDate.value && endDate.value) {
    return `${formatDate(startDate.value)} - ${formatDate(endDate.value)}`
  } else if (startDate.value) {
    return `Mulai ${formatDate(startDate.value)}`
  } else if (endDate.value) {
    return `Sampai ${formatDate(endDate.value)}`
  }
  return 'Semua periode'
}

const truncateText = (text, maxLength) => {
  if (!text) return '-'
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getRowNumber = (inspectionIndex, findingIndex) => {
  let count = 1
  for (let i = 0; i < inspectionIndex; i++) {
    count += reportData.value[i].findings?.length || 0
  }
  return count + findingIndex
}

// Helper untuk generate month string
const generateMonthString = () => {
  let monthString = ''
  if (startDate.value && endDate.value) {
    const start = dayjs(startDate.value)
    const end = dayjs(endDate.value)
    if (start.format('YYYY-MM') === end.format('YYYY-MM')) {
      monthString = start.format('MMMM YYYY').toUpperCase()
    } else {
      monthString = `${start.format('MMM')} - ${end.format('MMM YYYY')}`.toUpperCase()
    }
  } else if (startDate.value) {
    monthString = dayjs(startDate.value).format('MMMM YYYY').toUpperCase()
  } else if (endDate.value) {
    monthString = dayjs(endDate.value).format('MMMM YYYY').toUpperCase()
  }
  return monthString
}

// Toggle dropdown Excel
const toggleExcelDropdown = () => {
  showExcelDropdown.value = !showExcelDropdown.value
}

// Close dropdown when clicking outside
const closeDropdown = (event) => {
  if (!event.target.closest('.excel-dropdown')) {
    showExcelDropdown.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

const fetchReport = async () => {
  loading.value = true
  error.value = ''
  
  try {
    let query = supabase.from('inspections')
      .select(`
        id, 
        inspection_date, 
        inspection_type, 
        findings(
          id, 
          location, 
          finding, 
          hazard_risk, 
          recommendation, 
          finding_photos(storage_path)
        )
      `)
      .order('inspection_date', { ascending: true })

    // Apply filters
    if (selectedType.value) {
      query = query.eq('inspection_type', selectedType.value)
    }
    if (startDate.value) {
      query = query.gte('inspection_date', startDate.value)
    }
    if (endDate.value) {
      query = query.lte('inspection_date', endDate.value)
    }

    const { data, error: supError } = await query
    if (supError) throw supError

    console.log('Raw data from Supabase:', data)

    // Create signed URLs for photos
    const findingsWithSignedUrls = await Promise.all(data.map(async (inspection) => {
      const findings = await Promise.all(inspection.findings.map(async (finding) => {
        const photos = await Promise.all((finding.finding_photos || []).map(async (photo) => {
          try {
            const { data: signed } = await supabase.storage
              .from('inspection-photos')
              .createSignedUrl(photo.storage_path, 60 * 60)
            
            return { 
              ...photo, 
              signed_url: signed?.signedUrl || null 
            }
          } catch (photoError) {
            console.error('Error creating signed URL for photo:', photoError)
            return { ...photo, signed_url: null }
          }
        }))
        
        return { ...finding, photos }
      }))
      
      return { ...inspection, findings }
    }))

    reportData.value = findingsWithSignedUrls
    console.log('Processed data with signed URLs:', findingsWithSignedUrls)

  } catch (err) {
    console.error('Error fetching report:', err)
    error.value = err.message || 'Terjadi kesalahan saat memuat data'
  } finally {
    loading.value = false
  }
}

const downloadPDF = async () => {
  if (!reportData.value.length) {
    alert('Tidak ada data untuk diunduh!')
    return
  }
  
  try {
    isGeneratingPDF.value = true
    
    const monthString = generateMonthString()
    
    console.log('Generating PDF with data:', reportData.value)
    
    await generateReportPDF(reportData.value, { 
      month: monthString 
    })
    
    alert('PDF berhasil diunduh!')
    
  } catch (err) {
    console.error('Error generating PDF:', err)
    error.value = 'Gagal generate PDF: ' + err.message
    alert('Gagal generate PDF: ' + err.message)
  } finally {
    isGeneratingPDF.value = false
  }
}

// Fungsi download Excel dengan gambar
const downloadExcelWithImages = async () => {
  if (!reportData.value.length) {
    alert('Tidak ada data untuk diunduh!')
    return
  }
  
  try {
    isGeneratingXLSX.value = true
    showExcelDropdown.value = false
    excelGenerationStatus.value = 'Menyiapkan data...'
    
    const monthString = generateMonthString()
    
    console.log('Generating Excel with images:', reportData.value)
    
    excelGenerationStatus.value = 'Memproses gambar...'
    
    await generateReportExcel(reportData.value, { 
      month: monthString 
    })
    
    alert('Excel dengan gambar berhasil diunduh!')
    
  } catch (err) {
    console.error('Error generating Excel with images:', err)
    error.value = 'Gagal generate Excel: ' + err.message
    alert('Gagal generate Excel: ' + err.message)
  } finally {
    isGeneratingXLSX.value = false
    excelGenerationStatus.value = ''
  }
}

// Fungsi download Excel sederhana
const downloadExcelSimple = async () => {
  if (!reportData.value.length) {
    alert('Tidak ada data untuk diunduh!')
    return
  }
  
  try {
    isGeneratingXLSX.value = true
    showExcelDropdown.value = false
    excelGenerationStatus.value = 'Membuat spreadsheet...'
    
    const monthString = generateMonthString()
    
    console.log('Generating simple Excel:', reportData.value)
    
    await generateReportExcelSimple(reportData.value, { 
      month: monthString 
    })
    
    alert('Excel sederhana berhasil diunduh!')
    
  } catch (err) {
    console.error('Error generating simple Excel:', err)
    error.value = 'Gagal generate Excel: ' + err.message
    alert('Gagal generate Excel: ' + err.message)
  } finally {
    isGeneratingXLSX.value = false
    excelGenerationStatus.value = ''
  }
}
</script>

<style scoped>
.report-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #e8a2ad 0%, #fd8698 100%);
  color: white;
  border-radius: 10px;
}

.title {
  margin: 0 0 5px 0;
  font-size: 2rem;
  font-weight: bold;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: end;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #495057;
}

.filter-select, .filter-input {
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.filter-select:focus, .filter-input:focus {
  outline: none;
  border-color: #b00aa8;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #e352f0;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #b615c5;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-excel {
  background: #217346;
  color: white;
}

.btn-excel:hover:not(:disabled) {
  background: #1a5e37;
}

/* Excel Dropdown Styles */
.excel-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  display: block;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item:not(:last-child) {
  border-bottom: 1px solid #e9ecef;
}

.status-message {
  text-align: center;
  padding: 30px;
  margin: 20px 0;
  border-radius: 10px;
}

.status-message.loading {
  background: #e7f3ff;
  color: #cc0058;
}

.status-message.error {
  background: #ffe6e6;
  color: #cc0000;
}

.status-message.generating {
  background: #e6f7ff;
  color: #cc0058;
}

.generating-details {
  margin-top: 10px;
}

.generating-details small {
  color: #666;
  font-style: italic;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #cc0058;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.data-summary {
  margin: 20px 0;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.summary-card h3 {
  margin: 0 0 15px 0;
  color: #495057;
}

.summary-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 100px;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #cc0058;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  text-align: center;
}

.date-range {
  color: #6c757d;
  font-size: 0.9rem;
}

.data-preview {
  margin: 20px 0;
}

.data-preview h3 {
  margin-bottom: 15px;
  color: #495057;
}

.table-container {
  overflow-x: auto;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 14px;
}

.preview-table th {
  background: #e8a2ad;
  color: white;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.preview-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
}

.alternate-row {
  background: #f8f9fa;
}

.finding-text, .risk-text {
  max-width: 200px;
  word-wrap: break-word;
}

.photo-cell {
  text-align: center;
}

.photo-count {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-data h3 {
  margin-bottom: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .action-buttons {
    margin-left: 0;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .summary-stats {
    flex-direction: column;
  }
  
  .dropdown-menu {
    position: fixed;
    right: 10px;
    left: 10px;
    width: auto;
  }
}
</style>