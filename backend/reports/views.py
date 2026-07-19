from decimal import Decimal
from django.utils import timezone
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from spare_parts.models import SparePart
from inventory.models import StockMovement
from warehouses.models import Warehouse, WarehouseInventory, StockTransfer
from suppliers.models import Supplier
from purchases.models import PurchaseOrder, GoodsReceipt
from issue_return.models import WorkOrder, WorkOrderItem, IssueTransaction, IssueTransactionItem


class ReportsDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()

        # 1. Total Inventory Valuation
        parts = SparePart.objects.all()
        total_inventory_value = sum(
            (p.current_stock or 0) * (p.cost_price or Decimal("0.00")) for p in parts
        )
        total_spare_parts = parts.count()

        total_warehouses = Warehouse.objects.count()
        total_suppliers = Supplier.objects.count()

        # Current Month Operations Counts
        pos_this_month = PurchaseOrder.objects.filter(
            order_date__year=now.year, order_date__month=now.month
        ).count()
        wos_this_month = WorkOrder.objects.filter(
            created_at__year=now.year, created_at__month=now.month
        ).count()
        stock_transfers_this_month = StockTransfer.objects.filter(
            created_at__year=now.year, created_at__month=now.month
        ).count()
        goods_receipts_this_month = GoodsReceipt.objects.filter(
            received_date__year=now.year, received_date__month=now.month
        ).count()

        # Stock Watchlists
        low_stock_items = parts.filter(
            current_stock__lte=models.F("minimum_stock"), current_stock__gt=0
        ).count()
        out_of_stock_items = parts.filter(current_stock=0).count()

        # Analytics 1: Inventory Value by Warehouse
        warehouses = Warehouse.objects.all()
        inventory_by_warehouse = []
        for wh in warehouses:
            wh_invs = WarehouseInventory.objects.filter(warehouse=wh).select_related("spare_part")
            wh_value = sum(
                (inv.current_stock or 0) * (inv.spare_part.cost_price or Decimal("0.00"))
                for inv in wh_invs
            )
            wh_units = sum(inv.current_stock or 0 for inv in wh_invs)
            inventory_by_warehouse.append({
                "warehouse_id": wh.id,
                "warehouse_code": wh.warehouse_code,
                "name": wh.name,
                "total_units": wh_units,
                "total_value": float(wh_value),
            })

        # Analytics 2: Monthly PO Trend (last 6 months)
        monthly_pos = []
        for i in range(5, -1, -1):
            month_date = now - timezone.timedelta(days=i * 30)
            month_str = month_date.strftime("%b %Y")
            pos_m = PurchaseOrder.objects.filter(
                order_date__year=month_date.year, order_date__month=month_date.month
            )
            count_m = pos_m.count()
            total_spent_m = sum(po.total_amount for po in pos_m)
            monthly_pos.append({
                "month": month_str,
                "count": count_m,
                "total_amount": float(total_spent_m),
            })

        # Analytics 3: Monthly WO Trend (last 6 months)
        monthly_wos = []
        for i in range(5, -1, -1):
            month_date = now - timezone.timedelta(days=i * 30)
            month_str = month_date.strftime("%b %Y")
            wos_m = WorkOrder.objects.filter(
                created_at__year=month_date.year, created_at__month=month_date.month
            )
            monthly_wos.append({
                "month": month_str,
                "count": wos_m.count(),
                "completed": wos_m.filter(status="COMPLETED").count(),
            })

        # Analytics 4: Supplier Purchase Spend Summary (Top 5)
        supplier_purchases = []
        for sup in Supplier.objects.all()[:5]:
            sup_pos = PurchaseOrder.objects.filter(supplier=sup)
            total_spent = sum(po.total_amount for po in sup_pos)
            supplier_purchases.append({
                "supplier_name": sup.company_name,
                "po_count": sup_pos.count(),
                "total_spent": float(total_spent),
            })

        # Analytics 5: Top 10 Most Consumed Spare Parts
        top_consumed_query = (
            IssueTransactionItem.objects.values("spare_part__part_number", "spare_part__part_name")
            .annotate(total_issued=models.Sum("quantity"))
            .order_by("-total_issued")[:10]
        )
        top_consumed = [
            {
                "part_number": item["spare_part__part_number"],
                "part_name": item["spare_part__part_name"],
                "total_issued": item["total_issued"],
            }
            for item in top_consumed_query
        ]

        return Response({
            "total_inventory_value": float(total_inventory_value),
            "total_spare_parts": total_spare_parts,
            "total_warehouses": total_warehouses,
            "total_suppliers": total_suppliers,
            "pos_this_month": pos_this_month,
            "wos_this_month": wos_this_month,
            "stock_transfers_this_month": stock_transfers_this_month,
            "goods_receipts_this_month": goods_receipts_this_month,
            "low_stock_items": low_stock_items,
            "out_of_stock_items": out_of_stock_items,
            "inventory_by_warehouse": inventory_by_warehouse,
            "monthly_pos": monthly_pos,
            "monthly_wos": monthly_wos,
            "supplier_purchases": supplier_purchases,
            "top_consumed_parts": top_consumed,
        })


class InventoryReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        warehouse_id = request.query_params.get("warehouse")
        status_filter = request.query_params.get("status")
        search = request.query_params.get("search")

        parts = SparePart.objects.select_related("category", "storage_location").all()

        if search:
            parts = parts.filter(
                models.Q(part_number__icontains=search) | models.Q(part_name__icontains=search)
            )

        if status_filter == "LOW_STOCK":
            parts = parts.filter(current_stock__lte=models.F("minimum_stock"), current_stock__gt=0)
        elif status_filter == "OUT_OF_STOCK":
            parts = parts.filter(current_stock=0)

        results = []
        for p in parts:
            if warehouse_id:
                wh_inv = WarehouseInventory.objects.filter(warehouse_id=warehouse_id, spare_part=p).first()
                wh_stock = wh_inv.current_stock if wh_inv else 0
            else:
                wh_stock = p.current_stock

            valuation = float(wh_stock * (p.cost_price or Decimal("0.00")))
            results.append({
                "id": p.id,
                "part_number": p.part_number,
                "part_name": p.part_name,
                "category": p.category.name if p.category else "—",
                "current_stock": wh_stock,
                "minimum_stock": p.minimum_stock,
                "maximum_stock": p.maximum_stock,
                "cost_price": float(p.cost_price or 0),
                "valuation": valuation,
                "status": "Out of Stock" if wh_stock == 0 else ("Low Stock" if wh_stock <= p.minimum_stock else "Optimal"),
            })

        return Response({"count": len(results), "results": results})


class PurchaseReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        supplier_id = request.query_params.get("supplier")
        status_filter = request.query_params.get("status")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        pos = PurchaseOrder.objects.select_related("supplier", "created_by").all()

        if supplier_id:
            pos = pos.filter(supplier_id=supplier_id)
        if status_filter:
            pos = pos.filter(status=status_filter)
        if date_from:
            pos = pos.filter(order_date__gte=date_from)
        if date_to:
            pos = pos.filter(order_date__lte=date_to)

        results = [
            {
                "id": po.id,
                "po_number": po.po_number,
                "supplier_name": po.supplier.company_name,
                "supplier_code": po.supplier.supplier_code,
                "order_date": str(po.order_date),
                "expected_delivery_date": str(po.expected_delivery_date) if po.expected_delivery_date else "—",
                "status": po.status,
                "total_amount": float(po.total_amount),
                "created_by": po.created_by.username if po.created_by else "—",
            }
            for po in pos.order_by("-order_date")
        ]

        total_spend = sum(r["total_amount"] for r in results)

        return Response({
            "count": len(results),
            "total_spend": float(total_spend),
            "results": results
        })


class WarehouseReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        warehouse_id = request.query_params.get("warehouse")

        warehouses = Warehouse.objects.all()
        if warehouse_id:
            warehouses = warehouses.filter(id=warehouse_id)

        wh_reports = []
        for wh in warehouses:
            inv_records = WarehouseInventory.objects.filter(warehouse=wh).select_related("spare_part")
            total_items = inv_records.count()
            total_units = sum(inv.current_stock for inv in inv_records)
            total_value = sum(inv.current_stock * (inv.spare_part.cost_price or Decimal("0.00")) for inv in inv_records)
            transfers_sent = StockTransfer.objects.filter(source_warehouse=wh).count()
            transfers_received = StockTransfer.objects.filter(destination_warehouse=wh).count()

            wh_reports.append({
                "id": wh.id,
                "warehouse_code": wh.warehouse_code,
                "name": wh.name,
                "city": wh.city,
                "status": wh.status,
                "total_items": total_items,
                "total_units": total_units,
                "total_value": float(total_value),
                "transfers_sent": transfers_sent,
                "transfers_received": transfers_received,
            })

        return Response({"count": len(wh_reports), "results": wh_reports})


class WorkOrderReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get("status")
        priority_filter = request.query_params.get("priority")
        technician_id = request.query_params.get("technician")

        wos = WorkOrder.objects.select_related("assigned_technician", "created_by").prefetch_related("items").all()

        if status_filter:
            wos = wos.filter(status=status_filter)
        if priority_filter:
            wos = wos.filter(priority=priority_filter)
        if technician_id:
            wos = wos.filter(assigned_technician_id=technician_id)

        results = []
        for wo in wos.order_by("-created_at"):
            total_requested = sum(i.requested_quantity for i in wo.items.all())
            total_issued = sum(i.issued_quantity for i in wo.items.all())

            results.append({
                "id": wo.id,
                "work_order_number": wo.work_order_number,
                "title": wo.title,
                "priority": wo.priority,
                "status": wo.status,
                "equipment_name": wo.equipment_name or "—",
                "location": wo.location or "—",
                "technician": wo.assigned_technician.username if wo.assigned_technician else "Unassigned",
                "total_requested": total_requested,
                "total_issued": total_issued,
                "created_at": wo.created_at.strftime("%Y-%m-%d"),
            })

        return Response({"count": len(results), "results": results})


class StockMovementReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        movement_type = request.query_params.get("movement_type")
        reference_type = request.query_params.get("reference_type")
        search = request.query_params.get("search")

        movements = StockMovement.objects.select_related("spare_part", "performed_by").all()

        if movement_type:
            movements = movements.filter(movement_type=movement_type)
        if reference_type:
            movements = movements.filter(reference_type=reference_type)
        if search:
            movements = movements.filter(
                models.Q(reference_number__icontains=search)
                | models.Q(spare_part__part_number__icontains=search)
                | models.Q(spare_part__part_name__icontains=search)
            )

        results = [
            {
                "id": m.id,
                "part_number": m.spare_part.part_number,
                "part_name": m.spare_part.part_name,
                "movement_type": m.movement_type,
                "reference_type": m.reference_type or "—",
                "reference_number": m.reference_number or "—",
                "quantity": m.quantity,
                "previous_stock": m.previous_stock,
                "new_stock": m.new_stock,
                "reason": m.reason or "—",
                "performed_by": m.performed_by.username if m.performed_by else "System",
                "timestamp": m.timestamp.strftime("%Y-%m-%d %H:%M"),
            }
            for m in movements.order_by("-timestamp")[:200]
        ]

        return Response({"count": len(results), "results": results})
