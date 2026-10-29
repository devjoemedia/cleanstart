/**
 * Returns the brand palette for the device's light or dark setting.
 * @author {{author}}
 */
import { useColorScheme } from 'react-native'
import { palette } from '#/constants/tokens'

export const useColors = () => palette[useColorScheme() === 'dark' ? 'dark' : 'light']
