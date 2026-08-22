import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * SPAs preservam a posição de scroll entre rotas por padrão — navegar de um
 * catálogo rolado até o fim direto pra uma obra abre a obra "no meio".
 * Este componente devolve o comportamento de site multi-página: toda troca
 * de rota começa do topo.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
