// File: utils/excelGenerator.js
import ExcelJS from 'exceljs';

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

// Helper untuk format bullet points
const formatBulletPoints = (text) => {
  if (!text || text.trim() === '') return '-';
  
  const items = text.split(';').map(item => item.trim()).filter(item => item !== '');
  
  if (items.length === 0) return '-';
  if (items.length === 1) return items[0];
  
  return items.map(item => `• ${item}`).join('\n');
};

// Helper untuk mendapatkan nama bulan dari tanggal
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

// Helper untuk mengkonversi gambar ke base64
const imageToBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Helper untuk membuat logo dari /logo.png atau membuat placeholder
const addLogoToWorkbook = async (workbook) => {
  try {
    // Coba ambil logo dari /logo.png dengan path yang benar
    const logoUrl = `${window.location.origin}/logo.png`;
    console.log('Trying to load logo from:', logoUrl);
    
    const base64Logo = await imageToBase64(logoUrl);
    
    if (base64Logo) {
      console.log('Logo loaded successfully from /logo.png');
      return workbook.addImage({
        base64: base64Logo,
        extension: 'png'
      });
    }
    
    // Fallback: buat placeholder logo jika /logo.png tidak tersedia
    console.log('Creating placeholder logo...');
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 120, 100);
      
      // Border
      ctx.strokeStyle = '#28a745';
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, 114, 94);
      
      // Text
      ctx.fillStyle = '#28a745';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RSP', 60, 35);
      ctx.fillText('SUMBAR', 60, 55);
      ctx.font = '10px Arial';
      ctx.fillText('LOGO', 60, 80);
      
      const base64Logo = canvas.toDataURL().split(',')[1];
      return workbook.addImage({
        base64: base64Logo,
        extension: 'png'
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error adding logo:', error);
    return null;
  }
};

// Function untuk membuat worksheet untuk setiap inspeksi individual
const createIndividualInspectionSheet = async (workbook, inspection, index) => {
  const inspectionDate = formatDateIndonesia(inspection.inspection_date);
  const sheetName = `${inspection.inspection_type}_${inspection.inspection_date}`.substring(0, 31); // Excel sheet name limit
  const worksheet = workbook.addWorksheet(sheetName);
  
  // Set orientasi landscape dan ukuran A4
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    margins: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    }
  };

  let currentRow = 1;

  // === HEADER SECTION ===
  worksheet.mergeCells('A1:A6');
  const logoCell = worksheet.getCell('A1');
  logoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  logoCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Tambahkan logo dengan posisi dan ukuran yang tepat
  const logoId = await addLogoToWorkbook(workbook);
  if (logoId) {
    console.log('Adding logo to worksheet...');
    worksheet.addImage(logoId, {
      tl: { col: 0.05, row: 0.05 }, // Posisi dari tepi kiri-atas cell
      br: { col: 0.95, row: 5.95 }  // Posisi ke tepi kanan-bawah cell (sampai baris 6)
    });
  } else {
    logoCell.value = 'LOGO\nRSP\nSUMBAR';
    logoCell.font = { size: 12, bold: true };
  }

  // Header text (kolom B-J, baris 1-6)
  worksheet.mergeCells('B1:J1');
  worksheet.getCell('B1').value = 'PEMERINTAH PROVINSI SUMATERA BARAT';
  
  worksheet.mergeCells('B2:J2');
  worksheet.getCell('B2').value = 'DINAS KESEHATAN';
  
  worksheet.mergeCells('B3:J3');
  const titleCell = worksheet.getCell('B3');
  titleCell.value = 'RUMAH SAKIT PARU SUMATERA BARAT';
  titleCell.font = { bold: true, size: 14 };
  
  worksheet.mergeCells('B4:J4');
  worksheet.getCell('B4').value = 'Jln. Dr. M. Jamil No.110 Lubuk Alung Telp ( 0751) 96013 96688 fax.96013';
  
  worksheet.mergeCells('B5:J5');
  worksheet.getCell('B5').value = 'Email.RSK.paru@gmail.com Website: rsparu.sumbarprov.go.id';

  ['B1', 'B2', 'B3', 'B4', 'B5'].forEach(cellAddress => {
    const cell = worksheet.getCell(cellAddress);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (cellAddress !== 'B3') {
      cell.font = { size: 10 };
    }
  });

  currentRow = 7;

  // Line separator
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const lineCell = worksheet.getCell(`A${currentRow}`);
  lineCell.border = { bottom: { style: 'thick' } };
  currentRow++;

  // === TITLE SECTION ===
  currentRow++;
  
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const mainTitleCell = worksheet.getCell(`A${currentRow}`);
  mainTitleCell.value = 'LAPORAN TEMUAN K3RS';
  mainTitleCell.font = { bold: true, size: 14 };
  mainTitleCell.alignment = { horizontal: 'center' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const subTitleCell = worksheet.getCell(`A${currentRow}`);
  subTitleCell.value = `${inspection.inspection_type.toUpperCase()} - ${inspectionDate.toUpperCase()}`;
  subTitleCell.font = { bold: true, size: 12 };
  subTitleCell.alignment = { horizontal: 'center' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const hospitalTitleCell = worksheet.getCell(`A${currentRow}`);
  hospitalTitleCell.value = 'RUMAH SAKIT PARU SUMATERA BARAT';
  hospitalTitleCell.font = { size: 11 };
  hospitalTitleCell.alignment = { horizontal: 'center' };
  currentRow += 2;

  // === TABLE SECTION ===
  const headerRow = currentRow;
  
  // Table headers
  const headers = [
    { text: 'NO.', width: 5 },
    { text: 'LOKASI', width: 20 },
    { text: 'TEMUAN', width: 25 },
    { text: 'DOKUMENTASI', width: 40 }, // Lebih lebar untuk gambar
    { text: 'BAHAYA/RISIKO', width: 20 },
    { text: 'REKOMENDASI', width: 20 }
  ];

  // Set column widths
  headers.forEach((header, index) => {
    const colLetter = String.fromCharCode(65 + index);
    worksheet.getColumn(colLetter).width = header.width;
  });

  // Create header row
  headers.forEach((header, index) => {
    const colLetter = String.fromCharCode(65 + index);
    const cell = worksheet.getCell(`${colLetter}${headerRow}`);
    cell.value = header.text;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA9A9A9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  currentRow++;

  // === DATA ROWS ===
  let rowNumber = 1;
  const findings = inspection.findings || [];
  
  for (const finding of findings) {
    const dataRow = currentRow;
    
    // Calculate row height based on photos and text content
    const photoCount = finding.photos ? finding.photos.length : 0;
    const textLines = Math.max(
      (finding.finding || '').split('\n').length,
      formatBulletPoints(finding.hazard_risk).split('\n').length,
      formatBulletPoints(finding.recommendation).split('\n').length
    );
    
    // Dynamic row height: lebih besar untuk menampung gambar yang diperbesar
    const baseHeight = 120; // Base height diperbesar
    const photoRows = Math.ceil(photoCount / 2); // 2 gambar per baris
    const photoHeight = photoRows * 100; // Height per baris gambar diperbesar
    const textHeight = textLines * 20; // Height untuk text
    const finalHeight = Math.max(baseHeight, photoHeight + 40, textHeight + 30);
    
    worksheet.getRow(dataRow).height = finalHeight;
    
    // NO
    const noCell = worksheet.getCell(`A${dataRow}`);
    noCell.value = rowNumber++;
    noCell.alignment = { horizontal: 'center', vertical: 'top' };
    
    // LOKASI
    const locationCell = worksheet.getCell(`B${dataRow}`);
    locationCell.value = finding.location || '-';
    locationCell.alignment = { vertical: 'top', wrapText: true };
    
    // TEMUAN
    const findingCell = worksheet.getCell(`C${dataRow}`);
    findingCell.value = finding.finding || '-';
    findingCell.alignment = { vertical: 'top', wrapText: true };
    
    // DOKUMENTASI (Images) - Column D
    const photoCell = worksheet.getCell(`D${dataRow}`);
    photoCell.alignment = { horizontal: 'center', vertical: 'top' };
    
    // Improved image positioning dengan layout yang lebih rapi
    if (finding.photos && finding.photos.length > 0) {
      const validPhotos = finding.photos.slice(0, 6); // Maksimal 6 foto
      let addedImages = 0;
      
      // Image configuration - ukuran diperbesar
      const imageWidth = 110; // Diperbesar dari 90
      const imageHeight = 80; // Diperbesar dari 65
      const imagesPerRow = 2;
      
      // Column D configuration (index 3 in 0-based)
      const photoColumnIndex = 3;
      const baseRow = dataRow - 1; // 0-based for images
      
      // Margins and spacing - disesuaikan untuk mencegah overlap
      const leftMargin = 0.02; // 2% dari tepi kiri cell
      const topMargin = 0.01; // 1% dari tepi atas cell
      const horizontalSpacing = 0.48; // Jarak horizontal antar gambar (hampir setengah kolom)
      const verticalSpacing = 0.85; // Jarak vertikal antar baris gambar dikurangi
      
      for (let i = 0; i < validPhotos.length; i++) {
        const photo = validPhotos[i];
        try {
          const base64Image = await imageToBase64(photo.signed_url);
          if (base64Image) {
            const imageId = workbook.addImage({
              base64: base64Image,
              extension: 'jpeg'
            });
            
            // Calculate grid position
            const gridRow = Math.floor(i / imagesPerRow);
            const gridCol = i % imagesPerRow;
            
            // Calculate exact position dengan spacing yang tidak overlap
            const absoluteCol = photoColumnIndex + leftMargin + (gridCol * horizontalSpacing);
            const absoluteRow = baseRow + topMargin + (gridRow * verticalSpacing);
            
            // Pastikan gambar tidak keluar dari batas kolom dengan perhitungan yang lebih akurat
            const maxCol = photoColumnIndex + 0.94; // Batas maksimal kolom
            const finalCol = Math.min(absoluteCol, maxCol);
            
            console.log(`Adding image ${i + 1}: col=${finalCol}, row=${absoluteRow}, gridRow=${gridRow}, gridCol=${gridCol}`);
            
            worksheet.addImage(imageId, {
              tl: { 
                col: finalCol,
                row: absoluteRow
              },
              ext: { width: imageWidth, height: imageHeight }
            });
            
            addedImages++;
          }
        } catch (error) {
          console.error(`Error adding image ${i + 1}:`, error);
        }
      }
      
      if (addedImages === 0) {
        photoCell.value = 'Gambar tidak dapat dimuat';
        photoCell.font = { italic: true, color: { argb: 'FF888888' } };
      } else {
        // Add text di bagian bawah cell tanpa terlalu banyak line break
        const photoRows = Math.ceil(addedImages / 2);
        const lineBreaks = Math.max(1, photoRows * 3); // Kurangi line break
        const bottomText = `${addedImages} dokumentasi`;
        photoCell.value = Array(lineBreaks).fill('').join('\n') + bottomText;
        photoCell.alignment = { horizontal: 'center', vertical: 'bottom', wrapText: true };
        photoCell.font = { size: 9, italic: true, color: { argb: 'FF666666' } };
      }
    } else {
      photoCell.value = 'Tidak ada dokumentasi';
      photoCell.font = { italic: true, color: { argb: 'FF888888' } };
      photoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // BAHAYA/RISIKO
    const riskCell = worksheet.getCell(`E${dataRow}`);
    riskCell.value = formatBulletPoints(finding.hazard_risk);
    riskCell.alignment = { vertical: 'top', wrapText: true };
    
    // REKOMENDASI
    const recoCell = worksheet.getCell(`F${dataRow}`);
    recoCell.value = formatBulletPoints(finding.recommendation);
    recoCell.alignment = { vertical: 'top', wrapText: true };
    
    // Add borders to all cells
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      const cell = worksheet.getCell(`${col}${dataRow}`);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    currentRow++;
  }

  // === SIGNATURE SECTION ===
  currentRow += 2;
  
  const today = new Date();
  const todayStr = `Lubuk Alung, ${today.getDate()} ${
    ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
     "Juli", "Agustus", "September", "Oktober", "November", "Desember"][today.getMonth()]
  } ${today.getFullYear()}`;
  
  // Left signature
  worksheet.getCell(`B${currentRow}`).value = 'Komite K3RS';
  worksheet.getCell(`B${currentRow + 1}`).value = 'Ketua';
  worksheet.getCell(`B${currentRow + 4}`).value = 'dr. Lusi Agustini Arda, Sp.P';
  worksheet.getCell(`B${currentRow + 5}`).value = 'NIP. 19840812 201101 2 008';
  
  // Right signature
  worksheet.getCell(`E${currentRow}`).value = todayStr;
  worksheet.getCell(`E${currentRow + 1}`).value = 'Petugas Pengawas';
  worksheet.getCell(`E${currentRow + 2}`).value = 'Sekretaris I Komite K3RS';
  worksheet.getCell(`E${currentRow + 4}`).value = 'Etri Putri, S.K.M';
  worksheet.getCell(`E${currentRow + 5}`).value = 'NIP. 20020424202504 2 008';

  // Style signatures
  [`B${currentRow + 4}`, `E${currentRow + 4}`].forEach(cellAddress => {
    const cell = worksheet.getCell(cellAddress);
    cell.font = { bold: true, underline: true };
  });
  
  [`B${currentRow + 5}`, `E${currentRow + 5}`].forEach(cellAddress => {
    const cell = worksheet.getCell(cellAddress);
    cell.font = { size: 9 };
  });

  return worksheet;
};

// Function untuk membuat summary worksheet
const createSummarySheet = (workbook, inspections) => {
  const worksheet = workbook.addWorksheet('Ringkasan Inspeksi');
  
  // Header
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'RINGKASAN LAPORAN INSPEKSI K3RS';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };
  
  // Table headers
  const headers = [
    { text: 'NO', width: 5 },
    { text: 'JENIS INSPEKSI', width: 20 },
    { text: 'TANGGAL', width: 15 },
    { text: 'JUMLAH TEMUAN', width: 15 },
    { text: 'JUMLAH FOTO', width: 15 },
    { text: 'STATUS', width: 15 }
  ];

  // Set column widths and headers
  headers.forEach((header, index) => {
    const colLetter = String.fromCharCode(65 + index);
    worksheet.getColumn(colLetter).width = header.width;
    const cell = worksheet.getCell(`${colLetter}3`);
    cell.value = header.text;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA9A9A9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Add data
  let currentRow = 4;
  inspections.forEach((inspection, index) => {
    const findings = inspection.findings || [];
    const totalPhotos = findings.reduce((sum, finding) => 
      sum + (finding.photos ? finding.photos.length : 0), 0);
    
    worksheet.getCell(`A${currentRow}`).value = index + 1;
    worksheet.getCell(`B${currentRow}`).value = inspection.inspection_type;
    worksheet.getCell(`C${currentRow}`).value = formatDateIndonesia(inspection.inspection_date);
    worksheet.getCell(`D${currentRow}`).value = findings.length;
    worksheet.getCell(`E${currentRow}`).value = totalPhotos;
    worksheet.getCell(`F${currentRow}`).value = findings.length > 0 ? 'Ada Temuan' : 'Tidak Ada Temuan';
    
    // Style data row
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    
    currentRow++;
  });

  return worksheet;
};

// Main function untuk generate Excel per inspeksi
export async function generateReportExcel(inspections, options = {}) {
  try {
    console.log('Generating Excel per inspection...', { inspections, options });
    
    const { month = "" } = options;
    
    // Create new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'K3RS System';
    workbook.lastModifiedBy = 'K3RS System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sort inspections by date
    const sortedInspections = inspections.sort((a, b) => 
      new Date(a.inspection_date) - new Date(b.inspection_date)
    );

    // Create summary sheet first
    createSummarySheet(workbook, sortedInspections);

    // Create individual sheets for each inspection
    for (let i = 0; i < sortedInspections.length; i++) {
      await createIndividualInspectionSheet(workbook, sortedInspections[i], i);
    }

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create blob and download
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Inspeksi_K3RS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Excel generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
}

// Function untuk generate Excel dengan template yang lebih sederhana (tanpa gambar)
export async function generateReportExcelSimple(inspections, options = {}) {
  try {
    console.log('Generating Simple Excel...', { inspections, options });
    
    const { month = "" } = options;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan K3RS');
    
    worksheet.columns = [
      { header: 'NO', key: 'no', width: 5 },
      { header: 'JENIS INSPEKSI', key: 'type', width: 15 },
      { header: 'TANGGAL', key: 'date', width: 15 },
      { header: 'LOKASI', key: 'location', width: 20 },
      { header: 'TEMUAN', key: 'finding', width: 30 },
      { header: 'BAHAYA/RISIKO', key: 'risk', width: 25 },
      { header: 'REKOMENDASI', key: 'recommendation', width: 25 },
      { header: 'JUMLAH FOTO', key: 'photoCount', width: 12 }
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFA9A9A9' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    let rowNumber = 1;
    const rows = [];
    
    inspections.forEach((inspection) => {
      const findings = inspection.findings || [];
      
      findings.forEach((finding) => {
        rows.push({
          no: rowNumber++,
          type: inspection.inspection_type,
          date: formatDateIndonesia(inspection.inspection_date),
          location: finding.location || '-',
          finding: finding.finding || '-',
          risk: formatBulletPoints(finding.hazard_risk),
          recommendation: formatBulletPoints(finding.recommendation),
          photoCount: finding.photos ? finding.photos.length : 0
        });
      });
    });

    worksheet.addRows(rows);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'top', wrapText: true };
        });
        row.height = 60;
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_K3RS_Simple_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Simple Excel generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating simple Excel:', error);
    throw error;
  }
}