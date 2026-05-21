import httpx
import os
from typing import Optional, List, Any


class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
        self.headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _rest(self, path: str) -> str:
        return f"{self.url}/rest/v1/{path}"

    async def select(self, table: str, filters: str = "", limit: int = 100) -> List[dict]:
        url = self._rest(table)
        params = {"limit": limit}
        if filters:
            for f in filters.split("&"):
                if "=" in f:
                    k, v = f.split("=", 1)
                    params[k] = v
        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=self.headers, params=params)
            r.raise_for_status()
            return r.json()

    async def insert(self, table: str, data: dict | list) -> Any:
        async with httpx.AsyncClient() as client:
            r = await client.post(self._rest(table), headers=self.headers, json=data)
            r.raise_for_status()
            return r.json()

    async def update(self, table: str, filters: str, data: dict) -> Any:
        params = {}
        for f in filters.split("&"):
            if "=" in f:
                k, v = f.split("=", 1)
                params[k] = v
        async with httpx.AsyncClient() as client:
            r = await client.patch(
                self._rest(table), headers=self.headers, params=params, json=data
            )
            r.raise_for_status()
            return r.json()

    async def upsert(self, table: str, data: dict | list) -> Any:
        headers = {**self.headers, "Prefer": "resolution=merge-duplicates,return=representation"}
        async with httpx.AsyncClient() as client:
            r = await client.post(self._rest(table), headers=headers, json=data)
            r.raise_for_status()
            return r.json()


db = SupabaseService()
