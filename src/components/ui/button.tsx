import React from 'react'
import { TouchableOpacity, Text, type TouchableOpacityProps } from 'react-native'

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'destructive'
  children?: React.ReactNode
  /** Alias di onPress per compatibilita' con il codice web esistente. Transitorio. */
  onClick?: () => void
}

export function Button({
  variant: _variant,
  children,
  onClick,
  onPress,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress ?? onClick} {...props}>
      <Text>{children}</Text>
    </TouchableOpacity>
  )
}
