import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
// Normalize to ensure we do not double-append `/api`
const normalizedApiBase = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`

const apiClient: AxiosInstance = axios.create({
  baseURL: `${normalizedApiBase}/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ValidationRule {
  rule_type: string
  value: any
}

export interface ParentCondition {
  operator: string
  value: any
  default_value: any
}

export interface Translation {
  language: string
  label: string
  description?: string
}

export interface Configuration {
  id: string
  key: string
  label: string
  description?: string
  data_type: string
  default_value?: string
  active: boolean
  parent_config_id?: string
  validation_rules: ValidationRule[]
  parent_conditions: ParentCondition[]
  translations: Translation[]
  created_at: string
  updated_at: string
}

export interface ConfigurationListResponse {
  items: Configuration[]
  total: number
  limit: number
  offset: number
}

export interface ParentOption {
  id: string
  key: string
  label: string
  data_type: string
}

export interface CreateConfigurationRequest {
  key: string
  label: string
  description?: string
  data_type: string
  default_value?: string
  validation_rules?: ValidationRule[]
  parent_config_id?: string
  parent_conditions?: ParentCondition[]
  translations?: Translation[]
}

export interface UpdateConfigurationRequest {
  label?: string
  description?: string
  data_type?: string
  default_value?: string
  validation_rules?: ValidationRule[]
  parent_config_id?: string
  parent_conditions?: ParentCondition[]
  translations?: Translation[]
  active?: boolean
}

export const configurationsAPI = {
  // List configurations
  async listConfigurations(limit: number = 10, offset: number = 0): Promise<ConfigurationListResponse> {
    const response = await apiClient.get<ConfigurationListResponse>('/configurations', {
      params: { limit, offset },
    })
    return response.data
  },

  // Get single configuration
  async getConfiguration(id: string): Promise<Configuration> {
    const response = await apiClient.get<Configuration>(`/configurations/by-id/${id}`)
    return response.data
  },

  // Create configuration
  async createConfiguration(data: CreateConfigurationRequest): Promise<Configuration> {
    const response = await apiClient.post<Configuration>('/configurations', data)
    return response.data
  },

  // Update configuration
  async updateConfiguration(id: string, data: UpdateConfigurationRequest): Promise<Configuration> {
    const response = await apiClient.put<Configuration>(`/configurations/by-id/${id}`, data)
    return response.data
  },

  // Delete configuration
  async deleteConfiguration(id: string): Promise<void> {
    await apiClient.delete(`/configurations/by-id/${id}`)
  },

  // Get parent options
  async getParentOptions(currentConfigId?: string): Promise<ParentOption[]> {
    const url = currentConfigId 
      ? `/configurations/parent-options/by/${currentConfigId}` 
      : '/configurations/parent-options'
    const response = await apiClient.get<ConfigurationListResponse>(url)
    return response.data.items.map(item => ({
      id: item.id,
      key: item.key,
      label: item.label,
      data_type: item.data_type,
    }))
  },
}
