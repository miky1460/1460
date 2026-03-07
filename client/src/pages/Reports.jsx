import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Reports() {
  const [tab, setTab] = useState('daily');
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(MONTHS[new Date().getMonth()]);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'daily') {
        const r = await axios.get('/api/reports/attendance/daily', { params: { date: selectedDate } });
        setDailyData(r.data);
      } else if (tab === 'weekly') {
        const r = await axios.get('/api/reports/attendance/weekly', { params: { start_date: weekStart } });
        setWeeklyData(r.data);
      } else if (tab === 'monthly') {
        const r = await axios.get('/api/reports/attendance/monthly', { params: { month: selectedMonth, year: selectedYear } });
        setMonthlyData(r.data);
      } else if (tab === 'payroll') {
        const r = await axios.get('/api/reports/payroll', { params: { month: payrollMonth, year: payrollYear } });
        setPayrollData(r.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab, selectedDate, weekStart, selectedMonth, selectedYear, payrollMonth, payrollYear]);

  const statusBadge = (s) => {
    const map = { present: 'success', absent: 'danger', half_day: 'warning', work_from_home: 'info' };
    return <span className={`badge badge-${map[s] || 'gray'}`}>{s?.replace('_', ' ')}</span>;
  };

  const printReport = () => window.print();
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      <div className="page-header">
        <div>
          <h3>Reports & Analytics</h3>
          <p>Generate attendance and payroll reports</p>
        </div>
        <button className="btn btn-ghost" onClick={printReport}>Print Report</button>
      </div>

      <div className="tabs">
        {[
          { key: 'daily', label: 'Daily Attendance' },
          { key: 'weekly', label: 'Weekly Attendance' },
          { key: 'monthly', label: 'Monthly Attendance' },
          { key: 'payroll', label: 'Payroll Report' },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Daily Report */}
      {tab === 'daily' && (
        <div className="card">
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontWeight: 500 }}>
              Date:
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ maxWidth: 160 }} />
            </label>
          </div>

          {loading ? <div className="loading">Loading...</div> : dailyData && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Employees', value: dailyData.total, color: 'var(--primary)' },
                  { label: 'Present', value: dailyData.present, color: 'var(--success)' },
                  { label: 'Absent', value: dailyData.absent, color: 'var(--danger)' },
                  { label: 'Half Day', value: dailyData.half_day, color: 'var(--warning)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px 20px', background: '#f9fafb', borderRadius: 10, borderLeft: `4px solid ${s.color}` }}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {dailyData.records?.map((r, i) => (
                      <tr key={i}>
                        <td>{r.emp_code}</td>
                        <td>{r.first_name} {r.last_name}</td>
                        <td>{r.department}</td>
                        <td>{r.check_in}</td>
                        <td>{r.check_out}</td>
                        <td>{r.hours_worked > 0 ? `${r.hours_worked}h` : '-'}</td>
                        <td>{statusBadge(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Weekly Report */}
      {tab === 'weekly' && (
        <div className="card">
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontWeight: 500 }}>
              Week Starting:
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} style={{ maxWidth: 160 }} />
            </label>
          </div>
          {loading ? <div className="loading">Loading...</div> : weeklyData && (
            <>
              <div style={{ marginBottom: 12, color: '#6b7280', fontSize: 13 }}>
                Week: {weeklyData.week_start} to {weeklyData.week_end}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Employee</th><th>Department</th><th>Present Days</th><th>Absent Days</th><th>Total Hours</th></tr>
                  </thead>
                  <tbody>
                    {weeklyData.employees?.map((e, i) => (
                      <tr key={i}>
                        <td>{e.emp_code}</td>
                        <td>{e.first_name} {e.last_name}</td>
                        <td>{e.department}</td>
                        <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{e.present_days}</span></td>
                        <td><span style={{ color: e.absent_days > 0 ? 'var(--danger)' : '#374151', fontWeight: 600 }}>{e.absent_days}</span></td>
                        <td>{e.total_hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly Report */}
      {tab === 'monthly' && (
        <div className="card">
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          {loading ? <div className="loading">Loading...</div> : monthlyData && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>ID</th><th>Employee</th><th>Department</th><th>Present</th><th>Absent</th><th>Half Day</th><th>Total Hours</th><th>Avg Hours/Day</th></tr>
                </thead>
                <tbody>
                  {monthlyData.employees?.map((e, i) => (
                    <tr key={i}>
                      <td>{e.emp_code}</td>
                      <td>{e.first_name} {e.last_name}</td>
                      <td>{e.department}</td>
                      <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{e.present_days}</span></td>
                      <td><span style={{ color: e.absent_days > 0 ? 'var(--danger)' : '#374151', fontWeight: 600 }}>{e.absent_days}</span></td>
                      <td>{e.half_days}</td>
                      <td>{e.total_hours}h</td>
                      <td>{e.avg_hours ? `${e.avg_hours}h` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payroll Report */}
      {tab === 'payroll' && (
        <div className="card">
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <select value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
            <select value={payrollYear} onChange={e => setPayrollYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          {loading ? <div className="loading">Loading...</div> : payrollData && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Basic', value: `PKR ${payrollData.totals.basic.toLocaleString()}`, color: 'var(--primary)' },
                  { label: 'Total Bonus', value: `PKR ${payrollData.totals.bonus.toLocaleString()}`, color: 'var(--success)' },
                  { label: 'Total Deductions', value: `PKR ${payrollData.totals.deductions.toLocaleString()}`, color: 'var(--danger)' },
                  { label: 'Net Payroll', value: `PKR ${payrollData.totals.net.toLocaleString()}`, color: 'var(--info)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px 20px', background: '#f9fafb', borderRadius: 10, borderLeft: `4px solid ${s.color}` }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Employee</th><th>Department</th><th>Position</th><th>Basic</th><th>Bonus</th><th>Deductions</th><th>Net Salary</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {payrollData.employees?.map((e, i) => (
                      <tr key={i}>
                        <td>{e.emp_code}</td>
                        <td>{e.first_name} {e.last_name}</td>
                        <td>{e.department}</td>
                        <td>{e.position}</td>
                        <td>PKR {e.basic_salary.toLocaleString()}</td>
                        <td style={{ color: 'var(--success)' }}>+PKR {e.bonus.toLocaleString()}</td>
                        <td style={{ color: 'var(--danger)' }}>-PKR {e.deductions.toLocaleString()}</td>
                        <td><strong>PKR {e.net_salary.toLocaleString()}</strong></td>
                        <td><span className={`badge ${e.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{e.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                      <td colSpan={4}>Total ({payrollData.employees?.length} employees)</td>
                      <td>PKR {payrollData.totals.basic.toLocaleString()}</td>
                      <td style={{ color: 'var(--success)' }}>+PKR {payrollData.totals.bonus.toLocaleString()}</td>
                      <td style={{ color: 'var(--danger)' }}>-PKR {payrollData.totals.deductions.toLocaleString()}</td>
                      <td>PKR {payrollData.totals.net.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
