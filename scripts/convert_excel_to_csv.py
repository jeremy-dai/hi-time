import pandas as pd
import os

def convert_excel_to_csv(excel_path, output_dir):
    try:
        # Load the Excel file
        xls = pd.ExcelFile(excel_path)
        
        # Ensure output directory exists
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # Iterate through each sheet
        for sheet_name in xls.sheet_names:
            print(f"Processing sheet: {sheet_name}")
            df = pd.read_excel(xls, sheet_name=sheet_name)
            
            # Construct CSV filename
            csv_filename = f"{sheet_name}.csv"
            csv_path = os.path.join(output_dir, csv_filename)
            
            # Save to CSV
            df.to_csv(csv_path, index=False)
            print(f"Saved {csv_path}")
            
    except Exception as e:
        print(f"Error processing {excel_path}: {e}")

if __name__ == "__main__":
    excel_file = "raw_data/2025 Time.xlsx"
    output_directory = "raw_data"
    
    if os.path.exists(excel_file):
        convert_excel_to_csv(excel_file, output_directory)
    else:
        print(f"File not found: {excel_file}")
