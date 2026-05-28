import bpy
import os
import math

BASE_DIR = r"C:\kproject\storyworld\models"
OUTPUT_FILE = r"C:\kproject\storyworld\final_world.fbx"

bpy.ops.wm.read_factory_settings(use_empty=True)

# ----------------------------
# STEP 1: LOAD TEXTURES
# ----------------------------
texture_db = {}

for f in os.listdir(BASE_DIR):
    if f.endswith(".png"):
        key = f.split("_")[0].lower()
        texture_db.setdefault(key, []).append(os.path.join(BASE_DIR, f))

print("Texture DB:", texture_db)

# ----------------------------
# STEP 2: SMART MATERIAL BUILDER
# ----------------------------
def build_material(name, texs):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    def add_img(path, target, non_color=False):
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(path)

        if non_color:
            tex.image.colorspace_settings.name = "Non-Color"

        links.new(tex.outputs["Color"], target)

    for t in texs:
        low = t.lower()

        if "albedo" in low or "base" in low:
            add_img(t, bsdf.inputs["Base Color"])

        elif "roughness" in low:
            add_img(t, bsdf.inputs["Roughness"], True)

        elif "metal" in low:
            add_img(t, bsdf.inputs["Metallic"], True)

        elif "normal" in low:
            tex = nodes.new("ShaderNodeTexImage")
            tex.image = bpy.data.images.load(t)
            tex.image.colorspace_settings.name = "Non-Color"

            norm = nodes.new("ShaderNodeNormalMap")
            links.new(tex.outputs["Color"], norm.inputs["Color"])
            links.new(norm.outputs["Normal"], bsdf.inputs["Normal"])

    return mat

# ----------------------------
# STEP 3: IMPORT + AUTO UV FIX
# ----------------------------
objects = []

for f in os.listdir(BASE_DIR):
    if f.endswith(".obj"):
        path = os.path.join(BASE_DIR, f)
        print("Importing:", f)

        bpy.ops.wm.obj_import(filepath=path)

        obj = bpy.context.selected_objects[0]

        # Fix orientation (important for your case)
        obj.rotation_euler[0] = math.radians(90)

        # ----------------------------
        # AUTO UV RECONSTRUCTION (KEY FIX)
        # ----------------------------
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')

        # Smart UV unwrap (Blender "AI-like" unwrap)
        bpy.ops.uv.smart_project(angle_limit=66)

        bpy.ops.object.mode_set(mode='OBJECT')

        obj.select_set(False)

        objects.append(obj)

# ----------------------------
# STEP 4: SMART MATERIAL ASSIGNMENT
# ----------------------------
for obj in objects:
    name = obj.name.lower()

    matched = False

    for key, texs in texture_db.items():
        if key in name and texs:
            mat = build_material(key, texs)

            obj.data.materials.clear()
            obj.data.materials.append(mat)

            matched = True
            break

    # fallback material (prevents black objects)
    if not matched:
        mat = bpy.data.materials.new("fallback")
        mat.use_nodes = True
        obj.data.materials.clear()
        obj.data.materials.append(mat)

# ----------------------------
# STEP 5: APPLY TRANSFORMS
# ----------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ----------------------------
# STEP 6: EXPORT FBX
# ----------------------------
bpy.ops.export_scene.fbx(
    filepath=OUTPUT_FILE,
    use_selection=False,
    axis_forward='-Z',
    axis_up='Y',
    apply_unit_scale=True,
    bake_space_transform=True,
    object_types={'MESH'}
)

print("DONE ->", OUTPUT_FILE)