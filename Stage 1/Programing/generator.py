import csv
import random

# List of Israeli regions for store names
regions = [
    'Jerusalem', 'Tel Aviv', 'Haifa', 'Beersheba', 'Eilat', 'Ashdod', 'Netanya', 
    'Petah Tikva', 'Rishon LeZion', 'Holon', 'Rehovot', 'Herzliya', 'Ra\'anana', 
    'Modi\'in', 'Hadera', 'Kfar Saba', 'Lod', 'Ramla', 'Beit Shemesh', 'Acre', 
    'Tiberias', 'Nazareth', 'Karmiel', 'Nahariya', 'Afula', 'Kiryat Gat', 
    'Kiryat Shmona', 'Dimona', 'Arad', 'Ashkelon'
]

def generate_store_data(file_name="stores.csv"):
    """
    Generates a CSV file containing 300 stores with unique names and randomized data.
    """
    # Track the number of stores per city to ensure unique naming (e.g., RL Jerusalem 1)
    city_counter = {city: 0 for city in regions}
    
    try:
        with open(file_name, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            # Writing CSV Headers
            writer.writerow(['StoreID', 'StoreName', 'Phone', 'Rating', 'WebSiteUrl'])
            
            for i in range(1, 301):
                store_id = i
                # Select city using modulo to cycle through the list
                city = regions[(i - 1) % len(regions)]
                city_counter[city] += 1
                
                # Format Name: RL [City] [Index]
                store_name = f"RL {city} {city_counter[city]}"
                
                # Phone: Starts with 02, followed by 8 random digits (10 digits total)
                phone = "02" + "".join([str(random.randint(0, 9)) for _ in range(8)])
                
                # Rating: Random integer between 1 and 5
                rating = random.randint(1, 5)
                
                # URL: Dynamic generation based on store name
                url_name = store_name.replace(" ", "-").lower().replace("'", "")
                url = f"https://www.{url_name}.co.il"
                
                writer.writerow([store_id, store_name, phone, rating, url])
                
        print(f" Successfully generated {file_name} with 300 entries.")
    except Exception as e:
        print(f" An error occurred during file generation: {e}")

def generate_delivery_regions(file_name="delivery_regions.csv"):
    """
    Generates a CSV file associating the 100 delivery companies 
    with random regions.
    """
    try:
        with open(file_name, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            
            # CSV Headers (matching your table columns)
            writer.writerow(['DeliveryCieID', 'RegionServed'])
            
            # Loop through your 100 companies (DeliveryCieID from 1 to 100)
            for company_id in range(1, 101):
                
                # Randomly choose how many regions this company will serve (e.g., between 1 and 5)
                num_regions = random.randint(1, 5)
                
                # random.sample ensures there are no duplicate regions for the same delivery company
                served_regions = random.sample(regions, k=num_regions)
                
                # Create a row for each region served by this company
                for region in served_regions:
                    writer.writerow([company_id, region])
                    
        print(f" Successfully generated {file_name}.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    generate_store_data()
    generate_delivery_regions()
