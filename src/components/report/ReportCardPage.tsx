import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getDayNumber } from '../../lib/dateUtils';
import { calculateReportCard, gradeColor } from '../../lib/reportCard';

export default function ReportCardPage() {
  const { goals, entries, settings } = useAppStore();
  const cardRef = useRef<HTMLDivElement>(null);

  if (!settings) return null;
  const totalDays = settings.totalDays ?? 1127;
  const dayNumber = getDayNumber(settings.startDate, totalDays);

  const grades = goals.map(g => calculateReportCard(g, entries, settings.startDate));
  grades.sort((a, b) => b.overallScore - a.overallScore);

  async function exportPNG() {
    try {
      const { default: html2canvas } = await import('html2canvas');
      if (!cardRef.current) return;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `project-1127-report-day${dayNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  }

  const overallAvg = grades.length
    ? Math.round(grades.reduce((s, g) => s + g.overallScore, 0) / grades.length)
    : 0;

  function overallGradeFromScore(score: number) {
    if (score >= 95) return 'A+';
    if (score >= 87) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 72) return 'B';
    if (score >= 65) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  const overallGrade = overallGradeFromScore(overallAvg);

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">REPORT CARD</div>
        <button className="ml-auto btn-ghost py-1 px-3 text-xs" onClick={exportPNG}>
          EXPORT PNG
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Report card */}
        <div ref={cardRef} className="bg-black p-4 space-y-4">
          {/* Header */}
          <div className="border border-accent/30 p-4 space-y-1">
            <div className="font-display text-accent text-lg tracking-widest text-glow">PROJECT 1127</div>
            <div className="font-mono text-xs text-muted">PROGRESS REPORT — DAY {dayNumber} OF {totalDays.toLocaleString()}</div>
            <div className="font-mono text-xs text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>

          {/* Overall grade */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-muted">OVERALL PERFORMANCE</div>
              <div className="font-mono text-xs text-muted mt-1">{overallAvg}/100</div>
            </div>
            <div
              className="font-display text-5xl font-bold"
              style={{ color: gradeColor(overallGrade as any) }}
            >
              {overallGrade}
            </div>
          </div>

          {/* Per-goal grades */}
          <div className="space-y-2">
            {grades.map((g, rank) => (
              <div key={g.goalId} className="card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-muted">#{rank + 1}</div>
                    <div className="font-mono text-sm text-text truncate">{g.goalName}</div>
                  </div>
                  <div
                    className="font-display text-2xl font-bold shrink-0"
                    style={{ color: gradeColor(g.overallGrade) }}
                  >
                    {g.overallGrade}
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'COMPLETION', value: g.completionRate },
                    { label: 'STREAK', value: g.streakScore },
                    { label: 'CONSISTENCY', value: g.consistencyScore },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className="font-mono text-xs text-muted">{stat.label}</div>
                      <div className="font-mono text-xs text-accent">{stat.value}%</div>
                      <div className="h-1 bg-border rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${stat.value}%`, background: gradeColor(g.overallGrade) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="font-mono text-xs text-muted text-center border-t border-border pt-3">
            {totalDays - dayNumber} DAYS REMAINING — KEEP THE CONTRACT
          </div>
        </div>
      </div>
    </div>
  );
}
