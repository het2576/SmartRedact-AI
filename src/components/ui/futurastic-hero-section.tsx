import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { FiArrowRight } from "react-icons/fi";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
import { Button } from "@/components/ui/button";

const COLORS_TOP = ["#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"];

interface AuroraHeroProps {
  onGetStarted: () => void;
}

export const AuroraHero = ({ onGetStarted }: AuroraHeroProps) => {
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #F8FAFC 50%, ${color})`;
  // const border = useMotionTemplate`1px solid ${color}`; // Not used
  // const boxShadow = useMotionTemplate`0px 4px 24px ${color}`; // Not used

  return (
    <motion.section
      style={{
        backgroundImage,
      }}
      className="relative grid min-h-screen place-content-center overflow-hidden gradient-bg px-4 py-24 text-gray-900"
    >
      {/* Top spacing for navbar */}
      <div className="absolute top-0 left-0 right-0 h-20 sm:h-24" />
      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-1.5 inline-block rounded-full bg-blue-100/80 px-3 py-1.5 text-sm text-blue-700 font-medium">
          Beta Now Live!
        </span>
        <h1 className="max-w-3xl text-gradient text-center text-3xl font-medium leading-tight sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
          AI-Powered Document Redaction
        </h1>
        <p className="my-6 max-w-xl text-center text-base leading-relaxed text-gray-600 md:text-lg md:leading-relaxed">
          Protect sensitive information with intelligent AI that detects and redacts
          personal data, confidential details, and more with precision and accuracy.
        </p>
        <motion.div
          whileHover={{
            scale: 1.015,
          }}
          whileTap={{
            scale: 0.985,
          }}
        >
          <Button
            onClick={onGetStarted}
            className="group relative flex w-fit items-center gap-1.5 rounded-full btn-primary"
          >
            Start free trial
            <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
          </Button>
        </motion.div>
      </div>

      <div className="absolute inset-0 z-0">
        <Canvas>
          <Stars radius={50} count={2500} factor={4} fade speed={2} />
        </Canvas>
      </div>
    </motion.section>
  );
};
