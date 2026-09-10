export const GRADE_COLORS: Record<string, string> = {
  'A*': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-lime-100 text-lime-800 border-lime-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-amber-100 text-amber-800 border-amber-300',
  E: 'bg-orange-100 text-orange-800 border-orange-300',
  F: 'bg-red-100 text-red-800 border-red-300',
  G: 'bg-rose-100 text-rose-800 border-rose-300',
  U: 'bg-stone-200 text-stone-800 border-stone-300',
  X: 'bg-slate-200 text-slate-800 border-slate-300',
};

export function gradeColor(grade: string): string {
  return GRADE_COLORS[grade] ?? 'bg-gray-100 text-gray-800 border-gray-300';
}
