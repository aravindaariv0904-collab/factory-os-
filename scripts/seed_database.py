"""Seed the Factory OS database with realistic demo data.

Usage (from repo root):
    python scripts/seed_database.py
"""
import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from backend.app.db.session import AsyncSessionLocal, init_db
from backend.app.core.security import get_password_hash
from backend.app.models import (
    Organization,
    Factory,
    User,
    Machine,
    ProductionOrder,
    DowntimeEvent,
    MaintenanceLog,
    InventoryItem,
    QualityReport,
    Alert,
    Recommendation,
)

FACTORY_ORG_ID = "11111111-1111-1111-1111-111111111111"

FACTORY_IDS = {
    "alpha": "22222222-2222-2222-2222-222222222221",
    "stuttgart": "22222222-2222-2222-2222-222222222222",
    "yokohama": "22222222-2222-2222-2222-222222222223",
}

MACHINES = [
    {
        "id": "33333333-3333-3333-3333-333333333301",
        "name": "KUKA Titan Robot Arm Alpha",
        "code": "ROB-4011",
        "type": "6-Axis Heavy Payload Manipulator",
        "manufacturer": "KUKA",
        "line": "Line 1 - Body Stamping",
        "status": "Running",
        "oee": 89.2,
        "availability": 94.5,
        "performance": 96.1,
        "quality": 98.0,
        "temperature": 64.2,
        "vibration": 2.1,
        "rul_hours": 420.0,
        "health_score": 92.0,
    },
    {
        "id": "33333333-3333-3333-3333-333333333302",
        "name": "DMG MORI 5-Axis CNC Mill X5",
        "code": "CNC-5012",
        "type": "High-Precision CNC Workcenter",
        "manufacturer": "DMG MORI",
        "line": "Line 4 - Gearbox Machining",
        "status": "Down",
        "oee": 45.0,
        "availability": 50.0,
        "performance": 92.0,
        "quality": 97.8,
        "temperature": 84.1,
        "vibration": 8.9,
        "rul_hours": 0.0,
        "health_score": 32.0,
    },
    {
        "id": "33333333-3333-3333-3333-333333333303",
        "name": "Trumpf Laser Weld Cell 03",
        "code": "LWC-3003",
        "type": "Laser Welding Cell",
        "manufacturer": "Trumpf",
        "line": "Line 2 - Battery Enclosure",
        "status": "Running",
        "oee": 91.0,
        "availability": 96.2,
        "performance": 95.4,
        "quality": 99.1,
        "temperature": 58.0,
        "vibration": 1.4,
        "rul_hours": 610.0,
        "health_score": 95.0,
    },
    {
        "id": "33333333-3333-3333-3333-333333333304",
        "name": "Fanuc Assembly Robot R-2000iC",
        "code": "ASM-2100",
        "type": "Assembly Robot",
        "manufacturer": "Fanuc",
        "line": "Line 3 - Final Assembly",
        "status": "Running",
        "oee": 87.7,
        "availability": 92.8,
        "performance": 96.0,
        "quality": 98.4,
        "temperature": 49.5,
        "vibration": 1.8,
        "rul_hours": 355.0,
        "health_score": 88.0,
    },
    {
        "id": "33333333-3333-3333-3333-333333333305",
        "name": "Siemens Servo Press Line P-2",
        "code": "PRS-2200",
        "type": "Servo Press",
        "manufacturer": "Siemens",
        "line": "Line 5 - Stamping",
        "status": "Maintenance",
        "oee": 72.3,
        "availability": 80.0,
        "performance": 91.5,
        "quality": 98.8,
        "temperature": 71.0,
        "vibration": 4.2,
        "rul_hours": 140.0,
        "health_score": 61.0,
    },
    {
        "id": "33333333-3333-3333-3333-333333333306",
        "name": "ABB Palletizer IRB 660",
        "code": "PAL-3660",
        "type": "Palletizing Robot",
        "manufacturer": "ABB",
        "line": "Line 6 - Packing",
        "status": "Running",
        "oee": 93.4,
        "availability": 97.1,
        "performance": 96.8,
        "quality": 99.3,
        "temperature": 52.0,
        "vibration": 1.1,
        "rul_hours": 780.0,
        "health_score": 97.0,
    },
]

INVENTORY = [
    {
        "id": "44444444-4444-4444-4444-444444444401",
        "sku": "RAW-ALU-6061-T6",
        "item_name": "Structural Aluminum Sheets 6061-T6 (2mm)",
        "category": "Raw Material",
        "quantity": 4200,
        "min_threshold": 1500,
        "max_capacity": 10000,
        "unit_cost": 145.0,
        "location": "Bay A-14, Rack 02",
        "supplier": "Alcoa Global Metals Inc.",
        "status": "Optimal",
        "lead_time_days": 4,
    },
    {
        "id": "44444444-4444-4444-4444-444444444402",
        "sku": "BRG-SP-6205-2RS",
        "item_name": "Deep Groove Ball Bearing 6205-2RS",
        "category": "Spare Parts",
        "quantity": 8,
        "min_threshold": 25,
        "max_capacity": 120,
        "unit_cost": 18.5,
        "location": "Bay B-02, Rack 11",
        "supplier": "SKF Bearings",
        "status": "Critical Reorder",
        "lead_time_days": 7,
    },
    {
        "id": "44444444-4444-4444-4444-444444444403",
        "sku": "FLT-SE-7500X",
        "item_name": "High-Pressure Hydraulic Filter 7500X",
        "category": "Components",
        "quantity": 62,
        "min_threshold": 30,
        "max_capacity": 200,
        "unit_cost": 42.0,
        "location": "Bay C-05, Rack 07",
        "supplier": "Parker Hannifin",
        "status": "Optimal",
        "lead_time_days": 3,
    },
    {
        "id": "44444444-4444-4444-4444-444444444404",
        "sku": "FG-EV-BAT-CELL",
        "item_name": "EV Battery Cell Module (21700)",
        "category": "Finished Goods",
        "quantity": 1520,
        "min_threshold": 400,
        "max_capacity": 5000,
        "unit_cost": 88.0,
        "location": "Bay D-01, Rack 03",
        "supplier": "Internal Assembly",
        "status": "Optimal",
        "lead_time_days": 0,
    },
]


async def seed() -> None:
    await init_db()

    async with AsyncSessionLocal() as session:
        existing = (await session.execute(select(Organization).limit(1))).scalars().first()
        if existing:
            print("Database already seeded - skipping.")
            return

        now = datetime.utcnow()

        org = Organization(
            id=FACTORY_ORG_ID,
            name="FactoryOS Global Manufacturing Group",
            subscription_plan="enterprise",
            metadata_json={"region": "Global", "tier": "platinum"},
        )
        session.add(org)

        factories = [
            Factory(
                id=FACTORY_IDS["alpha"],
                organization_id=FACTORY_ORG_ID,
                name="Detroit Giga-Assembly Plant Alpha",
                location="Detroit, MI, USA",
                type="Automotive EV Manufacturing",
                metadata_json={"lines": 8, "active_machines": 42},
                oee_target="87.4",
            ),
            Factory(
                id=FACTORY_IDS["stuttgart"],
                organization_id=FACTORY_ORG_ID,
                name="Stuttgart Precision Fab #4",
                location="Stuttgart, Germany",
                type="Robotic Powertrain Assembly",
                metadata_json={"lines": 6, "active_machines": 34},
                oee_target="91.2",
            ),
            Factory(
                id=FACTORY_IDS["yokohama"],
                organization_id=FACTORY_ORG_ID,
                name="Yokohama High-Tech Micro-Fab",
                location="Yokohama, Japan",
                type="Semiconductor Sensor Packaging",
                metadata_json={"lines": 12, "active_machines": 68},
                oee_target="79.8",
            ),
        ]
        session.add_all(factories)

        session.add(
            User(
                id="55555555-5555-5555-5555-555555555501",
                organization_id=FACTORY_ORG_ID,
                factory_id=FACTORY_IDS["alpha"],
                email="alexander.vance@factoryos.ai",
                hashed_password=get_password_hash("password123"),
                full_name="Alexander Vance",
                role="Plant Manager",
                is_active=True,
            )
        )
        session.add(
            User(
                id="55555555-5555-5555-5555-555555555502",
                organization_id=FACTORY_ORG_ID,
                factory_id=FACTORY_IDS["alpha"],
                email="operator@factoryos.ai",
                hashed_password=get_password_hash("password123"),
                full_name="Demo Operator",
                role="Operator",
                is_active=True,
            )
        )

        machines = [
            Machine(
                **{k: v for k, v in m.items() if k != "id"},
                id=m["id"],
                plant_id=FACTORY_IDS["alpha"],
                last_maintenance=now - timedelta(days=30),
            )
            for m in MACHINES
        ]
        session.add_all(machines)

        session.add_all(
            [
                ProductionOrder(
                    id="66666666-6666-6666-6666-666666666601",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    order_number="PO-2026-8801",
                    product_name="Model-S EV Battery Housing Enclosure",
                    sku="SKU-EV-BAT-9002",
                    target_quantity=1200,
                    produced_quantity=980,
                    defective_quantity=14,
                    line="Line 2 - Battery Enclosure",
                    status="In Progress",
                    oee=92.4,
                ),
                ProductionOrder(
                    id="66666666-6666-6666-6666-666666666602",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    order_number="PO-2026-8802",
                    product_name="Gigacast Rear Chassis Assembly",
                    sku="SKU-GC-5011",
                    target_quantity=850,
                    produced_quantity=850,
                    defective_quantity=6,
                    line="Line 1 - Body Stamping",
                    status="Completed",
                    oee=94.1,
                ),
                ProductionOrder(
                    id="66666666-6666-6666-6666-666666666603",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    order_number="PO-2026-8803",
                    product_name="Front Subframe Module",
                    sku="SKU-FS-2201",
                    target_quantity=1500,
                    produced_quantity=410,
                    defective_quantity=22,
                    line="Line 3 - Final Assembly",
                    status="Delayed",
                    oee=71.8,
                ),
            ]
        )

        session.add(
            DowntimeEvent(
                id="77777777-7777-7777-7777-777777777701",
                organization_id=FACTORY_ORG_ID,
                factory_id=FACTORY_IDS["alpha"],
                machine_id=MACHINES[1]["id"],
                machine_name="DMG MORI 5-Axis CNC Mill X5",
                reason="Spindle Bearing Thermal Overheating & Excessive Vibration",
                category="Unplanned Mechanical",
                duration_minutes=145,
                impact_cost=18500.0,
                status="Investigating",
            )
        )
        session.add(
            DowntimeEvent(
                id="77777777-7777-7777-7777-777777777702",
                organization_id=FACTORY_ORG_ID,
                factory_id=FACTORY_IDS["alpha"],
                machine_id=MACHINES[4]["id"],
                machine_name="Siemens Servo Press Line P-2",
                reason="Tooling Change - Stamping Die Replacement",
                category="Tooling Change",
                duration_minutes=38,
                impact_cost=4200.0,
                status="Resolved",
            )
        )

        session.add_all(
            [
                MaintenanceLog(
                    id="88888888-8888-8888-8888-888888888801",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[4]["id"],
                    type="planned",
                    description="Preventive spindle inspection and lubrication",
                    cost=1500.0,
                    duration_minutes=90,
                    performed_by="Maintenance Crew #2",
                    work_order_id="WO-8901",
                ),
                MaintenanceLog(
                    id="88888888-8888-8888-8888-888888888802",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[1]["id"],
                    type="unplanned",
                    description="Emergency bearing replacement after vibration spike",
                    cost=7200.0,
                    duration_minutes=145,
                    performed_by="Maintenance Crew #1",
                    work_order_id="WO-8902",
                ),
            ]
        )

        session.add_all(
            [
                InventoryItem(
                    **{k: v for k, v in i.items() if k != "id"},
                    id=i["id"],
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                )
                for i in INVENTORY
            ]
        )

        session.add_all(
            [
                QualityReport(
                    id="99999999-9999-9999-9999-999999999901",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[2]["id"],
                    batch_id="PO-2026-8801-B1",
                    defect_type="Weld Fault",
                    severity="Major",
                    inspection_type="AI Vision",
                    status="Quarantined",
                ),
                QualityReport(
                    id="99999999-9999-9999-9999-999999999902",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[0]["id"],
                    batch_id="PO-2026-8801-B2",
                    defect_type="Dimensional Deviation",
                    severity="Minor",
                    inspection_type="Laser Scanner",
                    status="Reworked",
                ),
            ]
        )

        session.add_all(
            [
                Alert(
                    id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[1]["id"],
                    title="CNC Mill X5 Vibration Spike (8.9 mm/s)",
                    message="Telemetry exceeded ISO 10816 class III threshold.",
                    severity="critical",
                    is_read=False,
                    is_resolved=False,
                ),
                Alert(
                    id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[4]["id"],
                    title="Servo Press P-2 Tool Wear Detected",
                    message="Predictive model indicates 82% bearing wear probability.",
                    severity="warning",
                    is_read=True,
                    is_resolved=False,
                ),
                Alert(
                    id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=None,
                    title="BRG-SP-6205-2RS Below Reorder Threshold",
                    message="Spare bearing stock fell below minimum threshold.",
                    severity="warning",
                    is_read=False,
                    is_resolved=False,
                ),
            ]
        )

        session.add_all(
            [
                Recommendation(
                    id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[1]["id"],
                    title="Schedule Preventive Spindle Bearing Replacement on CNC Mill X5",
                    description="Vibration telemetry detected 3.8x baseline harmonic anomaly.",
                    target_entity=MACHINES[1]["name"],
                    category="Predictive Maintenance",
                    impact_score="High",
                    estimated_savings=42000.0,
                    confidence_score=0.96,
                    status="New",
                    actions=["Issue Work Order #WO-8902"],
                    agent_id="maintenance_agent",
                ),
                Recommendation(
                    id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
                    organization_id=FACTORY_ORG_ID,
                    factory_id=FACTORY_IDS["alpha"],
                    machine_id=MACHINES[4]["id"],
                    title="Rebalance Shift Load Across Lines 1-3",
                    description="Evening shift OEE dropped 4.2% due to imbalance.",
                    target_entity="Line 1 - Body Stamping",
                    category="Process Optimization",
                    impact_score="Medium",
                    estimated_savings=12500.0,
                    confidence_score=0.87,
                    status="In Review",
                    actions=["Reassign 2 operators to Line 3"],
                    agent_id="root_cause_agent",
                ),
            ]
        )

        await session.commit()
        print("Factory OS database seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
