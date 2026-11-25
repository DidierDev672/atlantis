import { memo } from 'react'
import { motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'

export const SubmitContent = memo(function SubmitContent({
  label,
}: {
  label: string
}) {
  return (
    <>
      <span
        className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
        aria-hidden="true"
      />
      {label}
    </>
  )
})

export const SubmitError = memo(function SubmitError({
  message,
  status,
}: {
  message: string
  status?: number | null
}) {
  if (status != null && status !== 200) {
    return (
      <div role="alert">
        <StatusCodeAlert status={status} message={message} dismissible={false} />
      </div>
    )
  }

  return (
    <motion.p
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      role="alert"
      className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
    >
      {message}
    </motion.p>
  )
})
