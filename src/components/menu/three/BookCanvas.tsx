"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { ProgressStore } from "@/lib/progressStore";
import { BookScene, type BookFraming, type BookPose } from "./BookScene";
import { bookRig } from "./bookRig";
import { CANVAS_VIEW } from "./canvasView";


export type BookCanvasProps = {
  store: ProgressStore;
  framing: BookFraming;
  onReady: () => void;
  onPose: (pose: BookPose) => void;
};

export default function BookCanvas({ store, framing, onReady, onPose }: BookCanvasProps) {
  const camera = useMemo(() => {
    const { frame, fovY } = bookRig;
    const cam = new THREE.PerspectiveCamera(fovY, frame.width / frame.height, 0.5, 60);
    // R3F would otherwise overwrite the full-frame aspect on resize
    (cam as THREE.PerspectiveCamera & { manual?: boolean }).manual = true;
    cam.setViewOffset(frame.width, frame.height, CANVAS_VIEW.x, CANVAS_VIEW.y, CANVAS_VIEW.width, CANVAS_VIEW.height);
    cam.updateProjectionMatrix();
    return cam;
  }, []);

  return (
    <Canvas
      camera={camera}
      frameloop="demand"
      dpr={[1, 1.75]}
      flat
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <BookScene store={store} framing={framing} onReady={onReady} onPose={onPose} />
      </Suspense>
    </Canvas>
  );
}
