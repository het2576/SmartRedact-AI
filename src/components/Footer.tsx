import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 py-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center space-x-2"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Secure Processing</span>
          </motion.div>
          
          <div className="w-px h-4 bg-gray-300" />
          
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
            </motion.div>
            <span className="text-sm font-medium text-gray-700">AI Powered</span>
          </div>
          
          <div className="w-px h-4 bg-gray-300" />
          
          <p className="text-sm text-gray-600">
            Built with <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-red-500 inline-block"
            >❤️</motion.span> by Team Gen2
          </p>
        </div>
      </div>
    </footer>
  );
}
