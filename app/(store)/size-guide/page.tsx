import Link from 'next/link'
import { ChevronLeft, Ruler } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const SIZE_ROWS = [
  { size: 'XS', chest: '84-89', waist: '70-75', height: '160-168' },
  { size: 'S', chest: '90-95', waist: '76-81', height: '168-174' },
  { size: 'M', chest: '96-101', waist: '82-87', height: '174-180' },
  { size: 'L', chest: '102-108', waist: '88-95', height: '180-186' },
  { size: 'XL', chest: '109-116', waist: '96-103', height: '186-192' },
  { size: 'XXL', chest: '117-124', waist: '104-111', height: '192-198' },
]

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/products"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Назад към продуктите
      </Link>

      <div className="mt-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Таблица с размери</h1>
        <p className="mt-2 text-muted-foreground">
          Свери твоите мерки с таблицата, за да избереш най-подходящия размер.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Размери (см)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Размер</TableHead>
                <TableHead>Гръдна обиколка</TableHead>
                <TableHead>Талия</TableHead>
                <TableHead>Височина</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SIZE_ROWS.map((row) => (
                <TableRow key={row.size}>
                  <TableCell className="font-medium">{row.size}</TableCell>
                  <TableCell>{row.chest}</TableCell>
                  <TableCell>{row.waist}</TableCell>
                  <TableCell>{row.height}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Как да се измериш</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Гръдна обиколка: измери най-широката част на гърдите.</p>
          <p>2. Талия: измери около най-тясната част на кръста.</p>
          <p>3. Ако си между два размера, избери по-големия за по-свободно прилягане.</p>
        </CardContent>
      </Card>
    </div>
  )
}
