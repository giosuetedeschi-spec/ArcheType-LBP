import sys
from pathlib import Path

# Ensure project root is on sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from populate.populate_db import load_dataset


if __name__ == '__main__':
    df = load_dataset('data/games.csv')
    print('Columns:', list(df.columns)[:30])
    print('First row sample:')
    print(df.head(1).to_dict(orient='records'))
    print('Dtypes:')
    print(df.dtypes[:30])
