import csv
from sqlalchemy import create_engine, text

# 1. Connection setup
DATABASE_URL = "postgresql://sara:sara@localhost:5432/sara"
engine = create_engine(DATABASE_URL)
def check_connection():
    """Checks if the connection to PostgreSQL is working."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            print(f" Connected! PostgreSQL Version: {result.scalar()}")
    except Exception as e:
        print(f" Connection failed: {e}")

def show_warehouse_data():
    """Reads and prints all data from the warehouse table."""
    with engine.connect() as connection:
        result = connection.execute(text("SELECT * FROM store;"))
        rows = result.all()
        if rows:
            print("\n--- Warehouse Content ---")
            for row in rows:
                print(row)
        else:
            print("\nWarehouse table is empty.")

def import_csv_to_db(file_name="stores.csv"):
    """Reads stores.csv and inserts data into the STORE table."""
    try:
        with engine.connect() as connection:
            with open(file_name, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                query = text("""
                    INSERT INTO STORE (StoreID, StoreName, Phone, Rating, WebSiteUrl)
                    VALUES (:StoreID, :StoreName, :Phone, :Rating, :WebSiteUrl)
                    ON CONFLICT (StoreID) DO NOTHING;
                """)
                
                for row in reader:
                    connection.execute(query, {
                        "StoreID": int(row['StoreID']),
                        "StoreName": row['StoreName'],
                        "Phone": row['Phone'],
                        "Rating": int(row['Rating']),
                        "WebSiteUrl": row['WebSiteUrl']
                    })
            
            connection.commit()
            print(f" Data from {file_name} successfully imported!")
            
    except FileNotFoundError:
        print(f" Error: {file_name} not found in the project folder.")
    except Exception as e:
        print(f" Database error during import: {e}")

def import_delivery_regions_to_db(file_name="delivery_regions.csv"):
    """Reads delivery_regions.csv and inserts data into the DELIVERYCOMPAGNY_REGIONSERVED table."""
    try:
        with engine.connect() as connection:
            with open(file_name, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                query = text("""
                    INSERT INTO DELIVERYCOMPAGNY_REGIONSERVED (DeliveryCieID, RegionServed)
                    VALUES (:DeliveryCieID, :RegionServed)
                    ON CONFLICT (RegionServed, DeliveryCieID) DO NOTHING;
                """)
                for row in reader:
                    connection.execute(query, {
                        "DeliveryCieID": int(row['DeliveryCieID']),
                        "RegionServed": row['RegionServed']
                    })
            connection.commit()
            print(f" Data from {file_name} successfully imported!")
    except FileNotFoundError:
        print(f" Error: {file_name} not found in the project folder.")
    except Exception as e:
        print(f" Database error during import: {e}")

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    # Step 1: Check connection
    check_connection()
    
    # Step 2: Import the CSV data (the csv files are in the same folder)
    import_csv_to_db("stores.csv") # Laisse ceci décommenté si tu veux aussi importer les magasins
    
    #  Import the CSV data 
    import_delivery_regions_to_db("delivery_regions.csv")
    
    # Step 3: Show what's in the warehouse (for exemple, to test the output)
    # show_warehouse_data()