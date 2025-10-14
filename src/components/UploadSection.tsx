import { motion } from 'framer-motion';
import { ImageUpload } from './ui/image-upload';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export default function UploadSection({ onFileSelect, selectedFile }: UploadSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <ImageUpload
        onFileSelect={onFileSelect}
        selectedFile={selectedFile}
      />
    </motion.div>
  );
}
