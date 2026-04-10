"""
Migração: move value_per_unit de roles para productions.

- Adiciona coluna value_per_unit na tabela productions (default 0.0 para registros existentes)
- A coluna value_per_unit em roles é ignorada pelo SQLAlchemy (não precisa ser removida do SQLite)

Execute uma vez antes de reiniciar o backend:
    cd backend && python migrate_value_per_unit.py
"""
import sqlite3
import os

db_path = os.getenv("DATABASE_PATH", "./palha.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Verifica se a coluna já existe
cursor.execute("PRAGMA table_info(productions)")
columns = [row[1] for row in cursor.fetchall()]

if "value_per_unit" not in columns:
    cursor.execute("ALTER TABLE productions ADD COLUMN value_per_unit REAL NOT NULL DEFAULT 0.0")
    conn.commit()
    print("✓ Coluna value_per_unit adicionada à tabela productions.")
else:
    print("✓ Coluna value_per_unit já existe, nada a fazer.")

conn.close()
