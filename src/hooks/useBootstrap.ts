import { useQuery } from '@tanstack/react-query'
import { getBootstrap } from '../api/bootstrap'

export function useBootstrap() {
  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: getBootstrap,
    staleTime: Infinity,
  })
}
