import { useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text3D } from '@react-three/drei'
import fontUrl from 'three/examples/fonts/helvetiker_bold.typeface.json?url'

function Wordmark() {
  const group = useRef()
  const front = useRef()
  const back = useRef()
  const { viewport } = useThree()

  useLayoutEffect(() => {
    front.current.geometry.computeBoundingBox()
    const bounds = front.current.geometry.boundingBox
    const width = bounds.max.x - bounds.min.x
    const scale = Math.min(1, viewport.width * 0.82 / width)
    const x = -(bounds.max.x + bounds.min.x) / 2
    const y = -(bounds.max.y + bounds.min.y) / 2
    group.current.scale.setScalar(scale)
    front.current.position.set(x, y, 0.06)
    back.current.position.set(x + 0.055, y - 0.055, -0.08)
  }, [viewport.width])

  useFrame(({ clock, pointer }) => {
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.48) * 0.42 + pointer.x * 0.08
    group.current.rotation.x = pointer.y * 0.07
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * 0.018
  })

  return <group ref={group}>
    <Text3D ref={back} font={fontUrl} size={0.9} height={0.24} curveSegments={12} bevelEnabled bevelSegments={4} bevelSize={0.025} bevelThickness={0.035}>
      VEXORA
      <meshStandardMaterial color="#087f8c" metalness={0.68} roughness={0.24} emissive="#087f8c" emissiveIntensity={0.22} />
    </Text3D>
    <Text3D ref={front} font={fontUrl} size={0.9} height={0.24} curveSegments={12} bevelEnabled bevelSegments={4} bevelSize={0.025} bevelThickness={0.035}>
      VEXORA
      <meshPhysicalMaterial color="#e8f7f8" metalness={0.76} roughness={0.2} clearcoat={1} clearcoatRoughness={0.12} />
    </Text3D>
  </group>
}

function Scene() {
  return <>
    <ambientLight intensity={0.8} />
    <directionalLight position={[-3, 4, 5]} intensity={2.5} color="#f0fbff" />
    <directionalLight position={[3, -2, 3]} intensity={1.5} color="#24c4d0" />
    <Wordmark />
  </>
}

export default function OrbitScene() {
  return <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8], fov: 38 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <Scene />
  </Canvas>
}
