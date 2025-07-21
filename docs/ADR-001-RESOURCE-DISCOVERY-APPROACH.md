# ADR-001: Resource Discovery Approach for Q Service Account Cleanup

**Status**: Accepted  
**Date**: 2025-07-11  
**Context**: Q service account cleanup requires identifying AWS resources (CloudFormation stacks, S3 buckets, Lambda functions) created by specific Q identities for safe deletion.

## Decision

We will use **heuristic naming pattern matching** to identify Q-created resources rather than AWS resource tagging. The resource discovery module filters resources by checking if names contain the Q service account name, "q-assistant", or "no-wing" patterns. This approach provides 70-80% accuracy with minimal implementation complexity and fast execution across multiple AWS regions.

## Rationale

While AWS tags offer higher accuracy (99%+) and better compliance, the implementation cost is 3-4x higher due to additional API calls, complex tag management, and migration overhead for existing resources. For no-wing's current use case targeting individual developers and small teams, the heuristic approach delivers sufficient accuracy with faster time-to-market. The naming pattern strategy can be enhanced incrementally, and tag-based discovery remains a viable future enhancement if enterprise adoption demands higher precision and compliance capabilities.
