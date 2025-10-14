import { motion } from 'framer-motion';
import { CheckCircle2, Shield, EyeOff } from 'lucide-react';

interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence: number;
  source: string;
  selected?: boolean;
}

interface VerifyListProps {
  entities: Entity[];
  onToggle: (index: number) => void;
}

export default function VerifyList({ entities, onToggle }: VerifyListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold text-gradient mb-1">
              Detected Sensitive Information
            </h3>
            <p className="text-sm text-gray-600">
              Click on items to include or exclude them from redaction
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            {entities.filter(e => e.selected).length}
          </p>
          <p className="text-xs text-gray-600">of {entities.length} selected</p>
        </div>
      </div>

      <div className="grid gap-3">
        {entities.map((entity, index) => (
          <motion.div
            key={`${entity.start}-${entity.end}-${entity.text}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              entity.selected
                ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-200/40'
                : 'border-gray-200 bg-white/80 hover:border-blue-300/50 hover:bg-blue-50/50 hover:shadow-lg hover:shadow-blue-100/20'
            }`}
            onClick={() => onToggle(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    entity.selected
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}>
                    {entity.type}
                  </span>
                  <span className={`flex items-center space-x-1 text-xs font-medium ${
                    entity.confidence >= 0.8 ? 'text-green-600' :
                    entity.confidence >= 0.6 ? 'text-yellow-600' :
                    'text-orange-600'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <span>{(entity.confidence * 100).toFixed(0)}%</span>
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {entity.source}
                  </span>
                </div>
                <p className="text-base font-medium text-gray-900">{entity.text}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                {entity.selected ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center"
                  >
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
