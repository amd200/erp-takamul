import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"
import { Slot } from "radix-ui"
import { useTranslation } from "react-i18next"

import { useIsMobileNav } from "@/lib/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "15.5rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3.5rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.")
  return context
}

function readSaved(defaultOpen: boolean) {
  try {
    const m = document.cookie.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=(true|false)`))
    return m ? m[1] === "true" : defaultOpen
  } catch { return defaultOpen }
}

function SidebarProvider({
  defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const isMobile = useIsMobileNav()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [_open, _setOpen] = React.useState(() => readSaved(defaultOpen))
  const open = openProp ?? _open
  const setOpen = React.useCallback((value: boolean | ((v: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(open) : value
    if (setOpenProp) setOpenProp(next)
    else _setOpen(next)
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  }, [setOpenProp, open])

  const toggleSidebar = React.useCallback(() => (isMobile ? setOpenMobile((o) => !o) : setOpen((o) => !o)), [isMobile, setOpen])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggleSidebar() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggleSidebar])

  const state = open ? "expanded" : "collapsed"
  const value = React.useMemo<SidebarContextProps>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        style={{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON, ...style } as React.CSSProperties}
        className={cn("group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

/** `side` is logical: "start" is the right edge in Arabic and the left edge in English. */
function Sidebar({
  side = "start", variant = "sidebar", collapsible = "offcanvas", className, children, ...props
}: React.ComponentProps<"div"> & { side?: "start" | "end"; variant?: "sidebar" | "floating" | "inset"; collapsible?: "offcanvas" | "icon" | "none" }) {
  const { t } = useTranslation()
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div data-slot="sidebar" className={cn("flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground", className)} {...props}>
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar" data-slot="sidebar" data-mobile="true" side={side}
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("nav.label")}</SheetTitle>
            <SheetDescription>{t("nav.label")}</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block print:hidden"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* The gap keeps the page content out from under the fixed panel. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[inset-inline,width] duration-200 ease-linear md:flex",
          side === "start"
            ? "start-0 group-data-[collapsible=offcanvas]:start-[calc(var(--sidebar-width)*-1)]"
            : "end-0 group-data-[collapsible=offcanvas]:end-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=start]:border-e group-data-[side=end]:border-s",
          className
        )}
        {...props}
      >
        <div data-sidebar="sidebar" data-slot="sidebar-inner" className="flex size-full flex-col bg-sidebar">
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { t } = useTranslation()
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      data-sidebar="trigger" data-slot="sidebar-trigger" variant="ghost" size="icon-lg" className={className}
      aria-label={t("nav.toggle")}
      onClick={(event) => { onClick?.(event); toggleSidebar() }}
      {...props}
    >
      <PanelLeftIcon className="rtl:rotate-180" />
    </Button>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("relative flex min-w-0 w-full flex-1 flex-col bg-background", className)}
      {...props}
    />
  )
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot="sidebar-separator" data-sidebar="separator" className={cn("mx-2 w-auto bg-sidebar-border", className)} {...props} />
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content" data-sidebar="content"
      className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className)}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group" data-sidebar="group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-px", className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-start text-[15px] outline-hidden ring-sidebar-ring transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pe-8 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-semibold data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0",
  {
    variants: {
      variant: { default: "", outline: "bg-background shadow-[0_0_0_1px_var(--sidebar-border)]" },
      size: {
        default: "h-10",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function SidebarMenuButton({
  asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props
}: React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean; tooltip?: string | React.ComponentProps<typeof TooltipContent> } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot.Root : "button"
  const { i18n } = useTranslation()
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size={size} data-active={isActive || undefined}
      className={cn(sidebarMenuButtonVariants({ variant, size }), "group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden", className)}
      {...props}
    />
  )
  if (!tooltip) return button
  const content = typeof tooltip === "string" ? { children: tooltip } : tooltip
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={i18n.dir() === "rtl" ? "left" : "right"} align="center" hidden={state !== "collapsed" || isMobile} {...content} />
    </Tooltip>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub" data-sidebar="menu-sub"
      className={cn("relative my-0.5 ms-[22px] flex min-w-0 flex-col gap-px border-s border-sidebar-border ps-0 group-data-[collapsible=icon]:hidden", className)}
      {...props}
    />
  )
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" className={cn("group/menu-sub-item relative", className)} {...props} />
}

function SidebarMenuSubButton({
  asChild = false, size = "md", isActive = false, className, ...props
}: React.ComponentProps<"a"> & { asChild?: boolean; size?: "sm" | "md"; isActive?: boolean }) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button" data-size={size} data-active={isActive || undefined}
      className={cn(
        "flex min-w-0 items-center gap-2 overflow-hidden rounded-md py-1.5 ps-5 pe-3 text-sidebar-foreground outline-hidden ring-sidebar-ring hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-semibold data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider,
  SidebarSeparator, SidebarTrigger, useSidebar,
}
