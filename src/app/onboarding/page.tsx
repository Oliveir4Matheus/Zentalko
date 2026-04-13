import { OnboardingWizard } from './wizard';
import { PLACEMENT_BANK } from '@/server/placement/bank';

export default function OnboardingPage() {
  const questions = PLACEMENT_BANK.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: q.choices,
  }));
  return <OnboardingWizard questions={questions} />;
}
