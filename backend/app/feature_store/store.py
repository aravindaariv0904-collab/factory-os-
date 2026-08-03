from typing import Dict, Any, List, Optional
import time

class CentralizedFeatureStore:
    """Centralized Feature Store providing Online low-latency features and Offline historical joins."""
    def __init__(self):
        self._online_store: Dict[str, Dict[str, Any]] = {}
        self._offline_history: List[Dict[str, Any]] = []

    def push_features(self, entity_id: str, feature_dict: Dict[str, Any]):
        timestamp = time.time()
        record = {"entity_id": entity_id, "timestamp": timestamp, **feature_dict}
        self._online_store[entity_id] = record
        self._offline_history.append(record)

    def get_online_features(self, entity_id: str) -> Optional[Dict[str, Any]]:
        return self._online_store.get(entity_id)

    def get_offline_features(self, entity_id: str) -> List[Dict[str, Any]]:
        return [r for r in self._offline_history if r["entity_id"] == entity_id]

feature_store = CentralizedFeatureStore()
