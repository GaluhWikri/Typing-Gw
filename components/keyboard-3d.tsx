"use client"

import { Key } from "@/components/key"
import { KEYBOARD_LAYOUT } from "@/lib/keyboard-layout"

interface Keyboard3DProps {
    activeKeys: Set<string>
    capsLock: boolean
}

export function Keyboard3D({ activeKeys, capsLock }: Keyboard3DProps) {
    return (
        <group position={[0, 0, 0]} rotation={[0.45, 0, 0]}>
            {/* Keyboard Base */}
            <mesh position={[0, -0.5, 0]} receiveShadow>
                <boxGeometry args={[16, 1, 6.2]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
            </mesh>

            {/* Keyboard Case Border/Rim */}
            <mesh position={[0, 0.1, -3.15]} receiveShadow>
                <boxGeometry args={[16.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.1, 3.15]} receiveShadow>
                <boxGeometry args={[16.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[-8.1, 0.1, 0]} receiveShadow>
                <boxGeometry args={[0.2, 1.2, 6.5]} />
                <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[8.1, 0.1, 0]} receiveShadow>
                <boxGeometry args={[0.2, 1.2, 6.5]} />
                <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.2} />
            </mesh>

            {/* Keys */}
            <group position={[-8.0, 0.5, -2.35]}>
                {KEYBOARD_LAYOUT.map((row, rowIndex) => {
                    let currentX = 0
                    return (
                        <group key={rowIndex} position={[0, 0, rowIndex * 1.05]}>
                            {row.map((keyData) => {
                                const keyWidth = keyData.width || 1
                                // Position key at current X plus half its width for centering
                                const xPos = currentX + keyWidth / 2
                                // Move to next key position (current position + key width + gap)
                                currentX += keyWidth + 0.1 // 0.1 is gap between keys

                                // Determine if key should be visually pressed
                                const isPressed = activeKeys.has(keyData.code) || (keyData.code === "CapsLock" && capsLock)

                                return (
                                    <Key
                                        key={keyData.code}
                                        data={keyData}
                                        position={[xPos, 0, 0]}
                                        isPressed={isPressed}
                                        onPress={() => {
                                            const keyVal = keyData.code === "Space" ? " " : keyData.label

                                            // Simulate key press for mouse clicks
                                            const event = new KeyboardEvent("keydown", {
                                                key: keyVal,
                                                code: keyData.code,
                                            })
                                            window.dispatchEvent(event)

                                            setTimeout(() => {
                                                const upEvent = new KeyboardEvent("keyup", {
                                                    key: keyVal,
                                                    code: keyData.code,
                                                })
                                                window.dispatchEvent(upEvent)
                                            }, 100)
                                        }}
                                    />
                                )
                            })}
                        </group>
                    )
                })}
            </group>
        </group>
    )
}
