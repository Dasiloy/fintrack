'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import {
  AUTH_ROUTES,
  DASHBOARD_ROUTES,
  STATIC_ROUTES,
} from '@fintrack/types/constants/routes.constants';
import type { SessionUser } from '@fintrack/types/interfaces/session_user.interface';
import {
  ACCOUNT_GROUP,
  NAV_GROUPS,
  type NavCollapsibleItem,
  type NavGroup,
  type NavItem,
} from '@/constants/sidebar-nav.constants';
import { signOut } from 'next-auth/react';
import { Logo } from '@/app/_components/logo';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single flat nav item (not collapsible) */
function NavItemRow({
  item,
  isActive,
  isPro,
}: {
  item: NavItem;
  isActive: boolean;
  isPro: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
          <item.icon />
          <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
          {item.isPro && !isPro && (
            <Badge className="bg-warning/10 text-warning ml-auto shrink-0 px-1.5 py-0 text-[10px] font-semibold group-data-[collapsible=icon]:hidden">
              Pro
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Collapsible settings group */
function NavCollapsibleRow({
  item,
  isAnyChildActive,
  pathname,
}: {
  item: NavCollapsibleItem;
  isAnyChildActive: boolean;
  pathname: string;
}) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [open, setOpen] = React.useState(isAnyChildActive);
  const isIconMode = state === 'collapsed' && !isMobile;

  // ── Icon-collapsed mode: show a dropdown on click ────────────────────────
  if (isIconMode) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton isActive={isAnyChildActive} className="cursor-pointer">
              <item.icon />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={6}
            className="rounded-card-mobile border-border-subtle bg-bg-surface shadow-card w-44 border p-1"
          >
            <p className="text-text-disabled px-2 pb-1 pt-0.5 text-[10px] font-medium tracking-wider uppercase">
              {item.title}
            </p>
            {item.items.map((sub) => {
              const subActive = pathname === sub.url;
              return (
                <DropdownMenuItem key={sub.title} asChild>
                  <Link
                    href={sub.url}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      subActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    <sub.icon className="size-3.5 shrink-0" />
                    {sub.title}
                    {subActive && (
                      <span className="bg-primary ml-auto size-1.5 shrink-0 rounded-full" />
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  // ── Expanded mode: collapsible inline ────────────────────────────────────
  return (
    <SidebarMenuItem>
      <Collapsible open={open} onOpenChange={setOpen} asChild>
        <div>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={isAnyChildActive}
              tooltip={item.title}
              className="group/collapsible justify-start text-left"
            >
              <item.icon />
              <span className="flex-1 truncate">{item.title}</span>
              <ChevronRight
                className={cn(
                  'text-text-disabled duration-smooth ease-smooth ml-auto size-3.5 shrink-0 transition-transform',
                  open && 'rotate-90',
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((sub) => {
                const subActive = pathname === sub.url;
                return (
                  <SidebarMenuSubItem key={sub.title}>
                    <SidebarMenuSubButton asChild isActive={subActive}>
                      <Link
                        href={sub.url}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <sub.icon />
                        <span>{sub.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </SidebarMenuItem>
  );
}

/** Renders a full nav group with a label + its items */
function NavGroupSection({
  group,
  pathname,
  isPro,
}: {
  group: NavGroup;
  pathname: string;
  isPro: boolean;
}) {
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + '/');

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            if ('isCollapsible' in item && item.isCollapsible) {
              const anyChildActive = item.items.some((sub) => isActive(sub.url));
              return (
                <NavCollapsibleRow
                  key={item.title}
                  item={item as NavCollapsibleItem}
                  isAnyChildActive={anyChildActive}
                  pathname={pathname}
                />
              );
            }
            const navItem = item as NavItem;
            return (
              <NavItemRow
                key={navItem.title}
                item={navItem}
                isActive={isActive(navItem.url)}
                isPro={isPro}
              />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** User profile footer with dropdown */
function NavUser({ user }: { user: SessionUser }) {
  const { isMobile } = useSidebar();

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarMenu className="mt-auto mb-3 px-2 group-data-[collapsible=icon]:px-0">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-bg-surface-hover data-[state=open]:text-text-primary cursor-pointer group-data-[collapsible=icon]:mx-auto">
              <Avatar size="default" className="shrink-0">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="bg-primary/20 text-primary rounded-button text-caption font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 gap-0 text-left group-data-[collapsible=icon]:hidden">
                <span className="text-text-primary text-caption mb-0.5 truncate font-medium">
                  {user.name}
                </span>
                <span className="text-text-tertiary text-caption -mt-space-1 truncate">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="text-text-disabled ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="rounded-card-mobile border-border-subtle bg-bg-surface shadow-card w-56 border"
            side={isMobile ? 'top' : 'right'}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="gap-space-3 py-space-1 flex items-center">
                <Avatar size="default" className="rounded-button shrink-0">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="bg-primary/20 text-primary rounded-button text-caption font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left">
                  <span className="text-text-primary text-body-sm truncate font-medium capitalize">
                    {user.name}
                  </span>
                  <span className="text-text-tertiary text-caption truncate capitalize">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-border-subtle" />

            <DropdownMenuItem asChild className="py-space-1 cursor-pointer">
              <Link
                href={DASHBOARD_ROUTES.SETTINGS_ACCOUNT}
                className="gap-space-2 flex items-center"
              >
                <SlidersHorizontal className="text-text-secondary size-4 shrink-0" />
                <span className="text-body-sm">Account settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="py-space-1 cursor-pointer">
              <Link href={STATIC_ROUTES.PRICING} className="gap-space-2 flex items-center">
                <CreditCard className="text-text-secondary size-4 shrink-0" />
                <span className="text-body-sm">Billing</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border-subtle" />

            <DropdownMenuItem
              className="text-error focus:text-error focus:bg-error/10 py-space-2 cursor-pointer"
              onClick={() =>
                signOut({
                  redirect: true,
                  redirectTo: AUTH_ROUTES.LOGIN,
                })
              }
            >
              <LogOut className="mr-space-2 size-4 shrink-0" />
              <span className="text-body-sm">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ---------------------------------------------------------------------------
// AppSidebar (main export)
// ---------------------------------------------------------------------------

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /**
   * Whether the current user is on the Pro plan.
   * Defaults to `false` (shows upgrade badge + Pro item markers).
   */
  isPro?: boolean;
  /** Session user for the footer. Falls back to placeholder when not provided. */
  user: SessionUser;
}

export function AppSidebar({ isPro = false, user, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Header: logo + brand ─────────────────────────────────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group-data-[collapsible=icon]:mx-auto hover:bg-transparent active:bg-transparent"
            >
              <Logo isPro={isPro} showPlan />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* ── Upgrade pill — only when on free plan ── */}
        {!isPro && (
          <Link
            href={STATIC_ROUTES.PRICING}
            className="border-warning/20 from-warning/10 to-primary/5 hover:border-warning/30 hover:from-warning/15 mx-1 flex items-center gap-2 overflow-hidden rounded-lg border bg-linear-to-br px-2.5 py-1.5 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <Sparkles className="text-warning size-3 shrink-0" />
            <span className="text-text-secondary flex-1 truncate text-[11px] font-medium">
              Upgrade to Pro
            </span>
            <span className="text-warning/70 shrink-0 text-[10px] font-medium">$5/mo</span>
            <ArrowUpRight className="text-warning/50 size-3 shrink-0" />
          </Link>
        )}
      </SidebarHeader>

      {/* ── Scrollable: all nav groups + Account + user (Settings sublinks stay in flow) ── */}
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <NavGroupSection key={group.label} group={group} pathname={pathname} isPro={isPro} />
        ))}

        <SidebarSeparator />

        <NavGroupSection group={ACCOUNT_GROUP} pathname={pathname} isPro={isPro} />

        {/* User profile at bottom of scroll (no footer; nothing gets cut off) */}
        <SidebarSeparator />
        <NavUser user={user} />
      </SidebarContent>
    </Sidebar>
  );
}
