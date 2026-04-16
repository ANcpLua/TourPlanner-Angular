using BL.Extensions;

namespace Tests.BL;

[TestFixture]
public class StringExtensionsTests
{
    [TestCase("Hello World", "hello", true)]
    [TestCase("Hello World", "WORLD", true)]
    [TestCase("Hello World", "xyz", false)]
    [TestCase("", "", true)]
    public void ContainsIgnoreCase_ReturnsExpected(string source, string value, bool expected) =>
        Assert.That(source.ContainsIgnoreCase(value), Is.EqualTo(expected));
}
