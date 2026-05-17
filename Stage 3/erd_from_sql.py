"""
SQL to ERD description.

Reads a SQL file (CREATE TABLE statements) and writes a text file
that describes each table: fields, primary key, foreign keys,
relationships, and entity kind.

Only the SQL is trusted. If the ERD diagram says something else,
this script ignores it.
"""

import re
import sys


# Read the SQL files

def read_sql(path):
    with open(path, "r") as f:
        return f.read()


#Cut the SQL into tables

def find_tables(sql):
    # Match: CREATE TABLE <name> ( ... );
    # Returns a list of (table_name, body) tuples.
    pattern = r"CREATE\s+TABLE\s+(\w+)\s*\((.*?)\);"
    return re.findall(pattern, sql, re.IGNORECASE | re.DOTALL)


# Split the body into lines

def split_parts(body):
    # We cannot just split on "," because NUMERIC(10,2) also has a comma.
    # So we only split when we are NOT inside parentheses.
    parts = []
    current = ""
    depth = 0
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(current.strip())
            current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current.strip())
    return parts


# Parse one table 

def parse_table(name, body):
    table = {
        "name": name,
        "columns": [],        # list of (column_name, is_not_null)
        "primary_key": [],    # list of column names
        "foreign_keys": [],   # list of (column, referenced_table, referenced_column)
    }

    for part in split_parts(body):
        upper = part.upper()

        # Case A: table-level PRIMARY KEY (col1, col2)
        if upper.startswith("PRIMARY KEY"):
            inside = re.search(r"\((.*?)\)", part).group(1)
            cols = [c.strip() for c in inside.split(",")]
            table["primary_key"] = cols

        # Case B: table-level FOREIGN KEY (col) REFERENCES tab(col)
        elif upper.startswith("FOREIGN KEY"):
            m = re.search(
                r"FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)",
                part, re.IGNORECASE,
            )
            table["foreign_keys"].append((m.group(1), m.group(2), m.group(3)))

        # Case C: a normal column line, like "price NUMERIC(10,2) NOT NULL"
        else:
            col_name = part.split()[0]
            is_not_null = "NOT NULL" in upper
            table["columns"].append((col_name, is_not_null))
            # Inline PK, like "customerid INT PRIMARY KEY"
            if "PRIMARY KEY" in upper:
                table["primary_key"].append(col_name)

    return table


# Classify the entity

def entity_kind(table):
    pk = set(c.lower() for c in table["primary_key"])
    fk_cols = set(fk[0].lower() for fk in table["foreign_keys"])

    # Weak entity: PK composite AND one PK column is also a FK
    if len(pk) >= 2 and (pk & fk_cols):
        return "WEAK ENTITY"

    # Everything else is a regular entity.
    return "REGULAR ENTITY"


# Classify one FK

def relationship_kind(table, fk):
    col, ref_table, _ = fk
    pk = set(c.lower() for c in table["primary_key"])

    # Find if the FK column is NOT NULL
    not_null = False
    for cname, cnotnull in table["columns"]:
        if cname.lower() == col.lower():
            not_null = cnotnull
    # PK columns are implicitly NOT NULL even without the keyword
    if col.lower() in pk:
        not_null = True

    side = "mandatory" if not_null else "optional"

    # The FK is the only PK column => exactly one row per parent => 1:1
    if col.lower() in pk and len(pk) == 1:
        return f"One-to-One with {ref_table} ({side})"

    # The FK is part of a composite PK => identifying link to the owner
    if col.lower() in pk:
        return f"Identifying link to {ref_table} (owner of weak entity, {side})"

    # Otherwise: many rows here can share the same parent => N:1
    return f"Many-to-One with {ref_table} ({side})"


# Write the output

def write_erd(tables, path):
    with open(path, "w") as f:
        for t in tables:
            field_names = ", ".join(c[0] for c in t["columns"])
            pk_text = ", ".join(t["primary_key"]) if t["primary_key"] else "none"

            f.write(f"ENTITY NAME: {t['name'].upper()}\n")
            f.write(f"  Entity kind  : {entity_kind(t)}\n")
            f.write(f"  Fields       : {field_names}\n")
            f.write(f"  Primary key  : {pk_text}\n")

            if t["foreign_keys"]:
                f.write("  Foreign keys :\n")
                for fk in t["foreign_keys"]:
                    f.write(f"    - {fk[0]} -> {fk[1]}({fk[2]})\n")
                f.write("  Relationships:\n")
                for fk in t["foreign_keys"]:
                    f.write(f"    - Linked to {fk[1]} : {relationship_kind(t, fk)}\n")
            else:
                f.write("  Foreign keys : none\n")

            f.write("\n")


# Main

if __name__ == "__main__":
    sql_text = read_sql(sys.argv[1])
    tables = [parse_table(name, body) for name, body in find_tables(sql_text)]
    write_erd(tables, sys.argv[2])
