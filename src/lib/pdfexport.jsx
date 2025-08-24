// File: utils/pdfGenerator.js
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';

// Styles untuk PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 10,
    fontSize: 9
  },
  header: {
    flexDirection: 'column',
    marginBottom: 20,
    alignItems: 'center'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10
  },
  logo: {
    // Konversi cm ke points (1 cm = 28.35 points)
    // Width: 17.68 cm = 501.4 points
    // Height: 2.51 cm = 71.2 points
    width: 501.4,
    height: 71.2,
    objectFit: 'contain'
  },
  titleContainer: {
    alignItems: 'center'
  },
  titleMain: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center'
  },
  titleSub: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center'
  },
  titleHospital: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center'
  },
  titleMonth: {
    fontSize: 11,
    textAlign: 'center'
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#A9A9A9'
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 8,
    minHeight: 20,
    justifyContent: 'center'
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 3,
    fontSize: 8,
    minHeight: 30
  },
  tableColNo: { 
    width: '5%',
    textAlign: 'center',
    justifyContent: 'center'
  },
  tableColDate: { 
    width: '12%',
    textAlign: 'center',
    justifyContent: 'center'
  },
  tableColLocation: { 
    width: '15%',
    justifyContent: 'flex-start'
  },
  tableColFinding: { 
    width: '20%',
    justifyContent: 'flex-start'
  },
  tableColPhoto: { 
    width: '20%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tableColRisk: { 
    width: '13%',
    justifyContent: 'flex-start'
  },
  tableColReco: { 
    width: '15%',
    justifyContent: 'flex-start'
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    marginBottom: 3
  },
  photo: {
    // Konversi cm ke points (1 cm = 28.35 points)
    // Width: 3.45 cm = 97.8 points
    // Height: 4.6 cm = 130.41 points
    width: 97.8,
    height: 130.41,
    objectFit: 'cover',
    border: '1px solid #ccc'
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    fontSize: 10,
    paddingHorizontal: 20,
    // Pastikan tanda tangan tidak terpisah di halaman berbeda
    break: false
  },
  signatureSection: {
    width: '45%',
    alignItems: 'center'
  },
  signatureName: {
    marginTop: 25,
    fontWeight: 'bold',
    textDecoration: 'underline'
  },
  signatureNip: {
    fontSize: 9,
    marginTop: 2
  }
});

// Helper untuk format tanggal Indonesia
const formatDateIndonesia = (dateStr) => {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Component untuk Photos Grid
const PhotosGrid = ({ photos }) => {
  if (!photos || photos.length === 0) {
    return <Text>-</Text>;
  }

  const validPhotos = photos.slice(0, 4);
  
  // Bagi foto menjadi baris (2 foto per baris, maksimal 4 foto)
  const photoRows = [];
  for (let i = 0; i < validPhotos.length; i += 2) {
    photoRows.push(validPhotos.slice(i, i + 2));
  }

  return (
    <View style={styles.photosContainer}>
      {photoRows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.photoRow}>
          {row.map((photo, photoIndex) => (
            <Image 
              key={photoIndex} 
              style={styles.photo} 
              src={photo.signed_url} 
            />
          ))}
        </View>
      ))}
    </View>
  );
};

// Component untuk satu grup inspeksi
const InspectionGroup = ({ inspectionType, inspectionData, month }) => {
  let rowNumber = 1;
  
  // Debug log untuk melihat nilai month
  console.log('Month value in InspectionGroup:', month);
  
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} src="/logo.png" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.titleMain}>LAPORAN TEMUAN K3RS</Text>
          <Text style={styles.titleSub}>{inspectionType.toUpperCase()}</Text>
          <Text style={styles.titleHospital}>RUMAH SAKIT PARU SUMATERA BARAT</Text>
          <Text style={styles.titleMonth}>
            {month && month.trim() !== '' ? month.toUpperCase() : 'BULAN TIDAK TERSEDIA'}
          </Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Header Row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableColHeader, styles.tableColNo]}>
            <Text>NO.</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColDate]}>
            <Text>TGL INSPEKSI</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColLocation]}>
            <Text>LOKASI</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColFinding]}>
            <Text>TEMUAN</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColPhoto]}>
            <Text>DOKUMENTASI</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColRisk]}>
            <Text>BAHAYA/RISIKO</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColReco]}>
            <Text>REKOMENDASI</Text>
          </View>
        </View>

        {/* Data Rows */}
        {inspectionData.map((inspection) =>
          (inspection.findings || []).map((finding, idx) => (
            <View key={`${inspection.id}-${idx}`} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.tableColNo]}>
                <Text>{rowNumber++}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColDate]}>
                <Text>{formatDateIndonesia(inspection.inspection_date)}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColLocation]}>
                <Text>{finding.location || "-"}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColFinding]}>
                <Text>{finding.finding || "-"}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColPhoto]}>
                <PhotosGrid photos={finding.photos} />
              </View>
              <View style={[styles.tableCol, styles.tableColRisk]}>
                <Text>{finding.hazard_risk || "-"}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColReco]}>
                <Text>{finding.recommendation || "-"}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Signature */}
      <View style={styles.signature} wrap={false}>
        <View style={styles.signatureSection}>
          <Text>Komite K3RS</Text>
          <Text>An Ketua</Text>
          <Text style={styles.signatureName}>dr. Lusi Agustini Arda, Sp.P</Text>
          <Text style={styles.signatureNip}>NIP. 19840812 201101 2 008</Text>
        </View>
        <View style={styles.signatureSection}>
          <Text>Lubuk Alung, {new Date().getDate()} {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][new Date().getMonth()]} {new Date().getFullYear()}</Text>
          <Text>Petugas Pengawas</Text>
          <Text>An Sekretaris I Komite K3RS</Text>
          <Text style={styles.signatureName}>Etri Putri, S.K.M</Text>
          <Text style={styles.signatureNip}>NIP. 20020424202504 2 008</Text>
        </View>
      </View>
    </Page>
  );
};

// Helper untuk mengambil nama bulan Indonesia dari tanggal
const getMonthFromDate = (dateStr) => {
  const months = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];
  const date = new Date(dateStr);
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

// Main PDF Document
const ReportPDF = ({ inspections, month }) => {
  // Debug log untuk melihat parameter yang diterima
  console.log('ReportPDF received month:', month);
  console.log('ReportPDF received inspections:', inspections);
  
  // Jika month tidak diberikan, ambil dari inspection_date yang pertama
  let displayMonth = month;
  if (!month || month.trim() === '') {
    if (inspections && inspections.length > 0 && inspections[0].inspection_date) {
      displayMonth = getMonthFromDate(inspections[0].inspection_date);
      console.log('Generated month from inspection_date:', displayMonth);
    } else {
      displayMonth = 'BULAN TIDAK TERSEDIA';
    }
  }
  
  // Group by inspection type
  const groupedByType = {};
  inspections.forEach((i) => {
    if (!groupedByType[i.inspection_type]) {
      groupedByType[i.inspection_type] = [];
    }
    groupedByType[i.inspection_type].push(i);
  });

  return React.createElement(Document, null,
    Object.entries(groupedByType).map(([inspectionType, inspectionData]) =>
      React.createElement(InspectionGroup, {
        key: inspectionType,
        inspectionType: inspectionType,
        inspectionData: inspectionData,
        month: displayMonth
      })
    )
  );
};

// Export function untuk Vue
export async function generateReportPDF(inspections, options = {}) {
  try {
    console.log('Generating PDF...', { inspections, options });
    
    const { month = "" } = options;
    
    // Debug log untuk melihat nilai month yang diterima
    console.log('Month received in generateReportPDF:', month);
    console.log('Options received:', options);
    
    // Create PDF document
    const doc = React.createElement(ReportPDF, {
      inspections: inspections,
      month: month
    });
    
    // Generate PDF blob
    const blob = await pdf(doc).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Temuan_K3RS_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}