"""
Renders the LIMAN menu opening sequence with Blender Cycles.

The camera, book proportions and opening pose were solved from the approved
Scene 01 photograph (see fit.json), so frame 0 lines up with that photo and the
website can dissolve from the photo into the sequence.

Usage (Blender as a Python module, `pip install bpy==5.2.3`):
    python render_menu.py --out ./frames --scale 1.25 --samples 48
    python render_menu.py --out ./probe --scale 0.5 --samples 16 --frames 0,40,95

World space is the photo camera's space at frame 0: x right, y up, the camera
looks down -z. Book model space: x runs from the spine (0) to the fore-edge (W),
y is up, z runs from the back board (0) to the cover (T + TC).
"""

import argparse
import json
import math
import os

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
TEX = os.path.join(HERE, "textures")

FIT = json.load(open(os.path.join(HERE, "fit.json")))
W, H = FIT["W"], 1.0
TB, TP, TC = FIT["TB"], FIT["TP"], FIT["TC"]
T = TB + TP
TL = 0.012          # card insert glued inside the front cover
OV = 0.007          # boards overhang the pages
F = FIT["f"]        # focal length in mockup-frame pixels
CX, CY = 836.0, 470.5
VIEW = (400, 0, 1272, 912)  # rendered region of the 1672x941 mockup frame
N_FRAMES = 96

# composition of the open spread (mockup-frame pixels)
END_PX = (1214.0, 476.0)
END_WIDTH = 800.0

# ----------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------

def clamp01(v):
    return max(0.0, min(1.0, v))

def span(u, a, b):
    return clamp01((u - a) / (b - a))

def smooth(t):
    return t * t * (3 - 2 * t)

def smoother(t):
    return t * t * t * (t * (6 * t - 15) + 10)

def page_curve(x, width):
    """Open-book profile from the spine: gutter dip, soft crown, relaxed fore-edge."""
    s = np.clip(x / width, 0, 1)
    return 0.034 * (1 - np.exp(-s / 0.09)) * (1 - 0.55 * s * s) - 0.004


def ry(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

def rx(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def to_matrix(rot3, pos):
    m = Matrix.Identity(4)
    for i in range(3):
        for j in range(3):
            m[i][j] = rot3[i][j]
        m[i][3] = pos[i]
    return m


# ----------------------------------------------------------------------------
# materials
# ----------------------------------------------------------------------------

def load_image(name, colorspace="sRGB"):
    img = bpy.data.images.load(os.path.join(TEX, name), check_existing=True)
    img.colorspace_settings.name = colorspace
    return img


def principled(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    return mat, nt, bsdf


def linen_coords(nt, scale):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    return mp


def linen_material(name, tint=(1, 1, 1), gain=1.0):
    mat, nt, bsdf = principled(name)
    mp = linen_coords(nt, 2.9)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = load_image("linen.webp")
    tex.projection = "BOX"
    tex.projection_blend = 0.25
    nt.links.new(mp.outputs["Vector"], tex.inputs["Vector"])
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 1.0
    nt.links.new(tex.outputs["Color"], mul.inputs[6])
    mul.inputs[7].default_value = (tint[0] * gain, tint[1] * gain, tint[2] * gain, 1)
    nt.links.new(mul.outputs[2], bsdf.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.22
    bump.inputs["Distance"].default_value = 0.0015
    nt.links.new(tex.outputs["Color"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.86
    bsdf.inputs["Sheen Weight"].default_value = 0.45
    bsdf.inputs["Sheen Roughness"].default_value = 0.45
    bsdf.inputs["Specular IOR Level"].default_value = 0.35
    return mat


def printed_material(name, image, gain, cloth_bump=False, roughness=0.64):
    """A texture printed on paper (or on the cover cloth)."""
    mat, nt, bsdf = principled(name)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = load_image(image)
    tex.interpolation = "Cubic"
    tex.extension = "EXTEND"
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 1.0
    nt.links.new(tex.outputs["Color"], mul.inputs[6])
    mul.inputs[7].default_value = (gain, gain, gain, 1)
    nt.links.new(mul.outputs[2], bsdf.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    if cloth_bump:
        mp = linen_coords(nt, 2.9)
        lin = nt.nodes.new("ShaderNodeTexImage")
        lin.image = load_image("linen.webp")
        lin.projection = "BOX"
        nt.links.new(mp.outputs["Vector"], lin.inputs["Vector"])
        nt.links.new(lin.outputs["Color"], bump.inputs["Height"])
        bump.inputs["Strength"].default_value = 0.16
        bump.inputs["Distance"].default_value = 0.0012
        bsdf.inputs["Sheen Weight"].default_value = 0.3
    else:
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 900.0
        noise.inputs["Detail"].default_value = 4.0
        nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        bump.inputs["Strength"].default_value = 0.05
        bump.inputs["Distance"].default_value = 0.0004
        bsdf.inputs["Sheen Weight"].default_value = 0.12
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Specular IOR Level"].default_value = 0.3
    return mat


def paper_edge_material(name, sheets, gain):
    """Stacked sheets: stripes follow the per-vertex 'layer' attribute (0 bottom, 1 top)."""
    mat, nt, bsdf = principled(name)
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "layer"
    m1 = nt.nodes.new("ShaderNodeMath"); m1.operation = "MULTIPLY"; m1.inputs[1].default_value = sheets * math.pi
    m2 = nt.nodes.new("ShaderNodeMath"); m2.operation = "SINE"
    m3 = nt.nodes.new("ShaderNodeMath"); m3.operation = "ABSOLUTE"
    m4 = nt.nodes.new("ShaderNodeMath"); m4.operation = "POWER"; m4.inputs[1].default_value = 0.35
    nt.links.new(attr.outputs["Fac"], m1.inputs[0])
    nt.links.new(m1.outputs[0], m2.inputs[0])
    nt.links.new(m2.outputs[0], m3.inputs[0])
    nt.links.new(m3.outputs[0], m4.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.56 * gain, 0.51 * gain, 0.45 * gain, 1)
    ramp.color_ramp.elements[1].color = (0.84 * gain, 0.79 * gain, 0.71 * gain, 1)
    nt.links.new(m4.outputs[0], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.0006
    nt.links.new(m4.outputs[0], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.8
    return mat


# ----------------------------------------------------------------------------
# geometry
# ----------------------------------------------------------------------------

def new_object(name, mesh, parent=None):
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def board(name, w, h, d, mats, parent, front_uv=True, back_uv_mirror=True):
    """Bevelled board spanning x 0..w, y -h/2..h/2, z 0..d. mats = (front, back, sides)."""
    xs, ys, zs = (0, w), (-h / 2, h / 2), (0, d)
    verts = [(x, y, z) for x in xs for y in ys for z in zs]
    idx = lambda i, j, k: i * 4 + j * 2 + k
    faces = [
        (idx(0, 0, 1), idx(1, 0, 1), idx(1, 1, 1), idx(0, 1, 1)),  # +z front
        (idx(0, 0, 0), idx(0, 1, 0), idx(1, 1, 0), idx(1, 0, 0)),  # -z back
        (idx(1, 0, 0), idx(1, 1, 0), idx(1, 1, 1), idx(1, 0, 1)),  # +x
        (idx(0, 0, 0), idx(0, 0, 1), idx(0, 1, 1), idx(0, 1, 0)),  # -x
        (idx(0, 1, 0), idx(0, 1, 1), idx(1, 1, 1), idx(1, 1, 0)),  # +y
        (idx(0, 0, 0), idx(1, 0, 0), idx(1, 0, 1), idx(0, 0, 1)),  # -y
    ]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    for m in mats:
        me.materials.append(m)
    me.polygons[0].material_index = 0
    me.polygons[1].material_index = 1
    for p in me.polygons[2:]:
        p.material_index = 2
    uv = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            u = v.x / w
            if poly.index == 1 and back_uv_mirror:
                u = 1 - u
            uv.data[li].uv = (u, (v.y + h / 2) / h)
    obj = new_object(name, me, parent)
    bev = obj.modifiers.new("Bevel", "BEVEL")
    bev.width = min(0.0045, d * 0.3)
    bev.segments = 3
    bev.limit_method = "ANGLE"
    for p in me.polygons:
        p.use_smooth = True
    return obj


class Stack:
    """A curved stack of paper: lattice of nx x ny columns with a bottom and a top layer."""

    def __init__(self, name, width, height, depth, printed_mat, edge_mat, parent, face=+1, u_mirror=False, nx=72, ny=14):
        self.width, self.height, self.depth, self.face = width, height, depth, face
        self.nx, self.ny = nx, ny
        xs = np.linspace(0, width, nx)
        ys = np.linspace(-height / 2, height / 2, ny)
        self.X, self.Y = np.meshgrid(xs, ys, indexing="ij")
        verts, faces = [], []
        for layer in (0, 1):
            for i in range(nx):
                for j in range(ny):
                    verts.append((xs[i], ys[j], 0.0))
        vid = lambda layer, i, j: layer * nx * ny + i * ny + j
        top, bot = (1, 0)
        printed_faces = []
        for i in range(nx - 1):
            for j in range(ny - 1):
                a, b, c, d = vid(top, i, j), vid(top, i + 1, j), vid(top, i + 1, j + 1), vid(top, i, j + 1)
                faces.append((a, b, c, d) if face > 0 else (a, d, c, b)); printed_faces.append(len(faces) - 1)
                a, b, c, d = vid(bot, i, j), vid(bot, i, j + 1), vid(bot, i + 1, j + 1), vid(bot, i + 1, j)
                faces.append((a, b, c, d) if face > 0 else (a, d, c, b))
        for i in range(nx - 1):  # long sides (y = +-h/2)
            for j, flip in ((0, False), (ny - 1, True)):
                q = (vid(bot, i, j), vid(bot, i + 1, j), vid(top, i + 1, j), vid(top, i, j))
                faces.append(tuple(reversed(q)) if (flip ^ (face < 0)) else q)
        for j in range(ny - 1):  # spine and fore-edge ends
            for i, flip in ((0, True), (nx - 1, False)):
                q = (vid(bot, i, j), vid(bot, i, j + 1), vid(top, i, j + 1), vid(top, i, j))
                faces.append(q if (flip ^ (face < 0)) else tuple(reversed(q)))
        me = bpy.data.meshes.new(name)
        me.from_pydata(verts, [], faces)
        me.materials.append(printed_mat)
        me.materials.append(edge_mat)
        printed = set(printed_faces)
        for p in me.polygons:
            p.material_index = 0 if p.index in printed else 1
            p.use_smooth = True
        uv = me.uv_layers.new(name="UVMap")
        for poly in me.polygons:
            for li in poly.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co
                u = co.x / width
                uv.data[li].uv = (1 - u if u_mirror else u, (co.y + height / 2) / height)
        layer_attr = me.attributes.new("layer", "FLOAT", "POINT")
        layer_attr.data.foreach_set("value", np.array([0.0] * (nx * ny) + [1.0] * (nx * ny), dtype=np.float32))
        self.mesh = me
        self.obj = new_object(name, me, parent)
        self.update(0.0)

    def update(self, bloom, gutter_lift=0.0):
        c = page_curve(self.X, self.width) * bloom
        # first sheets pulled up at the gutter by the cover's joint
        c = c + gutter_lift * np.exp(-self.X / 0.05)
        top = self.face * (self.depth + c)
        bot = self.face * 0.35 * c
        co = np.zeros((2, self.nx, self.ny, 3), dtype=np.float32)
        co[..., 0] = self.X
        co[..., 1] = self.Y
        co[0, ..., 2] = bot
        co[1, ..., 2] = top
        self.mesh.vertices.foreach_set("co", co.reshape(-1))
        self.mesh.update()


class Band:
    """Cloth joint between the spine and the cover's hinge edge, rebuilt every frame."""

    def __init__(self, name, mat, parent, segs=10, ny=2):
        self.segs = segs
        verts = [(0, y, 0) for i in range(segs + 1) for y in (-H / 2, H / 2)]
        faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(segs)]
        me = bpy.data.meshes.new(name)
        me.from_pydata(verts, [], faces)
        me.materials.append(mat)
        for p in me.polygons:
            p.use_smooth = True
        self.mesh = me
        self.obj = new_object(name, me, parent)
        sol = self.obj.modifiers.new("Solidify", "SOLIDIFY")
        sol.thickness = 0.004

    def update(self, p0, t0, p1, t1):
        """Cubic Bezier cross-section (in the x-z plane) from p0 (tangent t0) to p1 (tangent t1)."""
        p0, t0, p1, t1 = map(np.array, (p0, t0, p1, t1))
        L = np.linalg.norm(p1 - p0) * 0.45
        c0, c1 = p0 + t0 * L, p1 - t1 * L
        co = []
        for i in range(self.segs + 1):
            s = i / self.segs
            pt = (1 - s) ** 3 * p0 + 3 * (1 - s) ** 2 * s * c0 + 3 * (1 - s) * s ** 2 * c1 + s ** 3 * p1
            for y in (-H / 2, H / 2):
                co.extend((pt[0], y, pt[1]))
        self.mesh.vertices.foreach_set("co", np.array(co, dtype=np.float32))
        self.mesh.update()


def spine_mesh(name, mat, parent):
    r = (T + TC) / 2
    segs = 18
    verts = []
    for i in range(segs + 1):
        a = math.pi / 2 + math.pi * i / segs   # from top (z = 2r) around the spine side to bottom
        x, z = r * math.cos(a), r + r * math.sin(a)
        verts += [(x, -H / 2, z), (x, H / 2, z)]
    faces = [(2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1) for i in range(segs)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    obj = new_object(name, me, parent)
    sol = obj.modifiers.new("Solidify", "SOLIDIFY")
    sol.thickness = 0.005
    return obj


# ----------------------------------------------------------------------------
# choreography
# ----------------------------------------------------------------------------

P0 = np.array(FIT["p0"])
q = FIT["q0"]
Q0 = Quaternion((q[3], q[0], q[1], q[2]))
Q_END = Quaternion((1, 0, 0), -0.06)   # upright, top leaning back slightly
BETA0 = FIT["beta0"]
THETA_PEAK = math.radians(176)
THETA_END = math.radians(168)

D0 = float(np.linalg.norm(P0))
DIR0 = -P0 / D0
AZ0 = math.atan2(DIR0[0], DIR0[2])
EL0 = math.asin(DIR0[1])
START_PX = (CX + F * P0[0] / -P0[2], CY - F * P0[1] / -P0[2])
D_END = 2 * W * F * math.cos(0.30) / END_WIDTH


def aim_point(theta):
    return np.array([(min(0.0, W * math.cos(theta)) + W) / 2, 0.0, 0.0])


_a0 = P0 + np.array(Q0.to_matrix()) @ aim_point(BETA0)
AIM_START_PX = (CX + F * _a0[0] / -_a0[2], CY - F * _a0[1] / -_a0[2])


def cover_angle(u):
    if u < 0.74:
        return BETA0 + (THETA_PEAK - BETA0) * smoother(span(u, 0.05, 0.74))
    return THETA_PEAK + (THETA_END - THETA_PEAK) * smooth(span(u, 0.74, 0.9))


def pose(u):
    theta = cover_angle(u)
    turn = smoother(span(u, 0.06, 0.82))
    book_q = Q0.slerp(Q_END, turn)
    book_p = P0 + np.array([0.0, 0.03 * math.sin(math.pi * span(u, 0.05, 0.88)), 0.0])
    travel = smoother(span(u, 0.06, 0.78))
    approach = 0.3 * math.sin(math.pi * span(u, 0.0, 0.56)) * (1 - travel)
    d = D0 + (D_END - D0) * travel - approach
    az = AZ0 - 0.30 * travel
    el = EL0 + 0.15 * travel
    direction = np.array([math.sin(az) * math.cos(el), math.sin(el), math.cos(az) * math.cos(el)])
    cam_p = book_p + d * direction
    # frame the book's visual centre: the middle of the closed book, the spine once open
    a = smoother(span(u, 0.05, 0.8))
    target = book_p + np.array(book_q.to_matrix()) @ aim_point(theta)
    px = (AIM_START_PX[0] + (END_PX[0] - AIM_START_PX[0]) * a, AIM_START_PX[1] + (END_PX[1] - AIM_START_PX[1]) * a)
    cam_r = aim(cam_p, target, px)
    return dict(theta=theta, book_q=book_q, book_p=book_p, cam_p=cam_p, cam_r=cam_r)


# ----------------------------------------------------------------------------
# phase B: the open menu turns to face the viewer and comes slightly closer.
# It ends square to the camera with the whole spread in view; from there the
# website lifts the right-hand page off the book and turns it into the phone.
# ----------------------------------------------------------------------------

NB_FRAMES = 48
SPINE_PX = (1176.0, 476.0)      # where the spine's centre ends up in the mockup frame
PAGE_H = 388.0                  # page height on screen at the end, mockup-frame pixels


def page_shape(theta):
    bloom = 0.1 + 0.9 * smooth(span(theta, math.radians(70), math.radians(166)))
    lift = 0.006 * math.sin(math.pi * span(theta, math.radians(85), math.radians(176)))
    return bloom, lift


def page_point(u, v, bloom, lift):
    """A point on the right-hand page's printed surface (u from the spine, v from the top), rig space."""
    bw, bh = W - OV, H - 2 * OV
    x = u * bw
    y = (0.5 - v) * bh
    top = (TP - 0.003) + float(page_curve(np.array(x), bw)) * bloom + lift * math.exp(-x / 0.05)
    return np.array([x, y, -T + TB + 0.0015 + top])


def end_camera():
    """Square-on camera that puts the spine at SPINE_PX with the page PAGE_H pixels tall."""
    a = pose(1.0)
    bloom, lift = page_shape(THETA_END)
    spine = a["book_p"] + page_point(0.0, 0.5, bloom, lift)
    mid = a["book_p"] + page_point(0.5, 0.5, bloom, lift)
    d = (H - 2 * OV) * F / PAGE_H
    cam_z = mid[2] + d
    depth = cam_z - spine[2]
    return np.array([spine[0] - (SPINE_PX[0] - CX) / F * depth, spine[1] + (SPINE_PX[1] - CY) / F * depth, cam_z])


def pose_b(s):
    """s in (0, 1]: the open menu turns square to the viewer while the camera eases in."""
    a = pose(1.0)
    bloom, lift = page_shape(THETA_END)
    turn = smoother(span(s, 0.0, 1.0))
    book_q = a["book_q"].slerp(Quaternion(), turn)
    book_p = a["book_p"]
    spine = book_p + np.array(book_q.to_matrix()) @ page_point(0.0, 0.5, bloom, lift)
    move = smoother(span(s, 0.0, 1.0))
    cam_p = a["cam_p"] + (end_camera() - a["cam_p"]) * move
    # the spine travels on a smooth screen path from where it sits on the open spread
    c0 = (a["book_p"] + np.array(a["book_q"].to_matrix()) @ page_point(0.0, 0.5, bloom, lift) - a["cam_p"]) @ a["cam_r"]
    start_px = (CX + F * c0[0] / -c0[2], CY - F * c0[1] / -c0[2])
    px = (start_px[0] + (SPINE_PX[0] - start_px[0]) * move, start_px[1] + (SPINE_PX[1] - start_px[1]) * move)
    cam_r = aim(cam_p, spine, px)
    return dict(theta=THETA_END, book_q=book_q, book_p=book_p, cam_p=cam_p, cam_r=cam_r)


def page_layout():
    """Projected right-hand page at the end of phase B, for the website (mockup-frame pixels)."""
    st = pose_b(1.0)
    bloom, lift = page_shape(THETA_END)
    R = np.array(st["book_q"].to_matrix())
    out = {}
    for name, (u, v) in dict(tl=(0, 0), tr=(1, 0), br=(1, 1), bl=(0, 1), mid=(0.5, 0.5)).items():
        p = (st["book_p"] + R @ page_point(u, v, bloom, lift) - st["cam_p"]) @ st["cam_r"]
        out[name] = (round(CX + F * p[0] / -p[2], 2), round(CY - F * p[1] / -p[2], 2))
    return out


def aim(cam_p, target, px):
    """Roll-free camera rotation Ry(yaw) Rx(pitch) that puts `target` at pixel `px`."""
    dc = np.array([(px[0] - CX) / F, -(px[1] - CY) / F, -1.0])
    dc /= np.linalg.norm(dc)
    w = (target - cam_p) / np.linalg.norm(target - cam_p)
    A, B = dc[1], -dc[2]
    R = math.hypot(A, B)
    base = math.atan2(B, A)
    pitch = base - math.acos(max(-1, min(1, w[1] / R)))
    if abs(pitch) > abs(base + math.acos(max(-1, min(1, w[1] / R)))):
        pitch = base + math.acos(max(-1, min(1, w[1] / R)))
    v = rx(pitch) @ dc
    yaw = math.atan2(w[0], w[2]) - math.atan2(v[0], v[2])
    return ry(yaw) @ rx(pitch)


# ----------------------------------------------------------------------------
# scene
# ----------------------------------------------------------------------------

def build(scale, samples, exposure, blank=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 6
    sc.render.film_transparent = True
    sc.render.resolution_x = int(round(VIEW[2] * scale))
    sc.render.resolution_y = int(round(VIEW[3] * scale))
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.exposure = exposure

    world = bpy.data.worlds.new("Studio")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.93, 0.89, 0.83, 1)
    bg.inputs["Strength"].default_value = 0.34

    # camera that reproduces the photo's lens, including its off-centre principal point
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.sensor_fit = "VERTICAL"
    cam_data.sensor_height = 24.0
    cam_data.lens = cam_data.sensor_height / (2 * (VIEW[3] / 2) / F)
    # with a vertical sensor fit, lens shift is measured in units of the image height
    cam_data.shift_x = ((VIEW[2] / 2) - (CX - VIEW[0])) / VIEW[3]
    cam_data.shift_y = ((CY - VIEW[1]) - VIEW[3] / 2) / VIEW[3]
    cam_data.clip_start, cam_data.clip_end = 0.5, 80
    cam = new_object("Camera", cam_data)
    sc.camera = cam

    def area(name, loc, size, energy, color=(1, 0.97, 0.92)):
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape = "DISK"
        ld.size = size
        ld.energy = energy
        ld.color = color
        lo = new_object(name, ld)
        lo.location = Vector(loc)
        target = Vector(P0)
        lo.rotation_mode = "QUATERNION"
        lo.rotation_quaternion = (target - lo.location).to_track_quat("-Z", "Y")
        return lo

    c = P0
    area("Key", (c[0] - 3.4, c[1] + 3.6, c[2] + 3.4), 3.0, 330, (1.0, 0.95, 0.88))
    area("Fill", (c[0] + 3.6, c[1] + 0.4, c[2] + 4.2), 4.5, 45, (0.96, 0.97, 1.0))
    area("Rim", (c[0] + 2.6, c[1] + 2.4, c[2] - 2.2), 1.6, 70)

    # invisible table that only catches the menu's shadow, composited onto the CSS backdrop
    def catcher(name, verts):
        me = bpy.data.meshes.new(name)
        me.from_pydata(verts, [], [(0, 1, 2, 3)])
        o = new_object(name, me)
        o.is_shadow_catcher = True
        # catch the menu's shadows only; never shade each other
        o.visible_shadow = False
        o.visible_diffuse = False
        o.visible_glossy = False
        o.visible_transmission = False
        o.visible_volume_scatter = False
        return o

    ty = -0.66
    catcher("Table", [(-20, ty, 6), (20, ty, 6), (20, ty, -40), (-20, ty, -40)])

    gain = 1.0
    linen = linen_material("Linen", gain=gain)
    linen_dark = linen_material("LinenEdge", tint=(0.92, 0.9, 0.87), gain=gain)
    cover_mat = printed_material("CoverPrint", "cover-front.webp", 0.88, cloth_bump=True, roughness=0.8)
    mains = printed_material("Mains", "page-mains-blank.webp" if blank else "page-mains.webp", 1.08)
    starters = printed_material("Starters", "page-starters.webp", 1.08)
    endpaper = linen_material("Turnin", tint=(0.97, 0.95, 0.92))
    edges = paper_edge_material("PageEdges", sheets=34, gain=1.0)
    insert_edges = paper_edge_material("InsertEdges", sheets=6, gain=1.02)

    rig = bpy.data.objects.new("Rig", None)
    sc.collection.objects.link(rig)
    model = bpy.data.objects.new("Model", None)
    sc.collection.objects.link(model)
    model.parent = rig
    model.location = (0, 0, -T)

    board("BackBoard", W, H, TB, (linen, linen, linen_dark), model)
    block = Stack("PageBlock", W - OV, H - 2 * OV, TP - 0.003, mains, edges, model, face=+1)
    block.obj.location = (0.0, 0.0, TB + 0.0015)
    spine_mesh("Spine", linen_dark, model)
    band = Band("Joint", linen_dark, model)

    hinge = bpy.data.objects.new("Hinge", None)
    sc.collection.objects.link(hinge)
    hinge.parent = model
    hinge.location = (0, 0, T)
    board("Cover", W, H, TC, (cover_mat, endpaper, linen_dark), hinge)
    insert = Stack("Insert", W - OV - 0.006, H - 2 * OV - 0.004, TL, starters, insert_edges, hinge, face=-1, u_mirror=True, nx=48, ny=10)
    insert.obj.location = (0.006, 0.0, -0.0006)

    return dict(scene=sc, cam=cam, rig=rig, hinge=hinge, block=block, insert=insert, band=band)


def apply(objs, u, phase="a"):
    st = pose(u) if phase == "a" else pose_b(u)
    rig, hinge, cam = objs["rig"], objs["hinge"], objs["cam"]
    rig.matrix_world = to_matrix(np.array(st["book_q"].to_matrix()), st["book_p"])
    cam.matrix_world = to_matrix(st["cam_r"], st["cam_p"])
    th = st["theta"]
    hinge.rotation_mode = "XYZ"
    hinge.rotation_euler = (0, -th, 0)

    # pages: pressed flat while the cover is near closed, bloom as it opens
    bloom, lift = page_shape(th)
    objs["block"].update(bloom, gutter_lift=lift)
    objs["insert"].update(0.35 * bloom)

    # cloth joint: from the spine's top edge to the cover's outer hinge edge (model space x-z)
    spine_top = (0.0, T + TC)
    edge = (-TC * math.sin(th), T + TC * math.cos(th))
    cover_dir = (math.cos(th), math.sin(th))
    objs["band"].update(spine_top, (1.0, 0.0), edge, cover_dir)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--scale", type=float, default=1.25)
    ap.add_argument("--samples", type=int, default=48)
    ap.add_argument("--exposure", type=float, default=0.0)
    ap.add_argument("--frames", default="all")
    ap.add_argument("--skip-existing", action="store_true")
    ap.add_argument("--phase", default="a", choices=["a", "b"])
    ap.add_argument("--blank", action="store_true", help="right-hand page without print (the page the website lifts off)")
    ap.add_argument("--layout", action="store_true", help="print the projected page at the end of phase B and exit")
    a, _ = ap.parse_known_args()
    if a.layout:
        print(json.dumps(page_layout()))
        return
    os.makedirs(a.out, exist_ok=True)
    objs = build(a.scale, a.samples, a.exposure, a.blank)
    count = N_FRAMES if a.phase == "a" else NB_FRAMES
    frames = range(count) if a.frames == "all" else [int(f) for f in a.frames.split(",")]
    for i in frames:
        path = os.path.join(a.out, f"{i:04d}.png")
        if a.skip_existing and os.path.exists(path):
            continue
        # phase B starts one step after the last opening frame
        apply(objs, i / (N_FRAMES - 1) if a.phase == "a" else (i + 1) / NB_FRAMES, a.phase)
        objs["scene"].render.filepath = path
        bpy.ops.render.render(write_still=True)
        print("frame", i, flush=True)


if __name__ == "__main__":
    main()
