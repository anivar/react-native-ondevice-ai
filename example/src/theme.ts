/**
 * OpenSLM palette, taken from the tokens on openslm.ai.
 *
 * The site reads as a standards document: parchment and ink with indigo, one
 * seal-red for anything that stops you, and sage for a healthy status. Keeping
 * the same values here means the example looks like it belongs to the org
 * rather than to a component library.
 */

export interface Theme {
  paper: string;
  surface: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  rule: string;
  ruleStrong: string;
  indigo: string;
  indigoSoft: string;
  seal: string;
  sage: string;
}

export const light: Theme = {
  paper: '#F5F1E8',
  surface: '#FFFFFF',
  ink: '#0F1419',
  inkMuted: '#5C6470',
  inkFaint: '#62697A',
  rule: '#D9D2C2',
  ruleStrong: '#B7AE99',
  indigo: '#1E2A78',
  indigoSoft: '#8FA0FF',
  seal: '#8B2E2A',
  sage: '#6B8E7F',
};

export const dark: Theme = {
  paper: '#12161C',
  surface: '#171C24',
  ink: '#E8E2D2',
  inkMuted: '#A8B0BC',
  inkFaint: '#818897',
  rule: '#2A323D',
  ruleStrong: '#3F4A58',
  indigo: '#8FA0FF',
  indigoSoft: '#8FA0FF',
  seal: '#C4635F',
  sage: '#8FB3A3',
};

/** Feature state to colour. Sage for healthy, seal for a hard no. */
export function stateColor(theme: Theme, state: string): string {
  switch (state) {
    case 'available':
      return theme.sage;
    case 'downloadable':
    case 'downloading':
      return theme.indigo;
    default:
      return theme.seal;
  }
}
