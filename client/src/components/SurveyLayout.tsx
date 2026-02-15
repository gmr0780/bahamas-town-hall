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
      <div className="max-w-2xl mx-auto px-4 py-8 w-full flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-bahamas-aqua rounded-xl mb-3">
            <span className="text-white font-bold text-lg">BS</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Bahamas Technology Town Hall
          </h1>
        </div>
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
