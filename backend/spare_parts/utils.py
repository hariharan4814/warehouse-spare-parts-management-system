from spare_parts.models import SparePartCategory, StorageLocation

def seed_data():
    # Seeding categories
    categories = ["Mechanical", "Electrical", "Bearings", "Fasteners", "Hydraulic"]
    for cat_name in categories:
        SparePartCategory.objects.get_or_create(
            name=cat_name,
            defaults={"description": f"{cat_name} spare parts", "status": "active"}
        )

    # Seeding locations
    locations = [
        {"warehouse": "Main Warehouse", "rack": "A", "shelf": "1", "bin": "A1"},
        {"warehouse": "Main Warehouse", "rack": "A", "shelf": "2", "bin": "A2"},
        {"warehouse": "Secondary Warehouse", "rack": "B", "shelf": "1", "bin": "B1"},
    ]
    for loc_data in locations:
        StorageLocation.objects.get_or_create(
            warehouse=loc_data["warehouse"],
            rack=loc_data["rack"],
            shelf=loc_data["shelf"],
            bin=loc_data["bin"]
        )
