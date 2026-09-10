import { useEffect, useState } from 'react';
import { supabase, type Settings } from '@/lib/supabase';
import TeacherForm from '@/components/TeacherForm';
import AdminLogin from '@/components/AdminLogin';
import AdminPanel from '@/components/AdminPanel';
import { Shield } from 'lucide-react';

type View = 'form' | 'login' | 'admin';

export default function App() {
  const [view, setView] = useState<View>('form');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase
      .from('forecast_settings')
      .select('*')
      .eq('id', true)
      .maybeSingle()
      .then(({ data }) => data && setSettings(data));

    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(!!s));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(!!s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (view === 'login' && session) {
    return <AdminPanel onSignOut={async () => { await supabase.auth.signOut(); setSession(false); setView('form'); }} />;
  }
  if (view === 'admin' && session) {
    return <AdminPanel onSignOut={async () => { await supabase.auth.signOut(); setSession(false); setView('form'); }} />;
  }
  if (view === 'login' || view === 'admin') {
    return <AdminLogin onSignedIn={() => setView('admin')} onBack={() => setView('form')} />;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-slate-100">
      <button
        onClick={() => setView('login')}
        className="fixed right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
      >
        <Shield className="h-4 w-4" /> Admin
      </button>
      <TeacherForm
        title={settings?.title ?? 'Forecast Grades'}
        subtitle={settings?.subtitle ?? 'Grade 10 student forecast grade collection'}
        academicYear={settings?.academic_year ?? 2026}
      />
    </div>
  );
}
