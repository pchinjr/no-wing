# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the no-wing project. ADRs document important architectural decisions, their context, and consequences.

## What are ADRs?

Architecture Decision Records (ADRs) are short text documents that capture important architectural decisions made during a project, along with their context and consequences. They help teams:

- Remember why decisions were made
- Onboard new team members
- Avoid revisiting settled decisions
- Learn from past decisions

## ADR Format

We use a modified version of the [MADR template](https://adr.github.io/madr/) that includes:

- **Status**: Current state of the decision
- **Context**: Forces and constraints that led to the decision
- **Decision**: What we decided to do
- **Rationale**: Why this decision makes sense
- **Alternatives Considered**: Other options we evaluated
- **Consequences**: Expected positive and negative outcomes
- **Implementation Plan**: How we'll execute the decision
- **Success Metrics**: How we'll measure success

## Current ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](./0001-treat-ai-as-first-class-developer.md) | Treat AI as First-Class Developer | Accepted | 2025-06-23 |

## Creating New ADRs

1. Copy the [template.md](./template.md) file
2. Name it with the next sequential number: `XXXX-brief-title.md`
3. Fill in all sections
4. Update this README with the new ADR
5. Get review from team members (including Q!)

## ADR Lifecycle

**Proposed** → **Accepted** → **Implemented**

ADRs can also be:
- **Rejected**: Decision was considered but not adopted
- **Deprecated**: Decision is no longer relevant
- **Superseded**: Replaced by a newer ADR

## Review Process

- All ADRs should be reviewed by both human and AI team members
- ADRs are living documents and can be updated as needed
- Major changes should result in a new ADR that supersedes the old one
- ADRs should be reviewed quarterly for relevance

## Guidelines

### When to Write an ADR

Write an ADR when you make a decision that:
- Has significant impact on the system architecture
- Is difficult or expensive to reverse
- Affects multiple team members or systems
- Involves trade-offs between competing concerns
- Sets precedent for future decisions

### What Makes a Good ADR

- **Clear Context**: Explain the forces and constraints
- **Specific Decision**: State exactly what was decided
- **Honest Assessment**: Include both benefits and drawbacks
- **Actionable**: Include concrete implementation steps
- **Measurable**: Define success criteria

### ADR Best Practices

- Keep ADRs short and focused (1-2 pages max)
- Use simple, clear language
- Include diagrams when helpful
- Link to related ADRs and external resources
- Update status as decisions evolve
- Archive outdated ADRs rather than deleting them

## no-wing Specific Considerations

Since no-wing treats AI (Q) as a first-class developer, our ADRs should:

- Consider both human and AI perspectives
- Include Q in the decision-making process
- Document AI-specific implications
- Address human-AI collaboration patterns
- Consider progressive AI capabilities

## Tools and Resources

- [ADR Tools](https://github.com/npryce/adr-tools) - Command line tools for managing ADRs
- [MADR Template](https://adr.github.io/madr/) - Markdown ADR template
- [ADR GitHub Organization](https://adr.github.io/) - Community resources

---

**Maintained by**: Paul Chin Jr & Q (AI Development Partner)  
**Last updated**: 2025-06-23
