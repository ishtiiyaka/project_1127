import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { uid } from '../../lib/dateUtils';
import { getDailyTip } from '../../lib/tips';
import { getDayNumber } from '../../lib/dateUtils';
import HeatmapFull from '../ghost/HeatmapFull';
import type { GoalNote } from '../../types';

export default function GoalHistory() {
  const { goalId } = useParams<{ goalId: string }>();
  const { goals, entries, settings, notes, addNote, updateNote, removeNote } = useAppStore();
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<GoalNote | null>(null);

  const goal = goals.find(g => g.id === goalId);
  const goalEntries = entries
    .filter(e => e.goalId === goalId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const goalNotes = notes
    .filter(n => n.goalId === goalId)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt.localeCompare(a.createdAt));

  if (!goal) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="font-mono text-muted">Goal not found.</span>
    </div>
  );

  const realEntries = goalEntries.filter(e => !e.isAutoFilled);
  const totalWords = realEntries.reduce((sum, e) =>
    sum + (e.wordCount ?? e.content.trim().split(/\s+/).filter(Boolean).length), 0);
  const avgWords = realEntries.length > 0 ? Math.round(totalWords / realEntries.length) : 0;
  const dayNumber = settings ? getDayNumber(settings.startDate) : 1;
  const tip = getDailyTip(goal.name, dayNumber);

  async function handleAddNote() {
    if (!noteContent.trim() || !goal) return;
    if (editingNote) {
      await updateNote({ ...editingNote, content: noteContent.trim() });
      setEditingNote(null);
    } else {
      await addNote({
        id: uid(),
        goalId: goal.id,
        content: noteContent.trim(),
        createdAt: new Date().toISOString(),
        pinned: false,
      });
    }
    setNoteContent('');
  }

  async function togglePin(note: GoalNote) {
    await updateNote({ ...note, pinned: !note.pinned });
  }

  function startEdit(note: GoalNote) {
    setEditingNote(note);
    setNoteContent(note.content);
  }

  function cancelEdit() {
    setEditingNote(null);
    setNoteContent('');
  }

  return (
    <div className="min-h-screen bg-black page-enter pb-8">
      <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-mono text-xs text-muted hover:text-accent">← BACK</Link>
        <div className="flex-1 min-w-0">
          <div className="font-display text-accent text-sm tracking-widest truncate">{goal.name}</div>
        </div>
        <span className={`text-xs font-mono border px-2 py-0.5 shrink-0 priority-${goal.priority}`}>
          {goal.priority.toUpperCase()}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">

        {/* Daily tip */}
        <div className="font-mono text-xs text-muted italic border-l-2 border-accent-dim pl-3 py-1 leading-relaxed">
          💡 {tip}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{realEntries.length}</div>
            <div className="font-mono text-xs text-muted">ENTRIES</div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{totalWords}</div>
            <div className="font-mono text-xs text-muted">WORDS</div>
          </div>
          <div className="card p-3 text-center">
            <div className="font-display text-accent text-xl font-bold">{avgWords}</div>
            <div className="font-mono text-xs text-muted">AVG/ENTRY</div>
          </div>
        </div>

        {/* Full heatmap */}
        {settings && (
          <div className="card p-4 space-y-2">
            <div className="font-mono text-xs text-muted tracking-widest">JOURNEY HEATMAP</div>
            <HeatmapFull goalId={goal.id} entries={goalEntries} startDate={settings.startDate} />
          </div>
        )}

        {/* ── Notes Scratchpad ── */}
        <div className="space-y-3">
          <div className="font-mono text-xs text-muted tracking-widest">NOTES & RESOURCES</div>

          {/* Add/Edit note */}
          <div className="card p-3 space-y-2">
            <textarea
              className="input resize-none text-xs leading-relaxed"
              rows={3}
              placeholder="Add a note, resource, link, or study tip for this goal..."
              maxLength={500}
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
            />
            <div className="flex gap-2">
              {editingNote && (
                <button className="btn-ghost py-2 px-3 text-xs" onClick={cancelEdit}>CANCEL</button>
              )}
              <button
                className="btn-primary flex-1 py-2 text-xs"
                disabled={!noteContent.trim()}
                onClick={handleAddNote}
              >
                {editingNote ? 'UPDATE NOTE' : '+ ADD NOTE'}
              </button>
            </div>
          </div>

          {/* Notes list */}
          {goalNotes.map(note => (
            <div key={note.id} className={`card p-3 space-y-2 ${note.pinned ? 'border-accent/30' : ''}`}>
              <div className="flex items-start gap-2">
                <p className="font-mono text-xs text-text leading-relaxed flex-1 whitespace-pre-wrap">
                  {note.pinned && <span className="text-accent mr-1">📌</span>}
                  {note.content}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">{note.createdAt.slice(0, 10)}</span>
                <div className="flex gap-2">
                  <button
                    className="font-mono text-xs text-muted hover:text-accent transition-colors px-1"
                    onClick={() => togglePin(note)}
                  >
                    {note.pinned ? 'UNPIN' : 'PIN'}
                  </button>
                  <button
                    className="font-mono text-xs text-muted hover:text-accent transition-colors px-1"
                    onClick={() => startEdit(note)}
                  >
                    EDIT
                  </button>
                  <button
                    className="font-mono text-xs text-muted hover:text-critical transition-colors px-1"
                    onClick={() => removeNote(note.id)}
                  >
                    DEL
                  </button>
                </div>
              </div>
            </div>
          ))}

          {goalNotes.length === 0 && (
            <p className="font-mono text-xs text-muted text-center py-4">No notes yet. Add resources, links, or study reminders.</p>
          )}
        </div>

        {/* Entry list */}
        <div className="space-y-2">
          <div className="font-mono text-xs text-muted tracking-widest">ALL ENTRIES ({goalEntries.length})</div>
          {goalEntries.map(entry => {
            const wc = entry.wordCount ?? entry.content.trim().split(/\s+/).filter(Boolean).length;
            return (
              <div key={entry.id} className={`card p-3 space-y-1 ${entry.isAutoFilled ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{entry.date}</span>
                  <div className="flex gap-2 items-center">
                    {!entry.isAutoFilled && (
                      <span className="font-mono text-xs text-muted">{wc}w</span>
                    )}
                    {entry.isAutoFilled && (
                      <span className="font-mono text-xs text-muted border border-border px-1">AUTO</span>
                    )}
                    {entry.sealed && (
                      <span className="font-mono text-xs border px-1" style={{ color: 'var(--accent-dim)', borderColor: 'var(--accent-dim)' }}>SEALED</span>
                    )}
                  </div>
                </div>
                <p className="font-mono text-sm text-text leading-relaxed">{entry.content}</p>
              </div>
            );
          })}
          {goalEntries.length === 0 && (
            <p className="font-mono text-xs text-muted text-center py-8">No entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
