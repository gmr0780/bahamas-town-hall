import ProgressBar from './ProgressBar';

interface Props {
  step: number;
  title: string;
  children: React.ReactNode;
}

export default function SurveyLayout({ step, title, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Bahamas Technology Town Hall
          </h1>
          <p className="text-gray-500 text-sm mt-1">Citizen Feedback Survey</p>
        </div>
        <ProgressBar currentStep={step} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
