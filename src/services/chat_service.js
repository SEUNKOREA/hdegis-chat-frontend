/**
 * 백엔드 API와의 통신을 담당하는 서비스 (개선된 스트리밍 처리)
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
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
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
     * SSE 스트림을 파싱하여 이벤트를 처리하는 함수 (개선된 버전)
     * @param {ReadableStream} stream - SSE 스트림
     * @param {Object} callbacks - 이벤트 콜백 함수들
     */
    static async processStreamingResponse(stream, callbacks) {
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { value, done } = await reader.read()

                if (done) {
                    console.log('스트림 읽기 완료')
                    break
                }

                // 청크를 문자열로 디코딩하고 버퍼에 추가
                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                // 완전한 라인들을 처리
                const lines = buffer.split('\n')
                buffer = lines.pop() || '' // 마지막 불완전한 라인은 버퍼에 유지

                for (const line of lines) {
                    const trimmedLine = line.trim()
                    if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
                        continue
                    }

                    // SSE 형식 파싱
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.substring(6) // 'data: ' 제거

                            // 빈 데이터나 특수 명령어 처리
                            if (jsonStr === '' || jsonStr === '[DONE]') {
                                continue
                            }

                            const eventData = JSON.parse(jsonStr)
                            console.log('수신된 이벤트:', eventData)

                            // 이벤트 타입에 따른 처리
                            await this.handleStreamEvent(eventData, callbacks)

                        } catch (parseError) {
                            console.error('이벤트 파싱 실패:', parseError, 'Raw line:', trimmedLine)
                            // 파싱 에러가 발생해도 계속 진행
                        }
                    }
                }
            }

            // 스트림 완료 후 완료 콜백 호출
            if (callbacks.onCompleted) {
                callbacks.onCompleted()
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
     * 개별 스트림 이벤트 처리
     */
    static async handleStreamEvent(eventData, callbacks) {
        switch (eventData.type) {
            case 'search_results':
                console.log('검색 결과 수신:', eventData.data)
                if (callbacks.onSearchResults) {
                    callbacks.onSearchResults(eventData.data.searchResults || eventData.data)
                }
                break

            case 'response_chunk':
            case 'chunk':
            case 'delta':
                const chunk = eventData.data?.chunk || eventData.data?.content || eventData.content || ''
                if (chunk && callbacks.onResponseChunk) {
                    callbacks.onResponseChunk(chunk)
                }
                break

            case 'completed':
            case 'done':
                console.log('스트리밍 완료 이벤트 수신')
                if (callbacks.onCompleted) {
                    callbacks.onCompleted()
                }
                break

            case 'error':
                console.error('서버 에러:', eventData.data)
                if (callbacks.onError) {
                    callbacks.onError(eventData.data?.error || eventData.data || '서버 오류가 발생했습니다.')
                }
                break

            case 'status':
                console.log('상태 업데이트:', eventData.data)
                // 상태 정보는 필요에 따라 처리
                break

            default:
                console.warn('알 수 없는 이벤트 타입:', eventData.type, eventData)
        }
    }

    /**
     * 헬스 체크
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