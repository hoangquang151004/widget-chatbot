# task_bug_02 — BUG-AI-02: RAG không dùng Hybrid Search (BM25 bị bỏ qua)

**Ưu tiên**: 🔴 Critical  
**File cần sửa**: `apps/api/ai/vector_store.py`  
**Thời gian ước tính**: 45–60 phút  
**Phụ thuộc**: Không có — có thể làm song song với bug 01

---

## Mô tả bug

Khi upsert documents vào Qdrant, hệ thống lưu cả 2 vector:
- `"gemini-dense"` → dense embedding (kích thước `settings.EMBEDDING_DIM`, mặc định 3072 — Gemini)
- `"bm25"` → sparse embedding (BM25/TF-IDF, FastEmbed)

Nhưng khi search, chỉ dùng dense vector:

```python
# HIỆN TẠI — chỉ search dense, bỏ qua BM25
results = await client.search(
    collection_name=self.collection_name,
    query_vector=("gemini-dense", dense_vec),  # ← Chỉ dense
    query_filter=tenant_filter,
    limit=limit,
)
```

**Hậu quả**: Chất lượng retrieval thấp hơn đáng kể so với hybrid. BM25 đặc biệt tốt với:
- Câu hỏi có từ khóa chính xác (tên sản phẩm, mã số, tên riêng)
- Câu hỏi ngắn
- Nội dung kỹ thuật/chuyên ngành

---

## Giải pháp: Dùng `query_points` với prefetch + RRF fusion

Qdrant hỗ trợ hybrid search qua `query_points()` với 2 prefetch queries (dense + sparse) và fusion bằng RRF (Reciprocal Rank Fusion).

### Cấu trúc Hybrid Search

```
Query
  ├── Prefetch 1: Dense vector (gemini-dense) → top 20 results
  ├── Prefetch 2: Sparse vector (BM25) → top 20 results
  └── Fusion: RRF → rerank → top K results
```

---

## Code cần thay trong `vector_store.py`

### Bước 1: Thêm import

```python
# Thêm vào đầu file, sau các import hiện có
from qdrant_client.models import (
    # ... các import đã có ...
    Prefetch,       # ← MỚI
    Query,          # ← MỚI  
    FusionQuery,    # ← MỚI
    Fusion,         # ← MỚI
    SparseVector as QdrantSparseVector,
)
```

> **Lưu ý**: Các class `Prefetch`, `Query`, `FusionQuery`, `Fusion` có trong `qdrant-client >= 1.7.0`.
> Kiểm tra version: `pip show qdrant-client`. Nếu cần: `pip install "qdrant-client>=1.7.0"`.

### Bước 2: Thay toàn bộ method `search()`

```python
async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Hybrid search: Dense (gemini-dense) + Sparse (BM25) với RRF fusion."""
    client = await self.get_client()
    tenant_filter = self._get_tenant_filter()

    # 1. Dense embedding
    dense_vec = await gemini_manager.aget_embeddings(query, task_type="RETRIEVAL_QUERY")

    # 2. Sparse embedding (BM25)
    sparse_model = self.get_sparse_model()
    sparse_results = list(sparse_model.embed([query]))
    sparse_vec = sparse_results[0]

    try:
        # 3. Hybrid search với RRF fusion
        results = await client.query_points(
            collection_name=self.collection_name,
            prefetch=[
                Prefetch(
                    query=dense_vec,
                    using="gemini-dense",
                    filter=tenant_filter,
                    limit=limit * 3,   # Lấy nhiều hơn để RRF có đủ candidates
                ),
                Prefetch(
                    query=QdrantSparseVector(
                        indices=sparse_vec.indices.tolist(),
                        values=sparse_vec.values.tolist(),
                    ),
                    using="bm25",
                    filter=tenant_filter,
                    limit=limit * 3,
                ),
            ],
            query=FusionQuery(fusion=Fusion.RRF),   # Reciprocal Rank Fusion
            limit=limit,
            with_payload=True,
        )

        return [
            {
                "id": hit.id,
                "score": hit.score,
                "text": hit.payload.get("text", ""),
                "metadata": hit.payload,
            }
            for hit in results.points
            if hit.score >= settings.RAG_SIMILARITY_THRESHOLD
        ]

    except Exception as e:
        logger.error("Hybrid search failed: %s. Falling back to dense-only.", str(e))
        # Fallback về dense-only nếu hybrid thất bại
        return await self._dense_only_search(dense_vec, tenant_filter, limit)

async def _dense_only_search(
    self,
    dense_vec: List[float],
    tenant_filter,
    limit: int,
) -> List[Dict[str, Any]]:
    """Fallback: chỉ dùng dense vector khi hybrid search thất bại."""
    client = await self.get_client()
    try:
        results = await client.search(
            collection_name=self.collection_name,
            query_vector=("gemini-dense", dense_vec),
            query_filter=tenant_filter,
            limit=limit,
        )
        return [
            {
                "id": hit.id,
                "score": hit.score,
                "text": hit.payload.get("text", ""),
                "metadata": hit.payload,
            }
            for hit in results
            if hit.score >= settings.RAG_SIMILARITY_THRESHOLD
        ]
    except Exception as e:
        logger.error("Dense-only fallback also failed: %s", str(e))
        return []
```

---

## Xử lý version qdrant-client

### Kiểm tra version hiện tại

```bash
cd apps/api
.venv\Scripts\pip show qdrant-client
```

### Nếu version < 1.7.0, cần upgrade

```bash
cd apps/api
.venv\Scripts\pip install "qdrant-client>=1.7.0" --upgrade
# Sau đó cập nhật requirements.txt:
.venv\Scripts\pip freeze | grep qdrant >> requirements_new.txt
```

### Nếu không muốn upgrade (alternative approach)

Dùng `client.search_batch()` thay vì `query_points()`:

```python
# Alternative: search_batch (hoạt động với version cũ hơn)
async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    client = await self.get_client()
    tenant_filter = self._get_tenant_filter()
    dense_vec = await gemini_manager.aget_embeddings(query, task_type="RETRIEVAL_QUERY")
    sparse_model = self.get_sparse_model()
    sparse_vec = list(sparse_model.embed([query]))[0]

    try:
        from qdrant_client.models import SearchRequest
        batch_results = await client.search_batch(
            collection_name=self.collection_name,
            requests=[
                SearchRequest(
                    vector=("gemini-dense", dense_vec),
                    filter=tenant_filter,
                    limit=limit * 2,
                    with_payload=True,
                ),
                SearchRequest(
                    vector=("bm25", QdrantSparseVector(
                        indices=sparse_vec.indices.tolist(),
                        values=sparse_vec.values.tolist(),
                    )),
                    filter=tenant_filter,
                    limit=limit * 2,
                    with_payload=True,
                ),
            ]
        )
        
        # Manual RRF fusion
        return self._rrf_merge(batch_results[0], batch_results[1], limit)
    
    except Exception as e:
        logger.error("Hybrid search_batch failed: %s", str(e))
        return []

def _rrf_merge(self, dense_hits, sparse_hits, limit: int, k: int = 60) -> List[Dict]:
    """Reciprocal Rank Fusion của 2 danh sách kết quả."""
    scores = {}
    
    for rank, hit in enumerate(dense_hits):
        doc_id = str(hit.id)
        scores[doc_id] = scores.get(doc_id, {"score": 0, "hit": hit})
        scores[doc_id]["score"] += 1.0 / (k + rank + 1)
    
    for rank, hit in enumerate(sparse_hits):
        doc_id = str(hit.id)
        if doc_id not in scores:
            scores[doc_id] = {"score": 0, "hit": hit}
        scores[doc_id]["score"] += 1.0 / (k + rank + 1)
    
    sorted_results = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    
    return [
        {
            "id": item["hit"].id,
            "score": item["score"],
            "text": item["hit"].payload.get("text", ""),
            "metadata": item["hit"].payload,
        }
        for item in sorted_results[:limit]
        if item["score"] >= settings.RAG_SIMILARITY_THRESHOLD / 10  # RRF scores nhỏ hơn cosine
    ]
```

---

## Kiểm tra sau khi sửa

### Test 1: Xác nhận hybrid search chạy (xem log)

```bash
# Sau khi restart backend, gửi câu hỏi bất kỳ liên quan đến tài liệu
curl -X POST http://localhost:8001/api/v1/chat/stream \
  -H "X-Widget-Key: $PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "sản phẩm nào đang có khuyến mãi?", "session_id": "test-bug02"}'

# Trong log backend phải thấy KHÔNG có lỗi "Hybrid search failed"
# Và response phải có citations từ tài liệu đã upload
```

### Test 2: So sánh chất lượng với câu hỏi từ khóa chính xác

Tạo test script đơn giản:

```python
# test_hybrid_search.py (chạy ở apps/api/)
import asyncio
from ai.vector_store import SaaSVectorStore

async def main():
    TENANT_ID = "your-tenant-uuid-here"
    store = SaaSVectorStore(TENANT_ID)
    
    # Test với câu hỏi chứa từ khóa chính xác
    results = await store.search("điều 5 hợp đồng", limit=3)
    print(f"Kết quả: {len(results)} hits")
    for r in results:
        print(f"  Score: {r['score']:.4f} | {r['text'][:100]}")

asyncio.run(main())
```

### Test 3: Kiểm tra không bị lỗi khi BM25 model load lần đầu

Lần đầu chạy, FastEmbed sẽ download model BM25 (~50MB). Kiểm tra log:

```
INFO:ai.vector_store:Loading FastEmbed BM25 model...
```

Nếu thấy dòng này → bình thường, chờ download xong.

---

## Lưu ý quan trọng

1. **Không xóa Qdrant collection**: BM25 vector đã được lưu khi upsert. Chỉ cần sửa query method.

2. **RAG_SIMILARITY_THRESHOLD trong `.env`**: Khi dùng RRF fusion, score sẽ khác (nhỏ hơn cosine similarity). Nếu kết quả rỗng, có thể cần điều chỉnh:
   ```env
   RAG_SIMILARITY_THRESHOLD=0.0  # Tắt filter score khi dùng RRF
   ```

3. **Fallback**: Code đã có fallback về dense-only nếu hybrid thất bại, nên không bao giờ crash.

---

## Checklist hoàn thành

- [ ] Kiểm tra version `qdrant-client` (`pip show qdrant-client`)
- [ ] Thêm imports (`Prefetch`, `FusionQuery`, `Fusion` hoặc dùng alternative)
- [ ] Thay thế method `search()` bằng hybrid version
- [ ] Thêm method `_dense_only_search()` làm fallback (hoặc `_rrf_merge()` nếu dùng alternative)
- [ ] Restart backend
- [ ] Gửi câu hỏi → kiểm tra log không có lỗi hybrid search
- [ ] Chạy `test_hybrid_search.py` → có kết quả
- [ ] Kiểm tra `RAG_SIMILARITY_THRESHOLD` nếu kết quả rỗng
- [ ] Cập nhật `PROGRESS.md`: BUG-AI-02 → ✅ FIXED
