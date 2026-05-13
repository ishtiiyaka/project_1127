import type { Goal, Priority } from '../../types';
import { uid } from '../../lib/dateUtils';

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

interface Props {
  goals: Goal[];
  onChange: (goals: Goal[]) => void;
}

export default function GoalConfigurator({ goals, onChange }: Props) {
  function addGoal() {
    if (goals.length >= 7) return;
    onChange([
      ...goals,
      { id: uid(), name: '', priority: 'high', createdAt: new Date().toISOString(), locked: false },
    ]);
  }

  function updateGoal(id: string, field: keyof Goal, value: string) {
    onChange(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  }

  function removeGoal(id: string) {
    onChange(goals.filter(g => g.id !== id));
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted">
        Define 1–7 core commitments. These will be locked after 24 hours.
      </p>

      {goals.map((goal, i) => (
        <div key={goal.id} className="card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted w-4">{i + 1}.</span>
            <input
              className="input flex-1 text-sm"
              placeholder="Commitment name..."
              value={goal.name}
              onChange={e => updateGoal(goal.id, 'name', e.target.value)}
              maxLength={80}
            />
            <button
              className="font-mono text-xs text-critical hover:text-critical/70 px-2"
              onClick={() => removeGoal(goal.id)}
            >
              ✕
            </button>
          </div>
          <div className="flex gap-1 pl-6">
            {PRIORITIES.map(p => (
              <button
                key={p}
                onClick={() => updateGoal(goal.id, 'priority', p)}
                className={`text-xs font-mono border px-2 py-0.5 transition-all priority-${p} ${
                  goal.priority === p ? 'bg-current/10' : 'opacity-40'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      ))}

      {goals.length < 7 && (
        <button
          className="btn-ghost w-full py-3 border-dashed"
          onClick={addGoal}
        >
          + ADD COMMITMENT {goals.length > 0 ? `(${goals.length}/7)` : ''}
        </button>
      )}

      {goals.length === 0 && (
        <p className="font-mono text-xs text-critical text-center">
          At least one commitment is required.
        </p>
      )}
    </div>
  );
}
