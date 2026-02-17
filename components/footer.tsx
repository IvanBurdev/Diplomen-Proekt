import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="font-heading text-lg font-bold text-primary-foreground">K</span>
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">KitZone</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Твоето място за автентични футболни екипи от най-големите клубове в света.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-foreground">Магазин</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Всички продукти
                </Link>
              </li>
              <li>
                <Link href="/products?category=home-kits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Домакински екипи
                </Link>
              </li>
              <li>
                <Link href="/products?category=away-kits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Гостуващи екипи
                </Link>
              </li>
              <li>
                <Link href="/products?category=training-wear" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Тренировъчна екипировка
                </Link>
              </li>
              <li>
                <Link href="/products?category=retro-classics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Ретро екипи
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-foreground">Помощ</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Свържи се с нас и ЧЗВ
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Поръчки, доставка и връщане
                </Link>
              </li>
              
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-foreground">Компания</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  За нас
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Кариери
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Политика за поверителност
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Общи условия
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} KitZone. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  )
}

