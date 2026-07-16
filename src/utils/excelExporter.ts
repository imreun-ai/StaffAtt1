import { getKhmerLunarDate, toKhmerDigits } from './khmerCalendar';

interface MonthlyReportRow {
  teacherCode: string;
  name: string;
  totalA: number;
  totalP: number;
}

export function exportMonthlyReportToExcel(
  monthKhmer: string,
  yearNormal: string,
  data: MonthlyReportRow[],
  reportDate: Date,
  fileName: string
) {
  const { fullLunarStr, fullSolarStr } = getKhmerLunarDate(reportDate);

  // XML Header with namespace declarations and styles
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Hun Sen Kandieng High School</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <!-- Normal text default style -->
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders/>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- School Name top left -->
  <Style ss:ID="schoolHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
  <!-- Kingdom header top right -->
  <Style ss:ID="kingdomHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="kingdomSubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
  <!-- Main Report Title centered -->
  <Style ss:ID="reportTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="12" ss:Bold="1"/>
  </Style>
  <!-- Table column headers -->
  <Style ss:ID="tableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10" ss:Bold="1"/>
   <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
  </Style>
  <!-- Table body cells -->
  <Style ss:ID="cellNo">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10"/>
  </Style>
  <Style ss:ID="cellName">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10"/>
  </Style>
  <Style ss:ID="cellCount">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10"/>
  </Style>
  <!-- Footer styling -->
  <Style ss:ID="footerLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10" ss:Italic="1"/>
  </Style>
  <Style ss:ID="footerRight">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10" ss:Italic="1"/>
  </Style>
  <Style ss:ID="footerDirector">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="របាយការណ៍ប្រចាំខែ">
  <Table ss:ExpandedColumnCount="5" x:FullColumns="1" x:FullRows="1">
   <!-- Set exact column widths -->
   <Column ss:Width="45"/> <!-- Col A: ល.រ -->
   <Column ss:Width="190"/> <!-- Col B: ឈ្មោះគ្រូបង្រៀន -->
   <Column ss:Width="80"/> <!-- Col C: ឥតច្បាប់ -->
   <Column ss:Width="80"/> <!-- Col D: មានច្បាប់ -->
   <Column ss:Width="110"/> <!-- Col E: សរុបអវត្តមានរួម -->
   
   <!-- Row 1: Kingdom Header top right -->
   <Row ss:Height="22">
    <Cell ss:Index="4" ss:MergeAcross="1" ss:StyleID="kingdomHeader"><Data ss:Type="String">ព្រះរាជាណាចក្រកម្ពុជា</Data></Cell>
   </Row>
   
   <!-- Row 2: Kingdom SubHeader top right -->
   <Row ss:Height="22">
    <Cell ss:Index="4" ss:MergeAcross="1" ss:StyleID="kingdomSubHeader"><Data ss:Type="String">ជាតិ សាសនា ព្រះមហាក្សត្រ</Data></Cell>
   </Row>
   
   <!-- Row 3: School Name top left (Merged A3:C3) -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="schoolHeader"><Data ss:Type="String">វិទ្យាល័យ ហ៊ុន សែន កណ្តៀង</Data></Cell>
   </Row>
   
   <Row ss:Height="15"/>
   
   <!-- Row 5: Main Report Title -->
   <Row ss:Height="25">
    <Cell ss:MergeAcross="4" ss:StyleID="reportTitle">
     <Data ss:Type="String">របាយការណ៍អវត្តមានគ្រូបង្រៀនប្រចាំខែ ${monthKhmer} ឆ្នាំ ${toKhmerDigits(yearNormal)}</Data>
    </Cell>
   </Row>
   
   <Row ss:Height="15"/>
   
   <!-- Row 7: Table Headers -->
   <Row ss:Height="26">
    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">ល.រ</Data></Cell>
    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">ឈ្មោះគ្រូបង្រៀន</Data></Cell>
    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">ឥតច្បាប់</Data></Cell>
    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">មានច្បាប់</Data></Cell>
    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">សរុបអវត្តមានរួម</Data></Cell>
   </Row>
`;

  // Append data rows
  data.forEach((row, idx) => {
    xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="cellNo"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="cellName"><Data ss:Type="String">${row.name}</Data></Cell>
    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.totalA}</Data></Cell>
    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.totalP}</Data></Cell>
    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.totalA + row.totalP}</Data></Cell>
   </Row>`;
  });

  // Footer rows
  xml += `
   <Row ss:Height="15"/>
   <Row ss:Height="15"/>
   
   <!-- Lunar date and Solar date centered under the Director column -->
   <Row ss:Height="20">
    <Cell ss:Index="3" ss:MergeAcross="2" ss:StyleID="footerRight"><Data ss:Type="String">${fullLunarStr}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:Index="3" ss:MergeAcross="2" ss:StyleID="footerRight"><Data ss:Type="String">${fullSolarStr}</Data></Cell>
   </Row>
   
   <!-- Director Title -->
   <Row ss:Height="22">
    <Cell ss:Index="3" ss:MergeAcross="2" ss:StyleID="footerDirector"><Data ss:Type="String">នាយក</Data></Cell>
   </Row>
  </Table>
  
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <!-- Left, Right, Top, Bottom, Header, Footer Margins set to 0 as requested -->
    <Header x:Margin="0"/>
    <Footer x:Margin="0"/>
    <PageMargins x:Bottom="0" x:Left="0" x:Right="0" x:Top="0"/>
    <Layout x:Orientation="Portrait"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
    <ValidPrinterInfo/>
   </Print>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  // Create Blob and trigger download
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface AnnualReportRow {
  teacherCode: string;
  name: string;
  monthly: Record<string, { A: number; P: number }>;
  yearlyA: number;
  yearlyP: number;
}

export function exportAnnualReportToExcel(
  yearNormal: string,
  months: { value: string; khmer: string; english: string }[],
  data: AnnualReportRow[],
  reportDate: Date,
  fileName: string,
  monthYears?: Record<string, string>
) {
  const { fullLunarStr, fullSolarStr } = getKhmerLunarDate(reportDate);

  let titleYearStr = toKhmerDigits(yearNormal);
  if (monthYears) {
    const uniqueYears = Array.from(new Set(Object.values(monthYears))).sort();
    if (uniqueYears.length === 1) {
      titleYearStr = toKhmerDigits(uniqueYears[0]);
    } else {
      titleYearStr = uniqueYears.map(toKhmerDigits).join(', ');
    }
  }

  // XML Header with namespace declarations and styles
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Hun Sen Kandieng High School</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <!-- Normal text default style -->
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders/>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- School Name top left -->
  <Style ss:ID="schoolHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
  <!-- Kingdom header top right -->
  <Style ss:ID="kingdomHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="kingdomSubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
  <!-- Main Report Title centered -->
  <Style ss:ID="reportTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="12" ss:Bold="1"/>
  </Style>
  <!-- Table column headers -->
  <Style ss:ID="tableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="9" ss:Bold="1"/>
   <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
  </Style>
  <!-- Table body cells -->
  <Style ss:ID="cellNo">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="9"/>
  </Style>
  <Style ss:ID="cellName">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="9"/>
  </Style>
  <Style ss:ID="cellCount">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="9"/>
  </Style>
  <!-- Footer styling -->
  <Style ss:ID="footerLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10" ss:Italic="1"/>
  </Style>
  <Style ss:ID="footerRight">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS SiemReap" ss:Size="10" ss:Italic="1"/>
  </Style>
  <Style ss:ID="footerDirector">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Khmer OS Muol" ss:Size="11" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="របាយការណ៍ប្រចាំឆ្នាំ">
  <Table ss:ExpandedColumnCount="29" x:FullColumns="1" x:FullRows="1">
   <!-- Set exact column widths -->
   <Column ss:Width="35"/> <!-- Col A: ល.រ -->
   <Column ss:Width="160"/> <!-- Col B: ឈ្មោះគ្រូបង្រៀន -->
`;

  // Define 24 columns for monthly sub-columns (12 months * 2)
  for (let i = 0; i < 24; i++) {
    xml += `   <Column ss:Width="30"/>\n`;
  }

  xml += `   <Column ss:Width="65"/> <!-- Col AA: ឥតច្បាប់ (A) -->
   <Column ss:Width="65"/> <!-- Col AB: មានច្បាប់ (P) -->
   <Column ss:Width="65"/> <!-- Col AC: សរុបរួម -->
   
   <!-- Row 1: Kingdom Header top right -->
   <Row ss:Height="22">
    <Cell ss:Index="24" ss:MergeAcross="5" ss:StyleID="kingdomHeader"><Data ss:Type="String">ព្រះរាជាណាចក្រកម្ពុជា</Data></Cell>
   </Row>
   
   <!-- Row 2: Kingdom SubHeader top right -->
   <Row ss:Height="22">
    <Cell ss:Index="24" ss:MergeAcross="5" ss:StyleID="kingdomSubHeader"><Data ss:Type="String">ជាតិ សាសនា ព្រះមហាក្សត្រ</Data></Cell>
   </Row>
   
   <!-- Row 3: School Name top left (Merged A3:C3) -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="schoolHeader"><Data ss:Type="String">វិទ្យាល័យ ហ៊ុន សែន កណ្តៀង</Data></Cell>
   </Row>
   
   <Row ss:Height="15"/>
   
   <!-- Row 5: Main Report Title -->
   <Row ss:Height="25">
    <Cell ss:MergeAcross="28" ss:StyleID="reportTitle">
     <Data ss:Type="String">របាយការណ៍អវត្តមានគ្រូបង្រៀនប្រចាំឆ្នាំ ${titleYearStr}</Data>
    </Cell>
   </Row>
   
   <Row ss:Height="15"/>
   
   <!-- Row 7: Table Headers (Upper level) -->
   <Row ss:Height="26">
    <Cell ss:MergeDown="1" ss:StyleID="tableHeader"><Data ss:Type="String">ល.រ</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="tableHeader"><Data ss:Type="String">ឈ្មោះគ្រូបង្រៀន</Data></Cell>
`;

  months.forEach(m => {
    const yearStr = monthYears && monthYears[m.value] ? ' (' + toKhmerDigits(monthYears[m.value]) + ')' : '';
    xml += `    <Cell ss:MergeAcross="1" ss:StyleID="tableHeader"><Data ss:Type="String">${m.khmer}${yearStr}</Data></Cell>\n`;
  });

  xml += `    <Cell ss:MergeDown="1" ss:StyleID="tableHeader"><Data ss:Type="String">ឥតច្បាប់ (A)</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="tableHeader"><Data ss:Type="String">មានច្បាប់ (P)</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="tableHeader"><Data ss:Type="String">សរុបរួម</Data></Cell>
   </Row>
   
   <!-- Row 8: Table Sub-headers (A/P for each month) -->
   <Row ss:Height="20">
    <Cell ss:Index="3" ss:StyleID="tableHeader"><Data ss:Type="String">A</Data></Cell>
    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">P</Data></Cell>
`;

  // Remaining 11 months' A/P labels
  for (let i = 0; i < 11; i++) {
    xml += `    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">A</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="tableHeader"><Data ss:Type="String">P</Data></Cell>\n`;
  }

  xml += `   </Row>\n`;

  // Append data rows
  data.forEach((row, idx) => {
    xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="cellNo"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="cellName"><Data ss:Type="String">${row.name}</Data></Cell>\n`;

    months.forEach(m => {
      xml += `    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.monthly[m.value]?.A || 0}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.monthly[m.value]?.P || 0}</Data></Cell>\n`;
    });

    xml += `    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.yearlyA}</Data></Cell>
    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.yearlyP}</Data></Cell>
    <Cell ss:StyleID="cellCount"><Data ss:Type="Number">${row.yearlyA + row.yearlyP}</Data></Cell>
   </Row>\n`;
  });

  // Footer rows
  xml += `   <Row ss:Height="15"/>
   <Row ss:Height="15"/>
   
   <!-- Lunar date and Solar date centered under the Director column -->
   <Row ss:Height="20">
    <Cell ss:Index="23" ss:MergeAcross="5" ss:StyleID="footerRight"><Data ss:Type="String">${fullLunarStr}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:Index="23" ss:MergeAcross="5" ss:StyleID="footerRight"><Data ss:Type="String">${fullSolarStr}</Data></Cell>
   </Row>
   
   <!-- Director Title -->
   <Row ss:Height="22">
    <Cell ss:Index="23" ss:MergeAcross="5" ss:StyleID="footerDirector"><Data ss:Type="String">នាយក</Data></Cell>
   </Row>
  </Table>
  
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Header x:Margin="0"/>
    <Footer x:Margin="0"/>
    <PageMargins x:Bottom="0" x:Left="0" x:Right="0" x:Top="0"/>
    <Layout x:Orientation="Landscape"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
    <ValidPrinterInfo/>
   </Print>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  // Create Blob and trigger download
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
