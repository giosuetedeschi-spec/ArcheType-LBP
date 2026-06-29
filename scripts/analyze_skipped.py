"""Analizza i record saltati durante l'importazione."""

import pandas as pd
import re
from pathlib import Path
from collections import Counter

def analyze_skipped_records():
    """Analizza perché i record sono stati saltati."""
    df = pd.read_csv('data/games.csv')
    
    # Normalizza colonne
    df.columns = [str(col).strip().lower() for col in df.columns]
    
    # Rinomina appid
    if "appid" in df.columns:
        df = df.rename(columns={"appid": "steam_app_id"})
    
    print(f"Total records: {len(df)}")
    print(f"After dropna(subset=['name']): {len(df.dropna(subset=['name']))}")
    
    # Analizza AppID
    app_id_col = None
    for col in ['steam_app_id', 'appid', 'app_id']:
        if col in df.columns:
            app_id_col = col
            break
    
    if not app_id_col:
        print("AppID column not found!")
        return
    
    print(f"\n=== Analyzing {app_id_col} column ===")
    
    total_rows = len(df)
    null_count = df[app_id_col].isna().sum()
    
    # Categorie di problemi
    reasons = {
        'null_or_empty': 0,
        'non_numeric': 0,
        'out_of_range': 0,
        'valid': 0,
        'duplicate_after_clean': 0
    }
    
    valid_app_ids = []
    invalid_samples = {'null': [], 'non_numeric': [], 'out_of_range': []}
    
    for idx, val in enumerate(df[app_id_col]):
        # Null o vuoto
        if pd.isna(val):
            reasons['null_or_empty'] += 1
            if len(invalid_samples['null']) < 5:
                invalid_samples['null'].append(f"Row {idx}: NaN")
            continue
        
        text = str(val).strip()
        if not text:
            reasons['null_or_empty'] += 1
            if len(invalid_samples['null']) < 5:
                invalid_samples['null'].append(f"Row {idx}: empty string")
            continue
        
        # Estrai primo numero
        match = re.search(r"(\d+)", text)
        if not match:
            reasons['non_numeric'] += 1
            if len(invalid_samples['non_numeric']) < 5:
                invalid_samples['non_numeric'].append(f"Row {idx}: '{val}'")
            continue
        
        app_id = int(match.group(1))
        
        # Check range
        if app_id < 0 or app_id > 2_147_483_647:
            reasons['out_of_range'] += 1
            if len(invalid_samples['out_of_range']) < 5:
                invalid_samples['out_of_range'].append(f"Row {idx}: {app_id}")
            continue
        
        # Valid
        reasons['valid'] += 1
        valid_app_ids.append(app_id)
    
    # Check duplicates in valid IDs
    duplicates = len(valid_app_ids) - len(set(valid_app_ids))
    reasons['duplicate_after_clean'] = duplicates
    
    print(f"\n=== Results ===")
    print(f"Total records: {total_rows}")
    print(f"Null/Empty AppID: {reasons['null_or_empty']}")
    print(f"Non-numeric AppID: {reasons['non_numeric']}")
    print(f"Out of range AppID: {reasons['out_of_range']}")
    print(f"Valid AppID: {reasons['valid']}")
    print(f"Duplicates in valid: {reasons['duplicate_after_clean']}")
    print(f"TOTAL SKIPPED: {total_rows - reasons['valid']}")
    
    print(f"\n=== Samples of invalid records ===")
    print(f"Null/Empty: {invalid_samples['null']}")
    print(f"Non-numeric: {invalid_samples['non_numeric']}")
    print(f"Out of range: {invalid_samples['out_of_range']}")
    
    # Top duplicate AppIDs
    if duplicates > 0:
        app_id_counts = Counter(valid_app_ids)
        duplicated_ids = [(app_id, count) for app_id, count in app_id_counts.items() if count > 1]
        duplicated_ids.sort(key=lambda x: x[1], reverse=True)
        print(f"\n=== Top 10 duplicated AppIDs ===")
        for app_id, count in duplicated_ids[:10]:
            print(f"  AppID {app_id}: {count} times")

if __name__ == '__main__':
    analyze_skipped_records()
