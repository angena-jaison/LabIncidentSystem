namespace LabAPI.Common;

// A consistent "envelope" for error responses so the frontend always knows
// what shape to expect, instead of guessing per-endpoint.
public class ApiErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public List<string>? Details { get; set; }
}
