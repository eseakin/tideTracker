import { motion } from "motion/react"
import { useState } from "react"
import styled from "styled-components"

import Flex from "#blocks/Flex"

const GRAY1 = '#F7F7F7'
const GRAY2 = '#E2E2E2'
const GRAY3 = '#D2D2D2'

const SkeletonBar = styled(motion.div)`
  width: 100%;
  height: 16px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    ${GRAY1} 1%,
    ${GRAY2} 25%,
    ${GRAY1} 60%,
    transparent 100%
  );
  border-radius: 4px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 200%;
    background: linear-gradient(
      -55deg,
      transparent 0%,
      transparent 40%,
      ${GRAY3} 50%,
      ${GRAY3} 60%,
      transparent 80%,
      transparent 100%
    );
    opacity: 0.3;
    transform: translateX(var(--x)) translateY(-50%);
  }
`

const SkeletonBlock = ({
  count = 1,
  gap = 4,
}: {
  count?: number
  gap?: number
}) => {
  const [id] = useState(Date.now())

  return (
    <Flex col gap={gap}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBar
          key={`skeleton-${id}-${index}`}
          animate={{
            "--x": ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </Flex>
  )
}

export default SkeletonBlock
