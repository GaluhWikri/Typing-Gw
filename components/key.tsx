"use client"

import { useRef, useState } from "react"
import { useFrame, type RootState } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import type { KeyData } from "@/lib/keyboard-layout"
import type { Group } from "three"

interface KeyProps {
    data: KeyData
    position: [number, number, number]
    isPressed: boolean
    onPress: () => void
}

export function Key({ data, position, isPressed, onPress }: KeyProps) {
    const groupRef = useRef<Group>(null)
    const [hovered, setHovered] = useState(false)

    // Animate press
    useFrame((state: RootState, delta: number) => {
        if (groupRef.current) {
            const targetY = isPressed ? -0.15 : 0
            groupRef.current.position.y += (targetY - groupRef.current.position.y) * 20 * delta
        }
    })

    const width = data.width || 1
    const depth = 1
    const height = 0.4
    const borderRadius = 0.05

    return (
        <group
            ref={groupRef}
            position={position}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={(e) => {
                e.stopPropagation()
                onPress()
            }}
        >
            {/* Key Cap */}
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[width - 0.1, height, depth - 0.1]} />
                <meshStandardMaterial
                    color={isPressed ? "#60a5fa" : hovered ? "#f4f4f5" : data.color || "#ffffff"}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>

            {/* Label */}
            <Text
                position={[
                    data.align === "left" ? -width / 2 + 0.2 : data.align === "right" ? width / 2 - 0.2 : 0,
                    height + 0.01,
                    data.align === "left" || data.align === "right" ? -0.2 : 0.1,
                ]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={data.fontSize || 0.25}
                color={data.textColor || (data.color ? "#ffffff" : "#18181b")}
                anchorX={data.align === "left" ? "left" : data.align === "right" ? "right" : "center"}
                anchorY="middle"
            // font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2"
            >
                {data.label}
            </Text>
        </group>
    )
}
