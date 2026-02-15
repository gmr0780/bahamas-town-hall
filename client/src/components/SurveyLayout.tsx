import ProgressBar from './ProgressBar';

interface Props {
  step: number;
  title: string;
  totalSteps?: number;
  children: React.ReactNode;
}

export default function SurveyLayout({ step, title, totalSteps, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex flex-col">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full flex-1">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-bahamas-aqua rounded-xl mb-2 sm:mb-3">
            <span className="text-white font-bold text-base sm:text-lg">BS</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Bahamas Technology Town Hall
          </h1>
        </div>
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
