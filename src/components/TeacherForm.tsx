import { useEffect, useState } from 'react';
import { supabase, type Subject, type GradeOption, type Student } from '@/lib/supabase';
import { gradeColor } from '@/lib/constants';
import { GraduationCap, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type Props = {
  title: string;
  subtitle: string;
  academicYear: number;
};

export default function TeacherForm({ title, subtitle, academicYear }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [indexNumber, setIndexNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [gender, setGender] = useState('');
  const [subject, setSubject] = useState('');
  const [forecastGrade, setForecastGrade] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadOptions();
  }, []);

  async function loadOptions() {
    const [subRes, gradeRes, stuRes] = await Promise.all([
      supabase.from('forecast_subjects').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('forecast_grade_options').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('forecast_students').select('*').order('name'),
    ]);
    if (subRes.data) setSubjects(subRes.data);
    if (gradeRes.data) setGrades(gradeRes.data);
    if (stuRes.data) setStudents(stuRes.data);
  }

  function handleStudentPick(name: string) {
    setStudentName(name);
    const stu = students.find((s) => s.name === name);
    if (stu) {
      setIndexNumber(stu.index_number);
      setGender(stu.gender);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!indexNumber || !studentName || !gender || !subject || !forecastGrade) {
      setError('Please fill in every field before submitting.');
      setSubmitting(false);
      return;
    }

    const { error: submitError } = await supabase.rpc('submit_forecast', {
      p_academic_year: academicYear,
      p_student_index: indexNumber,
      p_student_name: studentName,
      p_gender: gender,
      p_subject: subject,
      p_forecast_grade: forecastGrade,
    });

    if (submitError) {
      setError('Could not save the forecast. Please check your selections and try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
    setSubject('');
    setForecastGrade('');
    setTimeout(() => setSuccess(false), 4000);
  }

  const inputBase =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-slate-600">{subtitle}</p>
        <p className="mt-1 text-sm font-medium text-sky-700">Academic Year {academicYear}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Student Index Number
          </label>
          <input
            type="text"
            value={indexNumber}
            onChange={(e) => setIndexNumber(e.target.value)}
            placeholder="e.g. 10G001"
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Student Name</label>
          <select value={studentName} onChange={(e) => handleStudentPick(e.target.value)} className={inputBase}>
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.index_number})
              </option>
            ))}
          </select>
          {students.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-600">
              No students have been added yet. An administrator must add students first.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputBase}>
            <option value="">Select gender…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputBase}>
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Forecast Grade</label>
          <div className="flex flex-wrap gap-2">
            {grades.map((g) => {
              const selected = forecastGrade === g.value;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setForecastGrade(g.value)}
                  className={`min-w-[3rem] rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                    selected
                      ? `${gradeColor(g.value)} ring-2 ring-offset-1 ring-sky-400`
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {g.value}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Forecast for {studentName} — {subject}: {forecastGrade || 'submitted'} saved successfully.
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Send className="h-5 w-5" /> Submit Forecast
            </>
          )}
        </button>
      </form>
    </div>
  );
}
