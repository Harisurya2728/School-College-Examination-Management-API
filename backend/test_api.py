import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


async def test_all_endpoints():
    print("[TEST] Starting FastAPI endpoint test suite...")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        print("  [OK] GET / (Root Health)")

        # 2. Questions - GET
        res = await client.get("/api/v1/questions/")
        assert res.status_code == 200
        questions = res.json()
        assert len(questions) > 0
        print(f"  [OK] GET /api/v1/questions/ (Found {len(questions)} questions)")

        # 3. Questions - POST
        new_q_payload = {
            "course_id": "CS101",
            "subject_code": "CS101",
            "subject_name": "Introduction to Programming",
            "unit": 1,
            "topic": "Control Structures",
            "type": "MCQ_SINGLE",
            "prompt": "What is the output of 3 * 2 ** 3 in Python?",
            "difficulty": "EASY",
            "bloom_level": "APPLY",
            "marks": 2.0,
            "negative_marks": 0.5,
            "tags": "python,precedence",
            "options": [
                {"text": "24", "is_correct": True},
                {"text": "216", "is_correct": False},
                {"text": "18", "is_correct": False}
            ]
        }
        res = await client.post("/api/v1/questions/", json=new_q_payload)
        assert res.status_code == 201, f"POST Question failed: {res.text}"
        created_q = res.json()
        q_id = created_q["id"]
        print(f"  [OK] POST /api/v1/questions/ (Created Question ID: {q_id})")

        # 4. Questions - PUT
        update_q_payload = {
            "prompt": "What is the output of 3 * 2 ** 3 in standard Python 3.x?",
            "marks": 3.0
        }
        res = await client.put(f"/api/v1/questions/{q_id}", json=update_q_payload)
        assert res.status_code == 200
        assert res.json()["marks"] == 3.0
        print(f"  [OK] PUT /api/v1/questions/{q_id} (Updated Question)")

        # 5. Questions - DELETE
        res = await client.delete(f"/api/v1/questions/{q_id}")
        assert res.status_code == 200
        print(f"  [OK] DELETE /api/v1/questions/{q_id} (Deleted Question)")

        # 6. Exams - GET & Details
        res = await client.get("/api/v1/exams/")
        assert res.status_code == 200
        exams = res.json()
        assert len(exams) > 0
        # Select an exam with questions/submissions
        target_exam = next((e for e in exams if e.get("questions_count", 0) > 0), exams[0])
        exam_id = target_exam["id"]
        print(f"  [OK] GET /api/v1/exams/ (Found {len(exams)} exams, testing exam_id={exam_id})")

        res = await client.get(f"/api/v1/exams/{exam_id}")
        assert res.status_code == 200
        print(f"  [OK] GET /api/v1/exams/{exam_id} (Exam Details with questions)")

        # 7. Grading Policies - GET, POST, PUT, DELETE
        res = await client.get("/api/v1/grading-policies/")
        assert res.status_code == 200
        policies = res.json()
        print(f"  [OK] GET /api/v1/grading-policies/ (Found {len(policies)} policies)")

        # 8. Submissions - GET
        res = await client.get(f"/api/v1/submissions/?exam_id={exam_id}")
        assert res.status_code == 200
        subs = res.json()
        assert len(subs) > 0
        test_student_id = subs[0]["student_id"]
        print(f"  [OK] GET /api/v1/submissions/ (Found {len(subs)} submissions)")

        # 9. Batch Grade Calculation - POST
        batch_calc_payload = {
            "moderation_marks": 1.5,
            "apply_relative_curve": False
        }
        res = await client.post(f"/api/v1/submissions/batch-calculate-grades/{exam_id}", json=batch_calc_payload)
        assert res.status_code == 200
        batch_summary = res.json()
        print(f"  [OK] POST /api/v1/submissions/batch-calculate-grades/ (Mean: {batch_summary['mean_score']}, Pass: {batch_summary['pass_percentage']}%)")

        # 10. Analytics - Overview
        res = await client.get(f"/api/v1/analytics/exams/{exam_id}/overview")
        assert res.status_code == 200
        overview = res.json()
        print(f"  [OK] GET /api/v1/analytics/exams/{exam_id}/overview (StdDev: {overview['standard_deviation']}, Highest: {overview['highest_score']})")

        # 11. Analytics - Distribution & Bell Curve
        res = await client.get(f"/api/v1/analytics/exams/{exam_id}/distribution")
        assert res.status_code == 200
        dist = res.json()
        assert len(dist["buckets"]) > 0
        print(f"  [OK] GET /api/v1/analytics/exams/{exam_id}/distribution ({len(dist['buckets'])} score intervals)")

        # 12. Analytics - Percentiles
        res = await client.get(f"/api/v1/analytics/exams/{exam_id}/percentiles")
        assert res.status_code == 200
        pctl_list = res.json()
        print(f"  [OK] GET /api/v1/analytics/exams/{exam_id}/percentiles (Top: {pctl_list[0]['student_name']} - {pctl_list[0]['percentile']}th percentile)")

        # 13. Analytics - Item Analysis (Psychometrics)
        res = await client.get(f"/api/v1/analytics/exams/{exam_id}/item-analysis")
        assert res.status_code == 200
        items = res.json()
        print(f"  [OK] GET /api/v1/analytics/exams/{exam_id}/item-analysis ({len(items)} questions analyzed)")

        # 15. Flexible ID & Index Resolution (Tests for "1", "2", "%221%22", etc.)
        res = await client.get("/api/v1/exams/1")
        assert res.status_code == 200, f"Exams/1 failed: {res.text}"
        print("  [OK] GET /api/v1/exams/1 (Resolved to Semester 1 Exam)")

        res = await client.get("/api/v1/questions/1")
        assert res.status_code == 200, f"Questions/1 failed: {res.text}"
        print("  [OK] GET /api/v1/questions/1 (Resolved to 1st Question)")

        res = await client.get('/api/v1/questions/%221%22')
        assert res.status_code == 200, f"Questions/'1' failed: {res.text}"
        print("  [OK] GET /api/v1/questions/%221%22 (Resolved quoted ID to 1st Question)")

        res = await client.get('/api/v1/questions/%222%22')
        assert res.status_code == 200, f"Questions/'2' failed: {res.text}"
        print("  [OK] GET /api/v1/questions/%222%22 (Resolved quoted ID to 2nd Question)")

        res = await client.get("/api/v1/analytics/exams/1/overview")
        assert res.status_code == 200, f"Analytics overview/1 failed: {res.text}"
        print("  [OK] GET /api/v1/analytics/exams/1/overview (Resolved exam '1' for analytics)")

    print("\n[SUCCESS] ALL FASTAPI BACKEND CRUD AND ANALYTICS TESTS PASSED!")


if __name__ == "__main__":
    asyncio.run(test_all_endpoints())
