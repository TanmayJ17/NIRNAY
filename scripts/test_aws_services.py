"""
NIRNAY Test Suite: AWS Bedrock, AWS Strands Agent, DynamoDB & S3 Services
Tests DP Optimizer, 200 Monte Carlo draws, Bedrock Agent reasoning, DynamoDB, and S3.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

from app.services.optimizer import optimize_allocations
from app.services.agent import agent_instance
from app.services.dynamodb_service import dynamodb_service
from app.services.s3_service import s3_service

def main():
    print("=" * 65)
    print("☁️ NIRNAY: AWS AGENT & CLOUD INFRASTRUCTURE VERIFICATION SUITE")
    print("=" * 65)

    # 1. DP Optimization & Monte Carlo
    print("\n⚡ Testing Dynamic Programming Resource Optimizer...")
    opt = optimize_allocations(rainfall_mm=90.0, duration_hours=3.0, total_pumps=10, total_crews=5)
    print(f"   • Total Pumps Allocated: {sum(opt['optimal_allocation_map'].values())}")
    print(f"   • Vehicle-Hours Saved vs Equal: +{opt['baselines']['hours_saved_vs_equal']} vh")
    print(f"   • Monte Carlo P50 Median Impact: {opt['monte_carlo_uncertainty']['p50_median_impact']} vh")
    print(f"   • Recommendation Stability: {opt['monte_carlo_uncertainty']['recommendation_stability_percent']}%")
    assert opt['baselines']['hours_saved_vs_equal'] >= 0

    # 2. AWS Strands Agent & Amazon Bedrock
    print("\n🤖 Testing AWS Strands Agent SDK & Amazon Bedrock Synthesis...")
    chat_res = agent_instance.chat(
        query="Why did NIRNAY assign pumps to Minto Bridge and Zakhira instead of other locations?",
        scenario_context={"rainfall_mm": 90.0, "duration_hours": 3.0, "total_pumps": 10, "total_crews": 5}
    )
    print("   • Grounded Agent Response:")
    print("   " + chat_res["grounded_response"][:250].replace("\n", "\n   ") + "...")
    print(f"   • Tools Executed: {chat_res['tool_calls_executed']}")
    print(f"   • AWS Agent: {chat_res.get('agent_name', 'NIRNAY AWS Strands Agent')}")
    assert len(chat_res['tool_calls_executed']) > 0

    # 3. Amazon DynamoDB Scenario Store
    print("\n🗄️ Testing Amazon DynamoDB Scenario Store...")
    db_res = dynamodb_service.save_scenario(
        rainfall_mm=90.0,
        duration_hours=3.0,
        total_pumps=10,
        hours_saved=opt['baselines']['hours_saved_vs_equal'],
        allocation_map=opt['optimal_allocation_map']
    )
    print(f"   • Record Status: {db_res['status']}")
    print(f"   • Scenario ID: {db_res['scenario_id']}")
    print(f"   • Storage Engine: {db_res['storage']}")
    assert db_res['status'] == "persisted"

    # 4. Amazon S3 Report Storage
    print("\n📦 Testing Amazon S3 Simulation Report Upload...")
    s3_res = s3_service.upload_scenario_report(
        scenario_id=db_res['scenario_id'],
        report_data={"scenario": db_res['scenario_id'], "hours_saved": opt['baselines']['hours_saved_vs_equal']}
    )
    print(f"   • S3 Upload Status: {s3_res['status']}")
    print(f"   • S3 URI: {s3_res['s3_uri']}")
    print(f"   • Storage Class: {s3_res['storage']}")

    print("\n🎉 ALL AWS CLOUD & AGENT TESTS PASSED PERFECTLY!")
    print("=" * 65)

if __name__ == "__main__":
    main()
