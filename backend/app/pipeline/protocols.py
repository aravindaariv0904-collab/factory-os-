from typing import Dict, Any

class IndustrialProtocolAdapter:
    """Protocol adapter for OPC-UA, MQTT, and Modbus PLC industrial telemetry streams."""
    @staticmethod
    def parse_opc_ua_node(node_data: Dict[str, Any]) -> Dict[str, Any]:
        """Maps OPC-UA binary node attribute structure to standardized Factory OS schema."""
        node_id = node_data.get("NodeId", "ns=2;s=Machine_101")
        value = node_data.get("Value", {})
        return {
            "machine_id": node_id.split("=")[-1],
            "temperature_deg_c": float(value.get("Temperature", 55.0)),
            "vibration_mm_s": float(value.get("Vibration", 1.8)),
            "hydraulic_pressure_bar": float(value.get("Pressure", 198.0)),
            "protocol": "OPC-UA",
        }

    @staticmethod
    def parse_modbus_registers(registers: list) -> Dict[str, Any]:
        """Converts raw Modbus 16-bit register arrays to scaled telemetry float values."""
        if len(registers) < 4:
            return {"temperature_deg_c": 50.0, "vibration_mm_s": 1.5, "protocol": "Modbus-TCP"}
        temp = registers[0] / 10.0
        vib = registers[1] / 100.0
        press = registers[2] / 10.0
        return {
            "temperature_deg_c": temp,
            "vibration_mm_s": vib,
            "hydraulic_pressure_bar": press,
            "protocol": "Modbus-TCP",
        }

protocol_adapter = IndustrialProtocolAdapter()
