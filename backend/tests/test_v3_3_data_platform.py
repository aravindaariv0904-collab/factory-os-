from backend.app.pipeline.protocols import protocol_adapter
from backend.app.feature_store.store import feature_store
from backend.app.pipeline.synthetic_generator import synthetic_generator

def test_opc_ua_modbus_parsing():
    opc_res = protocol_adapter.parse_opc_ua_node({"NodeId": "ns=2;s=Machine_104", "Value": {"Temperature": 78.5, "Vibration": 6.2}})
    assert opc_res["machine_id"] == "Machine_104"
    assert opc_res["temperature_deg_c"] == 78.5

    mod_res = protocol_adapter.parse_modbus_registers([550, 240, 2000, 0])
    assert mod_res["temperature_deg_c"] == 55.0
    assert mod_res["vibration_mm_s"] == 2.4

def test_feature_store_online_offline():
    feature_store.push_features("mch_101", {"temp_rolling": 54.2, "vib_rolling": 1.8})
    online = feature_store.get_online_features("mch_101")
    assert online["temp_rolling"] == 54.2

    offline = feature_store.get_offline_features("mch_101")
    assert len(offline) >= 1

def test_synthetic_data_generator():
    batch = synthetic_generator.generate_telemetry_batch(3)
    assert len(batch) == 3
    assert "computed_health_index" in batch[0]
