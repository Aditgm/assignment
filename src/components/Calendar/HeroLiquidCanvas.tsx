'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import styles from '@/styles/calendar.module.css';

interface HeroLiquidCanvasProps {
  imageSrc: string;
  className?: string;
  onLoaded?: () => void;
  onError?: () => void;
}

interface LiquidPlaneProps {
  texture: THREE.Texture;
}

const TRAIL_POINTS = 10;

function LiquidPlane({ texture }: LiquidPlaneProps) {
  const { viewport } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const pointerRef = useRef(new THREE.Vector2(-10, -10));
  const trailPoints = useMemo(
    () => Array.from({ length: TRAIL_POINTS }, () => new THREE.Vector2(-10, -10)),
    []
  );

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uPoints: { value: trailPoints },
      uTime: { value: 0 },
      uDistortion: { value: 0.055 },
    }),
    [texture, trailPoints]
  );

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    trailPoints[0].lerp(pointerRef.current, 0.36);

    for (let i = 1; i < trailPoints.length; i += 1) {
      trailPoints[i].lerp(trailPoints[i - 1], 0.24);
    }

    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh
      scale={[viewport.width, viewport.height, 1]}
      onPointerMove={(event) => {
        if (event.uv) {
          pointerRef.current.set(event.uv.x, event.uv.y);
        }
      }}
      onPointerLeave={() => {
        pointerRef.current.set(-10, -10);
      }}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent={false}
        vertexShader={`
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;

          uniform sampler2D uTexture;
          uniform vec2 uPoints[${TRAIL_POINTS}];
          uniform float uTime;
          uniform float uDistortion;

          void main() {
            vec2 uv = vUv;
            vec2 distortion = vec2(0.0);

            for (int i = 0; i < ${TRAIL_POINTS}; i++) {
              vec2 point = uPoints[i];
              vec2 diff = uv - point;
              float dist = length(diff);
              float falloff = exp(-dist * 24.0) * (1.0 - float(i) / float(${TRAIL_POINTS}));
              vec2 direction = normalize(diff + vec2(0.0001));
              distortion += direction * falloff * uDistortion;
            }

            float wave = sin((uv.x + uv.y + uTime * 0.28) * 10.0) * 0.0009;
            vec2 displaced = uv + distortion + vec2(wave, -wave);

            float split = clamp(length(distortion) * 0.85, 0.0, 0.03);
            vec4 base = texture2D(uTexture, displaced);
            float r = texture2D(uTexture, displaced + vec2(split * 0.65, 0.0)).r;
            float b = texture2D(uTexture, displaced - vec2(split * 0.65, 0.0)).b;

            gl_FragColor = vec4(r, base.g, b, 1.0);
          }
        `}
      />
    </mesh>
  );
}

export default function HeroLiquidCanvas({ imageSrc, className, onLoaded, onError }: HeroLiquidCanvasProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let disposed = false;
    let loadedTexture: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();

    loader.load(
      imageSrc,
      (nextTexture) => {
        if (disposed) {
          nextTexture.dispose();
          return;
        }

        nextTexture.colorSpace = THREE.SRGBColorSpace;
        nextTexture.minFilter = THREE.LinearFilter;
        nextTexture.magFilter = THREE.LinearFilter;
        nextTexture.generateMipmaps = false;

        loadedTexture = nextTexture;
        setTexture(nextTexture);
        onLoadedRef.current?.();
      },
      undefined,
      () => {
        if (!disposed) {
          onErrorRef.current?.();
        }
      }
    );

    return () => {
      disposed = true;
      if (loadedTexture) {
        loadedTexture.dispose();
      }
    };
  }, [imageSrc]);

  return (
    <div className={`${styles.heroLiquidCanvas} ${className ?? ''}`}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 2], zoom: 1 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        {texture && <LiquidPlane texture={texture} />}
      </Canvas>
    </div>
  );
}
