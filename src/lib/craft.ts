export interface CraftTask {
  id?: string
  markdown: string
  taskInfo?: {
    state?: 'todo' | 'done' | 'canceled'
    scheduleDate?: string // YYYY-MM-DD
  }
  location?: {
    type: 'inbox' | 'dailyNote'
    dailyNoteDate?: string // YYYY-MM-DD - required if type is 'dailyNote'
  }
}

export interface CraftBlock {
  id?: string
  type?: 'text' | 'page'
  markdown: string
  listStyle?: 'task' | 'bullet' | 'numbered' | 'toggle' | 'none'
  taskInfo?: {
    state?: 'todo' | 'done' | 'canceled'
    scheduleDate?: string // YYYY-MM-DD
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

    console.log(`Craft API request: ${method} ${this.apiBase}${endpoint}`)
    if (body) {
      console.log('Request body:', JSON.stringify(body, null, 2))
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

    const result = await response.json()
    console.log('Craft API response:', JSON.stringify(result, null, 2))
    return result
  }

  async listDocuments() {
    return this.request('/documents', 'GET')
  }

  async searchDocuments(searchTerms: string[]) {
    const params = new URLSearchParams()
    searchTerms.forEach(term => params.append('include', term))
    return this.request(`/documents/search?${params.toString()}`, 'GET')
  }

  async getBlocks(blockId: string, maxDepth: number = -1) {
    return this.request(`/blocks?id=${blockId}&maxDepth=${maxDepth}`, 'GET')
  }

  async insertBlocks(blocks: CraftBlock[], pageId: string, position: 'start' | 'end' = 'end') {
    // Use the /blocks POST endpoint with proper position
    return this.request('/blocks', 'POST', {
      blocks: blocks.map(block => ({
        type: block.type || 'text',
        markdown: block.markdown,
        listStyle: block.listStyle || 'task',
        taskInfo: block.taskInfo,
      })),
      position: {
        position,
        pageId,
      }
    })
  }

  async createTasks(tasks: CraftTask[]) {
    // Use the /blocks endpoint with date position to add items to the daily note for each date
    // The caller should group by date and call this separately for each date
    const blocks = tasks.map(task => ({
      type: 'text' as const,
      markdown: task.markdown,
      listStyle: 'task' as const,
      taskInfo: task.taskInfo,
    }))

    // Get the dailyNoteDate from the first task (all tasks in this batch should have the same date)
    const dailyNoteDate = tasks[0]?.location?.dailyNoteDate

    if (dailyNoteDate) {
      // Use the /blocks POST endpoint with date position to add to the specific daily note
      // The date format should be YYYY-MM-DD or "today"
      console.log(`Adding ${blocks.length} calendar items to daily note for date: ${dailyNoteDate}`)
      return this.request('/blocks', 'POST', {
        blocks,
        position: {
          position: 'end',
          date: dailyNoteDate,
        }
      })
    }

    // Fallback: just create blocks without specific date
    return this.request('/blocks', 'POST', {
      blocks,
      position: {
        position: 'end',
      }
    })
  }

  async updateTasks(tasks: CraftTask[]) {
    // Use the /blocks PUT endpoint
    return this.request('/blocks', 'PUT', {
      blocks: tasks.map(task => ({
        id: task.id,
        markdown: task.markdown,
        taskInfo: task.taskInfo,
      }))
    })
  }

  async deleteTasks(ids: string[]) {
    // Use the /blocks DELETE endpoint
    return this.request('/blocks', 'DELETE', { blockIds: ids })
  }

  async searchDailyNotes(startDate: string, endDate: string) {
    // Search for documents containing dates in the range
    return this.searchDocuments([startDate])
  }
}
