export interface CraftTask {
  id?: string
  markdown: string
  taskInfo?: {
    state?: 'todo' | 'done' | 'canceled'
    scheduleDate?: string // YYYY-MM-DD or 'today', 'tomorrow'
  }
  location?: {
    type: 'inbox' | 'dailyNote'
    dailyNoteDate?: string // YYYY-MM-DD - required if type is 'dailyNote'
  }
}

export class CraftClient {
  private token: string
  private apiBase: string

  constructor(token: string, apiBase?: string) {
    // Trim whitespace from token to avoid "Invalid Authorization header" errors
    this.token = token.trim()
    this.apiBase = apiBase || 'https://connect.craft.do/links/91anr3mDrIB/api/v1'
  }

  private async request(endpoint: string, method: string, body?: any) {
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(`${this.apiBase}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Craft API request failed:', {
        endpoint,
        method,
        status: response.status,
        apiBase: this.apiBase,
        tokenLength: this.token.length,
        response: text
      })
      throw new Error(`Craft API Error ${response.status}: ${text}`)
    }

    return response.json()
  }

  async createTasks(tasks: CraftTask[]) {
    // Use the dedicated /tasks endpoint
    // Payload: { tasks: [...] }
    return this.request('/tasks', 'POST', { tasks })
  }

  async updateTasks(tasks: CraftTask[]) {
    // Use the dedicated /tasks endpoint
    // Payload: { tasksToUpdate: [...] }
    return this.request('/tasks', 'PUT', { tasksToUpdate: tasks })
  }

  async deleteTasks(ids: string[]) {
    // Use the dedicated /tasks endpoint
    // Payload: { idsToDelete: [...] }
    return this.request('/tasks', 'DELETE', { idsToDelete: ids })
  }

  async searchDailyNotes(startDate: string, endDate: string) {
    // Search daily notes by date range
    // Date format: YYYY-MM-DD
    return this.request(`/daily-notes/search?startDate=${startDate}&endDate=${endDate}`, 'GET')
  }

  async listDocuments() {
    return this.request('/documents', 'GET')
  }
}
