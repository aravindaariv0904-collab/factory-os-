from typing import Dict, Any, List

class DigitalTwinEngine:
    """Asset Topology Graph and Failure Propagation Simulator for Factory OS Digital Twin."""
    def __init__(self):
        self.topology = {
            "fact_01": {
                "name": "Stuttgart Smart Production Plant",
                "lines": {
                    "line_A": {
                        "name": "Body Stamping Line A",
                        "machines": ["mch_101", "mch_102", "mch_104"],
                        "dependencies": {
                            "mch_101": ["mch_102"],
                            "mch_102": ["mch_104"],
                            "mch_104": [],
                        },
                    }
                },
            }
        }

    def simulate_failure_propagation(self, machine_id: str) -> Dict[str, Any]:
        """Simulates upstream and downstream bottleneck failure propagation across the plant graph."""
        impacted_downstream = []
        if machine_id == "mch_101":
            impacted_downstream = ["mch_102", "mch_104"]
        elif machine_id == "mch_102":
            impacted_downstream = ["mch_104"]

        return {
            "origin_machine_id": machine_id,
            "status": "Critical Seizure Risk",
            "downstream_impacted_machines": impacted_downstream,
            "line_throughput_impact_percent": 100.0 if machine_id == "mch_101" else 65.0,
            "estimated_recovery_time_hours": 3.5,
        }

digital_twin_engine = DigitalTwinEngine()
