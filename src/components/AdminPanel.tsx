import { useEffect, useState } from 'react';
import { supabase, type Student, type Subject, type GradeOption, type GenderOption, type Settings } from '@/lib/supabase';
import ResultsGrid from './ResultsGrid';
import {
  Users, BookOpen, Award, UserCircle, Settings as SettingsIcon, Table2,
  Plus, Trash2, Pencil, X, Check, LogOut, Loader2,
} from 'lucide-react';

type Tab = 'results' | 'students' | 'subjects' | 'grades' | 'genders' | 'settings';

export default function AdminPanel({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>('results');
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    void supabase
      .from('forecast_settings')
      .select('*')
      .eq('id', true)
      .maybeSingle()
      .then(({ data }) => data && setSettings(data));
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'results', label: 'Results', icon: Table2 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'genders', label: 'Genders', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{settings?.title ?? 'Forecast Grades'}</h1>
            <p className="text-xs text-slate-500">Administrator Panel</p>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'results' && <ResultsGrid academicYear={settings?.academic_year ?? 2026} />}
        {tab === 'students' && <StudentsManager />}
        {tab === 'subjects' && <OptionsManager table="forecast_subjects" label="Subject" field="name" />}
        {tab === 'grades' && <OptionsManager table="forecast_grade_options" label="Grade" field="value" />}
        {tab === 'genders' && <OptionsManager table="forecast_gender_options" label="Gender" field="value" />}
        {tab === 'settings' && <SettingsManager settings={settings} onSaved={setSettings} />}
      </main>
    </div>
  );
}

/* ---------- Students ---------- */

function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('forecast_students').select('*').order('name');
    setStudents(data ?? []);
    setLoading(false);
  }

  async function remove(s: Student) {
    if (!confirm(`Delete ${s.name}? This also removes their forecasts.`)) return;
    await supabase.from('forecast_students').delete().eq('id', s.id);
    await supabase.from('forecast_submissions').delete().eq('student_index', s.index_number);
    void load();
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">Students ({students.length})</h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      {showForm && (
        <StudentForm
          student={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-semibold">Index Number</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Gender</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-slate-700">{s.index_number}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.gender}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <IconBtn onClick={() => { setEditing(s); setShowForm(true); }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn onClick={() => void remove(s)} title="Delete" danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  No students yet. Click "Add Student" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentForm({
  student,
  onClose,
  onSaved,
}: {
  student: Student | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [indexNumber, setIndexNumber] = useState(student?.index_number ?? '');
  const [name, setName] = useState(student?.name ?? '');
  const [gender, setGender] = useState(student?.gender ?? 'Male');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { index_number: indexNumber, name, gender };
    let result;
    if (student) {
      result = await supabase.from('forecast_students').update(payload).eq('id', student.id);
    } else {
      result = await supabase.from('forecast_students').insert(payload);
    }
    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={save}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {student ? 'Edit Student' : 'Add Student'}
          </h3>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <Field label="Index Number">
          <input value={indexNumber} onChange={(e) => setIndexNumber(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Gender">
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {student ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Generic Options Manager (subjects, grades, genders) ---------- */

function OptionsManager({ table, label, field }: { table: string; label: string; field: string }) {
  const [items, setItems] = useState<(Subject | GradeOption | GenderOption)[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVal, setNewVal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from(table).select('*').order('sort_order');
    setItems(data ?? []);
    setLoading(false);
  }

  async function add() {
    if (!newVal.trim()) return;
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
    await supabase.from(table).insert({ [field]: newVal.trim(), sort_order: maxOrder + 1 });
    setNewVal('');
    void load();
  }

  async function remove(id: string) {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    await supabase.from(table).delete().eq('id', id);
    void load();
  }

  async function toggleActive(item: Subject | GradeOption | GenderOption) {
    await supabase.from(table).update({ is_active: !item.is_active }).eq('id', item.id);
    void load();
  }

  async function saveEdit(id: string) {
    if (!editVal.trim()) return;
    await supabase.from(table).update({ [field]: editVal.trim() }).eq('id', id);
    setEditingId(null);
    void load();
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{label}s</h2>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={`New ${label.toLowerCase()}…`}
          className={inputCls}
        />
        <button
          onClick={add}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">{label}</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-500">{item.sort_order}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {editingId === item.id ? (
                    <input
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void saveEdit(item.id)}
                      className={inputCls}
                    />
                  ) : (
                    field === 'name' ? (item as Subject).name : (item as GradeOption | GenderOption).value
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => void toggleActive(item)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {item.is_active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {editingId === item.id ? (
                      <>
                        <IconBtn onClick={() => void saveEdit(item.id)} title="Save">
                          <Check className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn onClick={() => setEditingId(null)} title="Cancel">
                          <X className="h-4 w-4" />
                        </IconBtn>
                      </>
                    ) : (
                      <>
                        <IconBtn
                          onClick={() => {
                            setEditingId(item.id);
                            setEditVal(field === 'name' ? (item as Subject).name : (item as GradeOption | GenderOption).value);
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn onClick={() => void remove(item.id)} title="Delete" danger>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsManager({
  settings,
  onSaved,
}: {
  settings: Settings | null;
  onSaved: (s: Settings) => void;
}) {
  const [title, setTitle] = useState(settings?.title ?? '');
  const [subtitle, setSubtitle] = useState(settings?.subtitle ?? '');
  const [year, setYear] = useState(settings?.academic_year ?? 2026);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase
      .from('forecast_settings')
      .update({ title, subtitle, academic_year: year, updated_at: new Date().toISOString() })
      .eq('id', true)
      .select('*')
      .maybeSingle();
    if (data) onSaved(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Settings</h2>
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Form Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Form Subtitle">
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Academic Year">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
            min={2000}
            max={2100}
            className={inputCls}
          />
        </Field>
        <p className="text-xs text-slate-500">
          The academic year applies to the teacher form and the results grid. Change it each year — all submissions stay linked to their year.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Settings
          </button>
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        </div>
      </form>
    </div>
  );
}

/* ---------- Shared ---------- */

const inputCls =
  'w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md p-1.5 transition ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
