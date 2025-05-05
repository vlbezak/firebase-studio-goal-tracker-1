
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
// Removed MatchForm import

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem" // Reduced width for a cleaner look
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

// Keep SidebarProvider as it wraps the whole layout in layout.tsx now
const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    const [_open, _setOpen] = React.useState(() => {
       // Read initial state from cookie if available
       if (typeof document !== 'undefined') {
         const cookieValue = document.cookie
           .split('; ')
           .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
           ?.split('=')[1];
         if (cookieValue) {
           return cookieValue === 'true';
         }
       }
       return defaultOpen;
     });

    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        // Set cookie on change
        if (typeof document !== 'undefined') {
            document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open]
    )


    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    // Ensure the main layout structure is correct
    // The main content should be a sibling of the Sidebar itself
    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn("w-full", className)} // Removed flex and min-h-svh, handled in layout.tsx
            ref={ref}
            {...props}
          >
             {/* Sidebar and Main Content are rendered as siblings in layout.tsx */}
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"


const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar", // Default to sidebar variant
      collapsible = "icon", // Default to icon collapsible
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile, open } = useSidebar() // Get 'open' state

    // Mobile view using Sheet
    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    // Desktop view
    return (
      <aside // Use aside semantic element for sidebar
        ref={ref}
        className={cn(
          "group fixed inset-y-0 z-30 hidden md:flex md:flex-col text-sidebar-foreground transition-all duration-300 ease-in-out", // Use fixed positioning
          open ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]", // Control width based on open state
          variant === "sidebar" && "border-r border-sidebar-border", // Add border for default variant
          side === "left" ? "left-0" : "right-0", // Position based on side
          className
        )}
        data-state={state}
        data-variant={variant}
        data-side={side}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className={cn(
            "flex h-full w-full flex-col bg-sidebar",
            variant === "floating" && "m-2 rounded-lg border border-sidebar-border shadow", // Floating styles
            variant === "inset" && "bg-transparent" // Inset just needs transparent bg
          )}
        >
          {children}
        </div>
        {/* Add SidebarRail if collapsible is 'icon' */}
        {collapsible === 'icon' && <SidebarRail />}
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"


const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)} // Standard trigger styling
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar, state, isMobile } = useSidebar() // Get state and isMobile

  if (isMobile) return null; // Don't render rail on mobile

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 cursor-pointer transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex", // Base styles
        state === 'expanded' ? 'group-data-[side=left]:-right-2 group-data-[side=right]:-left-2' : 'group-data-[side=left]:right-0 group-data-[side=right]:left-0', // Positioning based on state
        state === 'expanded' ? '[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize' : '[[data-side=left]_&]:cursor-e-resize [[data-side=right]_&]:cursor-w-resize', // Cursor based on state
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"


// Removed SidebarInset component as layout is handled in RootLayout


const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
   const { state } = useSidebar();
  return (
    <Input
      ref={ref}
      data-sidebar="input"
       className={cn(
         "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
         state === 'collapsed' && 'hidden', // Hide input when collapsed
         className
       )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        "flex items-center justify-between gap-2 p-2", // Ensure items are aligned and spaced
        state === 'collapsed' && 'justify-center', // Center items when collapsed
        className
      )}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
   const { state } = useSidebar();
  return (
    <div
      ref={ref}
      data-sidebar="footer"
       className={cn(
         "flex flex-col gap-2 p-2 mt-auto", // Added mt-auto to push footer down
         state === 'collapsed' && 'items-center', // Center items when collapsed
         className
       )}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
   const { state } = useSidebar();
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
       className={cn(
         "mx-2 w-auto bg-sidebar-border",
         state === 'collapsed' && 'mx-0', // No horizontal margin when collapsed
         className
       )}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
   const { state } = useSidebar();
  return (
    <div
      ref={ref}
      data-sidebar="content"
       className={cn(
         "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden", // Allow vertical scroll, hide horizontal
         state === 'collapsed' && 'items-center', // Center items when collapsed
         className
       )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"


const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
   const { state } = useSidebar();
  return (
    <div
      ref={ref}
      data-sidebar="group"
       className={cn(
         "relative flex w-full min-w-0 flex-col p-2",
         state === 'collapsed' && 'p-0 items-center', // Adjust padding and alignment when collapsed
         className
         )}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
   const { state } = useSidebar();
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
       className={cn(
         "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
         state === 'collapsed' ? 'hidden' : 'duration-200 transition-[margin,opa] ease-linear', // Hide label when collapsed
         className
       )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"


const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
   const { state } = useSidebar();
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
       className={cn(
         "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
         "after:absolute after:-inset-2 after:md:hidden",
         state === 'collapsed' && 'hidden', // Hide action when collapsed
         className
       )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"


// Updated variants for consistency
const sidebarMenuButtonVariants = cva(
   "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground",
   {
     variants: {
       variant: {
         default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
         outline:
           "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
       },
       size: {
         default: "h-8 text-sm",
         sm: "h-7 text-xs",
         lg: "h-12 text-sm",
       },
     },
     defaultVariants: {
       variant: "default",
       size: "default",
     },
   }
 );


 const SidebarMenuButton = React.forwardRef<
   HTMLButtonElement,
   React.ComponentProps<"button"> & {
     asChild?: boolean
     isActive?: boolean
     tooltip?: string | React.ComponentProps<typeof TooltipContent>
     // Add children prop type explicitly
     children?: React.ReactNode;
   } & VariantProps<typeof sidebarMenuButtonVariants>
 >(
   (
     {
       asChild = false,
       isActive = false,
       variant = "default",
       size = "default",
       tooltip,
       className,
       children, // Destructure children
       ...props
     },
     ref
   ) => {
     const Comp = asChild ? Slot : "button"
     const { isMobile, state } = useSidebar()

     const buttonContent = (
       <>
         {/* Render icon/first child directly */}
         {React.Children.toArray(children)[0]}
         {/* Render the rest of the children (text) only when expanded */}
         {state === 'expanded' && (
           <span className="flex-1 truncate">
             {React.Children.toArray(children).slice(1)}
           </span>
         )}
       </>
     );

     const button = (
       <Comp
         ref={ref}
         data-sidebar="menu-button"
         data-size={size}
         data-active={isActive}
         // Apply collapsed styles directly here
         className={cn(
           sidebarMenuButtonVariants({ variant, size }),
           state === 'collapsed' && 'size-8 justify-center p-2', // Collapsed styles
           className
         )}
         {...props}
       >
          {buttonContent}
        </Comp>
     )

     if (!tooltip) {
       return button
     }

     // Handle tooltip string or object
     const tooltipContent = typeof tooltip === 'string' ? { children: tooltip } : tooltip;
     const tooltipText = typeof tooltip === 'string' ? tooltip : tooltipContent.children;

     return (
       <Tooltip>
         <TooltipTrigger asChild>{button}</TooltipTrigger>
         {/* Show tooltip only when collapsed and not on mobile */}
         <TooltipContent
           side="right"
           align="center"
           hidden={state === "expanded" || isMobile}
           {...tooltipContent} // Pass the processed tooltip content
         >
           {tooltipText}
         </TooltipContent>
       </Tooltip>
     )
   }
 )
 SidebarMenuButton.displayName = "SidebarMenuButton"


 const SidebarMenuAction = React.forwardRef<
   HTMLButtonElement,
   React.ComponentProps<"button"> & {
     asChild?: boolean
     showOnHover?: boolean
   }
 >(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
   const Comp = asChild ? Slot : "button"
    const { state } = useSidebar();

   return (
     <Comp
       ref={ref}
       data-sidebar="menu-action"
        className={cn(
         "absolute right-1 top-1/2 -translate-y-1/2 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
         "after:absolute after:-inset-2 after:md:hidden", // Mobile hit area
         state === 'collapsed' && 'hidden', // Hide action when collapsed
         showOnHover &&
           "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
         className
        )}
       {...props}
     />
   )
 })
 SidebarMenuAction.displayName = "SidebarMenuAction"


 const SidebarMenuBadge = React.forwardRef<
   HTMLDivElement,
   React.ComponentProps<"div">
 >(({ className, ...props }, ref) => {
    const { state } = useSidebar();
   return (
   <div
     ref={ref}
     data-sidebar="menu-badge"
      className={cn(
       "absolute right-1 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
       "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
       state === 'collapsed' && 'hidden', // Hide badge when collapsed
       className
      )}
     {...props}
   />
 )})
 SidebarMenuBadge.displayName = "SidebarMenuBadge"


 const SidebarMenuSkeleton = React.forwardRef<
   HTMLDivElement,
   React.ComponentProps<"div"> & {
     showIcon?: boolean
   }
 >(({ className, showIcon = false, ...props }, ref) => {
   const { state } = useSidebar();
   // Random width between 50 to 90%.
   const width = React.useMemo(() => {
     return `${Math.floor(Math.random() * 40) + 50}%`
   }, [])

   return (
     <div
       ref={ref}
       data-sidebar="menu-skeleton"
        className={cn(
         "rounded-md h-8 flex gap-2 px-2 items-center",
         state === 'collapsed' && 'justify-center px-0 w-8', // Collapsed skeleton styles
         className
         )}
       {...props}
     >
       {showIcon && (
         <Skeleton
           className="size-4 rounded-md"
           data-sidebar="menu-skeleton-icon"
         />
       )}
        {/* Hide text skeleton when collapsed */}
       {state === 'expanded' && (
          <Skeleton
             className="h-4 flex-1 max-w-[--skeleton-width]"
             data-sidebar="menu-skeleton-text"
             style={
             {
                "--skeleton-width": width,
             } as React.CSSProperties
             }
          />
       )}
     </div>
   )
 })
 SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"


 const SidebarMenuSub = React.forwardRef<
   HTMLUListElement,
   React.ComponentProps<"ul">
 >(({ className, ...props }, ref) => {
    const { state } = useSidebar();
  return (
   <ul
     ref={ref}
     data-sidebar="menu-sub"
      className={cn(
       "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
       state === 'collapsed' && 'hidden', // Hide sub-menu when collapsed
       className
      )}
     {...props}
   />
 )})
 SidebarMenuSub.displayName = "SidebarMenuSub"


 const SidebarMenuSubItem = React.forwardRef<
   HTMLLIElement,
   React.ComponentProps<"li">
 >(({ ...props }, ref) => <li ref={ref} {...props} />)
 SidebarMenuSubItem.displayName = "SidebarMenuSubItem"


 const SidebarMenuSubButton = React.forwardRef<
   HTMLAnchorElement,
   React.ComponentProps<"a"> & {
     asChild?: boolean
     size?: "sm" | "md"
     isActive?: boolean
   }
 >(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
   const Comp = asChild ? Slot : "a"
    const { state } = useSidebar();

   return (
     <Comp
       ref={ref}
       data-sidebar="menu-sub-button"
       data-size={size}
       data-active={isActive}
        className={cn(
         "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
         "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
         size === "sm" && "text-xs",
         size === "md" && "text-sm",
         state === 'collapsed' && 'hidden', // Hide sub-button when collapsed
         className
        )}
       {...props}
     />
   )
 })
 SidebarMenuSubButton.displayName = "SidebarMenuSubButton"


 export {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarGroupAction,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarHeader,
   SidebarInput,
   // SidebarInset removed
   SidebarMenu,
   SidebarMenuAction,
   SidebarMenuBadge,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSkeleton,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
   SidebarProvider, // Keep Provider export
   SidebarRail,
   SidebarSeparator,
   SidebarTrigger,
   useSidebar,
 }
