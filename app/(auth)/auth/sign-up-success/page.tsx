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
        <CardTitle className="font-heading text-2xl">Check Your Email</CardTitle>
        <CardDescription>
          We've sent you a confirmation link to verify your email address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Click the link in the email to complete your registration and start shopping.
          If you don't see the email, check your spam folder.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/auth/login">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
