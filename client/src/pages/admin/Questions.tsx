import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import QuestionField from '../../components/QuestionField';

const TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'scale', label: 'Scale' },
];

interface QuestionData {
  id?: number;
  type: string;
  label: string;
  description: string;
  required: boolean;
  options: any;
  active: boolean;
}

const emptyQuestion: QuestionData = {
  type: 'text', label: '', description: '', required: false, options: null, active: true,
};

export default function Questions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuestionData | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getAdminQuestions().then(setQuestions).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...emptyQuestion });

  const openEdit = (q: any) => setEditing({
    id: q.id, type: q.type, label: q.label,
    description: q.description || '', required: q.required,
    options: q.options, active: q.active,
  });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.updateQuestion(editing.id, editing);
      } else {
        await api.createQuestion(editing);
      }
      setEditing(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Deactivate this question? Existing responses will be preserved.')) return;
    await api.deleteQuestion(id);
    load();
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...questions];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const order = reordered.map((q, i) => ({ id: q.id, sort_order: i }));
    await api.reorderQuestions(order);
    load();
  };

  const moveDown = async (index: number) => {
    if (index === questions.length - 1) return;
    const reordered = [...questions];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    const order = reordered.map((q, i) => ({ id: q.id, sort_order: i }));
    await api.reorderQuestions(order);
    load();
  };

  const updateOptions = (value: string) => {
    if (!editing) return;
    const opts = value.split('\n').filter((s) => s.trim());
    setEditing({ ...editing, options: opts });
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-700',
      textarea: 'bg-purple-100 text-purple-700',
      dropdown: 'bg-green-100 text-green-700',
      checkbox: 'bg-amber-100 text-amber-700',
      scale: 'bg-bahamas-aqua-light text-bahamas-aqua',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[type] || 'bg-gray-100'}`}>
        {TYPES.find((t) => t.value === type)?.label || type}
      </span>
    );
  };

  if (loading) return <div className="text-gray-500">Loading questions...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
        <button
          onClick={openNew}
          className="bg-bahamas-aqua text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Add Question
        </button>
      </div>

      {/* Question list */}
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 ${
              !q.active ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-col gap-1">
              <button onClick={() => moveUp(i)} disabled={i === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30">&uarr;</button>
              <button onClick={() => moveDown(i)} disabled={i === questions.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30">&darr;</button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {typeBadge(q.type)}
                {q.required && <span className="text-xs text-red-500 font-medium">Required</span>}
                {!q.active && <span className="text-xs text-gray-500 font-medium">Inactive</span>}
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{q.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(q)}
                className="text-sm text-bahamas-aqua hover:opacity-80 font-medium">Edit</button>
              {q.active && (
                <button onClick={() => remove(q.id)}
                  className="text-sm text-red-500 hover:text-red-600 font-medium">Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No questions yet. Click "Add Question" to get started.
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing.id ? 'Edit Question' : 'New Question'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select
                  value={editing.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    let options = editing.options;
                    if (type === 'dropdown' || type === 'checkbox') options = options || [];
                    if (type === 'scale') options = { min: 1, max: 5, min_label: 'Low', max_label: 'High' };
                    if (type === 'text' || type === 'textarea') options = null;
                    setEditing({ ...editing, type, options });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  type="text"
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter the question text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Helper text shown below the question"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.required}
                  onChange={(e) => setEditing({ ...editing, required: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-bahamas-aqua"
                />
                <span className="text-sm font-medium text-gray-700">Required</span>
              </label>

              {(editing.type === 'dropdown' || editing.type === 'checkbox') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options (one per line)
                  </label>
                  <textarea
                    value={Array.isArray(editing.options) ? editing.options.join('\n') : ''}
                    onChange={(e) => updateOptions(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder={"Option 1\nOption 2\nOption 3"}
                  />
                </div>
              )}

              {editing.type === 'scale' && editing.options && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                    <input type="number" value={editing.options.min}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, min: parseInt(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                    <input type="number" value={editing.options.max}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, max: parseInt(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Label</label>
                    <input type="text" value={editing.options.min_label}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, min_label: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Label</label>
                    <input type="text" value={editing.options.max_label}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, max_label: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              )}

              {/* Live preview */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-3">Preview</p>
                <QuestionField
                  question={{
                    id: 0,
                    type: editing.type as any,
                    label: editing.label || 'Question preview',
                    description: editing.description || null,
                    required: editing.required,
                    options: editing.options,
                  }}
                  value=""
                  onChange={() => {}}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !editing.label.trim()}
                className="bg-bahamas-aqua text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:bg-gray-300">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
