import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-heading text-2xl">Провери имейла си</CardTitle>
        <CardDescription>
          Изпратихме ти потвърдителен линк за верификация на имейла.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Натисни линка в имейла, за да завършиш регистрацията и да започнеш да пазаруваш.
          Ако не го виждаш, провери папка Спам.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/auth/login">
          <Button variant="outline">Назад към вход</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
