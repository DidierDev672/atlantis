export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface RectDimensions {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface TooltipPositionResult {
  placement: TooltipPlacement
  top: number
  left: number
  arrowTop: number
  arrowLeft: number
}

const VIEWPORT_PADDING = 8
const TRIGGER_GAP = 8

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

/**
 * Calcula automáticamente la mejor posición (`top`, `bottom`, `left` o `right`)
 * y acota las coordenadas al viewport para que el tooltip nunca se desborde.
 */
export function computeTooltipPosition(params: {
  triggerRect: RectDimensions
  tooltipWidth: number
  tooltipHeight: number
  viewportWidth: number
  viewportHeight: number
  preferredPlacement?: TooltipPlacement
}): TooltipPositionResult {
  const {
    triggerRect,
    tooltipWidth,
    tooltipHeight,
    viewportWidth,
    viewportHeight,
    preferredPlacement = 'top',
  } = params

  const availableSpace: Record<TooltipPlacement, number> = {
    top: triggerRect.top - VIEWPORT_PADDING,
    bottom: viewportHeight - triggerRect.bottom - VIEWPORT_PADDING,
    left: triggerRect.left - VIEWPORT_PADDING,
    right: viewportWidth - triggerRect.right - VIEWPORT_PADDING,
  }

  const fits: Record<TooltipPlacement, boolean> = {
    top: availableSpace.top >= tooltipHeight + TRIGGER_GAP,
    bottom: availableSpace.bottom >= tooltipHeight + TRIGGER_GAP,
    left: availableSpace.left >= tooltipWidth + TRIGGER_GAP,
    right: availableSpace.right >= tooltipWidth + TRIGGER_GAP,
  }

  const candidateOrder: TooltipPlacement[] = Array.from(
    new Set([preferredPlacement, 'top', 'bottom', 'right', 'left'])
  )

  let chosen: TooltipPlacement =
    candidateOrder.find((dir) => fits[dir]) ?? candidateOrder[0]

  if (!fits[chosen]) {
    chosen = candidateOrder.reduce((best, dir) =>
      availableSpace[dir] > availableSpace[best] ? dir : best
    )
  }

  const triggerCenterX = triggerRect.left + triggerRect.width / 2
  const triggerCenterY = triggerRect.top + triggerRect.height / 2

  let rawTop = 0
  let rawLeft = 0

  switch (chosen) {
    case 'top':
      rawTop = triggerRect.top - tooltipHeight - TRIGGER_GAP
      rawLeft = triggerCenterX - tooltipWidth / 2
      break
    case 'bottom':
      rawTop = triggerRect.bottom + TRIGGER_GAP
      rawLeft = triggerCenterX - tooltipWidth / 2
      break
    case 'left':
      rawTop = triggerCenterY - tooltipHeight / 2
      rawLeft = triggerRect.left - tooltipWidth - TRIGGER_GAP
      break
    case 'right':
      rawTop = triggerCenterY - tooltipHeight / 2
      rawLeft = triggerRect.right + TRIGGER_GAP
      break
  }

  const maxLeft = viewportWidth - tooltipWidth - VIEWPORT_PADDING
  const maxTop = viewportHeight - tooltipHeight - VIEWPORT_PADDING

  const clampedLeft = clamp(rawLeft, VIEWPORT_PADDING, maxLeft)
  const clampedTop = clamp(rawTop, VIEWPORT_PADDING, maxTop)

  const arrowLeft = clamp(
    triggerCenterX - clampedLeft,
    12,
    Math.max(12, tooltipWidth - 12)
  )
  const arrowTop = clamp(
    triggerCenterY - clampedTop,
    10,
    Math.max(10, tooltipHeight - 10)
  )

  return {
    placement: chosen,
    top: clampedTop,
    left: clampedLeft,
    arrowTop,
    arrowLeft,
  }
}
