"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { bookRig, bookTextures } from "./bookRig";

export type LimanBookHandle = {
  /** Group positioned at the spine centre; drive its position/quaternion. */
  rig: THREE.Group;
  /** Hinge of the front cover; rotation.y = -angle (0 closed, PI flat open). */
  hinge: THREE.Group;
  /** Cloth spine; its depth follows the cover as the joint flexes. */
  spine: THREE.Mesh;
  /** Page stacks; morph target 0 is the relaxed, open-book curvature. */
  leaves: THREE.Mesh[];
  /** Materials whose brightness is matched to the photo at the start pose. */
  faces: {
    cover: THREE.MeshLambertMaterial;
    mains: THREE.MeshLambertMaterial;
    starters: THREE.MeshLambertMaterial;
    cloth: THREE.MeshLambertMaterial[];
    paper: THREE.MeshLambertMaterial[];
  };
};

const { W, H, TB, TP, TC } = bookRig.size;
const T = TB + TP;
/** Sheets glued inside the front cover (the left page of the spread). */
const TL = 0.012;
const OVERHANG = 0.007;

/**
 * Open-book page profile measured from the spine: the paper dives into the
 * gutter, rises to a soft crown and relaxes toward the fore-edge.
 */
function pageCurve(x: number, width: number) {
  const s = x / width;
  return 0.034 * (1 - Math.exp(-s / 0.09)) * (1 - 0.55 * s * s) - 0.004;
}

/**
 * A stack of paper as a subdivided box running from x=0 (spine) to x=width.
 * Morph target 0 bends the printed face (`face` = +1 for +z, -1 for -z).
 */
function useCurvedStack(width: number, height: number, depth: number, face: 1 | -1) {
  return useMemo(() => {
    const g = new THREE.BoxGeometry(width, height, depth, 64, 1, 1);
    g.translate(width / 2, 0, 0);
    const base = g.attributes.position as THREE.BufferAttribute;
    const bent = base.clone();
    for (let i = 0; i < bent.count; i++) {
      const x = bent.getX(i);
      const z = bent.getZ(i);
      // printed side follows the curve fully, the back of the stack only partly
      const weight = Math.sign(z) === face ? 1 : 0.35;
      bent.setZ(i, z + face * pageCurve(x, width) * weight);
    }
    const tmp = g.clone();
    tmp.setAttribute("position", bent);
    tmp.computeVertexNormals();
    g.morphAttributes.position = [bent];
    g.morphAttributes.normal = [tmp.attributes.normal.clone()];
    tmp.dispose();
    return g;
  }, [width, height, depth, face]);
}

export const LimanBook = forwardRef<LimanBookHandle>(function LimanBook(_, ref) {
  const rig = useRef<THREE.Group>(null!);
  const hinge = useRef<THREE.Group>(null!);
  const spine = useRef<THREE.Mesh>(null!);
  const right = useRef<THREE.Mesh>(null!);
  const left = useRef<THREE.Mesh>(null!);
  const gl = useThree((s) => s.gl);

  const [coverMap, startersMap, mainsMap, linenMap, edgesMap] = useLoader(THREE.TextureLoader, [
    bookTextures.cover,
    bookTextures.starters,
    bookTextures.mains,
    bookTextures.linen,
    bookTextures.edges,
  ]);

  const mats = useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    const prep = (t: THREE.Texture, repeat?: [number, number], rotate = false) => {
      const tex = t.clone();
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      if (repeat) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(...repeat);
      }
      if (rotate) {
        tex.center.set(0.5, 0.5);
        tex.rotation = Math.PI / 2;
      }
      tex.needsUpdate = true;
      return tex;
    };
    const lambert = (map: THREE.Texture) => new THREE.MeshLambertMaterial({ map });
    // cloth repeats sized so the weave matches the cover photograph
    const cloth = [
      lambert(prep(linenMap, [0.06, 2.1])), // long board edges
      lambert(prep(linenMap, [2.3, 0.06])), // short board edges
      lambert(prep(linenMap, [2.3, 2.1])), // board faces
      lambert(prep(linenMap, [0.25, 2.1])), // spine
    ];
    const paper = [lambert(prep(edgesMap, [1, 1])), lambert(prep(edgesMap, [1, 1], true))];
    return {
      cover: lambert(prep(coverMap)),
      starters: lambert(prep(startersMap)),
      mains: lambert(prep(mainsMap)),
      cloth,
      paper,
    };
  }, [gl, coverMap, startersMap, mainsMap, linenMap, edgesMap]);

  useImperativeHandle(
    ref,
    () => ({ rig: rig.current, hinge: hinge.current, spine: spine.current, leaves: [right.current, left.current], faces: mats }),
    [mats],
  );

  const rightStack = useCurvedStack(W - OVERHANG, H - OVERHANG * 2, TP, 1);
  const leftStack = useCurvedStack(W - OVERHANG, H - OVERHANG * 2, TL, -1);
  const [edgeLong, edgeShort, clothFace, clothSpine] = mats.cloth;
  const [edgeTB, edgeFore] = mats.paper;
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z
  const boardMats = [edgeLong, edgeLong, edgeShort, edgeShort, clothFace, clothFace];
  const rightMats = [edgeFore, edgeFore, edgeTB, edgeTB, mats.mains, edgeTB];
  const leftMats = [edgeFore, edgeFore, edgeTB, edgeTB, edgeTB, mats.starters];
  const coverMats = [edgeLong, edgeLong, edgeShort, edgeShort, mats.cover, clothFace];

  return (
    <group ref={rig}>
      {/* model space is offset so the rig origin sits on the spine centre */}
      <group position={[0, 0, -T]}>
        <mesh material={boardMats} position={[W / 2, 0, TB / 2]} castShadow receiveShadow>
          <boxGeometry args={[W, H, TB]} />
        </mesh>
        <mesh
          ref={right}
          geometry={rightStack}
          material={rightMats}
          position={[0, 0, TB + TP / 2]}
          morphTargetInfluences={[0]}
          castShadow
          receiveShadow
        />
        <mesh ref={spine} material={clothSpine} castShadow receiveShadow>
          <cylinderGeometry args={[(T + TC) / 2, (T + TC) / 2, H, 24, 1, true, Math.PI, Math.PI]} />
        </mesh>
        <group ref={hinge} position={[0, 0, T]}>
          <mesh material={coverMats} position={[W / 2, 0, TC / 2]} castShadow receiveShadow>
            <boxGeometry args={[W, H, TC]} />
          </mesh>
          {/* insert glued inside the front cover */}
          <mesh
            ref={left}
            geometry={leftStack}
            material={leftMats}
            position={[0, 0, -TL / 2 - 0.0005]}
            morphTargetInfluences={[0]}
            castShadow
            receiveShadow
          />
        </group>
      </group>
    </group>
  );
});
