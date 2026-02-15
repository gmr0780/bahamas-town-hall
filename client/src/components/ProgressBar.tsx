const steps = ['Your Info', 'Assessment', 'Priorities', 'Interests', 'Confirm'];

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-cyan-600 text-white'
                    : isActive
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {stepNum}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-cyan-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-cyan-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
