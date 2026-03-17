using BL.Interfaces;

namespace Tests.Fixtures;

public static class TestMocks
{
    public static Mock<IUserContext> UserContext()
    {
        var mock = new Mock<IUserContext>();
        mock.Setup(static u => u.UserId).Returns(TestConstants.TestUserId);
        return mock;
    }

    public static Mock<ILogger> Logger() => new();
}
