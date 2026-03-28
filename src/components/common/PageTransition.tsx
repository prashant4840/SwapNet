import type { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'

export function PageTransition({ children }: PropsWithChildren) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
