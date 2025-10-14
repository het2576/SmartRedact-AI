import { Button } from "@/components/ui/button"
import { useImageUpload } from "@/components/hooks/use-image-upload"
import { ImagePlus, X, Upload, Trash2, FileText, Sparkles, Shield, Zap } from "lucide-react"
import { useCallback, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion"
import { Canvas } from "@react-three/fiber"
import { Stars } from "@react-three/drei"

const COLORS_TOP = ["#3B82F6"];

interface ImageUploadProps {
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function ImageUpload({ 
  onFileSelect, 
  selectedFile, 
  accept = "image/*,.pdf",
  maxSize = 10,
  className 
}: ImageUploadProps) {
  const {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload({
    onUpload: (url) => {
      // Handle the upload if needed
    },
    onFileSelect: onFileSelect,
  })

  const [isDragging, setIsDragging] = useState(false)
  const color = useMotionValue(COLORS_TOP[0])

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color])

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #F8FAFC 50%, ${color})`;
  // const border = useMotionTemplate`1px solid ${color}`; // Not used
  // const boxShadow = useMotionTemplate`0px 4px 24px ${color}`; // Not used

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
        // Create a proper FileList-like object
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        // Create a proper change event
        const fakeEvent = {
          target: {
            files: dataTransfer.files,
          },
        } as React.ChangeEvent<HTMLInputElement>
        
        handleFileChange(fakeEvent)
        onFileSelect?.(file)
      }
    },
    [handleFileChange, onFileSelect],
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileChange(e)
        onFileSelect?.(file)
      }
    },
    [handleFileChange, onFileSelect]
  )

  const currentFile = selectedFile || (fileName ? { name: fileName } : null)
  const isPdf = currentFile?.name?.toLowerCase().endsWith('.pdf')
  const fileSize = selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : null

  return (
    <motion.div
      style={{
        backgroundImage,
      }}
      className={cn("relative w-full overflow-hidden rounded-3xl bg-white p-6 text-gray-900", className)}
    >
      {/* Simple Background */}
      <div className="absolute inset-0 z-0 bg-gray-50" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Secure Document Upload
            </h3>
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your document and let our AI detect sensitive information with precision and care
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>AI Powered</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure Processing</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <span>Supports: JPG, PNG, GIF, PDF (up to {maxSize}MB)</span>
          </div>
        </motion.div>

        <input
          type="file"
          accept={accept}
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />

        {!currentFile ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleThumbnailClick();
            }}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer bg-white border-gray-300 z-10",
              isDragging && "scale-[1.02] bg-blue-50 border-blue-400"
            )}
          >
            <div className="w-20 h-20 mx-auto bg-blue-600 rounded-3xl flex items-center justify-center mb-6">
              <ImagePlus className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl font-bold text-gray-900">
                {isDragging ? "Drop it here!" : "Drop your document here"}
              </h4>
              <p className="text-gray-600 text-lg">
                or click to browse from your device
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Drag and drop supported</span>
              </div>
              
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleThumbnailClick();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Browse Files
              </Button>
            </div>

          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="group relative h-80 overflow-hidden rounded-3xl border border-gray-300 bg-white">
              {isPdf ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="w-24 h-24 bg-red-500 rounded-3xl flex items-center justify-center">
                    <FileText className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-bold text-gray-900">{currentFile.name}</p>
                    {fileSize && (
                      <p className="text-gray-600">{fileSize} MB</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gray-900/80 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleThumbnailClick}
                        className="h-12 w-12 p-0 bg-white/90 hover:bg-white rounded-xl"
                      >
                        <Upload className="h-5 w-5" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleRemove}
                        className="h-12 w-12 p-0 rounded-xl"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </div>
                </>
              )}
            </div>
            
            {currentFile.name && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    {isPdf ? (
                      <FileText className="w-6 h-6 text-white" />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 truncate max-w-xs">
                      {currentFile.name}
                    </p>
                    {fileSize && (
                      <p className="text-sm text-gray-600">{fileSize} MB</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handleThumbnailClick}
                      className="h-10 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 border border-gray-300"
                    >
                      Change
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={handleRemove}
                      className="h-10 w-10 p-0 text-gray-500 hover:text-red-500 rounded-xl"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
