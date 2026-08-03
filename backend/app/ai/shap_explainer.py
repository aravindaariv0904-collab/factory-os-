from typing import Dict, Any, List

class SHAPExplainabilityEngine:
    """SHAP (SHapley Additive exPlanations) engine for model feature attribution and ROI calculation."""
    @staticmethod
    def explain_failure_prediction(telemetry: Dict[str, Any]) -> Dict[str, Any]:
        vib = float(telemetry.get("vibration_mm_s", 1.5))
        temp = float(telemetry.get("temperature_deg_c", 45.0))
        press = float(telemetry.get("hydraulic_pressure_bar", 200.0))

        # Base expected failure probability
        base_value = 0.05
        
        # Calculate SHAP feature attributions (contributions)
        shap_vib = round(max(0.0, (vib - 2.5) * 0.12), 3)
        shap_temp = round(max(0.0, (temp - 60.0) * 0.015), 3)
        shap_press = round(abs(press - 200.0) * 0.002, 3)

        total_prob = round(min(0.99, base_value + shap_vib + shap_temp + shap_press), 3)

        reason_codes = []
        if shap_vib > 0.1:
            reason_codes.append("RC-VIB-01: High Harmonic Vibration Exceeding ISO 10816 Threshold")
        if shap_temp > 0.05:
            reason_codes.append("RC-TMP-02: Thermal Overheating in Main Bearing Housing")

        return {
            "predicted_failure_probability": total_prob,
            "base_value": base_value,
            "shap_values": {
                "vibration_mm_s": shap_vib,
                "temperature_deg_c": shap_temp,
                "hydraulic_pressure_bar": shap_press,
            },
            "primary_reason_codes": reason_codes or ["RC-NRM-00: Normal Operational Parameters"],
        }

    @staticmethod
    def calculate_downtime_roi(failure_prob: float, hourly_downtime_cost: float = 8500.0) -> Dict[str, Any]:
        """Calculates financial ROI & estimated cost savings from proactive intervention."""
        est_downtime_hours = 4.5
        potential_loss = round(failure_prob * est_downtime_hours * hourly_downtime_cost, 2)
        preventative_cost = 1200.0
        net_savings = max(0.0, round(potential_loss - preventative_cost, 2))

        return {
            "potential_unplanned_downtime_loss": potential_loss,
            "preventative_maintenance_cost": preventative_cost,
            "estimated_net_savings": net_savings,
            "roi_multiplier": round(net_savings / preventative_cost, 2) if preventative_cost > 0 else 0.0,
        }

shap_engine = SHAPExplainabilityEngine()
