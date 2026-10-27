"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ProgressStore } from "@/lib/progressStore";
import { LimanBook, type LimanBookHandle } from "./LimanBook";
import { bookRig } from "./bookRig";

export type BookPose = {
  /** Screen-space translation of the spine centre, as fractions of the stage box. */
  dx: number;
  dy: number;
  /** Apparent scale relative to the photo frame. */
  scale: number;
  /** Projected spine centre at the start pose, as fractions of the stage box. */
  originX: number;
  originY: number;
};

export type BookFraming = {
  /** Centre of the open spread in the mockup frame (px). */
  centerX: number;
  centerY: number;
  /** Width of the open spread in the mockup frame (px). */
  width: number;
};

const AMBIENT = 1.05;
const KEY = 2.9;
// light arrives from the upper left, slightly in front of the menu
const KEY_DIR = new THREE.Vector3(-0.38, 0.52, 0.76).normalize();
const COVER_OPEN = Math.PI - 0.21;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const inOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function BookScene({
  store,
  framing,
  onReady,
  onPose,
}: {
  store: ProgressStore;
  framing: BookFraming;
  onReady: () => void;
  onPose: (pose: BookPose) => void;
}) {
  const book = useRef<LimanBookHandle>(null);
  const key = useRef<THREE.DirectionalLight>(null!);
  const invalidate = useThree((s) => s.invalidate);
  const gains = useRef({ page: 1 });
  const { frame, stage, focalPx, size, coverStart } = bookRig;
  const T = size.TB + size.TP;

  const poses = useRef({
    p0: new THREE.Vector3(...bookRig.start.position),
    q0: new THREE.Quaternion(...bookRig.start.quaternion),
    p1: new THREE.Vector3(),
    q1: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.27, 0.17, 0.0, "YXZ")),
    tmpP: new THREE.Vector3(),
    tmpQ: new THREE.Quaternion(),
  });

  // final spread position from the requested framing
  useEffect(() => {
    const d = (2 * size.W * focalPx * Math.cos(0.17)) / framing.width;
    poses.current.p1.set(
      ((framing.centerX - frame.width / 2) / focalPx) * d,
      (-(framing.centerY - frame.height / 2) / focalPx) * d,
      -d,
    );
    invalidate();
  }, [framing, focalPx, frame, size.W, invalidate]);

  useEffect(() => store.subscribe(() => invalidate()), [store, invalidate]);

  // Match each surface's brightness to the photograph at the start pose:
  // Lambert output = albedo * (ambient + key * N·L) / PI.
  useLayoutEffect(() => {
    const b = book.current;
    if (!b) return;
    const { q0 } = poses.current;
    const gain = (normal: THREE.Vector3) => Math.PI / (AMBIENT + KEY * Math.max(0, normal.dot(KEY_DIR)));
    const pageN = new THREE.Vector3(0, 0, 1).applyQuaternion(q0);
    const coverN = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -coverStart)
      .applyQuaternion(q0);
    const kPage = gain(pageN);
    gains.current.page = kPage;
    b.faces.cover.color.setScalar(gain(coverN));
    b.faces.mains.color.setScalar(kPage);
    b.faces.starters.color.setScalar(kPage);
    b.faces.cloth.forEach((m) => m.color.setScalar(gain(coverN) * 0.96));
    b.faces.paper.forEach((m) => m.color.setScalar(kPage * 0.94));
    invalidate();
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [coverStart, invalidate, onReady]);

  useFrame(() => {
    const b = book.current;
    if (!b) return;
    const p = store.get();
    const P = poses.current;

    const move = inOutSine(span(p, 0, 0.86));
    const turn = inOutCubic(span(p, 0.12, 0.86));
    const open = inOutSine(span(p, 0.03, 0.8));
    // the menu first eases toward the camera, then settles back to frame the spread
    const approach = Math.sin(Math.PI * span(p, 0, 0.5)) * 0.5;

    P.tmpP.lerpVectors(P.p0, P.p1, move);
    P.tmpP.z += approach;
    b.rig.position.copy(P.tmpP);
    b.rig.quaternion.slerpQuaternions(P.q0, P.q1, turn);

    const angle = coverStart + (COVER_OPEN - coverStart) * open;
    b.hinge.rotation.y = -angle;
    // the cloth joint flattens as the cover swings past vertical
    const flex = span(angle, Math.PI * 0.35, Math.PI * 0.9);
    const depth = 1 - 0.27 * flex;
    b.spine.scale.set(1, 1, depth);
    b.spine.position.set(0, 0, ((T + size.TC) / 2) * depth);
    // pages are pressed flat while the cover is near closed and bloom as it opens
    const bloom = 0.12 + 0.88 * inOutSine(span(angle, coverStart, Math.PI * 0.92));
    for (const leaf of b.leaves) if (leaf.morphTargetInfluences) leaf.morphTargetInfluences[0] = bloom;
    // paper catches more light once the menu is open and turned toward the window
    const glow = 1 + 0.1 * inOutSine(span(p, 0.25, 0.85));
    b.faces.mains.color.setScalar(gains.current.page * glow);
    b.faces.starters.color.setScalar(gains.current.page * glow);

    // key light follows the menu so its shadow map stays tight
    key.current.position.copy(b.rig.position).addScaledVector(KEY_DIR, 6);
    key.current.target.position.copy(b.rig.position);
    key.current.target.updateMatrixWorld();
    key.current.shadow.intensity = 0.75 * span(p, 0.05, 0.3);

    // report screen-space motion so the photo can travel with the model during the dissolve
    const z = -b.rig.position.z;
    const u = frame.width / 2 + (focalPx * b.rig.position.x) / z;
    const v = frame.height / 2 - (focalPx * b.rig.position.y) / z;
    const z0 = -P.p0.z;
    const u0 = frame.width / 2 + (focalPx * P.p0.x) / z0;
    const v0 = frame.height / 2 - (focalPx * P.p0.y) / z0;
    onPose({
      dx: (u - u0) / stage.width,
      dy: (v - v0) / stage.height,
      scale: z0 / z,
      originX: (u0 - stage.x) / stage.width,
      originY: (v0 - stage.y) / stage.height,
    });
  });

  return (
    <>
      <ambientLight intensity={AMBIENT} color="#fff7ee" />
      <directionalLight
        ref={key}
        intensity={KEY}
        color="#fffaf3"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.015}
        shadow-camera-left={-1.6}
        shadow-camera-right={1.6}
        shadow-camera-top={1.4}
        shadow-camera-bottom={-1.4}
        shadow-camera-near={0.5}
        shadow-camera-far={14}
      />
      <LimanBook ref={book} />
    </>
  );
}
