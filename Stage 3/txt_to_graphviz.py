"""
sql_to_graphviz.py
------------------
DIRECTLY reads a .sql file (e.g., createTables.sql)
and generates BOTH a perfect ERDPlus diagram and a DSD (Relational Schema).
THEN automatically downloads the diagrams as PNG images using a public API.
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
    sql_text = re.sub(r'--.*', '', sql_text)
    sql_text = re.sub(r'/\*.*?\*/', '', sql_text, flags=re.DOTALL)
    
    tables = {}
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
        
        pk_match = re.search(r'PRIMARY\s+KEY\s*\((.*?)\)', body, re.IGNORECASE)
        if pk_match:
            tables[table_name]["pks"] = [k.strip().upper() for k in pk_match.group(1).split(',')]
            
        fk_pattern = re.compile(r'FOREIGN\s+KEY\s*\((.*?)\)\s*REFERENCES\s+(\w+)', re.IGNORECASE)
        for fk_match in fk_pattern.finditer(body):
            fk_cols = [k.strip().upper() for k in fk_match.group(1).split(',')]
            target_table = fk_match.group(2).upper()
            
            tables[table_name]["fks"].extend(fk_cols)
            
            is_identifying = any(fk_col in tables[table_name]["pks"] for fk_col in fk_cols)
            if is_identifying:
                tables[table_name]["weak"] = True
                
            tables[table_name]["rels"].append({
                "label": f"Linked to {target_table.lower()}",
                "target": target_table,
                "card_src": "N",
                "card_tgt": "1"
            })

        lines = [line.strip() for line in body.split('\n')]
        for line in lines:
            line = line.rstrip(',')
            if not line or line.upper().startswith(('PRIMARY', 'FOREIGN', 'CONSTRAINT', 'UNIQUE', 'CHECK')):
                continue
            
            parts = line.split()
            if len(parts) >= 2:
                col_name = parts[0].upper()
                
                if "PRIMARY KEY" in line.upper():
                    if col_name not in tables[table_name]["pks"]:
                        tables[table_name]["pks"].append(col_name)
                    continue
                
                if col_name in tables[table_name]["pks"] or col_name in tables[table_name]["fks"]:
                    continue
                
                is_optional = "NOT NULL" not in line.upper()
                tables[table_name]["attrs"].append({
                    "name": col_name.lower(),
                    "optional": is_optional
                })

    return list(tables.values())

# ---------------------------------------------------------------------------
# 2. GEOMETRIC LAYOUT (For ERD)
# ---------------------------------------------------------------------------

def entity_grid_positions(entities: list[dict], gap_x: float = 6.0, gap_y: float = 6.5) -> dict:
    cols = 3
    positions = {}
    for i, e in enumerate(entities):
        col = i % cols
        row = i // cols
        positions[e["name"].upper()] = (col * gap_x, -(row * gap_y))
    return positions

def crown_positions(cx: float, cy: float, count: int, radius: float = 1.65) -> list[tuple]:
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
    return re.sub(r'\W', '_', name).upper()

def generate_erd_dot(entities: list[dict]) -> str:
    ent_pos = entity_grid_positions(entities)
    lines = [
        "graph ER {",
        "  graph [ layout=neato overlap=false sep=\"+0.9\" esep=\"+0.4\" splines=true outputorder=edgesfirst bgcolor=\"white\" ]",
        '  node [fontname="Helvetica" fontsize=11 style=filled fillcolor=white]',
        '  edge [fontname="Helvetica" fontsize=11 fontcolor="#0055ff"]',
        ""
    ]

    seen_rels = set()
    diamonds = []

    for e in entities:
        key = e["name"].upper()
        cx, cy = ent_pos.get(key, (0.0, 0.0))
        eid = "E_" + safe_id(e["name"])
        periphs = 2 if e["weak"] else 1

        lines.append(f"  // === {e['name']} ===")
        lines.append(f'  {eid} [label="{e["name"]}" shape=box peripheries={periphs} pos="{cx:.2f},{cy:.2f}!" width=1.4 height=0.6 pin=true]')

        all_attrs = [{"name": p.lower(), "pk": True, "optional": False} for p in e["pks"]] + \
                    [{"name": a["name"], "pk": False, "optional": a["optional"]} for a in e["attrs"]]
        
        crown = crown_positions(cx, cy, len(all_attrs))

        for i, a in enumerate(all_attrs):
            aid = f"{eid}_A{i}"
            label_name = a["name"]
            
            if a["pk"]:
                dot_label = f"<<U>&nbsp;{label_name}&nbsp;</U>>"
                attr_style = "solid"
            else:
                label_display = f"{label_name} (O)" if a["optional"] else label_name
                dot_label = f'"{label_display}"'
                attr_style = "dashed" if a["optional"] else "solid"
                
            ax, ay = crown[i]
            lines.append(f'  {aid} [label={dot_label} shape=ellipse style={attr_style} pos="{ax:.2f},{ay:.2f}!" width=0.9 height=0.38 pin=true]')
            lines.append(f"  {eid} -- {aid} [len=0.65 weight=10 fontcolor=black label=\"\"]")

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
                    "did": did, "label": rel["label"], "mx": mx, "my": my,
                    "from": eid, "to": t_eid, "card_src": rel["card_src"],
                    "card_tgt": rel["card_tgt"], "peripheries": 2 if e["weak"] else 1,
                })
        lines.append("")

    lines.append("  // === Relationships ===")
    for d in diamonds:
        lines.append(f'  {d["did"]} [label="{d["label"]}" shape=diamond fontcolor=black peripheries={d["peripheries"]} style=filled fillcolor=white pos="{d["mx"]:.2f},{d["my"]:.2f}!" width=1.3 height=0.6 pin=true]')
        lines.append(f'  {d["from"]} -- {d["did"]} [label="  {d["card_src"]}  " weight=1 len=1.6]')
        lines.append(f'  {d["did"]} -- {d["to"]} [label="  {d["card_tgt"]}  " weight=1 len=1.6]')

    lines.append("}")
    return "\n".join(lines)

def generate_dsd_dot(entities: list[dict]) -> str:
    """Generates the Logical Schema (DSD) exactly like ERDPlus."""
    lines = [
        "digraph DSD {",
        "  graph [ layout=dot rankdir=LR nodesep=0.7 ranksep=1.5 splines=ortho bgcolor=\"white\" ]",
        '  node [shape=none margin=0 fontname="Helvetica" fontsize=11]',
        '  edge [fontname="Helvetica" fontsize=10 color="#333333" dir=forward]',
        ""
    ]

    for e in entities:
        table_name = e["name"]
        tid = safe_id(table_name)

        # Uses <HR/> for proper ERDPlus styling instead of individual cell borders
        html = ['<<table border="1" cellborder="0" cellspacing="0" cellpadding="5">']
        html.append(f'<tr><td bgcolor="#EFEFEF"><b>{table_name}</b></td></tr>')
        html.append('<hr/>')

        col_set = set()

        # 1. Primary Keys (Above the line)
        for pk in e["pks"]:
            col_name = pk.lower()
            fk_tag = " [FK]" if pk in e["fks"] else ""
            html.append(f'<tr><td align="left" port="{safe_id(pk)}"><u>{col_name}</u>{fk_tag}</td></tr>')
            col_set.add(pk)

        # Draw the separator line below Primary Keys
        if e["pks"]:
            html.append('<hr/>')

        # 2. Foreign Keys (Not PKs)
        for fk in e["fks"]:
            if fk not in col_set:
                col_name = fk.lower()
                html.append(f'<tr><td align="left" port="{safe_id(fk)}">{col_name} [FK]</td></tr>')
                col_set.add(fk)

        # 3. Regular Attributes
        for attr in e["attrs"]:
            col_name = attr["name"].lower()
            opt_tag = " (O)" if attr["optional"] else ""
            html.append(f'<tr><td align="left" port="{safe_id(col_name)}">{col_name}{opt_tag}</td></tr>')

        html.append('</table>>')
        lines.append(f'  {tid} [label={"".join(html)}]')

    lines.append("")
    lines.append("  // === Relationships (FK to PK) ===")
    for e in entities:
        tid = safe_id(e["name"])
        for rel in e["rels"]:
            target_id = safe_id(rel["target"])
            lines.append(f'  {tid} -> {target_id}')

    lines.append("}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 4. EXECUTION & DOWNLOAD
# ---------------------------------------------------------------------------

def download_image(dot_code: str, output_file: str, engine: str = "neato"):
    print(f"-> Downloading {output_file} via API (Engine: {engine})...")
    url = "https://quickchart.io/graphviz"
    
    payload = json.dumps({
        "graph": dot_code,
        "engine": engine,
        "format": "png"
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            with open(output_file, 'wb') as out_file:
                out_file.write(response.read())
        print(f"✓ SUCCESS! Saved: {output_file}")
    except Exception as e:
        print(f"❌ Error downloading {output_file}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Generates ERD and DSD directly from an SQL file.")
    parser.add_argument("input", help="The source SQL file (e.g., createTables.sql)")
    parser.add_argument("--erd-image", metavar="FILE.png", default="Stage 3/erd_new.png", help="Path to save ERD image")
    parser.add_argument("--dsd-image", metavar="FILE.png", default="Stage 3/dsd_new.png", help="Path to save DSD image")
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

    print(f"\n✓ {len(entities)} tables detected: {', '.join(e['name'] for e in entities)}\n")

    erd_dot = generate_erd_dot(entities)
    dsd_dot = generate_dsd_dot(entities)

    download_image(erd_dot, args.erd_image, engine="neato")
    download_image(dsd_dot, args.dsd_image, engine="dot")
    print("\nProcess complete!")

if __name__ == "__main__":
    main()