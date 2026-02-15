import type { Question } from '../lib/types';

interface Props {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export default function QuestionField({ question, value, onChange }: Props) {
  switch (question.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-1">{question.description}</p>
          )}
          <input
            type="text"
            required={question.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-1">{question.description}</p>
          )}
          <textarea
            required={question.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
            placeholder={question.description || ''}
          />
        </div>
      );

    case 'dropdown': {
      const options = question.options as string[];
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-1">{question.description}</p>
          )}
          <select
            required={question.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
          >
            <option value="">Select an option</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    case 'checkbox': {
      const options = question.options as string[];
      let selected: string[] = [];
      try { selected = value ? JSON.parse(value) : []; } catch { selected = []; }

      const toggle = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt];
        onChange(JSON.stringify(next));
      };

      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-2">{question.description}</p>
          )}
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selected.includes(opt)
                    ? 'border-bahamas-aqua bg-bahamas-aqua-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="w-4 h-4 rounded border-gray-300 text-bahamas-aqua focus:ring-bahamas-aqua"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'scale': {
      const opts = question.options as { min: number; max: number; min_label: string; max_label: string };
      const levels = [];
      for (let i = opts.min; i <= opts.max; i++) levels.push(i);

      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-2">{question.description}</p>
          )}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{opts.min_label}</span>
            <div className="flex gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange(String(level))}
                  className={`w-10 h-10 rounded-full font-semibold transition-colors ${
                    value === String(level)
                      ? 'bg-bahamas-aqua text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">{opts.max_label}</span>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
