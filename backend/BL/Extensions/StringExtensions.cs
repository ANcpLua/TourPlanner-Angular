namespace BL.Extensions;

public static class StringExtensions
{
    public static bool ContainsIgnoreCase(this string source, string value)
    {
        return source.AsSpan().Contains(value.AsSpan(), StringComparison.OrdinalIgnoreCase);
    }
}
