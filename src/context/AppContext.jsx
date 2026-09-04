import { createContext, useContext, useEffect, useState } from 'react'

const AppContext = createContext()

export function useAppContext() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const [destinations, setDestinations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage on mount
  useEffect(() => {
    const loadDestinations = () => {
      try {
        const storedDestinations = localStorage.getItem('travelBucketList')
        if (storedDestinations) {
          setDestinations(JSON.parse(storedDestinations))
        }
      } catch (error) {
        console.error('Error loading destinations from localStorage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDestinations()
  }, [])

  // Save to localStorage whenever destinations change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('travelBucketList', JSON.stringify(destinations))
    }
  }, [destinations, isLoading])

  // Add a new destination
  const addDestination = (destination) => {
    const newDestination = {
      ...destination,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
      visited: false,
    }
    
    setDestinations(prev => [...prev, newDestination])
    return newDestination
  }

  // Toggle visited status
  const toggleVisited = (id) => {
    setDestinations(prev => 
      prev.map(dest => 
        dest.id === id ? { ...dest, visited: !dest.visited } : dest
      )
    )
  }

  // Update destination
  const updateDestination = (id, updates) => {
    setDestinations(prev => 
      prev.map(dest => 
        dest.id === id ? { ...dest, ...updates } : dest
      )
    )
  }

  // Delete destination
  const deleteDestination = (id) => {
    setDestinations(prev => prev.filter(dest => dest.id !== id))
  }

  // Calculate progress stats
  const getProgressStats = () => {
    const total = destinations.length
    const visited = destinations.filter(dest => dest.visited).length
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0
    
    return { total, visited, percentage }
  }

  // Count unique countries
  const getUniqueCountriesCount = () => {
    const uniqueCountries = new Set(destinations.map(dest => dest.country))
    return uniqueCountries.size
  }

  const value = {
    destinations,
    isLoading,
    addDestination,
    toggleVisited,
    updateDestination,
    deleteDestination,
    getProgressStats,
    getUniqueCountriesCount
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}