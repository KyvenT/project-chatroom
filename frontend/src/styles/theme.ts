// Legacy color keys are kept so existing components pick up the new palette:
//   black      -> app background
//   dark_grey  -> panels / raised surfaces
//   grey       -> hover / selected surfaces
//   light_grey -> muted text
//   white      -> primary text
export const defaultColors = {
  black: "#0e1015",
  dark_grey: "#161922",
  grey: "#212634",
  light_grey: "#8f98aa",
  white: "#e9ebf1",

  border: "#262b39",
  borderStrong: "#363c4e",
  accent: "#6d72f6",
  accentHover: "#8085fa",
  onAccent: "#ffffff",
  danger: "#ef5a5a",
  success: "#3ecf8e",

  statusOnline: "#3ecf8e",
  statusAway: "#f5a524",
  statusOffline: "#5b6274",
};

export type EditableColor = keyof typeof defaultColors;
export type ColorOverrides = Partial<Record<EditableColor, string>>;

// What each editable color is used for, grouped for the settings page
export const colorSettings: {
  group: string;
  colors: { key: EditableColor; label: string; description: string }[];
}[] = [
  {
    group: "Surfaces",
    colors: [
      {
        key: "black",
        label: "Background",
        description: "Page background, chat area and inputs",
      },
      {
        key: "dark_grey",
        label: "Panels",
        description: "Sidebar, header, modals and menus",
      },
      {
        key: "grey",
        label: "Hover and selected",
        description: "Hovered buttons, rows and badges",
      },
    ],
  },
  {
    group: "Text",
    colors: [
      { key: "white", label: "Text", description: "Main text and headings" },
      {
        key: "light_grey",
        label: "Muted text",
        description: "Hints, labels, timestamps and icons",
      },
    ],
  },
  {
    group: "Borders",
    colors: [
      {
        key: "border",
        label: "Borders",
        description: "Dividers and panel edges",
      },
      {
        key: "borderStrong",
        label: "Strong borders",
        description: "Input and button outlines, scrollbars",
      },
    ],
  },
  {
    group: "Accent",
    colors: [
      {
        key: "accent",
        label: "Accent",
        description: "Primary buttons, links, focus rings, unread badges",
      },
      {
        key: "accentHover",
        label: "Accent hover",
        description: "Hovered primary buttons and links",
      },
      {
        key: "onAccent",
        label: "Text on accent",
        description: "Text and icons on accent and danger buttons",
      },
    ],
  },
  {
    group: "Feedback",
    colors: [
      {
        key: "danger",
        label: "Danger",
        description: "Errors, delete and leave actions",
      },
      {
        key: "success",
        label: "Success",
        description: "Copied link, accepted invites",
      },
    ],
  },
  {
    group: "Status",
    colors: [
      { key: "statusOnline", label: "Online", description: "Status dot" },
      { key: "statusAway", label: "Away", description: "Status dot" },
      { key: "statusOffline", label: "Offline", description: "Status dot" },
    ],
  },
];

export const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

// "#rrggbb" + alpha -> "rgba(r, g, b, alpha)"
export const withAlpha = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// mixes hex toward white by amount (0-1)
const lighten = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(channel);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

export const buildTheme = (overrides: ColorOverrides = {}) => {
  const base = { ...defaultColors };
  for (const [key, value] of Object.entries(overrides)) {
    if (key in base && value && isHexColor(value)) {
      base[key as EditableColor] = value;
    }
  }

  return {
    colors: {
      ...base,
      // derived, so they follow the colors they're based on
      accentSoft: withAlpha(base.accent, 0.14),
      dangerSoft: withAlpha(base.danger, 0.12),
      dangerHover: lighten(base.danger, 0.12),
      successSoft: withAlpha(base.success, 0.12),
      backdrop: withAlpha(base.black, 0.6),
    },
    radius: {
      sm: "6px",
      md: "8px",
      lg: "12px",
    },
    shadow: {
      popup:
        "0 10px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.03)",
      card: "0 1px 2px rgba(0, 0, 0, 0.3)",
    },
  };
};

export const theme = buildTheme();

export type AppTheme = ReturnType<typeof buildTheme>;
