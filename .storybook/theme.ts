import { create } from 'storybook/theming'

import { ColorBrandPrimary, ColorBrandSecondary, FontBrandSans } from '../src/styles/tokens.gen'

const fontBase = FontBrandSans.map((font) => (font.includes(' ') ? `"${font}"` : font)).join(', ')

const shared = {
  brandTitle: 'MapRoulette',
  brandUrl: '/',
  brandTarget: '_self' as const,
  colorPrimary: ColorBrandPrimary,
  colorSecondary: ColorBrandSecondary,
  fontBase,
}

export const lightTheme = create({
  ...shared,
  base: 'light',
  brandImage: '/maproulette-logo.svg',
})

export const darkTheme = create({
  ...shared,
  base: 'dark',
  brandImage: '/maproulette-logo-dark.svg',
})
