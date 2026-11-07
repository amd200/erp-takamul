import * as React from "react"
import { cn } from "@/lib/utils"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Drawer as DrawerPrimitive } from "vaul"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/lib/use-mobile"
import { XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

/** On phones every dialog is a bottom drawer (swipe down to close); from `sm` up it is a centred dialog. */
const MobileContext = React.createContext(false)

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const mobile = useIsMobile()
  return (
    <MobileContext.Provider value={mobile}>
      {mobile ? (
        <DrawerPrimitive.Root
          data-slot="dialog"
          open={props.open}
          defaultOpen={props.defaultOpen}
          onOpenChange={props.onOpenChange}
        >
          {props.children}
        </DrawerPrimitive.Root>
      ) : (
        <DialogPrimitive.Root data-slot="dialog" {...props} />
      )}
    </MobileContext.Provider>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const Trigger = React.useContext(MobileContext)
    ? DrawerPrimitive.Trigger
    : DialogPrimitive.Trigger
  return <Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const Close = React.useContext(MobileContext)
    ? DrawerPrimitive.Close
    : DialogPrimitive.Close
  return <Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const { t } = useTranslation()
  if (React.useContext(MobileContext)) {
    return (
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          data-slot="dialog-overlay"
          className="fixed inset-0 z-50 bg-black/30"
        />
        <DrawerPrimitive.Content
          data-slot="dialog-content"
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-popover px-4 pt-8 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none",
            className
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute start-1/2 top-2 z-10 h-1.5 w-10 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-muted-foreground/40"
          />
          {/* The body scrolls on its own: dragging here must scroll, not move the drawer (only the handle drags it). */}
          <div
            data-vaul-no-drag
            className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    )
  }
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 start-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 end-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">{t("common.close")}</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        // In a drawer the footer sticks to the bottom so the buttons stay reachable on long forms.
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 max-sm:sticky max-sm:-bottom-4 max-sm:z-10 max-sm:rounded-none max-sm:bg-muted sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const Title = React.useContext(MobileContext)
    ? DrawerPrimitive.Title
    : DialogPrimitive.Title
  return (
    <Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-semibold",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const Description = React.useContext(MobileContext)
    ? DrawerPrimitive.Description
    : DialogPrimitive.Description
  return (
    <Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
