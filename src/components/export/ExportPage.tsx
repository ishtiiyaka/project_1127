import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getDayNumber } from '../../lib/dateUtils';
import { exportBackup, importBackup, type FullBackup } from '../../lib/db';

export default function ExportPage() {
  const { goals, entries, dailyLogs, reviews, milestones, settings, initialize } = useAppStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [restoreMsg, setRestoreMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!settings) return null;

  const dayNumber = getDayNumber(settings.startDate);
  const realEntries = entries.filter(e => !e.isAutoFilled);

  // ─── JSON Backup ──────────────────────────────────────────────────────────
  async function handleExportBackup() {
    setExporting('backup');
    const backup = await exportBackup();
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `project-1127-backup-day${dayNumber}-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreStatus('idle');
    try {
      const text = await file.text();
      const backup: FullBackup = JSON.parse(text);
      if (backup.version !== 1 || !Array.isArray(backup.goals)) {
        throw new Error('Invalid backup file format.');
      }
      await importBackup(backup);
      await initialize();
      setRestoreStatus('success');
      setRestoreMsg(`Restored ${backup.goals.length} goals, ${backup.entries.length} entries from ${backup.exportedAt.slice(0, 10)}.`);
    } catch (err) {
      setRestoreStatus('error');
      setRestoreMsg(err instanceof Error ? err.message : 'Unknown error.');
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ─── CSV Export ───────────────────────────────────────────────────────────
  function exportCSV() {
    setExporting('csv');
    const rows = [
      ['date', 'goalId', 'goalName', 'content', 'isAutoFilled', 'mood', 'reflection'],
      ...entries.map(e => {
        const goal = goals.find(g => g.id === e.goalId);
        const log = dailyLogs.find(l => l.date === e.date);
        return [
          e.date,
          e.goalId,
          goal?.name ?? '',
          `"${e.content.replace(/"/g, '""')}"`,
          String(e.isAutoFilled),
          log?.mood ?? '',
          log ? `"${log.reflection.replace(/"/g, '""')}"` : '',
        ];
      }),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-1127-export-day-${dayNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  }

  // ─── PDF Export ───────────────────────────────────────────────────────────
  async function exportPDF(type: 'full' | string) {
    setExporting(type);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const green = [0, 255, 65] as [number, number, number];
      const black = [0, 0, 0] as [number, number, number];
      const muted = [85, 85, 85] as [number, number, number];

      doc.setFillColor(...black);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setTextColor(...green);
      doc.setFontSize(20);
      doc.text('PROJECT 1127', 15, 20);
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text(`Day ${dayNumber} of 1,127 — Exported ${settings!.startDate}`, 15, 27);

      doc.setTextColor(...green);
      doc.setFontSize(9);
      doc.text(`TOTAL ENTRIES: ${realEntries.length}`, 15, 36);
      doc.text(`GOALS: ${goals.length}`, 100, 36);

      let y = 48;
      const goalsToExport = type === 'full' ? goals : goals.filter(g => g.id === type);

      for (const goal of goalsToExport) {
        if (y > 270) { doc.addPage(); doc.setFillColor(...black); doc.rect(0, 0, 210, 297, 'F'); y = 15; }
        doc.setTextColor(...green);
        doc.setFontSize(11);
        doc.text(goal.name.toUpperCase(), 15, y);
        doc.setFontSize(7);
        doc.setTextColor(...muted);
        doc.text(`${goal.priority.toUpperCase()}${goal.targetDays ? ` — TARGET: ${goal.targetDays} DAYS` : ''}`, 15, y + 5);
        y += 12;

        const goalEntries = entries
          .filter(e => e.goalId === goal.id)
          .sort((a, b) => b.date.localeCompare(a.date));

        for (const entry of goalEntries) {
          if (y > 275) { doc.addPage(); doc.setFillColor(...black); doc.rect(0, 0, 210, 297, 'F'); y = 15; }
          doc.setFontSize(7);
          doc.setTextColor(...muted);
          doc.text(entry.date, 15, y);
          doc.setTextColor(entry.isAutoFilled ? 60 : 200, entry.isAutoFilled ? 60 : 200, entry.isAutoFilled ? 60 : 200);
          const lines = doc.splitTextToSize(entry.content, 170);
          doc.text(lines, 40, y);
          y += 5 * lines.length + 2;
        }
        y += 6;
      }

      doc.save(`project-1127-${type === 'full' ? 'full' : goals.find(g => g.id === type)?.name ?? 'goal'}-day${dayNumber}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setExporting(null);
  }

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/settings" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="font-display text-accent text-sm tracking-widest">EXPORT & BACKUP</div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* ── BACKUP / RESTORE ── */}
        <div className="card p-4 space-y-3 border-accent/40">
          <div className="font-mono text-xs text-accent tracking-widest">BACKUP & RESTORE</div>
          <p className="font-mono text-xs text-muted leading-relaxed">
            Save a full backup file to your device. Restore it anytime — on a new phone, after data loss,
            or every 2 weeks for safety. The file contains all goals, entries, reviews, and settings.
          </p>

          <button
            className="btn-primary w-full py-3"
            disabled={!!exporting}
            onClick={handleExportBackup}
          >
            {exporting === 'backup' ? 'SAVING...' : '⬇ DOWNLOAD BACKUP (.json)'}
          </button>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="font-mono text-xs text-muted">RESTORE FROM BACKUP</div>
            <p className="font-mono text-xs text-muted">
              ⚠ This will <span className="text-critical">replace all current data</span> with the backup file.
            </p>
            <button
              className="btn-ghost w-full py-3"
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆ CHOOSE BACKUP FILE (.json)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportBackup}
            />
            {restoreStatus === 'success' && (
              <div className="font-mono text-xs text-accent border border-accent/30 px-3 py-2">
                ✓ {restoreMsg}
              </div>
            )}
            {restoreStatus === 'error' && (
              <div className="font-mono text-xs text-critical border border-critical/30 px-3 py-2">
                ✗ {restoreMsg}
              </div>
            )}
          </div>
        </div>

        {/* ── FULL PDF ── */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">FULL JOURNAL PDF</div>
          <p className="font-mono text-xs text-muted">
            All daily entries, weekly reviews, milestone cards, mood log, and statistics.
          </p>
          <button
            className="btn-primary w-full py-3"
            disabled={!!exporting}
            onClick={() => exportPDF('full')}
          >
            {exporting === 'full' ? 'GENERATING...' : 'EXPORT FULL PDF'}
          </button>
        </div>

        {/* ── PER-GOAL PDF ── */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">PER-GOAL PDF</div>
          <div className="space-y-2">
            {goals.map(goal => (
              <button
                key={goal.id}
                className="btn-ghost w-full py-2 text-left flex justify-between items-center"
                disabled={!!exporting}
                onClick={() => exportPDF(goal.id)}
              >
                <span className="truncate">{goal.name}</span>
                <span className="text-xs text-muted shrink-0 ml-2">
                  {exporting === goal.id ? 'GENERATING...' : 'EXPORT →'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CSV ── */}
        <div className="card p-4 space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">RAW CSV</div>
          <p className="font-mono text-xs text-muted">
            All entries as a spreadsheet: date, goal, content, mood, reflection.
          </p>
          <button
            className="btn-primary w-full py-3"
            disabled={!!exporting}
            onClick={exportCSV}
          >
            {exporting === 'csv' ? 'GENERATING...' : 'EXPORT CSV'}
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="card p-4 space-y-2">
          <div className="font-mono text-xs text-muted tracking-widest">EXPORT SUMMARY</div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="flex justify-between"><span className="text-muted">TOTAL ENTRIES</span><span className="text-accent">{entries.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">REAL ENTRIES</span><span className="text-accent">{realEntries.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">DAILY LOGS</span><span className="text-accent">{dailyLogs.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">WEEKLY REVIEWS</span><span className="text-accent">{reviews.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">MILESTONES</span><span className="text-accent">{milestones.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">CURRENT DAY</span><span className="text-accent">{dayNumber}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
