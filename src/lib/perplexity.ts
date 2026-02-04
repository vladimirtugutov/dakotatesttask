const API_URL = 'https://api.perplexity.ai/chat/completions'
const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY

// Retry and timeout configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const REQUEST_TIMEOUT = 30000 // 30 seconds
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

const SYSTEM_PROMPT = `Ты эксперт по анализу вакансий и зарплат в IT-индустрии России и СНГ.

Проанализируй предоставленную вакансию и предскажи реалистичный диапазон зарплаты.

Формат ответа (используй markdown):

## 💰 Предсказанная зарплата
[Укажи диапазон в рублях, например: 200,000 - 300,000 ₽/месяц]

## 📊 Факторы анализа

**Уровень позиции**: [Junior/Middle/Senior/Lead/Architect]
**Требуемый опыт**: [количество лет]
**Ключевые технологии**: [перечисли основные]
**Локация**: [город/удаленка, если указано]

## 🎯 Обоснование

[2-3 параграфа с детальным объяснением:
- Почему именно этот диапазон
- Какие факторы повышают/понижают зарплату
- Сравнение с рыночными данными
- Особенности компании/индустрии, если упомянуты]

## 📈 Рыночный контекст

[Краткий обзор рынка для этой позиции]

Будь конкретен, используй актуальные рыночные данные, учитывай российские реалии.`

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  stream: boolean
  temperature: number
}

interface PerplexityDelta {
  content?: string
}

interface PerplexityChoice {
  delta: PerplexityDelta
}

interface PerplexityStreamResponse {
  choices: PerplexityChoice[]
}

type OnChunkCallback = (chunk: string) => void
type OnErrorCallback = (error: string) => void

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error(`Таймаут запроса: ${timeout}мс`))
    }, timeout)

    fetch(url, { ...options, signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId)
        resolve(response)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, REQUEST_TIMEOUT)

      if (response.ok) {
        return response
      }

      if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt)
        console.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms (status: ${response.status})`)
        await sleep(delay)
        continue
      }

      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries && !lastError.message.includes('API Error:')) {
        const delay = initialDelay * Math.pow(2, attempt)
        console.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms (error: ${lastError.message})`)
        await sleep(delay)
        continue
      }

      throw lastError
    }
  }

  throw lastError || new Error('Неизвестная ошибка')
}

export async function analyzeSalary(
  jobText: string,
  onChunk: OnChunkCallback,
  onError: OnErrorCallback
): Promise<void> {
  try {
    const requestBody: PerplexityRequest = {
      model: 'sonar',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Проанализируй вакансию:\n\n${jobText}` }
      ],
      stream: true,
      temperature: 0.7,
    }

    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') continue

          try {
            const parsed: PerplexityStreamResponse = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content

            if (content) {
              onChunk(content)
            }
          } catch (e) {
            console.warn('Parse error:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Perplexity API error:', error)
    onError(error instanceof Error ? error.message : String(error))
  }
}
