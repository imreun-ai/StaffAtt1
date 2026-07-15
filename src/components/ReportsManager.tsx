import { useState, Fragment } from 'react';
import { AttendanceEntity, Teacher } from '../types';
import { BarChart2, Calendar, FileText, Download, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getKhmerLunarDate, toKhmerDigits } from '../utils/khmerCalendar';
import { exportMonthlyReportToExcel, exportAnnualReportToExcel } from '../utils/excelExporter';

interface ReportsManagerProps {
  teachers: Teacher[];
  attendances: AttendanceEntity[];
}

export default function ReportsManager({ teachers, attendances }: ReportsManagerProps) {
  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
  
  // Months list in Khmer and English
  const months = [
    { value: '01', khmer: 'មករា', english: 'January' },
    { value: '02', khmer: 'កុម្ភៈ', english: 'February' },
    { value: '03', khmer: 'មីនា', english: 'March' },
    { value: '04', khmer: 'មេសា', english: 'April' },
    { value: '05', khmer: 'ឧសភា', english: 'May' },
    { value: '06', khmer: 'មិថុនា', english: 'June' },
    { value: '07', khmer: 'កក្កដា', english: 'July' },
    { value: '08', khmer: 'សីហា', english: 'August' },
    { value: '09', khmer: 'កញ្ញា', english: 'September' },
    { value: '10', khmer: 'តុលា', english: 'October' },
    { value: '11', khmer: 'វិច្ឆិកា', english: 'November' },
    { value: '12', khmer: 'ធ្នូ', english: 'December' }
  ];

  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState('07'); // Default to July
  const [reportDate, setReportDate] = useState('2026-07-15');

  // Map teachers for quick name access
  const getTeacherName = (code: string) => {
    const t = teachers.find(teach => teach.teacherCode === code);
    return t ? `${t.lastName} ${t.firstName}`.trim() : code;
  };

  // ==========================================
  // A. MONTHLY REPORT CALCULATIONS
  // ==========================================
  const getMonthlyReportData = () => {
    // Initialize aggregation map for all teachers
    const reportMap: Record<string, { teacherCode: string; name: string; totalA: number; totalP: number }> = {};
    
    teachers.forEach(t => {
      reportMap[t.teacherCode] = {
        teacherCode: t.teacherCode,
        name: `${t.lastName} ${t.firstName}`.trim(),
        totalA: 0,
        totalP: 0
      };
    });

    // Filter attendances that fall in the selected Year and Month
    const targetPrefix = `${selectedYear}-${selectedMonth}-`;
    const monthlyAttendances = attendances.filter(att => att.date.startsWith(targetPrefix));

    monthlyAttendances.forEach(att => {
      att.records.forEach(rec => {
        const teacherCode = rec.teacherId;
        // Make sure teacher exists in our map, or create placeholder
        if (!reportMap[teacherCode]) {
          reportMap[teacherCode] = {
            teacherCode,
            name: getTeacherName(teacherCode),
            totalA: 0,
            totalP: 0
          };
        }

        if (rec.status === 'A') {
          reportMap[teacherCode].totalA += 1;
        } else if (rec.status === 'P') {
          reportMap[teacherCode].totalP += 1;
        }
      });
    });

    return Object.values(reportMap).sort((a, b) => a.name.localeCompare(b.name, 'km'));
  };

  // ==========================================
  // B. ANNUAL REPORT CALCULATIONS
  // ==========================================
  const getAnnualReportData = () => {
    // Initialize map for all teachers
    // Each teacher will have: teacherCode, name, and an array or map of monthly counts
    const reportMap: Record<string, {
      teacherCode: string;
      name: string;
      monthly: Record<string, { A: number; P: number }>;
      yearlyA: number;
      yearlyP: number;
    }> = {};

    teachers.forEach(t => {
      const monthlyObj: Record<string, { A: number; P: number }> = {};
      months.forEach(m => {
        monthlyObj[m.value] = { A: 0, P: 0 };
      });

      reportMap[t.teacherCode] = {
        teacherCode: t.teacherCode,
        name: `${t.lastName} ${t.firstName}`.trim(),
        monthly: monthlyObj,
        yearlyA: 0,
        yearlyP: 0
      };
    });

    // Filter attendances for selected year
    const yearPrefix = `${selectedYear}-`;
    const yearlyAttendances = attendances.filter(att => att.date.startsWith(yearPrefix));

    yearlyAttendances.forEach(att => {
      // Extract month "MM" from "YYYY-MM-DD"
      const monthPart = att.date.split('-')[1];
      if (!monthPart) return;

      att.records.forEach(rec => {
        const teacherCode = rec.teacherId;
        if (!reportMap[teacherCode]) {
          const monthlyObj: Record<string, { A: number; P: number }> = {};
          months.forEach(m => {
            monthlyObj[m.value] = { A: 0, P: 0 };
          });
          reportMap[teacherCode] = {
            teacherCode,
            name: getTeacherName(teacherCode),
            monthly: monthlyObj,
            yearlyA: 0,
            yearlyP: 0
          };
        }

        if (rec.status === 'A') {
          if (reportMap[teacherCode].monthly[monthPart]) {
            reportMap[teacherCode].monthly[monthPart].A += 1;
          }
          reportMap[teacherCode].yearlyA += 1;
        } else if (rec.status === 'P') {
          if (reportMap[teacherCode].monthly[monthPart]) {
            reportMap[teacherCode].monthly[monthPart].P += 1;
          }
          reportMap[teacherCode].yearlyP += 1;
        }
      });
    });

    return Object.values(reportMap).sort((a, b) => a.name.localeCompare(b.name, 'km'));
  };

  const monthlyData = getMonthlyReportData();
  const annualData = getAnnualReportData();

  // Export current report to Excel
  const handleExportToExcel = () => {
    if (reportType === 'monthly') {
      const currentMonthKhmer = months.find(m => m.value === selectedMonth)?.khmer || selectedMonth;
      exportMonthlyReportToExcel(
        currentMonthKhmer,
        selectedYear,
        monthlyData,
        new Date(reportDate),
        `Monthly_Report_${selectedYear}_${selectedMonth}.xls`
      );
    } else {
      exportAnnualReportToExcel(
        selectedYear,
        months,
        annualData,
        new Date(reportDate),
        `Annual_Report_${selectedYear}.xls`
      );
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" id="reports_manager_container">
      {/* Selector Headers */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-moul text-slate-800 flex items-center gap-2">
            <span className="text-blue-600">■</span> របាយការណ៍អវត្តមានគ្រូ
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-1">
            ពិនិត្យ និងនាំចេញរបាយការណ៍អវត្តមានប្រចាំខែ ឬប្រចាំឆ្នាំរបស់គ្រូបង្រៀនទាំងអស់
          </p>
        </div>

        {/* Buttons for types & download */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                reportType === 'monthly'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              របាយការណ៍ប្រចាំខែ
            </button>
            <button
              onClick={() => setReportType('annual')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                reportType === 'annual'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              របាយការណ៍ប្រចាំឆ្នាំ
            </button>
          </div>

          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
            id="export_report_excel_btn"
          >
            <Download className="h-4 w-4" />
            ទាញយករបាយការណ៍ Excel
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        {/* Year Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">ជ្រើសរើសឆ្នាំ៖</label>
          <select
            value={selectedYear}
            onChange={(e) => {
              const year = e.target.value;
              setSelectedYear(year);
              setReportDate(`${year}-${selectedMonth}-15`);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="2026">២០២៦</option>
            <option value="2027">២០២៧</option>
            <option value="2025">២០២៥</option>
          </select>
        </div>

        {/* Month Filter (for monthly report only) */}
        {reportType === 'monthly' && (
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">ជ្រើសរើសខែ៖</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const month = e.target.value;
                setSelectedMonth(month);
                setReportDate(`${selectedYear}-${month}-15`);
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-sans"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>
                  ខែ {m.khmer} ({m.english})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Report Date Selector (Monthly only) */}
        {reportType === 'monthly' && (
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">កាលបរិច្ឆេទរបាយការណ៍ (គ.ស.)៖</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-sans"
              />
            </div>
            
            {/* Live Khmer Calendar Preview */}
            <div className="flex flex-col bg-slate-50 border border-slate-150 px-4 py-1.5 rounded-xl text-xs gap-0.5 max-w-sm md:max-w-md">
              <div>
                <span className="font-bold text-slate-500">ចន្ទគតិ៖</span>{' '}
                <span className="text-slate-800 font-medium font-sans">
                  {getKhmerLunarDate(new Date(reportDate)).fullLunarStr}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-500">សុរិយគតិ៖</span>{' '}
                <span className="text-slate-800 font-medium font-sans">
                  {getKhmerLunarDate(new Date(reportDate)).fullSolarStr}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-blue-100 ml-auto">
          <TrendingUp className="h-4 w-4 text-blue-650" />
          <span>ទិន្នន័យត្រូវបានធ្វើបច្ចុប្បន្នភាពស្វ័យប្រវត្តពី Firebase</span>
        </div>
      </div>

      {/* Reports Render Table Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {reportType === 'monthly' ? (
          /* Monthly Report View */
          <div className="space-y-4">
            <h3 className="text-md font-moul text-slate-700 flex items-center gap-1.5">
              <FileText className="h-5 w-5 text-blue-600" />
              របាយការណ៍អវត្តមានប្រចាំខែ {months.find(m => m.value === selectedMonth)?.khmer} ឆ្នាំ {selectedYear}
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 font-sans">ល.រ</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-700 font-sans">ឈ្មោះគ្រូបង្រៀន</th>
                    <th className="px-4 py-3 text-center font-bold text-rose-600 font-sans">អត់ច្បាប់ (A)</th>
                    <th className="px-4 py-3 text-center font-bold text-amber-600 font-sans">មានច្បាប់ (P)</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-800 font-sans">សរុបអវត្តមាន</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-sans">
                        មិនមានទិន្នន័យអវត្តមានក្នុងខែនេះទេ
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((row, index) => (
                      <tr key={row.teacherCode} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 font-sans">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                        <td className="px-4 py-3 text-center text-rose-600 font-bold font-sans">
                          {row.totalA > 0 ? (
                            <span className="bg-rose-50 px-2 py-0.5 rounded-full">{row.totalA}</span>
                          ) : '0'}
                        </td>
                        <td className="px-4 py-3 text-center text-amber-600 font-bold font-sans">
                          {row.totalP > 0 ? (
                            <span className="bg-amber-50 px-2 py-0.5 rounded-full">{row.totalP}</span>
                          ) : '0'}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-800 font-extrabold font-sans">
                          {row.totalA + row.totalP > 0 ? (
                            <span className="bg-slate-100 px-2.5 py-1 rounded-full">{row.totalA + row.totalP}</span>
                          ) : '0'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Annual Report View */
          <div className="space-y-4">
            <h3 className="text-md font-moul text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-5 w-5 text-blue-600" />
              របាយការណ៍អវត្តមានប្រចាំឆ្នាំ {selectedYear}
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-sans text-[11px]">
                  <tr>
                    <th rowSpan={2} className="px-3 py-3 text-left font-bold text-slate-700">ល.រ</th>
                    <th rowSpan={2} className="px-3 py-3 text-left font-bold text-slate-700 min-w-[120px]">ឈ្មោះគ្រូ</th>
                    {months.map(m => (
                      <th colSpan={2} key={m.value} className="px-2 py-1 text-center font-bold text-slate-700 border-l border-slate-200">
                        {m.khmer}
                      </th>
                    ))}
                    <th colSpan={3} className="px-3 py-1 text-center font-bold text-slate-800 border-l border-slate-200 bg-slate-100">
                      សរុបប្រចាំឆ្នាំ
                    </th>
                  </tr>
                  <tr className="bg-slate-100 text-[9px] text-slate-500 text-center">
                    {months.map(m => (
                      <Fragment key={m.value}>
                        <th className="px-1 py-1 font-semibold border-l border-slate-200 text-rose-600">A</th>
                        <th className="px-1 py-1 font-semibold text-amber-600">P</th>
                      </Fragment>
                    ))}
                    <th className="px-2 py-1 font-bold border-l border-slate-200 text-rose-600 bg-rose-50/50">A</th>
                    <th className="px-2 py-1 font-bold text-amber-600 bg-amber-50/50">P</th>
                    <th className="px-2 py-1 font-bold text-slate-800 bg-slate-200/50">សរុប</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {annualData.length === 0 ? (
                    <tr>
                      <td colSpan={28} className="px-3 py-8 text-center text-slate-400 font-sans text-sm">
                        មិនមានទិន្នន័យអវត្តមានក្នុងឆ្នាំនេះទេ
                      </td>
                    </tr>
                  ) : (
                    annualData.map((row, index) => (
                      <tr key={row.teacherCode} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-900 font-sans">{index + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-800 text-[13px]">{row.name}</td>
                        
                        {/* Monthly breakdowns */}
                        {months.map(m => {
                          const mCounts = row.monthly[m.value] || { A: 0, P: 0 };
                          return (
                            <Fragment key={m.value}>
                              <td className={`px-1 py-2 text-center border-l border-slate-100 font-sans font-medium ${mCounts.A > 0 ? 'text-rose-600 font-bold bg-rose-50/30' : 'text-slate-300'}`}>
                                {mCounts.A > 0 ? mCounts.A : '-'}
                              </td>
                              <td className={`px-1 py-2 text-center font-sans font-medium ${mCounts.P > 0 ? 'text-amber-600 font-bold bg-amber-50/30' : 'text-slate-300'}`}>
                                {mCounts.P > 0 ? mCounts.P : '-'}
                              </td>
                            </Fragment>
                          );
                        })}

                        {/* Totals */}
                        <td className="px-2 py-2 text-center font-extrabold text-rose-700 border-l border-slate-200 bg-rose-50 font-sans text-xs">
                          {row.yearlyA}
                        </td>
                        <td className="px-2 py-2 text-center font-extrabold text-amber-700 bg-amber-50 font-sans text-xs">
                          {row.yearlyP}
                        </td>
                        <td className="px-2 py-2 text-center font-black text-slate-800 bg-slate-100 font-sans text-xs">
                          {row.yearlyA + row.yearlyP}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
