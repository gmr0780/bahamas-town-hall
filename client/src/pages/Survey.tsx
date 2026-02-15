import { useSurvey } from '../hooks/useSurvey';
import Signup from './Signup';
import SelfAssessment from './SelfAssessment';
import Priorities from './Priorities';
import InterestAreas from './InterestAreas';
import Confirmation from './Confirmation';

export default function Survey() {
  const { step, data, updateData, nextStep, prevStep } = useSurvey();

  switch (step) {
    case 1:
      return <Signup data={data} updateData={updateData} onNext={nextStep} />;
    case 2:
      return <SelfAssessment data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
    case 3:
      return <Priorities data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
    case 4:
      return <InterestAreas data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
    case 5:
      return <Confirmation data={data} onBack={prevStep} />;
    default:
      return null;
  }
}
