#!/usr/bin/env python3
"""Génère src/icons.js : les icônes du jeu en WebP intégrées (data URI), car la page ne peut charger
aucune image externe.

Source : les textures de l'interface publiées par Gethe/wow-ui-textures. Un clone sans contenu suffit,
le script ne récupère que les fichiers utiles :

    git clone --depth 1 --filter=blob:none --no-checkout https://github.com/Gethe/wow-ui-textures ../wow-ui-textures
    python3 scripts/import-icons.py ../wow-ui-textures

Icônes reprises : celles des objets de src/itemdb.js (champ « ic »), celles des talents de
src/talenttrees.js, les emplacements vides de la fiche de personnage et le fond des trois arbres.
Nécessite Pillow.
"""

import base64
import io
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ICON_SIZE = 48
FALLBACK = 'inv_misc_questionmark'

# Emplacement du sim → texture d'emplacement vide du jeu.
SLOT_TEXTURES = {
    'head': 'Head', 'neck': 'Neck', 'shoulders': 'Shoulder', 'back': 'Chest', 'chest': 'Chest',
    'wrists': 'Wrists', 'hands': 'Hands', 'waist': 'Waist', 'legs': 'Legs', 'feet': 'Feet',
    'finger1': 'Finger', 'finger2': 'RFinger', 'trinket1': 'Trinket', 'trinket2': 'Trinket',
    'mainHand': 'MainHand', 'offHand': 'SecondaryHand', 'ranged': 'Ranged',
}
TREES = {'bm': 'HunterBeastMastery', 'mm': 'HunterMarksmanship', 'sv': 'HunterSurvival'}
QUADRANTS = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']


def git(repo, *args, data=None):
    return subprocess.run(['git', '-C', str(repo), *args], input=data, capture_output=True, check=True).stdout


def needed_icons():
    names = set(re.findall(r'"ic":"([^"]+)"', (ROOT / 'src/itemdb.js').read_text()))
    names |= set(re.findall(r"icon: '([^']+)'", (ROOT / 'src/talenttrees.js').read_text()))
    names.add(FALLBACK)
    return sorted(names)


def webp(img, size, quality=80):
    out = io.BytesIO()
    img.resize(size, Image.LANCZOS).save(out, 'WEBP', quality=quality, method=6)
    return base64.b64encode(out.getvalue()).decode()


def jpeg(img, quality=74):
    out = io.BytesIO()
    img.convert('RGB').save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
    return base64.b64encode(out.getvalue()).decode()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    repo = Path(sys.argv[1])
    listing = git(repo, 'ls-tree', '-r', '--name-only', 'HEAD', 'ICONS', 'PaperDoll', 'TALENTFRAME').decode().split('\n')
    by_lower = {p.lower(): p for p in listing if p}

    icons = needed_icons()
    paths = {}
    missing = []
    for name in icons:
        p = by_lower.get(f'icons/{name}.png')
        if p:
            paths[name] = p
        else:
            missing.append(name)
    slot_paths = {slot: by_lower[f'paperdoll/ui-paperdoll-slot-{tex.lower()}.png'] for slot, tex in SLOT_TEXTURES.items()}
    tree_paths = {tree: [by_lower[f'talentframe/{base.lower()}-{q.lower()}.png'] for q in QUADRANTS] for tree, base in TREES.items()}

    wanted = sorted(set(paths.values()) | set(slot_paths.values()) | {p for ps in tree_paths.values() for p in ps})
    # Récupère d'un coup les fichiers absents du clone sans contenu.
    git(repo, 'checkout', 'HEAD', '--pathspec-from-file=-', data='\n'.join(wanted).encode())

    def load(path):
        return Image.open(repo / path).convert('RGBA')

    icon_data = {}
    for name, path in paths.items():
        img = load(path)
        w, h = img.size
        m = round(w * 0.07)  # retire le cadre sombre intégré à la texture, comme le jeu
        icon_data[name] = webp(img.crop((m, m, w - m, h - m)).convert('RGB'), (ICON_SIZE, ICON_SIZE))

    slot_data = {}
    for slot, path in slot_paths.items():
        img = load(path)
        w, h = img.size
        m = round(w * 0.07)
        slot_data[slot] = webp(img.crop((m, m, w - m, h - m)).convert('RGB'), (ICON_SIZE, ICON_SIZE), 70)

    bg_data = {}
    for tree, quads in tree_paths.items():
        tl, tr, bl, br = (load(p) for p in quads)
        canvas = Image.new('RGBA', (tl.width + tr.width, tl.height + bl.height), (0, 0, 0, 255))
        canvas.paste(tl, (0, 0))
        canvas.paste(tr, (tl.width, 0))
        canvas.paste(bl, (0, tl.height))
        canvas.paste(br, (tl.width, tl.height))
        # Zone peinte de la texture (300 × 331) : au-delà, elle est noire.
        bg_data[tree] = jpeg(canvas.crop((0, 0, tl.width + 44, tl.height + 75)))

    total = sum(len(v) for v in icon_data.values()) + sum(len(v) for v in slot_data.values()) + sum(len(v) for v in bg_data.values())
    out = ROOT / 'src/icons.js'
    out.write_text(
        '// Généré par scripts/import-icons.py depuis Gethe/wow-ui-textures (textures de l’interface du jeu).\n'
        '// Ne pas modifier à la main : relancer le script après une mise à jour des objets ou des talents.\n'
        '// Icônes en WebP 48 px, fonds des arbres en JPEG, encodés en base64.\n\n'
        f'export const ICON_DATA = {json.dumps(icon_data, separators=(",", ":"))};\n\n'
        f'export const SLOT_ICON_DATA = {json.dumps(slot_data, separators=(",", ":"))};\n\n'
        f'export const TALENT_BG_DATA = {json.dumps(bg_data, separators=(",", ":"))};\n'
    )
    print(f'{len(icon_data)} icônes, {len(slot_data)} emplacements, {len(bg_data)} fonds : {total / 1024:.0f} Ko en base64 → {out}')
    if missing:
        print(f'{len(missing)} icônes introuvables (remplacées par le point d’interrogation) : {", ".join(missing[:20])}')


if __name__ == '__main__':
    main()
