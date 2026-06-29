from populate_db import load_dataset, clean_data

if __name__ == '__main__':
    df = load_dataset('/data/games.csv')
    df = clean_data(df)
    print('Columns:', list(df.columns)[:30])
    if 'steam_app_id' in df.columns:
        col = df['steam_app_id']
        print('First 20 steam_app_id values:')
        print(col.head(20).tolist())
        print('Sample non-numeric examples:')
        nonnum = [v for v in col.astype(str).head(200).tolist() if not v.strip().isdigit()]
        print(nonnum[:20])
    else:
        print('steam_app_id not present')
