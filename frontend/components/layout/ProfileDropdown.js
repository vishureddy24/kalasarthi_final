'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { User, ChevronDown, LogOut, ShoppingBag, Heart, MapPin, TicketPercent } from 'lucide-react'

const profileMenuItems = [
  { href: '/dashboard/orders', icon: ShoppingBag, label: 'My Orders' },
  { href: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/dashboard/account', icon: MapPin, label: 'Address Book' },
  { href: '/dashboard/account/profile', icon: User, label: 'Update Profile' },
  { href: '/dashboard/coupons', icon: TicketPercent, label: 'My Coupons' },
]

const ProfileDropdown = memo(({ user, userProfile, onLogout, router }) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavClick = (href) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-primary/10 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50">
          <div className="p-3 border-b border-border bg-primary/5">
            <p className="font-semibold text-foreground truncate">
              {userProfile?.displayName || user?.displayName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <div className="py-1">
            {profileMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors text-left"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{item.label}</span>
                </button>
              )
            })}
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
ProfileDropdown.displayName = 'ProfileDropdown'

export default ProfileDropdown
