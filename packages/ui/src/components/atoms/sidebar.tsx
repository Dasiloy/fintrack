import * as React from 'react';
import { Slot } from 'radix-ui';
import { PanelLeft } from 'lucide-react';

import { useIsMobile } from '@ui/lib/hooks/use-mobile';
import { cn } from '@ui/lib/utils/cn';
import { Button } from './button';
import { Input } from './input';
import { Separator } from './separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';
import { Skeleton } from './skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SidebarContextType = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// SidebarProvider
// ---------------------------------------------------------------------------

export interface SidebarProviderProps extends React.ComponentProps<'div'> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // Controlled vs. uncontrolled
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((val: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(next);
      } else {
        _setOpen(next);
      }
      // Persist to cookie
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((v) => !v);
    } else {
      setOpen((v) => !v);
    }
  }, [isMobile, setOpen]);

  // Keyboard shortcut: Ctrl/Cmd + B
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';

  const value = React.useMemo(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value as SidebarContextType}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': '270px',
            '--sidebar-width-icon': '48px',
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          'group/sidebar-wrapper has-data-[variant=inset]:bg-bg-deep flex min-h-svh w-full flex-row overflow-x-clip',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export interface SidebarProps extends React.ComponentProps<'div'> {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
}

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  // Non-collapsible
  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn('text-text-primary flex h-full w-[--sidebar-width] flex-col', className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Mobile: render as Sheet
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          side="left"
          className="bg-bg-elevated text-text-primary w-4/5 p-0 [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Main navigation sidebar</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop
  return (
    <div
      className="text-text-primary group peer hidden shrink-0 md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* Spacer that holds the sidebar's width in the layout */}
      <div
        className={cn(
          'duration-smooth ease-smooth relative h-svh w-(--sidebar-width) shrink-0 bg-transparent transition-[width]',
          'group-data-[collapsible=offcanvas]:w-0!',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+16px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />

      {/* Actual sidebar panel */}
      <div
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) flex-col',
          'duration-smooth ease-smooth transition-[left,right,width] md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating'
            ? 'rounded-card shadow-card top-2 h-[calc(100svh-(--spacing(4)))] border border-white/5'
            : variant === 'inset'
              ? 'rounded-card top-2 h-[calc(100svh-(--spacing(4)))]'
              : 'border-r border-white/5',
          'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[collapsible=icon]:overflow-hidden',
          className,
        )}
        {...props}
      >
        {/* Dark gradient background */}
        <div
          data-sidebar="sidebar"
          className="bg-bg-elevated group-data-[variant=floating]:rounded-card flex h-full w-full flex-col"
          style={{
            background: 'linear-gradient(180deg, #18181D 0%, #0F0F14 100%)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarTrigger
// ---------------------------------------------------------------------------

export function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', className)}
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// SidebarRail — thin clickable strip to expand a collapsed sidebar
// ---------------------------------------------------------------------------

export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'hover:after:bg-border-subtle absolute inset-y-0 z-20 hidden w-4 translate-x-1/2 cursor-w-resize transition-all ease-linear sm:flex',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-0.5',
        'group-data-[side=left]:-right-4 group-data-[side=right]:left-0',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-white/5',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full',
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarInset — the main content area next to the sidebar
// ---------------------------------------------------------------------------

export function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'bg-bg-deep relative flex min-h-svh min-w-0 flex-1 flex-col',
        'peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))]',
        'md:peer-data-[variant=inset]:rounded-card md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarInput
// ---------------------------------------------------------------------------

export function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn('bg-bg-surface/60 h-8 w-full shadow-none', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarHeader / SidebarFooter / SidebarContent / SidebarSeparator
// ---------------------------------------------------------------------------

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-3 group-data-[collapsible=icon]:px-0', className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-3', className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto',
        'group-data-[collapsible=icon]:overflow-hidden',
        // Thin, styled scrollbar (matches textarea/combobox)
        '[scrollbar-color:var(--color-border-subtle)_transparent] [scrollbar-width:thin]',
        '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-border-subtle [&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb:hover]:bg-border-light',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('w-full bg-white/5', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarGroup
// ---------------------------------------------------------------------------

export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        'relative flex w-full min-w-0 flex-col p-2 group-data-[collapsible=icon]:px-0',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'text-text-disabled ring-primary/50 flex h-8 shrink-0 items-center rounded-md px-2',
        'text-xs font-semibold tracking-wider uppercase',
        'duration-smooth ease-smooth transition-[margin,opacity]',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        'outline-none focus-visible:ring-2',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        'text-text-secondary ring-primary/50 absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0',
        'hover:bg-bg-surface-hover hover:text-text-primary outline-none',
        'duration-smooth ease-smooth transition-[color,background-color]',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        'after:absolute after:-inset-2 after:md:hidden',
        'group-data-[collapsible=icon]:hidden',
        'focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('w-full text-sm', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarMenu — the list container
// ---------------------------------------------------------------------------

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-0.5', className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarMenuButton — the actual clickable nav item
// ---------------------------------------------------------------------------

const sidebarMenuButtonVariants = {
  default: cn(
    // Base
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-lg px-2 py-2',
    'text-sm font-medium text-text-secondary outline-none',
    // Hover
    'hover:bg-bg-surface-hover hover:text-text-primary',
    // Active (current route)
    'data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
    'data-[active=true]:border-l-2 data-[active=true]:border-primary',
    'data-[active=true]:shadow-[0_0_12px_rgba(124,122,255,0.12)]',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // Transitions
    'transition-[color,background-color,box-shadow] duration-smooth ease-smooth',
    // Icon sizing
    '[&>svg]:size-4 [&>svg]:shrink-0',
    // Collapsed (icon-only) mode
    'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto',
    // Active border — hide left indicator in icon mode (background + glow is sufficient)
    'group-data-[collapsible=icon]:data-[active=true]:border-l-0',
    // Focus
    'focus-visible:ring-primary/50 focus-visible:ring-2',
  ),
};

export interface SidebarMenuButtonProps extends React.ComponentProps<'button'> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants.default, className)}
      {...props}
    />
  );

  if (!tooltip) return button;

  const tooltipProps =
    typeof tooltip === 'string'
      ? ({ children: tooltip } as React.ComponentProps<typeof TooltipContent>)
      : tooltip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== 'collapsed' || isMobile}
        {...tooltipProps}
      />
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// SidebarMenuAction — icon button on the right of a menu item (hover reveal)
// ---------------------------------------------------------------------------

export function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean; showOnHover?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        'text-text-secondary ring-primary/50 absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0',
        'hover:bg-bg-surface-hover hover:text-text-primary outline-none',
        'duration-smooth ease-smooth transition-[color,background-color]',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        'after:absolute after:-inset-2 after:md:hidden',
        'peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=sm]/menu-button:top-1',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100',
        'focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarMenuBadge — count badge on a menu item
// ---------------------------------------------------------------------------

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'text-text-secondary pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none',
        'peer-hover/menu-button:text-text-primary peer-data-[active=true]/menu-button:text-primary',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarMenuSkeleton — placeholder while loading
// ---------------------------------------------------------------------------

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & { showIcon?: boolean }) {
  const width = React.useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="bg-bg-surface-hover size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="bg-bg-surface-hover h-4 max-w-[--skeleton-width] flex-1"
        data-sidebar="menu-skeleton-text"
        style={{ '--skeleton-width': width } as React.CSSProperties}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarMenuSub — nested sub-menu list
// ---------------------------------------------------------------------------

export function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-0.5 border-l border-white/10 py-0.5 pl-2.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  );
}

export function SidebarMenuSubButton({
  asChild = false,
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean; isActive?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a';
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-active={isActive}
      className={cn(
        'text-text-tertiary ring-primary/50 flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2',
        'text-xs font-medium outline-none',
        'hover:bg-bg-surface-hover hover:text-text-primary',
        'data-[active=true]:text-primary data-[active=true]:bg-primary/10',
        'duration-smooth ease-smooth transition-[color,background-color]',
        '[&>svg]:size-3.5 [&>svg]:shrink-0',
        'focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}
