'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, FileImage, Scan, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function OCRUpload({ user, onDataExtracted, documentType = 'aadhaar' }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [extractionStatus, setExtractionStatus] = useState('') // 'uploading', 'ocr', 'ai', 'complete', 'error'

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB')
      return
    }

    setSelectedFile(file)
    setExtractionStatus('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAndExtract = async () => {
    if (!selectedFile || !user) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    setProgress(10)
    setExtractionStatus('uploading')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', documentType)

      setProgress(30)
      setExtractionStatus('ocr')

      const token = await user.getIdToken()
      const res = await fetch('/api/ocr/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      setProgress(70)
      setExtractionStatus('ai')

      if (res.ok) {
        const data = await res.json()
        setProgress(100)
        setExtractionStatus('complete')

        if (data.extractedData) {
          onDataExtracted?.(data.extractedData)
          toast.success('Document data extracted successfully!')
          
          // Voice feedback
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('Your details have been extracted and filled successfully')
            utterance.lang = 'en-IN'
            window.speechSynthesis.speak(utterance)
          }
        } else {
          toast.warning('Could not extract all details. Please fill manually.')
        }
      } else {
        const error = await res.json()
        setExtractionStatus('error')
        toast.error(error.error || 'Failed to extract data')
      }
    } catch (err) {
      console.error('OCR upload error:', err)
      setExtractionStatus('error')
      toast.error('Failed to process document')
    } finally {
      setUploading(false)
    }
  }

  const getStatusMessage = () => {
    switch (extractionStatus) {
      case 'uploading':
        return { text: 'Uploading document...', icon: <Upload className="h-4 w-4 animate-bounce" /> }
      case 'ocr':
        return { text: 'Reading text from image (OCR)...', icon: <Scan className="h-4 w-4 animate-pulse" /> }
      case 'ai':
        return { text: 'AI is parsing document structure...', icon: <Loader2 className="h-4 w-4 animate-spin" /> }
      case 'complete':
        return { text: 'Data extracted successfully!', icon: <CheckCircle className="h-4 w-4 text-green-500" /> }
      case 'error':
        return { text: 'Extraction failed. Please try again.', icon: <AlertCircle className="h-4 w-4 text-red-500" /> }
      default:
        return null
    }
  }

  const status = getStatusMessage()

  return (
    <Card className="border-amber-100">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold">Auto-fill from Document</h3>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            AI-Powered
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Upload your {documentType === 'aadhaar' ? 'Aadhaar card' : 'document'} and we'll auto-fill your details using OCR + AI.
        </p>

        {/* File Input */}
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
            <input
              type="file"
              id="ocr-file"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileSelect}
            />
            <label
              htmlFor="ocr-file"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <FileImage className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Click to upload {documentType === 'aadhaar' ? 'Aadhaar' : 'document'}</p>
                <p className="text-sm text-muted-foreground">JPG, PNG up to 10MB</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Preview */}
            {preview && (
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Document preview" 
                  className="w-full h-40 object-contain rounded-lg border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                    setExtractionStatus('')
                    setProgress(0)
                  }}
                  disabled={uploading}
                >
                  Change
                </Button>
              </div>
            )}

            {/* File Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{selectedFile.name}</span>
              <span className="text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            {/* Progress */}
            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                {status && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    {status.icon}
                    <span>{status.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Extract Button */}
            {!uploading && extractionStatus !== 'complete' && (
              <Button 
                onClick={handleUploadAndExtract}
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Scan className="h-4 w-4" />
                Extract & Auto-fill
              </Button>
            )}

            {/* Success State */}
            {extractionStatus === 'complete' && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Data extracted! Form has been filled.</span>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Tips for best results:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Use clear, well-lit images</li>
            <li>Ensure all text is visible and not blurry</li>
            <li>Avoid shadows and glare on the document</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
