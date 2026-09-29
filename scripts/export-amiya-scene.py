"""Export the missing Unity scenery, separate from the Spine illustration.

Input: a locally supplied Android bundle (see SOURCES.md).
Usage: python scripts/export-amiya-scene.py /path/to/skin.ab
Requires UnityPy 1.25.3; not a runtime dependency.
"""
import sys, pathlib, json, struct, math, zlib, shutil

ROOT = pathlib.Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/export-amiya-scene.py <skin.ab>')
bundle = pathlib.Path(sys.argv[1]).resolve(strict=True)
import UnityPy
from UnityPy.helpers.MeshHelper import MeshHandler

env = UnityPy.load(str(bundle))
objects = {o.path_id: o for o in env.objects}
trees = {i: o.read_typetree() for i, o in objects.items() if o.type.name not in ['Texture2D', 'Mesh', 'TextAsset']}
names = {i: o.read().m_Name for i, o in objects.items() if o.type.name in ['GameObject', 'Texture2D', 'Material', 'AnimationClip']}
transforms = {i: t for i, t in trees.items() if objects[i].type.name in ['Transform', 'RectTransform']}
go_transform = {t['m_GameObject']['m_PathID']: i for i, t in transforms.items()}
def vec(v, keys='xyz'): return [v[k] for k in keys]
def path(i):
    t = transforms[i]; parent = t['m_Father']['m_PathID']
    return (path(parent) + '/' if parent in transforms else '') + names[t['m_GameObject']['m_PathID']]
def active(i):
    t = transforms[i]; parent = t['m_Father']['m_PathID']
    return trees[t['m_GameObject']['m_PathID']]['m_IsActive'] and (active(parent) if parent in transforms else True)

roots = {i: names[t['m_GameObject']['m_PathID']] for i, t in transforms.items()
         if names[t['m_GameObject']['m_PathID']].endswith('(Clone)') and
         ('#13_Idle(Clone)' in path(i) or '#13_Idle_bird_' in path(i))}
root_id = next(i for i, t in transforms.items() if path(i) == 'dyn_illust_char_1037_amiya3_sale#13')
selected = {i for i in transforms if any(path(i).startswith(path(r) + '/') or i == r for r in roots)}
# Parent transforms remain part of the projection, but ignore the UI's root placement.
for i in list(selected):
    p = transforms[i]['m_Father']['m_PathID']
    while p in transforms:
        selected.add(p); p = transforms[p]['m_Father']['m_PathID']
ids = {i: n for n, i in enumerate(sorted(selected))}
nodes = []
for i in sorted(selected):
    t = transforms[i]; p = t['m_Father']['m_PathID']
    nodes.append(dict(name=names[t['m_GameObject']['m_PathID']], parent=ids.get(p, -1),
        p=vec(t['m_LocalPosition']) if i != root_id else [0,0,0],
        q=vec(t['m_LocalRotation'], 'xyzw'), s=vec(t['m_LocalScale']),
        active=bool(trees[t['m_GameObject']['m_PathID']]['m_IsActive'])))
meshes = {'quad': dict(vertices=[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]], uv=[[0,0],[1,0],[1,1],[0,1]], colors=None, indices=[0,1,2,0,2,3])}
materials, textures = {}, {}
def mesh(i):
    key = str(i)
    if key not in meshes:
        h = MeshHandler(objects[i].read()); h.process()
        colors=h.m_Colors
        if colors and max(v for c in colors for v in c)>1:colors=[[v/255 for v in c] for c in colors]
        meshes[key] = dict(vertices=h.m_Vertices, uv=h.m_UV0, colors=colors,
                           indices=[n for sub in h.get_triangles() for tri in sub for n in tri])
    return key
def material(i):
    key = str(i)
    if key in materials: return key
    t = trees[i]; props = t['m_SavedProperties']; tex = {}
    for name, v in props['m_TexEnvs']:
        tid = v['m_Texture']['m_PathID']
        if v['m_Texture']['m_FileID'] == 0 and tid in objects:
            textures[str(tid)] = names[tid] + '.png'
            tex[name] = dict(file=names[tid] + '.png', scale=vec(v['m_Scale'], 'xy'), offset=vec(v['m_Offset'], 'xy'))
    main=next((v['m_Texture']['m_PathID'] for k,v in props['m_TexEnvs'] if k=='_MainTex'),0)
    opaque=main in objects and objects[main].type.name=='Texture2D' and objects[main].read().image.getextrema()[3]==(255,255)
    materials[key] = dict(name=t['m_Name'], textures=tex, opaque=opaque, floats=dict(props['m_Floats']),
                         colors={k: vec(v, 'rgba') for k, v in props['m_Colors']})
    return key
renderers=[]
for i,t in trees.items():
    typ=objects[i].type.name
    if typ not in ['MeshRenderer','ParticleSystemRenderer']: continue
    go=t['m_GameObject']['m_PathID']; node=go_transform.get(go)
    if node not in selected or node==root_id: continue
    p=path(node)
    if '/disturb_01' in p: continue  # screen-space refraction is not portable
    if not t['m_Materials']: continue
    mat=t['m_Materials'][0]['m_PathID']
    if mat not in trees: continue
    item=dict(node=ids[node], material=material(mat), order=t['m_SortingOrder'], name=p.split('/fixed/')[-1])
    components=[v['component']['m_PathID'] for v in trees[go]['m_Component']]
    if typ=='MeshRenderer':
        mf=next((trees[c] for c in components if objects[c].type.name=='MeshFilter'),None)
        if not mf: continue
        mid=mf['m_Mesh']['m_PathID']
        if mid==10210:item['mesh']='quad'
        elif mid in objects:item['mesh']=mesh(mid)
        else:continue
    else:
        ps=next((trees[c] for c in components if objects[c].type.name=='ParticleSystem'),None)
        if not ps or not ps['EmissionModule']['enabled']: continue
        item['particles']={k:ps[k] for k in ['InitialModule','EmissionModule','ShapeModule','ColorModule','SizeModule','RotationModule','VelocityModule','UVModule'] if k in ps}
        item['particles']['duration']=ps['lengthInSec']
        item['particles']['alignment']=t.get('m_RenderAlignment',0)
        mid=t.get('m_Mesh',{}).get('m_PathID',0)
        if t.get('m_RenderMode')==4 and mid in objects:item['mesh']=mesh(mid)
    renderers.append(item)

def decode_clip(t, r):
    clip=t['m_MuscleClip']['m_Clip']['data'];stream=clip['m_StreamedClip'];raw=struct.pack('<%dI'%len(stream['data']),*stream['data'])
    curves=[[] for _ in range(stream['curveCount'])];pos=0
    while pos<len(raw):
        time,count=struct.unpack_from('<fI',raw,pos);pos+=8
        for _ in range(count):
            index,a,b,c,d=struct.unpack_from('<I4f',raw,pos);pos+=20
            if math.isfinite(time) and time>=0:curves[index].append([time,a,b,c,d])
    dense=clip['m_DenseClip']
    for j in range(dense['m_CurveCount']):
        curves.append([[dense['m_BeginTime']+k/dense['m_SampleRate'],0,0,0,dense['m_SampleArray'][k*dense['m_CurveCount']+j]] for k in range(dense['m_FrameCount'])])
    curves += [[[0,0,0,0,x]] for x in clip['m_ConstantClip']['data']]
    prefix=path(r)
    lookup={zlib.crc32((path(i)[len(prefix)+1:] if i!=r else '').encode()):ids[i] for i in selected if path(i).startswith(prefix+'/') or i==r}
    properties={zlib.crc32(k.encode())&0xfffffff:k for m in materials.values() for k in list(m['floats'])+list(m['colors'])}
    bindings=[];ci=0
    for b in t['m_ClipBindingConstant']['genericBindings']:
        count=(4 if b['attribute']==2 else 3) if b['typeID']==4 else 1
        if b['path'] in lookup and (b['typeID']==4 or b['typeID']==1):
            bindings.append(dict(node=lookup[b['path']],kind=({1:'p',2:'q',3:'s',4:'e'}.get(b['attribute']) if b['typeID']==4 else 'active'), curves=curves[ci:ci+count]))
        elif b['path'] in lookup and b['typeID'] in [23,96,199] and (b['attribute']&0xfffffff) in properties:
            bindings.append(dict(node=lookup[b['path']],kind='material',property=properties[b['attribute']&0xfffffff],component=(b['attribute']>>28)-4,curves=curves[ci:ci+1]))
        ci+=count
    return dict(duration=t['m_MuscleClip']['m_StopTime'], bindings=bindings)

animations={'Idle':[],'Interact':[]}
for r,n in roots.items():
    stem=n.replace('(Clone)','')+'_animation'
    for action,suffix in [('Idle',''),('Interact','_interact')]:
        match=next((t for i,t in trees.items() if objects[i].type.name=='AnimationClip' and t.get('m_Name')==stem+suffix),None)
        if match:animations[action].append(decode_clip(match,r))

target=ROOT/'dist/assets/amiya/scene';target.mkdir(exist_ok=True)
for tid, filename in textures.items():
    # Decode the original texture; no repainting or resampling.
    objects[int(tid)].read().image.save(target/filename)
data=dict(nodes=nodes,meshes=meshes,materials=materials,renderers=renderers,animations=animations)
(target/'scene.json').write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False,allow_nan=False),encoding='utf8')
print(f'Exported {len(renderers)} renderers, {len(meshes)} meshes, {len(textures)} textures, {sum(len(v) for v in animations.values())} clips.')
print('Canvas bounds use Unity units * 100, matching the original 0.01 Spine asset scale.')
