import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="font-heading text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          Something went wrong during authentication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This could be due to an expired link, invalid credentials, or a technical issue.
          Please try again.
        </p>
      </CardContent>
      <CardFooter className="justify-center gap-4">
        <Link href="/auth/login">
          <Button>Try Again</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
