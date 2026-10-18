"""Convert Flybody's Apache-2.0 anatomy into a compact, articulated web asset.

MuJoCo is used ONLY to resolve mesh/body coordinates and the folded-wing pose.
The website does not run its physics or pretrained locomotion policy.
Requires mujoco==3.3.7 trimesh==4.8.3 fast-simplification==0.1.12.
"""
import json
import subprocess
from pathlib import Path
import mujoco
import numpy as np
import trimesh
from scipy.spatial.transform import Rotation

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = ROOT / 'research/upstream/flybody'
OUT = ROOT / 'frontend/dist/assets'
model = mujoco.MjModel.from_xml_path(str(UPSTREAM / 'flybody/fruitfly/assets/fruitfly.xml'))
data = mujoco.MjData(model)
for j in range(model.njnt):
    if (model.joint(j).name or '').startswith('wing_'):
        adr = model.jnt_qposadr[j]
        data.qpos[adr] = model.qpos_spring[adr]
mujoco.mj_forward(model, data)
blob = bytearray()
def buffer(array, dtype):
    a = np.asarray(array, dtype=dtype).flatten()
    offset = len(blob)
    blob.extend(a.tobytes())
    return [offset, len(a)]

nodes = []
triangles = 0
for b in range(1, model.nbody):
    parent = model.body_parentid[b]
    world = data.xmat[b].reshape(3, 3)
    parent_rot = data.xmat[parent].reshape(3, 3)
    local_rot = parent_rot.T @ world
    node = {'name': model.body(b).name, 'parent': int(parent)-1,
            'position': (parent_rot.T @ (data.xpos[b]-data.xpos[parent])).tolist(),
            'quaternion': Rotation.from_matrix(local_rot).as_quat().tolist(), 'meshes': []}
    for g in range(model.ngeom):
        if model.geom_bodyid[g] != b or model.geom_type[g] != mujoco.mjtGeom.mjGEOM_MESH or model.geom_group[g] != 1:
            continue
        m = model.geom_dataid[g]
        va, vn = model.mesh_vertadr[m], model.mesh_vertnum[m]
        fa, fn = model.mesh_faceadr[m], model.mesh_facenum[m]
        mesh = trimesh.Trimesh(model.mesh_vert[va:va+vn], model.mesh_face[fa:fa+fn], process=True)
        if fn > 1200:
            mesh = mesh.simplify_quadric_decimation(face_count=max(600, int(fn*0.16)))
        # Bake geometry into its body coordinates; keep the articulated body hierarchy.
        q = model.geom_quat[g]
        rot = Rotation.from_quat([q[1], q[2], q[3], q[0]]).as_matrix()
        vertices = mesh.vertices @ rot.T + model.geom_pos[g]
        mat = model.geom_matid[g]
        color = model.mat_rgba[mat].tolist() if mat >= 0 else model.geom_rgba[g].tolist()
        node['meshes'].append({'name': model.geom(g).name, 'position': buffer(vertices, '<f4'),
                               'index': buffer(mesh.faces, '<u4'), 'rgba': color})
        triangles += len(mesh.faces)
    nodes.append(node)
OUT.mkdir(parents=True, exist_ok=True)
(OUT/'fly.bin').write_bytes(blob)
(OUT/'fly.json').write_text(json.dumps({'source':'TuragaLab/flybody',
    'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=UPSTREAM,text=True).strip(),
    'license':'Apache-2.0', 'modifications':'Mesh simplification, coordinate conversion, folded wings. Kinematic gait added by this demo, not a trained Flybody policy.',
    'triangles':triangles,'nodes':nodes},separators=(',',':')))
print(f'Converted {len(nodes)} articulated bodies, {triangles:,} triangles, {len(blob):,} bytes')
