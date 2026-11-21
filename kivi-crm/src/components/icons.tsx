// Small inline icon set (stroke icons, 20px grid). Decorative by default.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Svg({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => <Svg {...p}><path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z" /></Svg>;
export const IconBuilding = (p: IconProps) => <Svg {...p}><rect x="4" y="3" width="12" height="14" rx="1" /><path d="M7.5 6.5h1M11.5 6.5h1M7.5 9.5h1M11.5 9.5h1M8.5 17v-3h3v3" /></Svg>;
export const IconUser = (p: IconProps) => <Svg {...p}><circle cx="10" cy="7" r="3" /><path d="M4 17c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5" /></Svg>;
export const IconPipeline = (p: IconProps) => <Svg {...p}><rect x="3" y="4" width="4" height="12" rx="1" /><rect x="8.5" y="4" width="4" height="8" rx="1" /><rect x="14" y="4" width="3" height="5" rx="1" /></Svg>;
export const IconBriefcase = (p: IconProps) => <Svg {...p}><rect x="3" y="6" width="14" height="10" rx="1.5" /><path d="M7.5 6V4.5h5V6M3 10.5h14" /></Svg>;
export const IconCheck = (p: IconProps) => <Svg {...p}><path d="m4.5 10.5 3.5 3.5 7.5-8" /></Svg>;
export const IconCheckCircle = (p: IconProps) => <Svg {...p}><circle cx="10" cy="10" r="7" /><path d="m7 10.2 2 2 4-4.4" /></Svg>;
export const IconUpload = (p: IconProps) => <Svg {...p}><path d="M10 13V4M6.5 7.5 10 4l3.5 3.5M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13" /></Svg>;
export const IconDownload = (p: IconProps) => <Svg {...p}><path d="M10 4v9M6.5 9.5 10 13l3.5-3.5M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13" /></Svg>;
export const IconChart = (p: IconProps) => <Svg {...p}><path d="M4 16V9M8 16V5M12 16v-5M16 16V7M3 16.5h14" /></Svg>;
export const IconSearch = (p: IconProps) => <Svg {...p}><circle cx="9" cy="9" r="5" /><path d="m13 13 3.5 3.5" /></Svg>;
export const IconSettings = (p: IconProps) => <Svg {...p}><circle cx="10" cy="10" r="2.5" /><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.4 1.4M13.6 13.6 15 15M5 15l1.4-1.4M13.6 6.4 15 5" /></Svg>;
export const IconShield = (p: IconProps) => <Svg {...p}><path d="M10 3 4.5 5v4.5c0 3.5 2.4 6 5.5 7.5 3.1-1.5 5.5-4 5.5-7.5V5z" /></Svg>;
export const IconPlus = (p: IconProps) => <Svg {...p}><path d="M10 4.5v11M4.5 10h11" /></Svg>;
export const IconMail = (p: IconProps) => <Svg {...p}><rect x="3" y="5" width="14" height="10" rx="1.5" /><path d="m3.5 6 6.5 5 6.5-5" /></Svg>;
export const IconPhone = (p: IconProps) => <Svg {...p}><path d="M5 3.5h2.5l1.2 3-1.6 1.1a8 8 0 0 0 4.3 4.3l1.1-1.6 3 1.2V14a1.5 1.5 0 0 1-1.5 1.5A11.5 11.5 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5Z" /></Svg>;
export const IconCalendar = (p: IconProps) => <Svg {...p}><rect x="3.5" y="4.5" width="13" height="12" rx="1.5" /><path d="M3.5 8.5h13M7 3v3M13 3v3" /></Svg>;
export const IconChat = (p: IconProps) => <Svg {...p}><path d="M4 15.5 5 13a6 6 0 1 1 2.5 2.3z" /></Svg>;
export const IconFlag = (p: IconProps) => <Svg {...p}><path d="M5 17V4M5 4.5h9l-1.8 3 1.8 3H5" /></Svg>;
export const IconNote = (p: IconProps) => <Svg {...p}><path d="M5 3.5h7l3 3V16a.5.5 0 0 1-.5.5h-9.5A.5.5 0 0 1 4.5 16V4a.5.5 0 0 1 .5-.5ZM7.5 9.5h5M7.5 12.5h5" /></Svg>;
export const IconTask = (p: IconProps) => <Svg {...p}><rect x="3.5" y="3.5" width="13" height="13" rx="2" /><path d="m7 10 2 2 4-4.5" /></Svg>;
export const IconArchive = (p: IconProps) => <Svg {...p}><rect x="3" y="4" width="14" height="3.5" rx="1" /><path d="M4.5 7.5V15a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7.5M8 10.5h4" /></Svg>;
export const IconMerge = (p: IconProps) => <Svg {...p}><path d="M6 3.5v4a4 4 0 0 0 4 4h0a4 4 0 0 1 4 4v1M14 3.5v4a4 4 0 0 1-4 4" /></Svg>;
export const IconAlert = (p: IconProps) => <Svg {...p}><path d="M10 3.5 17 16H3z" /><path d="M10 8.5v3M10 13.8v.2" /></Svg>;
export const IconLink = (p: IconProps) => <Svg {...p}><path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.8.8M11.5 8.5a3 3 0 0 0-4.2 0L5 10.8A3 3 0 0 0 9.2 15l.8-.8" /></Svg>;
export const IconArrowRight = (p: IconProps) => <Svg {...p}><path d="M4 10h12M11.5 5.5 16 10l-4.5 4.5" /></Svg>;
export const IconSignOut = (p: IconProps) => <Svg {...p}><path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 6.5 15.5 10 12 13.5M15.5 10H8" /></Svg>;
export const IconX = (p: IconProps) => <Svg {...p}><path d="m5.5 5.5 9 9M14.5 5.5l-9 9" /></Svg>;
export const IconRefresh = (p: IconProps) => <Svg {...p}><path d="M15.5 8A6 6 0 0 0 4.7 6.5M4.5 12a6 6 0 0 0 10.8 1.5M15.5 4v4h-4M4.5 16v-4h4" /></Svg>;
export const IconClock = (p: IconProps) => <Svg {...p}><circle cx="10" cy="10" r="6.5" /><path d="M10 6.5V10l2.5 1.5" /></Svg>;
export const IconUsers = (p: IconProps) => <Svg {...p}><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="13.5" cy="8" r="2" /><path d="M3 16c.6-2.5 2.4-3.8 4.5-3.8S11.4 13.5 12 16M12.5 12.3c2 0 3.8 1 4.5 3.7" /></Svg>;

export const ACTIVITY_ICON = {
  email: IconMail,
  call: IconPhone,
  meeting: IconCalendar,
  whatsapp: IconChat,
  event: IconFlag,
  note: IconNote,
  task: IconTask,
  research_update: IconSearch,
  requirement_milestone: IconBriefcase,
  invoice: IconNote,
  payment: IconCheckCircle,
} as const;
export const IconBell = (p: IconProps) => <Svg {...p}><path d="M5.5 14V9a4.5 4.5 0 0 1 9 0v5l1.5 1.5h-12zM8.5 17h3" /></Svg>;
export const IconRupee = (p: IconProps) => <Svg {...p}><path d="M6 4.5h8M6 8h8M9 4.5c2.5 0 3.5 1.5 3.5 3.5S11 11.5 8 11.5H6.5L12 16" /></Svg>;
export const IconRadar = (p: IconProps) => <Svg {...p}><circle cx="10" cy="10" r="6.5" /><circle cx="10" cy="10" r="3" /><path d="m10 10 4.5-4.5" /></Svg>;
