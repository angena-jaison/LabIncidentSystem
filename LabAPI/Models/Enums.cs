using System.Text.Json.Serialization;

namespace LabAPI.Models;

// [JsonConverter(typeof(JsonStringEnumConverter))] on the enum itself is the
// most reliable way to make System.Text.Json read/write it as text
// ("Investigating") instead of a number (1). It's attached directly to the
// type, so it applies everywhere this enum is used, no matter how the
// request is bound - this fixes the "could not be converted to
// IncidentStatus" 400 error.

// Every incident moves through these states, in this order (roughly).
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum IncidentStatus
{
    Open = 0,
    Investigating = 1,
    Resolved = 2,
    Closed = 3
}

// How serious the incident is. Higher number = more severe.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum IncidentSeverity
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

// Simple role list. Kept small on purpose (see project scope guidance).
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserRole
{
    LabUser = 0,
    Reviewer = 1,
    Administrator = 2
}

// A document only feeds the AI assistant once an Administrator has approved
// it. This is the "governance" control: the AI is grounded in a curated,
// approved knowledge base, not in anything anyone happens to upload.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DocumentStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}