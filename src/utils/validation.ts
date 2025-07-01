/**
 * Valida se um email é válido
 * @param email Email a ser validado
 * @returns true se o email for válido, false caso contrário
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Verifica se está rodando no servidor (SSR)
 */
export const isServer = typeof window === 'undefined';
