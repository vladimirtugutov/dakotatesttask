import { Badge } from "@/components/ui/badge.tsx"

export function Header() {
  return (
    <div className="border-b">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              💰 Анализатор зарплат
            </h1>
            <p className="text-muted-foreground mt-1">
                Получите инсайты по зарплатам в IT индустрии 
            </p>
          </div>
          <Badge variant="outline" className="h-fit">
            Версия 1
          </Badge>
        </div>
      </div>
    </div>
  )
}

