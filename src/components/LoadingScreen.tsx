import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center"
      >
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="mt-4 text-white text-lg">Carregando...</p>
      </motion.div>
    </div>
  );
}