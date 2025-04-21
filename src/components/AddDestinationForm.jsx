import { useState } from 'react'
import { motion } from 'framer-motion'
import { IoCloudUploadOutline, IoImageOutline, IoLocationOutline } from 'react-icons/io5'
import { useAppContext } from '../context/AppContext'
import { fetchUnsplashImage } from '../utils/unsplash'

function AddDestinationForm({ onSuccess }) {
  const { addDestination } = useAppContext()
  const [formData, setFormData] = useState({
    country: '',
    city: '',
    description: '',
    whyVisit: '',
    tags: '',
    lat: '',
    lng: '',
    imageUrl: ''
  })
  const [localImage, setLocalImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [fetchingImage, setFetchingImage] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Remove error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }))
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      setLocalImage(reader.result)
      setFormData(prev => ({ ...prev, imageUrl: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleFetchImage = async () => {
    if (!formData.city && !formData.country) {
      setErrors(prev => ({ 
        ...prev, 
        fetchImage: 'Please enter a city or country to fetch an image' 
      }))
      return
    }
    
    setFetchingImage(true)
    try {
      const searchQuery = `${formData.city} ${formData.country}`.trim()
      const imageUrl = await fetchUnsplashImage(searchQuery)
      if (imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl }))
      } else {
        setErrors(prev => ({ 
          ...prev, 
          fetchImage: 'Could not find an image. Try uploading your own or changing search terms.' 
        }))
      }
    } catch (error) {
      console.error('Error fetching image:', error)
      setErrors(prev => ({ 
        ...prev, 
        fetchImage: 'Error fetching image. Please try again.' 
      }))
    } finally {
      setFetchingImage(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    
    if (formData.lat && (isNaN(formData.lat) || formData.lat < -90 || formData.lat > 90)) {
      newErrors.lat = 'Latitude must be between -90 and 90'
    }
    
    if (formData.lng && (isNaN(formData.lng) || formData.lng < -180 || formData.lng > 180)) {
      newErrors.lng = 'Longitude must be between -180 and 180'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      // Process tags into an array
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      
      const newDestination = {
        ...formData,
        tags,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
      }
      
      addDestination(newDestination)
      onSuccess()
    } catch (error) {
      console.error('Error adding destination:', error)
      setErrors(prev => ({ ...prev, form: 'Error saving destination. Please try again.' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
        <h2 className="text-2xl font-display font-medium text-neutral-800 mb-6">Add New Destination</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="country">
                  Country*
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.country ? 'border-red-300' : 'border-neutral-300'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="e.g. Japan"
                />
                {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
              </div>
              
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="city">
                  City*
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.city ? 'border-red-300' : 'border-neutral-300'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                  placeholder="e.g. Tokyo"
                />
                {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="tags">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="e.g. beach, mountains, food"
                />
                <p className="mt-1 text-xs text-neutral-500">Separate tags with commas</p>
              </div>
              
              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="lat">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="lat"
                    name="lat"
                    value={formData.lat}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.lat ? 'border-red-300' : 'border-neutral-300'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                    placeholder="e.g. 35.6762"
                  />
                  {errors.lat && <p className="mt-1 text-sm text-red-500">{errors.lat}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="lng">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="lng"
                    name="lng"
                    value={formData.lng}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.lng ? 'border-red-300' : 'border-neutral-300'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors`}
                    placeholder="e.g. 139.6503"
                  />
                  {errors.lng && <p className="mt-1 text-sm text-red-500">{errors.lng}</p>}
                </div>
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Describe this destination..."
                ></textarea>
              </div>
              
              {/* Why visit */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="whyVisit">
                  Why it's on my list
                </label>
                <textarea
                  id="whyVisit"
                  name="whyVisit"
                  value={formData.whyVisit}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Why do you want to visit this place..."
                ></textarea>
              </div>
              
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Destination Image
                </label>
                
                <div className="flex flex-col space-y-3">
                  {/* Image preview */}
                  {(formData.imageUrl || localImage) && (
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <img 
                        src={formData.imageUrl || localImage} 
                        alt="Destination preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, imageUrl: '' }))
                          setLocalImage(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        aria-label="Remove image"
                      >
                        <IoCloseCircleOutline />
                      </button>
                    </div>
                  )}
                  
                  {!formData.imageUrl && !localImage && (
                    <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
                      <IoImageOutline className="mx-auto h-10 w-10 text-neutral-400" />
                      <p className="mt-2 text-sm text-neutral-500">
                        Upload an image or fetch from Unsplash
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Upload button */}
                    <label className="flex-1 flex justify-center items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                      <IoCloudUploadOutline className="mr-2" />
                      <span className="text-sm">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    
                    {/* Fetch from Unsplash button */}
                    <button
                      type="button"
                      onClick={handleFetchImage}
                      disabled={fetchingImage}
                      className="flex-1 flex justify-center items-center px-4 py-2 bg-primary-100 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-60"
                    >
                      {fetchingImage ? (
                        <span className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full mr-2"></div>
                          Fetching...
                        </span>
                      ) : (
                        <>
                          <IoLocationOutline className="mr-2" />
                          <span className="text-sm">Fetch from Unsplash</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
                  {errors.fetchImage && <p className="text-sm text-red-500">{errors.fetchImage}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => onSuccess()}
              className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </span>
              ) : 'Add Destination'}
            </button>
          </div>
          
          {errors.form && (
            <p className="mt-4 text-center text-red-500">{errors.form}</p>
          )}
        </form>
      </div>
    </motion.div>
  )
}

export default AddDestinationForm