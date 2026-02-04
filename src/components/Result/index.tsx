import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign } from "lucide-react"

interface ResultProps {
  prediction: string | null
  isLoading: boolean
}

export function Result({ prediction, isLoading }: ResultProps) {
  if (!prediction && !isLoading) return null

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle>Результат анализа</CardTitle>
          {isLoading && (
            <Badge variant="secondary" className="ml-auto">
              <span className="animate-pulse">Генерирую...</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !prediction ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{prediction}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}