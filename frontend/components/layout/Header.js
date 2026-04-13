'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Notifications from '@/components/Notifications'
import ProfileDropdown from './ProfileDropdown'
import { Menu } from 'lucide-react'

const Header = memo(({ 
  user, 
  userProfile, 
  pathname, 
  onMenuClick,
  onLogout,
  router
}) => {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground capitalize">
          {pathname === '/dashboard' 
            ? 'Dashboard' 
            : pathname.split('/').pop()?.replace(/-/g, ' ')
          }
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Notifications user={user} />
        </div>
        <LanguageSwitcher variant="minimal" className="mr-2" />
        <ProfileDropdown 
          user={user} 
          userProfile={userProfile} 
          onLogout={onLogout}
          router={router}
        />
      </div>
    </header>
  )
})
Header.displayName = 'Header'

export default Header
