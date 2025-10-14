import { AuroraHero } from '../components/ui/futurastic-hero-section';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="relative">
      <AuroraHero onGetStarted={onGetStarted} />
    </div>
  );
}
