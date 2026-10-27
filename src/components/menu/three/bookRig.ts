/**
 * Camera and pose of the LIMAN book, solved from the approved Scene 01
 * photograph so the 3D model starts exactly where the photo sits.
 *
 * Coordinates: the camera is at the origin looking down -Z (three.js
 * convention). Book model space: x runs from the spine (0) to the fore-edge
 * (W), y is up, z runs from the back board (0) to the cover (T + TC).
 */
export const bookRig = {
  /** Virtual frame of the approved mockup the solve was made in. */
  frame: { width: 1672, height: 941 },
  /** Where the menu stage sits inside that frame. */
  stage: { x: 700, y: 95, width: 972, height: 757 },
  fovY: 12.8546,
  focalPx: 4176.65,
  size: { W: 1.08602, H: 1, TB: 0.028, TP: 0.05, TC: 0.028 },
  /** Cover angle in the photo, radians (0 = closed). */
  coverStart: 1.04564,
  /** Pose of the spine centre (model point 0,0,T) in camera space. */
  start: {
    position: [0.035176, 0.095309, -7.012466] as const,
    quaternion: [-0.003505, 0.011102, -0.11109, 0.993742] as const,
  },
} as const;

export const bookTextures = {
  cover: "/scene-01/book/cover-front.webp",
  starters: "/scene-01/book/page-starters.webp",
  mains: "/scene-01/book/page-mains.webp",
  linen: "/scene-01/book/linen.webp",
  edges: "/scene-01/book/page-edges.webp",
} as const;
