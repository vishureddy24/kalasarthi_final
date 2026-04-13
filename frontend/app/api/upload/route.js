import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64String = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64String}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'kalasarthi/custom_requests',
      resource_type: 'image',
    })

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url,
      publicId: result.public_id 
    })

  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error.message 
    }, { status: 500 })
  }
}
