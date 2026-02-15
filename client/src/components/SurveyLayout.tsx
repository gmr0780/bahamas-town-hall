import ProgressBar from './ProgressBar';

interface Props {
  step: number;
  title: string;
  children: React.ReactNode;
}

export default function SurveyLayout({ step, title, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-8 w-full flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-600 rounded-xl mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Bahamas Technology Town Hall
          </h1>
        </div>
        <ProgressBar currentStep={step} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
