const steps = ['Your Info', 'Self-Assessment', 'Priorities', 'Interests', 'Confirm'];

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {steps.map((label, i) => (
          <div
            key={label}
            className={`text-xs font-medium ${
              i + 1 <= currentStep ? 'text-cyan-600' : 'text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
