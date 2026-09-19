import "@emotion/react";
import type { AppTheme } from "../styles/theme";

declare module "@emotion/react" {
  export interface Theme extends AppTheme {}
}
