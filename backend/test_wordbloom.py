"""
WordBloom — test_wordbloom.py
================================
Quick test to verify all 6 agents work correctly.
Run this before starting the server.

Usage: python test_wordbloom.py
"""

import asyncio
from wordbloom_agent.agent import run_session_pipeline


async def run_test():
    print("\n🌱 WordBloom — Running full pipeline test")
    print("="*50)

    # Test 1: Start session for Emma
    print("\n📍 Test 1: Start session")
    start = await run_session_pipeline("start", {"child_name": "emma"})
    print(f"   Session ID: {start['session_id'][:8]}...")
    print(f"   Child: {start['profile']['child_name']}")
    print(f"   First word: {start['first_word']['word']}")
    assert start["success"], "Start failed"
    print("   ✅ PASS")

    session_id = start["session_id"]
    word = start["first_word"]["word"]

    # Test 2: Submit a correct answer
    print(f"\n📍 Test 2: Answer '{word}' correctly")
    answer = await run_session_pipeline("answer", {
        "session_id":           session_id,
        "child_answer":         word,
        "response_time_seconds": 4.2,
        "input_mode":           "voice",
    })
    print(f"   Correct: {answer['evaluation']['is_correct']}")
    print(f"   Action: {answer['adaptation']['action']}")
    print(f"   Message: {answer['encouragement']['message'][:60]}...")
    print(f"   Next word: {answer['next_word']['word'] if answer['next_word'] else 'session over'}")
    assert answer["success"], "Answer failed"
    print("   ✅ PASS")

    # Test 3: Submit a wrong answer
    print(f"\n📍 Test 3: Submit wrong answer")
    wrong = await run_session_pipeline("answer", {
        "session_id":           session_id,
        "child_answer":         "xxxxx",
        "response_time_seconds": 8.0,
        "input_mode":           "voice",
    })
    print(f"   Correct: {wrong['evaluation']['is_correct']}")
    print(f"   Partial score: {wrong['evaluation']['partial_score']}")
    print(f"   Error pattern: {wrong['evaluation']['error_pattern']}")
    print(f"   Message: {wrong['encouragement']['message'][:60]}...")
    assert wrong["success"], "Wrong answer test failed"
    print("   ✅ PASS")

    # Test 4: End session and generate report
    print(f"\n📍 Test 4: End session and generate report")
    end = await run_session_pipeline("end", {"session_id": session_id})
    report = end["report"]
    print(f"   Accuracy: {report['accuracy_percent']}%")
    print(f"   Words attempted: {report['words_attempted']}")
    print(f"   Approval required: {report['approval_required']}")
    print(f"   Report: {report['report_text'][:80]}...")
    assert end["success"], "End session failed"
    assert report["approval_required"], "Approval gate missing"
    print("   ✅ PASS")

    print("\n" + "="*50)
    print("✅ All tests passed! WordBloom is ready.")
    print("   Run: python main.py")
    print("   Visit: http://localhost:8000")
    print("="*50)


if __name__ == "__main__":
    asyncio.run(run_test())
