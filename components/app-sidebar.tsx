'use client';

import {
  BarChart3,
  ClipboardList,
  Home,
  Kanban,
  Layout,
  LifeBuoy,
  Rocket,
  Send,
  Sparkles,
  Tag,
} from 'lucide-react';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';

const data = {
  navMain: [
    {
      title: 'Početna',
      url: '/pocetna',
      icon: Home,
    },
    {
      title: 'Planer sadržaja',
      url: '/planner',
      icon: Layout,
    },
    {
      title: 'Konkurenti',
      url: '/competitors',
      icon: Kanban,
    },
    {
      title: 'Studije slučaja',
      url: '/casestudy',
      icon: ClipboardList,
    },
    {
      title: 'Statistika',
      url: '/statistics',
      icon: BarChart3,
    },
    {
      title: 'AI krediti',
      url: '/ai-credits',
      icon: Sparkles,
    },
    {
      title: 'Kategorije',
      url: '/categories',
      icon: Tag,
    },
  ],
  navSecondary: [
    {
      title: 'Podrška',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar?: string };
}) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 self-center font-bold text-xl text-primary p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-[#CA8A03]">
                <Rocket className="size-5" />
              </div>
              Viralio AI
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
