import crypto from 'crypto'

/**
 * Generates a unique, short slug using MD5 hash of timestamp + random component
 * 
 * This provides:
 * - Security: Users cannot guess or manipulate slugs
 * - Uniqueness: Combination of timestamp and random data ensures uniqueness
 * - Brevity: MD5 hash is shorter than UUID (12 chars vs 36 chars)
 * 
 * @param length - Length of the slug (default: 12 characters)
 * @returns A unique slug string
 */
export function generateUniqueSlug(length: number = 12): string {
  // Combine timestamp with random bytes for uniqueness
  const timestamp = Date.now().toString()
  const randomBytes = crypto.randomBytes(8).toString('hex')
  const combined = `${timestamp}-${randomBytes}`
  
  // Create MD5 hash
  const hash = crypto.createHash('md5').update(combined).digest('hex')
  
  // Return first N characters of the hash
  return hash.substring(0, length)
}

/**
 * Client-side version of slug generator (for browser environments)
 * Uses Web Crypto API instead of Node.js crypto module
 * 
 * @param length - Length of the slug (default: 12 characters)
 * @returns A unique slug string
 */
export function generateUniqueSlugClient(length: number = 12): string {
  // Combine timestamp with random data
  const timestamp = Date.now().toString()
  const randomArray = new Uint8Array(8)
  crypto.getRandomValues(randomArray)
  const randomHex = Array.from(randomArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  const combined = `${timestamp}-${randomHex}`
  
  // Create a simple hash using the combined string
  // Note: This is a simplified hash for client-side use
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to hex and pad
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0')
  
  // Add more randomness to ensure uniqueness
  const additionalRandom = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  const fullHash = hexHash + additionalRandom
  
  // Return first N characters
  return fullHash.substring(0, length)
}

