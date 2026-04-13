'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function ImageUpload({ onUpload, onClear, existingUrl = '' }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(existingUrl)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  })

  const uploadImage = async () => {
    if (!file) {
      toast.error('Please select an image first')
      return
    }

    if (!user) {
      toast.error('Please login first')
      return
    }

    setUploading(true)
    setProgress(30)

    try {
      const token = await user.getIdToken()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'kalasarthi/products')

      setProgress(60)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      setProgress(90)

      if (response.ok) {
        const data = await response.json()
        onUpload(data.url)
        toast.success('Image uploaded successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload image')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const clearImage = () => {
    setFile(null)
    setPreview('')
    onClear()
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to select • JPG, PNG, WebP • Max 5MB
            </p>
          </div>
        </div>
      ) : (
        /* Preview Area */
        <div className="relative">
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
          </div>
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Upload Button */}
      {file && !uploading && (
        <Button 
          onClick={uploadImage}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      )}
    </div>
  )
}
