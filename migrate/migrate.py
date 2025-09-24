# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
import binascii
import sqlite3 as sql
from pathlib import Path
from typing import Any

CURRENT_DIR = Path(__file__).parent

def hex_to_date(hex_str: str) -> str:
    return f"'{binascii.unhexlify(hex_str[2:]).decode()}'"

def parse_row_item(item: str) -> Any:
    item = item.lstrip(" ")

    if item == "'0000-00-00 00:00:00'":
        return "'1800-01-00 00:00:00'"

    if item.startswith("0x"):
        return hex_to_date(item)

    return item

def insert_line(db: sql.Connection, table: str, line: str) -> None:
    if line.startswith("INSERT"):
        start = line.find("VALUES")
        line = line[start + 7:]
    line = [parse_row_item(item) for item in line[1:-3].split(",")]
    stmt = f"INSERT INTO {table} VALUES ({",".join(line)})"
    db.execute(stmt)

def main() -> None:
    connection = sql.connect("caol.db")
    with connection:
        for migration in (CURRENT_DIR / "migrations").iterdir():
            with open(migration, "r") as f:
                connection.execute(f.read())

        with open(CURRENT_DIR / "banco_de_dados.sql", "r") as dump:
            for index, line in enumerate(dump, 1):
                if index >= 30929 and index <= 37981:
                    insert_line(connection, "cao_cliente", line)
                elif index >= 52615 and index <= 52767:
                    insert_line(connection, "cao_fatura", line)
                elif index >= 116295 and index <= 116435:
                    insert_line(connection, "cao_usuario", line)
                elif index >= 120386 and index <= 120536:
                    insert_line(connection, "permissao_sistema", line)

if __name__ == "__main__":
    main()
