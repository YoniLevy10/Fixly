'use client'

import { useMemo } from 'react'

import {
  CUSTOMER_NAVIGATION,
  PROFESSIONAL_NAVIGATION,
} from '@/shared/constants/navigation'

export function useNavigation(role: 'customer' | 'professional') {
  return useMemo(() => {
    if (role === 'professional') {
      return PROFESSIONAL_NAVIGATION
    }

    return CUSTOMER_NAVIGATION
  }, [role])
}
