// Icônes au trait (1.5 px), utilisées dans les menus et les boutons du dashboard
const PATHS = {
  home: <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5Z" />,
  list: <path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
  dispatch: <path d="M7 4h7a4 4 0 0 1 0 8H10a4 4 0 0 0 0 8h7M7 4l2.5-2M7 4l2.5 2M17 20l-2.5-2M17 20l-2.5 2" />,
  bike: (
    <>
      <circle cx="5.5" cy="16.5" r="3" />
      <circle cx="18.5" cy="16.5" r="3" />
      <path d="M5.5 16.5 9 10h5l4.5 6.5M9 10 7.5 7H5.5M14 10l-1.5-3H15" />
    </>
  ),
  tag: <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9-8-8Zm4.5-5h.01" />,
  store: <path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10h18M9 20v-6h6v6" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.7-3.5 3.3-5.5 6.5-5.5s5.8 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.8 3 2.6 3.5 5.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.9-4 3.8-6 7.5-6s6.6 2 7.5 6" />
    </>
  ),
  card: <path d="M3 6.5h18v11H3zM3 10h18M7 14.5h3" />,
  chart: <path d="M4 4v16h16M8 15l3.5-4 3 2.5L20 7" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  phone: <path d="M6.5 3.5h3l1.5 4.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
  whatsapp: <path d="M4 20l1.3-4A8 8 0 1 1 8 18.8L4 20Zm5.5-11.5c-.5 1 0 3 1.7 4.6 1.6 1.6 3.6 2.2 4.6 1.7l.7-1.4-2-1-.9.7a5 5 0 0 1-2.4-2.4l.7-.9-1-2-1.4.7Z" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  history: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4M12 8v4l3 2" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  bell: <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2ZM10 20.5a2 2 0 0 0 4 0" />,
  plus: <path d="M12 5v14M5 12h14" />,
  logout: <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />,
}

export default function Icon({ name, className = 'size-[18px]', strokeWidth = 1.5 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  )
}
