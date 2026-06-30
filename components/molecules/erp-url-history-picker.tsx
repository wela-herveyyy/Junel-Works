"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { normalizeErpUrlInput } from "@/lib/erpnext/url-history";
import { cn } from "@/lib/utils/cn";

type ErpUrlHistoryPickerProps = {
  value: string;
  onChange: (value: string) => void;
  history: string[];
  placeholder?: string;
  required?: boolean;
};

const fieldClass = "nb-input font-body-md min-h-[56px]";

export function ErpUrlHistoryPicker({
  value,
  onChange,
  history,
  placeholder = "https://erp.example.com",
  required,
}: ErpUrlHistoryPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <div className="flex w-full min-w-0 items-stretch gap-xs">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => history.length > 0 && setOpen(true)}
          className={cn(fieldClass, "min-w-0 flex-1")}
          placeholder={placeholder}
          required={required}
          autoComplete="url"
          aria-expanded={history.length > 0 ? open : undefined}
          aria-controls={history.length > 0 ? listId : undefined}
        />
        {history.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="shrink-0 w-14 rounded-lg nb-border bg-surface-container-lowest nb-shadow-sm flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface nb-press-sm"
            aria-label={open ? "Hide recent ERP sites" : "Show recent ERP sites"}
            aria-expanded={open}
            aria-controls={listId}
          >
            <Icon name={open ? "expand_less" : "expand_more"} size={22} />
          </button>
        ) : null}
      </div>

      {open && history.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-lg nb-border bg-surface-container-lowest nb-shadow-md overflow-hidden">
          <p className="px-md py-xs font-label-bold text-mono-label text-on-surface-variant border-b-4 border-black">
            Recent sites
          </p>
          <ul id={listId} className="max-h-48 overflow-y-auto custom-scrollbar">
            {history.map((item) => {
              const active = normalizeErpUrlInput(item) === normalizeErpUrlInput(value);
              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-md py-sm font-body-sm text-body-sm break-all hover:bg-surface-container-high transition-colors",
                      active ? "bg-secondary-container/20 text-secondary font-bold" : "text-on-surface",
                    )}
                  >
                    {item}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
