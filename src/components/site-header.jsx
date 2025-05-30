"use client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { IconLogout, IconUser } from "@tabler/icons-react"

export function SiteHeader() {
  const { data: session } = useSession()
  const [primary, setPrimary] = useState("#6366f1");
  const [background, setBackground] = useState("#ffffff");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let cssPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      // Si es oklch, conviértelo a hex (por defecto #6366f1)
      if (cssPrimary.startsWith('oklch')) {
        setPrimary("#6366f1");
      } else if (cssPrimary) {
        setPrimary(cssPrimary);
      }

      let cssBackground = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
      // Si es oklch, usa blanco por defecto
      if (cssBackground.startsWith('oklch')) {
        setBackground("#ffffff");
      } else if (cssBackground) {
        setBackground(cssBackground);
      }
    }
  }, []);

  const handlePrimaryChange = (e) => {
    setPrimary(e.target.value);
    document.documentElement.style.setProperty('--primary', e.target.value);
  };

  const handleBackgroundChange = (e) => {    setBackground(e.target.value);
    document.documentElement.style.setProperty('--background', e.target.value);
  };

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    })
  };

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        
        {/* User info and logout */}
        <div className="ml-auto flex items-center gap-2">
          {session && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <IconUser className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">{session.user.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {session.user.role}
                </span>
              </div>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          
          {/* Theme controls */}
          <label className="flex items-center gap-1 text-xs">
            <span className="hidden sm:inline">Color</span>
            <input
              type="color"
              value={primary}
              onChange={handlePrimaryChange}
              className="w-6 h-6 border-none bg-transparent cursor-pointer rounded-full"
              aria-label="Color principal"
              style={{marginRight: 8}}
            />
          </label>
          <label className="flex items-center gap-1 text-xs">
            <span className="hidden sm:inline">Fondo</span>
            <input
              type="color"
              value={background}
              onChange={handleBackgroundChange}
              className="w-6 h-6 border-none bg-transparent cursor-pointer rounded-full"
              aria-label="Color de fondo"
              style={{marginRight: 8}}
            />
          </label>
          
          {session && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <IconLogout className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
