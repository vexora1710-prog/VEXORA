import { useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles, Text3D } from '@react-three/drei'
import fontUrl from 'three/examples/fonts/helvetiker_bold.typeface.json?url'

function FloatingBrand() {
  const group = useRef()
  const rear = useRef()
  const front = useRef()
  const { viewport } = useThree()

  useLayoutEffect(() => {
    const rearGeometry = rear.current.geometry
    const frontGeometry = front.current.geometry
    rearGeometry.computeBoundingBox()
    frontGeometry.computeBoundingBox()

    const rearBounds = rearGeometry.boundingBox
    const frontBounds = frontGeometry.boundingBox
    const bounds = rearBounds.union(frontBounds)

    const width = bounds.max.x - bounds.min.x
    const scale = Math.min(1.55, viewport.width * 0.95 / width)
    group.current.scale.setScalar(scale)

    const centerX = -(bounds.max.x + bounds.min.x) / 2
    const centerY = -(bounds.max.y + bounds.min.y) / 2

    rear.current.position.set(centerX, centerY, -0.42)
    front.current.position.set(centerX, centerY, 0)
  }, [viewport.width])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    group.current.rotation.x = -0.38
    group.current.rotation.y = 0.26 + Math.sin(t * 0.8) * 0.45
    group.current.rotation.z = 0.04
    group.current.position.y = Math.sin(t * 0.8) * 0.08
  })

  return <group ref={group}>
    <Text3D ref={rear} font={fontUrl} size={1.02} height={0.42} curveSegments={16} bevelEnabled bevelSegments={8} bevelSize={0.03} bevelThickness={0.05}>
      VEXORA
      <meshStandardMaterial color="#9cdfe6" metalness={0.34} roughness={0.46} emissive="#7ed4ea" emissiveIntensity={0.18} transparent opacity={0.92} />
    </Text3D>

    <Text3D ref={front} font={fontUrl} size={1} height={0.34} curveSegments={16} bevelEnabled bevelSegments={8} bevelSize={0.03} bevelThickness={0.05}>
      VEXORA
      <meshPhysicalMaterial color="#d7fbff" metalness={0.96} roughness={0.09} emissive="#72ebff" emissiveIntensity={1.25} clearcoat={1} clearcoatRoughness={0.1} reflectivity={1} />
    </Text3D>
  </group>
}

export default function HeroScene() {
  return <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 38 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#010d17']} />
    <ambientLight intensity={0.9} />
    <directionalLight position={[-4, 4, 7]} intensity={2.4} color="#e7feff" />
    <directionalLight position={[4, -2, 5]} intensity={1.8} color="#3ad7ff" />
    <pointLight position={[0, 0, 4]} intensity={14} color="#b3f4ff" />
    <pointLight position={[3, -1, 2]} intensity={5} color="#51b6ff" />
    <Sparkles count={30} scale={[12, 7, 5]} size={1.8} speed={0.5} color="#dffeff" opacity={0.8} />
    <FloatingBrand />
  </Canvas>
}
