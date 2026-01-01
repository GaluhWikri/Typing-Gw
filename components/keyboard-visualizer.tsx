"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { Environment, PerspectiveCamera, ContactShadows } from "@react-three/drei"
import { Suspense, useEffect } from "react"
import { Keyboard3D } from "@/components/keyboard-3d"

interface KeyboardVisualizerProps {
    activeKeys: Set<string>
    capsLock: boolean
}

function ResponsiveCamera() {
    const { camera, size } = useThree()

    useEffect(() => {
        const isMobile = size.width < 768
        const isTablet = size.width >= 768 && size.width < 1024

        // Fixed camera positions for consistency
        let zPos = 10
        let yPos = 5.5
        let targetY = -1.0

        if (isMobile) {
            // Mobile: pull back a bit more
            zPos = 12
            yPos = 6.5
        } else if (isTablet) {
            // Tablet: middle ground
            zPos = 11
            yPos = 6
        }

        // Set camera position
        camera.position.set(0, yPos, zPos)
        camera.lookAt(0, targetY, 0)
        camera.updateProjectionMatrix()
    }, [camera, size])

    return null
}

export function KeyboardVisualizer({ activeKeys, capsLock }: KeyboardVisualizerProps) {
    return (
        <div className="w-full h-full min-h-[450px] bg-transparent relative">
            <Canvas shadows dpr={[1, 2]} linear flat>
                {/* Adjusted default camera to be closer */}
                <PerspectiveCamera makeDefault position={[0, 5.5, 10]} fov={50} />
                <ResponsiveCamera />

                {/* <color attach="background" args={["#111"]} /> Removed to have transparent background */}

                {/* Strong Lighting */}
                <ambientLight intensity={3} />
                <directionalLight position={[0, 10, 5]} intensity={2.5} castShadow />
                <spotLight position={[0, 15, 0]} angle={0.4} penumbra={0.5} intensity={5} castShadow />
                <pointLight position={[-10, 5, -5]} intensity={2} />
                {/* Backlight for rim definition */}
                <pointLight position={[0, 5, -10]} intensity={3} color="#ffffff" />

                <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial color="red" wireframe /></mesh>}>
                    <Keyboard3D activeKeys={activeKeys} capsLock={capsLock} />
                    {/* <Environment preset="city" /> Removed to prevent loading issues */}
                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={40} blur={2} far={4} />
                </Suspense>
            </Canvas>
        </div>
    )
}
