import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSelector } from './LanguageSelector'

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: Home },
    { name: t('nav.items'), href: '/items', icon: Package },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span className="font-bold">{t('common.appName')}</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 transition-colors hover:text-foreground/80',
                  isActive ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <LanguageSelector />
      </div>
    </header>
  )
}
