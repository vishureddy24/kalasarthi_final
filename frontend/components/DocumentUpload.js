'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function DocumentUpload({ user, applicationId, onUploadComplete, allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'] }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const fileExt = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExt)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB')
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return

    setUploading(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (applicationId) {
        formData.append('applicationId', applicationId)
      }

      setProgress(30)

      const token = await user.getIdToken()
      const res = await fetch('/api/upload/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      setProgress(70)

      if (res.ok) {
        const data = await res.json()
        toast.success('Document uploaded successfully!')
        setSelectedFile(null)
        onUploadComplete?.(data)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to upload document')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setProgress(0)
  }

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            accept={allowedTypes.join(',')}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Click to upload document</p>
              <p className="text-sm text-muted-foreground">
                PDF, JPG, PNG up to 5MB
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <File className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && (
              <Button variant="ghost" size="icon" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {!uploading && (
            <Button 
              onClick={handleUpload} 
              className="w-full gap-2"
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
