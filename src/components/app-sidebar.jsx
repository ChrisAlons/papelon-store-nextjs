"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { IconDashboard, IconDatabase, IconInnerShadowTop, IconTags, IconTruck, IconShoppingCart, IconChartBar, IconAdjustments } from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// simplified nav data
const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
    { title: "Productos", url: "/dashboard/products", icon: IconDatabase },
    { title: "Categorías", url: "/dashboard/categories", icon: IconTags },
    { title: "Proveedores", url: "/dashboard/suppliers", icon: IconTruck },
    { title: "Compras", url: "/dashboard/purchases", icon: IconShoppingCart },
    { title: "Inventario", url: "/dashboard/inventory", icon: IconChartBar },
    { title: "Movimientos", url: "/dashboard/movements", icon: IconAdjustments },
  ],
}

export function AppSidebar({
  ...props
}) {
  const { data: session, status } = useSession()
  // Wait for session to load
  if (status === 'loading') return null
  const user = {
    name: session?.user?.name ?? session?.user?.username ?? 'Guest',
    email: session?.user?.email ?? session?.user?.username ?? '',
    avatar: session?.user?.image ?? ''
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Papelería Papelón</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
