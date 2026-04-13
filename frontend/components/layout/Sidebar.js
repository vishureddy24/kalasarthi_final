'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sparkles, User, ShieldHalf, LogOut, ChevronRight,
  LayoutDashboard, Package, PlusCircle, Wallet, Landmark,
  Store, ShoppingBag, Heart, TicketPercent, ShoppingCart
} from 'lucide-react'

// Icon mapping
const iconMap = {
  LayoutDashboard, Package, PlusCircle, Sparkles, Wallet, Landmark,
  Store, ShoppingBag, Heart, TicketPercent, ShoppingCart
}

// Simple NavLink - no double navigation
const NavLink = memo(({ href, children, className, onClick }) => (
  <Link href={href} onClick={onClick} className={className}>
    {children}
  </Link>
))
NavLink.displayName = 'NavLink'

const Sidebar = memo(({ 
  mobile = false, 
  menuItems, 
  pathname, 
  userProfile, 
  user, 
  isAdmin, 
  onClose, 
  onLogout,
  tx 
}) => {
  return (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      <div className="p-6 border-b border-sidebar-border">
        <NavLink 
          href="/dashboard" 
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground font-display">
            KalaSarthi
          </span>
        </NavLink>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = iconMap[item.icon]
          return (
            <NavLink
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tx(item.labelKey)}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="h-4 w-4 text-sidebar-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userProfile?.displayName || user?.displayName || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {userProfile?.role}
            </p>
          </div>
        </div>

        {isAdmin && (
          <NavLink
            href="/dashboard/admin"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-sm font-medium transition-all duration-200 text-indigo-400 hover:bg-indigo-500/10"
          >
            <ShieldHalf className="h-4 w-4" />
            Admin Panel
          </NavLink>
        )}

        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 mr-2" /> {tx('logout')}
        </Button>
      </div>
    </div>
  )
})
Sidebar.displayName = 'Sidebar'

export default Sidebar
