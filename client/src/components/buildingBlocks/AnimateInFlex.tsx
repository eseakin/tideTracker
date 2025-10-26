import { HTMLMotionProps, motion } from "motion/react"
import {
  ComponentProps,
  forwardRef,
  type ReactNode,
  useEffect,
  useState,
} from "react"

import Flex from "#blocks/Flex"

export const ANIMATION_BY_KEY: Record<string, HTMLMotionProps<"div">> = {
  // Used on Page load
  down: {
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  leftSm: {
    initial: { opacity: 0, x: 4 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -4 },
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  leftLg: {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  // Unused so far
  right: {
    initial: { opacity: 0, x: -4 },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: { opacity: 0, x: 4 },
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: "easeInOut" },
  },
  // Doesn't seem to work
  swipeRight: {
    initial: { opacity: 0, width: 0, overflow: "hidden" },
    animate: { opacity: 1, width: 200, overflow: "hidden" },
    exit: { opacity: 0, width: 0, overflow: "hidden" },
    transition: { duration: 1.5, ease: "easeInOut" },
  },
  // Cool idea but I wasn't super happy with it. Would be better to do a reveal swipe.
  grow: {
    initial: { opacity: 0, scaleY: 0, transformOrigin: "top" },
    animate: { opacity: 1, scaleY: 1, transformOrigin: "top" },
    exit: { opacity: 0, scaleY: 0, transformOrigin: "top" },
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  shake: {
    initial: { x: 0 },
    animate: { x: [-10, 10, -10, 10, -5, 5, 0] },
    exit: { x: 0 },
    transition: { duration: 0.4, ease: "easeInOut" },
  },
} as const

type AnimateInFlexProps = {
  animationKey?: string
  animation?: HTMLMotionProps<"div">
  children: ReactNode
  wait?: number
  onAnimationComplete?: () => void
} & ComponentProps<typeof Flex>

const AnimatedFlex = motion.create(Flex)

const AnimateInFlex = forwardRef<HTMLDivElement, AnimateInFlexProps>(
  (props, ref) => {
    const {
      animationKey,
      animation,
      children,
      wait,
      onAnimationComplete,
      style,
      className,
      ...rest
    } = props
    const [isMounted, setIsMounted] = useState(!wait)

    // Either the animation completes or the wait time is over
    const handleAnimationComplete = () => {
      setIsMounted(true)
      onAnimationComplete?.()
    }

    useEffect(() => {
      if (wait) {
        setTimeout(() => {
          setIsMounted(true)
        }, wait)
      }
    }, [wait])

    return (
      <AnimatedFlex
        style={style}
        className={className}
        key={animationKey}
        ref={ref}
        {...animation}
        {...rest}
        onAnimationComplete={handleAnimationComplete}
      >
        {isMounted ? children : null}
      </AnimatedFlex>
    )
  }
)

AnimateInFlex.displayName = "AnimateInFlex"

export default AnimateInFlex
