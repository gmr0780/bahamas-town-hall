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
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 w-full flex-1">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-bahamas-aqua rounded-xl mb-2 sm:mb-3">
            <span className="text-white font-bold text-base sm:text-xl">BS</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
            Bahamas Technology Town Hall
          </h1>
        </div>
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 lg:p-10">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
