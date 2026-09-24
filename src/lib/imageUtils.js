/**
 * Utility functions for client-side image compression, uploading,
 * and embedding session images.
 */

/**
 * Compresses an image File or Blob using HTML5 Canvas.
 * @param {File|Blob} file 
 * @param {Object} options
 * @param {number} [options.maxWidth=1200]
 * @param {number} [options.maxHeight=1200]
 * @param {number} [options.quality=0.82]
 * @param {string} [options.mimeType='image/jpeg']
 * @returns {Promise<{ dataUrl: string, blob: Blob }>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Bilddatei'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate scaling preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        // Enable high quality image scaling
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL(mimeType, quality)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob })
            } else {
              resolve({ dataUrl, blob: null })
            }
          },
          mimeType,
          quality
        )
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Attempts to upload an image to Supabase Storage.
 * Falls back gracefully if bucket permissions or RLS block the upload.
 * 
 * @param {object} supabase - Supabase client instance
 * @param {string} bucket - Storage bucket name, e.g. 'avatars'
 * @param {string} filePath - Path / file name inside bucket
 * @param {Blob|File} blobOrFile - Image blob or file
 * @param {string} [contentType='image/jpeg'] - MIME type
 * @returns {Promise<{ publicUrl: string|null, error: any }>}
 */
export async function uploadImageToStorage(supabase, bucket, filePath, blobOrFile, contentType = 'image/jpeg') {
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blobOrFile, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      return { publicUrl: null, error: uploadError }
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return { publicUrl: data?.publicUrl || null, error: null }
  } catch (err) {
    return { publicUrl: null, error: err }
  }
}

const IMG_REGEX = /<!--SPORTIS_IMG:(.*?)-->|\[SPORTIS_IMG:(.*?)\]/s

/**
 * Embeds an image URL or data URL into a session description string.
 * @param {string} description 
 * @param {string} imageUrl 
 * @returns {string}
 */
export function embedSessionImage(description = '', imageUrl = '') {
  const clean = (description || '').replace(IMG_REGEX, '').trim()
  if (!imageUrl) return clean
  return `<!--SPORTIS_IMG:${imageUrl.trim()}-->\n${clean}`
}

/**
 * Extracts an embedded image URL and cleans the description string.
 * @param {string} description 
 * @returns {{ imageUrl: string|null, cleanDescription: string }}
 */
export function extractSessionImage(description = '') {
  if (!description) return { imageUrl: null, cleanDescription: '' }
  const match = description.match(IMG_REGEX)
  const imageUrl = match ? (match[1] || match[2] || '').trim() : null
  const cleanDescription = description.replace(IMG_REGEX, '').trim()
  return { imageUrl, cleanDescription }
}
