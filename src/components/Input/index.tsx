import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles } from "lucide-react"

interface Input {
    onAnalyze: (jobText: string) => void
    isLoading: boolean
}

export function Input({ onAnalyze, isLoading }: Input) {
    const [jobText, setJobText] = useState<string>('')
    const [error, setError] = useState<string>('')

    const handleSubmit = () => {
        if (!jobText.trim()) {
            setError('Пожалуйста, вставьте текст вакансии')
            return
        }
        setError('')
        onAnalyze(jobText)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Текст вакансии</CardTitle>
                <CardDescription>
                    Скопируйте и вставьте полное описание вакансии из любого источника
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    placeholder="Вставьте текст вакансии..."
                    className="min-h-[150px] text-sm resize-none
                        border border-border/50 hover:border-primary/40 focus:border-primary
                        rounded-lg transition-colors duration-200
                        focus:ring-1 focus:ring-primary/20
                        placeholder:text-muted-foreground/60"
                    disabled={isLoading}
                />

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        {jobText.length} символов
                    </span>

                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !jobText.trim()}
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Анализирую...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Проанализировать
                            </>
                        )}
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}