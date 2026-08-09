import Hero from '../components/landing/Hero';
import ProcessSection from '../components/landing/ProcessSection';
import CatchGrid from '../components/landing/CatchGrid';
import FinePrint from '../components/landing/FinePrint';
import ClosingCta from '../components/landing/ClosingCta';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div>
      <Hero onGetStarted={onGetStarted} />
      <ProcessSection />
      <CatchGrid />
      <FinePrint />
      <ClosingCta onGetStarted={onGetStarted} />
    </div>
  );
}
