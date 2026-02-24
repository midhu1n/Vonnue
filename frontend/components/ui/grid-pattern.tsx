"use client"

import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from "framer-motion"
import React, { useRef } from "react"

interface GridPatternProps {
    offsetX: any
    offsetY: any
}

export const GridPattern = ({ offsetX, offsetY }: GridPatternProps) => {
    return (
        <svg className="w-full h-full">
            <defs>
                <motion.pattern
                    id="grid-pattern"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                    x={offsetX}
                    y={offsetY}
                >
                    <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-muted-foreground"
                    />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
    )
}

export function useInfiniteGrid(speedX = 0.3, speedY = 0.3) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const gridOffsetX = useMotionValue(0)
    const gridOffsetY = useMotionValue(0)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - left)
        mouseY.set(e.clientY - top)
    }

    useAnimationFrame(() => {
        gridOffsetX.set((gridOffsetX.get() + speedX) % 40)
        gridOffsetY.set((gridOffsetY.get() + speedY) % 40)
    })

    const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`

    return { containerRef, handleMouseMove, gridOffsetX, gridOffsetY, maskImage }
}
