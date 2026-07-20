import random
import json
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

from spare_parts.models import SparePartCategory, StorageLocation, SparePart
from warehouses.models import Warehouse, WarehouseInventory, StockTransfer, StockTransferItem
from suppliers.models import Supplier
from purchases.models import PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem
from issue_return.models import WorkOrder, WorkOrderItem, IssueTransaction, IssueTransactionItem
from inventory.models import StockMovement, StockMovementType, ReferenceType
from notifications.models import Notification
from audit_logs.models import AuditLog

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds comprehensive enterprise sample data tailored for an Indian manufacturing plant."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing enterprise demo data seeding..."))
        now = timezone.now()

        # 1. Seed Demo Users
        admin_user, _ = User.objects.get_or_create(
            username="Admin",
            defaults={
                "email": "admin@example.com",
                "role": "ADMIN",
                "is_superuser": True,
                "is_staff": True,
                "employee_id": "EMP-001",
                "designation": "Chief Operations Officer",
                "department": "Executive Leadership",
            },
        )
        admin_user.set_password("Admin@123")
        admin_user.save()

        manager_user, _ = User.objects.get_or_create(
            username="warehousemanager",
            defaults={
                "email": "warehousemanager@example.com",
                "role": "WAREHOUSE_MANAGER",
                "is_staff": True,
                "employee_id": "EMP-002",
                "designation": "General Manager - Warehousing",
                "department": "Supply Chain & Logistics",
            },
        )
        manager_user.set_password("WarehouseManager@123")
        manager_user.save()

        storekeeper_user, _ = User.objects.get_or_create(
            username="storekeeper",
            defaults={
                "email": "storekeeper@example.com",
                "role": "STORE_KEEPER",
                "employee_id": "EMP-003",
                "designation": "Head Storekeeper",
                "department": "Inventory Management",
            },
        )
        storekeeper_user.set_password("Storekeeper@123")
        storekeeper_user.save()

        tech_user, _ = User.objects.get_or_create(
            username="technician",
            defaults={
                "email": "technician@example.com",
                "role": "TECHNICIAN",
                "employee_id": "EMP-004",
                "designation": "Senior Maintenance Engineer",
                "department": "Plant Maintenance",
            },
        )
        tech_user.set_password("Technician@123")
        tech_user.save()

        self.stdout.write(self.style.SUCCESS("[USERS] Demo users verified."))

        # 2. Seed 3 Warehouses
        warehouses_data = [
            {
                "name": "Main Warehouse",
                "warehouse_code": "MWH-MUM",
                "address": "Plot 42, MIDC Industrial Area, Andheri East",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postal_code": "400093",
                "country": "India",
                "manager": manager_user,
            },
            {
                "name": "Production Warehouse",
                "warehouse_code": "PWH-PUN",
                "address": "Sector 7, Chakan Industrial Belt",
                "city": "Pune",
                "state": "Maharashtra",
                "postal_code": "410501",
                "country": "India",
                "manager": manager_user,
            },
            {
                "name": "Maintenance Warehouse",
                "warehouse_code": "MWH-BLR",
                "address": "Peenya Industrial Estate Phase 2",
                "city": "Bengaluru",
                "state": "Karnataka",
                "postal_code": "560058",
                "country": "India",
                "manager": storekeeper_user,
            },
        ]

        warehouses = []
        for w_data in warehouses_data:
            wh, _ = Warehouse.objects.update_or_create(
                warehouse_code=w_data["warehouse_code"],
                defaults=w_data,
            )
            warehouses.append(wh)

        self.stdout.write(self.style.SUCCESS(f"[WAREHOUSES] {len(warehouses)} Warehouses active."))

        # 3. Storage Locations
        racks = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"]
        shelves = ["S1", "S2", "S3", "S4"]
        bins = ["B01", "B02", "B05", "B10"]

        locations = []
        for wh in warehouses:
            for r in racks[:3]:
                for s in shelves[:2]:
                    b = random.choice(bins)
                    loc, _ = StorageLocation.objects.get_or_create(
                        warehouse=wh.name,
                        rack=r,
                        shelf=s,
                        bin=b,
                    )
                    locations.append(loc)

        # 4. Seed 10 Indian Suppliers
        suppliers_data = [
            {"company_name": "SKF India Ltd", "supplier_code": "SUP-SKF-001", "contact_person": "Rajesh Sharma", "email": "contact@skfindia.com", "phone": "+91 98200 12345", "gst_number": "27AAACS1234F1Z1", "address": "Mahatma Gandhi Road", "city": "Mumbai", "state": "Maharashtra", "postal_code": "400001", "country": "India"},
            {"company_name": "Bosch Rexroth India", "supplier_code": "SUP-BOS-002", "contact_person": "Amitabh Roy", "email": "sales@boschrexroth.in", "phone": "+91 98450 67890", "gst_number": "29AAACB5678G1Z2", "address": "Hosur Road", "city": "Bengaluru", "state": "Karnataka", "postal_code": "560068", "country": "India"},
            {"company_name": "L&T Electrical & Automation", "supplier_code": "SUP-LNT-003", "contact_person": "Priya Nair", "email": "info@lntautomation.com", "phone": "+91 98190 23456", "gst_number": "27AAACL9012H1Z3", "address": "Powai Campus", "city": "Mumbai", "state": "Maharashtra", "postal_code": "400072", "country": "India"},
            {"company_name": "Precision Bearings India", "supplier_code": "SUP-PBI-004", "contact_person": "Vikram Patel", "email": "orders@precisionbearings.in", "phone": "+91 98790 34567", "gst_number": "24AAACP3456I1Z4", "address": "GIDC Naroda", "city": "Ahmedabad", "state": "Gujarat", "postal_code": "382330", "country": "India"},
            {"company_name": "ABC Industrial Engineering", "supplier_code": "SUP-ABC-005", "contact_person": "Suresh Gupta", "email": "support@abcengineering.in", "phone": "+91 98110 45678", "gst_number": "07AAACA7890J1Z5", "address": "Okhla Industrial Area", "city": "New Delhi", "state": "Delhi", "postal_code": "110020", "country": "India"},
            {"company_name": "Industrial Components India", "supplier_code": "SUP-ICI-006", "contact_person": "Manish Verma", "email": "sales@indcomp.in", "phone": "+91 98220 56789", "gst_number": "27AAACI1234K1Z6", "address": "Shivaji Nagar", "city": "Pune", "state": "Maharashtra", "postal_code": "411005", "country": "India"},
            {"company_name": "Siemens India Ltd", "supplier_code": "SUP-SIE-007", "contact_person": "Anita Desai", "email": "inquiry@siemens.co.in", "phone": "+91 98220 56780", "gst_number": "27AAACS5678L1Z7", "address": "Worli Sea Face", "city": "Mumbai", "state": "Maharashtra", "postal_code": "400018", "country": "India"},
            {"company_name": "Schneider Electric India", "supplier_code": "SUP-SCH-008", "contact_person": "Karan Malhotra", "email": "sales@schneider-electric.in", "phone": "+91 98100 67891", "gst_number": "06AAACS9012M1Z8", "address": "DLF Cyber City", "city": "Gurugram", "state": "Haryana", "postal_code": "122002", "country": "India"},
            {"company_name": "Havells Industrial Solutions", "supplier_code": "SUP-HAV-009", "contact_person": "Deepak Kulkarni", "email": "industrial@havells.com", "phone": "+91 98180 78902", "gst_number": "07AAACH3456N1Z9", "address": "Qrg Towers", "city": "Noida", "state": "Uttar Pradesh", "postal_code": "201301", "country": "India"},
            {"company_name": "Cummins India Power Systems", "supplier_code": "SUP-CUM-010", "contact_person": "Sunil Hegde", "email": "service@cumminsindia.com", "phone": "+91 98230 89013", "gst_number": "27AAACC7890P1Z0", "address": "Kothrud", "city": "Pune", "state": "Maharashtra", "postal_code": "411038", "country": "India"},
        ]

        suppliers = []
        for s_data in suppliers_data:
            sup, _ = Supplier.objects.update_or_create(
                supplier_code=s_data["supplier_code"],
                defaults=s_data,
            )
            suppliers.append(sup)

        self.stdout.write(self.style.SUCCESS(f"[SUPPLIERS] {len(suppliers)} Suppliers registered."))

        # 5. Categories
        categories_data = [
            ("Bearings", "Ball bearings, roller bearings, and pillow blocks"),
            ("Belts", "Timing belts, V-belts, and conveyor belts"),
            ("Motors", "AC/DC electric motors and drive units"),
            ("Electrical", "Contactors, breakers, switchgear, and terminals"),
            ("Sensors", "Proximity, optical, and ultrasonic sensors"),
            ("Hydraulics", "Pumps, valves, cylinders, and hydraulic lines"),
            ("Pneumatics", "Air cylinders, solenoid valves, and regulators"),
            ("Filters", "Air, oil, and hydraulic inline filter cartridges"),
            ("Fasteners", "High tensile bolts, nuts, washers, and studs"),
            ("Safety Equipment", "Personal protective equipment and industrial gear"),
            ("Lubricants", "Hydraulic oils, synthetic greases, and gear fluids"),
            ("Power Transmission", "Chains, sprockets, couplings, and gearboxes"),
            ("Conveyor Parts", "Rollers, pulleys, skirting, and belting hardware"),
            ("Switches", "Emergency pushbuttons, selector & limit switches"),
            ("Relays", "Industrial power relays and timer modules"),
            ("PLC Components", "Controllers, I/O modules, and power supplies"),
        ]

        categories = []
        for c_name, c_desc in categories_data:
            cat, _ = SparePartCategory.objects.update_or_create(
                name=c_name,
                defaults={"description": c_desc, "status": "active"},
            )
            categories.append(cat)

        # 6. Seed 45+ Spare Parts
        parts_data_raw = [
            # Bearings
            ("SKF Deep Groove Ball Bearing 6205-2RSH", "PRT-BRG-001", "Bearings", 450.00, 680.00, 120, 20, 200, "SKF", "SKF India"),
            ("Taper Roller Bearing 32210 J2/Q", "PRT-BRG-002", "Bearings", 1250.00, 1750.00, 45, 10, 100, "SKF", "SKF India"),
            ("Spherical Roller Bearing 22216 EK", "PRT-BRG-003", "Bearings", 3400.00, 4600.00, 18, 5, 50, "Precision", "Precision Bearings India"),
            ("Pillow Block Bearing Unit UCP208", "PRT-BRG-004", "Bearings", 890.00, 1200.00, 60, 15, 120, "SKF", "SKF India"),

            # Belts
            ("Gates Industrial V-Belt B-68", "PRT-BLT-001", "Belts", 580.00, 850.00, 85, 15, 150, "Gates", "ABC Industrial Engineering"),
            ("Heavy Duty Timing Belt 8M-1200-30", "PRT-BLT-002", "Belts", 1450.00, 2100.00, 32, 8, 60, "Gates", "ABC Industrial Engineering"),
            ("Conveyor Rubber Belt 3-Ply 600mm", "PRT-BLT-003", "Belts", 4200.00, 5800.00, 14, 4, 30, "Fenner", "Industrial Components India"),

            # Motors
            ("Siemens 2 HP 3-Phase AC Induction Motor", "PRT-MTR-001", "Motors", 8500.00, 11500.00, 12, 3, 25, "Siemens", "Siemens India Ltd"),
            ("ABB 5 HP 4-Pole Foot Mounted Motor", "PRT-MTR-002", "Motors", 16800.00, 22000.00, 8, 2, 15, "ABB", "Bosch Rexroth India"),
            ("CG 1 HP Single Phase Flange Motor", "PRT-MTR-003", "Motors", 5400.00, 7200.00, 15, 4, 30, "Crompton", "Cummins India Power Systems"),

            # Electrical
            ("Schneider Electric 32A Power Contactor 230V", "PRT-ELE-001", "Electrical", 1450.00, 1950.00, 42, 10, 80, "Schneider", "Schneider Electric India"),
            ("Siemens MCB 16A Triple Pole C-Curve", "PRT-ELE-002", "Electrical", 780.00, 1100.00, 95, 20, 200, "Siemens", "Siemens India Ltd"),
            ("L&T Thermal Overload Relay 12-18A", "PRT-ELE-003", "Electrical", 1250.00, 1700.00, 28, 8, 50, "L&T", "L&T Electrical & Automation"),
            ("Phoenix Contact Terminal Block 2.5mm Gray", "PRT-ELE-004", "Electrical", 45.00, 65.00, 450, 100, 1000, "Phoenix", "Havells Industrial Solutions"),

            # Sensors
            ("Bosch Inductive Proximity Sensor M12 PNP", "PRT-SEN-001", "Sensors", 2700.00, 3600.00, 35, 8, 70, "Bosch", "Bosch Rexroth India"),
            ("Omron Photoelectric Sensor 2m Retroreflective", "PRT-SEN-002", "Sensors", 3800.00, 4900.00, 22, 5, 40, "Omron", "Siemens India Ltd"),
            ("IFM Capacitive Distance Sensor M30", "PRT-SEN-003", "Sensors", 5200.00, 6800.00, 14, 4, 30, "IFM", "Bosch Rexroth India"),

            # Hydraulics
            ("Hydraulic Gear Pump 25L/min 200 Bar", "PRT-HYD-001", "Hydraulics", 18000.00, 24000.00, 6, 2, 15, "Rexroth", "Bosch Rexroth India"),
            ("Vickers Directional Solenoid Valve 24VDC", "PRT-HYD-002", "Hydraulics", 9500.00, 12800.00, 10, 3, 20, "Vickers", "Bosch Rexroth India"),
            ("Parker Double Acting Hydraulic Cylinder 50x250", "PRT-HYD-003", "Hydraulics", 14500.00, 19500.00, 5, 2, 10, "Parker", "Industrial Components India"),

            # Pneumatics
            ("Festo Air Filter Regulator Lubricator Unit 1/4\"", "PRT-PNE-001", "Pneumatics", 3400.00, 4500.00, 25, 6, 50, "Festo", "Festo India Pneumatics"),
            ("SMC Pneumatic Cylinder DNC-40-100-PPV", "PRT-PNE-002", "Pneumatics", 4200.00, 5600.00, 18, 5, 40, "SMC", "Festo India Pneumatics"),
            ("Norgren Solenoid Valve 5/2 Way G1/4", "PRT-PNE-003", "Pneumatics", 2100.00, 2900.00, 30, 8, 60, "Norgren", "Festo India Pneumatics"),

            # Filters
            ("Hydraulic Return Line Filter Element 10 Micron", "PRT-FLT-001", "Filters", 1650.00, 2300.00, 48, 12, 100, "Hydac", "Bosch Rexroth India"),
            ("Heavy Duty Engine Air Filter Element", "PRT-FLT-002", "Filters", 1250.00, 1750.00, 55, 15, 120, "Fleetguard", "Cummins India Power Systems"),
            ("Inline Compressed Air Coalescing Filter", "PRT-FLT-003", "Filters", 2800.00, 3800.00, 20, 5, 40, "Parker", "Industrial Components India"),

            # Fasteners
            ("M10 x 50mm High Tensile Hex Bolt Grade 8.8 (Box 100)", "PRT-FST-001", "Fasteners", 650.00, 920.00, 110, 25, 250, "TVS", "ABC Industrial Engineering"),
            ("M12 Stainless Steel Nylon Lock Nut A2-70 (Box 100)", "PRT-FST-002", "Fasteners", 480.00, 680.00, 140, 30, 300, "Unbrako", "ABC Industrial Engineering"),
            ("M8 Heavy Duty Expansion Anchor Shield (Box 50)", "PRT-FST-003", "Fasteners", 720.00, 990.00, 65, 15, 150, "Hilti", "ABC Industrial Engineering"),

            # Safety Equipment
            ("3M Industrial Safety Helmet HDPE Yellow", "PRT-SAF-001", "Safety Equipment", 650.00, 950.00, 75, 15, 150, "3M", "ABC Industrial Engineering"),
            ("Honeywell Cut-Resistant Kevlar Gloves Size L", "PRT-SAF-002", "Safety Equipment", 420.00, 600.00, 130, 30, 250, "Honeywell", "Industrial Components India"),
            ("Steel Toe Work Safety Boots Size 9 CE Approved", "PRT-SAF-003", "Safety Equipment", 2200.00, 3100.00, 35, 10, 75, "Bata", "Industrial Components India"),

            # Lubricants
            ("Shell Tellus S2 MX 46 Hydraulic Oil 20 Litres", "PRT-LUB-001", "Lubricants", 6800.00, 8900.00, 18, 5, 40, "Shell", "Industrial Components India"),
            ("Mobilith SHC 220 Synthetic Grease 18kg Pail", "PRT-LUB-002", "Lubricants", 12500.00, 16000.00, 8, 2, 20, "Mobil", "Industrial Components India"),

            # Power Transmission
            ("Fenner Flexible Jaw Coupling L095 Complete Set", "PRT-PWR-001", "Power Transmission", 1450.00, 2100.00, 28, 8, 60, "Fenner", "Precision Bearings India"),
            ("Tsubaki Heavy Duty Duplex Roller Chain 10B-2 5m", "PRT-PWR-002", "Power Transmission", 4800.00, 6500.00, 16, 4, 35, "Tsubaki", "Precision Bearings India"),

            # Conveyor Parts
            ("Steel Heavy Duty Conveyor Roller 89mm x 450mm", "PRT-CNV-001", "Conveyor Parts", 1150.00, 1600.00, 64, 15, 120, "Rexnord", "Industrial Components India"),
            ("Conveyor Belt Skirting Rubber 100mm x 10m", "PRT-CNV-002", "Conveyor Parts", 2400.00, 3300.00, 22, 6, 45, "Fenner", "Industrial Components India"),

            # Switches
            ("Schneider Emergency Stop Mushroom Pushbutton NC", "PRT-SWT-001", "Switches", 850.00, 1200.00, 50, 10, 100, "Schneider", "Schneider Electric India"),
            ("Eaton Limit Switch Heavy Duty Roller Lever", "PRT-SWT-002", "Switches", 1650.00, 2250.00, 32, 8, 60, "Eaton", "Schneider Electric India"),

            # Relays
            ("Omron 8-Pin Industrial Relay 24VDC with LED", "PRT-RLY-001", "Relays", 450.00, 650.00, 110, 25, 200, "Omron", "Siemens India Ltd"),
            ("Finder Plug-In Power Relay 11-Pin 10A 230VAC", "PRT-RLY-002", "Relays", 580.00, 820.00, 75, 15, 150, "Finder", "Siemens India Ltd"),

            # PLC Components
            ("Siemens SIMATIC S7-1200 CPU 1214C DC/DC/DC", "PRT-PLC-001", "PLC Components", 28500.00, 36000.00, 5, 2, 10, "Siemens", "Siemens India Ltd"),
            ("Delta DVP-16SP 16-Channel Digital I/O Module", "PRT-PLC-002", "PLC Components", 6400.00, 8500.00, 12, 3, 25, "Delta", "Siemens India Ltd"),
        ]

        cat_map = {c.name: c for c in categories}
        spare_parts = []
        for name, pcode, cname, cprice, sprice, stock, min_s, max_s, brand, sname in parts_data_raw:
            cat = cat_map.get(cname, categories[0])
            loc = random.choice(locations)

            part, _ = SparePart.objects.update_or_create(
                part_number=pcode,
                defaults={
                    "part_name": name,
                    "category": cat,
                    "description": f"High reliability industrial grade {name.lower()} for continuous manufacturing plant operation.",
                    "cost_price": Decimal(str(cprice)),
                    "selling_price": Decimal(str(sprice)),
                    "current_stock": stock,
                    "minimum_stock": min_s,
                    "maximum_stock": max_s,
                    "storage_location": loc,
                    "brand": brand,
                    "manufacturer": brand,
                    "unit_of_measure": "PCS" if "Oil" not in name and "Grease" not in name else "LTR",
                    "status": "active",
                    "created_by": admin_user,
                },
            )
            spare_parts.append(part)

            # Assign inventory stock across 3 warehouses
            w1_stock = int(stock * 0.5)
            w2_stock = int(stock * 0.3)
            w3_stock = max(0, stock - w1_stock - w2_stock)

            WarehouseInventory.objects.update_or_create(
                warehouse=warehouses[0], spare_part=part,
                defaults={"current_stock": w1_stock, "minimum_stock": min_s, "maximum_stock": max_s}
            )
            WarehouseInventory.objects.update_or_create(
                warehouse=warehouses[1], spare_part=part,
                defaults={"current_stock": w2_stock, "minimum_stock": min_s, "maximum_stock": max_s}
            )
            WarehouseInventory.objects.update_or_create(
                warehouse=warehouses[2], spare_part=part,
                defaults={"current_stock": w3_stock, "minimum_stock": min_s, "maximum_stock": max_s}
            )

        self.stdout.write(self.style.SUCCESS(f"[SPARE PARTS] {len(spare_parts)} Spare Parts created & distributed across warehouses."))

        # 7. Seed 18 Purchase Orders & Goods Receipts
        po_statuses = ["COMPLETED", "APPROVED", "PENDING_APPROVAL", "DRAFT", "CANCELLED"]
        po_count = 0
        grn_count = 0

        for i in range(1, 19):
            sup = random.choice(suppliers)
            status_choice = random.choice(po_statuses)
            po_date = now - timedelta(days=random.randint(5, 120))
            del_date = po_date + timedelta(days=random.randint(3, 14))

            po_num = f"PO-2026-{1000 + i}"
            po, created = PurchaseOrder.objects.get_or_create(
                po_number=po_num,
                defaults={
                    "supplier": sup,
                    "status": status_choice,
                    "order_date": po_date.date(),
                    "expected_delivery_date": del_date.date(),
                    "created_by": manager_user,
                    "total_amount": Decimal("0.00"),
                },
            )

            # Add PO items
            chosen_parts = random.sample(spare_parts, k=random.randint(2, 4))
            subtotal = Decimal("0.00")
            po_items = []
            for p in chosen_parts:
                qty = random.randint(10, 50)
                price = p.cost_price
                tot = price * qty
                subtotal += tot
                item, _ = PurchaseOrderItem.objects.get_or_create(
                    purchase_order=po,
                    spare_part=p,
                    defaults={"ordered_quantity": qty, "received_quantity": qty if status_choice == "COMPLETED" else 0, "unit_price": price, "total_price": tot},
                )
                po_items.append(item)

            tax = subtotal * Decimal("0.18")
            grand = subtotal + tax
            po.total_amount = grand
            po.save()
            po_count += 1

            # Goods Receipt for COMPLETED POs
            if status_choice == "COMPLETED" and grn_count < 10:
                grn_num = f"GRN-2026-{5000 + grn_count + 1}"
                grn, grn_created = GoodsReceipt.objects.get_or_create(
                    grn_number=grn_num,
                    defaults={
                        "purchase_order": po,
                        "received_by": storekeeper_user,
                        "remarks": f"Shipment for PO #{po.po_number} inspected and verified in full.",
                    },
                )
                if grn_created:
                    grn_count += 1
                    for item in po_items:
                        GoodsReceiptItem.objects.create(
                            goods_receipt=grn,
                            po_item=item,
                            received_quantity=item.ordered_quantity,
                        )

        self.stdout.write(self.style.SUCCESS(f"[PURCHASES] {po_count} Purchase Orders & {grn_count} Goods Receipts seeded."))

        # 8. Seed 15 Stock Transfers
        trf_count = 0
        for i in range(1, 16):
            src_wh, dst_wh = random.sample(warehouses, k=2)
            trf_num = f"TRF-2026-{3000 + i}"
            trf, t_created = StockTransfer.objects.get_or_create(
                transfer_number=trf_num,
                defaults={
                    "source_warehouse": src_wh,
                    "destination_warehouse": dst_wh,
                    "status": random.choice(["COMPLETED", "APPROVED", "PENDING", "COMPLETED"]),
                    "created_by": storekeeper_user,
                    "approved_by": manager_user,
                },
            )
            if t_created:
                trf_count += 1
                t_parts = random.sample(spare_parts, k=random.randint(1, 3))
                for p in t_parts:
                    qty = random.randint(5, 20)
                    StockTransferItem.objects.create(
                        transfer=trf,
                        spare_part=p,
                        quantity=qty,
                    )

        self.stdout.write(self.style.SUCCESS(f"[TRANSFERS] {trf_count} Stock Transfers created."))

        # 9. Seed 20 Work Orders & Issue Transactions
        wo_statuses = ["COMPLETED", "IN_PROGRESS", "OPEN", "COMPLETED"]
        wo_priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        wo_count = 0

        for i in range(1, 21):
            st = random.choice(wo_statuses)
            pr = random.choice(wo_priorities)
            w_date = now - timedelta(days=random.randint(1, 90))

            wo, w_created = WorkOrder.objects.get_or_create(
                work_order_number=f"WO-2026-{8000 + i}",
                defaults={
                    "title": f"Preventive Maintenance on Equipment Line #{i}",
                    "description": "Routine quarterly motor lubrication, sensor alignment, and belt tension check.",
                    "priority": pr,
                    "status": st,
                    "equipment_name": f"Assembly Conveyor Line #{random.randint(1, 6)}",
                    "location": f"Plant Floor Section {chr(65 + random.randint(0, 5))}",
                    "assigned_technician": tech_user,
                    "created_by": manager_user,
                },
            )
            wo_count += 1

            # Add parts to work order
            wo_parts = random.sample(spare_parts, k=random.randint(1, 3))
            for p in wo_parts:
                req_qty = random.randint(2, 6)
                iss_qty = req_qty if st == "COMPLETED" else random.randint(0, req_qty)
                WorkOrderItem.objects.create(
                    work_order=wo,
                    spare_part=p,
                    requested_quantity=req_qty,
                    issued_quantity=iss_qty,
                )

            # Issue transaction for completed work orders
            if st == "COMPLETED":
                tx_num = f"ISS-2026-{9000 + i}"
                tx, _ = IssueTransaction.objects.get_or_create(
                    issue_number=tx_num,
                    defaults={
                        "work_order": wo,
                        "issued_by": storekeeper_user,
                        "warehouse": warehouses[0],
                    },
                )
                for item in wo.items.all():
                    if item.issued_quantity > 0:
                        IssueTransactionItem.objects.get_or_create(
                            issue_transaction=tx,
                            spare_part=item.spare_part,
                            defaults={
                                "quantity": item.issued_quantity,
                            },
                        )

        self.stdout.write(self.style.SUCCESS(f"[WORK ORDERS] {wo_count} Work Orders seeded."))

        # 10. Seed 100+ Stock Movement Logs
        m_types = [StockMovementType.STOCK_IN, StockMovementType.STOCK_OUT, StockMovementType.STOCK_ADJUSTMENT, StockMovementType.STOCK_TRANSFER]
        r_types = [ReferenceType.PURCHASE, ReferenceType.ISSUE, ReferenceType.RETURN, ReferenceType.ADJUSTMENT, ReferenceType.TRANSFER]
        m_count = 0
        for i in range(120):
            m_part = random.choice(spare_parts)
            m_type = random.choice(m_types)
            r_type = random.choice(r_types)
            qty = random.randint(2, 30)
            t_stamp = now - timedelta(days=random.randint(0, 180), hours=random.randint(0, 23))

            prev_stk = m_part.current_stock
            new_stk = prev_stk + qty if m_type == StockMovementType.STOCK_IN else max(0, prev_stk - qty)

            sm = StockMovement.objects.create(
                spare_part=m_part,
                movement_type=m_type,
                quantity=qty,
                previous_stock=prev_stk,
                new_stock=new_stk,
                reference_type=r_type,
                reference_number=f"REF-2026-{1000 + i}",
                reason=f"Operational {m_type.lower().replace('_', ' ')} record",
                performed_by=random.choice([admin_user, manager_user, storekeeper_user, tech_user]),
            )
            StockMovement.objects.filter(pk=sm.pk).update(created_at=t_stamp)
            m_count += 1

        self.stdout.write(self.style.SUCCESS(f"[MOVEMENTS] {m_count} Stock Movement records created."))

        # 11. Seed 50+ Notifications
        notif_titles = [
            ("Low Stock Warning", "LOW_STOCK", "Stock level for {part} is below minimum threshold."),
            ("PO Approved", "PURCHASE_ORDER", "Purchase order {ref} has been approved by management."),
            ("Stock Transfer Completed", "STOCK_TRANSFER", "Transfer {ref} successfully received at destination facility."),
            ("Work Order Assigned", "WORK_ORDER", "New maintenance work order {ref} assigned to engineering team."),
            ("Goods Received", "GOODS_RECEIPT", "Shipment for PO {ref} delivered and logged into inventory."),
        ]

        notif_count = 0
        for i in range(55):
            title, ntype, template = random.choice(notif_titles)
            part_name = random.choice(spare_parts).part_name
            ref_id = f"#PO-{random.randint(1000, 9999)}"
            msg = template.format(part=part_name, ref=ref_id)
            user_dest = random.choice([admin_user, manager_user, storekeeper_user, tech_user])
            n_stamp = now - timedelta(days=random.randint(0, 30))

            ntf = Notification.objects.create(
                user=user_dest,
                title=title,
                message=msg,
                notification_type=ntype,
                is_read=random.choice([True, False, False]),
            )
            Notification.objects.filter(pk=ntf.pk).update(created_at=n_stamp)
            notif_count += 1

        self.stdout.write(self.style.SUCCESS(f"[NOTIFICATIONS] {notif_count} System notifications generated."))

        # 12. Seed 100+ Audit Logs
        audit_actions = [
            ("LOGIN", "AUTHENTICATION", "User logged into administrative terminal"),
            ("CREATE", "SPARE_PARTS", "Registered new catalog item in database"),
            ("UPDATE", "PURCHASE_ORDERS", "Approved purchase order and updated delivery schedule"),
            ("TRANSFER", "WAREHOUSES", "Dispatched inventory stock transfer between hubs"),
            ("ISSUE", "WORK_ORDERS", "Issued spare parts for critical equipment maintenance"),
        ]

        audit_count = 0
        for i in range(110):
            act, mod, desc = random.choice(audit_actions)
            u = random.choice([admin_user, manager_user, storekeeper_user, tech_user])
            a_stamp = now - timedelta(days=random.randint(0, 90), minutes=random.randint(5, 500))

            alg = AuditLog.objects.create(
                user=u,
                action=act,
                module=mod,
                old_value=json.dumps({"status": "DRAFT", "note": "Initial payload"}),
                new_value=json.dumps({"status": "COMPLETED", "note": desc}),
                ip_address=f"192.168.1.{random.randint(10, 200)}",
            )
            AuditLog.objects.filter(pk=alg.pk).update(timestamp=a_stamp)
            audit_count += 1

        self.stdout.write(self.style.SUCCESS(f"[AUDIT LOGS] {audit_count} Audit log ledger items recorded."))

        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS("ENTERPRISE DEMO SEEDING COMPLETED SUCCESSFULLY!"))
        self.stdout.write(self.style.SUCCESS("="*60 + "\n"))
