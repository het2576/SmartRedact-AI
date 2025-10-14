import { motion } from 'framer-motion';
import { Loader2, Brain, Shield, Sparkles } from 'lucide-react';

export default function ProgressLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="relative mb-8">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border-4 border-gray-300 border-t-blue-600 rounded-full"
        />
        
        {/* Inner pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-4 border-2 border-blue-400/50 rounded-full"
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-900">
            AI is Processing Your Document
          </h3>
          <Sparkles className="w-6 h-6 text-blue-600" />
        </div>
        
        <p className="text-gray-600 max-w-md text-lg">
          Our advanced AI is analyzing and redacting sensitive information with precision and care
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span>Detecting sensitive data</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 3, repeat: Infinity }}
        className="mt-8 h-2 bg-blue-600 rounded-full"
        style={{ maxWidth: '400px' }}
      />
    </motion.div>
  );
}
