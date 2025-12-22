import os
import glob
import pandas as pd
from datetime import datetime
import re

def rename_csvs(data_dir):
    # Find all CSV files that match the pattern "M.W.csv"
    # We use a regex to ensure we only pick up the files we generated (e.g., 1.1.csv, 10.3.csv)
    # and not other random csv files.
    pattern = re.compile(r'^\d+\.\d+\.csv$')
    
    files = [f for f in os.listdir(data_dir) if pattern.match(f)]
    
    for filename in files:
        file_path = os.path.join(data_dir, filename)
        try:
            # Read the CSV to find the date
            # We assume the date is in the row starting with "Time"
            # It seems row 1 (0-indexed) is usually the one.
            # Let's read a few lines to find it.
            df = pd.read_csv(file_path, header=None, nrows=5)
            
            date_row = None
            for idx, row in df.iterrows():
                if row[0] == 'Time':
                    date_row = row
                    break
            
            if date_row is None:
                print(f"Could not find 'Time' row in {filename}")
                continue
                
            # The dates start from index 1.
            # We pick index 4 (Wednesday) to determine the ISO week year and number reliably.
            # If the file has fewer columns, we fallback to the first date (index 1).
            
            target_date_str = None
            if len(date_row) > 4 and pd.notna(date_row[4]):
                target_date_str = date_row[4]
            elif len(date_row) > 1 and pd.notna(date_row[1]):
                target_date_str = date_row[1]
            
            if target_date_str:
                # Parse date. It seems to be "YYYY-MM-DD HH:MM:SS"
                try:
                    dt = pd.to_datetime(target_date_str)
                    year, week, day = dt.isocalendar()
                    
                    new_filename = f"{year}_{week:02d}.csv"
                    new_path = os.path.join(data_dir, new_filename)
                    
                    # Rename
                    os.rename(file_path, new_path)
                    print(f"Renamed {filename} to {new_filename}")
                    
                except Exception as e:
                    print(f"Error parsing date in {filename}: {e}")
            else:
                 print(f"No valid date found in {filename}")

        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    data_directory = "raw_data"
    rename_csvs(data_directory)
