from django.core.management.base import BaseCommand
from spare_parts.utils import seed_data

class Command(BaseCommand):
    help = "Seeds initial sample Categories and Storage Locations for development"

    def handle(self, *args, **options):
        self.stdout.write("Seeding sample Spare Part categories and storage locations...")
        seed_data()
        self.stdout.write(self.style.SUCCESS("Successfully seeded categories and storage locations!"))
