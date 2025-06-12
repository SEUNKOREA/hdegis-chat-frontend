/**
 * 백엔드 API와의 통신을 담당하는 서비스
 */

const API_BASE_URL = 'http://node.hd-aic.com:30200'

export class ChatService {
    /**
     * 스트리밍 채팅 요청
     * @param {string} query - 사용자 질문
     * @param {string[]} filters - 문서 필터 배열
     * @returns {Promise<ReadableStream>} - SSE 스트림
     */
    static async sendStreamingMessage(query, filters = []) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    filters: filters,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            if (!response.body) {
                throw new Error('Response body is null')
            }

            return response.body
        } catch (error) {
            console.error('스트리밍 요청 실패:', error)
            throw error
        }
    }

    /**
     * SSE 스트림을 파싱하여 이벤트를 처리하는 함수
     * @param {ReadableStream} stream - SSE 스트림
     * @param {Object} callbacks - 이벤트 콜백 함수들
     * @param {Function} callbacks.onSearchResults - 검색 결과 수신 콜백
     * @param {Function} callbacks.onResponseChunk - 응답 청크 수신 콜백
     * @param {Function} callbacks.onCompleted - 완료 콜백
     * @param {Function} callbacks.onError - 에러 콜백
     */
    static async processStreamingResponse(stream, callbacks) {
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { value, done } = await reader.read()

                if (done) {
                    break
                }

                // 청크를 문자열로 디코딩하고 버퍼에 추가
                buffer += decoder.decode(value, { stream: true })

                // 완전한 메시지들을 처리
                const lines = buffer.split('\n')
                buffer = lines.pop() || '' // 마지막 불완전한 라인은 버퍼에 유지

                for (const line of lines) {
                    if (line.trim() === '') continue

                    // SSE 형식 파싱 (data: {...})
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.substring(6) // 'data: ' 제거
                            const eventData = JSON.parse(jsonStr)

                            // 이벤트 타입에 따른 처리
                            switch (eventData.type) {
                                case 'search_results':
                                    if (callbacks.onSearchResults) {
                                        callbacks.onSearchResults(eventData.data.searchResults)
                                    }
                                    break

                                case 'response_chunk':
                                    if (callbacks.onResponseChunk) {
                                        callbacks.onResponseChunk(eventData.data.chunk)
                                    }
                                    break

                                case 'completed':
                                    if (callbacks.onCompleted) {
                                        callbacks.onCompleted()
                                    }
                                    break

                                case 'error':
                                    if (callbacks.onError) {
                                        callbacks.onError(eventData.data.error)
                                    }
                                    break

                                default:
                                    console.warn('알 수 없는 이벤트 타입:', eventData.type)
                            }
                        } catch (parseError) {
                            console.error('이벤트 파싱 실패:', parseError, 'Raw line:', line)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('스트림 처리 중 오류:', error)
            if (callbacks.onError) {
                callbacks.onError('스트림 처리 중 오류가 발생했습니다.')
            }
        } finally {
            reader.releaseLock()
        }
    }

    /**
     * 헬스 체크
     * @returns {Promise<boolean>} - 서버 상태
     */
    static async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
            })
            return response.ok
        } catch (error) {
            console.error('헬스 체크 실패:', error)
            return false
        }
    }

    /**
     * 일반 채팅 요청 (non-streaming, 테스트용)
     * @param {string} query - 사용자 질문
     * @param {string[]} filters - 문서 필터 배열
     * @returns {Promise<Object>} - 채팅 응답
     */
    static async sendMessage(query, filters = []) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    filters: filters,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('채팅 요청 실패:', error)
            throw error
        }
    }
}

export default ChatService