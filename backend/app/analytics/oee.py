from typing import Dict, Any

class OEEAnalyticsEngine:
    """Enterprise Overall Equipment Effectiveness (OEE) Analytics Engine."""
    @staticmethod
    def calculate_machine_oee(
        planned_time_mins: float = 480.0,
        unplanned_downtime_mins: float = 24.0,
        ideal_cycle_time_secs: float = 12.0,
        total_parts_produced: int = 2200,
        defective_parts: int = 35,
    ) -> Dict[str, Any]:
        operating_time_mins = max(0.0, planned_time_mins - unplanned_downtime_mins)
        availability = round(operating_time_mins / planned_time_mins, 4) if planned_time_mins > 0 else 0.0

        # Max possible parts during operating time
        ideal_parts_possible = (operating_time_mins * 60.0) / ideal_cycle_time_secs if ideal_cycle_time_secs > 0 else 1.0
        performance = round(min(1.0, total_parts_produced / ideal_parts_possible), 4)

        good_parts = max(0, total_parts_produced - defective_parts)
        quality = round(good_parts / total_parts_produced, 4) if total_parts_produced > 0 else 0.0

        oee_percent = round(availability * performance * quality * 100.0, 1)

        return {
            "oee_percent": oee_percent,
            "availability_percent": round(availability * 100.0, 1),
            "performance_percent": round(performance * 100.0, 1),
            "quality_percent": round(quality * 100.0, 1),
            "good_parts": good_parts,
            "defective_parts": defective_parts,
            "unplanned_downtime_mins": unplanned_downtime_mins,
            "world_class_benchmark": 85.0,
        }

oee_engine = OEEAnalyticsEngine()
