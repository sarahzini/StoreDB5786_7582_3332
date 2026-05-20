"""
sql_to_graphviz.py
------------------
DIRECTLY reads a .sql file (e.g., createTables.sql)
and generates a perfect ERDPlus (Chen) diagram with cardinalities,
optional attributes (O), and automatic weak entities.
THEN automatically downloads the diagram as a PNG image using a public API.

USAGE:
  python sql_to_graphviz.py "Stage 3/createTables.sql"
  python sql_to_graphviz.py "Stage 3/createTables.sql" --image "Stage 3/my_schema.png"
"""

import sys
import math
import argparse
import urllib.request
import json
import re

# ---------------------------------------------------------------------------
# 1. DIRECT SQL PARSER
# ---------------------------------------------------------------------------

def parse_sql(sql_text: str) -> list[dict]:
    # Clean up SQL comments (-- and /* */) to avoid parsing errors
    sql_text = re.sub(r'--.*', '', sql_text)
    sql_text = re.sub(r'/\*.*?\*/', '', sql_text, flags=re.DOTALL)
    
    tables = {}
    
    # Find all CREATE TABLE blocks
    table_pattern = re.compile(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\((.*?)\);', re.IGNORECASE | re.DOTALL)
    
    for match in table_pattern.finditer(sql_text):
        table_name = match.group(1).upper()
        body = match.group(2)
        
        tables[table_name] = {
            "name": table_name,
            "weak": False,
            "pks": [],
            "attrs": [],
            "fks": [],
            "rels": []
        }
        
        # --- A. Extract Primary Key constraints (PRIMARY KEY) ---
        pk_match = re.search(r'PRIMARY\s+KEY\s*\((.*?)\)', body, re.IGNORECASE)
        if pk_match:
            tables[table_name]["pks"] = [k.strip().upper() for k in pk_match.group(1).split(',')]
            
        # --- B. Extract Foreign Key constraints (FOREIGN KEY) ---
        fk_pattern = re.compile(r'FOREIGN\s+KEY\s*\((.*?)\)\s*REFERENCES\s+(\w+)', re.IGNORECASE)
        for fk_match in fk_pattern.finditer(body):
            fk_cols = [k.strip().upper() for k in fk_match.group(1).split(',')]
            target_table = fk_match.group(2).upper()
            
            tables[table_name]["fks"].extend(fk_cols)
            
            # If the FK is part of the PK -> It's an identifying relationship (Weak Entity)
            is_identifying = any(fk_col in tables[table_name]["pks"] for fk_col in fk_cols)
            if is_identifying:
                tables[table_name]["weak"] = True
                
            tables[table_name]["rels"].append({
                "label": f"Linked to {target_table.lower()}",
                "target": target_table,
                "card_src": "N",
                "card_tgt": "1"
            })

        # --- C. Parse normal columns ---
        lines = [line.strip() for line in body.split('\n')]
        for line in lines:
            line = line.rstrip(',')
            # Skip empty lines or constraint definitions
            if not line or line.upper().startswith(('PRIMARY', 'FOREIGN', 'CONSTRAINT', 'UNIQUE', 'CHECK')):
                continue
            
            parts = line.split()
            if len(parts) >= 2:
                col_name = parts[0].upper()
                
                # If PK is defined on the same line (inline constraint)
                if "PRIMARY KEY" in line.upper():
                    if col_name not in tables[table_name]["pks"]:
                        tables[table_name]["pks"].append(col_name)
                    continue
                
                # Ignore if it's already listed in PK or FK lists
                if col_name in tables[table_name]["pks"] or col_name in tables[table_name]["fks"]:
                    continue
                
                # Detect optionality (O) if NOT NULL is missing
                is_optional = "NOT NULL" not in line.upper()
                
                tables[table_name]["attrs"].append({
                    "name": col_name.lower(),
                    "optional": is_optional
                })

    return list(tables.values())


# ---------------------------------------------------------------------------
# 2. GEOMETRIC LAYOUT
# ---------------------------------------------------------------------------

def entity_grid_positions(entities: list[dict], gap_x: float = 6.0, gap_y: float = 6.5) -> dict:
    # Balanced 3-column grid to prevent horizontal stretching
    cols = 3
    positions = {}
    for i, e in enumerate(entities):
        col = i % cols
        row = i // cols
        positions[e["name"].upper()] = (col * gap_x, -(row * gap_y))
    return positions

def crown_positions(cx: float, cy: float, count: int, radius: float = 1.65) -> list[tuple]:
    """Places `count` attributes in a tight circular crown around (cx, cy)."""
    if count == 0: return []
    return [
        (cx + radius * math.cos((2 * math.pi * i / count) - math.pi / 2),
         cy + radius * math.sin((2 * math.pi * i / count) - math.pi / 2))
        for i in range(count)
    ]

# ---------------------------------------------------------------------------
# 3. DOT GENERATION (Graphviz)
# ---------------------------------------------------------------------------

def safe_id(name: str) -> str:
    """Removes invalid characters for Graphviz node IDs."""
    return re.sub(r'\W', '_', name).upper()

def generate_dot(entities: list[dict]) -> str:
    ent_pos = entity_grid_positions(entities)
    lines = [
        "graph ER {",
        "  graph [",
        "    layout=neato",
        "    overlap=false",
        '    sep="+0.9"',
        '    esep="+0.4"',
        "    splines=true",
        "    outputorder=edgesfirst",
        '    bgcolor="white"',
        "  ]",
        '  node [fontname="Helvetica" fontsize=11 style=filled fillcolor=white]',
        '  edge [fontname="Helvetica" fontsize=11 fontcolor="#0055ff"]', # Blue color for cardinalities
        "",
    ]

    seen_rels = set()
    diamonds = []

    for e in entities:
        key = e["name"].upper()
        cx, cy = ent_pos.get(key, (0.0, 0.0))
        eid = "E_" + safe_id(e["name"])
        periphs = 2 if e["weak"] else 1

        lines.append(f"  // === {e['name']} ===")
        lines.append(
            f'  {eid} [label="{e["name"]}" shape=box peripheries={periphs} '
            f'pos="{cx:.2f},{cy:.2f}!" width=1.4 height=0.6 pin=true]'
        )

        # Merge PKs and standard Attributes for the crown layout
        all_attrs = [{"name": p.lower(), "pk": True, "optional": False} for p in e["pks"]] + \
                    [{"name": a["name"], "pk": False, "optional": a["optional"]} for a in e["attrs"]]
        
        crown = crown_positions(cx, cy, len(all_attrs))

        for i, a in enumerate(all_attrs):
            aid = f"{eid}_A{i}"
            label_name = a["name"]
            
            # Visual styling: Underlined PK, Dashed if Optional
            if a["pk"]:
                dot_label = f"<<U>&nbsp;{label_name}&nbsp;</U>>"
                attr_style = "solid"
            else:
                label_display = f"{label_name} (O)" if a["optional"] else label_name
                dot_label = f'"{label_display}"'
                attr_style = "dashed" if a["optional"] else "solid"
                
            ax, ay = crown[i]
            lines.append(
                f'  {aid} [label={dot_label} shape=ellipse style={attr_style} '
                f'pos="{ax:.2f},{ay:.2f}!" width=0.9 height=0.38 pin=true]'
            )
            lines.append(f"  {eid} -- {aid} [len=0.65 weight=10 fontcolor=black label=\"\"]")

        # Process relationships and calculate midpoints for the diamonds
        for rel in e["rels"]:
            t_key = rel["target"].upper()
            t_eid = "E_" + safe_id(rel["target"])
            rel_key = "__".join(sorted([key, t_key])) + "__" + rel["label"].upper()

            if rel_key not in seen_rels:
                seen_rels.add(rel_key)
                tx, ty = ent_pos.get(t_key, (cx + 3.0, cy))
                mx, my = (cx + tx) / 2, (cy + ty) / 2
                did = f"D_{len(diamonds)}"
                diamonds.append({
                    "did":         did,
                    "label":       rel["label"],
                    "mx":          mx,
                    "my":          my,
                    "from":        eid,
                    "to":          t_eid,
                    "card_src":    rel["card_src"],
                    "card_tgt":    rel["card_tgt"],
                    "peripheries": 2 if e["weak"] else 1,
                })
        lines.append("")

    lines.append("  // === Relationships ===")
    for d in diamonds:
        lines.append(
            f'  {d["did"]} [label="{d["label"]}" shape=diamond fontcolor=black '
            f'peripheries={d["peripheries"]} style=filled fillcolor=white '
            f'pos="{d["mx"]:.2f},{d["my"]:.2f}!" width=1.3 height=0.6 pin=true]'
        )
        lines.append(f'  {d["from"]} -- {d["did"]} [label="  {d["card_src"]}  " weight=1 len=1.6]')
        lines.append(f'  {d["did"]} -- {d["to"]} [label="  {d["card_tgt"]}  " weight=1 len=1.6]')

    lines.append("}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 4. EXECUTION & DOWNLOAD
# ---------------------------------------------------------------------------

def download_image(dot_code: str, output_file: str):
    """Sends the DOT code to a public Graphviz API and saves the resulting PNG."""
    print(f"\n-> Downloading image via public API...")
    url = "https://quickchart.io/graphviz"
    
    payload = json.dumps({
        "graph": dot_code,
        "engine": "neato",
        "format": "png"
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            with open(output_file, 'wb') as out_file:
                out_file.write(response.read())
        print(f"✓ SUCCESS! The diagram image has been saved here: {output_file}\n")
    except Exception as e:
        print(f"❌ Error downloading the image: {e}\n")

def main():
    parser = argparse.ArgumentParser(description="Generates an ERD directly from an SQL file.")
    parser.add_argument("input", help="The source SQL file (e.g., createTables.sql)")
    parser.add_argument("--save", metavar="FILE.dot", help="Save the generated DOT code locally")
    parser.add_argument("--image", metavar="FILE.png", default="Stage 3/schema.png", help="The path to save the generated PNG image")
    args = parser.parse_args()

    try:
        with open(args.input, encoding="utf-8") as f:
            sql_text = f.read()
    except FileNotFoundError:
        print(f"Error: file not found -> {args.input}")
        sys.exit(1)

    entities = parse_sql(sql_text)
    if not entities:
        print("Error: no tables found in the SQL file. Please check the SQL syntax.")
        sys.exit(1)

    print(f"✓ {len(entities)} tables detected: {', '.join(e['name'] for e in entities)}")

    dot = generate_dot(entities)

    if args.save:
        with open(args.save, "w", encoding="utf-8") as f:
            f.write(dot)
        print(f"✓ DOT file successfully saved -> {args.save}")

    # Generate and download the image
    download_image(dot, args.image)

if __name__ == "__main__":
    main()