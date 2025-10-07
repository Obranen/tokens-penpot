import StyleDictionary from 'style-dictionary'
import { register } from '@tokens-studio/sd-transforms'

register(StyleDictionary)

export default {
  source: ['tokens/tokens.json'],
  preprocessors: ['tokens-studio'],

  platforms: {
    variables: {
      transforms: [
        'ts/size/px',
        'ts/opacity',
        'name/kebab',
        'ts/size/lineheight',
        'ts/typography/fontWeight',
        'ts/size/css/letterspacing',
      ],
      buildPath: 'tokens/build/',
      files: [
        {
          destination: 'all-semantic-variables.css',
          format: 'css/variables',
          filter: (token) => token.path[0] !== 'globals',
        },
        {
          destination: 'globals-variables.css',
          format: 'css/variables',
          filter: (token) => token.path[0] === 'globals',
        },
      ],
    },
  },
}
