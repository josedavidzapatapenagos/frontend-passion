import { Dropdown } from "@heroui/react";
import type { NavbarGroupItem } from "@/constants/navbarMenus";

type NavbarDropdownMenuProps = {
  item: NavbarGroupItem;
  isActive: boolean;
  activePath: string;
  isLargeScreen: boolean;
  onNavigate: (path: string) => void;
};

export const NavbarDropdownMenu = ({
  item,
  isActive,
  activePath,
  isLargeScreen,
  onNavigate,
}: NavbarDropdownMenuProps) => (
  <Dropdown>
    <Dropdown.Trigger
      aria-label={`Abrir menú ${item.label}`}
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#FD0083]/60 ${
        isActive
          ? "bg-[#FD0083] text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 data-[pressed=true]:bg-slate-100 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white dark:data-[pressed=true]:bg-white/10"
      }`}
    >
      {({ isPressed }) => (
        <>
          <span>{item.label}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isPressed ? "scale-90" : ""} ${
              isLargeScreen ? "" : "rotate-90"
            }`}
            aria-hidden="true"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </>
      )}
    </Dropdown.Trigger>

    <Dropdown.Popover
      placement={isLargeScreen ? "right top" : "bottom start"}
      offset={10}
      className="min-w-64 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#012a33] dark:text-white"
    >
      <Dropdown.Menu
        aria-label={item.label}
        onAction={(key) => onNavigate(String(key))}
        className="p-1.5"
      >
        <Dropdown.Section>
          {item.children.map((child) => (
            <Dropdown.Item
              key={child.path}
              id={child.path}
              textValue={child.label}
              className={`flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 data-[focused=true]:bg-slate-100 dark:data-[focused=true]:bg-white/10 ${
                child.path === activePath ? "text-[#FD0083]" : ""
              }`}
            >
              <span className="font-semibold">{child.label}</span>
              {child.description && (
                <span className="text-xs text-slate-500 dark:text-white/60">{child.description}</span>
              )}
            </Dropdown.Item>
          ))}
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);
