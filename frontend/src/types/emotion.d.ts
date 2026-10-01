import "@emotion/react";
import type { AppTheme } from "../styles/theme";

declare module "@emotion/react" {
  // an interface, not a type alias, so it merges with Emotion's own Theme
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Theme extends AppTheme {}
}
