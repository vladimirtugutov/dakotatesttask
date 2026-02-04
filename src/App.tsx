import { useState } from 'react'
import { Header } from './components/Header'
import { Input } from './components/Input'
import { Result } from './components/Result'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { analyzeSalary } from './lib/perplexity'

function App() {
  const [prediction, setPrediction] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleAnalyze = async (jobText: string): Promise<void> => {
    setIsLoading(true)
    setError('')
    setPrediction('')

    await analyzeSalary(
      jobText,
      // onChunk - получаем каждый кусочек текста
      (chunk) => {
        setPrediction(prev => prev + chunk)
      },
      // onError
      (errorMessage) => {
        setError(errorMessage)
        setIsLoading(false)
      }
    )


    setIsLoading(false)
  }


  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Input
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>
                {error}
                <br />
                <span className="text-xs mt-2 block">
                  Проверьте API ключ в .env файле
                </span>
              </AlertDescription>
            </Alert>
          )}

          <Result
            prediction={prediction}
            isLoading={isLoading}
          />
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-center text-sm text-muted-foreground">
          Dakota Prep
        </p>
      </footer>
    </div>
  )
}

export default App