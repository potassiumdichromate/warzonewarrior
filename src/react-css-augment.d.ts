import type {} from 'react';

declare module 'react' {
  interface CSSProperties {
    '--quest-color'?: string;
    '--category-color'?: string;
    '--background-image'?: string;
    '--angle'?: string | number;
  }
}
