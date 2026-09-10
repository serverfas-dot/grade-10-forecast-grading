import { useEffect, useMemo, useState } from 'react';
import { supabase, type Submission, type Subject } from '@/lib/supabase';
import { gradeColor } from '@/lib/constants';
import { Table2, Loader2, Download, Search, Trash2 } from 'lucide-react';

type Props = {
  academicYear: number;
};

export default function ResultsGrid({ academicYear }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void load();
  }, [academicYear]);

  async function load() {
    setLoading(true);
    const [subRes, subjRes] = await Promise.all([
      supabase.from('forecast_submissions').select('*').eq('academic_year', academicYear),
      supabase.from('forecast_subjects').select('*').order('sort_order'),
    ]);
    setSubmissions(subRes.data ?? []);
    setSubjects(subjRes.data ?? []);
    setLoading(false);
  }

  async function clearAll() {
    if (!confirm(`Delete ALL forecast results for ${academicYear}? This cannot be undone.`)) return;
    await supabase.from('forecast_submissions').delete().eq('academic_year', academicYear);
    void load();
  }

  const rows = useMemo(() => {
    const byStudent = new Map<string, { index: string; name: string; gender: string; grades: Record<string, string> }>();
    for (const s of submissions) {
      const key = s.student_index;
      if (!byStudent.has(key)) {
        byStudent.set(key, { index: s.student_index, name: s.student_name, gender: s.gender, grades: {} });
      }
      byStudent.get(key)!.grades[s.subject] = s.forecast_grade;
    }
    const sorted = [...byStudent.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      return sorted.filter(
        (r) => r.name.toLowerCase().includes(q) || r.index.toLowerCase().includes(q),
      );
    }
    return sorted;
  }, [submissions, search]);

  const activeSubjects = subjects.filter((s) => s.is_active);

  function exportCsv() {
    const headers = ['Index', 'Name', 'Gender', ...activeSubjects.map((s) => s.name)];
    const lines = rows.map((r) =>
      [r.index, r.name, r.gender, ...activeSubjects.map((s) => r.grades[s.name] ?? '')]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast-grades-${academicYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Table2 className="h-5 w-5 shrink-0 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Forecast Results — {academicYear}
          </h2>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {rows.length} students
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-44">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={clearAll}
              disabled={rows.length === 0}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50 sm:flex-none"
            >
              <Trash2 className="h-4 w-4" /> Clear All
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <p className="text-slate-500">No forecasts submitted yet for {academicYear}.</p>
          <p className="mt-1 text-sm text-slate-400">
            Once teachers submit the form, results appear here in alphabetical order.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="sticky left-0 z-10 min-w-[140px] border-r border-slate-700 px-3 py-3 text-left font-semibold">
                  Student Name
                </th>
                <th className="min-w-[80px] px-3 py-3 text-left font-semibold">Index</th>
                <th className="min-w-[70px] px-3 py-3 text-left font-semibold">Gender</th>
                {activeSubjects.map((s) => (
                  <th key={s.id} className="min-w-[70px] px-3 py-3 text-center font-semibold">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.index} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-3 py-2.5 font-medium text-slate-900">
                    {r.name}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{r.index}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.gender}</td>
                  {activeSubjects.map((s) => {
                    const g = r.grades[s.name];
                    return (
                      <td key={s.id} className="px-3 py-2.5 text-center">
                        {g ? (
                          <span
                            className={`inline-block min-w-[2rem] rounded-md border px-1.5 py-0.5 text-xs font-bold ${gradeColor(g)}`}
                          >
                            {g}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
