const API_URL = 'https://api.perplexity.ai/chat/completions'
const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY

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

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }

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
