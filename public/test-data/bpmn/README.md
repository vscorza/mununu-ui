# BPMN Test Data

This directory contains test IR (Intermediate Representation) JSON files for testing the BPMN Diagram component.

## Test Files

### Element Type Tests
- `test_events.json` - Start, End, Intermediate events
- `test_tasks_basic.json` - Generic Task
- `test_tasks_user.json` - UserTask
- `test_tasks_service.json` - ServiceTask
- `test_tasks_script.json` - ScriptTask
- `test_tasks_business_rule.json` - BusinessRuleTask
- `test_tasks_receive.json` - ReceiveTask
- `test_tasks_call_activity.json` - CallActivity
- `test_gateway_exclusive.json` - ExclusiveGateway (XOR)
- `test_gateway_parallel.json` - ParallelGateway (AND)
- `test_gateway_inclusive.json` - InclusiveGateway (OR)
- `test_gateway_event_based.json` - EventBasedGateway
- `test_boundary_events.json` - BoundaryEvent attached to tasks
- `test_compensation.json` - Compensation tasks

### Business Scenario Tests
- `test_order_processing.json` - E-commerce order processing
- `test_approval_workflow.json` - Multi-level approval
- `test_onboarding.json` - Employee onboarding
- `test_purchase_request.json` - Purchase request with nested decisions
- `test_invoice_processing.json` - Invoice processing with parallel tasks

### Complexity Tests
- `test_nested_gateways.json` - Gateway within gateway branches
- `test_parallel_split_join.json` - Complex parallel structures
- `test_cycles.json` - Process loops and cycles
- `test_multiple_lanes.json` - Many swimlanes (5+)
- `test_long_sequences.json` - Long sequential processes
- `test_mixed_gateways.json` - Mixed gateway types in one process

## IR File Format

Each test file should be valid JSON following the IR model structure:

```json
{
  "name": "Process Name",
  "states": [
    {
      "name": "state1",
      "kind": "StartEvent",
      "initial": true,
      "role": "Role1",
      "event_kinds": [],
      "is_for_compensation": false
    }
  ],
  "transitions": [
    {
      "from": "state1",
      "to": "state2",
      "label": "Transition Label",
      "guard": "condition > 0",
      "effects": [
        {
          "variable": "var1",
          "value": 10
        }
      ]
    }
  ],
  "variables": [],
  "properties": [],
  "message_flows": []
}
```

## Usage

1. Access the test page at `/dev/bpmn-test`
2. Upload a JSON file or paste IR JSON
3. Use quick load buttons to load test files (if available in `/public/test-data/bpmn/`)
4. Adjust diagram controls (direction, labels, guards)
5. Interact with the diagram (click nodes/edges)

## Creating Test Files

Test files can be created by:
1. Exporting IR from the workflow (download IR button)
2. Manually creating JSON following the IR format
3. Copying from `docs/bpm_visualizer/test-data/bpmn/` in the henos-rust repository

