import { create } from 'zustand'
import { Configuration } from '../services/api'

interface ConfigurationStore {
  // State
  configurations: Configuration[]
  currentConfiguration: Configuration | null
  isLoading: boolean
  error: string | null
  total: number
  limit: number
  offset: number

  // Actions
  setConfigurations: (configs: Configuration[], total: number, limit: number, offset: number) => void
  setCurrentConfiguration: (config: Configuration | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useConfigurationStore = create<ConfigurationStore>((set) => ({
  // Initial state
  configurations: [],
  currentConfiguration: null,
  isLoading: false,
  error: null,
  total: 0,
  limit: 10,
  offset: 0,

  // Actions
  setConfigurations: (configs, total, limit, offset) =>
    set({ configurations: configs, total, limit, offset }),
  setCurrentConfiguration: (config) => set({ currentConfiguration: config }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      configurations: [],
      currentConfiguration: null,
      isLoading: false,
      error: null,
      total: 0,
    }),
}))
