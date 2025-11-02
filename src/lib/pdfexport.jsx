import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';

// Styles untuk PDF
// ... [STYLES LENGKAP TIDAK BERUBAH] ...
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 71,    // 2.5 cm = 71 pt
    paddingBottom: 71,
    paddingLeft: 71,
    paddingRight: 71,
    fontSize: 9
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: '1%',
    alignItems: 'flex-start',
  },
  logo: {
    width: 90,
    height: 60,
    objectFit: 'contain'
  },
  headerTextContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 0
  },
  headerLines: {
    marginTop: 8,
    marginBottom: 20,
  },
  thinLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    marginBottom: 2
  },
  thickLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#000'
  },
  headerLine1: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Roman'
  },
  headerLine2: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Roman'
  },
  headerLine3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center',
    fontFamily: 'Times-Bold'
  },
  headerLine4: {
    fontSize: 8,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Roman'
  },
  headerLine5: {
    fontSize: 8,
    textAlign: 'center',
    fontFamily: 'Times-Roman'
  },
  underlineText: {
    textDecoration: 'underline',
    fontFamily: 'Times-Roman'
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  titleMain: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center',
    fontFamily: 'Times-Bold'
  },
  titleSub: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Bold'
  },
  titleHospital: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Roman'
  },
  titleMonth: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Times-Roman'
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
    justifyContent: 'center',
    fontFamily: 'Times-Bold'
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 3,
    fontSize: 8,
    minHeight: 30,
    fontFamily: 'Times-Roman'
  },
  tableColNo: { width: '5%', textAlign: 'center', justifyContent: 'flex-start' },
  tableColDate: { width: '12%', textAlign: 'center', justifyContent: 'flex-start' },
  tableColLocation: { width: '10%', justifyContent: 'flex-start' },
  tableColFinding: { width: '20%', justifyContent: 'flex-start' },
  tableColPhoto: { width: '20%', justifyContent: 'center', alignItems: 'center' },
  tableColRisk: { width: '13%', justifyContent: 'flex-start' },
  tableColReco: { width: '15%', justifyContent: 'flex-start' },
  tableColNotes: { width: '16%', justifyContent: 'flex-start' },
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
    wrap: false,
    minPresenceAhead: 120
  },
  signatureSection: { width: '45%', alignItems: 'center', fontFamily: 'Times-Roman' },
  signatureName: { marginTop: 25, fontWeight: 'bold', textDecoration: 'underline', fontFamily: 'Times-Bold' },
  signatureNip: { fontSize: 9, marginTop: 2, fontFamily: 'Times-Roman' }
});


// ... [HELPER FUNCTIONS TIDAK BERUBAH] ...
// Helper untuk format bullet points dari string dengan semicolon
const formatBulletPoints = (text) => {
  if (!text || text.trim() === '') return '-';
  const items = text.split(';').map(item => item.trim()).filter(item => item !== '');
  if (items.length === 0) return '-';
  if (items.length === 1) return items[0];
  return items.map(item => `• ${item}`).join('\n');
};

const formatDateIndonesia = (dateStr) => {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper baru untuk mengambil bulan dan tahun saja dari string tanggal
const formatMonthAndYearIndonesia = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split(' ');
  // Mengambil bulan dan tahun, yang berada di indeks 1 dan 2
  if (parts.length >= 3) {
    return `${parts[1]} ${parts[2]}`;
  }
  return dateStr;
};

// Component untuk Photos Grid
const PhotosGrid = ({ photos }) => {
  if (!photos || photos.length === 0) return <Text>-</Text>;
  const validPhotos = photos.slice(0, 4);
  const photoRows = [];
  for (let i = 0; i < validPhotos.length; i += 2) {
    photoRows.push(validPhotos.slice(i, i + 2));
  }
  return (
    <View style={styles.photosContainer}>
      {photoRows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.photoRow}>
          {row.map((photo, photoIndex) => (
            <Image key={photoIndex} style={styles.photo} src={photo.signed_url} />
          ))}
        </View>
      ))}
    </View>
  );
};

// Component untuk satu grup inspeksi
// [MODIFIKASI] Terima prop `signatory`
const InspectionGroup = ({ inspectionType, inspectionDate, inspectionData, month, signatory }) => {
  let rowNumber = 1;

  // [BARU] Siapkan nama dan NIP penanda tangan, dengan fallback jika data tidak ada
  const signerName = signatory?.name || 'dr. Lusi Agustini Arda, Sp.P';
  const signerNip = signatory?.nip || 'NIP. 19840812 201101 2 008';

  return (
    <Page size={{ width: 1000, height: 700 }} orientation="landscape" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}><Image style={styles.logo} src="/logo.png" /></View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerLine1}>PEMERINTAH PROVINSI SUMATERA BARAT</Text>
          <Text style={styles.headerLine2}>DINAS KESEHATAN</Text>
          <Text style={styles.headerLine3}>RUMAH SAKIT PARU SUMATERA BARAT</Text>
          <Text style={styles.headerLine4}>Jln. Dr. M. Jamil No.110 Lubuk Alung Telp ( 0751) 96013 96688 fax.96013</Text>
          <Text style={styles.headerLine5}>
            <Text style={styles.underlineText}>Email.RSK.paru@gmail.com</Text> <Text style={styles.underlineText}>Website: rsparu.sumbarprov.go.id</Text>
          </Text>
        </View>
      </View>
      <View style={styles.headerLines}>
        <View style={styles.thinLine}></View>
        <View style={styles.thickLine}></View>
      </View>

      {/* Title Section */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleMain}>LAPORAN TEMUAN K3RS</Text>
        <Text style={styles.titleSub}>{inspectionType.toUpperCase()}</Text>
        <Text style={styles.titleHospital}>RUMAH SAKIT PARU SUMATERA BARAT</Text>
        <Text style={styles.titleMonth}>{formatMonthAndYearIndonesia(inspectionDate).toUpperCase()}</Text>
      </View>

      {/* Table */}
      <View style={styles.table} wrap={false}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableColHeader, styles.tableColNo]}><Text>NO.</Text></View>
          <View style={[styles.tableColHeader, styles.tableColDate]}><Text>TGL INSPEKSI</Text></View>
          <View style={[styles.tableColHeader, styles.tableColLocation]}><Text>LOKASI</Text></View>
          <View style={[styles.tableColHeader, styles.tableColFinding]}><Text>TEMUAN</Text></View>
          <View style={[styles.tableColHeader, styles.tableColPhoto]}><Text>DOKUMENTASI</Text></View>
          <View style={[styles.tableColHeader, styles.tableColRisk]}><Text>BAHAYA/RISIKO</Text></View>
          <View style={[styles.tableColHeader, styles.tableColReco]}><Text>REKOMENDASI</Text></View>
          <View style={[styles.tableColHeader, styles.tableColNotes]}><Text>KETERANGAN</Text></View>
        </View>

        {inspectionData.map((inspection) =>
          (inspection.findings || []).map((finding, idx) => (
            <View key={`${inspection.id}-${idx}`} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.tableColNo]}><Text>{rowNumber++}</Text></View>
              <View style={[styles.tableCol, styles.tableColDate]}><Text>{formatDateIndonesia(inspection.inspection_date)}</Text></View>
              <View style={[styles.tableCol, styles.tableColLocation]}><Text>{finding.location || "-"}</Text></View>
              <View style={[styles.tableCol, styles.tableColFinding]}><Text>{finding.finding || "-"}</Text></View>
              <View style={[styles.tableCol, styles.tableColPhoto]}><PhotosGrid photos={finding.photos} /></View>
              <View style={[styles.tableCol, styles.tableColRisk]}><Text>{formatBulletPoints(finding.hazard_risk)}</Text></View>
              <View style={[styles.tableCol, styles.tableColReco]}><Text>{formatBulletPoints(finding.recommendation)}</Text></View>
              <View style={[styles.tableCol, styles.tableColNotes]}><Text>{finding.notes || "-"}</Text></View>
            </View>
          ))
        )}
      </View>

      {/* Signature */}
      <View style={styles.signature}>
        <View style={styles.signatureSection}>
          <Text> </Text>
          <Text>Komite K3RS</Text>
          <Text>Ketua</Text>
          <View style={{ height: 40 }}></View>
          {/* [MODIFIKASI] Tampilkan nama dan NIP secara dinamis */}
          <Text style={[styles.signatureName, { marginBottom: 5 }]}>{signerName}</Text>
          <Text style={styles.signatureNip}>{signerNip}</Text>
        </View>
        <View style={styles.signatureSection}>
          <Text>Lubuk Alung, {new Date().getDate()} {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"][new Date().getMonth()]} {new Date().getFullYear()}</Text>
          <Text>Petugas Pengawas</Text>
          <Text>Sekretaris I Komite K3RS</Text>
          <View style={{ height: 40 }}></View>
          <Text style={[styles.signatureName, { marginBottom: 5 }]}>Etri Putri, S.K.M</Text>
          <Text style={styles.signatureNip}>NIP. 20020424202504 2 008</Text>
        </View>
      </View>
    </Page>
  );
};

// Helper: group by type + date
const groupByTypeAndDate = (inspections) => {
  const grouped = {};
  inspections.forEach((i) => {
    if (!grouped[i.inspection_type]) grouped[i.inspection_type] = {};
    const dateKey = formatDateIndonesia(i.inspection_date);
    if (!grouped[i.inspection_type][dateKey]) grouped[i.inspection_type][dateKey] = [];
    grouped[i.inspection_type][dateKey].push(i);
  });
  return grouped;
};

// Main PDF Document
// [MODIFIKASI] Terima prop `signatory`
const ReportPDF = ({ inspections, month, signatory }) => {
  let displayMonth = month || 'BULAN TIDAK TERSEDIA';
  const grouped = groupByTypeAndDate(inspections);
  return (
    <Document>
      {Object.entries(grouped).map(([inspectionType, byDate]) =>
        Object.entries(byDate).map(([inspectionDate, inspectionData]) => (
          <InspectionGroup
            key={`${inspectionType}-${inspectionDate}`}
            inspectionType={inspectionType}
            inspectionDate={inspectionDate}
            inspectionData={inspectionData}
            month={displayMonth}
            signatory={signatory} // [MODIFIKASI] Teruskan prop signatory
          />
        ))
      )}
    </Document>
  );
};

// Export function untuk Vue
export async function generateReportPDF(inspections, options = {}) {
  try {
    // [MODIFIKASI] Ekstrak `signatory` dari options
    const { month = "", signatory = null } = options;
    
    // [MODIFIKASI] Teruskan `signatory` ke komponen ReportPDF
    const doc = <ReportPDF inspections={inspections} month={month} signatory={signatory} />;
    
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Temuan_K3RS_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}