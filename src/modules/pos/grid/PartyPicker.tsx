import { useState } from "react"
import { Check, ChevronDown, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type Party = { id: number; name: string; phone: string }

/** A searchable picker for a supplier (or any party with a name and phone). */
export function PartyPicker({ parties, value, onPick, placeholder, searchPlaceholder, empty, invalid, disabled, plain }: {
  parties: Party[]
  value: number
  onPick: (p: Party) => void
  placeholder: string
  searchPlaceholder: string
  empty: string
  invalid?: boolean
  disabled?: boolean
  /** The purchases 2 look: a plain select (no person icon, the height of the other fields). */
  plain?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = parties.find((p) => p.id === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} aria-invalid={invalid || undefined} aria-label={placeholder}
          className={cn("w-full justify-between gap-2 bg-background font-normal classic:hover:border-border! classic:hover:bg-background! classic:aria-expanded:border-border! classic:aria-expanded:bg-background! classic:focus-visible:border-border! classic:focus-visible:bg-background! classic:focus-visible:ring-0!", plain ? "h-10 text-[11px]" : "h-11", invalid && "border-destructive")}>
          <span className="flex min-w-0 items-center gap-2">{!plain && <User className="shrink-0 text-muted-foreground" />}<span className={cn("truncate", !current && "text-muted-foreground")}>{current?.name ?? placeholder}</span></span>
          <ChevronDown className="shrink-0 text-faint" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            <CommandGroup>
              {parties.map((p) => (
                <CommandItem key={p.id} value={`${p.name} ${p.phone}`} onSelect={() => { onPick(p); setOpen(false) }}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{p.name}</span>
                    {p.phone && <bdi className="block truncate text-xs text-muted-foreground">{p.phone}</bdi>}
                  </span>
                  {p.id === value && <Check aria-label={t("common.active")} />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
