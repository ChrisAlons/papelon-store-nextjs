"use client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useState, useEffect } from "react"

export function SiteHeader() {
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

  const handleBackgroundChange = (e) => {
    setBackground(e.target.value);
    document.documentElement.style.setProperty('--background', e.target.value);
  };

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="ml-auto flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}
