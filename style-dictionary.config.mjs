import StyleDictionary from 'style-dictionary'
import { register } from '@tokens-studio/sd-transforms'

register(StyleDictionary)

export default {
  source: ['tokens/tokens.json'],

  platforms: {
    dark: {
      transformGroup: 'tokens-studio',
      buildPath: 'tokens/build/',
      files: [
        {
          destination: 'dark-tokens.css',
          format: 'css/variables',
          filter: (token) => token.path[0] === 'dark',
        },
      ],
    },
    light: {
      transformGroup: 'tokens-studio',
      buildPath: 'tokens/build/',
      files: [
        {
          destination: 'light-tokens.css',
          format: 'css/variables',
          filter: (token) => token.path[0] === 'light',
        },
      ],
    },
  },
}
