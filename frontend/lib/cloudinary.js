import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(file, folder = 'kalasarthi') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(file)
  })
}

export async function uploadPDF(buffer, fileName, folder = 'kalasarthi/invoices') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw', // Use 'raw' for PDFs
        public_id: fileName.split('.')[0],
        format: 'pdf',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })
}

export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId)
}

export { cloudinary }
