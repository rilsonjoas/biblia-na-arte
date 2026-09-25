import { useQuery } from '@tanstack/react-query'
import { getVerseOfTheDay } from '@/lib/versiculo'
import { todaySaoPaulo } from '@/lib/api-data'

// "Versículo do Dia" — a queryKey inclui a data de hoje (fuso de São
// Paulo) de propósito, mesmo padrão de useDailyArtwork: a virada do dia
// gera chave nova e invalida o cache sozinha, sem refetchInterval.
export function useVerseOfTheDay() {
  const today = todaySaoPaulo()
  return useQuery({
    queryKey: ['versiculo-do-dia', today],
    queryFn: getVerseOfTheDay,
    staleTime: 60 * 60 * 1000, // 1h — o versículo só muda na virada
    gcTime: 24 * 60 * 60 * 1000,
  })
}