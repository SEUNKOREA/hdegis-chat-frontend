// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * API 요청 래퍼 함수
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    }

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    }

    try {
        const response = await fetch(url, config)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('API 요청 실패:', error)
        throw error
    }
}

/**
 * 일반 채팅 API 호출
 */
export async function sendChatMessage(query, filters = []) {
    return await apiRequest('/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({
            query,
            filters
        })
    })
}

/**
 * 스트리밍 채팅 API 호출
 */
export async function* sendChatMessageStream(query, filters = []) {
    const url = `${API_BASE_URL}/api/v1/chat/stream`

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                filters
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        try {
            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.trim() === '') continue

                    if (line.startsWith('data: ')) {
                        const data = line.slice(6) // 'data: ' 제거

                        try {
                            const event = JSON.parse(data)
                            yield event
                        } catch (parseError) {
                            console.warn('JSON 파싱 실패:', data)
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    } catch (error) {
        console.error('스트리밍 요청 실패:', error)
        throw error
    }
}

/**
 * 검색만 수행하는 API 호출
 */
export async function searchDocuments(query, filters = []) {
    return await apiRequest('/api/v1/search', {
        method: 'POST',
        body: JSON.stringify({
            query,
            filters
        })
    })
}

/**
 * 헬스 체크 API 호출
 */
export async function checkHealth() {
    return await apiRequest('/health')
}